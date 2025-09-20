import { useState, useRef } from 'react';
import {
  IoMailOutline,
  IoPersonOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from 'react-icons/io5';
import styles from './FormInput.module.css';

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
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const LeftIcon =
    type === 'email' ? IoMailOutline :
    type === 'password' ? IoLockClosedOutline :
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
        onChange={onChange}
        placeholder={placeholder}
        type={inputType}
        name={name}
        autoComplete={autoComplete}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        aria-label={placeholder}
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
