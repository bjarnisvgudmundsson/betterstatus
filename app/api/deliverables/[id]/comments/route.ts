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

    await sql`
      INSERT INTO comments (
        deliverable_id, parent_id, author, author_role, text, timestamp
      ) VALUES (
        ${parseInt(id)},
        ${body.parentId ? parseInt(body.parentId) : null},
        ${body.author},
        ${body.authorRole},
        ${body.text},
        ${now}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
