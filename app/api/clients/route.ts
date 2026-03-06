import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Get all clients with basic info
    const clients = await sql`
      SELECT
        id,
        slug,
        name,
        sector,
        page_title as "pageTitle",
        overall_state as "overallState",
        last_updated as "lastUpdated",
        purchaser_mode as "purchaserMode",
        end_client_name as "endClientName"
      FROM clients
      ORDER BY last_updated DESC
    `;

    // Get unread ping counts for each client
    const pings = await sql`
      SELECT
        client_id as "clientId",
        COUNT(*) as count
      FROM pings
      WHERE status = 'unread'
      GROUP BY client_id
    `;

    const pingCountMap = pings.reduce((acc: Record<number, number>, p: any) => {
      acc[p.clientId] = parseInt(p.count);
      return acc;
    }, {});

    const result = clients.map((c: any) => ({
      ...c,
      unreadPings: pingCountMap[c.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
