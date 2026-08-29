# Firebase Realtime Database — Regras de Segurança (cole no console)

Cole o JSON abaixo em **Firebase Console → Realtime Database → Rules** e clique em
**Publish**.

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "investimentos": {
      ".read": true,
      ".write": false
    }
  }
}
```

## O que cada linha faz
- `".read": false` / `".write": false` (raiz): **nega tudo por padrão**. Qualquer
  path não declarado abaixo fica inacessível — resolve o F-04 (regras ausentes).
- `users/$uid`: só o próprio dono (`auth.uid === $uid`) pode ler/escrever seus dados.
  Isolamento de tenant correto.
- `investimentos`: **leitura pública, SEM escrita** (`".write": false`). O app lê esse
  nó sem autenticação (market data), mas ninguém pode alterá-lo. Resolve o F-01
  (antes o nó era público E gravável por default).

## Validação rápida (opcional, após publicar)
No próprio editor de Rules do console existe a aba **Simulator**:
1. Selecione `users/<SEU_UID>/transactions` como path.
2. Marque "Authenticated" com seu UID → deve permitir leitura/escrita.
3. Use um UID diferente ou "Unauthenticated" → deve **negar**.
4. Teste `investimentos` como "Unauthenticated" → leitura permitida, escrita negada.

## Mais segurança (próximo passo, P1)
Para evitar que um usuário autenticado qualquer grave em `users/<outro_uid>`, as
regras acima já cobrem isso. Se quiser validar o formato dos dados, adicione
`.validate` por nó (ex.: `transactions` só aceita objetos com `val` numérico),
mas cuidado para não bloquear escritas parciais do app.
