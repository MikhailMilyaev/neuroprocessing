// src/pages/Practices/GoodBadRun/GoodBadRun.jsx
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackBtn from "../../../components/BackBtn/BackBtn";
import styles from "./GoodBadRun.module.css";

/** простейший декодер — из slug обратно в текст идеи */
const decodeIdea = (slug = "") =>
  decodeURIComponent(String(slug).replace(/-/g, " ")).trim();

/** генерация «четырёх формул» и 2х «возвратов ресурса» */
const buildPhrases = (idea) => {
  const i = idea || "…ваша идея…";
  return [
    {
      id: "p1",
      title: "1) Поддерживаю — это хорошо",
      text: `Я разрешаю себе создавать и поддерживать идею: «${i}» — и это хорошо.`,
    },
    {
      id: "p2",
      title: "2) Не поддерживаю — это хорошо",
      text:
        `Я больше не буду воссоздавать и поддерживать идею: «${i}» — и это хорошо. ` +
        `Я осознанно, осмысленно, произвольно и необратимо отменяю её в прошлом, настоящем и будущем.`,
    },
    {
      id: "p3",
      title: "3) Возврат ресурса (после «…и это хорошо»)",
      text:
        `Я позволяю себе вернуть ресурс, который блокировала идея: «${i}» — и это хорошо. ` +
        `Если прямо сейчас не понимаю, что именно — возвращаю части Я, которые могут действовать ` +
        `осознанно, осмысленно и произвольно в области «${i}», а также свою ответственность, ` +
        `сброшенную в этой области. Я интегрирую эти ресурсы на уровне духа, ума и тела ` +
        `и даю им достойное место в своей жизни и духовном пространстве.`,
    },
    {
      id: "p4",
      title: "4) Поддерживаю — это плохо",
      text: `Я разрешаю себе создавать и поддерживать идею: «${i}» — и это плохо.`,
    },
    {
      id: "p5",
      title: "5) Не поддерживаю — это плохо",
      text:
        `Я больше не буду воссоздавать и поддерживать идею: «${i}» — и это плохо. ` +
        `Я осознанно, осмысленно, произвольно и необратимо отменяю её в прошлом, настоящем и будущем.`,
    },
    {
      id: "p6",
      title: "6) Возврат ресурса (после «…и это плохо»)",
      text:
        `Я позволяю себе вернуть ресурс, который блокировала идея: «${i}» — и это плохо. ` +
        `Если прямо сейчас не понимаю, что именно — возвращаю части Я, которые могут действовать ` +
        `осознанно, осмысленно и произвольно в области «${i}», а также свою ответственность, ` +
        `сброшенную в этой области. Я интегрирую эти ресурсы на уровне духа, ума и тела ` +
        `и даю им достойное место в своей жизни и духовном пространстве.`,
    },
  ];
};

export default function GoodBadRun() {
  const { ideaSlug } = useParams();
  const navigate = useNavigate();

  const ideaText = useMemo(() => decodeIdea(ideaSlug), [ideaSlug]);
  const steps = useMemo(() => buildPhrases(ideaText), [ideaText]);

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {}
  };

  return (
    <main className={styles.page}>
      <BackBtn preferFallback className={styles.back} />
      <header className={styles.header}>
        <h1 className={styles.title}>Практика «Хорошо — Плохо»</h1>
        <div className={styles.idea}>
          Идея: <span className={styles.ideaText}>«{ideaText || "…" }»</span>
        </div>
        <p className={styles.lead}>
          Говорите вслух (можно шёпотом), с вниманием к ощущениям в теле.
          Цель — «расфиксировать» идею в теле через четыре формулы и два возврата ресурса.
        </p>
      </header>

      <ol className={styles.list}>
        {steps.map((s, idx) => (
          <li key={s.id} className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.stepNum}>Шаг {idx + 1}</div>
              <div className={styles.cardTitle}>{s.title}</div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.phrase}>{s.text}</p>
              <div className={styles.actions}>
                <button className={styles.btn} onClick={() => copy(s.text)}>
                  Скопировать фразу
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <footer className={styles.footer}>
        <button className={styles.btnGhost} onClick={() => navigate(-1)}>
          Готово
        </button>
      </footer>
    </main>
  );
}
