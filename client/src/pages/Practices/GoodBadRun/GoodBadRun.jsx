import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoChevronBackOutline } from "react-icons/io5";
import BackBtn from "../../../components/BackBtn/BackBtn";
import styles from "./GoodBadRun.module.css";

const decodeIdea = (slug = "") =>
  decodeURIComponent(String(slug).replace(/-/g, " ")).trim();

const buildTemplate = (ideaRaw) => {
  const i = ideaRaw || "…ваша идея…";
  return [
    [`Я разрешаю себе создавать и поддерживать идею «${i}» — и это хорошо.`],
    [
      `Я больше не буду воссоздавать и поддерживать идею «${i}» — и это хорошо.`,
      `Я осознанно, осмысленно, произвольно и необратимо отменяю её в прошлом, настоящем и будущем.`,
    ],
    [
      `Я позволяю себе вернуть ресурс, который блокировала идея «${i}» — и это хорошо.`,
      `Я возвращаю части себя, которые могут действовать осознанно, осмысленно и произвольно в области этой идеи, а также свою ответственность, сброшенную в этой области.`,
      `Я интегрирую эти ресурсы на уровне духа, ума и тела и даю им достойное место в своей жизни и духовном пространстве.`,
    ],
    [`Я разрешаю себе создавать и поддерживать идею «${i}» — и это плохо.`],
    [
      `Я больше не буду воссоздавать и поддерживать идею «${i}» — и это плохо.`,
      `Я осознанно, осмысленно, произвольно и необратимо отменяю её в прошлом, настоящем и будущем.`,
    ],
    [
      `Я позволяю себе вернуть ресурс, который блокировала идея «${i}» — и это плохо.`,
      `Я возвращаю части себя, которые могут действовать осознанно, осмысленно и произвольно в области этой идеи, а также свою ответственность, сброшенную в этой области.`,
      `Я интегрирую эти ресурсы на уровне духа, ума и тела и даю им достойное место в своей жизни и духовном пространстве.`,
    ],
  ];
};

export default function GoodBadRun() {
  const { ideaSlug } = useParams();
  const navigate = useNavigate();

  const ideaText = useMemo(() => decodeIdea(ideaSlug), [ideaSlug]);
  const blocks = useMemo(() => buildTemplate(ideaText), [ideaText]);

  // Мобилка: запрет скролла документа/резинки
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width:700px)").matches;
    if (!isMobile) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPos = document.body.style.position;
    const prevBodyInset = document.body.style.inset;
    const prevTouch = document.body.style.touchAction;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.inset = "0";
    document.body.style.touchAction = "none";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPos;
      document.body.style.inset = prevBodyInset;
      document.body.style.touchAction = prevTouch;
    };
  }, []);

  // обработчик для BackBtn — только для ПК
  const handleBackClick = () => {
    const isMobile = window.matchMedia("(max-width:700px)").matches;
    if (!isMobile) {
      navigate("/practices");
    }
  };

  return (
    <div className={styles.viewport}>
      {/* ПК: отдельная кнопка назад — перенаправляет на /practices */}
      <BackBtn
        className={styles.backBtnDesktop}
        preferFallback
        onClick={handleBackClick}
      />

      {/* Мобилка: sticky-хедер */}
      <header className={styles.mobileHeader}>
        <button
          type="button"
          className={styles.mobileBack}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          <IoChevronBackOutline />
        </button>
        <h1 className={styles.mobileTitle}>Хорошо — Плохо</h1>
        <div aria-hidden className={styles.mobileRightStub} />
      </header>

      {/* Прокручиваемый контент */}
      <main className={styles.scroll}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h2 className={styles.title}>Практика «Хорошо — Плохо»</h2>
            <div className={styles.idea}>
              Идея: <span className={styles.ideaText}>«{ideaText || "…"}»</span>
            </div>
          </header>

          <ol className={styles.list}>
            {blocks.map((paras, idx) => (
              <li key={idx} className={styles.item}>
                {paras.map((p, i) => (
                  <p key={i} className={styles.phrase}>{p}</p>
                ))}
              </li>
            ))}
          </ol>

          <div className={styles.bottomPad} />
        </div>
      </main>
    </div>
  );
}
