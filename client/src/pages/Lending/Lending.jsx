import styles from "./Lending.module.css";
import { Link } from 'react-router-dom'

function Icon({ name, className }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "clock":   return (<svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>);
    case "target":  return (<svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.8"/></svg>);
    case "lock":    return (<svg {...common}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>);
    case "phone":   return (<svg {...common}><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>);
    case "warn":    return (<svg {...common}><path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><path d="M12 18h.01"/></svg>);
    case "chart":   return (<svg {...common}><path d="M3 20h18"/><rect x="4" y="10" width="3" height="6" rx="1"/><rect x="10.5" y="6" width="3" height="10" rx="1"/><rect x="17" y="12" width="3" height="4" rx="1"/></svg>);
    case "brain":   return (<svg {...common}><path d="M8 4a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3"/><path d="M8 4a3 3 0 0 1 3-2 3 3 0 0 1 3 2"/><path d="M16 4a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3"/><path d="M12 6v12"/></svg>);
    case "bolt":    return (<svg {...common}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>);
    case "repeat":  return (<svg {...common}><path d="M17 1v4h-4"/><path d="M7 23v-4h4"/><path d="M3.3 16a9 9 0 0 0 15.7-3"/><path d="M20.7 8A9 9 0 0 0 5 11"/></svg>);
    case "shield":  return (<svg {...common}><path d="M12 2l8 4v6a10 10 0 0 1-8 9 10 10 0 0 1-8-9V6l8-4z"/></svg>);
    case "check":   return (<svg {...common}><path d="M20 6L9 17l-5-5"/></svg>);
    case "note":    return (<svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>);
    case "book":    return (<svg {...common}><path d="M4 19a2 2 0 0 0 2 2h13"/><path d="M20 22V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13"/><path d="M6 18h14"/></svg>);
    case "scale":   return (<svg {...common}><path d="M12 3v18"/><path d="M7 7h10"/><path d="M5 7l-3 5h6l-3-5zM19 7l-3 5h6l-3-5z"/></svg>);
    case "hash":    return (<svg {...common}><path d="M5 9h14M5 15h14M9 3l-2 18M17 3l-2 18"/></svg>);
    case "cycle":   return (<svg {...common}><path d="M3 12a9 9 0 0 1 15-6l2-2v7h-7l2-2A6 6 0 1 0 18 12"/></svg>);
    case "archive": return (<svg {...common}><rect x="3" y="4" width="18" height="4" rx="2"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>);
    default:        return null;
  }
}

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.brand} aria-label="Нейропроцессинг — на главную">Neuroprocessing</a>
          <nav className={styles.nav}>
            <a href="#pain" className={styles.navLink}>Проблема</a>
            <a href="#market" className={styles.navLink}>Рынок</a>
            <a href="#usp" className={styles.navLink}>УТП</a>
            <a href="#how" className={styles.navLink}>Алгоритм</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
          </nav>
          <Link to='/login' className={styles.loginBtn}>Войти</Link>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Neuroprocessing — приложение для самостоятельной работы с психологическими проблемами
          </h1>
          <p className={styles.heroSubtitle}>
            Чёткий алгоритм работы с автоматизмами ума: выявите и ослабьте убеждения, которые диктуют ваше поведение.
          </p>

          <div className={styles.heroCtas}>
            <Link to='/login' className={styles.primaryCta}>Начать бесплатно</Link>
          </div>

          <div className={styles.heroBadges}>
            <span className={styles.pill}>Пошаговый алгоритм</span>
            <span className={styles.pill}>Прогресс в цифрах</span>
            <span className={styles.pill}>Полная анонимность</span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="pain" className={styles.problem}>
        <div className={styles.sectionHead}>
          <h2>Проблема: почему «просто терапия» не всегда решает</h2>
          <p className={styles.sectionLead}>Три барьера: доступность, качество и доверие.</p>
        </div>

        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}><Icon name="clock" className={styles.icon} /></div>
            <h3>Доступность</h3>
            <ul className={styles.list}>
              <li>Сессия 1–2 часа — не хватает для глубокой работы.</li>
              <li>Психолог не всегда доступен в нужный момент.</li>
              <li>Сложно подстроиться под график специалиста.</li>
              <li>Высокая стоимость (ср. цена по Москве 6000 р/час).</li>
            </ul>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}><Icon name="target" className={styles.icon} /></div>
            <h3>Качество</h3>
            <ul className={styles.list}>
              <li>Сложно найти «своего» специалиста.</li>
              <li>Нет прозрачной метрики эффективности.</li>
              <li>Трудно объективно оценить свой прогресс.</li>
            </ul>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}><Icon name="lock" className={styles.icon} /></div>
            <h3>Доверие</h3>
            <ul className={styles.list}>
              <li>Не всегда хочется делиться личным.</li>
              <li>Психолог невольно проектирует свой опыт и мировосприятие на клиента.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MARKET */}
      <section id="market" className={styles.problem}>
        <div className={styles.sectionHead}>
          <h2>Рынок IT-решений: что есть и где «тонко»</h2>
          <p className={styles.sectionLead}>Коротко о популярных подходах и их ограничениях.</p>
        </div>

        <div className={styles.cardsGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className={styles.card}>
            <div className={styles.cardIcon}><Icon name="phone" className={styles.icon} /></div>
            <h3>Что есть</h3>
            <ul className={styles.list}>
              <li>Headspace, Calm — медитация/релаксация.</li>
              <li>Woebot, Youper — чат-боты с базовой КПТ.</li>
              <li>Sanvello, MindDoc — трекеры настроения.</li>
            </ul>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}><Icon name="warn" className={styles.icon} /></div>
            <h3>Их недостатки</h3>
            <ul className={styles.list}>
              <li>Работают с симптомами, а не с корнем проблемы.</li>
              <li>Мало персонализации под конкретную ситуацию.</li>
              <li>Нет объективной системы оценки.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* USP */}
      <section id="usp" className={styles.problem}>
        <div className={styles.sectionHead}>
          <h2>Наше УТП: почему Neuroprocessing другой</h2>
          <p className={styles.sectionLead}>По порядку — как вы этим пользуетесь и что получаете.</p>
        </div>

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <Icon name="check" className={styles.featureIcon} />
            <div>
              <h3>Пошаговый протокол</h3>
              <p className={styles.text}>Чёткая структура без «воды». Подсказки на каждом шаге.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <Icon name="brain" className={styles.featureIcon} />
            <div>
              <h3>Работа с корнем</h3>
              <p className={styles.text}>Находим убеждения из вашей истории, а не гасим симптомы.</p>
            </div>
          </div>

          {/* 50+ исследований — третьей карточкой */}
          <div className={styles.featureItem}>
            <Icon name="book" className={styles.featureIcon} />
            <div>
              <h3>50+ исследований в основе алгоритма</h3>
              <p className={styles.text}>
                Каждый шаг подкреплён научными работами. Полный список доступен после регистрации в разделе «Теория с источниками».
              </p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <Icon name="bolt" className={styles.featureIcon} />
            <div>
              <h3>Приоритизация по «заряду»</h3>
              <p className={styles.text}>Сначала то, что сильнее всего влияет на поведение.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <Icon name="chart" className={styles.featureIcon} />
            <div>
              <h3>Психология в цифрах</h3>
              <p className={styles.text}>Шкала 0–10, сравнение «до/после», прогресс на графиках.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <Icon name="repeat" className={styles.featureIcon} />
            <div>
              <h3>Контрольные проверки</h3>
              <p className={styles.text}>Архив + напоминания, чтобы исключить рестимуляцию.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <Icon name="shield" className={styles.featureIcon} />
            <div>
              <h3>Полная анонимность</h3>
              <p className={styles.text}>База обезличена — историю невозможно связать с человеком.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW — 7 шагов */}
      <section id="how" className={styles.method}>
        <div className={styles.sectionHead}>
          <h2>Алгоритм (7 шагов)</h2>
          <p className={styles.sectionLead}>Выполняйте по порядку. Каждый шаг короткий и понятный.</p>
        </div>

        <div className={styles.stepsCol}>
          <div className={styles.step}>
            <Icon name="note" className={styles.stepIcon} />
            <div>
              <h3>1. Сформулируйте проблему одной фразой</h3>
              <p className={styles.text}>Убираем размытость и задаём вектор.</p>
              <p className={styles.example}><em>Пример:</em> «Мне сложно просить о помощи, даже когда не справляюсь».</p>
            </div>
          </div>

          <div className={styles.step}>
            <Icon name="book" className={styles.stepIcon} />
            <div>
              <h3>2. Опишите историю</h3>
              <p className={styles.text}>Факты, мысли, эмоции, телесные ощущения, ассоциации — без цензуры.</p>
              <p className={styles.example}><em>Мини-история:</em> «Дедлайн. Сердце колотится, мысль: “если попрошу — подведу”, всплыло из детства “не ной, решай сам”...</p>
            </div>
          </div>

          <div className={styles.step}>
            <Icon name="scale" className={styles.stepIcon} />
            <div>
              <h3>3. Выпишите из текста убеждения, которые диктуют поведение</h3>
              <p className={styles.text}>Переведите мысли в правила/директивы: «нельзя…», «должен…», «если…, то…».</p>
              <p className={styles.example}>
                <em>Список:</em> «Нельзя просить о помощи», «Если откажут — я никчёмный», «Ошибаться нельзя», «Должен справляться сам», «Просьба — признак слабости».
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <Icon name="hash" className={styles.stepIcon} />
            <div>
              <h3>4. Оцените психоэмоциональный «заряд» каждой идеи (0–10)</h3>
              <p className={styles.text}>Насколько сильно идея откликается у вас именно сейчас? Чем выше — тем приоритетнее.</p>
              <p className={styles.example}><em>Оценка:</em> «Нельзя просить о помощи» — 9; «Если откажут — я никчёмный» — 8; «Должен справляться сам» — 7…</p>
            </div>
          </div>

          <div className={styles.step}>
            <Icon name="book" className={styles.stepIcon} />
            <div>
              <h3>5. Перечитайте всю историю</h3>
              <p className={styles.text}>Перед переоценкой перечитайте текст целиком: всплывают детали, часть идей уже теряет «заряд».</p>
              <p className={styles.example}><em>Зачем:</em> реактивируем память целиком и открываем «окно пластичности».</p>
            </div>
          </div>

          <div className={styles.step}>
            <Icon name="cycle" className={styles.stepIcon} />
            <div>
              <h3>6. Переоцените список идей</h3>
              <p className={styles.text}>
                Возвращайтесь к идее, пересматривайте значимость и фиксируйте «заряд». <span className={styles.goalBadge}>Главная цель: довести заряд каждой идеи до <strong>0</strong>.</span>
              </p>
              <p className={styles.example}><em>Часто так:</em> 3–4 цикла снижают «заряд» ~80% идей; оставшиеся ~20% прорабатываются специальными практиками в приложении.</p>
            </div>
          </div>

          <div className={styles.step}>
            <Icon name="archive" className={styles.stepIcon} />
            <div>
              <h3>7. Контрольные проверки архивных историй</h3>
              <p className={styles.text}>
                Когда психоэмоциональный заряд всех идей истории = 0 — отправьте в историю в архив. Мы напомним через 1–2 недели, месяц и позже перечитать/переоценить список. Если «заряд» вернулся — история снова активна. И нужно повторить цикл проработки.
              </p>
              <p className={styles.textSmall}>Так избегаем рестимуляции и закрепляем результат надолго.</p>
            </div>
          </div>
        </div>

        {/* Отступ перед визуализацией */}
        <div className={styles.progressSpacer} />

        {/* Пример в цифрах — 8 идей */}
        <div className={styles.progressWidget}>
          <div className={styles.progressHeader}>
            <span className={styles.pill}>Как это выглядит в цифрах</span>
            <span className={`${styles.pill} ${styles.pillSoft}`}>История: «Просьба о помощи на работе»</span>
          </div>

          <div className={styles.bars}>
            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Нельзя просить о помощи»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth90}`} />
                <span className={`${styles.barGhost} ${styles.barWidth10}`} />
              </div>
              <div className={styles.barNumbers}><span>9</span><span>→</span><span>1</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Если откажут — я никчёмный»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth80}`} />
                <span className={`${styles.barGhost} ${styles.barWidth10}`} />
              </div>
              <div className={styles.barNumbers}><span>8</span><span>→</span><span>1</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Должен справляться сам»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth70}`} />
                <span className={`${styles.barGhost} ${styles.barWidth0}`} />
              </div>
              <div className={styles.barNumbers}><span>7</span><span>→</span><span>0</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Ошибаться нельзя»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth60}`} />
                <span className={`${styles.barGhost} ${styles.barWidth0}`} />
              </div>
              <div className={styles.barNumbers}><span>6</span><span>→</span><span>0</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Просьба — признак слабости»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth50}`} />
                <span className={`${styles.barGhost} ${styles.barWidth0}`} />
              </div>
              <div className={styles.barNumbers}><span>5</span><span>→</span><span>0</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Если попрошу — потеряю уважение»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth60}`} />
                <span className={`${styles.barGhost} ${styles.barWidth0}`} />
              </div>
              <div className={styles.barNumbers}><span>6</span><span>→</span><span>0</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Надо быть идеальным всегда»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth70}`} />
                <span className={`${styles.barGhost} ${styles.barWidth10}`} />
              </div>
              <div className={styles.barNumbers}><span>7</span><span>→</span><span>1</span></div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barLabel}>«Чужие просьбы важнее моих»</div>
              <div className={styles.barTrack}>
                <span className={`${styles.bar} ${styles.barWidth50}`} />
                <span className={`${styles.barGhost} ${styles.barWidth0}`} />
              </div>
              <div className={styles.barNumbers}><span>5</span><span>→</span><span>0</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Готовы начать?</h2>
        <p>Создайте аккаунт. Полная теория и источники — в кабинете.</p>
        <Link to='/login' className={styles.primaryCta}>Начать бесплатно</Link>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faq}>
        <div className={styles.sectionHead}>
          <h2>FAQ</h2>
        </div>
        <div className={styles.faqGrid}>
          <details className={styles.faqItem}>
            <summary>Это терапия?</summary>
            <p>Это структурная самопомощь. При острых состояниях — к специалисту.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Сколько времени занимает один цикл?</summary>
            <p>Зависит от объёма истории. Делайте шаги последовательно — приложение ведёт вас подсказками.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Что, если «заряд» не падает?</summary>
            <p>Используйте спец-практики для «упрямых» идей. Они появятся после базовой переоценки.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Как понять, что есть прогресс?</summary>
            <p>Смотрите на цифры «до/после» и графики динамики по каждой идее и истории в целом.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Данные безопасны?</summary>
            <p>Да. База обезличена — историю невозможно связать с конкретным человеком.</p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>Neuroprocessing</div>
          <div className={styles.footerLinks}>
            <a href="/terms">Условия</a>
            <a href="/privacy">Конфиденциальность</a>
            <a href="/contacts">Контакты</a>
          </div>
          <div className={styles.copy}>© {new Date().getFullYear()} Neuroprocessing</div>
        </div>
      </footer>
    </div>
  );
}
