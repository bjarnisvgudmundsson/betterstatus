import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deliverableId = parseInt(id);
    const now = new Date().toISOString();

    // Build update query dynamically based on provided fields
    const updates: string[] = ['updated_at = $' + '1'];
    const values: any[] = [now];
    let paramIndex = 2;

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(body.title);
      paramIndex++;
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(body.description);
      paramIndex++;
    }

    if (body.state !== undefined) {
      updates.push(`state = $${paramIndex}`);
      values.push(body.state);
      paramIndex++;
    }

    if (body.blocker !== undefined) {
      updates.push(`blocker = $${paramIndex}`);
      values.push(body.blocker || null);
      paramIndex++;
    }

    if (body.nextSteps !== undefined) {
      updates.push(`next_steps = $${paramIndex}`);
      values.push(body.nextSteps || null);
      paramIndex++;
    }

    if (body.togglProjectId !== undefined) {
      updates.push(`toggl_project_id = $${paramIndex}`);
      values.push(body.togglProjectId || null);
      paramIndex++;
    }

    // Execute update with template literal (neon syntax)
    const result = await sql`
      UPDATE deliverables
      SET
        updated_at = ${now}
        ${body.title !== undefined ? sql`, title = ${body.title}` : sql``}
        ${body.description !== undefined ? sql`, description = ${body.description}` : sql``}
        ${body.state !== undefined ? sql`, state = ${body.state}` : sql``}
        ${body.blocker !== undefined ? sql`, blocker = ${body.blocker || null}` : sql``}
        ${body.nextSteps !== undefined ? sql`, next_steps = ${body.nextSteps || null}` : sql``}
        ${body.togglProjectId !== undefined ? sql`, toggl_project_id = ${body.togglProjectId || null}` : sql``}
      WHERE id = ${deliverableId}
      RETURNING
        id,
        client_id as "clientId",
        title,
        description,
        state,
        blocker,
        next_steps as "nextSteps",
        updated_at as "updatedAt",
        toggl_project_id as "togglProjectId",
        toggl_hours_7d as "togglHours7d"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    const deliverable = result[0];

    return NextResponse.json({
      id: deliverable.id.toString(),
      clientId: deliverable.clientId.toString(),
      title: deliverable.title,
      description: deliverable.description,
      state: deliverable.state,
      blocker: deliverable.blocker,
      nextSteps: deliverable.nextSteps,
      updatedAt: deliverable.updatedAt,
      togglProjectId: deliverable.togglProjectId,
      togglHours7d: parseFloat(deliverable.togglHours7d || 0),
    });
  } catch (error) {
    console.error("Error updating deliverable:", error);
    return NextResponse.json({ error: "Failed to update deliverable" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM deliverables WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deliverable:", error);
    return NextResponse.json({ error: "Failed to delete deliverable" }, { status: 500 });
  }
}
