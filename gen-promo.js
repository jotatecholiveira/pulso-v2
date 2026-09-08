const sharp = require('sharp');
const path = require('path');
const outDir = path.join(__dirname, 'promo-assets');

const fs = require('fs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generate() {
  // === THUMBNAIL 240x240 ===
  const thumbnailSvg = `
  <svg width="240" height="240" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f0a2e"/>
        <stop offset="40%" stop-color="#1a103d"/>
        <stop offset="100%" stop-color="#2d1b69"/>
      </linearGradient>
      <radialGradient id="glow1" cx="30%" cy="20%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow2" cx="70%" cy="80%">
        <stop offset="0%" stop-color="#f47252" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#f47252" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="240" height="240" rx="24" fill="url(#bg)"/>
    <rect width="240" height="240" rx="24" fill="url(#glow1)"/>
    <rect width="240" height="240" rx="24" fill="url(#glow2)"/>
    <text x="120" y="115" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="72" font-weight="900" fill="white" letter-spacing="-3">p<tspan fill="#818cf8">ulso</tspan></text>
    <text x="120" y="145" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="500" fill="rgba(255,255,255,0.6)">Master your money</text>
  </svg>`;
  await sharp(Buffer.from(thumbnailSvg)).png().toFile(path.join(outDir, 'thumbnail.png'));
  console.log('OK thumbnail.png');

  // === SLIDE 1 - HERO 1270x760 ===
  const heroSvg = `
  <svg width="1270" height="760" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f0a2e"/>
        <stop offset="30%" stop-color="#1a103d"/>
        <stop offset="70%" stop-color="#2d1b69"/>
        <stop offset="100%" stop-color="#0f0a2e"/>
      </linearGradient>
      <radialGradient id="g1" cx="50%" cy="30%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx="80%" cy="70%">
        <stop offset="0%" stop-color="#f47252" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#f47252" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1270" height="760" fill="url(#bg)"/>
    <rect width="1270" height="760" fill="url(#g1)"/>
    <rect width="1270" height="760" fill="url(#g2)"/>
    ${Array.from({length: 20}, (_, i) => Array.from({length: 12}, (_, j) =>
      `<circle cx="${60 + j * 110}" cy="${40 + i * 40}" r="1" fill="rgba(255,255,255,0.05)"/>`
    ).join('')).join('')}
    <text x="635" y="300" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="110" font-weight="900" fill="white" letter-spacing="-4">p<tspan fill="#818cf8">ulso</tspan></text>
    <text x="635" y="360" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="32" font-weight="500" fill="rgba(255,255,255,0.8)">Master your money rhythm</text>
    <text x="635" y="400" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="400" fill="rgba(255,255,255,0.45)">Controle financeiro completo, gratuito, sem complicacoes</text>
    <rect x="475" y="440" width="320" height="44" rx="22" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.4)" stroke-width="1"/>
    <text x="635" y="468" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" fill="#818cf8">Free &#8226; Complete &#8226; No Compromises</text>
  </svg>`;
  await sharp(Buffer.from(heroSvg)).png().toFile(path.join(outDir, 'gallery-1-hero.png'));
  console.log('OK gallery-1-hero.png');

  // === SLIDE 2 - FEATURES 1270x760 ===
  const featuresSvg = `
  <svg width="1270" height="760" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f0a2e"/>
        <stop offset="100%" stop-color="#1a103d"/>
      </linearGradient>
      <radialGradient id="g1" cx="80%" cy="20%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1270" height="760" fill="url(#bg)"/>
    <rect width="1270" height="760" fill="url(#g1)"/>

    <!-- Left text -->
    <text x="80" y="280" font-family="Inter,system-ui,sans-serif" font-size="50" font-weight="800" fill="white">Everything you need to</text>
    <text x="80" y="340" font-family="Inter,system-ui,sans-serif" font-size="50" font-weight="800" fill="#818cf8">manage your money</text>
    <text x="80" y="390" font-family="Inter,system-ui,sans-serif" font-size="18" fill="rgba(255,255,255,0.45)">Track expenses, income, credit cards,</text>
    <text x="80" y="416" font-family="Inter,system-ui,sans-serif" font-size="18" fill="rgba(255,255,255,0.45)">investments, bills, and savings goals.</text>

    <!-- Feature cards -->
    <!-- Card 1 -->
    <rect x="680" y="120" width="510" height="88" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="704" y="140" width="48" height="48" rx="12" fill="rgba(34,197,94,0.15)"/>
    <text x="728" y="172" text-anchor="middle" font-size="22">&#128176;</text>
    <text x="772" y="158" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="700" fill="white">Smart Dashboard</text>
    <text x="772" y="178" font-family="Inter,system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.45)">Real-time balance, charts and monthly overview</text>

    <!-- Card 2 -->
    <rect x="680" y="224" width="510" height="88" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="704" y="244" width="48" height="48" rx="12" fill="rgba(99,102,241,0.15)"/>
    <text x="728" y="276" text-anchor="middle" font-size="22">&#128202;</text>
    <text x="772" y="262" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="700" fill="white">Reports &amp; Analytics</text>
    <text x="772" y="282" font-family="Inter,system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.45)">Category breakdown, trends, and yearly comparison</text>

    <!-- Card 3 -->
    <rect x="680" y="328" width="510" height="88" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="704" y="348" width="48" height="48" rx="12" fill="rgba(244,114,82,0.15)"/>
    <text x="728" y="380" text-anchor="middle" font-size="22">&#128179;</text>
    <text x="772" y="366" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="700" fill="white">Credit Cards &amp; Bills</text>
    <text x="772" y="386" font-family="Inter,system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.45)">Track invoices, due dates, and spending limits</text>

    <!-- Card 4 -->
    <rect x="680" y="432" width="510" height="88" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="704" y="452" width="48" height="48" rx="12" fill="rgba(236,72,153,0.15)"/>
    <text x="728" y="484" text-anchor="middle" font-size="22">&#127919;</text>
    <text x="772" y="470" font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="700" fill="white">Goals &amp; Investments</text>
    <text x="772" y="490" font-family="Inter,system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.45)">Emergency fund, portfolios, and projected returns</text>
  </svg>`;
  await sharp(Buffer.from(featuresSvg)).png().toFile(path.join(outDir, 'gallery-2-features.png'));
  console.log('OK gallery-2-features.png');

  // === SLIDE 3 - DASHBOARD 1270x760 ===
  const dashSvg = `
  <svg width="1270" height="760" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g1" cx="50%" cy="100%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1270" height="760" fill="#0f0a2e"/>
    <rect width="1270" height="760" fill="url(#g1)"/>

    <!-- Header -->
    <text x="60" y="60" font-family="Inter,system-ui,sans-serif" font-size="24" font-weight="700" fill="white">Dashboard Overview</text>
    <text x="1210" y="60" text-anchor="end" font-family="Inter,system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">pulso-5ui.pages.dev</text>

    <!-- Card 1 - Balance -->
    <rect x="60" y="90" width="575" height="140" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="84" y="120" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="1">BALANCE</text>
    <text x="84" y="160" font-family="Inter,system-ui,sans-serif" font-size="40" font-weight="800" fill="#22c55e">R$ 12.450,00</text>
    <rect x="84" y="186" width="527" height="6" rx="3" fill="rgba(255,255,255,0.1)"/>
    <rect x="84" y="186" width="380" height="6" rx="3" fill="#22c55e"/>

    <!-- Card 2 - Expenses -->
    <rect x="655" y="90" width="575" height="140" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="679" y="120" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="1">MONTHLY EXPENSES</text>
    <text x="679" y="160" font-family="Inter,system-ui,sans-serif" font-size="40" font-weight="800" fill="#ef4444">- R$ 4.230,50</text>
    <rect x="679" y="186" width="527" height="6" rx="3" fill="rgba(255,255,255,0.1)"/>
    <rect x="679" y="186" width="240" height="6" rx="3" fill="#f59e0b"/>

    <!-- Card 3 - Chart -->
    <rect x="60" y="250" width="575" height="200" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="84" y="280" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="1">INCOME VS EXPENSES</text>
    ${Array.from({length: 12}, (_, i) => {
      const h = [60,45,70,35,55,20,65,50,30,40,75,60][i];
      const filled = h > 25;
      const x = 90 + i * 42;
      const barH = h * 1.8;
      return `<rect x="${x}" y="${420 - barH}" width="30" height="${barH}" rx="3" fill="${filled ? '#818cf8' : 'rgba(255,255,255,0.06)'}"/>`;
    }).join('\n    ')}

    <!-- Card 4 - Emergency Fund -->
    <rect x="655" y="250" width="575" height="200" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="679" y="280" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="1">EMERGENCY FUND</text>
    <text x="679" y="320" font-family="Inter,system-ui,sans-serif" font-size="40" font-weight="800" fill="white">R$ 8.200,00</text>
    <rect x="679" y="346" width="527" height="6" rx="3" fill="rgba(255,255,255,0.1)"/>
    <rect x="679" y="346" width="290" height="6" rx="3" fill="#22c55e"/>
    <text x="679" y="374" font-family="Inter,system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.4)">Goal: R$ 40.000 (6 months of expenses)</text>

    <!-- Bottom bar - Account info -->
    <rect x="60" y="480" width="1170" height="260" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="84" y="515" font-family="Inter,system-ui,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="1">RECENT TRANSACTIONS</text>
    ${['Supermercado - R$ 245,90','Salario - R$ 8.500,00','Netflix - R$ 39,90','Uber - R$ 67,30','Farmacia - R$ 89,00','Freelance - R$ 1.200,00'].map((t, i) => {
      const y = 545 + i * 30;
      const isIncome = t.includes('Salario') || t.includes('Freelance');
      return `<text x="104" y="${y}" font-family="Inter,system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">${t.split(' - ')[0]}</text>
    <text x="1210" y="${y}" text-anchor="end" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="600" fill="${isIncome ? '#22c55e' : '#ef4444'}">${isIncome ? '+' : '-'} ${t.split(' - ')[1]}</text>`;
    }).join('\n    ')}
  </svg>`;
  await sharp(Buffer.from(dashSvg)).png().toFile(path.join(outDir, 'gallery-3-dashboard.png'));
  console.log('OK gallery-3-dashboard.png');

  // === SLIDE 4 - PRIVACY 1270x760 ===
  const privacySvg = `
  <svg width="1270" height="760" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f0a2e"/>
        <stop offset="100%" stop-color="#1a103d"/>
      </linearGradient>
      <radialGradient id="g1" cx="50%" cy="30%">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1270" height="760" fill="url(#bg)"/>
    <rect width="1270" height="760" fill="url(#g1)"/>

    <!-- Shield icon -->
    <text x="635" y="220" text-anchor="middle" font-size="80">&#128274;</text>

    <text x="635" y="300" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="52" font-weight="800" fill="white">Your data, <tspan fill="#22c55e">your rules</tspan></text>
    <text x="635" y="345" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="20" fill="rgba(255,255,255,0.5)">Everything is saved on your Firebase account</text>
    <text x="635" y="375" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="20" fill="rgba(255,255,255,0.5)">Only you have access. No tracking, no data selling.</text>

    <!-- Privacy items -->
    <!-- Item 1 -->
    <rect x="190" y="440" width="200" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="290" y="490" text-anchor="middle" font-size="30">&#128737;&#65039;</text>
    <text x="290" y="520" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="700" fill="white">Encrypted</text>
    <text x="290" y="542" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.4)">HTTPS everywhere</text>

    <!-- Item 2 -->
    <rect x="420" y="440" width="200" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="520" y="490" text-anchor="middle" font-size="30">&#128100;</text>
    <text x="520" y="520" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="700" fill="white">Private</text>
    <text x="520" y="542" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.4)">Your Firebase, your data</text>

    <!-- Item 3 -->
    <rect x="650" y="440" width="200" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="750" y="490" text-anchor="middle" font-size="30">&#128241;</text>
    <text x="750" y="520" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="700" fill="white">Works Offline</text>
    <text x="750" y="542" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.4)">PWA with local cache</text>

    <!-- Item 4 -->
    <rect x="880" y="440" width="200" height="140" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="980" y="490" text-anchor="middle" font-size="30">&#127760;</text>
    <text x="980" y="520" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="700" fill="white">Multilingual</text>
    <text x="980" y="542" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.4)">PT, EN, ES</text>
  </svg>`;
  await sharp(Buffer.from(privacySvg)).png().toFile(path.join(outDir, 'gallery-4-privacy.png'));
  console.log('OK gallery-4-privacy.png');

  console.log('\nAll images in:', outDir);
}

generate().catch(err => { console.error(err); process.exit(1); });
