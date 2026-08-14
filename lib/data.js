export const DEFAULT_CONFIG = {
  // Starter domains — rename, recolour, add or remove these in Settings.
  domains: [
    { id: "work", name: "Work", color: "#174b63" },
    { id: "writing", name: "Writing", color: "#268c9e" },
    { id: "people", name: "People", color: "#36adaf" },
    { id: "projects", name: "Projects", color: "#ce853b" },
    { id: "personal", name: "Personal", color: "#b04d50" },
  ],
};

export const DEFAULT_RECURRING = {
  templates: [],
};

export function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "project"}-${Date.now().toString(36).slice(-4)}`;
}

export function newStepId() {
  return "s" + Math.random().toString(36).slice(2, 8);
}
