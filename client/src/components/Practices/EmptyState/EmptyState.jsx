import classes from "./EmptyState.module.css";

const PracticeIllu = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 512 512"
    role="img"
    aria-label="Пока нет запущенных практик"
  >
    <defs>
      <linearGradient id="p1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <linearGradient id="p2" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="100%" stopColor="#e5f9ef" />
      </linearGradient>
      <linearGradient id="p3" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
    </defs>

    <rect x="96" y="88" width="320" height="336" rx="24" fill="url(#p2)" />
    <rect x="120" y="120" width="272" height="272" rx="14" fill="#fff" />

    <rect x="152" y="156" width="208" height="18" rx="9" fill="#e5e7eb" />
    <rect x="152" y="186" width="176" height="14" rx="7" fill="#edf1f5" />

    <rect x="140" y="226" width="188" height="14" rx="7" fill="#e5e7eb" />
    <rect x="140" y="254" width="224" height="14" rx="7" fill="#e5e7eb" />
    <rect x="140" y="282" width="170" height="14" rx="7" fill="#e5e7eb" />
    <rect x="140" y="310" width="210" height="14" rx="7" fill="#e5e7eb" />

    <g transform="translate(356, 340)">
      <circle cx="0" cy="0" r="52" fill="url(#p1)" />
      <polygon points="-10,-18 18,0 -10,18" fill="#fff" />
    </g>

    <rect x="168" y="88" width="176" height="20" rx="10" fill="url(#p3)" />
  </svg>
);

export default function MtState({
  title = "Пока нет запущенных практик",
  subtitle = "Создайте практику и выберите шаблон.",
  ctaLabel = "Добавить практику",
  onCtaClick,
  secondaryCtaLabel,
  onSecondaryClick,
}) {
  return (
    <div className={classes.wrapper}>
      <PracticeIllu className={`${classes.illu}`} />

      <div className={classes.text}>
        <h2 className={classes.title}>{title}</h2>
        {subtitle && <p className={classes.subtitle}>{subtitle}</p>}
      </div>

      <div className={classes.actions}>
        {ctaLabel && (
          <button className={classes.primaryBtn} onClick={onCtaClick}>
            {ctaLabel}
          </button>
        )}
        {secondaryCtaLabel && (
          <button className={classes.secondaryBtn} onClick={onSecondaryClick}>
            {secondaryCtaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
