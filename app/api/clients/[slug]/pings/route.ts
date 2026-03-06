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
    const { author, text } = body;

    if (!author || !text) {
      return NextResponse.json({ error: "Author and text are required" }, { status: 400 });
    }

    // Get client ID
    const [client] = await sql`
      SELECT id FROM clients WHERE slug = ${slug}
    `;

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    const [ping] = await sql`
      INSERT INTO pings (client_id, author, role, text, timestamp, status)
      VALUES (${client.id}, ${author}, ${"Buyer"}, ${text}, ${now}, ${"unread"})
      RETURNING id, author, role, text, timestamp, status, response
    `;

    return NextResponse.json(ping);
  } catch (error) {
    console.error("Error creating ping:", error);
    return NextResponse.json({ error: "Failed to create ping" }, { status: 500 });
  }
}
