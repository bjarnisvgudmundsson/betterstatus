import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(DATABASE_URL);

async function migrateV2() {
  console.log("Starting migration to deliverables model...\n");

  try {
    // Step 1: Create deliverables table
    console.log("Step 1: Creating deliverables table...");
    await sql`
      CREATE TABLE IF NOT EXISTS deliverables (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        state TEXT NOT NULL,
        blocker TEXT,
        next_steps TEXT,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        toggl_project_id TEXT,
        toggl_hours_7d NUMERIC(10,2) DEFAULT 0 NOT NULL,
        position INTEGER DEFAULT 0 NOT NULL
      )
    `;
    console.log("✓ Deliverables table created\n");

    // Step 2: Migrate items to deliverables
    console.log("Step 2: Migrating items to deliverables...");

    // First, migrate sub_items to top-level items
    const subItems = await sql`
      SELECT si.*, i.workstream_id, w.client_id
      FROM sub_items si
      JOIN items i ON si.item_id = i.id
      JOIN workstreams w ON i.workstream_id = w.id
    `;

    if (subItems.length > 0) {
      console.log(`  Found ${subItems.length} sub-items to promote...`);
      for (const subItem of subItems) {
        await sql`
          INSERT INTO items (
            workstream_id, title, latest_status, state,
            updated_at, position
          ) VALUES (
            ${subItem.workstream_id},
            ${subItem.title},
            ${subItem.latest_status},
            ${subItem.state},
            ${subItem.updated_at},
            999
          )
        `;
      }
      console.log(`✓ Promoted ${subItems.length} sub-items to items\n`);
    }

    // Now migrate all items to deliverables
    const items = await sql`
      SELECT i.*, w.client_id
      FROM items i
      JOIN workstreams w ON i.workstream_id = w.id
      ORDER BY w.client_id, i.position
    `;

    console.log(`  Migrating ${items.length} items to deliverables...`);

    for (const item of items) {
      await sql`
        INSERT INTO deliverables (
          client_id, title, description, state, blocker,
          next_steps, updated_at, toggl_project_id,
          toggl_hours_7d, position
        ) VALUES (
          ${item.client_id},
          ${item.title},
          ${item.latest_status || 'No description'},
          ${item.state},
          ${item.blocker},
          ${item.next_steps},
          ${item.updated_at},
          ${item.toggl_project_id},
          ${item.toggl_hours_7d || 0},
          ${item.position}
        )
        RETURNING id
      `;
    }
    console.log(`✓ Migrated ${items.length} items to deliverables\n`);

    // Step 3: Update foreign keys in updates table
    console.log("Step 3: Updating foreign keys in updates table...");
    await sql`
      ALTER TABLE updates RENAME COLUMN item_id TO deliverable_id_old
    `;
    await sql`
      ALTER TABLE updates ADD COLUMN deliverable_id INTEGER
    `;

    // Map old item IDs to new deliverable IDs
    const itemsWithIds = await sql`
      SELECT i.id as old_id, w.client_id, i.title, i.position
      FROM items i
      JOIN workstreams w ON i.workstream_id = w.id
    `;

    for (const oldItem of itemsWithIds) {
      const [newDeliv] = await sql`
        SELECT id FROM deliverables
        WHERE client_id = ${oldItem.client_id}
        AND title = ${oldItem.title}
        AND position = ${oldItem.position}
        LIMIT 1
      `;

      if (newDeliv) {
        await sql`
          UPDATE updates
          SET deliverable_id = ${newDeliv.id}
          WHERE deliverable_id_old = ${oldItem.old_id}
        `;
      }
    }

    await sql`ALTER TABLE updates DROP COLUMN deliverable_id_old`;
    await sql`
      ALTER TABLE updates
      ALTER COLUMN deliverable_id SET NOT NULL
    `;
    await sql`
      ALTER TABLE updates
      ADD CONSTRAINT updates_deliverable_id_fkey
      FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE
    `;
    console.log("✓ Updated updates table\n");

    // Step 4: Update foreign keys in comments table
    console.log("Step 4: Updating foreign keys in comments table...");
    await sql`
      ALTER TABLE comments RENAME COLUMN item_id TO deliverable_id_old
    `;
    await sql`
      ALTER TABLE comments ADD COLUMN deliverable_id INTEGER
    `;

    for (const oldItem of itemsWithIds) {
      const [newDeliv] = await sql`
        SELECT id FROM deliverables
        WHERE client_id = ${oldItem.client_id}
        AND title = ${oldItem.title}
        AND position = ${oldItem.position}
        LIMIT 1
      `;

      if (newDeliv) {
        await sql`
          UPDATE comments
          SET deliverable_id = ${newDeliv.id}
          WHERE deliverable_id_old = ${oldItem.old_id}
        `;
      }
    }

    await sql`ALTER TABLE comments DROP COLUMN deliverable_id_old`;
    await sql`
      ALTER TABLE comments
      ALTER COLUMN deliverable_id SET NOT NULL
    `;
    await sql`
      ALTER TABLE comments
      ADD CONSTRAINT comments_deliverable_id_fkey
      FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE
    `;
    console.log("✓ Updated comments table\n");

    // Step 5: Drop old tables
    console.log("Step 5: Dropping old tables...");
    await sql`DROP TABLE IF EXISTS sub_items CASCADE`;
    console.log("✓ Dropped sub_items");
    await sql`DROP TABLE IF EXISTS items CASCADE`;
    console.log("✓ Dropped items");
    await sql`DROP TABLE IF EXISTS workstreams CASCADE`;
    console.log("✓ Dropped workstreams\n");

    // Step 6: Clean up clients table
    console.log("Step 6: Cleaning up clients table...");
    await sql`ALTER TABLE clients DROP COLUMN IF EXISTS overall_state`;
    await sql`ALTER TABLE clients DROP COLUMN IF EXISTS last_updated`;
    await sql`ALTER TABLE clients DROP COLUMN IF EXISTS summary`;
    console.log("✓ Removed unused columns from clients\n");

    console.log("✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateV2().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
