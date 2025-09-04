import { create } from "zustand";
import type { DbTopic, DbSubtopic } from "../api/supabase";
import { listTopics, listSubtopics } from "../api/supabase";

export type Topic = DbTopic;
export type Subtopic = DbSubtopic;

type AdminState = {
  year: number;
  q: string;
  topics: Topic[];
  subtopics: Subtopic[];
  selectedTopic?: Topic;
  selectedSub?: Subtopic;
  loading: boolean;

  setYear: (y: number) => void;
  setQ: (q: string) => void;

  /** async */
  fetchTopics: () => Promise<void>;
  fetchSubtopics: (topicId: string) => Promise<void>;

  pickTopic: (t: Topic) => void;
  pickSub: (s: Subtopic) => void;

  updateSubtopicLocal: (patch: Partial<Subtopic> & { id: string }) => void;
};

export const useAdmin = create<AdminState>((set, get) => ({
  year: 7,
  q: "",
  topics: [],
  subtopics: [],
  selectedTopic: undefined,
  selectedSub: undefined,
  loading: false,

  setYear: (year) => set({ year }),
  setQ: (q) => set({ q }),

  fetchTopics: async () => {
    const { year, q } = get();
    set({ loading: true });
    try {
      const data = await listTopics(year, q);
      set({ topics: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchSubtopics: async (topicId: string) => {
    set({ loading: true });
    try {
      const data = await listSubtopics(topicId);
      set({ subtopics: data });
    } finally {
      set({ loading: false });
    }
  },

  pickTopic: (selectedTopic) => {
    set({ selectedTopic, selectedSub: undefined, subtopics: [] });
    get().fetchSubtopics(selectedTopic.id);
  },

  pickSub: (selectedSub) => set({ selectedSub }),

  updateSubtopicLocal: (patch) =>
    set((s) => ({
      subtopics: s.subtopics.map((x) => (x.id === patch.id ? { ...x, ...patch } : x)),
      selectedSub: s.selectedSub?.id === patch.id ? { ...s.selectedSub, ...patch } : s.selectedSub,
    })),
}));
