// src/pages/Education/Advanced/Advanced.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styles from './Advanced.module.css';
import sectionsRaw from './neuroprocessing_sections_v6.json';
import BackBtn from '../../../../components/BackBtn/BackBtn';
import { useNavigate } from 'react-router-dom';

/* ——— утилита: превращаем [n] в ссылки ——— */
const enhanceCitations = (nodes) => {
  const linkify = (html, sectionId) =>
    (html || '').replace(/\[(\d+)\]/g, (_m, n) => {
      const id = `ref-${sectionId}-${n}`;
      return `<a href="#${id}" class="citation">[${n}]</a>`;
    });

  const walk = (arr) =>
    arr.map((n) => ({
      ...n,
      content_html: linkify(n.content_html, n.id),
      children: n.children?.length ? walk(n.children) : [],
    }));

  return walk(nodes);
};

/* ——— сортировка по числовому префиксу ——— */
const sortChildrenByNumber = (nodes) => {
  const numKey = (t) => {
    const m = (t || '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (!m) return [9999, 0, 0];
    return [parseInt(m[1] || '0', 10), parseInt(m[2] || '0', 10), parseInt(m[3] || '0', 10)];
  };
  const walk = (arr) =>
    arr.map((n) => {
      const ch = n.children?.length
        ? [...n.children].sort((a, b) => {
            const ka = numKey(a.title), kb = numKey(b.title);
            return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
          })
        : [];
      return { ...n, children: ch.length ? walk(ch) : ch };
    });
  return walk(nodes);
};

const data = sortChildrenByNumber(enhanceCitations(sectionsRaw));

export default function Advanced() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);

  /* ——— оглавление ——— */
  const tocItems = useMemo(() => {
    const items = [];
    const walk = (nodes) => {
      nodes.forEach((n) => {
        items.push({ id: n.id, title: n.title, level: n.level });
        if (n.children?.length) walk(n.children);
      });
    };
    walk(data);
    return items;
  }, []);

  /* ——— подсветка активного заголовка ——— */
  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('[data-anchorable="1"]'));
    if (!headings.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries.slice().sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best && best.intersectionRatio >= 0.99) {
          const id = best.target.id;
          if (id !== activeId) setActiveId(id);
        }
      },
      { root: null, rootMargin: '0px', threshold: [0, 0.5, 0.99, 1] }
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [activeId]);

  /* ——— клики по [n] ——— */
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a.citation');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (!hash?.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add(styles.refHighlight);
      setTimeout(() => target.classList.remove(styles.refHighlight), 2000);
      const card = target.closest(`.${styles.refsBlock}`);
      if (card) {
        card.classList.add(styles.refCardHighlight);
        setTimeout(() => card.classList.remove(styles.refCardHighlight), 2000);
      }
      if (history.pushState) history.pushState(null, '', hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const tocIndent = (level) => {
    if (level <= 1) return undefined;
    if (level === 2) return styles.tocSub;
    return styles.tocSubDeep;
  };

  const Section = ({ node }) => {
    const Tag = node.level === 1 ? 'h2' : node.level === 2 ? 'h3' : 'h4';
    return (
      <section className={styles.section} aria-labelledby={node.id}>
        <Tag
          id={node.id}
          data-anchorable="1"
          className={node.level >= 2 ? styles.subsectionTitle : undefined}
        >
          {node.title}
        </Tag>

        <div
          className={styles.sectionBody}
          dangerouslySetInnerHTML={{ __html: node.content_html }}
        />

        {node.refs_html ? (
          <div className={styles.refsBlock} aria-label={`Источники к разделу ${node.title}`}>
            <div className={styles.refsTitle}>Источники к разделу</div>
            <div
              className={styles.refsList}
              dangerouslySetInnerHTML={{ __html: node.refs_html }}
            />
          </div>
        ) : null}

        {node.children?.length ? node.children.map((ch) => (
          <Section key={ch.id} node={ch} />
        )) : null}
      </section>
    );
  };

  return (
    <main className={styles.page}>
      {/* ДЕСКТОП: оглавление + BackBtn */}
      <aside className={styles.toc} aria-label="Оглавление">
        <BackBtn variant="fixed" preferFallback />
        <div className={styles.tocInner}>
          <div className={styles.tocTitle}>Оглавление</div>
          <nav>
            {tocItems.map((item) => (
              <div key={item.id} className={tocIndent(item.level)}>
                <a
                  className={`${styles.tocLink} ${activeId === item.id ? styles.tocLinkActive : ''}`}
                  href={`#${item.id}`}
                >
                  {item.title}
                </a>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* МОБИЛЬНЫЙ ФИКС-ХЕДЕР */}
      <div className={styles.mHeader}>
        <button
          type="button"
          className={styles.mBackBtn}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          ‹
        </button>
        <div className={styles.mTitle}>Подробная теория</div>
        <div className={styles.mRightGap} aria-hidden />
      </div>

      {/* МОБИЛЬНАЯ ПРОКРУТКА ТОЛЬКО КОНТЕНТА */}
      <div className={styles.mScroll}>
        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>
              Neuroprocessing: Подробная теория и научные обоснования
            </h1>
          </header>

          {data?.length ? data.map((sec) => <Section key={sec.id} node={sec} />) : (
            <p>Загружаю разделы…</p>
          )}

          <footer className={styles.footerNote}>
            Материал предназначен для самостоятельной работы и не заменяет клиническую помощь.
            При рисках для безопасности приоритет — обращение к специалисту.
          </footer>
        </article>
      </div>
    </main>
  );
}
