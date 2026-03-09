import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();
    const weekLabel = "Week of " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    await sql`
      INSERT INTO updates (deliverable_id, text, week_label, timestamp)
      VALUES (${parseInt(id)}, ${body.text}, ${weekLabel}, ${now})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
