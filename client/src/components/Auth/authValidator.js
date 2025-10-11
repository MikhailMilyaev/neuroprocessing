import validator from 'validator'

function normalizeRuPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!/^[78]\d{10}$/.test(digits)) return null;
  const fixed = digits[0] === '7' ? '8' + digits.slice(1) : digits;
  return fixed;  
}

export function validateLogin({ email, password }) {
  if (!email.trim() || !password.trim()) {
    return 'Заполните все поля.'
  }

  const isEmailValid = validator.isEmail(email)
  const isPasswordValid = validator.isLength(password, { min: 8 })

  if (!isEmailValid || !isPasswordValid) {
    return 'Неверный email или пароль.'
  }
  
  return null
}

export function validateRegistration({ name, email, password, confirmedPassword, phone }) {
  if (
    !name?.trim() ||
    !email?.trim() ||
    !password?.trim() ||
    !confirmedPassword?.trim() ||
    !String(phone ?? '').trim()
  ) {
    return 'Заполните все поля.'
  }

  if (!validator.isLength(name.trim(), { min: 2, max: 32 })) {
    return 'Имя должно быть от 2 до 32 символов.'
  }

  if (!validator.isEmail(email)) {
    return 'Некорректный email.'
  }

  if (!validator.isLength(password, { min: 8 })) {
    return 'Пароль должен быть не менее 8 символов.'
  }

  if (password !== confirmedPassword) {
    return 'Пароли не совпадают.'
  }

  const normalized = normalizeRuPhone(phone);
  if (!normalized) {
    return 'Неверный формат телефона (РФ: 8XXXXXXXXXX, 11 цифр).'
  }

  return null
}
