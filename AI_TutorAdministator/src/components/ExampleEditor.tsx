import React from "react";
import { useAdmin } from "../store/adminStore";
import { addWorkedExample, attachDiagramToExample } from "../api/supabase";
import DiagramPicker from "./DiagramPicker";

export default function ExampleEditor() {
  const { selectedSub } = useAdmin();
  const [difficulty, setDifficulty] = React.useState<"Beginner"|"Intermediate"|"Advanced">("Beginner");
  const [problem, setProblem] = React.useState("");
  const [steps, setSteps] = React.useState("");
  const [lastSavedId, setLastSavedId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const base: React.CSSProperties = { padding: 8, border: "1px solid #e5e7eb", borderRadius: 8, width: "100%" };

  async function onSave() {
    if (!selectedSub) return alert("Select a subtopic first.");
    const arr = steps.split("\n").map(s => s.trim()).filter(Boolean);
    const saved = await addWorkedExample(selectedSub.id, { difficulty, problem, steps: arr });
    setLastSavedId(saved.id);
    setProblem(""); setSteps("");
    alert("Saved example!");
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>Difficulty</label>
      <select style={base} value={difficulty} onChange={e=>setDifficulty(e.target.value as any)}>
        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
      </select>

      <label>Problem / Question</label>
      <textarea rows={3} style={base} value={problem} onChange={e=>setProblem(e.target.value)} />

      <label>Step-by-step (one per line)</label>
      <textarea rows={5} style={base} value={steps} onChange={e=>setSteps(e.target.value)} />

      <button onClick={onSave} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        Save Example
      </button>

      {lastSavedId && (
        <button onClick={() => setPickerOpen(true)} style={{ padding: "8px 12px" }}>Attach Diagram</button>
      )}

      {pickerOpen && (
        <DiagramPicker
          onPick={async (d) => {
            if (!lastSavedId) return;
            await attachDiagramToExample(lastSavedId, d.id);
            alert("Diagram attached!");
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
