import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

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

    // Get deliverables
    const deliverables = await sql`
      SELECT
        id, title, description, state, blocker,
        next_steps as "nextSteps",
        updated_at as "updatedAt",
        toggl_project_id as "togglProjectId",
        toggl_hours_7d as "togglHours7d"
      FROM deliverables
      WHERE client_id = ${client.id}
      ORDER BY
        CASE state
          WHEN 'blocked' THEN 1
          WHEN 'at_risk' THEN 2
          WHEN 'on_track' THEN 3
          WHEN 'not_started' THEN 4
          WHEN 'done' THEN 5
        END,
        updated_at DESC
    `;

    // Get all updates
    const updates = await sql`
      SELECT
        u.id, u.deliverable_id as "deliverableId", u.text,
        u.week_label as "weekLabel", u.timestamp
      FROM updates u
      WHERE u.deliverable_id IN (
        SELECT id FROM deliverables WHERE client_id = ${client.id}
      )
      ORDER BY u.timestamp DESC
    `;

    // Get all comments
    const comments = await sql`
      SELECT
        c.id, c.deliverable_id as "deliverableId", c.parent_id as "parentId",
        c.author, c.author_role as "authorRole", c.text, c.timestamp
      FROM comments c
      WHERE c.deliverable_id IN (
        SELECT id FROM deliverables WHERE client_id = ${client.id}
      )
      ORDER BY c.timestamp ASC
    `;

    // Build update map
    const updateMap: any = {};
    for (const update of updates) {
      const delivId = update.deliverableId.toString();
      if (!updateMap[delivId]) updateMap[delivId] = [];
      updateMap[delivId].push({
        id: update.id.toString(),
        text: update.text,
        weekLabel: update.weekLabel,
        timestamp: update.timestamp,
      });
    }

    // Build comment map with replies
    const commentMap: any = {};
    const topLevelComments: any = {};

    for (const comment of comments) {
      const delivId = comment.deliverableId.toString();
      const commentObj = {
        id: comment.id.toString(),
        author: comment.author,
        authorRole: comment.authorRole,
        text: comment.text,
        timestamp: comment.timestamp,
        replies: [] as any[],
      };

      if (comment.parentId) {
        // This is a reply
        const parentKey = comment.parentId.toString();
        if (!commentMap[parentKey]) commentMap[parentKey] = { replies: [] };
        commentMap[parentKey].replies.push({
          id: comment.id.toString(),
          author: comment.author,
          authorRole: comment.authorRole,
          text: comment.text,
          timestamp: comment.timestamp,
        });
      } else {
        // Top-level comment
        commentMap[comment.id.toString()] = commentObj;
        if (!topLevelComments[delivId]) topLevelComments[delivId] = [];
        topLevelComments[delivId].push(commentObj);
      }
    }

    // Assemble deliverables with nested data
    const deliverablesWithData = deliverables.map((d: any) => ({
      id: d.id.toString(),
      clientId: client.id.toString(),
      title: d.title,
      description: d.description,
      state: d.state,
      blocker: d.blocker,
      nextSteps: d.nextSteps,
      updatedAt: d.updatedAt,
      togglProjectId: d.togglProjectId,
      togglHours7d: parseFloat(d.togglHours7d || 0),
      updates: updateMap[d.id.toString()] || [],
      comments: topLevelComments[d.id.toString()] || [],
    }));

    const result = {
      id: client.id.toString(),
      slug: client.slug,
      name: client.name,
      sector: client.sector,
      pageTitle: client.pageTitle,
      purchaserMode: client.purchaserMode,
      endClientName: client.endClientName,
      pings: pings.map((p: any) => ({
        id: p.id.toString(),
        author: p.author,
        role: p.role,
        text: p.text,
        timestamp: p.timestamp,
        status: p.status,
        response: p.response,
      })),
      deliverables: deliverablesWithData,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const result = await sql`
      UPDATE clients
      SET
        ${body.name !== undefined ? sql`name = ${body.name}` : sql``}
        ${body.pageTitle !== undefined ? sql`, page_title = ${body.pageTitle}` : sql``}
        ${body.sector !== undefined ? sql`, sector = ${body.sector}` : sql``}
      WHERE slug = ${slug}
      RETURNING id, slug, name, sector,
        page_title as "pageTitle",
        purchaser_mode as "purchaserMode",
        end_client_name as "endClientName"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}
