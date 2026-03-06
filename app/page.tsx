"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { StatusDot, StatusPill } from "@/components/atoms";
import { NavBar } from "@/components/NavBar";

export default function HomePage() {
  const clients = useStore((s) => s.clients);
  const loading = useStore((s) => s.loading);
  const loadClients = useStore((s) => s.loadClients);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  if (loading && clients.length === 0) {
    return (
      <>
        <NavBar />
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px", textAlign: "center", color: "#6B7280" }}>
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Client Status Pages
          </h1>
          <p style={{ fontSize: 13.5, color: "#6B7280" }}>
            Select a client to view their project delivery status.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clients.map((c: any) => {
            const unread = c.unreadPings || 0;
            return (
              <Link
                key={c.id}
                href={`/client/${c.slug}`}
                style={{
                  background: "#FFF",
                  border: "1px solid #EBEBEB",
                  borderRadius: 6,
                  padding: "15px 18px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "border-color 0.1s, box-shadow 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#C8C8C8";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#EBEBEB";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                }}
              >
                <StatusDot state={c.overallState} size={10} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#18181B" }}>{c.name}</span>
                    {c.purchaserMode === "subcontractor" && (
                      <span style={{ fontSize: 10, fontWeight: 600, background: "#FEF3C7", color: "#92400E", padding: "2px 7px", borderRadius: 4 }}>
                        via {c.name}
                      </span>
                    )}
                    {unread > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#78350F", padding: "1px 7px", borderRadius: 10 }}>
                        ✉ {unread} ping
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{c.pageTitle}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <StatusPill state={c.overallState} small />
                  <span className="mono" style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {fmtDate(c.lastUpdated)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
