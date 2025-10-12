import { useEffect, useState } from 'react';
import { adminListUsers, adminGrant } from '../../http/adminApi';
import Toast from '../../components/Toast/Toast';
import s from './AdminUsers.module.css';

// Простая модалка подтверждения
function ConfirmModal({ open, title = 'Подтвердить действие', text = 'Выдать подписку на 30 дней?', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className={s.modalBackdrop} role="dialog" aria-modal="true">
      <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={s.modalTitle}>{title}</h3>
        <p className={s.modalText}>{text}</p>
        <div className={s.modalButtons}>
          <button className={s.btnSecondary} onClick={onCancel}>Отменить</button>
          <button className={s.btnPrimary} onClick={onConfirm}>Подтвердить</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // для модалки подтверждения
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState(null);
  const [busyGrant, setBusyGrant] = useState(false);

  // тост
  const [toast, setToast] = useState({ msg: '', type: 'success', ver: 0 });

  const showToast = (msg, type = 'success') =>
    setToast({ msg, type, ver: Date.now() });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminListUsers({ query: q, limit: 100, offset: 0 });
      setRows(res.items || []);
      setCount(res.count || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Разделяем: верх — только подтверждённые (isVerified) и не ADMIN,
  // низ — все остальные (включая админов и неподтверждённых).
  const verifiedUsers = rows.filter(u => u?.isVerified && String(u?.role).toUpperCase() !== 'ADMIN');
  const otherUsers    = rows.filter(u => !verifiedUsers.includes(u));

  const requestGrant = (id) => {
    setGrantUserId(id);
    setConfirmOpen(true);
  };

  const cancelGrant = () => {
    setConfirmOpen(false);
    setGrantUserId(null);
  };

  const confirmGrant = async () => {
    if (!grantUserId) return;
    setBusyGrant(true);
    try {
      await adminGrant(grantUserId, 30);
      setConfirmOpen(false);
      setGrantUserId(null);
      showToast('Подписка выдана на 30 дней', 'success');
      await load();
    } catch (e) {
      showToast('Не удалось выдать подписку', 'error');
    } finally {
      setBusyGrant(false);
    }
  };

  // Рендер строки таблицы
  const renderRow = (u) => (
    <tr key={u.id}>
      <td>{u.id}</td>
      <td>{u.name}</td>
      <td>{u.email}</td>
      <td>{u.phone || '—'}</td>
      <td>{new Date(u.createdAt).toLocaleString()}</td>
      <td>{u.subscriptionStatus}</td>
      <td>{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleString() : '—'}</td>
      <td>{u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).toLocaleString() : '—'}</td>
      <td>{u.storyCount ?? 0}</td>
      <td>
        <button
          className={s.small}
          onClick={() => requestGrant(u.id)}
          disabled={busyGrant}
          title="Выдать/продлить подписку на 30 дней"
        >
          Выдать 30 дней
        </button>
      </td>
    </tr>
  );

  return (
    <div className={s.wrap}>
      <h1 className={s.h1}>Пользователи</h1>

      <div className={s.tools}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск: имя, email, телефон"
          className={s.input}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button className={s.btn} onClick={load} disabled={loading}>Искать</button>
        <div className={s.count}>Найдено: {count}</div>
      </div>

      {/* Секция 1: только подтверждённые пользователи (не админы) */}
      <h2 className={s.sectionTitle}>Активные пользователи (подтверждённая почта)</h2>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Создан</th>
              <th>Статус</th>
              <th>Триал до</th>
              <th>Подписка до</th>
              <th>Историй</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {verifiedUsers.map(renderRow)}
            {!verifiedUsers.length && !loading && (
              <tr><td colSpan={10} className={s.empty}>Нет данных</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Секция 2: все остальные (неподтверждённые и/или админы) */}
      <h2 className={s.sectionTitle}>Все остальные</h2>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Создан</th>
              <th>Роль</th>
              <th>Подтверждён</th>
              <th>Статус</th>
              <th>Триал до</th>
              <th>Подписка до</th>
              <th>Историй</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {otherUsers.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td>{u.role}</td>
                <td>{u.isVerified ? 'да' : 'нет'}</td>
                <td>{u.subscriptionStatus}</td>
                <td>{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleString() : '—'}</td>
                <td>{u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).toLocaleString() : '—'}</td>
                <td>{u.storyCount ?? 0}</td>
                <td>
                  <button
                    className={s.small}
                    onClick={() => requestGrant(u.id)}
                    disabled={busyGrant}
                  >
                    Выдать 30 дней
                  </button>
                </td>
              </tr>
            ))}
            {!otherUsers.length && !loading && (
              <tr><td colSpan={12} className={s.empty}>Нет данных</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Модалка подтверждения */}
      <ConfirmModal
        open={confirmOpen}
        title="Подтвердите действие"
        text="Выдать/продлить подписку на 30 дней?"
        onCancel={cancelGrant}
        onConfirm={confirmGrant}
      />

      {/* Тосты */}
      <Toast
        message={toast.msg}
        type={toast.type}
        version={toast.ver}
        duration={3000}
        placement="bottom"
      />
    </div>
  );
}
