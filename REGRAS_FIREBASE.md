# 🔐 Como aplicar as regras de segurança no Firebase

As regras em `firebase.rules.json` garantem que **cada usuário só leia/escreva os próprios dados**. Sem isso, a chave pública da API permitiria que qualquer pessoa acessasse os dados de todos.

---

## Passo a passo (2 minutos)

1. Abra o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **planejamento-familiar-b3a1c**
3. No menu lateral: **Build → Realtime Database**
4. Aba **Regras** (Rules)
5. Substitua tudo pelo conteúdo de `firebase.rules.json`
6. Clique em **Publicar** (Publish)

---

## O que as regras fazem

| Regra | Efeito |
|-------|--------|
| `".read": "auth != null && auth.uid === \$uid"` | Só o dono do UID lê seus dados |
| `".write": "auth != null && auth.uid === \$uid"` | Só o dono escreve seus dados |
| `".indexOn": ["date", "type"]` | Permite consultas rápidas por data/tipo |
| `planoInvestimento` validação | Garante estrutura mínima ao salvar |

---

## Teste rápido

Depois de publicar:
1. Abra o app, faça login
2. Adicione um lançamento
3. No Console → Realtime Database → Data, você verá:
   ```
   users
     └── SEU_UID
         └── transactions
             └── -Nxxx...
   ```
4. Tente abrir `https://SEU_PROJETO.firebaseio.com/users/OUTRO_UID/transactions.json` no navegador → deve dar **Permission denied**.

---

## ⚠️ Importante

- **NÃO** use regras públicas (`.read": true`) em produção
- A chave da API (`AIzaSyC9w1J7l-nfG0rJRK41g21lRP7MQfQbt3zY`) **é pública por design** — a segurança vem **das regras**, não do segredo da chave
- Se precisar de acesso admin (backup total), adicione uma regra `auth.token.admin === true` e defina custom claim no usuário

---

## Se o app ficar "Modo local" após login

Significa que o Realtime Database **não está habilitado** no projeto ou as regras impediram a conexão.
1. Verifique se o RTDB está ativo (Build → Realtime Database → "Criar banco de dados")
2. Região recomendada: `us-central1` ou `southamerica-east1`
3. Regras publicadas conforme acima