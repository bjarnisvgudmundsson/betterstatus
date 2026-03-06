import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    // Insert update
    const [update] = await sql`
      INSERT INTO updates (item_id, text, week_label, timestamp)
      VALUES (${parseInt(id)}, ${text}, ${weekLabel}, ${now})
      RETURNING id, text, week_label as "weekLabel", timestamp
    `;

    // Update item's latest_status and updated_at
    await sql`
      UPDATE items
      SET latest_status = ${text}, updated_at = ${now}
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json(update);
  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
