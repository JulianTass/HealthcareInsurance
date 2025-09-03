import React from "react";
import { useAdmin } from "../store/adminStore";
import { listDiagrams, upsertDiagram, type DbDiagram } from "../api/supabase";
import { DiagramRegistry, DiagramConfig, diagramKeys } from "../diagram-kits/registry";
import DiagramThumb from "./DiagramThumb";

/** field config types (unchanged) */
type NumberField = { type: "number"; label: string; min?: number; max?: number; step?: number; default?: number };
type BooleanField = { type: "boolean"; label: string; default?: boolean };
type SelectField  = { type: "select";  label: string; options: { label: string; value: string }[]; default?: string };
type TextField    = { type: "text";    label: string; default?: string };
type FieldDef = NumberField | BooleanField | SelectField | TextField;
type FieldsShape = Record<string, FieldDef>;

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export default function DiagramBuilder() {
  const { selectedSub } = useAdmin();
  const subId = selectedSub?.id ?? null;

  const [kind, setKind] = React.useState<string>(diagramKeys[0] ?? "");
  const [params, setParams] = React.useState<Record<string, any>>({});
  const [name, setName] = React.useState<string>("");

  // NEW: difficulty
  const [difficulty, setDifficulty] = React.useState<Difficulty>("Beginner");

  const [saved, setSaved] = React.useState<DbDiagram[]>([]);
  const [loading, setLoading] = React.useState(false);

  const Comp = (kind && DiagramRegistry[kind]) || null;
  const cfg  = (kind && DiagramConfig[kind]) || undefined;
  const fields: FieldsShape = (cfg?.fields as any) ?? {};

  React.useEffect(() => {
    if (!subId) return;
    listDiagrams(subId).then(setSaved).catch(console.error);
  }, [subId]);

  React.useEffect(() => {
    const f = (DiagramConfig[kind]?.fields ?? {}) as FieldsShape;
    const defaults: Record<string, any> = {};
    Object.entries(f).forEach(([k, v]) => {
      if (v.type === "number") defaults[k] = (v as NumberField).default ?? 0;
      else if (v.type === "boolean") defaults[k] = (v as BooleanField).default ?? false;
      else if (v.type === "select")  defaults[k] = (v as SelectField).default ?? (v as SelectField).options?.[0]?.value ?? "";
      else if (v.type === "text")    defaults[k] = (v as TextField).default ?? "";
    });
    setParams(defaults);
    setName("");
    setDifficulty("Beginner"); // reset for new kind
  }, [kind]);

  async function handleSave() {
    if (!subId) { alert("Pick a subtopic first."); return; }
    setLoading(true);
    try {
      const row = await upsertDiagram({
        subtopic_id: subId,
        kind,
        params,
        name: name?.trim() || null,
        difficulty, // <-- NEW: save it
      });

      setSaved(prev => {
        const i = prev.findIndex(d => d.id === row.id);
        if (i === -1) return [row, ...prev];
        const copy = [...prev]; copy[i] = row; return copy;
      });

      setName("");
      alert("Diagram saved.");
    } catch (e) {
      console.error(e);
      alert("Could not save diagram.");
    } finally {
      setLoading(false);
    }
  }

  function Control({ k, def }: { k: string; def: FieldDef }) {
    if (def.type === "number") {
      const v = Number(params[k] ?? (def as NumberField).default ?? 0);
      return (
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#555" }}>
            {def.label} <span style={{ color: "#999" }}>({v})</span>
          </label>
          <input
            type="range"
            min={def.min ?? 0}
            max={def.max ?? 100}
            step={def.step ?? 1}
            value={v}
            onChange={(e) => setParams(p => ({ ...p, [k]: Number(e.target.value) }))}
          />
        </div>
      );
    }
    if (def.type === "boolean") {
      const v = Boolean(params[k] ?? (def as BooleanField).default ?? false);
      return (
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={v}
            onChange={(e) => setParams(p => ({ ...p, [k]: e.target.checked }))}
          />
          {def.label}
        </label>
      );
    }
    if (def.type === "select") {
      const v = String(params[k] ?? (def as SelectField).default ?? "");
      return (
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#555" }}>{def.label}</label>
          <select
            value={v}
            onChange={(e) => setParams(p => ({ ...p, [k]: e.target.value }))}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            {(def as SelectField).options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }
    const v = String(params[k] ?? (def as TextField).default ?? "");
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#555" }}>{def.label}</label>
        <input
          value={v}
          onChange={(e) => setParams(p => ({ ...p, [k]: e.target.value }))}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
      </div>
    );
  }

  if (!subId) return <div style={{ color: "#666" }}>Select a subtopic to build diagrams.</div>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Top row: type + name + save */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(220px, 280px) 1fr 200px 160px" }}>
        {/* Type */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#555" }}>Diagram Type</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            {diagramKeys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#555" }}>Diagram Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Angle 45°, Number line -10..10"
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
        </div>

        {/* NEW: Difficulty */}
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#555" }}>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          >
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Save */}
        <div style={{ display: "grid", alignContent: "end" }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
          >
            {loading ? "Saving…" : "Save Diagram"}
          </button>
        </div>
      </div>

      {/* Auto controls */}
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          alignItems: "start",
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 12,
        }}
      >
        {Object.entries(fields).length === 0 && (
          <div style={{ color: "#888" }}>
            No controls defined for <strong>{kind}</strong>.
          </div>
        )}
        {Object.entries(fields).map(([k, def]) => (
          <Control key={k} k={k} def={def as FieldDef} />
        ))}
      </div>

      {/* Live preview */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 12,
          minHeight: 220,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Preview</div>
        {Comp ? <Comp {...params} /> : <div style={{ color: "#999" }}>Pick a diagram type to preview.</div>}
      </div>

      {/* Saved diagrams */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Saved diagrams in this subtopic</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {saved.map((d) => (
            <div key={d.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, width: 220 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{d.name ?? "(unnamed)"}</div>
                <div>{d.kind}</div>
                {d.difficulty && (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      background: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #10b98133",
                    }}
                  >
                    {d.difficulty}
                  </span>
                )}
              </div>
              <DiagramThumb kind={d.kind} params={d.params} />
            </div>
          ))}
          {saved.length === 0 && <div style={{ color: "#666" }}>No diagrams saved yet.</div>}
        </div>
      </div>
    </div>
  );
}
