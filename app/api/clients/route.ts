import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const clients = await sql`
      SELECT
        id, slug, name, sector,
        page_title as "pageTitle",
        purchaser_mode as "purchaserMode",
        end_client_name as "endClientName"
      FROM clients
      ORDER BY name
    `;

    // Get deliverable counts
    const deliverableCounts = await sql`
      SELECT client_id as "clientId", COUNT(*) as count
      FROM deliverables
      GROUP BY client_id
    `;

    // Get unread ping counts
    const pings = await sql`
      SELECT client_id as "clientId", COUNT(*) as count
      FROM pings
      WHERE status = 'unread'
      GROUP BY client_id
    `;

    const delivCountMap = deliverableCounts.reduce((acc: any, d: any) => {
      acc[d.clientId] = parseInt(d.count);
      return acc;
    }, {});

    const pingCountMap = pings.reduce((acc: any, p: any) => {
      acc[p.clientId] = parseInt(p.count);
      return acc;
    }, {});

    const result = clients.map((c: any) => ({
      id: c.id.toString(),
      slug: c.slug,
      name: c.name,
      sector: c.sector,
      pageTitle: c.pageTitle,
      purchaserMode: c.purchaserMode,
      endClientName: c.endClientName,
      deliverableCount: delivCountMap[c.id] || 0,
      unreadPings: pingCountMap[c.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [client] = await sql`
      INSERT INTO clients (
        slug, name, sector, page_title, purchaser_mode, end_client_name
      ) VALUES (
        ${body.slug},
        ${body.name},
        ${body.sector || ''},
        ${body.pageTitle || body.name},
        ${body.purchaserMode || 'direct'},
        ${body.endClientName || null}
      )
      RETURNING
        id, slug, name, sector,
        page_title as "pageTitle",
        purchaser_mode as "purchaserMode",
        end_client_name as "endClientName"
    `;

    return NextResponse.json({
      id: client.id.toString(),
      slug: client.slug,
      name: client.name,
      sector: client.sector,
      pageTitle: client.pageTitle,
      purchaserMode: client.purchaserMode,
      endClientName: client.endClientName,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
