import { useEffect, useMemo, useRef, useState } from 'react';
import classes from './education.module.css';
import articleData from './education.json';

export default function Education() {
  const sections = useMemo(() => {
    if (Array.isArray(articleData)) return articleData;
    if (articleData && Array.isArray(articleData.sections)) return articleData.sections;
    return [];
  }, []);

  const toc = useMemo(() => {
    const items = [];
    const walk = (arr) => {
      arr.forEach((s) => {
        if (s?.title && s?.id) items.push({ id: s.id, title: s.title, level: s.level ?? 1 });
        if (Array.isArray(s?.children) && s.children.length) walk(s.children);
      });
    };
    walk(sections);
    return items;
  }, [sections]);

  const [activeId, setActiveId] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (articleData?.title) document.title = articleData.title;
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [sections]);

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('[data-edu-heading="1"]'));
    if (!headings.length) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] }
    );

    headings.forEach((h) => observerRef.current.observe(h));
    return () => observerRef.current?.disconnect();
  }, [sections]);

  const handleTocClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.history.replaceState(null, '', `#${id}`);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderSection = (s) => {
    const level = Math.min(Math.max(Number(s.level || 1), 1), 6);
    const Tag = `h${level}`;

    return (
      <section key={s.id} className={classes.section}>
        {s.title && s.id && (
          <Tag id={s.id} data-edu-heading="1" className={classes.heading}>
            {s.title}
          </Tag>
        )}

        {s.content_html && (
          <div
            className={classes.contentHtml}
            dangerouslySetInnerHTML={{ __html: s.content_html }}
          />
        )}

        {s.refs_html && (
          <div
            className={classes.refsHtml}
            dangerouslySetInnerHTML={{ __html: s.refs_html }}
          />
        )}

        {Array.isArray(s.children) && s.children.length > 0 && (
          <div className={classes.children}>
            {s.children.map((child) => renderSection(child))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className={classes.wrap}>
      <aside className={classes.toc}>
        <div className={classes.tocTitle}>Оглавление</div>
        <nav>
          <ul className={classes.tocList}>
            {toc.map((i) => (
              <li
                key={i.id}
                className={`${classes.tocItem} ${activeId === i.id ? classes.active : ''}`}
                style={{ paddingLeft: (i.level - 1) * 12 }}
              >
                <a href={`#${i.id}`} onClick={(e) => handleTocClick(e, i.id)}>
                  {i.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className={classes.article}>
        {articleData?.title && <h1 className={classes.pageTitle}>{articleData.title}</h1>}
        {sections.map((s) => renderSection(s))}
      </main>
    </div>
  );
}