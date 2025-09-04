import React from "react";
import { useAdmin } from "../store/adminStore";
import {
  listWorkedExamplesWithDiagrams,
  listPracticeQuestionsWithDiagrams,
  listDiagrams,
  deleteDiagram,
  detachDiagramFromExample,
  detachDiagramFromQuestion,
  type DbDiagram,
  type WorkedExample,
  type PracticeQ,
} from "../api/supabase";
import DiagramThumb from "./DiagramThumb";

// utility: shuffle + slice
function pick<T>(arr: T[], n: number) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const DIFFS = ["All", "Beginner", "Intermediate", "Advanced"] as const;
type DiffFilter = (typeof DIFFS)[number];

export default function LibraryGrid() {
  const { selectedSub } = useAdmin();

  const [examples, setExamples] = React.useState<(WorkedExample & { diagrams: DbDiagram[] })[]>([]);
  const [qs, setQs] = React.useState<(PracticeQ & { diagrams: DbDiagram[] })[]>([]);
  const [allDiagrams, setAllDiagrams] = React.useState<DbDiagram[]>([]);

  // search + difficulty + pagination state
  const [diagramSearch, setDiagramSearch] = React.useState("");
  const [diffFilter, setDiffFilter] = React.useState<DiffFilter>("All");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);

  // quiz state
  const [quizCount, setQuizCount] = React.useState(5);
  const [activeQuiz, setActiveQuiz] = React.useState<(PracticeQ & { diagrams: DbDiagram[] })[] | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    if (!selectedSub) return;
    (async () => {
      const [ex, pq, diags] = await Promise.all([
        listWorkedExamplesWithDiagrams(selectedSub.id),
        listPracticeQuestionsWithDiagrams(selectedSub.id),
        listDiagrams(selectedSub.id),
      ]);
      setExamples(ex);
      setQs(pq);
      setAllDiagrams(diags);
    })().catch(console.error);
  }, [selectedSub]);

  // Reset page when search/filter/pageSize changes
  React.useEffect(() => {
    setPage(1);
  }, [diagramSearch, diffFilter, pageSize]);

  if (!selectedSub) return <div>Select a subtopic to see its library.</div>;

  const score =
    activeQuiz?.filter((q) => (answers[q.id] ?? "").trim() === (q.answer ?? "").trim()).length ?? 0;

  // filter by search (name or kind) + difficulty
  const filteredDiagrams = allDiagrams
    .filter((d) => {
      const q = diagramSearch.trim().toLowerCase();
      const matchesText =
        !q ||
        (d.name ?? "").toLowerCase().includes(q) ||
        (d.kind ?? "").toLowerCase().includes(q);

      const matchesDiff =
        diffFilter === "All" || (d.difficulty ?? "Beginner") === diffFilter;

      return matchesText && matchesDiff;
    })
    .sort((a, b) => (a.name ?? a.kind).localeCompare(b.name ?? b.kind));

  // pagination over filtered results
  const totalPages = Math.max(1, Math.ceil(filteredDiagrams.length / pageSize));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * pageSize;
  const end = start + pageSize;
  const pagedDiagrams = filteredDiagrams.slice(start, end);

  async function refreshDiagrams() {
    if (!selectedSub) return;
    const diags = await listDiagrams(selectedSub.id);
    setAllDiagrams(diags);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Diagram Library */}
      <section>
        <h3>Diagram Library</h3>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "1fr auto auto auto",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search diagrams by name or type…"
            style={{ padding: 8, width: "100%", border: "1px solid #ccc", borderRadius: 6 }}
            value={diagramSearch}
            onChange={(e) => setDiagramSearch(e.target.value)}
          />

          {/* Difficulty filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifySelf: "end" }}>
            <label style={{ fontSize: 12, color: "#555" }}>Difficulty</label>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value as DiffFilter)}
              style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
            >
              {DIFFS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Page size */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#555" }}>Per page</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          {pagedDiagrams.map((d) => (
            <div key={d.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, width: 220 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.name ?? "(unnamed)"}
                </div>
                <div>{d.kind}</div>
                {d.difficulty && <DifficultyBadge diff={d.difficulty} />}
              </div>

              <DiagramThumb kind={d.kind} params={d.params} />

              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  style={{ fontSize: 12 }}
                  onClick={async () => {
                    if (!confirm("Delete this diagram? This cannot be undone.")) return;
                    try {
                      await deleteDiagram(d.id);
                      await refreshDiagrams();
                    } catch (e) {
                      console.error(e);
                      alert("Could not delete diagram.");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty / no results */}
        {filteredDiagrams.length === 0 && (
          <div style={{ color: "#666", fontSize: 14, marginTop: 8 }}>No diagrams match your filters.</div>
        )}

        {/* Pagination controls */}
        {filteredDiagrams.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "#666", marginRight: "auto" }}>
              Showing {start + 1}-{Math.min(end, filteredDiagrams.length)} of {filteredDiagrams.length}
            </span>

            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageClamped === 1}>
              Prev
            </button>

            <span style={{ fontSize: 12, color: "#333" }}>
              Page {pageClamped} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageClamped === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Worked Examples */}
      <section>
        <h3>Worked Examples</h3>
        {examples.length === 0 && <div style={{ color: "#888" }}>No worked examples yet.</div>}
        {examples.map((e) => (
          <div key={e.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{e.difficulty}</div>
            <div style={{ fontWeight: 600 }}>{e.problem}</div>
            <ol>{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>

            {e.diagrams?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {e.diagrams.map((d) => (
                  <div key={d.id} style={{ border: "1px solid #ccc", borderRadius: 6, padding: 6, width: 220 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                      <strong>{d.name ?? d.kind}</strong>
                      <div style={{ fontSize: 11 }}>{d.kind}</div>
                      {d.difficulty && <DifficultyBadge diff={d.difficulty} />}
                    </div>
                    <DiagramThumb kind={d.kind} params={d.params} />
                    <button
                      onClick={async () => {
                        await detachDiagramFromExample(e.id, d.id);
                        const refreshed = await listWorkedExamplesWithDiagrams(selectedSub.id);
                        setExamples(refreshed);
                      }}
                      style={{ marginTop: 6, fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Practice Questions */}
      <section>
        <h3>Practice Questions</h3>
        {qs.length === 0 && <div style={{ color: "#888" }}>No practice questions yet.</div>}
        {qs.map((q) => (
          <div key={q.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#666" }}>
              {q.difficulty} · {q.type.toUpperCase()}
            </div>
            <div style={{ fontWeight: 600 }}>{q.prompt}</div>
            {q.type === "mcq" && <ul>{(q.options ?? []).map((o, i) => <li key={i}>{o}</li>)}</ul>}

            {q.diagrams?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {q.diagrams.map((d) => (
                  <div key={d.id} style={{ border: "1px solid #ccc", borderRadius: 6, padding: 6, width: 220 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                      <strong>{d.name ?? d.kind}</strong>
                      <div style={{ fontSize: 11 }}>{d.kind}</div>
                      {d.difficulty && <DifficultyBadge diff={d.difficulty} />}
                    </div>
                    <DiagramThumb kind={d.kind} params={d.params} />
                    <button
                      onClick={async () => {
                        await detachDiagramFromQuestion(q.id, d.id);
                        const refreshed = await listPracticeQuestionsWithDiagrams(selectedSub.id);
                        setQs(refreshed);
                      }}
                      style={{ marginTop: 6, fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Quick Quiz */}
      <section>
        <h3>Quick Quiz</h3>
        <select value={quizCount} onChange={(e) => setQuizCount(Number(e.target.value))}>
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
        <button
          onClick={() => {
            setActiveQuiz(pick(qs, quizCount));
            setAnswers({});
            setFinished(false);
          }}
          style={{ marginLeft: 8 }}
          disabled={qs.length === 0}
        >
          Start
        </button>

        {activeQuiz && (
          <div style={{ marginTop: 12 }}>
            {activeQuiz.map((q, idx) => (
              <div key={q.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Q{idx + 1} · {q.type.toUpperCase()} ({q.difficulty})
                </div>
                <div style={{ fontWeight: 600 }}>{q.prompt}</div>

                {q.diagrams?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
                    {q.diagrams.map((d) => (
                      <div key={d.id} style={{ border: "1px solid #ccc", borderRadius: 6, padding: 6, width: 220 }}>
                        <DiagramThumb kind={d.kind} params={d.params} />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "mcq" &&
                  (q.options ?? []).map((o, i) => (
                    <label key={i} style={{ display: "block" }}>
                      <input
                        type="radio"
                        name={q.id}
                        value={o}
                        checked={answers[q.id] === o}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      />{" "}
                      {o}
                    </label>
                  ))}
                {q.type === "fill" && (
                  <input
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                )}
                {q.type === "short" && (
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            {!finished && <button onClick={() => setFinished(true)}>Submit</button>}
            {finished && (
              <div>
                <p>
                  Score: {score}/{activeQuiz.length}
                </p>
                <button
                  onClick={() => {
                    const wrong = activeQuiz.filter(
                      (q) => (answers[q.id] ?? "").trim() !== (q.answer ?? "").trim()
                    );
                    setActiveQuiz(wrong);
                    setFinished(false);
                  }}
                >
                  Retry wrong ones
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/** Small badge component for difficulty */
function DifficultyBadge({ diff }: { diff: string }) {
  let bg = "#dcfce7", fg = "#166534";
  if (diff === "Intermediate") { bg = "#e0e7ff"; fg = "#3730a3"; }
  if (diff === "Advanced") { bg = "#fee2e2"; fg = "#991b1b"; }

  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 4,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        background: bg,
        color: fg,
      }}
    >
      {diff}
    </span>
  );
}
