import styles from "./Landing.module.css";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

function Icon({ name, className }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "note":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19a2 2 0 0 0 2 2h13" />
          <path d="M20 22V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13" />
          <path d="M6 18h14" />
        </svg>
      );
    case "archive":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="4" rx="2" />
          <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 20h18" />
          <rect x="4" y="10" width="3" height="6" rx="1" />
          <rect x="10.5" y="6" width="3" height="10" rx="1" />
          <rect x="17" y="12" width="3" height="4" rx="1" />
        </svg>
      );
    case "brain":
      return (
        <svg {...common}>
          <path d="M8 4a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3" />
          <path d="M8 4a3 3 0 0 1 3-2 3 3 0 0 1 3 2" />
          <path d="M16 4a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3" />
          <path d="M12 6v12" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    case "repeat":
      return (
        <svg {...common}>
          <path d="M17 1v4h-4" />
          <path d="M7 23v-4h4" />
          <path d="M3.3 16a9 9 0 0 0 15.7-3" />
          <path d="M20.7 8A9 9 0 0 0 5 11" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 2l8 4v6a10 10 0 0 1-8 9 10 10 0 0 1-8-9V6l8-4z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Landing() {
  const progressData = [
    { label: "«Слабость — это просить»", before: 8, after: 7 },
    { label: "«Ошибаться нельзя»", before: 7, after: 6 },
    { label: "«Если попрошу — потеряю уважение»", before: 10, after: 7 },
    { label: "«Должен справляться сам всегда»", before: 9, after: 7 },
    { label: "«Просить о помощи нельзя»", before: 5, after: 3 },
  ];
  const avgBefore = Math.round((progressData.reduce((s, x) => s + x.before, 0) / progressData.length) * 10) / 10;
  const avgAfter  = Math.round((progressData.reduce((s, x) => s + x.after, 0) / progressData.length) * 10) / 10;
  const improvement = Math.round(((avgBefore - avgAfter) / avgBefore) * 100);

  const headerRef = useRef(null);
  const pageRef = useRef(null);
  const scrollerRef = useRef(null);
  const imgRefs = useRef([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // фиксируем высоту хедера в CSS-переменной
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setH = () => {
      const h = el.getBoundingClientRect().height || 64;
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    const ro = new ResizeObserver(setH);
    ro.observe(el);
    setH();
    window.addEventListener('load', setH);
    return () => {
      ro.disconnect();
      window.removeEventListener('load', setH);
    };
  }, []);

  // белый цвет темы для этой страницы
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevColor = meta?.getAttribute('content') ?? null;
    document.documentElement.classList.add('landing-white');
    if (meta) meta.setAttribute('content', '#ffffff');
    return () => {
      document.documentElement.classList.remove('landing-white');
      if (meta && prevColor) meta.setAttribute('content', prevColor);
    };
  }, []);

  // слайдер: выставляем active-класс текущему изображению
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const applyActive = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setCurrentSlide(idx);
      imgRefs.current.forEach((img, i) => {
        if (!img) return;
        if (i === idx) img.classList.add(styles.show);
        else img.classList.remove(styles.show);
      });
    };
    applyActive();
    const onScroll = () => requestAnimationFrame(applyActive);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", applyActive);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", applyActive);
    };
  }, []);

  const scrollByPage = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const slides = [
    { src: "/assets/algorithm/1.png", title: "Сформулируйте проблему, опишите историю, выпишите убеждения и оцените их.", icon: "note",  scale: 0.8 },
    { src: "/assets/algorithm//2.png", title: "Перечитайте историю и переоцените список первый раз (кнопка «Переоценить» в настройках).", icon: "repeat", scale: 0.8 },
    { src: "/assets/algorithm/3.png", title: "Перечитайте историю и переоцените список второй раз.", icon: "repeat", scale: 0.8 },
    { src: "/assets/algorithm/4.png", title: "Перечитайте историю и переоцените список третий раз.",  icon: "repeat", scale: 0.8 },
    { src: "/assets/algorithm/5.png", title: "После 3–4 переоценок 80% убеждений теряет заряд. Для оставшихся примените практику и переоцените список снова.", icon: "brain", scale: 0.6 },
    { src: "/assets/algorithm/6.png", title: "Цель: через практики и переоценки свести заряд каждого убеждения к 0, что означает полную проработку истории.", icon: "check", scale: 0.8 },
    { src: "/assets/algorithm/7.png", title: "Архивируйте историю — программа напомнит пересмотреть позже для проверки.", icon: "archive", scale: 0.8 },
  ];

  return (
    <div className={styles.page} ref={pageRef}>
      <header className={styles.header} ref={headerRef}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.brand} aria-label="Нейропроцессинг — на главную">
            <span className={styles.brandText}>Neuroprocessing</span>
          </a>
          <nav className={styles.nav}>
            <a href="#usp" className={styles.navLink}>Почему выбирают нас?</a>
            <a href="#how" className={styles.navLink}>Алгоритм</a>
            <a href="#faq" className={styles.navLink}>Частые вопросы</a>
          </nav>
          <Link to="/login" className={styles.loginBtn}>Войти</Link>
        </div>
      </header>

      <section id="top" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.brandMark}>Neuroprocessing</span> — приложение для самостоятельной работы с психологическими проблемами
          </h1>
          <p className={styles.heroSubtitle}>
            Чёткий алгоритм для выявления и переосмысления автоматизмов ума, которые диктуют ваше поведение.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/login" className={styles.primaryCta}>Начать бесплатно</Link>
          </div>
          <div className={styles.heroBadges}/>
        </div>
      </section>

      <section id="pain" className={`${styles.sectionMuted} ${styles.bgPain}`}>
        <div className={styles.problem}>
          <div className={styles.sectionHead}>
            <h2>Почему классическая терапия не всегда помогает?</h2>
          </div>

          {(() => {
            const painData = [
              {
                title: "Доступность",
                icon: "note",
                items: [
                  "Формат ограничен временем и частотой встреч; между сессиями не всегда хватает пространства для самостоятельной работы.",
                  "Психолог не всегда доступен в нужный момент; сложно подстроиться под график специалиста.",
                  "Очередь к востребованным специалистам может тянуться неделями.",
                  "Стоимость для многих остаётся высокой, особенно при длительной терапии.",
                  "В небольших городах выбор квалифицированных специалистов ограничен.",
                  "Онлайн-терапия частично решает проблему доступности, но не подходит всем по формату общения.",
                ],
              },
              {
                title: "Качество",
                icon: "chart",
                items: [
                  "Сложно найти «своего» специалиста.",
                  "Эффективность терапии трудно измерить объективно — нет единых критериев оценки, и прогресс часто ощущается субъективно.",
                  "Подходы различаются по методам и доказательной базе; не всегда ясно, что подходит именно вам.",
                  "Качество сильно зависит от личного опыта, квалификации и вовлечённости специалиста.",
                ],
              },
              {
                title: "Доверие",
                icon: "shield",
                items: [
                  "Не всегда легко делиться личным, особенно на первых этапах терапии.",
                  "Иногда формируется эмоциональная зависимость, что снижает автономность клиента.",
                  "Каждый специалист опирается на ограниченный набор подходов.",
                  "Специалист может непреднамеренно проецировать личные взгляды на клиента.",
                  "Разные взгляды на жизнь и ценности могут мешать ощущению полного понимания и принятия.",
                ],
              },
            ];

            const [showAllPain, setShowAllPain] = useState(false);

            // ⬇️ Оставляем плавный скролл ТОЛЬКО на десктопе.
            useEffect(() => {
              if (!showAllPain) return;
              const isDesktop =
                typeof window !== "undefined" &&
                window.matchMedia("(min-width: 721px)").matches;
              if (!isDesktop) return;

              const target = document.querySelector("#pain");
              if (!target) return;
              const headerH = headerRef?.current?.getBoundingClientRect().height ?? 64;
              const y = Math.max(
                0,
                Math.round(window.scrollY + target.getBoundingClientRect().top - headerH + 2)
              );
              try {
                window.scrollTo({ top: y, behavior: "smooth" });
              } catch {
                window.scrollTo(0, y);
              }
            }, [showAllPain]);

            const top3 = (arr) => arr.slice(0, 3);
            const rest = (arr) => arr.slice(3);

            return (
              <>
                <div className={`${styles.cardsGrid} ${styles.cardsEqual}`}>
                  {painData.map(({ title, icon, items }) => (
                    <div className={styles.card} key={title}>
                      <div className={styles.cardHeader}>
                        <Icon name={icon} className={styles.icon} />
                        <h3>{title}</h3>
                      </div>

                      <ul className={`${styles.list} ${styles.listTop}`}>
                        {top3(items).map((t, i) => <li key={i}>{t}</li>)}
                      </ul>

                      {rest(items).length > 0 && (
                        <ul
                          className={`${styles.list} ${styles.listMore}`}
                          style={{ display: showAllPain ? "block" : "none" }}
                        >
                          {rest(items).map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      )}

                      <div className={styles.cardSpacer} />
                    </div>
                  ))}
                </div>

                <div className={styles.painToggleWrap}>
                  <button
                    type="button"
                    className={styles.painToggleBtn}
                    onClick={() => setShowAllPain((prev) => !prev)}
                    aria-expanded={showAllPain}
                  >
                    {showAllPain ? "Скрыть" : "Показать ещё"}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      <section id="usp" className={`${styles.sectionLight} ${styles.bgUsp}`}>
        <div className={styles.problem}>
          <div className={styles.sectionHead}>
            <h2>Почему выбирают Neuroprocessing?</h2>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <Icon name="check" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Пошаговый алгоритм</h3>
                <p className={styles.textSmall}>Чёткая структура из этапов, ведущих от осознания проблемы к переоценке каждого убеждения.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <Icon name="brain" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Работа с глубинными убеждениями</h3>
                <p className={styles.textSmall}>Метод направлен не только на эмоции, но и на изменение базовых мыслительных процессов.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <Icon name="book" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Научная основа</h3>
                <p className={styles.textSmall}>Алгоритм создан на основе 50+ академических исследований по психологии и нейронауке.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <Icon name="bolt" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Измеримость результата</h3>
                <p className={styles.textSmall}>Каждое убеждение оценивается по уровню эмоционального заряда и отслеживается в динамике.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <Icon name="chart" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Мониторинг прогресса</h3>
                <p className={styles.textSmall}>Вы видите, как постепенно снижается интенсивность убеждений.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <Icon name="repeat" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Контрольные переоценки</h3>
                <p className={styles.textSmall}>Система напоминает выполнять проверки для закрепления устойчивого результата.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <Icon name="shield" className={styles.featureIcon} />
              <div className={styles.textCol}>
                <h3>Полная анонимность</h3>
                <p className={styles.textSmall}>Все этапы выполняются самостоятельно, без участия терапевта и без передачи личных данных.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className={styles.sectionDark}>
        <div className={styles.programFinal}>
          <div className={styles.programFinalInner}>
            <div className={styles.sectionHeadDark}>
              <h2>Пошаговый алгоритм</h2>
            </div>

            <div className={styles.sliderViewport} ref={scrollerRef}>
              {slides.map((item, i) => (
                <div className={styles.slide} key={i}>
                  <div className={styles.titleCardFull}>
                    <span className={styles.stepBadge}>Шаг {i + 1}</span>
                    <span className={styles.titleIconWrap}>
                      <Icon name={item.icon} className={styles.titleIcon} />
                    </span>
                    <span className={styles.titleTextFull}>{item.title}</span>
                  </div>

                  <div className={styles.shotBox}>
                    <img
                      ref={(el) => (imgRefs.current[i] = el)}
                      src={item.src}
                      alt={item.title}
                      className={styles.programShot}
                      style={{ transform: `scale(${item.scale})` }}
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollByPage(-1)}
              className={`${styles.navBtn} ${styles.navLeft} ${currentSlide === 0 ? styles.navBtnHidden : ""}`}
              aria-label="Предыдущий слайд"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={() => scrollByPage(1)}
              className={`${styles.navBtn} ${styles.navRight} ${currentSlide === (slides.length - 1) ? styles.navBtnHidden : ""}`}
              aria-label="Следующий слайд"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section id="progress" className={`${styles.sectionMuted} ${styles.bgProgress}`}>
        <div className={styles.progressSection}>
          <div className={styles.sectionHead}>
            <h2>Следи за объективным прогрессом</h2>
          </div>

          <div className={styles.progressWidget}>
            <div className={styles.progressHeader}>
              <span className={styles.pill}>История: «Просьба о помощи на работе»</span>
              <span className={`${styles.pill} ${styles.pillInfo}`}>Прогресс после первой переоценки</span>
              <span className={`${styles.pill} ${styles.pillAccent}`}>
                Снижение заряда на: {improvement}%
              </span>
            </div>

            <div className={styles.bars}>
              {progressData.map((row) => {
                const beforePct = Math.max(0, Math.min(10, row.before)) * 10;
                const afterPct  = Math.max(0, Math.min(10, row.after))  * 10;

                return (
                  <div className={styles.barRow} key={row.label}>
                    <div className={styles.barLabel}>{row.label}</div>

                    <div className={styles.barTrack} aria-label={`${row.before} → ${row.after}`}>
                      <span
                        className={`${styles.bar} ${styles.barBefore}`}
                        style={{ width: `${beforePct}%` }}
                      />
                      <span
                        className={`${styles.bar} ${styles.barAfter}`}
                        style={{ width: `${afterPct}%` }}
                      />
                    </div>

                    <div className={styles.barNumbers}>
                      <span>{row.before}</span><span>→</span><span>{row.after}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionDark}>
        <div className={styles.cta}>
          <h2>Готовы начать?</h2>
          <p>Создайте аккаунт. Полная теория в кабинете.</p>
          <Link to="/login" className={`${styles.primaryCta} ${styles.primaryCtaOnDark}`}>Начать бесплатно</Link>
        </div>
      </section>

      <section id="faq" className={`${styles.sectionLight} ${styles.bgFaq}`}>
        <div className={styles.faq}>
          <div className={styles.sectionHead}>
            <h2>Частые вопросы</h2>
          </div>
          <div className={styles.faqGrid}>
            <details className={styles.faqItem}>
              <summary>Это терапия?</summary>
              <p>Нет. Neuroprocessing — это структурная самопомощь. Она не заменяет психотерапию, но может дополнять её между сессиями. При острых состояниях обращайтесь к специалисту.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Для кого подходит метод?</summary>
              <p>Для людей, которые замечают повторяющиеся эмоциональные сценарии. Метод помогает осознать глубинные убеждения и работать с ними самостоятельно.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Можно ли использовать вместе с терапией?</summary>
              <p>Да. Neuroprocessing можно проходить параллельно с личной терапией. Это помогает глубже понять, что происходит между сессиями, и повышает эффективность самой терапии: человек приходит подготовленным, с осознаниями и конкретными данными, благодаря чему работа с психологом идёт быстрее и глубже.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Что я получу в результате?</summary>
              <p>Вы научитесь распознавать автоматические реакции, снижать эмоциональный заряд и видеть, как ситуации перестают вас цеплять. Постепенно вы начинаете действовать иначе в тех обстоятельствах, где раньше застревали, а эффект закрепляется навсегда с помощью контрольных проверок.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>Безопасно ли хранить данные?</summary>
              <p>Да. Все истории и оценки обезличены и не связаны с конкретным человеком. Вся работа выполняется на вашей стороне.</p>
            </details>
          </div>
        </div>
      </section>

      <section id="faq-algo" className={`${styles.sectionMuted} ${styles.bgFaqAlgo}`}>
        <div className={styles.faq}>
          <div className={styles.sectionHead}>
            <h2>Частые вопросы по алгоритму</h2>
          </div>
          <div className={styles.faqGrid}>
            <details className={styles.faqItem}>
              <summary>1. Что такое психологическая проблема и как связана с автоматизмом ума?</summary>
              <p>Психологическая проблема возникает, когда человек реагирует на новые ситуации по старым шаблонам. Автоматизм ума заставляет повторять прежние решения, даже если они уже не подходят, — так сохраняется внутренний конфликт.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>2. Что такое автоматизм ума?</summary>
              <p>Это устойчивое убеждение или внутреннее правило вроде «нельзя ошибаться» или «должен справляться сам». Оно запускает типичные реакции в похожих ситуациях и формирует привычные сценарии поведения.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>3. Как сформулировать проблему своими словами?</summary>
              <p>Сформулируйте коротко, одним предложением, без оценок и обобщений. Так внимание сосредотачивается на сути, а не на деталях или эмоциях вокруг.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>4. Как описывать историю?</summary>
              <p>Опишите всё, что вспоминается: события, мысли, эмоции и телесные ощущения. Важно фиксировать и негативные, и позитивные элементы, в том числе те, что кажутся не по теме.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>5. Как выделять автоматические убеждения из текста?</summary>
              <p>После описания перечитайте историю и выпишите фразы, звучащие как директивы: «нельзя», «должен», «если…, то…». Именно они отражают автоматизмы, управляющие реакцией.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>6. Как оценивать психоэмоциональный заряд (0–10)?</summary>
              <p>0 — спокойствие, 10 — сильное напряжение или страх. Оцените, насколько сильно убеждение вас цепляет сейчас — так можно увидеть объективную динамику.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>7. Что такое переоценка и зачем она?</summary>
              <p>Переоценка — это повторное вдумчивое чтение истории и выписанных автоматизмов. Она помогает ослабить эмоциональную реакцию, проанализировать и изменить старый паттерн поведения.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>8. Какие интервалы переоценок в активной истории?</summary>
              <p>Оптимально — 1–3 дня между циклами. Повторы с интервалами позволяют мозгу закрепить новый опыт и стабильно снижать заряд.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>9. Почему после 3–4 переоценок ≈80 % убеждений теряют силу?</summary>
              <p>Повторные переоценки активируют старые воспоминания и переписывают их эмоциональный след. Через несколько циклов мозг фиксирует новое восприятие, и большинство автоматизмов естественно обнуляются.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>10. Что делать с оставшимися ≈20 % убеждений?</summary>
              <p>Выберите самый заряженный автоматизм и пройдите любую практику с ним. Затем перечитайте историю и выполните переоценку; повторяйте цикл, пока заряд всех автоматизмов не станет нулевым.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>11. Что делать, если заряд не падает?</summary>
              <p>Проверьте технику: полностью ли описали историю, правильно ли выделили автоматизмы, перечитывали ли историю полностью перед переоценкой, переоценили ли несколько раз список убеждений и соблюдали ли интервалы?</p>
            </details>

            <details className={styles.faqItem}>
              <summary>12. Что значит архивировать историю?</summary>
              <p>Когда все убеждения обнулились, перенесите историю переносится в архив. Это значит, что эмоциональный заряд снят и автоматизмы больше не управляют поведением.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>13. Интервалы для архивной истории (контрольные проверки)</summary>
              <p>Система напомнит вернуться к истории через неделю, две и месяц. Эти проверки подтверждают, что результат устойчив и заряд не возвращается.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>14. Если в архивной истории автоматизм вернулся?</summary>
              <p>Повторите цикл: перечитайте историю, выделите идеи, оцените заряд и выполните переоценки с интервалами. Иногда глубокие паттерны требуют второго прохода.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>15. Как визуализируется прогресс?</summary>
              <p>Каждая идея отображается на графике: видно, как заряд падает с 8→5→2→0. Это помогает увидеть, что изменения реальны и измеримы.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>16. Какова цель методики?</summary>
              <p>Цель — свести заряд всех автоматизмов ума к нулю. Это значит, что человек переосмыслил их, и они больше не управляют его реакциями и решениями.</p>
            </details>

            <details className={styles.faqItem}>
              <summary>17. Где найти объяснения всем шагам алгоритма с научные ссылки?</summary>
              <p>Полная теория доступна после регистрации: каждое правило подробно описано и подкреплено научными исследованиями из психологии и нейронауки.</p>
            </details>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <a href="#top" className={styles.footerBrand} aria-label="К началу страницы">
            <span>Neuroprocessing</span>
          </a>
          <div className={styles.footerLinks}>
            <a href="/">Условия</a>
            <a href="/">Конфиденциальность</a>
            <a href="/">Контакты</a>
          </div>
          <div className={styles.copy}>© {new Date().getFullYear()} Neuroprocessing</div>
        </div>
      </footer>

      <Link to="/login" className={styles.floatingBtn} aria-label="Начать Neuroprocessing">
        Начать
      </Link>
    </div>
  );
}
