// utils/validate.js — Validações de dados

const Validators = {

  transaction(data) {
    if (!data) return false;
    const validTypes = ['entrada', 'saida'];
    const validUsers = ['João', 'Vick', 'Compartilhado'];
    return (
      validTypes.includes(data.type) &&
      typeof data.val === 'number' && data.val > 0 &&
      data.desc && data.desc.length <= 200 &&
      validUsers.includes(data.user) &&
      data.cat && data.date
    );
  },

  meta(data) {
    if (!data) return false;
    return (
      data.name && typeof data.name === 'string' && data.name.length > 0 &&
      typeof data.goal === 'number' && data.goal > 0 &&
      typeof data.current === 'number' && data.current >= 0 &&
      data.current <= data.goal
    );
  },

  asset(data) {
    if (!data) return false;
    const validTypes = ['vehicle', 'savings', 'real_estate', 'crypto', 'other'];
    return (
      data.name && typeof data.name === 'string' && data.name.length > 0 &&
      typeof data.value === 'number' && data.value >= 0 &&
      validTypes.includes(data.type)
    );
  },

  poupanca(data) {
    if (!data) return false;
    return (
      data.name && typeof data.name === 'string' && data.name.length > 0 &&
      data.bank && typeof data.bank === 'string' &&
      typeof data.amount === 'number' && data.amount >= 0
    );
  },

  email(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  password(pass) {
    if (!pass || typeof pass !== 'string') return false;
    return pass.length >= 6;
  }
};
