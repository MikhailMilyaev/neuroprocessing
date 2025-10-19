import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackBtn from '../BackBtn/BackBtn';
import useActiveHeading from './useActiveHeading';
import Section from './Section';
import styles from './Article.module.css';

export default function ArticleShell({ pageTitle, mobileTitle, sections }) {
  const navigate = useNavigate();
  const activeId = useActiveHeading();

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

  const tocItems = useMemo(() => {
    const res = [];
    const walk = (nodes) => nodes.forEach(n => {
      res.push({ id: n.id, title: n.title, level: n.level || 1 });
      if (n.children?.length) walk(n.children);
    });
    walk(sections || []);
    return res;
  }, [sections]);

  const tocIndent = (level) =>
    level <= 1 ? undefined : (level === 2 ? styles.tocSub : styles.tocSubDeep);

  return (
    <main className={styles.page}>
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

      <div className={styles.mHeader}>
        <button
          type="button"
          className={styles.mBackBtn}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          ‹
        </button>
        <div className={styles.mTitle}>{mobileTitle}</div>
        <div className={styles.mRightGap} aria-hidden />
      </div>

      <div className={styles.mScroll}>
        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>{pageTitle}</h1>
          </header>

          {(sections || []).map((sec) => <Section key={sec.id} node={sec} />)}

          <footer className={styles.footerNote}>
            Материал предназначен для самостоятельной работы и не заменяет клиническую помощь.
            При рисках — к специалисту.
          </footer>
        </article>
      </div>
    </main>
  );
}
