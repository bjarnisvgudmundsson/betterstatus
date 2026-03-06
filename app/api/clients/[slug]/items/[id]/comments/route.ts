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
    const { author, authorRole, text, parentId } = body;

    if (!author || !authorRole || !text) {
      return NextResponse.json({ error: "Author, authorRole, and text are required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const [comment] = await sql`
      INSERT INTO comments (item_id, parent_id, author, author_role, text, timestamp)
      VALUES (
        ${parseInt(id)},
        ${parentId ? parseInt(parentId) : null},
        ${author},
        ${authorRole},
        ${text},
        ${now}
      )
      RETURNING id, author, author_role as "authorRole", text, timestamp, parent_id as "parentId"
    `;

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
