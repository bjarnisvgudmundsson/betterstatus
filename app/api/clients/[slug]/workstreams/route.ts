import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Get client ID from slug
    const [client] = await sql`
      SELECT id FROM clients WHERE slug = ${slug}
    `;

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get the highest position for ordering
    const [maxPos] = await sql`
      SELECT COALESCE(MAX(position), -1) as max_position
      FROM workstreams
      WHERE client_id = ${client.id}
    `;

    const position = (maxPos?.max_position ?? -1) + 1;

    // Insert new workstream
    const [workstream] = await sql`
      INSERT INTO workstreams (client_id, title, state, position)
      VALUES (${client.id}, ${body.title}, 'not_started', ${position})
      RETURNING id, title, state, position
    `;

    return NextResponse.json({
      id: workstream.id.toString(),
      title: workstream.title,
      state: workstream.state,
      items: [],
    });
  } catch (error) {
    console.error("Error creating workstream:", error);
    return NextResponse.json({ error: "Failed to create workstream" }, { status: 500 });
  }
}
