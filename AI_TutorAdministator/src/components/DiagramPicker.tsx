import React from "react";
import { useAdmin } from "../store/adminStore";
import { listDiagrams, type DbDiagram } from "../api/supabase";

type Props = {
  onPick: (d: DbDiagram) => void;
  onClose: () => void;
};

export default function DiagramPicker({ onPick, onClose }: Props) {
  const { selectedSub } = useAdmin();
  const [items, setItems] = React.useState<DbDiagram[]>([]);
  React.useEffect(() => {
    if (!selectedSub) return;
    listDiagrams(selectedSub.id).then(setItems).catch(console.error);
  }, [selectedSub]);

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Attach a Diagram</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((d) => (
          <div
            key={d.id}
            style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, cursor: "pointer" }}
            onClick={() => {
              onPick(d);
              onClose();
            }}
          >
            <div style={{ fontSize: 12, color: "#666" }}>{d.kind}</div>
            {d.svg ? (
              <div dangerouslySetInnerHTML={{ __html: d.svg }} />
            ) : (
              <pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(d.params)}</pre>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
