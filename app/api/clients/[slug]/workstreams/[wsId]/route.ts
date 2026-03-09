import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; wsId: string }> }
) {
  try {
    const { wsId } = await params;

    // Delete workstream (cascades to items)
    await sql`DELETE FROM workstreams WHERE id = ${parseInt(wsId)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workstream:", error);
    return NextResponse.json({ error: "Failed to delete workstream" }, { status: 500 });
  }
}
