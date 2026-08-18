# 📋 MANUAL RIGOROSO — Financo v2.0
## Desenvolvimento do Zero | Seguro | Prático | Fluído

---

## 📑 ÍNDICE

1. [Decisão Arquitetural](#decisão-arquitetural)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Banco de Dados Firebase](#banco-de-dados-firebase)
4. [Padrões de Código](#padrões-de-código)
5. [Segurança](#segurança)
6. [Checklist de Desenvolvimento](#checklist-de-desenvolvimento)

---

## 🎯 DECISÃO ARQUITETURAL

### Pergunta: Um index.html ou múltiplos arquivos?

**RESPOSTA: SPA (Single Page Application) com 1 index.html**

**Por quê:**
✅ Carrega uma vez, navegação instantânea  
✅ Menos requisições HTTP  
✅ Melhor experiência mobile  
✅ Cache eficiente (Firebase Realtime)  
✅ Padrão Nubank/moderna  
✅ Segurança centralizada  

**Estrutura:**
```
index.html (único arquivo HTML)
  ├── script.js (lógica principal)
  ├── modules/
  │   ├── auth.js (autenticação)
  │   ├── transactions.js (transações)
  │   ├── metas.js (metas/investimentos)
  │   ├── assets.js (patrimônio)
  │   └── ui.js (renderização)
  └── style.css (design único)
```

**Navegação SPA:**
```
index.html
  ├── #entrada (Dashboard transações)
  ├── #investimentos (Metas + Patrimônio)
  ├── #poupanca (Reservas)
  ├── #historico (Histórico)
  └── #banco (Backup/Import)
```

---

## 📁 ESTRUTURA DE PASTAS

```
Projeto_APP/
├── index.html              (único - estrutura base)
├── style.css               (design único)
├── firebase-config.js      (credenciais Firebase)
├── js/
│   ├── main.js            (orquestrador principal)
│   ├── auth.js            (login/logout/usuário)
│   ├── storage.js         (Firebase/localStorage)
│   ├── transactions.js    (CRUD transações)
│   ├── metas.js           (CRUD metas/investimentos)
│   ├── assets.js          (CRUD patrimônio)
│   └── ui.js              (renderização de telas)
├── utils/
│   ├── format.js          (formatação moeda/data)
│   ├── validate.js        (validação de dados)
│   └── constants.js       (constantes globais)
├── data/
│   └── schema.md          (estrutura Firebase)
└── docs/
    ├── API.md             (endpoints lógicos)
    ├── SECURITY.md        (regras Firebase)
    └── COMPONENTS.md      (componentes UI)
```

---

## 🗄️ BANCO DE DADOS FIREBASE

### Estrutura Completa

```json
{
  "users": {
    "{uid}": {
      "profile": {
        "email": "string",
        "name": "string",
        "avatar": "string (URL)",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      },
      
      "transactions": {
        "{id}": {
          "type": "entrada|saida",
          "user": "João|Vick|Compartilhado",
          "desc": "string (max 200)",
          "val": "number",
          "cat": "string",
          "date": "ISO 8601",
          "createdAt": "timestamp"
        }
      },
      
      "assets": {
        "{id}": {
          "name": "Carro|Poupança|...",
          "type": "vehicle|savings|real_estate|crypto|other",
          "value": "number (valor atual)",
          "purchasePrice": "number (valor compra)",
          "purchaseDate": "ISO 8601",
          "description": "string",
          "icon": "emoji",
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        }
      },
      
      "metas": {
        "curto": {
          "name": "Reserva de Emergência",
          "goal": "number (meta)",
          "current": "number (atingido)",
          "icon": "🛡️",
          "deadline": "ISO 8601 (opcional)",
          "priority": "high|medium|low",
          "description": "6 meses de despesas",
          "updatedAt": "timestamp"
        },
        "medio": { ... },
        "longo": { ... }
      },
      
      "poupanca": {
        "{id}": {
          "name": "Poupança Caixa",
          "bank": "Caixa",
          "amount": "number",
          "interestRate": "number (% anual)",
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        }
      },
      
      "settings": {
        "currency": "BRL",
        "theme": "dark|light",
        "locale": "pt-BR",
        "updatedAt": "timestamp"
      }
    }
  }
}
```

---

## 🔐 PADRÕES DE CÓDIGO

### 1. Módulos (Cada arquivo .js segue padrão)

```javascript
// js/metas.js
const MetasModule = (() => {
  
  // PRIVADO
  const DB_PATH = 'metas';
  let metasCache = {};
  
  // Carregar metas do Firebase
  const load = async (uid) => {
    try {
      const snap = await db.ref(`users/${uid}/${DB_PATH}`).once('value');
      metasCache = snap.val() || {};
      return metasCache;
    } catch (e) {
      console.error('[MetasModule] Erro ao carregar:', e);
      return metasCache;
    }
  };
  
  // Criar/atualizar meta
  const save = async (uid, metaKey, metaData) => {
    if (!validate(metaData)) throw new Error('Dados inválidos');
    
    try {
      await db.ref(`users/${uid}/${DB_PATH}/${metaKey}`).set({
        ...metaData,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
      metasCache[metaKey] = metaData;
      return true;
    } catch (e) {
      console.error('[MetasModule] Erro ao salvar:', e);
      throw e;
    }
  };
  
  // Validação local
  const validate = (data) => {
    return data.name && typeof data.goal === 'number' && data.goal > 0;
  };
  
  // PÚBLICOS
  return { load, save, get: () => metasCache };
})();
```

### 2. Validação de Dados

```javascript
// utils/validate.js
const Validators = {
  
  meta: (data) => {
    return (
      data.name && typeof data.name === 'string' && data.name.length > 0 &&
      typeof data.goal === 'number' && data.goal > 0 &&
      typeof data.current === 'number' && data.current >= 0 &&
      data.current <= data.goal
    );
  },
  
  transaction: (data) => {
    return (
      ['entrada', 'saida'].includes(data.type) &&
      typeof data.val === 'number' && data.val > 0 &&
      data.desc && data.desc.length <= 200 &&
      data.cat && data.date
    );
  },
  
  asset: (data) => {
    return (
      data.name && typeof data.value === 'number' && data.value >= 0 &&
      ['vehicle', 'savings', 'real_estate', 'crypto', 'other'].includes(data.type)
    );
  }
};
```

### 3. Renderização UI (Componentes)

```javascript
// js/ui.js
const UIModule = (() => {
  
  const renderMetasTab = (metas) => {
    const container = document.getElementById('metas-container');
    container.innerHTML = '';
    
    Object.entries(metas).forEach(([key, meta]) => {
      const card = createMetaCard(key, meta);
      container.appendChild(card);
    });
  };
  
  const createMetaCard = (key, meta) => {
    const card = document.createElement('div');
    card.className = 'meta-card';
    card.innerHTML = `
      <div class="meta-header">
        <h3>${meta.icon} ${meta.name}</h3>
        <button onclick="MetasModule.edit('${key}')">✏️</button>
      </div>
      <div class="progress">
        <div class="bar" style="width: ${(meta.current/meta.goal)*100}%"></div>
      </div>
      <p>${meta.current} / ${meta.goal}</p>
    `;
    return card;
  };
  
  return { renderMetasTab, createMetaCard };
})();
```

### 4. Formatação & Utilitários

```javascript
// utils/format.js
const Format = {
  currency: (val) => `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  date: (iso) => new Date(iso).toLocaleDateString('pt-BR'),
  percent: (num) => `${(num || 0).toFixed(2)}%`,
  percentage: (curr, total) => total > 0 ? ((curr / total) * 100).toFixed(1) : 0
};
```

---

## 🛡️ SEGURANÇA

### 1. Firebase Rules (Estrutura Completa)

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['profile'])",
        
        "profile": {
          "email": { ".validate": "newData.isString()" },
          "name": { ".validate": "newData.isString() && newData.val().length > 0" },
          "avatar": { ".validate": "newData.isString() || newData.val() == null" }
        },
        
        "transactions": {
          "$transId": {
            "type": { ".validate": "newData.val() === 'entrada' || newData.val() === 'saida'" },
            "val": { ".validate": "newData.isNumber() && newData.val() > 0" },
            "desc": { ".validate": "newData.isString() && newData.val().length <= 200" },
            "date": { ".validate": "newData.isString()" }
          }
        },
        
        "metas": {
          "$metaKey": {
            "goal": { ".validate": "newData.isNumber() && newData.val() > 0" },
            "current": { ".validate": "newData.isNumber() && newData.val() >= 0" }
          }
        }
      }
    },
    ".info": {
      "connected": { ".read": true }
    }
  }
}
```

### 2. Sanitização & Escaping

```javascript
// utils/security.js
const Security = {
  
  // Escape HTML
  escapeHtml: (text) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text || '').replace(/[&<>"']/g, c => map[c]);
  },
  
  // Sanitizar entrada
  sanitizeInput: (input, maxLen = 200) => {
    return Security.escapeHtml(String(input || '').trim().slice(0, maxLen));
  },
  
  // Validar número
  validateNumber: (num, min = 0, max = Infinity) => {
    const n = parseFloat(num);
    return !isNaN(n) && n >= min && n <= max ? n : null;
  }
};
```

### 3. Variáveis de Ambiente

```javascript
// firebase-config.js (NUNCA fazer commit!)
const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
};
```

---

## 📋 CHECKLIST DE DESENVOLVIMENTO

### Fase 1: Setup (Dia 1)
- [ ] Pasta `Projeto_APP_v2` criada
- [ ] `index.html` base criado
- [ ] `firebase-config.js` com credenciais
- [ ] Firebase Rules aplicadas
- [ ] `.gitignore` com `firebase-config.js`

### Fase 2: Autenticação (Dia 2)
- [ ] `js/auth.js` implementado
- [ ] Login/Logout funcionando
- [ ] Session persistence
- [ ] Error handling

### Fase 3: Storage (Dia 3)
- [ ] `js/storage.js` criado
- [ ] Firebase Realtime sincronizando
- [ ] localStorage fallback
- [ ] Listeners ativos

### Fase 4: Transações (Dia 4-5)
- [ ] `js/transactions.js` CRUD
- [ ] Validação completa
- [ ] UI renderizando
- [ ] Filtros funcionando

### Fase 5: Metas & Patrimônio (Dia 6-7)
- [ ] `js/metas.js` CRUD
- [ ] `js/assets.js` CRUD
- [ ] Cálculos de progresso
- [ ] UI cards dinâmica

### Fase 6: UI & UX (Dia 8-9)
- [ ] `style.css` Nubank-inspired
- [ ] Responsivo testado
- [ ] Transições suaves
- [ ] Dark/Light theme

### Fase 7: Testes & Deploy (Dia 10)
- [ ] Console sem erros
- [ ] Dados persistem
- [ ] Mobile testado
- [ ] Firebase Rules validadas

---

## 🎯 PADRÃO DE NOMES

### Variáveis
```
metasData = dados de metas
isLoading = booleano
currentUser = usuário ativo
DBPath = caminho no Firebase
```

### Funções
```
loadMetas() = carregar dados
saveMeta() = salvar dado
renderMetaUI() = desenhar UI
validateMeta() = validar dado
```

### Classes CSS
```
.meta-card = cartão de meta
.progress-bar = barra progresso
.tab-content = seção/aba
.btn-primary = botão principal
```

---

## 🚀 PRÓXIMAS FASES (Após v2.0)

✅ v2.0: Refactor completo (metas em Firebase)  
→ v2.1: Gráficos (Chart.js)  
→ v2.2: Relatórios (PDF export)  
→ v2.3: Notificações (push)  
→ v3.0: App mobile (React Native)  

---

## 📞 SUPORTE

Erros comuns:

**"Firebase rules rejected write"**
→ Verificar UID, regras, estrutura dados

**"Metas não aparecem"**
→ Verificar loadMetas() chamado, listener ativo

**"Dados não sincronizam"**
→ Verificar conexão, Firebase credenciais

---

**Manual Versão 1.0 — Pronto para IA desenvolver!** 🚀
