import React from "react";
import { useAdmin } from "../store/adminStore";
import { addPracticeQuestion, attachDiagramToQuestion } from "../api/supabase";
import DiagramPicker from "./DiagramPicker";

export default function PracticeEditor() {
  const { selectedSub } = useAdmin();
  const [prompt, setPrompt] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<"Beginner"|"Intermediate"|"Advanced">("Beginner");
  const [type, setType] = React.useState<"mcq"|"fill"|"short">("mcq");
  const [optionsText, setOptionsText] = React.useState("A\nB\nC\nD");
  const [answer, setAnswer] = React.useState("");
  const [lastSavedId, setLastSavedId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const base: React.CSSProperties = { padding: 8, border: "1px solid #e5e7eb", borderRadius: 8, width: "100%" };

  async function onSave() {
    if (!selectedSub) return alert("Select a subtopic first.");
    const options = type === "mcq" ? optionsText.split("\n").map(s=>s.trim()).filter(Boolean) : [];
    const saved = await addPracticeQuestion(selectedSub.id, { difficulty, type, prompt, options, answer });
    setLastSavedId(saved.id);
    setPrompt(""); setOptionsText("A\nB\nC\nD"); setAnswer("");
    alert("Saved practice question!");
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>Question Type</label>
      <select style={base} value={type} onChange={e=>setType(e.target.value as any)}>
        <option value="mcq">Multiple choice</option>
        <option value="fill">Fill in the blank</option>
        <option value="short">Short answer</option>
      </select>

      <label>Prompt</label>
      <textarea rows={3} style={base} value={prompt} onChange={e=>setPrompt(e.target.value)} />

      {type === "mcq" && (
        <>
          <label>Options (one per line)</label>
          <textarea rows={4} style={base} value={optionsText} onChange={e=>setOptionsText(e.target.value)} />
        </>
      )}

      <label>Correct Answer</label>
      <input style={base} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Correct answer" />

      <label>Difficulty</label>
      <select style={base} value={difficulty} onChange={e=>setDifficulty(e.target.value as any)}>
        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
      </select>

      <button onClick={onSave} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        Save Practice
      </button>

      {lastSavedId && (
        <button onClick={() => setPickerOpen(true)} style={{ padding:"8px 12px" }}>Attach Diagram</button>
      )}

      {pickerOpen && (
        <DiagramPicker
          onPick={async (d)=>{ if(lastSavedId){ await attachDiagramToQuestion(lastSavedId, d.id); alert("Diagram attached!"); }}}
          onClose={()=>setPickerOpen(false)}
        />
      )}
    </div>
  );
}
