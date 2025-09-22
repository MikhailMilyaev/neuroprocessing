const RU_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",

  А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e", Ё: "e",
  Ж: "zh", З: "z", И: "i", Й: "y", К: "k", Л: "l", М: "m",
  Н: "n", О: "o", П: "p", Р: "r", С: "s", Т: "t", У: "u",
  Ф: "f", Х: "h", Ц: "ts", Ч: "ch", Ш: "sh", Щ: "shch",
  Ъ: "", Ы: "y", Ь: "", Э: "e", Ю: "yu", Я: "ya",
};

function transliterate(str) {
  return String(str || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/./g, (ch) => RU_MAP[ch] ?? ch);
}

function slugify(title) {
  const t = transliterate(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const trimmed = t.slice(0, 120);
  return trimmed || null;
}

function draftSlug() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `draft-${rand}`;
}

module.exports = { slugify, draftSlug };
