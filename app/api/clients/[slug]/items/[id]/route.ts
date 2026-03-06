import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const itemId = parseInt(id);
    const now = new Date().toISOString();

    // Handle different update scenarios
    if (body.state !== undefined) {
      const result = await sql`
        UPDATE items
        SET state = ${body.state}, updated_at = ${now}
        WHERE id = ${itemId}
        RETURNING id, title, latest_status as "latestStatus", state, blocker, updated_at as "updatedAt", next_steps as "nextSteps"
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }

    if (body.title !== undefined) {
      const result = await sql`
        UPDATE items
        SET title = ${body.title}, updated_at = ${now}
        WHERE id = ${itemId}
        RETURNING id, title, latest_status as "latestStatus", state, blocker, updated_at as "updatedAt", next_steps as "nextSteps"
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }

    if (body.latestStatus !== undefined) {
      const result = await sql`
        UPDATE items
        SET latest_status = ${body.latestStatus}, updated_at = ${now}
        WHERE id = ${itemId}
        RETURNING id, title, latest_status as "latestStatus", state, blocker, updated_at as "updatedAt", next_steps as "nextSteps"
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }

    if (body.blocker !== undefined) {
      const result = await sql`
        UPDATE items
        SET blocker = ${body.blocker || null}, updated_at = ${now}
        WHERE id = ${itemId}
        RETURNING id, title, latest_status as "latestStatus", state, blocker, updated_at as "updatedAt", next_steps as "nextSteps"
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }

    if (body.nextSteps !== undefined) {
      const result = await sql`
        UPDATE items
        SET next_steps = ${body.nextSteps || null}, updated_at = ${now}
        WHERE id = ${itemId}
        RETURNING id, title, latest_status as "latestStatus", state, blocker, updated_at as "updatedAt", next_steps as "nextSteps"
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }

    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
