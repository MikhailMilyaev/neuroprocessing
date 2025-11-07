import { useMemo, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import styles from "./GoodBad.module.css";
import PracticeHeader from "../../../components/Practice/PracticeHeader/PracticeHeader";

const decodeIdea = (slug = "") =>
  decodeURIComponent(String(slug).replace(/-/g, " ")).trim();

const buildTemplate = (ideaRaw) => {
  const i = ideaRaw || "…ваша идея…";
  return [
    [`Я разрешаю себе создавать и поддерживать идею «${i} и это хорошо».`],
    [
      `Я больше не буду воссоздавать и поддерживать идею «${i} и это хорошо».`,
      `Я осознанно, осмысленно, произвольно и необратимо отменяю идею «${i} и это хорошо» в прошлом, настоящем и будущем.`,
    ],
    [
      `Я позволяю себе вернуть ресурс, который блокировала идея «${i} и это хорошо».`,
      `Возвращаю части Я, которые могут действовать осознанно, осмысленно и произвольно в области идеи «${i} и это хорошо», а также свою ответственность, сброшенную в этой области.`,
      `Я интегрирую эти ресурсы на уровне духа, ума и тела и даю им достойное место в своей жизни и духовном пространстве.`,
    ],
    [`Я разрешаю себе создавать и поддерживать идею «${i} и это плохо».`],
    [
      `Я больше не буду воссоздавать и поддерживать идею «${i} и это плохо».`,
      `Я осознанно, осмысленно, произвольно и необратимо отменяю идею «${i} и это плохо» в прошлом, настоящем и будущем.`,
    ],
    [
      `Я позволяю себе вернуть ресурс, который блокировала идея «${i} и это плохо».`,
      `Возвращаю части Я, которые могут действовать осознанно, осмысленно и произвольно в области идеи «${i} и это плохо», а также свою ответственность, сброшенную в этой области.`,
      `Я интегрирую эти ресурсы на уровне духа, ума и тела и даю им достойное место в своей жизни и духовном пространстве.`,
    ],
  ];
};

export default function GoodBadRun() {
  const { practiceSlug = "good-bad", ideaSlug = "" } = useParams();
  const ideaText = useMemo(() => decodeIdea(ideaSlug), [ideaSlug]);

  let outlet = {};
  try { outlet = useOutletContext() || {}; } catch {}
  const onOpenSidebar = outlet.onOpenSidebar || (() => {});
  const isSidebarOpen = !!outlet.isSidebarOpen;

  useEffect(() => {}, []);

  const sections = useMemo(() => buildTemplate(ideaText), [ideaText]);

  return (
    <div className={styles.viewport}>
      <header className={styles.headerSticky} data-lock-scroll="true">
        <PracticeHeader
          practiceSlug={practiceSlug}
          ideaText={ideaText}
          onOpenSidebar={onOpenSidebar}
          isSidebarOpen={isSidebarOpen}
        />
      </header>

      <main className={styles.content}>
        <ol className={styles.list}>
          {sections.map((lines, idx) => (
            <li key={idx} className={styles.item}>
              {lines.map((t, j) => (
                <p key={j} className={styles.line}>{t}</p>
              ))}
              <div className={styles.reminder}>
                Сделайте паузу 5–10 секунд (или больше).
              </div>
            </li>
          ))}
        </ol>

        <section className={styles.finalNote}>
          Повторите шаблон с этой идеей несколько раз (1–4 раза или больше),
          затем переходите к следующей идее или к переоценке всего списка.
          Продолжение следует…
        </section>
      </main>
    </div>
  );
}
