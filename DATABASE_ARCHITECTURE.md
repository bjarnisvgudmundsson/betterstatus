# Database Architecture & Current State

## PROBLEM: Demo Data Still Showing

**The demo/mock data you're seeing is REAL data that was seeded into the production Neon Postgres database during migration.**

The migration script (`lib/db/migrate.ts`) was designed to:
1. Create database tables if they don't exist
2. Check if database is empty
3. If empty, seed it with all data from `lib/data.ts` (the INITIAL_CLIENTS constant)

## What Was Seeded (All Demo Data)

### 3 Clients with FULL mock datasets:

1. **Landspítali — LSH** (slug: lsh)
   - 3 workstreams
   - 6 items with full histories
   - Mock updates, comments, pings
   - Mock Toggl data

2. **Tracing** (slug: tracing)
   - Full mock workstreams and items

3. **Skylink** (slug: skylink)
   - Full mock workstreams and items

**ALL OF THIS DEMO DATA IS NOW IN YOUR PRODUCTION DATABASE.**

## Database Schema (7 Tables)

```
clients
├── id (serial primary key)
├── slug (text unique)
├── name (text)
├── sector (text)
├── page_title (text)
├── overall_state (text)
├── last_updated (timestamp)
├── summary (text)
├── purchaser_mode (text)
└── end_client_name (text)

workstreams
├── id (serial primary key)
├── client_id (integer FK → clients.id)
├── title (text)
├── state (text)
└── position (integer)

items
├── id (serial primary key)
├── workstream_id (integer FK → workstreams.id)
├── title (text)
├── latest_status (text)
├── state (text)
├── blocker (text nullable)
├── updated_at (timestamp)
├── seen_at (timestamp nullable)
├── next_steps (text nullable)
├── toggl_project_id (text nullable)
├── toggl_hours_7d (numeric)
└── position (integer)

sub_items
├── id (serial primary key)
├── item_id (integer FK → items.id)
├── title (text)
├── latest_status (text)
├── state (text)
├── updated_at (timestamp)
└── position (integer)

updates
├── id (serial primary key)
├── item_id (integer FK → items.id)
├── text (text)
├── week_label (text)
└── timestamp (timestamp)

comments
├── id (serial primary key)
├── item_id (integer FK → items.id)
├── parent_id (integer nullable FK → comments.id)
├── author (text)
├── author_role (text)
├── text (text)
└── timestamp (timestamp)

pings
├── id (serial primary key)
├── client_id (integer FK → clients.id)
├── author (text)
├── role (text)
├── text (text)
├── timestamp (timestamp)
├── status (text)
└── response (text nullable)
```

## API Routes Created

### Read Operations
- `GET /api/clients` - List all clients with unread ping counts
- `GET /api/clients/[slug]` - Full client with nested data

### Write Operations
- `PATCH /api/clients/[slug]/items/[id]` - Update item (state, title, latestStatus, blocker, nextSteps)
- `POST /api/clients/[slug]/items/[id]/updates` - Create update
- `POST /api/clients/[slug]/items/[id]/comments` - Create comment/reply
- `POST /api/clients/[slug]/pings` - Create ping
- `PATCH /api/clients/[slug]/pings/[id]` - Update ping status
- `POST /api/clients/[slug]/workstreams` - Create workstream
- `POST /api/clients/[slug]/workstreams/[wsId]/items` - Create item

## Store Integration (lib/store.ts)

**Changed from localStorage to API-based:**

Before:
```typescript
create<Store>()(persist(
  (set, get) => ({ ... }),
  { name: "workstream-status" }
))
```

After:
```typescript
create<Store>()((set, get) => ({
  clients: [],
  loading: false,

  loadClients: async () => {
    // Fetches from /api/clients
  },

  loadClient: async (slug: string) => {
    // Fetches from /api/clients/[slug]
  },

  // All mutations use optimistic updates + API calls
  updateItemTitle: (slug, itemId, title) => {
    // 1. Optimistic local update
    set(s => ({ clients: mapItem(...) }))

    // 2. API call
    fetch(`/api/clients/${slug}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    })
  }
}))
```

## How Demo Data Got There

The migration script `lib/db/migrate.ts` runs:

```typescript
const [existingClients] = await sql`SELECT COUNT(*) as count FROM clients`;

if (parseInt(existingClients.count) === 0) {
  console.log("Database is empty. Seeding with initial data...");

  // Loops through ALL 3 clients from INITIAL_CLIENTS
  for (const client of INITIAL_CLIENTS) {
    // Inserts client
    // Inserts all workstreams
    // Inserts all items
    // Inserts all sub-items
    // Inserts all updates
    // Inserts all comments with replies
    // Inserts all pings
  }
}
```

## Test Data Added During Debugging

Additionally, during testing I created:
- Workstream ID 8: "Test Workstream"
- Item ID 17: "Test Item" in workstream 8

## SOLUTION OPTIONS

### Option 1: Clear All Data and Start Fresh
```bash
# Create a clean migration script
npx tsx lib/db/clean-migrate.ts
```

### Option 2: Keep Schema, Delete All Data
```sql
DELETE FROM comments;
DELETE FROM updates;
DELETE FROM sub_items;
DELETE FROM items;
DELETE FROM workstreams;
DELETE FROM pings;
DELETE FROM clients;
```

### Option 3: Delete Only Demo Clients, Keep Schema
```sql
DELETE FROM clients WHERE slug IN ('lsh', 'tracing', 'skylink');
-- Cascades to all related data
```

## Files Containing Demo Data

- `lib/data.ts` - INITIAL_CLIENTS constant (source of all demo data)
- `lib/db/migrate.ts` - Migration script that seeds from INITIAL_CLIENTS

## What You Need to Decide

1. **Do you want to keep the demo data or delete it?**
2. **Do you want the ability to re-seed demo data for testing?**
3. **Should future migrations skip seeding entirely?**
