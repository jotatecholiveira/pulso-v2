# 🔧 ESPECIFICAÇÃO TÉCNICA — Financo v2.0

## 1. SCHEMA FIREBASE (Estrutura Completa)

### Path: `/users/{uid}/`

#### A. Profile

```json
{
  "profile": {
    "email": "joao@email.com",
    "name": "João Pedro",
    "avatar": "https://...",
    "role": "admin",
    "createdAt": 1692374400000,
    "updatedAt": 1692374400000
  }
}
```

**Validações:**
- `email`: string, formato email válido
- `name`: string 3-100 chars
- `avatar`: URL válida ou null
- `role`: "admin" | "user"

---

#### B. Transactions

```json
{
  "transactions": {
    "trans_001": {
      "id": "trans_001",
      "type": "entrada",
      "user": "João",
      "desc": "Salário",
      "val": 5000,
      "cat": "Renda",
      "date": "2024-08-13T10:30:00Z",
      "createdAt": 1692374400000,
      "updatedAt": 1692374400000
    },
    "trans_002": {
      "id": "trans_002",
      "type": "saida",
      "user": "Compartilhado",
      "desc": "Aluguel",
      "val": 1500,
      "cat": "Gastos Essenciais",
      "date": "2024-08-13T10:30:00Z",
      "createdAt": 1692374400000
    }
  }
}
```

**Validações:**
- `type`: "entrada" | "saida"
- `val`: número > 0
- `desc`: string max 200 chars
- `user`: "João" | "Vick" | "Compartilhado"
- `cat`: string válida (lista predefinida)
- `date`: ISO 8601

---

#### C. Assets (Patrimônio)

```json
{
  "assets": {
    "asset_001": {
      "id": "asset_001",
      "name": "Carro Renault",
      "type": "vehicle",
      "value": 15900,
      "purchasePrice": 18000,
      "purchaseDate": "2021-06-15T00:00:00Z",
      "description": "Renault Kwid cinza",
      "icon": "🚗",
      "createdAt": 1692374400000,
      "updatedAt": 1692374400000
    },
    "asset_002": {
      "id": "asset_002",
      "name": "Poupança Caixa",
      "type": "savings",
      "value": 1800,
      "purchasePrice": 1800,
      "purchaseDate": "2024-01-01T00:00:00Z",
      "description": "Conta poupança emergência",
      "icon": "💳",
      "createdAt": 1692374400000
    }
  }
}
```

**Tipos válidos:**
- `vehicle`: Carros, motos
- `savings`: Poupança, conta corrente
- `real_estate`: Casa, imóvel
- `crypto`: Bitcoin, Ethereum
- `other`: Outros

**Validações:**
- `value`: número >= 0
- `purchasePrice`: número >= 0
- `type`: um dos acima
- `name`: string 1-100 chars

---

#### D. Metas (Goals)

```json
{
  "metas": {
    "curto": {
      "id": "curto",
      "name": "Reserva de Emergência",
      "goal": 33046.62,
      "current": 1800,
      "icon": "🛡️",
      "deadline": "2024-12-31T23:59:59Z",
      "priority": "high",
      "description": "6 meses de despesas fixas",
      "type": "emergency",
      "category": "financial_security",
      "createdAt": 1692374400000,
      "updatedAt": 1692374400000
    },
    "medio": {
      "id": "medio",
      "name": "Carro Novo",
      "goal": 50000,
      "current": 15900,
      "icon": "🚗",
      "deadline": "2025-12-31T23:59:59Z",
      "priority": "medium",
      "description": "Trocar Renault por carro 0km",
      "type": "purchase",
      "category": "assets",
      "createdAt": 1692374400000
    },
    "longo": {
      "id": "longo",
      "name": "Casa Quitada",
      "goal": 300000,
      "current": 15900,
      "icon": "🏠",
      "deadline": "2034-12-31T23:59:59Z",
      "priority": "high",
      "description": "Quitar financiamento da casa",
      "type": "real_estate",
      "category": "wealth_building",
      "createdAt": 1692374400000
    }
  }
}
```

**Validações:**
- `goal`: número > 0
- `current`: número >= 0 e <= goal
- `priority`: "high" | "medium" | "low"
- `deadline`: ISO 8601 ou null

**Cálculos Automáticos:**
- `progress`: (current / goal) * 100
- `remaining`: goal - current
- `daysLeft`: deadline - today
- `monthlyNeeded`: remaining / monthsLeft

---

#### E. Poupança (Savings Accounts)

```json
{
  "poupanca": {
    "poup_001": {
      "id": "poup_001",
      "name": "Poupança Caixa",
      "bank": "Caixa",
      "amount": 1800,
      "interestRate": 0.005,
      "lastUpdate": "2024-08-13T10:00:00Z",
      "description": "Conta emergência",
      "createdAt": 1692374400000,
      "updatedAt": 1692374400000
    },
    "poup_002": {
      "id": "poup_002",
      "name": "Tesouro Direto",
      "bank": "Tesouro",
      "amount": 5000,
      "interestRate": 0.1125,
      "lastUpdate": "2024-08-13T10:00:00Z",
      "description": "Investimento médio prazo",
      "createdAt": 1692374400000
    }
  }
}
```

**Bancos predefinidos:**
- Caixa, Bradesco, Itaú, Banco do Brasil, Santander, Nubank, Tesouro

---

#### F. Settings

```json
{
  "settings": {
    "currency": "BRL",
    "theme": "dark",
    "locale": "pt-BR",
    "notifications": true,
    "twoFactor": false,
    "dataExport": "2024-08-13T00:00:00Z",
    "updatedAt": 1692374400000
  }
}
```

---

## 2. ENDPOINTS LÓGICOS (Funções)

### Auth Module

```
POST /auth/login
  body: { email, password }
  return: { uid, email, token }

POST /auth/register
  body: { email, password, name }
  return: { uid, email }

POST /auth/logout
  return: { success }

GET /auth/me
  return: { uid, email, name, avatar }
```

### Transactions Module

```
GET /transactions
  query: { type?, start_date?, end_date?, category? }
  return: [ transaction ]

POST /transactions
  body: { type, user, desc, val, cat, date }
  return: { id, ... }

PUT /transactions/{id}
  body: { desc, val, cat }
  return: { id, ... }

DELETE /transactions/{id}
  return: { success }

GET /transactions/stats
  return: { totalIncome, totalExpense, balance, byCategory }
```

### Metas Module

```
GET /metas
  return: { curto, medio, longo }

GET /metas/{id}
  return: { ...meta, progress, remaining }

PUT /metas/{id}
  body: { goal, current, deadline, priority }
  return: { id, ...meta }

POST /metas/auto-calculate
  return: { curto: { goal, ... } }
```

### Assets Module

```
GET /assets
  return: [ asset ]

POST /assets
  body: { name, type, value, purchasePrice, purchaseDate, description }
  return: { id, ... }

PUT /assets/{id}
  body: { value, description }
  return: { id, ... }

DELETE /assets/{id}
  return: { success }

GET /assets/total
  return: { totalValue, byType }
```

### Savings Module

```
GET /poupanca
  return: [ savings ]

POST /poupanca
  body: { name, bank, amount, interestRate }
  return: { id, ... }

PUT /poupanca/{id}
  body: { amount, interestRate, lastUpdate }
  return: { id, ... }

DELETE /poupanca/{id}
  return: { success }

GET /poupanca/projection
  query: { months }
  return: [ { month, amount } ]
```

---

## 3. COMPONENTES UI

### Tab: Entrada (Dashboard)

```
┌─────────────────────────────────────┐
│  Saldo | Entradas | Saídas          │  ← Cards resumo
├─────────────────────────────────────┤
│  Últimas Transações                 │
│  [Trans 1] [Trans 2] [Trans 3]       │
├─────────────────────────────────────┤
│  Categorias (Gráfico Donut)          │
│  Essencial: 51%  Pessoal: 48%        │
└─────────────────────────────────────┘
```

### Tab: Investimentos

```
┌─────────────────────────────────────┐
│  Patrimônio Líquido: R$ 17.700       │  ← Total
├─────────────────────────────────────┤
│  ATIVOS ATUAIS                      │
│  ┌──────────────────────────┐        │
│  │ 🚗 Carro      R$ 15.900  │        │
│  └──────────────────────────┘        │
│  ┌──────────────────────────┐        │
│  │ 💳 Poupança   R$ 1.800   │        │
│  └──────────────────────────┘        │
├─────────────────────────────────────┤
│  METAS FINANCEIRAS                  │
│  ┌──────────────────────────┐        │
│  │ 🛡️ Emergência (6 meses)  │ ✏️    │
│  │ ████░░░░░░░░░░░ 5%      │        │
│  │ R$ 1.800 / R$ 33.046    │        │
│  └──────────────────────────┘        │
│  ┌──────────────────────────┐        │
│  │ 🚗 Carro Novo           │ ✏️    │
│  │ ███░░░░░░░░░░░░░ 32%    │        │
│  │ R$ 15.900 / R$ 50.000   │        │
│  └──────────────────────────┘        │
│  ┌──────────────────────────┐        │
│  │ 🏠 Casa Quitada         │ ✏️    │
│  │ ██░░░░░░░░░░░░░░░░ 5%   │        │
│  │ R$ 15.900 / R$ 300.000  │        │
│  └──────────────────────────┘        │
└─────────────────────────────────────┘
```

### Modal: Editar Meta

```
┌──────────────────────────────────┐
│ ✏️ Editar: Emergência             │
├──────────────────────────────────┤
│ Meta (R$)                         │
│ [________33046.62__________]      │
│                                  │
│ Valor Atual (R$)                 │
│ [__________1800__________]        │
│                                  │
│ Deadline                         │
│ [__2024-12-31__]                 │
│                                  │
│ Prioridade                       │
│ [High ▼]                         │
├──────────────────────────────────┤
│ [Cancelar]  [Salvar Alterações]   │
└──────────────────────────────────┘
```

---

## 4. CONSTANTES GLOBAIS

```javascript
// utils/constants.js

const TRANSACTION_TYPES = {
  ENTRADA: 'entrada',
  SAIDA: 'saida'
};

const USERS = {
  JOAO: 'João',
  VICK: 'Vick',
  COMPARTILHADO: 'Compartilhado'
};

const CATEGORIES = {
  ENTRADA: ['Renda', 'Freelance', 'Investimentos'],
  SAIDA: ['Gastos Essenciais', 'Pessoais', 'Investimento']
};

const ASSET_TYPES = {
  VEHICLE: 'vehicle',
  SAVINGS: 'savings',
  REAL_ESTATE: 'real_estate',
  CRYPTO: 'crypto',
  OTHER: 'other'
};

const META_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const BANKS = [
  'Caixa', 'Bradesco', 'Itaú', 'Banco do Brasil',
  'Santander', 'Nubank', 'Tesouro', 'Corretora'
];

const LOCALE_CONFIG = {
  locale: 'pt-BR',
  currency: 'BRL'
};
```

---

## 5. FIREBASE RULES (Completas e Seguras)

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['profile'])",
        
        "profile": {
          "email": {
            ".validate": "newData.isString() && newData.val().contains('@')"
          },
          "name": {
            ".validate": "newData.isString() && newData.val().length > 0"
          },
          "createdAt": {
            ".validate": "newData.val() === now || newData.val() <= now"
          }
        },
        
        "transactions": {
          "$transId": {
            ".validate": "newData.hasChildren(['type', 'val', 'date'])",
            "type": {
              ".validate": "newData.val() === 'entrada' || newData.val() === 'saida'"
            },
            "val": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "desc": {
              ".validate": "newData.isString() && newData.val().length <= 200"
            },
            "date": {
              ".validate": "newData.isString()"
            }
          }
        },
        
        "assets": {
          "$assetId": {
            ".validate": "newData.hasChildren(['name', 'type', 'value'])",
            "type": {
              ".validate": "newData.val() in ['vehicle','savings','real_estate','crypto','other']"
            },
            "value": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            }
          }
        },
        
        "metas": {
          "$metaKey": {
            ".validate": "newData.hasChildren(['name', 'goal', 'current'])",
            "goal": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "current": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            }
          }
        },
        
        "poupanca": {
          "$poupId": {
            ".validate": "newData.hasChildren(['name', 'bank', 'amount'])",
            "amount": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            }
          }
        }
      }
    }
  }
}
```

---

## 6. FLUXO DE DADOS

```
index.html
   ↓
main.js (orquestrador)
   ├→ auth.js (autentica usuário)
   ├→ storage.js (conecta Firebase)
   └→ ui.js (renderiza)
      ├→ transactions.js (carrega & salva transações)
      ├→ metas.js (carrega & salva metas)
      ├→ assets.js (carrega & salva patrimônio)
      └→ poupanca.js (carrega & salva poupança)

Usuário clica → UI event
   ↓
Função chama validação
   ↓
Salva em Firebase / localStorage
   ↓
Listener atualiza UI
   ↓
Renderiza novo estado
```

---

## 7. TRATAMENTO DE ERROS

```javascript
// Padrão try/catch

try {
  const data = await fetch(...);
  if (!data.ok) throw new Error(`HTTP ${data.status}`);
  return await data.json();
} catch (error) {
  console.error('[ModuleName]', error);
  // Fallback local
  return loadFromCache();
}
```

---

**Especificação v1.0 — Pronto para implementação!** ✅
