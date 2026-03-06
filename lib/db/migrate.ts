import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { INITIAL_CLIENTS } from "../data";

// Load .env.local
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Starting migration...");

  // Create tables
  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      page_title TEXT NOT NULL,
      overall_state TEXT NOT NULL,
      last_updated TIMESTAMPTZ NOT NULL,
      summary TEXT NOT NULL,
      purchaser_mode TEXT NOT NULL,
      end_client_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS workstreams (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      state TEXT NOT NULL,
      position INTEGER DEFAULT 0 NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      workstream_id INTEGER NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      latest_status TEXT NOT NULL,
      state TEXT NOT NULL,
      blocker TEXT,
      updated_at TIMESTAMPTZ NOT NULL,
      seen_at TIMESTAMPTZ,
      next_steps TEXT,
      toggl_project_id TEXT,
      toggl_hours_7d NUMERIC(10, 2) DEFAULT 0 NOT NULL,
      position INTEGER DEFAULT 0 NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sub_items (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      latest_status TEXT NOT NULL,
      state TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      position INTEGER DEFAULT 0 NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS updates (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      week_label TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      author_role TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pings (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'unread' NOT NULL,
      response TEXT
    )
  `;

  console.log("Tables created successfully!");

  // Check if we need to seed data
  const existingClients = await sql`SELECT COUNT(*) FROM clients`;
  const clientCount = parseInt(existingClients[0].count);

  if (clientCount > 0) {
    console.log(`Database already has ${clientCount} clients. Skipping seed.`);
    return;
  }

  console.log("Seeding data...");

  // Seed data from INITIAL_CLIENTS
  for (const client of INITIAL_CLIENTS) {
    // Insert client
    const [clientRow] = await sql`
      INSERT INTO clients (slug, name, sector, page_title, overall_state, last_updated, summary, purchaser_mode, end_client_name)
      VALUES (
        ${client.slug},
        ${client.name},
        ${client.sector},
        ${client.pageTitle},
        ${client.overallState},
        ${client.lastUpdated},
        ${client.summary},
        ${client.purchaserMode},
        ${client.endClientName || null}
      )
      RETURNING id
    `;
    const clientId = clientRow.id;
    console.log(`  Inserted client: ${client.name} (ID: ${clientId})`);

    // Insert pings
    for (const ping of client.pings) {
      await sql`
        INSERT INTO pings (client_id, author, role, text, timestamp, status, response)
        VALUES (
          ${clientId},
          ${ping.author},
          ${ping.role},
          ${ping.text},
          ${ping.timestamp},
          ${ping.status},
          ${ping.response || null}
        )
      `;
    }
    if (client.pings.length > 0) {
      console.log(`    Inserted ${client.pings.length} pings`);
    }

    // Insert workstreams
    for (let wsIndex = 0; wsIndex < client.workstreams.length; wsIndex++) {
      const ws = client.workstreams[wsIndex];
      const [wsRow] = await sql`
        INSERT INTO workstreams (client_id, title, state, position)
        VALUES (${clientId}, ${ws.title}, ${ws.state}, ${wsIndex})
        RETURNING id
      `;
      const wsId = wsRow.id;
      console.log(`    Inserted workstream: ${ws.title} (ID: ${wsId})`);

      // Insert items
      for (let itemIndex = 0; itemIndex < ws.items.length; itemIndex++) {
        const item = ws.items[itemIndex];
        const [itemRow] = await sql`
          INSERT INTO items (
            workstream_id, title, latest_status, state, blocker,
            updated_at, seen_at, toggl_project_id, toggl_hours_7d, position
          )
          VALUES (
            ${wsId},
            ${item.title},
            ${item.latestStatus},
            ${item.state},
            ${item.blocker || null},
            ${item.updatedAt},
            ${item.seenAt || null},
            ${item.toggl?.projectId || null},
            ${item.toggl?.hours7d || 0},
            ${itemIndex}
          )
          RETURNING id
        `;
        const itemId = itemRow.id;
        console.log(`      Inserted item: ${item.title} (ID: ${itemId})`);

        // Insert sub-items (children)
        for (let subIndex = 0; subIndex < item.children.length; subIndex++) {
          const subItem = item.children[subIndex];
          await sql`
            INSERT INTO sub_items (item_id, title, latest_status, state, updated_at, position)
            VALUES (
              ${itemId},
              ${subItem.title},
              ${subItem.latestStatus},
              ${subItem.state},
              ${subItem.updatedAt},
              ${subIndex}
            )
          `;
        }
        if (item.children.length > 0) {
          console.log(`        Inserted ${item.children.length} sub-items`);
        }

        // Insert updates
        for (const update of item.updates) {
          await sql`
            INSERT INTO updates (item_id, text, week_label, timestamp)
            VALUES (${itemId}, ${update.text}, ${update.weekLabel}, ${update.timestamp})
          `;
        }
        if (item.updates.length > 0) {
          console.log(`        Inserted ${item.updates.length} updates`);
        }

        // Insert comments and replies
        for (const comment of item.comments) {
          const [commentRow] = await sql`
            INSERT INTO comments (item_id, parent_id, author, author_role, text, timestamp)
            VALUES (
              ${itemId},
              NULL,
              ${comment.author},
              ${comment.authorRole},
              ${comment.text},
              ${comment.timestamp}
            )
            RETURNING id
          `;
          const commentId = commentRow.id;

          // Insert replies
          for (const reply of comment.replies) {
            await sql`
              INSERT INTO comments (item_id, parent_id, author, author_role, text, timestamp)
              VALUES (
                ${itemId},
                ${commentId},
                ${reply.author},
                ${reply.authorRole},
                ${reply.text},
                ${reply.timestamp}
              )
            `;
          }
        }
        if (item.comments.length > 0) {
          const totalReplies = item.comments.reduce((sum, c) => sum + c.replies.length, 0);
          console.log(`        Inserted ${item.comments.length} comments and ${totalReplies} replies`);
        }
      }
    }
  }

  console.log("Migration completed successfully!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
