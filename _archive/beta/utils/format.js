// utils/format.js — Formatação de moeda, data e percentual

const Format = {

  currency(val) {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  currencyShort(val) {
    const num = parseFloat(val) || 0;
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  date(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  },

  dateInput(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  },

  percent(num) {
    const val = parseFloat(num) || 0;
    return `${val.toFixed(1)}%`;
  },

  percentage(current, total) {
    if (!total || total <= 0) return 0;
    return ((current / total) * 100).toFixed(1);
  },

  progressWidth(current, total) {
    if (!total || total <= 0) return 0;
    const pct = (current / total) * 100;
    return Math.min(pct, 100);
  },

  timestamp() {
    return Date.now();
  }
};
