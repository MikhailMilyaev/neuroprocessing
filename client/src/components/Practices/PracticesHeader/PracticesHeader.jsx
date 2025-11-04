import React from "react";
import styles from "./PracticesHeader.module.css";

export default function PracticesHeader({ onAdd }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Практики</h1>
      <button
        type="button"
        className={styles.addBtn}
        onClick={onAdd}
        aria-label="Добавить практику"
        title="Добавить практику"
      >
        Добавить
      </button>
    </header>
  );
}
