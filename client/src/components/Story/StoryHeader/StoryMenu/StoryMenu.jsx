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

// ширина меню должна совпадать с CSS
const MENU_W = 243;
const MARGIN = 8;

const StoryMenu = ({
  open,
  position,                 // { x, y } — координаты триггера (иконки меню)
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

  // мобилка?
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width:900px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width:900px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // открыть/закрыть native <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  // сброс подменю при закрытии
  useEffect(() => { if (!open) setShowFreq(false); }, [open]);

  // hover-логика для десктопа
  useEffect(() => {
    if (!isMobile && remindersEnabled && isHoveringReminders) setShowFreq(true);
    if (!remindersEnabled) setShowFreq(false);
  }, [isMobile, remindersEnabled, isHoveringReminders]);

  // мобилка: по клику разворачиваем частоты
  const toggleFreqMobile = () => {
    if (!isMobile) return;
    setShowFreq(v => !v);
  };

  // ======= единое умное позиционирование (и для ПК, и для мобилки) =======
  let vw = 0;
  let headerH = 56;
  if (typeof window !== 'undefined') {
    vw = window.innerWidth || 0;
    const cssH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--story-header-h')
    );
    if (!Number.isNaN(cssH) && cssH > 0) headerH = cssH;
  }

  // исходные координаты от триггера
  const pxX = typeof position?.x === 'number' ? position.x : (vw - MARGIN);
  const pxY = typeof position?.y === 'number' ? position.y : (headerH + 6);

  // Ставим ПРАВЫЙ край меню под точку триггера: left = x - MENU_W
  let calcLeft = pxX - MENU_W;

  // Кламп границ, чтобы не вылезать за экран
  calcLeft = Math.min(calcLeft, vw - MENU_W - MARGIN); // не выйти справа
  calcLeft = Math.max(calcLeft, MARGIN);               // не уйти влево за край

  // Топ — как минимум под фикс-хедером
  const calcTop = Math.max(pxY, headerH + 6);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classes.menuDialog}
      style={undefined} // сам диалог — просто оверлей
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      aria-label="Меню истории"
    >
      <div
        className={classes.menu}
        style={{ top: `${calcTop}px`, left: `${calcLeft}px` }}
        role="menu"
        onClick={(e) => e.stopPropagation()} // клики внутри — не закрывают
        onMouseLeave={() => { if (!isMobile) setIsHoveringReminders(false); }}
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
          onMouseEnter={() => !isMobile && setIsHoveringReminders(true)}
          onMouseLeave={() => !isMobile && setIsHoveringReminders(false)}
          onClick={toggleFreqMobile}
        >
          <IoNotificationsOutline className={classes.icon} />
          <span className={classes.label}>Подсказки</span>
          <label className={classes.switch} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={!!remindersEnabled}
              onChange={(e) => {
                onToggleReminders?.(e.target.checked);
                if (!e.target.checked) setShowFreq(false);
              }}
            />
            <span className={classes.slider} />
          </label>
        </div>

        {remindersEnabled && (
          <div className={`${classes.freqPanel} ${((showFreq || (isMobile && remindersEnabled)) ? classes.open : '')}`}>
            <div className={classes.submenuTitle}>Смена вопросов каждые</div>
            {FREQ_OPTS.map(opt => (
              <label key={String(opt.value)} className={classes.submenuOption}>
                <input
                  type="radio"
                  name="reminderFreq"
                  value={opt.value ?? ''}
                  checked={(opt.value ?? null) === (reminderFreqSec ?? null)}
                  onChange={() => onChangeReminderFreq?.(opt.value ?? null)}
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
