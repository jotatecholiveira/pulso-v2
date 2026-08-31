# Pulso

Pulso é uma aplicação web de gestão financeira pessoal e familiar, com foco em organização, clareza visual e acompanhamento de fluxo de caixa. O produto foi pensado para uso em desktop e mobile, com dashboard dinâmico, registros de receitas e despesas, visão por período e suporte a importação de dados.

## Visão geral

- Dashboard com indicadores financeiros
- Lançamentos de receitas e despesas
- Histórico e filtros por período
- Investimentos e visão de carteira
- Importação de planilhas em Excel/CSV
- Autenticação com Firebase
- Persistência no navegador e sincronização em nuvem
- Interface responsiva para web e mobile

## Stack

- HTML / CSS / JavaScript puro
- Firebase Auth + Realtime Database
- Chart.js para gráficos
- Cloudflare Pages para hospedagem
- Capacitor para empacotamento Android

## Execução local

1. Acesse a pasta do projeto:
   npm install
2. Inicie o servidor local:
   npm start
3. Abra no navegador:
   http://localhost:8000

## Estrutura principal

- `index.html` — interface principal
- `login.html` — tela de login
- `style1.css` — estilos da aplicação
- `script.js` — lógica da aplicação
- `firebase-config.js` — configuração do Firebase (quando aplicável)
- `manifest.json` — configuração PWA
- `service-worker.js` — cache e suporte offline
- `docs/` — documentação do projeto
- `android/` — projeto Android com Capacitor

## Segurança e uso

A API key do Firebase em aplicações web é pública por design e não deve ser tratada como segredo. O risco real de exposição está em regras de banco, domínio autorizado, autenticação, App Check e validação de acesso no console do Firebase.

## Direitos autorais e autoria

Este projeto foi desenvolvido por João Pedro de Oliveira, com colaboração de BMO. Uso, adaptação e reprodução devem manter a atribuição adequada aos autores.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
