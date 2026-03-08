import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; wsId: string }> }
) {
  try {
    const { wsId } = await params;
    const body = await request.json();

    // Get the highest position for ordering
    const [maxPos] = await sql`
      SELECT COALESCE(MAX(position), -1) as max_position
      FROM items
      WHERE workstream_id = ${parseInt(wsId)}
    `;

    const position = (maxPos?.max_position ?? -1) + 1;
    const now = new Date().toISOString();

    // Insert new item
    const [item] = await sql`
      INSERT INTO items (
        workstream_id, title, latest_status, state,
        blocker, updated_at, next_steps, position
      )
      VALUES (
        ${parseInt(wsId)},
        ${body.title},
        ${body.latestStatus},
        ${body.state},
        ${body.blocker || null},
        ${now},
        ${body.nextSteps || null},
        ${position}
      )
      RETURNING
        id, title,
        latest_status as "latestStatus",
        state, blocker,
        updated_at as "updatedAt",
        next_steps as "nextSteps"
    `;

    return NextResponse.json({
      id: item.id.toString(),
      title: item.title,
      latestStatus: item.latestStatus,
      state: item.state,
      blocker: item.blocker,
      updatedAt: item.updatedAt,
      nextSteps: item.nextSteps,
      updates: [],
      comments: [],
      children: [],
    });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
