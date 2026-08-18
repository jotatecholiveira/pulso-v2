// utils/security.js — Escape HTML, sanitização e segurança

const Security = {

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text || '').replace(/[&<>"']/g, c => map[c]);
  },

  sanitizeInput(input, maxLen = 200) {
    return Security.escapeHtml(String(input || '').trim().slice(0, maxLen));
  },

  validateNumber(num, min = 0, max = Infinity) {
    const n = parseFloat(num);
    if (isNaN(n) || n < min || n > max) return null;
    return n;
  },

  sanitizeObject(obj, rules) {
    const clean = {};
    for (const [key, rule] of Object.entries(rules)) {
      const val = obj[key];
      if (val === undefined || val === null) {
        if (rule.required) throw new Error(`Campo '${key}' é obrigatório`);
        clean[key] = rule.default !== undefined ? rule.default : null;
        continue;
      }
      switch (rule.type) {
        case 'string':
          clean[key] = Security.sanitizeInput(val, rule.maxLen || 200);
          break;
        case 'number': {
          const n = Security.validateNumber(val, rule.min, rule.max);
          if (n === null) throw new Error(`Campo '${key}' inválido`);
          clean[key] = n;
          break;
        }
        case 'enum':
          if (!rule.values.includes(val)) throw new Error(`Campo '${key}' inválido`);
          clean[key] = val;
          break;
        case 'date':
          clean[key] = String(val);
          break;
        default:
          clean[key] = val;
      }
    }
    return clean;
  }
};
