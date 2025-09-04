import React from "react";
import {
  listTopics,
  listSubtopics,
  createTopic,
  deleteTopic,
  createSubtopic,
  reorderSubtopics,
} from "../api/supabase";
import { useAdmin } from "../store/adminStore";

const paneH: React.CSSProperties = { margin: 0, padding: 0, listStyle: "none" };
const item: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  cursor: "pointer",
  border: "1px solid #e5e7eb",
  marginBottom: 8,
  background: "#fff",
};
const activeItem: React.CSSProperties = { ...item, background: "#eef2ff", borderColor: "#c7d2fe" };
const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
const smallBtn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  background: "#f9fafb",
  cursor: "pointer",
};

export default function LeftNav() {
  const {
    year, setYear,
    topics, setTopics, selectedTopic, setSelectedTopic,
    subtopics, setSubtopics, selectedSub, setSelectedSub,
  } = useAdmin();

  const [q, setQ] = React.useState("");
  const [dragId, setDragId] = React.useState<string | null>(null);

  // load topics when year changes
  React.useEffect(() => {
    listTopics(year, q).then(setTopics).catch(console.error);
  }, [year, q, setTopics]);

  // load subtopics when topic changes
  React.useEffect(() => {
    if (!selectedTopic?.id) {
      setSubtopics([]);
      setSelectedSub(null);
      return;
    }
    listSubtopics(selectedTopic.id).then(setSubtopics).catch(console.error);
  }, [selectedTopic?.id, setSubtopics, setSelectedSub]);

  async function onAddTopic() {
    const title = window.prompt("Topic title for Year " + year + ":");
    if (!title?.trim()) return;
    try {
      const t = await createTopic({ year, title: title.trim() });
      const newTopics = await listTopics(year, q);
      setTopics(newTopics);
      setSelectedTopic(t);
    } catch (e) {
      console.error(e);
      alert("Failed to create topic.");
    }
  }

  async function onDeleteTopic(tid: string) {
    const ok = window.confirm("Delete this topic and all its subtopics? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteTopic(tid);
      const newTopics = await listTopics(year, q);
      setTopics(newTopics);
      // clear selection if we deleted the selected one
      if (selectedTopic?.id === tid) {
        setSelectedTopic(null);
        setSubtopics([]);
        setSelectedSub(null);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete topic.");
    }
  }

  async function onAddSubtopic() {
    if (!selectedTopic?.id) return;
    try {
      const s = await createSubtopic(selectedTopic.id, "New subtopic");
      const sts = await listSubtopics(selectedTopic.id);
      setSubtopics(sts);
      setSelectedSub(s);
    } catch (e) {
      console.error(e);
      alert("Failed to create subtopic.");
    }
  }

  // --- Drag & Drop ordering for subtopics ---
  function onDragStart(e: React.DragEvent<HTMLLIElement>, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent<HTMLLIElement>) {
    e.preventDefault(); // allow drop
  }

  function onDrop(_e: React.DragEvent<HTMLLIElement>, overId: string) {
    if (!dragId || dragId === overId) return;
    const current = [...subtopics];
    const from = current.findIndex(s => s.id === dragId);
    const to = current.findIndex(s => s.id === overId);
    if (from < 0 || to < 0) return;

    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setSubtopics(current); // optimistic UI
  }

  async function onDragEnd() {
    if (!selectedTopic?.id) return;
    setDragId(null);
    // Persist the current order
    try {
      await reorderSubtopics(selectedTopic.id, subtopics.map(s => s.id));
    } catch (e) {
      console.error(e);
      alert("Failed to save new order");
      // reload to recover
      const sts = await listSubtopics(selectedTopic.id);
      setSubtopics(sts);
    }
  }

  return (
    <div>
      {/* Year + search + add */}
      <div style={{ ...row, marginBottom: 12 }}>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value, 10))}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }}
        >
          {[7, 8, 9, 10, 11, 12].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search topics…"
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }}
        />

        <button onClick={onAddTopic} style={smallBtn}>+ Topic</button>
      </div>

      {/* Topics list */}
      <h4 style={{ margin: "12px 0 6px" }}>Topics</h4>
      <ul style={paneH}>
        {topics.map(t => (
          <li
            key={t.id}
            style={selectedTopic?.id === t.id ? activeItem : item}
            onClick={() => setSelectedTopic(t)}
          >
            <div style={{ ...row, justifyContent: "space-between" }}>
              <span>{t.title}</span>
              <button
                aria-label="Delete topic"
                title="Delete topic"
                onClick={(e) => { e.stopPropagation(); onDeleteTopic(t.id); }}
                style={{ ...smallBtn, background: "#fff0f0", borderColor: "#fecaca" }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Subtopics header + add */}
      <div style={{ ...row, marginTop: 16, marginBottom: 6, justifyContent: "space-between" }}>
        <h4 style={{ margin: 0 }}>Subtopics</h4>
        <button onClick={onAddSubtopic} style={smallBtn} disabled={!selectedTopic}>
          + Subtopic
        </button>
      </div>

      {/* Subtopics list (draggable) */}
      <ul style={paneH}>
        {subtopics.map(s => (
          <li
            key={s.id}
            draggable
            onDragStart={(e) => onDragStart(e, s.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, s.id)}
            onDragEnd={onDragEnd}
            style={selectedSub?.id === s.id ? activeItem : item}
            onClick={() => setSelectedSub(s)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ opacity: 0.6, width: 22, textAlign: "right" }}>{s.order_index}</span>
              <span>{s.title}</span>
              <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: 12 }}>⋮⋮</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
