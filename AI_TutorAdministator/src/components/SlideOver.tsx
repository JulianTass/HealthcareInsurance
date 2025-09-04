import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function SlideOver({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0 as any, zIndex: 50, display: "flex" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.25)" }} />
      <div
        style={{
          width: 420,
          height: "100%",
          background: "#fff",
          boxShadow: "rgba(0,0,0,0.15) 0 0 24px",
          padding: 16,
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ fontSize: 20, lineHeight: 1 }}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
