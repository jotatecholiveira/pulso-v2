import puppeteer from 'puppeteer';
import { resolve } from 'path';

const OUTPUT = resolve('/home/jotatech/Downloads/Projeto_v2/v1/docs/security-audit/relatorio-auditoria-seguranca.pdf');
const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a2e; font-size: 10.5px; line-height: 1.55; }
  .page { page-break-after: always; padding: 40px 48px; min-height: 100vh; position: relative; }
  .page:last-child { page-break-after: avoid; }

  /* Cover */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); color: #fff; padding: 60px 48px; }
  .cover-logo { width: 72px; height: 72px; background: linear-gradient(135deg, #FF6B6B, #ee5a24); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; margin-bottom: 20px; color: #fff; }
  .cover h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.5px; }
  .cover h2 { font-size: 14px; font-weight: 400; color: #94a3b8; margin-bottom: 28px; }
  .cover-meta { font-size: 10.5px; color: #64748b; line-height: 2.1; }
  .cover-meta strong { color: #94a3b8; }

  h2 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 22px 0 10px 0; border-bottom: 2.5px solid #FF6B6B; padding-bottom: 5px; }
  h3 { font-size: 12.5px; font-weight: 700; color: #1e293b; margin: 14px 0 6px 0; }
  p { margin-bottom: 7px; }
  ul { padding-left: 16px; margin-bottom: 10px; }
  li { margin-bottom: 3px; }
  code { font-family: 'Courier New', monospace; font-size: 9.5px; background: #f1f5f9; padding: 1px 5px; border-radius: 3px; }

  .chip { display: inline-block; padding: 2px 9px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #fff; }
  .chip-critica { background: #B91C1C; }
  .chip-alta { background: #EA580C; }
  .chip-media { background: #D97706; }
  .chip-baixa { background: #2563EB; }
  .chip-informativa { background: #059669; }

  .summary-grid { display: flex; gap: 6px; margin: 14px 0; }
  .summary-card { flex: 1; text-align: center; padding: 10px 6px; border-radius: 8px; color: #fff; }
  .summary-card .num { font-size: 24px; font-weight: 800; }
  .summary-card .label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.4px; opacity: 0.9; }

  .charts { display: flex; gap: 20px; margin: 14px 0; }
  .chart-box { flex: 1; text-align: center; }
  .chart-box h4 { font-size: 10.5px; font-weight: 600; color: #64748b; margin-bottom: 6px; }

  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5px; }
  th { background: #0f172a; color: #fff; padding: 7px 8px; text-align: left; font-weight: 600; }
  td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }

  .strength-item { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 5px; font-size: 10px; }
  .strength-check { color: #059669; font-weight: 700; flex-shrink: 0; }

  .issue-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 10px 0; }
  .issue-block h4 { font-size: 11.5px; font-weight: 700; margin-bottom: 6px; }
  .issue-meta { font-size: 9px; color: #64748b; margin-bottom: 6px; }
  .issue-block pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 6px; font-size: 8.5px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 6px 0; line-height: 1.4; }
  .checklist { list-style: none; padding: 0; margin: 4px 0; }
  .checklist li { font-size: 9.5px; }
  .checklist li::before { content: "\\2610 "; }

  .methodology { background: #f1f5f9; border-radius: 8px; padding: 12px; margin: 14px 0; font-size: 9.5px; }

  .footer-line { position: absolute; bottom: 20px; left: 48px; right: 48px; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }

  .legend { margin-top: 6px; font-size: 9px; }
  .legend-item { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; justify-content: center; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
</style>
</head>
<body>

<div class="page cover">
  <div class="cover-logo">P</div>
  <h1>Relatório de Auditoria de Segurança</h1>
  <h2>Pulso — Gestão de Finanças</h2>
  <div class="cover-meta">
    <strong>Data:</strong> ${today}<br>
    <strong>Versão auditada:</strong> v3.1.9 (commit 2da781d)<br>
    <strong>Escopo:</strong> Frontend SPA, Firebase RTDB, deploy Cloudflare Pages, build Android (Capacitor)<br>
    <strong>Metodologia:</strong> Revisão manual de código-fonte + análise estática<br>
    <strong>Arquivos verificados:</strong> script.js (4685 linhas), login.html, index.html,<br>
    database-rules.json, _headers, android/app/build.gradle, service-worker.js
  </div>
</div>

<div class="page">
  <h2>1. Resumo Executivo</h2>

  <div class="summary-grid">
    <div class="summary-card" style="background:#B91C1C"><div class="num">0</div><div class="label">Críticas</div></div>
    <div class="summary-card" style="background:#EA580C"><div class="num">1</div><div class="label">Alta</div></div>
    <div class="summary-card" style="background:#D97706"><div class="num">3</div><div class="label">Médias</div></div>
    <div class="summary-card" style="background:#2563EB"><div class="num">1</div><div class="label">Baixa</div></div>
    <div class="summary-card" style="background:#059669"><div class="num">1</div><div class="label">Informativa</div></div>
  </div>

  <div class="charts">
    <div class="chart-box">
      <h4>Achados por Severidade</h4>
      <svg viewBox="0 0 160 160" width="150" height="150">
        <circle cx="80" cy="80" r="56" fill="none" stroke="#EA580C" stroke-width="22" stroke-dasharray="58.64 291.04" stroke-dashoffset="0" transform="rotate(-90 80 80)"/>
        <circle cx="80" cy="80" r="56" fill="none" stroke="#D97706" stroke-width="22" stroke-dasharray="175.93 291.04" stroke-dashoffset="-58.64" transform="rotate(-90 80 80)"/>
        <circle cx="80" cy="80" r="56" fill="none" stroke="#2563EB" stroke-width="22" stroke-dasharray="58.64 291.04" stroke-dashoffset="-234.57" transform="rotate(-90 80 80)"/>
        <circle cx="80" cy="80" r="56" fill="none" stroke="#059669" stroke-width="22" stroke-dasharray="58.64 291.04" stroke-dashoffset="-293.21" transform="rotate(-90 80 80)"/>
        <circle cx="80" cy="80" r="44" fill="#fff"/>
        <text x="80" y="76" text-anchor="middle" font-size="18" font-weight="800" fill="#0f172a">6</text>
        <text x="80" y="90" text-anchor="middle" font-size="8" fill="#64748b">achados</text>
      </svg>
      <div class="legend">
        <div class="legend-item"><span class="legend-dot" style="background:#EA580C"></span>Alta (1)</div>
        <div class="legend-item"><span class="legend-dot" style="background:#D97706"></span>Média (3)</div>
        <div class="legend-item"><span class="legend-dot" style="background:#2563EB"></span>Baixa (1)</div>
        <div class="legend-item"><span class="legend-dot" style="background:#059669"></span>Informativa (1)</div>
      </div>
    </div>
    <div class="chart-box">
      <h4>Achados por Categoria</h4>
      <svg viewBox="0 0 200 120" width="200" height="120">
        <text x="2" y="14" font-size="7.5" fill="#64748b">Banco s/ tranca</text>
        <rect x="88" y="4" width="30" height="12" rx="2" fill="#D97706"/>
        <text x="122" y="14" font-size="7.5" fill="#0f172a" font-weight="600">2</text>

        <text x="2" y="32" font-size="7.5" fill="#64748b">Permissão browser</text>
        <rect x="88" y="22" width="0" height="12" rx="2" fill="#94a3b8"/>
        <text x="122" y="32" font-size="7.5" fill="#0f172a" font-weight="600">N/A</text>

        <text x="2" y="50" font-size="7.5" fill="#64748b">IDOR</text>
        <rect x="88" y="40" width="0" height="12" rx="2" fill="#94a3b8"/>
        <text x="122" y="50" font-size="7.5" fill="#0f172a" font-weight="600">N/A</text>

        <text x="2" y="68" font-size="7.5" fill="#64748b">Chaves expostas</text>
        <rect x="88" y="58" width="45" height="12" rx="2" fill="#EA580C"/>
        <text x="137" y="68" font-size="7.5" fill="#0f172a" font-weight="600">2</text>

        <text x="2" y="86" font-size="7.5" fill="#64748b">XSS / Inputs</text>
        <rect x="88" y="76" width="45" height="12" rx="2" fill="#D97706"/>
        <text x="137" y="86" font-size="7.5" fill="#0f172a" font-weight="600">2</text>

        <text x="2" y="104" font-size="7.5" fill="#64748b">Pontos fortes</text>
        <rect x="88" y="94" width="80" height="12" rx="2" fill="#059669"/>
        <text x="172" y="104" font-size="7.5" fill="#0f172a" font-weight="600">10+</text>
      </svg>
    </div>
  </div>

  <div class="methodology">
    <strong>Metodologia:</strong> Auditoria manual de código-fonte + análise estática. Cada categoria de segurança foi mapeada para a stack: Firebase RTDB rules (isolamento), frontend-only SPA (sem backend), DOMPurify + escapeHTML (XSS). Cada achado foi verificado linha por linha no código real. Não há especulações.
  </div>

  <h2>2. Pontos Fortes</h2>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Firebase RTDB rules isolam dados por uid</strong> — <code>auth.uid === $uid</code> impede acesso cruzado. (<code>database-rules.json:7-8</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Todas interpolações em innerHTML usam escapeHTML()</strong> — ~80+ pontos de renderização revisados em <code>script.js</code>. Zero XSS refletido/Stored.</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>DOMPurify + escapeHTML() como defesa em profundidade</strong> — <code>setHTML()</code>, <code>safe()</code>, <code>escapeHTML()</code> aplicados consistentemente. (<code>script.js:335-353</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Rate limiting no login</strong> — 5 tentativas, lockout 60s, cooldown 2s. (<code>script.js:720-740</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Session timeout 15min</strong> — auto-logout por inatividade. (<code>script.js:742-758</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>CSP headers completos</strong> — X-Frame-Options DENY, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. (<code>_headers:1-8</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>SRI em dependências CDN</strong> — Firebase SDK, DOMPurify, xlsx, chart.js todos com integrity hash. (<code>login.html:13-16</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Sanitização de dados de entrada</strong> — <code>sanitize()</code> limita campos (user 60 chars, desc 200, val >= 0). (<code>script.js:444-459</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Service Worker seguro</strong> — não intercepta cross-origin, não cacheia Firebase. (<code>service-worker.js:36-43</code>)</div></div>
  <div class="strength-item"><span class="strength-check">&#10003;</span><div><strong>Autenticação dupla</strong> — Email/senha + Google OAuth com tratamento de erros granular. (<code>script.js:761-822</code>)</div></div>

  <div class="footer-line">
    <span>Relatório de Auditoria — Pulso v3.1.9</span>
    <span>${today}</span>
  </div>
</div>

<div class="page">
  <h2>3. Achados Detalhados</h2>

  <table>
    <thead>
      <tr><th style="width:72px">Severidade</th><th style="width:130px">Arquivo:linha</th><th>Descrição</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="chip chip-alta">Alta</span></td>
        <td><code>android/app/build.gradle:22-24</code></td>
        <td><strong>Keystore password em plaintext no código-fonte</strong><br>
        <code>storePassword "pulso123"</code>, <code>keyAlias "pulso"</code>, <code>keyPassword "pulso123"</code> — qualquer pessoa com acesso ao repo pode assinar APKs como o autor.</td>
      </tr>
      <tr>
        <td><span class="chip chip-media">Média</span></td>
        <td><code>database-rules.json:16</code></td>
        <td><strong>Regra de leitura aberta em /feedbacks</strong><br>
        <code>".read": "auth != null"</code> — qualquer autenticado lê TODOS os feedbacks (uid, email, displayName, photoURL, userAgent de outros).</td>
      </tr>
      <tr>
        <td><span class="chip chip-media">Média</span></td>
        <td><code>script.js:3726-3734</code></td>
        <td><strong>Dados pessoais no payload de feedbacks</strong><br>
        Payload inclui uid, displayName, email, photoURL, version, userAgent — expostos via regra aberta de leitura.</td>
      </tr>
      <tr>
        <td><span class="chip chip-media">Média</span></td>
        <td><code>login.html:9</code>, <code>index.html:9</code>, <code>_headers:8</code></td>
        <td><strong>CSP com unsafe-eval desnecessário</strong><br>
        <code>'unsafe-eval'</code> no script-src, mas código não usa eval/new Function.</td>
      </tr>
      <tr>
        <td><span class="chip chip-baixa">Baixa</span></td>
        <td><code>script.js:7-15</code></td>
        <td><strong>Firebase config hardcoded</strong><br>
        API key pública por design do Firebase — Application Restrictions devem estar ativas no GCP Console.</td>
      </tr>
      <tr>
        <td><span class="chip chip-informativa">Informativa</span></td>
        <td><code>script.js:346,352</code></td>
        <td><strong>DOMPurify sem config restritiva</strong><br>
        <code>DOMPurify.sanitize()</code> usa config padrão. Poderia ter ALLOWED_TAGS customizados.</td>
      </tr>
    </tbody>
  </table>

  <h2>4. Recomendações Priorizadas</h2>

  <h3><span class="chip chip-alta">P1</span> Corrigir AGORA</h3>
  <ul>
    <li><strong>Keystore:</strong> Mover senhas para <code>local.properties</code> (já no .gitignore). Se repo foi público, regenerar keystore.</li>
  </ul>

  <h3><span class="chip chip-media">P2</span> Corrigir em breve</h3>
  <ul>
    <li><strong>Feedbacks:</strong> Trocar leitura para <code>"auth.uid === $data.child('uid').val()"</code> ou remover campos sensíveis do payload.</li>
    <li><strong>CSP:</strong> Remover <code>'unsafe-eval'</code> de todas as páginas e _headers.</li>
    <li><strong>Payload:</strong> Remover email, photoURL, userAgent do payload de feedbacks.</li>
  </ul>

  <h3><span class="chip chip-baixa">P3</span> Melhorias</h3>
  <ul>
    <li><strong>Firebase restrictions:</strong> Verificar HTTP referrer restrictions e App Check no GCP Console.</li>
    <li><strong>DOMPurify:</strong> Configurar ALLOWED_TAGS/ALLOWED_ATTR customizados.</li>
    <li><strong>Unsafe-inline:</strong> Migrar scripts inline para arquivos externos + nonce no CSP.</li>
  </ul>

  <h2>5. Categorias N/A</h2>
  <p><strong>Permissão no navegador vs backend:</strong> Não se aplica. Frontend-only SPA sem backend. Firebase RTDB rules são o equivalente server-side e estão configuradas corretamente.</p>
  <p><strong>IDOR:</strong> Não se aplica. Operações usam paths com <code>currentUser.uid</code> e regras validam <code>auth.uid === $uid</code>. Sem endpoints parameterizados por ID de objeto.</p>

  <div class="footer-line">
    <span>Relatório de Auditoria — Pulso v3.1.9</span>
    <span>${today}</span>
  </div>
</div>

<div class="page">
  <h2>6. Issues para o GitHub</h2>

  <div class="issue-block">
    <h4>[Segurança] Keystore password em plaintext no build.gradle</h4>
    <div class="issue-meta"><span class="chip chip-alta">Alta</span> &nbsp; labels: security, high</div>
    <p><strong>Problema:</strong> Senhas do keystore de release hardcoded em <code>android/app/build.gradle</code>.</p>
    <p><strong>Evidência:</strong> <code>android/app/build.gradle:22-24</code></p>
    <pre>signingConfigs {
    release {
        storeFile file("pulso-release.keystore")
        storePassword "pulso123"
        keyAlias "pulso"
        keyPassword "pulso123"
    }
}</pre>
    <p><strong>Impacto:</strong> Qualquer pessoa com acesso ao repo pode assinar APKs falsificados. Se repo foi público, keystore comprometido.</p>
    <p><strong>Correção:</strong> Mover para <code>local.properties</code>: <code>storePassword = project.findProperty('STORE_PASSWORD') ?: ''</code></p>
    <p><strong>Critérios de aceite:</strong></p>
    <ul class="checklist">
      <li>Senhas removidas de build.gradle</li>
      <li>Senhas em local.properties ou variáveis de ambiente</li>
      <li>Build de release funciona com novas variáveis</li>
      <li>Se repo foi público, keystore regenerado</li>
    </ul>
  </div>

  <div class="issue-block">
    <h4>[Segurança] Regra de leitura aberta em feedbacks expõe dados pessoais</h4>
    <div class="issue-meta"><span class="chip chip-media">Média</span> &nbsp; labels: security, medium</div>
    <p><strong>Problema:</strong> Qualquer autenticado lê TODOS os feedbacks (uid, email, displayName, photoURL, userAgent).</p>
    <p><strong>Evidência:</strong> <code>database-rules.json:16</code>, <code>script.js:3726-3734</code></p>
    <pre>"feedbacks": {
  ".read": "auth != null",   // qualquer autenticado le tudo
  ".write": "auth != null",
  "$pushId": {
    ".validate": "newData.hasChildren(['uid','message','createdAt'])..."
  }
}

// Payload (script.js:3726-3734)
const payload = {
    uid: currentUser.uid,
    displayName: currentUser.displayName || '',
    email: currentUser.email || '',
    photoURL: currentUser.photoURL || '',
    message: msg,
    userAgent: navigator.userAgent.slice(0,300)
};</pre>
    <p><strong>Correção:</strong> <code>".read": "auth.uid === $data.child('uid').val()"</code> ou remover campos sensíveis.</p>
    <ul class="checklist">
      <li>Regra de leitura restrita ao autor</li>
      <li>Ou campos sensíveis removidos do payload</li>
      <li>Teste: usuário A não lê feedbacks de usuário B</li>
    </ul>
  </div>

  <div class="issue-block">
    <h4>[Segurança] CSP inclui unsafe-eval que não é utilizado</h4>
    <div class="issue-meta"><span class="chip chip-media">Média</span> &nbsp; labels: security, medium</div>
    <p><strong>Problema:</strong> <code>'unsafe-eval'</code> no script-src sem uso no código (zero chamadas a eval/new Function).</p>
    <p><strong>Evidência:</strong> <code>login.html:9</code>, <code>index.html:9</code>, <code>_headers:8</code></p>
    <pre>script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com ...;</pre>
    <p><strong>Correção:</strong> Remover <code>'unsafe-eval'</code> de todas as diretivas CSP.</p>
    <ul class="checklist">
      <li>unsafe-eval removido de login.html, index.html e _headers</li>
      <li>App funciona sem unsafe-eval</li>
      <li>Grep confirma zero eval/new Function no código</li>
    </ul>
  </div>

  <div class="issue-block">
    <h4>[Segurança] Firebase API key sem restrições verificáveis</h4>
    <div class="issue-meta"><span class="chip chip-baixa">Baixa</span> &nbsp; labels: security, low</div>
    <p><strong>Problema:</strong> Firebase config hardcoded — Application Restrictions não verificáveis por código.</p>
    <p><strong>Evidência:</strong> <code>script.js:7-15</code></p>
    <p><strong>Correção:</strong> Configurar HTTP referrer restrictions, App Check, SHA-1 no GCP Console.</p>
    <ul class="checklist">
      <li>HTTP referrer restrictions configuradas</li>
      <li>App Check habilitado</li>
      <li>SHA-1 do keystore registrado</li>
    </ul>
  </div>

  <div class="issue-block">
    <h4>[Segurança] DOMPurify config padrão + CSP unsafe-inline</h4>
    <div class="issue-meta"><span class="chip chip-informativa">Informativa</span> &nbsp; labels: security, info</div>
    <p><strong>Problema:</strong> DOMPurify sem ALLOWED_TAGS customizados. CSP com unsafe-inline para scripts.</p>
    <p><strong>Evidência:</strong> <code>script.js:346</code>, <code>login.html:9</code></p>
    <p><strong>Correção:</strong> Configurar DOMPurify com tags explícitas. Migrar scripts inline para externos + nonce.</p>
    <ul class="checklist">
      <li>DOMPurify com ALLOWED_TAGS/ALLOWED_ATTR</li>
      <li>Scripts inline migrados (opcional)</li>
    </ul>
  </div>

  <div class="footer-line">
    <span>Relatório de Auditoria — Pulso v3.1.9</span>
    <span>${today}</span>
  </div>
</div>

</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.pdf({
    path: OUTPUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    displayHeaderFooter: false,
  });
  await browser.close();
  console.log('PDF gerado: ' + OUTPUT);
})();
