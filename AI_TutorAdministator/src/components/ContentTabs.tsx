import React from "react";
import SubtopicEditor from "./SubtopicEditor";
import SlideOver from "./SlideOver";
import ExampleEditor from "./ExampleEditor";
import QuestionEditor from "./QuestionEditor";
import PracticeEditor from "./PracticeEditor";
import DiagramBuilder from "./DiagramBuilder";
import LibraryGrid from "./LibraryGrid";

type Panel = null | "example" | "question" | "practice";

export default function ContentTabs() {
  const [tab, setTab] = React.useState<"content" | "diagram" | "library" | "preview">("content");
  const [panel, setPanel] = React.useState<Panel>(null);

  const tabBtn = (name: typeof tab, label: string) => (
    <button
      onClick={() => setTab(name)}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: tab === name ? "#eef2ff" : "white",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {tabBtn("content", "Content")}
        {tabBtn("diagram", "Diagrams")}
        {tabBtn("library", "Library")}
        {tabBtn("preview", "Preview")}
      </div>

      {tab === "content" && (
        <div style={{ display: "grid", gap: 12 }}>
          <SubtopicEditor />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPanel("example")} style={btnStyle}>
              Worked Examples
            </button>
            <button onClick={() => setPanel("question")} style={btnStyle}>
              Guided Questions
            </button>
            <button onClick={() => setPanel("practice")} style={btnStyle}>
              Practice
            </button>
          </div>
        </div>
      )}

      {tab === "diagram" && <DiagramBuilder />}
      {tab === "library" && <LibraryGrid />}
      {tab === "preview" && <div>Preview (stub)</div>}

      <SlideOver open={panel === "example"} onClose={() => setPanel(null)} title="Worked Examples">
        <ExampleEditor />
      </SlideOver>
      <SlideOver open={panel === "question"} onClose={() => setPanel(null)} title="Guided Questions">
        <QuestionEditor />
      </SlideOver>
      <SlideOver open={panel === "practice"} onClose={() => setPanel(null)} title="Practice Questions">
        <PracticeEditor />
      </SlideOver>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
};
