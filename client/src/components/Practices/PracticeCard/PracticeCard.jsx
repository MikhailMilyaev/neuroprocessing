import React from "react";
import styles from "./PracticeCard.module.css";

const titleBySlug = (slug) => (slug === "good-bad" ? "Хорошо — Плохо" : slug);

export default function PracticeCard({ run, onOpen, onOpenActions }) {
  return (
    <div className={styles.card}>
      <button className={styles.main} onClick={onOpen}>
        <div className={styles.title}>{titleBySlug(run.practiceSlug)}</div>
        <div className={styles.meta}>Идея: {run.ideaText || "—"}</div>
      </button>

      <button
        className={styles.more}
        aria-label="Действия"
        title="Действия"
        onClick={onOpenActions}
      >
        <span className={styles.dots} aria-hidden>⋯</span>
      </button>
    </div>
  );
}
