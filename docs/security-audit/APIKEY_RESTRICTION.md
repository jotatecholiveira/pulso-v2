# Firebase API Key — Restrição de Aplicativo (console)

A `apiKey` do Firebase é **pública por design** (vem embutida no cliente SPA), então
não é um "segredo" no sentido tradicional. O risco real é alguém **abusar da sua
chave** (esgotar quota, tentar acessar seu projeto). A mitigação correta é a
**Application Restriction**, feita no console (não via código):

## Passo a passo
1. **Firebase Console → Authentication → Settings → Authorized domains**
   - Confirme que o domínio do seu site (e `localhost` para dev) está listado.
   - Isso já bloqueia `auth/unauthorized-domain` para origens estranhas.

2. **Google Cloud Console → APIs & Services → Credentials**
   - Localize a chave "Web client (auto created by Google Service)"/"Browser key".
   - Em **Application restrictions**, escolha **HTTP referrers (web sites)** e
     adicione:
     - `https://<seu-dominio>.pages.dev/*`
     - `https://<seu-dominio>.com/*` (se houver domínio próprio)
     - `http://localhost/*` (apenas dev)
   - Em **API restrictions**, restrinja à *Identity Toolkit API* (e *Realtime
     Database API* se aplicável).

3. **App Android** (se distribuir o APK):
   - Em **Application restrictions**, adicione a **SHA-1** do seu keystore de
     release (e debug) à mesma chave (ou crie uma chave Android separada).
   - O `android/app/google-services.json` já foi removido do git (`.gitignore`).

## Rotação (se a chave vazou)
- No Cloud Console → Credentials, abra a chave e clique em **Regenerate key**.
- Atualize `firebase-config.js` / `www/firebase-config.js` localmente com a nova
  chave e re-deploy. A chave antiga é invalidada.

> Observação: manter a `apiKey` no repositório é aceitável **desde que** haja
> Application Restriction + domínios autorizados. Não há benefício em "esconder"
> essa chave no cliente de um SPA estático.
