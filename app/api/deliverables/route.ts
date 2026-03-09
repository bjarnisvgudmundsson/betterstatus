import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const deliverables = await sql`
      SELECT
        d.id,
        d.client_id as "clientId",
        c.slug as "clientSlug",
        c.name as "clientName",
        d.title,
        d.description,
        d.state,
        d.blocker,
        d.next_steps as "nextSteps",
        d.updated_at as "updatedAt",
        d.toggl_project_id as "togglProjectId",
        d.toggl_hours_7d as "togglHours7d"
      FROM deliverables d
      JOIN clients c ON d.client_id = c.id
      ORDER BY
        CASE d.state
          WHEN 'blocked' THEN 1
          WHEN 'at_risk' THEN 2
          WHEN 'on_track' THEN 3
          WHEN 'not_started' THEN 4
          WHEN 'done' THEN 5
        END,
        d.updated_at DESC
    `;

    // Get latest comment for each deliverable
    const comments = await sql`
      SELECT DISTINCT ON (c.deliverable_id)
        c.deliverable_id as "deliverableId",
        c.author,
        c.text,
        c.timestamp
      FROM comments c
      WHERE c.parent_id IS NULL
      ORDER BY c.deliverable_id, c.timestamp DESC
    `;

    const commentMap = comments.reduce((acc: any, c: any) => {
      acc[c.deliverableId] = {
        author: c.author,
        text: c.text,
        timestamp: c.timestamp,
      };
      return acc;
    }, {});

    const result = deliverables.map((d: any) => ({
      id: d.id.toString(),
      clientId: d.clientId.toString(),
      clientSlug: d.clientSlug,
      clientName: d.clientName,
      title: d.title,
      description: d.description,
      state: d.state,
      blocker: d.blocker,
      nextSteps: d.nextSteps,
      updatedAt: d.updatedAt,
      togglProjectId: d.togglProjectId,
      togglHours7d: parseFloat(d.togglHours7d || 0),
      lastComment: commentMap[d.id] || null,
      updates: [],
      comments: [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching deliverables:", error);
    return NextResponse.json({ error: "Failed to fetch deliverables" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [deliverable] = await sql`
      INSERT INTO deliverables (
        client_id, title, description, state,
        next_steps, updated_at, toggl_project_id,
        toggl_hours_7d, position
      ) VALUES (
        ${parseInt(body.clientId)},
        ${body.title},
        ${body.description},
        ${body.state},
        ${body.nextSteps || null},
        ${new Date().toISOString()},
        ${body.togglProjectId || null},
        ${body.togglHours7d || 0},
        ${body.position || 0}
      )
      RETURNING
        id,
        client_id as "clientId",
        title,
        description,
        state,
        blocker,
        next_steps as "nextSteps",
        updated_at as "updatedAt",
        toggl_project_id as "togglProjectId",
        toggl_hours_7d as "togglHours7d"
    `;

    return NextResponse.json({
      id: deliverable.id.toString(),
      clientId: deliverable.clientId.toString(),
      title: deliverable.title,
      description: deliverable.description,
      state: deliverable.state,
      blocker: deliverable.blocker,
      nextSteps: deliverable.nextSteps,
      updatedAt: deliverable.updatedAt,
      togglProjectId: deliverable.togglProjectId,
      togglHours7d: parseFloat(deliverable.togglHours7d || 0),
      updates: [],
      comments: [],
    });
  } catch (error) {
    console.error("Error creating deliverable:", error);
    return NextResponse.json({ error: "Failed to create deliverable" }, { status: 500 });
  }
}
