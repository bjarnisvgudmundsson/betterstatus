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
    const { status, response } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const [ping] = await sql`
      UPDATE pings
      SET status = ${status}, response = ${response || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, author, role, text, timestamp, status, response
    `;

    if (!ping) {
      return NextResponse.json({ error: "Ping not found" }, { status: 404 });
    }

    return NextResponse.json(ping);
  } catch (error) {
    console.error("Error updating ping:", error);
    return NextResponse.json({ error: "Failed to update ping" }, { status: 500 });
  }
}
