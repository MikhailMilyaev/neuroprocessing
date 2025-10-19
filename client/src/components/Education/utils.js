// Заменяем упоминания вида [n] на кликабельные ссылки внутри статьи
export const enhanceCitations = (nodes) => {
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

// Сортировка дочерних секций по числовому префиксу заголовка: 1, 1.1, 1.2...
export const sortChildrenByNumber = (nodes) => {
  const numKey = (t) => {
    const m = (t || '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (!m) return [9999, 0, 0];
    return [
      parseInt(m[1] || '0', 10),
      parseInt(m[2] || '0', 10),
      parseInt(m[3] || '0', 10),
    ];
  };

  const walk = (arr) =>
    arr.map((n) => {
      const children = n.children?.length
        ? [...n.children].sort((a, b) => {
            const ka = numKey(a.title), kb = numKey(b.title);
            return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
          })
        : [];
      return { ...n, children: children.length ? walk(children) : children };
    });

  return walk(nodes);
};
