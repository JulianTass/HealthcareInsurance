import { createClient } from "@supabase/supabase-js";

// ---- Client ----
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error("Supabase URL/key missing. Check .env");
}

export const supabase = createClient(url, anon);

// ---- Types ----
export type DbTopic = {
  id: string;
  year: number;
  title: string;
  color?: string | null;
  summary?: string | null;
};

export type DbSubtopic = {
  id: string;
  topic_id: string;
  title: string;
  order_index: number;
  theory?: string | null;
  rules?: string | null;
};

export type DbDiagram = {
    id: string;
    subtopic_id: string;
    kind: string;      // e.g. "geometry/Angle"
    name?: string | null;   // NEW
    params: any;
    svg?: string | null;
    difficulty?: "Beginner" | "Intermediate" | "Advanced"; // you added this earlier
    created_at?: string;
};

export type WorkedExample = {
  id: string;
  subtopic_id: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  problem: string;
  steps: string[];
  created_at: string;
};

export type PracticeQ = {
  id: string;
  subtopic_id: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type: "mcq" | "fill" | "short";
  prompt: string;
  options: string[] | null;
  answer: string;
  created_at: string;
};

export type WithDiagrams<T> = T & { diagrams: DbDiagram[] };

// ---- Topics ----
export async function listTopics(year: number, q: string) {
  let query = supabase.from("topics").select("*").eq("year", year).order("title", { ascending: true });
  if (q?.trim()) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as DbTopic[];
}

// ---- Subtopics ----
export async function listSubtopics(topicId: string) {
  const { data, error } = await supabase
    .from("subtopics")
    .select("*")
    .eq("topic_id", topicId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data as DbSubtopic[];
}

export async function updateSubtopic(id: string, patch: Partial<DbSubtopic>) {
  const { data, error } = await supabase.from("subtopics").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as DbSubtopic;
}

// ---- Diagrams ----
export async function listDiagrams(subtopicId: string) {
  const { data, error } = await supabase.from("diagrams").select("*").eq("subtopic_id", subtopicId);
  if (error) throw error;
  return data as DbDiagram[];
}

export async function upsertDiagram(
    d: Partial<DbDiagram> & { subtopic_id: string; kind: string; params: any }
  ) {
    const { data, error } = await supabase
      .from("diagrams")
      .upsert(d)              // d may include { difficulty }
      .select()
      .single();
    if (error) throw error;
    return data as DbDiagram;
  }
// ---- Worked Examples ----
export async function addWorkedExample(
  subtopicId: string,
  ex: { difficulty: "Beginner" | "Intermediate" | "Advanced"; problem: string; steps: string[] }
) {
  const { data, error } = await supabase.from("worked_examples").insert({ subtopic_id: subtopicId, ...ex }).select().single();
  if (error) throw error;
  return data as WorkedExample;
}

export async function listWorkedExamplesWithDiagrams(subtopicId: string) {
  const { data, error } = await supabase
    .from("worked_examples")
    .select(`
      *,
      worked_example_diagrams (
        diagram_id,
        diagrams ( id, subtopic_id, kind, params, svg )
      )
    `)
    .eq("subtopic_id", subtopicId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    diagrams: (row.worked_example_diagrams ?? []).map((j: any) => j.diagrams),
  })) as WithDiagrams<WorkedExample>[];
}

export async function attachDiagramToExample(exampleId: string, diagramId: string) {
  const { error } = await supabase.from("worked_example_diagrams").insert({ example_id: exampleId, diagram_id: diagramId });
  if (error && error.code !== "23505") throw error;
}

export async function detachDiagramFromExample(exampleId: string, diagramId: string) {
  const { error } = await supabase
    .from("worked_example_diagrams")
    .delete()
    .eq("example_id", exampleId)
    .eq("diagram_id", diagramId);
  if (error) throw error;
}

// ---- Practice Questions ----
export async function addPracticeQuestion(
  subtopicId: string,
  q: {
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    type: "mcq" | "fill" | "short";
    prompt: string;
    options?: string[];
    answer: string;
  }
) {
  const { data, error } = await supabase.from("practice_questions").insert({ subtopic_id: subtopicId, ...q }).select().single();
  if (error) throw error;
  return data as PracticeQ;
}



export async function listPracticeQuestionsWithDiagrams(subtopicId: string) {
  const { data, error } = await supabase
    .from("practice_questions")
    .select(`
      *,
      practice_question_diagrams (
        diagram_id,
        diagrams ( id, subtopic_id, kind, params, svg )
      )
    `)
    .eq("subtopic_id", subtopicId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    diagrams: (row.practice_question_diagrams ?? []).map((j: any) => j.diagrams),
  })) as WithDiagrams<PracticeQ>[];
}

export async function attachDiagramToQuestion(questionId: string, diagramId: string) {
  const { error } = await supabase.from("practice_question_diagrams").insert({ question_id: questionId, diagram_id: diagramId });
  if (error && error.code !== "23505") throw error;
}

export async function detachDiagramFromQuestion(questionId: string, diagramId: string) {
  const { error } = await supabase
    .from("practice_question_diagrams")
    .delete()
    .eq("question_id", questionId)
    .eq("diagram_id", diagramId);
  if (error) throw error;
}

// ---- Import/Export Practice Questions ----
export async function bulkAddPracticeQuestions(subtopicId: string, qs: any[]) {
  const withSub = qs.map((q) => ({ ...q, subtopic_id: subtopicId }));
  const { data, error } = await supabase.from("practice_questions").insert(withSub).select();
  if (error) throw error;
  return data as PracticeQ[];
}

export async function exportPracticeQuestions(subtopicId: string) {
  const { data, error } = await supabase.from("practice_questions").select("*").eq("subtopic_id", subtopicId);
  if (error) throw error;
  return data as PracticeQ[];
}

export async function listDiagramsByDifficulty(subtopicId: string, difficulty: string) {
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .eq("subtopic_id", subtopicId)
      .eq("difficulty", difficulty);
    if (error) throw error;
    return data as DbDiagram[];
  }
  
  export async function deleteDiagram(id: string) {
    const { error } = await supabase.from("diagrams").delete().eq("id", id);
    if (error) throw error;
  }

  // --- NEW HELPERS ---

export async function createTopic(payload: {
  year: number;
  title: string;
  color?: string | null;
  summary?: string | null;
}) {
  const { data, error } = await supabase
    .from("topics")
    .insert({
      year: payload.year,
      title: payload.title,
      color: payload.color ?? null,
      summary: payload.summary ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DbTopic;
}

export async function deleteTopic(topicId: string) {
  const { error } = await supabase.from("topics").delete().eq("id", topicId);
  if (error) throw error;
}

export async function createSubtopic(topicId: string, title = "New subtopic") {
  // set to end by using max(order_index)+1
  const { data: maxRow, error: maxErr } = await supabase
    .from("subtopics")
    .select("order_index")
    .eq("topic_id", topicId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw maxErr;

  const nextIndex = (maxRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from("subtopics")
    .insert({ topic_id: topicId, title, order_index: nextIndex })
    .select("*")
    .single();
  if (error) throw error;
  return data as DbSubtopic;
}

export async function reorderSubtopics(topicId: string, orderedIds: string[]) {
  // Bulk update order_index by id
  const updates = orderedIds.map((id, idx) => ({
    id,
    order_index: idx + 1,
  }));
  const { error } = await supabase.from("subtopics").upsert(updates);
  if (error) throw error;
}

export async function renameTopic(topicId: string, title: string) {
  const { data, error } = await supabase
    .from("topics")
    .update({ title })
    .eq("id", topicId)
    .select("*")
    .single();
  if (error) throw error;
  return data as DbTopic;
}

  
  // --- Pack fetcher for Claude chat ---
export async function fetchPackForSubtopic(subtopicId: string) {
    // Fetch the subtopic details
    const { data: sub, error: subErr } = await supabase
      .from("subtopics")
      .select("id, title, theory, rules")
      .eq("id", subtopicId)
      .single();
    if (subErr) throw subErr;
  
    // Worked examples
    const { data: examples, error: exErr } = await supabase
      .from("worked_examples")
      .select("id, problem, steps, difficulty")
      .eq("subtopic_id", subtopicId);
    if (exErr) throw exErr;
  
    // Practice questions
    const { data: practices, error: pqErr } = await supabase
      .from("practice_questions")
      .select("id, prompt, answer, type, difficulty, options")
      .eq("subtopic_id", subtopicId);
    if (pqErr) throw pqErr;
  
    // Diagrams
    const { data: diagrams, error: dErr } = await supabase
      .from("diagrams")
      .select("id, kind, params, name, difficulty")
      .eq("subtopic_id", subtopicId);
    if (dErr) throw dErr;
  
    // Build a lookup so the tutor can reference diagrams by ID
    const diagramsById = Object.fromEntries(
      (diagrams ?? []).map((d) => [d.id, d])
    );
  
    return {
      id: sub.id,
      title: sub.title,
      theory: sub.theory,
      rules: sub.rules,
      examples: examples ?? [],
      practices: practices ?? [],
      diagramsById,
    };
  }
  