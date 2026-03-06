import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import type { Client } from "@/lib/types";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get client
    const [client] = await sql`
      SELECT
        id, slug, name, sector,
        page_title as "pageTitle",
        overall_state as "overallState",
        last_updated as "lastUpdated",
        summary,
        purchaser_mode as "purchaserMode",
        end_client_name as "endClientName"
      FROM clients
      WHERE slug = ${slug}
    `;

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get pings
    const pings = await sql`
      SELECT id, author, role, text, timestamp, status, response
      FROM pings
      WHERE client_id = ${client.id}
      ORDER BY timestamp DESC
    `;

    // Get workstreams
    const workstreams = await sql`
      SELECT id, title, state, position
      FROM workstreams
      WHERE client_id = ${client.id}
      ORDER BY position
    `;

    // Get all items for all workstreams
    const items = await sql`
      SELECT
        i.id, i.workstream_id as "workstreamId", i.title,
        i.latest_status as "latestStatus", i.state, i.blocker,
        i.updated_at as "updatedAt", i.seen_at as "seenAt",
        i.next_steps as "nextSteps",
        i.toggl_project_id as "togglProjectId",
        i.toggl_hours_7d as "togglHours7d",
        i.position
      FROM items i
      WHERE i.workstream_id IN (
        SELECT id FROM workstreams WHERE client_id = ${client.id}
      )
      ORDER BY i.position
    `;

    // Get all sub-items
    const subItems = await sql`
      SELECT
        s.id, s.item_id as "itemId", s.title,
        s.latest_status as "latestStatus", s.state,
        s.updated_at as "updatedAt", s.position
      FROM sub_items s
      WHERE s.item_id IN (
        SELECT i.id FROM items i
        JOIN workstreams w ON i.workstream_id = w.id
        WHERE w.client_id = ${client.id}
      )
      ORDER BY s.position
    `;

    // Get all updates
    const updates = await sql`
      SELECT
        u.id, u.item_id as "itemId", u.text,
        u.week_label as "weekLabel", u.timestamp
      FROM updates u
      WHERE u.item_id IN (
        SELECT i.id FROM items i
        JOIN workstreams w ON i.workstream_id = w.id
        WHERE w.client_id = ${client.id}
      )
      ORDER BY u.timestamp DESC
    `;

    // Get all comments (including replies)
    const comments = await sql`
      SELECT
        c.id, c.item_id as "itemId", c.parent_id as "parentId",
        c.author, c.author_role as "authorRole", c.text, c.timestamp
      FROM comments c
      WHERE c.item_id IN (
        SELECT i.id FROM items i
        JOIN workstreams w ON i.workstream_id = w.id
        WHERE w.client_id = ${client.id}
      )
      ORDER BY c.timestamp ASC
    `;

    // Build nested structure
    const itemsWithData = items.map((item: any) => {
      const itemSubItems = subItems
        .filter((s: any) => s.itemId === item.id)
        .map((s: any) => ({
          id: String(s.id),
          title: s.title,
          latestStatus: s.latestStatus,
          state: s.state,
          updatedAt: s.updatedAt,
          updates: [],
          comments: [],
          children: [],
        }));

      const itemUpdates = updates
        .filter((u: any) => u.itemId === item.id)
        .map((u: any) => ({
          id: String(u.id),
          text: u.text,
          weekLabel: u.weekLabel,
          timestamp: u.timestamp,
        }));

      // Build comment tree (top-level comments with nested replies)
      const topLevelComments = comments
        .filter((c: any) => c.itemId === item.id && !c.parentId)
        .map((c: any) => {
          const replies = comments
            .filter((r: any) => r.parentId === c.id)
            .map((r: any) => ({
              id: String(r.id),
              author: r.author,
              authorRole: r.authorRole,
              text: r.text,
              timestamp: r.timestamp,
            }));

          return {
            id: String(c.id),
            author: c.author,
            authorRole: c.authorRole,
            text: c.text,
            timestamp: c.timestamp,
            replies,
          };
        });

      return {
        id: String(item.id),
        title: item.title,
        latestStatus: item.latestStatus,
        state: item.state,
        blocker: item.blocker,
        updatedAt: item.updatedAt,
        seenAt: item.seenAt,
        nextSteps: item.nextSteps,
        toggl: item.togglProjectId
          ? {
              projectId: item.togglProjectId,
              taskId: null,
              hours7d: parseFloat(item.togglHours7d),
            }
          : null,
        updates: itemUpdates,
        comments: topLevelComments,
        children: itemSubItems,
      };
    });

    const workstreamsWithItems = workstreams.map((ws: any) => ({
      id: String(ws.id),
      title: ws.title,
      state: ws.state,
      items: itemsWithData.filter((item: any) => {
        const originalItem = items.find((i: any) => String(i.id) === item.id);
        return originalItem && originalItem.workstreamId === ws.id;
      }),
    }));

    const result: Client = {
      id: String(client.id),
      slug: client.slug,
      name: client.name,
      sector: client.sector,
      pageTitle: client.pageTitle,
      overallState: client.overallState,
      lastUpdated: client.lastUpdated,
      summary: client.summary,
      purchaserMode: client.purchaserMode,
      endClientName: client.endClientName,
      pings: pings.map((p: any) => ({
        id: String(p.id),
        author: p.author,
        role: p.role,
        text: p.text,
        timestamp: p.timestamp,
        status: p.status,
        response: p.response,
      })),
      workstreams: workstreamsWithItems,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}
