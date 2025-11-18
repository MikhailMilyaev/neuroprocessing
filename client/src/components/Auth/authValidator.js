import validator from 'validator';

export function validateLogin({ email, password }) {
  if (!email.trim() || !password.trim()) {
    return 'Заполните все поля.';
  }

  const isEmailValid = validator.isEmail(email);
  const isPasswordValid = validator.isLength(password, { min: 8 });

  if (!isEmailValid || !isPasswordValid) {
    return 'Неверный email или пароль.';
  }

  return null;
}

export function validateRegistration({ name, email, password, confirmedPassword }) {
  // все поля должны быть заполнены
  if (
    !name?.trim() ||
    !email?.trim() ||
    !password?.trim() ||
    !confirmedPassword?.trim()
  ) {
    return 'Заполните все поля.';
  }

  // имя
  if (!validator.isLength(name.trim(), { min: 2, max: 32 })) {
    return 'Имя должно быть от 2 до 32 символов.';
  }

  // email
  if (!validator.isEmail(email)) {
    return 'Некорректный email.';
  }

  // пароль
  if (!validator.isLength(password, { min: 8 })) {
    return 'Пароль должен быть не менее 8 символов.';
  }

  // подтверждение
  if (password !== confirmedPassword) {
    return 'Пароли не совпадают.';
  }

  return null;
}
