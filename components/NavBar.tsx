"use client";
import Link from "next/link";

export function NavBar() {
  return (
    <div style={{ borderBottom: "1px solid #EBEBEB", background: "#FFF", padding: "0 24px", display: "flex", alignItems: "center", height: 48, position: "sticky", top: 0, zIndex: 100 }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 20, height: 20, background: "#18181B", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#FFF", fontSize: 10, fontWeight: 700 }}>W</span>
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", letterSpacing: "-0.01em" }}>Workstream Status</span>
      </Link>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: "#9CA3AF" }}>Bjarni Sv. Guðmundsson</span>
    </div>
  );
}
