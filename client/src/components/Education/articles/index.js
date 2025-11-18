import baseSections from "./base.json";

export const educationArticles = [
  {
    id: "base",
    title: "Neuroprocessing: базовая статья",
    sections: baseSections,
  },
];

export const findEducationArticle = (idOrSlug = "") => {
  const key = decodeURIComponent(String(idOrSlug).trim());
  return educationArticles.find((a) => a.id === key);
};
