import { useState, useRef } from 'react';
import {
  IoMailOutline,
  IoPersonOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCallOutline,
} from 'react-icons/io5';
import styles from './FormInput.module.css';

const DIGIT_KEYS = new Set([
  '0','1','2','3','4','5','6','7','8','9',
]);
const CONTROL_KEYS = new Set([
  'Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
  'Home','End','Tab','Enter',
]);

const FormInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
  autoComplete,
  size = 'md',
  containerStyle,
  className,
}) => {
  const [isFocus, setIsFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const isPassword = type === 'password';
  const isTel = type === 'tel';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : (isTel ? 'text' : type);

  const LeftIcon =
    type === 'email' ? IoMailOutline :
    type === 'password' ? IoLockClosedOutline :
    type === 'tel' ? IoCallOutline :
    IoPersonOutline;

  const eyeSizeClass =
    size === 'sm' ? styles.eyeSm :
    size === 'lg' ? styles.eyeLg :
    styles.eyeMd;

  const handleEyeMouseDown = (e) => {
    e.preventDefault();
    if (inputRef.current) inputRef.current.blur();
  };

  const handleEyeClick = () => setShowPassword(prev => !prev);

  const normalizePhoneInput = (raw) => {
  let v = String(raw || '').replace(/\D/g, '');
  if (!v) return '';

  if (v[0] !== '8') v = '8' + v.slice(1);

  if (v.length > 11) v = v.slice(0, 11);

  return v;
};

  const handleTelChange = (e) => {
    const normalized = normalizePhoneInput(e.target.value);
    onChange && onChange({ ...e, target: { ...e.target, value: normalized } });
  };

  const handleKeyDown = (e) => {
    if (!isTel) return; 
    const { key, ctrlKey, metaKey } = e;

    if (ctrlKey || metaKey) return;

    if (CONTROL_KEYS.has(key)) return;

    if (!DIGIT_KEYS.has(key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    if (!isTel) return;

    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const normalized = normalizePhoneInput(pasted);
    e.preventDefault();
    const el = inputRef.current;
    if (!el) return;

    const selectionStart = el.selectionStart ?? el.value.length;
    const selectionEnd = el.selectionEnd ?? el.value.length;
    const before = String(value || '').slice(0, selectionStart);
    const after = String(value || '').slice(selectionEnd);
    const next = normalizePhoneInput(before + normalized + after);

    onChange && onChange({ target: { value: next } });
    requestAnimationFrame(() => {
      try {
        const pos = Math.min((before + normalized).length, next.length);
        el.setSelectionRange(pos, pos);
      } catch {}
    });
  };

  return (
    <div
      className={`${styles.inputContainer} ${className || ''}`}
      style={containerStyle}
    >
      <LeftIcon
        className={styles.leftIcon}
        style={{ color: isFocus ? 'black' : undefined }}
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        className={styles.input}
        value={value}
        onChange={isTel ? handleTelChange : onChange}
        placeholder={placeholder}
        type={inputType}
        name={name}
        autoComplete={autoComplete}
        inputMode={isTel ? 'numeric' : undefined}
        pattern={isTel ? '\\d*' : undefined}
        onKeyDown={isTel ? handleKeyDown : undefined}
        onPaste={isTel ? handlePaste : undefined}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        aria-label={placeholder}
        maxLength={isTel ? 11 : undefined} 
      />

      {isPassword && value && (
        <button
          type="button"
          className={`${styles.rightIcon} ${eyeSizeClass}`}
          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={showPassword}
          onMouseDown={handleEyeMouseDown}
          onClick={handleEyeClick}
          style={{ color: isFocus ? 'black' : undefined }}
        >
          {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
        </button>
      )}
    </div>
  );
};

export default FormInput;
