import React from "react";

export default function QuestionEditor() {
  const base: React.CSSProperties = {
    padding: 8,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    width: "100%",
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>Question</label>
      <textarea rows={3} style={base} />

      <label>Expected Answer (optional)</label>
      <textarea rows={3} style={base} />

      <button style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        Save Guided Q (stub)
      </button>
    </div>
  );
}
