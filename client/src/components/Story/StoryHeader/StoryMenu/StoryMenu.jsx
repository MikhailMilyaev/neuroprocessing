import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoNotificationsOutline } from "react-icons/io5";
import { RiArchive2Fill } from "react-icons/ri";
import { LuArrowUpDown } from "react-icons/lu";
import { TbRefresh } from "react-icons/tb";
import classes from './StoryMenu.module.css';

const FREQ_OPTS = [
  { label: '10 секунд', value: 10 },
  { label: '20 секунд', value: 20 },
  { label: '30 секунд', value: 30 },
  { label: '45 секунд', value: 45 },
  { label: '60 секунд', value: 60 },
  { label: '90 секунд', value: 90 },
  { label: '120 секунд', value: 120 },
  { label: 'Не менять', value: null },
];

const StoryMenu = ({
  open,
  position,
  onClose,
  onSort,
  onReevaluate,
  remindersEnabled,
  onToggleReminders,
  reminderFreqSec = 30,
  onChangeReminderFreq,
  archiveEnabled,
  onToggleArchive,
  sorted,
  onArchiveStory, 
}) => {
  const dialogRef = useRef(null);
  const [showFreq, setShowFreq] = useState(false);
  const [isHoveringReminders, setIsHoveringReminders] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const handleClickOutside = (e) => { if (e.target === el) onClose?.(); };
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };

    if (open) {
      el.addEventListener('click', handleClickOutside);
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      el.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  const top = typeof position?.y === "number" ? `${position.y}px` : position?.y;
  const left = typeof position?.x === "number" ? `${position.x}px` : position?.x;

  useEffect(() => { if (!open) setShowFreq(false); }, [open]);

  useEffect(() => {
    if (remindersEnabled && isHoveringReminders) {
      setShowFreq(true);
    } else if (!remindersEnabled) {
      setShowFreq(false);
    }
  }, [remindersEnabled, isHoveringReminders]);

  const handleRemindersMouseEnter = () => {
    setIsHoveringReminders(true);
    if (remindersEnabled) setShowFreq(true);
  };
  const handleRemindersMouseLeave = () => {
    setIsHoveringReminders(false);
    setShowFreq(false);
  };

  const handleToggleReminders = (checked) => {
    onToggleReminders?.(checked);
    if (checked && isHoveringReminders) setShowFreq(true);
    if (!checked) setShowFreq(false);
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classes.menuDialog}
      style={{ top, left }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Меню истории"
    >
      <div
        className={classes.menu}
        role="menu"
        onMouseLeave={() => { setShowFreq(false); setIsHoveringReminders(false); }}
      >
        <button className={classes.item} role="menuitem" onClick={() => { onSort?.(); onClose?.(); }}>
          <LuArrowUpDown className={classes.icon} />
          <span className={classes.label}>{sorted ? 'Вернуть' : 'Сортировать'}</span>
        </button>

        <button className={classes.item} role="menuitem" onClick={() => { onReevaluate?.(); onClose?.(); }}>
          <TbRefresh className={classes.icon} />
          <span className={classes.label}>Переоценить</span>
        </button>

        <button
          className={classes.item}
          role="menuitem"
          onClick={() => { onClose?.(); onArchiveStory?.(); }}
        >
          <RiArchive2Fill className={classes.icon} />
          <span className={classes.label}>Архивировать историю</span>
        </button>

        <div
          className={`${classes.item} ${classes.switchRow}`}
          role="menuitem"
          onMouseEnter={handleRemindersMouseEnter}
          onMouseLeave={handleRemindersMouseLeave}
        >
          <IoNotificationsOutline className={classes.icon} />
          <span className={classes.label}>Подсказки</span>
          <label className={classes.switch}>
            <input
              type="checkbox"
              checked={!!remindersEnabled}
              onChange={(e) => handleToggleReminders(e.target.checked)}
            />
            <span className={classes.slider} />
          </label>
        </div>

        {remindersEnabled && (
          <div
            className={`${classes.freqPanel} ${showFreq ? classes.open : ''}`}
            onMouseEnter={() => setShowFreq(true)}
          >
            <div className={classes.submenuTitle}>Смена вопросов каждые</div>
            {FREQ_OPTS.map(opt => (
              <label key={String(opt.value)} className={classes.submenuOption}>
                <input
                  type="radio"
                  name="reminderFreq"
                  value={opt.value ?? ''}
                  checked={(opt.value ?? null) === (reminderFreqSec ?? null)}
                  onChange={() => {
                    onChangeReminderFreq?.(opt.value ?? null);
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className={`${classes.item} ${classes.switchRow}`} role="menuitem">
          <RiArchive2Fill className={classes.icon} />
          <span className={classes.label}>Архив идей</span>
          <label className={classes.switch}>
            <input
              type="checkbox"
              checked={!!archiveEnabled}
              onChange={(e) => onToggleArchive?.(e.target.checked)}
            />
            <span className={classes.slider} />
          </label>
        </div>
      </div>
    </dialog>,
    document.getElementById('storyMenu')
  );
};

export default StoryMenu;
