# Changelog — Finanço

## v2.0-beta2 (18/08/2026)

### Novo
- **Perfil do usuário**: avatar com dropdown (Minha Conta / Sair)
- **Modal de perfil**: editar nome, foto de perfil (upload com preview), excluir conta
- **Gráfico de receitas**: doughnut Chart.js mostrando receitas por categoria
- **Upload de planilhas**: zona de drag-and-drop com preview do arquivo selecionado
- **Saudação personalizada**: mostra nome do usuário em vez do email

### Corrigido
- **CRÍTICO**: modais de conta bancária, cartão, contas a pagar/receber não abriam no desktop (CSS dentro de media query errada)

### Melhorado
- **Layout do dashboard**: receitas/despesas mais centralizados e com mais destaque
- **Seção inferior reorganizada**: contas a pagar e receber lado a lado, maiores gastos em destaque
- **Removido badge "Sincronizado"**: poluição visual reduzida

### Arquivado
- `_archive/beta/` — versão beta original (app.js, style.css, style2.css, login.js, etc.)
- `_archive/beta1/` — versão beta1 (antes das mudanças de perfil/layout)

---

## v2.0-beta1 (17/08/2026)

### Features
- Dashboard com visão geral (saldo, faturas, contas, cartões)
- Modal de transação (despesa/receita) com categorias
- Modais estilizados para conta bancária, cartão de crédito, contas a pagar/receber
- Gráfico de barras "Divisão de Gastos" (CSS puro)
- Seção de investimentos com patrimônio e metas
- Histórico de transações com filtros
- Backup/restore JSON
- Importação de planilhas Excel
- Modo offline/local storage
- Tema claro/escuro
- Responsivo (desktop + mobile)

---

## v2.0-beta (15/08/2026)

### Features
- Versão inicial do app financeiro
- Layout com sidebar + conteúdo principal
- Autenticação Firebase (email/senha + Google)
- Sistema de categorias (Gastos Essenciais, Pessoais, Renda, Investimentos)
- Sincronização com Firebase Realtime Database
