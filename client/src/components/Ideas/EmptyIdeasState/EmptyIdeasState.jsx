import classes from './EmptyIdeasState.module.css';

export default function EmptyIdeasState({
  title = 'Пока нет идей',
  subtitle = 'Записывайте фиксированные идеи в течении дня для дальнейшей комплексной обработки.',
  ctaLabel = 'Добавить идею',
  onAdd,
}) {
  return (
    <div className={classes.wrapper}>
      <Illustration className={classes.illu} />
      <div className={classes.text}>
        <h2 className={classes.title}>{title}</h2>
        <p className={classes.subtitle}>{subtitle}</p>
      </div>

      {onAdd && (
        <div className={classes.actions}>
          <button className={classes.primaryBtn} onClick={onAdd}>
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function Illustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 512 512" role="img" aria-label="Пока нет идей">
      <defs>
        <linearGradient id="yPaper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFBEB"/>
          <stop offset="100%" stopColor="#FEF3C7"/>
        </linearGradient>
        <radialGradient id="yGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(251,191,36,0.55)" />
          <stop offset="60%"  stopColor="rgba(251,191,36,0.22)" />
          <stop offset="100%" stopColor="rgba(251,191,36,0)" />
        </radialGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect x="112" y="96" width="288" height="296" rx="20" fill="url(#yPaper)"/>
      <rect x="144" y="136" width="224" height="18" rx="9" fill="#F3EAD1"/>
      <rect x="144" y="168" width="192" height="18" rx="9" fill="#F3EAD1"/>
      <rect x="144" y="208" width="208" height="14" rx="7" fill="#F5E6BC"/>
      <rect x="144" y="236" width="164" height="14" rx="7" fill="#F5E6BC"/>

      <g transform="translate(360 332)">
        <circle cx="0" cy="0" r="86" fill="url(#yGlow)" filter="url(#soft)"/>
        <circle cx="0" cy="-10" r="26" fill="#FDE68A" stroke="#F59E0B" strokeWidth="3.5"/>
        <rect x="-14" y="10" width="28" height="14" rx="7" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2"/>
        <rect x="-16" y="28" width="32" height="6" rx="3" fill="#F59E0B" opacity=".95"/>
        <rect x="-14" y="38" width="28" height="6" rx="3" fill="#F59E0B" opacity=".85"/>

        <g stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity=".9">
          <line x1="0" y1="-46" x2="0" y2="-62"/>
          <line x1="32" y1="-28" x2="44" y2="-38"/>
          <line x1="42" y1="0" x2="58" y2="0"/>
          <line x1="32" y1="28" x2="44" y2="38"/>
          <line x1="-32" y1="-28" x2="-44" y2="-38"/>
          <line x1="-42" y1="0" x2="-58" y2="0"/>
          <line x1="-32" y1="28" x2="-44" y2="38"/>
        </g>
      </g>

      <circle cx="360" cy="332" r="100" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 10" strokeOpacity=".35"/>
    </svg>
  );
}
