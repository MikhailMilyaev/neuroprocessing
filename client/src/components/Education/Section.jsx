import styles from './Article.module.css';

export default function Section({ node }) {
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

      {node.children?.length
        ? node.children.map((ch) => <Section key={ch.id} node={ch} />)
        : null}
    </section>
  );
}
