import { NavLink } from 'react-router-dom';
import styles from './MobileNav.module.css';
import {
  STORIES_ROUTE,
  IDEAS_ROUTE,
  EDUCATION_ROUTE,
  SETTINGS_ROUTE,          // <-- добавили
} from '../../utils/consts';
import {
  IoBookOutline,
  IoBulbOutline,
  IoListOutline,
  IoSchoolOutline,
  IoSettingsOutline,
} from 'react-icons/io5';

export default function MobileNav() {
  const items = [
    { to: STORIES_ROUTE,     label: 'Истории',   Icon: IoListOutline },
    { to: IDEAS_ROUTE,       label: 'Идеи',      Icon: IoBulbOutline },
    { to: EDUCATION_ROUTE,   label: 'Обучение',  Icon: IoSchoolOutline },
    { to: SETTINGS_ROUTE,    label: 'Настройки', Icon: IoSettingsOutline }, // <-- сюда
  ];

  return (
    <nav className={styles.nav} aria-label="Основная навигация">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={`${to}-${label}`}
          to={to}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        >
          <Icon className={styles.icon} aria-hidden="true" />
          <span className={styles.text}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
