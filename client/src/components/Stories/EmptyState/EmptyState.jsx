import classes from './EmptyState.module.css';

const Illustrations = {
  active: ({ className }) => (
    <svg className={className} viewBox="0 0 512 512" role="img" aria-label="Нет активных историй">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#10b981"/>
        </linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="100%" stopColor="#a7f3d0"/>
        </linearGradient>
      </defs>
      <rect x="96" y="80" width="320" height="352" rx="28" fill="url(#g2)"/>
      <rect x="120" y="112" width="272" height="288" rx="14" fill="white"/>
      <rect x="160" y="152" width="192" height="20" rx="10" fill="#e5e7eb"/>
      <rect x="160" y="196" width="192" height="20" rx="10" fill="#e5e7eb"/>
      <rect x="160" y="240" width="140" height="20" rx="10" fill="#e5e7eb"/>
      <circle cx="392" cy="360" r="48" fill="url(#g1)"/>
      <rect x="386" y="332" width="12" height="56" rx="6" fill="white"/>
      <rect x="364" y="354" width="56" height="12" rx="6" fill="white"/>
    </svg>
  ),
  archive: ({ className }) => (
    <svg className={className} viewBox="0 0 512 512" role="img" aria-label="Архив пуст">
      <defs>
        <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#a78bfa"/>
        </linearGradient>
        <linearGradient id="g4" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#dbeafe"/>
        </linearGradient>
      </defs>
      <rect x="96" y="160" width="320" height="200" rx="16" fill="url(#g4)"/>
      <rect x="80" y="120" width="352" height="64" rx="16" fill="url(#g3)"/>
      <rect x="176" y="192" width="160" height="16" rx="8" fill="#ffffffaa"/>
      <rect x="176" y="220" width="160" height="16" rx="8" fill="#ffffffaa"/>
      <rect x="176" y="248" width="120" height="16" rx="8" fill="#ffffffaa"/>
      <circle cx="392" cy="128" r="8" fill="white"/>
      <circle cx="120" cy="128" r="8" fill="white"/>
    </svg>
  ),
};

export default function EmptyState({
  variant = 'active',           
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  secondaryCtaLabel,
  onSecondaryClick,
}) {
  const Icon = Illustrations[variant] || Illustrations.active;
  const iconClass = `${classes.illu} ${variant === 'archive' ? classes.illuTight : ''}`;

  return (
    <div className={classes.wrapper}>
      <Icon className={iconClass} />
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
