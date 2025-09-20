import classes from './StoryCard.module.css';
import { useNavigate } from 'react-router-dom';
import { STORY_ROUTE } from '../../../../utils/consts';
import { useRef, useMemo, useEffect, useState } from 'react';

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const pluralDays = (n) => {
  const v = Math.abs(n) % 100;
  const v10 = v % 10;
  if (v > 10 && v < 20) return 'дней';
  if (v10 === 1) return 'день';
  if (v10 >= 2 && v10 <= 4) return 'дня';
  return 'дней';
};

const formatEditedAt = (raw) => {
  const d = toDate(raw);
  if (!d) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (d >= startOfToday) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (d >= startOfYesterday && d < startOfToday) return 'Вчера';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const StoryCard = ({
  id,
  title,
  archive,
  reevalDueAt,
  isHighlighted,
  updatedAt,
  updated_at,
  onContextMenu,
}) => {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [, forceDayTick] = useState(0);
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = nextMidnight.getTime() - now.getTime() + 1000;
    const tid = setTimeout(() => forceDayTick((x) => x + 1), ms);
    return () => clearTimeout(tid);
  }, [reevalDueAt]);

  const isTitleEmpty = !title?.trim();
  const displayTitle = isTitleEmpty ? 'Сформулируйте проблему' : title;

  const editedLabel = useMemo(
    () => formatEditedAt(updatedAt ?? updated_at),
    [updatedAt, updated_at]
  );

  const due = toDate(reevalDueAt);

  const daysLeft = useMemo(() => {
    if (!archive || !due) return null;
    const today = startOfDay(new Date());
    const d = startOfDay(due);
    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Math.floor((d.getTime() - today.getTime()) / ONE_DAY);
  }, [archive, due]);

  const handleRightRipple = (e) => {
    if (e.button !== 2) return;
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const wave = document.createElement('span');
    wave.className = `${classes.ripple} ${classes.rippleRight}`;
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;

    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  };

  return (
    <div className={classes.storiesList}>
      <button
        ref={btnRef}
        data-story-id={id}
        data-story-card=""
        className={`${classes.storyCard} ${isHighlighted ? classes.storyCardActive : ''}`}
        onMouseDown={handleRightRipple}
        onClick={() => navigate(`${STORY_ROUTE}/${id}`)}
        onContextMenu={onContextMenu}
        aria-label={displayTitle}
      >
        <span className={`${classes.titleText} ${isTitleEmpty ? classes.placeholderText : ''}`}>
          {displayTitle}
        </span>

        {archive && (
          due && daysLeft !== null ? (
            daysLeft === 0 ? (
              <span className={classes.dueBadge}>Сделайте переоценку</span>
            ) : (
              <span className={classes.dueRight}>
                Переоценка{' '}
                {daysLeft > 0 ? (
                  <>через {daysLeft} {pluralDays(daysLeft)}</>
                ) : (
                  <>
                    <span className={classes.overdueNumber}>{daysLeft}</span> {pluralDays(daysLeft)}
                  </>
                )}
              </span>
            )
          ) : (
            <span className={classes.dueBadge}>Сделайте переоценку</span>
          )
        )}

        {editedLabel && (
          <span className={classes.timeRight} aria-label="Последнее редактирование">
            {editedLabel}
          </span>
        )}
      </button>
    </div>
  );
};

export default StoryCard;
