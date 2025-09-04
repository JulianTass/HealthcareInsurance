// src/components/RightPanel.tsx
import * as React from "react";
import { useAdmin } from "../store/adminStore";
import { fetchPackForSubtopic } from "../api/supabase";

type Mode = "teach" | "example" | "practice" | "quiz" | "chat";
type ChatMsg = { role: "user" | "assistant"; content: string };

const wrapper: React.CSSProperties = {
  height: "100%",
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto",
  gap: 8,
};

const head: React.CSSProperties = {
  padding: "6px 8px 0 8px",
};

const pills: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  padding: "0 8px",
};

const pillBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 999,
  border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
  background: active ? "#eff6ff" : "#fff",
  color: active ? "#1d4ed8" : "#111",
  cursor: "pointer",
  fontSize: 12,
});

const stream: React.CSSProperties = {
  overflow: "auto",
  padding: 8,
  borderTop: "1px solid #eee",
  borderBottom: "1px solid #eee",
  background: "#fafafa",
};

const inputRow: React.CSSProperties = {
  padding: 8,
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  borderTop: "1px solid #eee",
};

function Bubble({ role, content }: ChatMsg) {
  const mine = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        margin: "6px 0",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          padding: "8px 10px",
          borderRadius: 10,
          background: mine ? "#dbeafe" : "#fff",
          border: "1px solid #e5e7eb",
          color: "#111",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default function RightPanel() {
  const { selectedSub, selectedTopic } = useAdmin();
  const [mode, setMode] = React.useState<Mode>("teach");
  const [pack, setPack] = React.useState<any>(null);
  const [history, setHistory] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  // Load the subtopic pack whenever the selection changes
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedSub?.id) {
        setPack(null);
        setHistory([]);
        return;
      }
      setHistory([]);
      setPack(null);
      try {
        const p = await fetchPackForSubtopic(selectedSub.id);
        if (!cancelled) {
          setPack(p);
        }
      } catch (err) {
        console.error("[RightPanel] failed to fetch pack:", err);
        if (!cancelled) {
          setPack(null);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSub?.id]);

  // Auto-scroll to bottom when history updates
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history]);

  async function send() {
    if (!selectedSub) {
      console.warn("[chat] No subtopic selected.");
      return;
    }
    if (!pack) {
      console.warn("[chat] Pack not loaded yet.");
      return;
    }
    const msg = input.trim();
    if (!msg) return;

    setInput("");
    setHistory((h) => [...h, { role: "user", content: msg }]);
    setLoading(true);

    try {
      console.log("[chat] POST /api/claude", {
        subId: selectedSub.id,
        topic: selectedTopic?.title,
        sub: selectedSub.title,
        mode,
      });

      const res = await fetch("http://localhost:8787/api/claude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userInput: msg,
          subtopic: {
            id: selectedSub.id,
            title: selectedSub.title,
            topicTitle: selectedTopic?.title,
          },
          pack,
          history,
          mode,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[chat] /api/claude failed", res.status, text);
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content:
              "Sorry, I couldn't get a reply from the tutor just now. Please try again.",
          },
        ]);
        return;
      }

      const data = await res.json();
      const text =
        data?.content?.[0]?.text ??
        data?.output_text ??
        data?.message ??
        "(no reply)";
      setHistory((h) => [...h, { role: "assistant", content: text }]);
    } catch (err) {
      console.error("[chat] error", err);
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "An error occurred contacting the tutor.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || !pack || !selectedSub;

  if (!selectedSub) {
    return (
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Guided Chat</div>
        <div style={{ color: "#6b7280" }}>Select a subtopic to begin.</div>
      </div>
    );
  }

  return (
    <div style={wrapper}>
      {/* Header */}
      <div style={head}>
        <div style={{ fontWeight: 700 }}>
          Guided Chat: {selectedTopic?.title ?? "—"} → {selectedSub.title}
        </div>
        {!pack && (
          <div style={{ color: "#9ca3af", marginTop: 4 }}>
            Loading subtopic content…
          </div>
        )}
      </div>

      {/* Mode pills */}
      <div style={pills}>
        {(["teach", "example", "practice", "quiz", "chat"] as Mode[]).map((m) => (
          <button
            key={m}
            style={pillBtn(mode === m)}
            onClick={() => setMode(m)}
            type="button"
          >
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Chat stream */}
      <div ref={scrollerRef} style={stream}>
        {history.length === 0 ? (
          <div style={{ color: "#6b7280", lineHeight: 1.5 }}>
            Ask something about <b>{selectedSub.title}</b> to get started.
            {mode !== "chat" ? (
              <>
                <br />
                <span style={{ fontSize: 12 }}>
                  (Mode is <b>{mode}</b>. Your prompt will be guided by the
                  subtopic’s theory/rules/examples.)
                </span>
              </>
            ) : null}
          </div>
        ) : (
          history.map((m, i) => <Bubble key={i} {...m} />)
        )}
      </div>

      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled) send();
        }}
        style={inputRow}
      >
        <input
          placeholder={
            selectedSub ? `Ask about ${selectedSub.title}…` : "Pick a subtopic…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          style={{
            padding: 10,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: disabled ? "#f9fafb" : "#fff",
          }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: disabled || !input.trim() ? "#f3f4f6" : "#111827",
            color: disabled || !input.trim() ? "#9ca3af" : "#fff",
            cursor:
              disabled || !input.trim() ? "not-allowed" : ("pointer" as const),
            minWidth: 72,
          }}
          title={!pack ? "Loading subtopic content…" : ""}
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
