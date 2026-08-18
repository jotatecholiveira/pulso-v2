# 🤖 GUIA DE PROMPT PARA IA

## Como Pedir à IA para Desenvolver Financo v2.0 Corretamente

---

## PROMPT COMPLETO (Copie e Cole)

```
[Contexto]
Você é desenvolvedor JavaScript/Firebase sênior.
Estou refatorando um app de orçamento familiar (Financo).
Preciso que tudo saia LIMPO, FLUÍDO e SEGURO.

[Decisão Arquitetural]
- 1 index.html (SPA) com navegação via URL hashes
- Múltiplos módulos .js (auth, storage, metas, assets, etc)
- Tudo salvo em Firebase (ZERO hardcoding HTML)
- Variáveis globais escapadas e validadas
- Firebase Rules rigorosas

[Estrutura de Pastas]
Projeto_APP_v2/
├── index.html
├── style.css
├── firebase-config.js (em .gitignore)
├── js/
│   ├── main.js
│   ├── auth.js
│   ├── storage.js
│   ├── transactions.js
│   ├── metas.js
│   ├── assets.js
│   ├── poupanca.js
│   └── ui.js
├── utils/
│   ├── format.js
│   ├── validate.js
│   ├── security.js
│   └── constants.js
└── docs/
    └── schema.md

[Banco de Dados]
Usar schema:
- users/{uid}/profile
- users/{uid}/transactions/
- users/{uid}/assets/
- users/{uid}/metas/
- users/{uid}/poupanca/
- users/{uid}/settings/

[Segurança Obrigatória]
✅ Validar tipo de dados (number, string, enum)
✅ Escapar HTML (prevenir XSS)
✅ Sanitizar entrada (max length, trim)
✅ Firebase Rules por UID
✅ Fallback localStorage se offline
✅ Try/catch em tudo
✅ .gitignore com credenciais

[Padrão de Código]
- Usar IIFE (Immediately Invoked Function Expression)
- Métodos privados/públicos explícitos
- Nomes claros (loadMetas, saveMeta, renderMetasUI)
- Comments em pontos críticos
- Sem var, usar const/let

[Funcionalidades v2.0]
1. Auth: Login João/Vick, persistência
2. Transactions: CRUD, filtros, estatísticas
3. Metas: Editáveis inline, 3 níveis (curto/medio/longo)
4. Assets: Patrimônio (carro, poupança, etc)
5. Poupança: Contas por banco, juros
6. Dashboard: Resumo de tudo
7. Settings: Tema, locale, notificações

[Teste Antes de Entregar]
- Sem erros no console
- Dados persistem ao reload
- Login de 2 usuários funciona
- Edição inline de metas funciona
- Sincronização Firebase ativa
- Fallback localStorage se offline

[Formato de Saída]
Entregar:
1. Código completo (copy-paste pronto)
2. Instructions.md (como rodar)
3. Changelog (o que foi feito)
4. Erros conhecidos (se houver)
```

---

## SOLICITAÇÕES ESPECÍFICAS POR MÓDULO

### Para auth.js

```
Desenvolva o módulo de autenticação com:
✅ Login email/password
✅ Registro de novo usuário
✅ Logout
✅ Persistência de sessão
✅ Tratamento de erros
✅ Redirect automático (login → app, app → login se não autenticado)

Padrão: IIFE com métodos públicos (login, register, logout, getCurrentUser)
```

### Para metas.js

```
Desenvolva o módulo de metas com:
✅ Carregar metas do Firebase
✅ Salvar meta (POST/PUT)
✅ Validar dados (goal > 0, current <= goal)
✅ Calcular progresso (%, falta em R$)
✅ Sugerir meta emergência (6 meses gasto médio)
✅ Renderizar cards (com ✏️ para editar)
✅ Toggle edição inline
✅ Sincronizar real-time

Padrão: IIFE com cache local, listeners Firebase, validação strict
```

### Para storage.js

```
Desenvolva gerenciador de storage com:
✅ Conectar Firebase
✅ Fallback localStorage
✅ Listeners em tempo real
✅ Sincronizar offline
✅ Indicador de status (Online/Offline/Local)
✅ Error handling

Padrão: IIFE com modo detecção automático (RTDB vs localStorage)
```

### Para assets.js

```
Desenvolva módulo de patrimônio com:
✅ CRUD completo (create, read, update, delete)
✅ Tipos: vehicle, savings, real_estate, crypto, other
✅ Calcular valor total
✅ Histórico de valor (depreciação/apreciação)
✅ Sincronizar Firebase
✅ Validar: name, type, value >= 0

Padrão: IIFE com validação rigorosa
```

### Para ui.js

```
Desenvolva renderização UI com:
✅ Renderizar tabs (entrada, investimentos, poupanca, historico, banco)
✅ Cards de metas (com barra de progresso)
✅ Cards de assets
✅ Tabela de transações
✅ Modal de edição
✅ Animações (fadeIn, slideUp)
✅ Responsivo (mobile-first)

Padrão: Componentes como funções que retornam DOM elements
Design: Azul petróleo (#0d4a6f), BB (#1e7ba0), mar (#0a3a52)
```

---

## PERGUNTAS FREQUENTES PARA A IA

**P: "Devo usar Firebase Realtime ou Firestore?"**  
R: Realtime Database (já configurado, mais simples)

**P: "Como renderizar dados do Firebase?"**  
R: Usar listeners (`.on('value', snap => ...)`) e atualizar DOM

**P: "Como lidar com offline?"**  
R: Fallback localStorage, indicador de status

**P: "Posso usar jQuery ou só vanilla JS?"**  
R: Só vanilla (mais rápido, sem dependências externas)

**P: "Como testar sem publish/subscribe?"**  
R: Usar localStorage local, depois migrar pra Firebase

**P: "Preciso de webpack/build process?"**  
R: Não, inclua Firebase SDK via CDN, rode direto no browser

---

## CHECKLIST: O Que Deve Estar Pronto

### Backend (Firebase)

- [ ] Autenticação habilitada (email/password)
- [ ] Realtime Database criado
- [ ] Security Rules publicadas
- [ ] Índices criados (transactions/date, etc)
- [ ] Backup automático ativado

### Frontend - Estrutura

- [ ] index.html criado (único)
- [ ] style.css criado (com variáveis azuis)
- [ ] firebase-config.js criado (em .gitignore)
- [ ] Pastas /js, /utils, /docs criadas

### Frontend - Módulos

- [ ] auth.js completo (login, logout, session)
- [ ] storage.js completo (RTDB + localStorage)
- [ ] transactions.js completo (CRUD)
- [ ] metas.js completo (editável, validado)
- [ ] assets.js completo (patrimônio)
- [ ] poupanca.js completo (contas)
- [ ] ui.js completo (renderização)

### Frontend - Utilitários

- [ ] format.js (moeda, data, %)
- [ ] validate.js (validadores)
- [ ] security.js (escape, sanitize)
- [ ] constants.js (tipos, bancos, etc)

### Qualidade

- [ ] Zero erros no console
- [ ] Dados persistem ao reload
- [ ] Mobile responsivo
- [ ] Sincronização funciona
- [ ] Fallback offline funciona

### Documentação

- [ ] README.md (como rodar)
- [ ] schema.md (estrutura Firebase)
- [ ] Instructions.md (passo-a-passo)
- [ ] Changelog (o que foi feito)

---

## TESTES MANUAIS (Antes de Entregar)

### Teste 1: Login

```
1. Abre app
2. Clica "Login"
3. Digita email: joao@email.com, password: 123456
4. Clica "Entrar"
5. Redirecionado pra home ✅
6. Reload página
7. Ainda logado ✅
```

### Teste 2: Criar Transação

```
1. Na home, preenche:
   - Tipo: Entrada
   - Usuário: João
   - Descrição: Salário
   - Valor: 5000
   - Categoria: Renda
2. Clica "Salvar"
3. Aparece na tabela ✅
4. Reload página
5. Transação ainda lá ✅
6. Abre Firebase Console → vê a transação ✅
```

### Teste 3: Editar Meta

```
1. Vai em "Investimentos"
2. Vê 3 metas
3. Clica ✏️ em "Emergência"
4. Edita valor pra 40000
5. Clica "Salvar"
6. Barra de progresso atualiza ✅
7. Reload página
8. Valor persiste ✅
```

### Teste 4: Offline

```
1. Abre DevTools (F12)
2. Network → Offline
3. Edita uma meta
4. Clica "Salvar"
5. Vê mensagem "Modo local" ✅
6. Tira do Offline
7. Sincroniza com Firebase ✅
```

### Teste 5: Dois Usuários

```
1. Login com João
2. Cria transação
3. Logout
4. Login com Vick
5. Vê a mesma transação ✅
```

---

## EXEMPLO DE PROMPT RUIM ❌

```
"Faz um app de orçamento"
```

## EXEMPLO DE PROMPT BOM ✅

```
"Desenvolva metas.js seguindo estes critérios:
- IIFE pattern com cache metasData = {}
- Método load(uid) que faz listener no Firebase
- Método save(uid, key, data) que valida e salva
- Validação: goal > 0, current <= goal
- Renderizar em #metas-container com cards
- Incluir ✏️ pra editar inline
- Sync real-time com Firebase
- Fallback localStorage se offline

Código deve ter:
✅ Try/catch em tudo
✅ Nomes claros (loadMetasFromFirebase)
✅ Comments em pontos críticos
✅ Sem hardcoding de dados
✅ Escape HTML seguro

Entregar completo, pronto pra copy-paste"
```

---

## RESUMO: Como Trabalhar com IA

1. **Leia os 3 documentos** (Manual, Especificação, Resumo)
2. **Use o PROMPT COMPLETO** acima como base
3. **Peça módulo por módulo** (não tudo de uma vez)
4. **Valide cada entrega** (teste, console, Firebase)
5. **Dê feedback específico** ("Valida stringlength aqui", "Adiciona try/catch ali")
6. **Itere** (pequenos ajustes, não refazeres completos)

---

**Pronto para conversar com IA!** 🤖
