import React from "react";
import LeftNav from "../components/LeftNav";
import ContentTabs from "../components/ContentTabs";
import RightPanel from "../components/RightPanel"; // 👈 import

const page: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px 1fr 360px",
  height: "100vh",
  fontFamily: "ui-sans-serif, system-ui, Arial",
};

const pane: React.CSSProperties = {
  borderRight: "1px solid #e5e7eb",
  padding: 16,
  overflow: "auto",
};

export default function AdminApp() {
  return (
    <div style={page}>
      <div style={pane}>
        <LeftNav />
      </div>

      <div style={{ padding: 16, overflow: "auto" }}>
        <ContentTabs />
      </div>

      <div style={{ ...pane, borderRight: "none" }}>
        <RightPanel /> {/* 👈 drop in your chat/preview */}
      </div>
    </div>
  );
}
