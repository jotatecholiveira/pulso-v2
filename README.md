# Finanço — Orçamento Familiar

App de gerenciamento de orçamento familiar com dashboard interativo, gráficos, sincronização Firebase e suporte a importação de planilhas.

## Versão atual: v2.0-beta2

## Estrutura do projeto

```
v1/
├── index.html          # Dashboard principal
├── login.html          # Tela de login/cadastro
├── script.js           # Lógica principal (app + Firebase + Charts)
├── style1.css          # Estilos completos (tema claro/escuro)
├── firebase-config.js  # Config Firebase (NÃO commitar!)
├── firebase.rules.json # Regras de segurança do RTDB
├── apps-script.gs      # Google Apps Script (integração)
├── package.json        # Dependências npm
├── REGRAS_FIREBASE.md  # Documentação das regras
├── CHANGELOG.md        # Histórico de versões
├── README.md           # Este arquivo
├── _archive/
│   ├── beta/           # Versão beta original
│   └── beta1/          # Versão beta1 (antes de beta2)
└── docs/               # Documentação adicional
```

## Como rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev
```

O app abre em `http://localhost:8000`

### Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `planejamento-familiar-b3a1c`
3. Ative o **Realtime Database**
4. Aplique as regras de `firebase.rules.json`
5. Ative autenticação por **Email/Senha** e **Google**

## Funcionalidades

### Dashboard
- Visão geral com saldo, receitas e despesas do mês
- Acesso rápido (despesa, receita, transferência, importar)
- Gráfico de barras: divisão de gastos por categoria
- Gráfico doughnut: receitas por categoria
- Maiores gastos do mês

### Contas e Cartões
- Gerenciar contas bancárias (saldo, tipo)
- Gerenciar cartões de crédito (limite, bandeira, fatura)
- Contas a pagar e receber com vencimento

### Transações
- Modal para nova despesa/receita
- Categorias: Renda, Gastos Essenciais, Pessoais, Investimentos
- Pagamento à vista ou parcelado
- Histórico com filtros (todos, mensal, anual)

### Perfil do Usuário
- Avatar com dropdown (Minha Conta / Sair)
- Editar nome e foto de perfil
- Excluir conta (com confirmação)

### Investimentos
- Patrimônio atual (ativo, reserva)
- Simulador de rendimentos
- Carteira de investimentos

### Importação
- Upload de planilhas Excel (.xlsx) com drag-and-drop
- Backup e restore em JSON
- Exportação de dados

### Privacidade
- Modo local (sem login, dados no navegador)
- Modo online (Firebase Auth + RTDB)
- Tema claro/escuro

## Segurança

- **Firebase API Key**: pública por design; segurança vem das regras RTDB
- **Regras RTDB**: cada usuário só acessa seus próprios dados
- **`.gitignore`**: protege `firebase-config.js`, `.env`, `node_modules/`
- **Repo**: recomendado GitHub privado

## Tecnologias

- HTML5 + CSS3 + JavaScript (vanilla)
- [Firebase](https://firebase.google.com/) (Auth + Realtime Database)
- [Chart.js](https://www.chartjs.org/) (gráficos)
- [Font Awesome](https://fontawesome.com/) (ícones)
- [Google Fonts](https://fonts.google.com/) (Inter + Fraunces)
- [SheetJS](https://sheetjs.com/) (leitura de Excel)

## Licença

MIT
