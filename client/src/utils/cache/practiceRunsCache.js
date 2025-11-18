import { ns } from "../ns";

const KEY = () => ns("practice_runs:index");

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readPracticeRunsIndex() {
  try {
    const raw = localStorage.getItem(KEY());
    const arr = safeParse(raw);
    if (!Array.isArray(arr)) return [];

    return arr.map((r) => ({
      id: r.id,
      practiceSlug: r.practiceSlug ?? r.practice_slug ?? "",
      ideaSlug: r.ideaSlug ?? r.idea_slug ?? "",
      ideaText: r.ideaText ?? r.idea_text ?? "",
      createdAt: r.createdAt ?? r.created_at ?? null,
      updatedAt: r.updatedAt ?? r.updated_at ?? null,
      state: r.state ?? {},
    }));
  } catch {
    return [];
  }
}

export function writePracticeRunsIndex(list) {
  try {
    const payload = (Array.isArray(list) ? list : []).map((r) => ({
      id: r.id,
      practiceSlug: r.practiceSlug ?? r.practice_slug ?? "",
      ideaSlug: r.ideaSlug ?? r.idea_slug ?? "",
      ideaText: r.ideaText ?? r.idea_text ?? "",
      createdAt: r.createdAt ?? r.created_at ?? null,
      updatedAt: r.updatedAt ?? r.updated_at ?? null,
      state: r.state ?? {},
    }));
    localStorage.setItem(KEY(), JSON.stringify(payload));
  } catch {}
}

export function removeFromPracticeRunsIndex(id) {
  try {
    const raw = localStorage.getItem(KEY());
    const arr = safeParse(raw);
    const list = Array.isArray(arr) ? arr : [];
    const next = list.filter((r) => Number(r.id) !== Number(id));
    localStorage.setItem(KEY(), JSON.stringify(next));
  } catch {}
}
