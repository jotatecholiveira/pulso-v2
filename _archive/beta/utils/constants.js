// utils/constants.js — Constantes globais do Financo v2.0

const Constants = {

  TRANSACTION_TYPES: {
    ENTRADA: 'entrada',
    SAIDA: 'saida'
  },

  USERS: {
    JOAO: 'João',
    VICK: 'Vick',
    COMPARTILHADO: 'Compartilhado'
  },

  CATEGORIES: {
    ENTRADA: ['Renda', 'Freelance', 'Investimentos'],
    SAIDA: ['Gastos Essenciais', 'Pessoais', 'Investimento']
  },

  ASSET_TYPES: {
    VEHICLE: 'vehicle',
    SAVINGS: 'savings',
    REAL_ESTATE: 'real_estate',
    CRYPTO: 'crypto',
    OTHER: 'other'
  },

  ASSET_ICONS: {
    vehicle: '🚗',
    savings: '💳',
    real_estate: '🏠',
    crypto: '₿',
    other: '📦'
  },

  META_PRIORITIES: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },

  META_TYPES: {
    EMERGENCY: 'emergency',
    PURCHASE: 'purchase',
    REAL_ESTATE: 'real_estate',
    OTHER: 'other'
  },

  BANKS: [
    'Caixa', 'Bradesco', 'Itaú', 'Banco do Brasil',
    'Santander', 'Nubank', 'Tesouro', 'Corretora'
  ],

  DB_PATHS: {
    PROFILE: 'profile',
    TRANSACTIONS: 'transactions',
    ASSETS: 'assets',
    METAS: 'metas',
    POUPANCA: 'poupanca',
    SETTINGS: 'settings'
  },

  LOCALE_CONFIG: {
    locale: 'pt-BR',
    currency: 'BRL'
  },

  MAX_LENGTHS: {
    DESC: 200,
    NAME: 100,
    EMAIL: 254
  }
};
