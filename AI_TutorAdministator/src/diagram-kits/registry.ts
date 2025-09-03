import type { DiagramModule, Config } from "./types";

const mods = import.meta.glob<DiagramModule>("./**/*.tsx", { eager: true });

export const DiagramRegistry: Record<string, React.ComponentType<any>> = {};
export const DiagramConfig:   Record<string, Config | undefined>        = {};

Object.entries(mods).forEach(([path, mod]) => {
  const key = path.replace("./", "").replace(/\.tsx$/, ""); // e.g., "geometry/Angle"
  DiagramRegistry[key] = mod.default;
  DiagramConfig[key]   = mod.config;
});

export const diagramKeys = Object.keys(DiagramRegistry).sort();
