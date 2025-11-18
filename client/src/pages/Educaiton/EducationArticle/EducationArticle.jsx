// src/pages/Educaiton/EducationArticle/EducationArticle.jsx
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { findEducationArticle } from "../../../components/Education/articles";
import classes from "./EducationArticle.module.css";

export default function EducationArticle() {
  const { articleId = "" } = useParams();
  const navigate = useNavigate();

  let outlet = {};
  try {
    outlet = useOutletContext() || {};
  } catch {}

  const onOpenSidebar = outlet.onOpenSidebar || (() => {});
  const isSidebarOpen = !!outlet.isSidebarOpen;

  const article = findEducationArticle(articleId);

  if (!article) {
    return (
      <div className={classes.wrap}>
        <header className={classes.header}>
          <button
            type="button"
            className={classes.back}
            onClick={() => navigate(-1)}
          >
            ← Назад
          </button>
          <h1 className={classes.title}>Статья не найдена</h1>
        </header>
      </div>
    );
  }

  return (
    <div className={classes.wrap}>
      <header className={classes.header}>
        <button
          type="button"
          className={classes.back}
          onClick={() => navigate(-1)}
        >
          ← Назад
        </button>

        <h1 className={classes.title}>{article.title}</h1>
      </header>

      <main className={classes.body}>
        {article.sections.map((section) => (
          <section key={section.id} className={classes.section}>
            {section.title && (
              <h2 className={classes.sectionTitle}>{section.title}</h2>
            )}

            {section.content_html && (
              <div
                className={classes.sectionContent}
                dangerouslySetInnerHTML={{ __html: section.content_html }}
              />
            )}

            {Array.isArray(section.children) &&
              section.children.map((child) => (
                <article key={child.id} className={classes.subSection}>
                  {child.title && (
                    <h3 className={classes.subTitle}>{child.title}</h3>
                  )}
                  {child.content_html && (
                    <div
                      className={classes.subContent}
                      dangerouslySetInnerHTML={{ __html: child.content_html }}
                    />
                  )}
                  {child.refs_html && (
                    <div
                      className={classes.refs}
                      dangerouslySetInnerHTML={{ __html: child.refs_html }}
                    />
                  )}
                </article>
              ))}

            {section.refs_html && (
              <div
                className={classes.refs}
                dangerouslySetInnerHTML={{ __html: section.refs_html }}
              />
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
