#!/usr/bin/env python3
"""Gera relatorio de auditoria de seguranca em PDF (reportlab apenas)."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend
from xml.sax.saxutils import escape as _xesc


def esc(s):
    return _xesc(str(s))

# ----------------------------------------------------------------------------
# Dados da auditoria
# ----------------------------------------------------------------------------
PROJECT = "Pulso — Controle Financeiro"
STACK = ("Frontend vanilla HTML/CSS/JS (sem framework) · Firebase Auth "
         "(email/senha + Google) · Firebase Realtime Database (RTDB) · "
         "Cloudflare Pages (deploy por push GitHub) · Capacitor Android · "
         "Sem backend próprio (regras de negócio no cliente + Security Rules)")

FINDINGS = [
    {
        "id": "F-01",
        "cat": "Banco sem tranca (Isolamento de tenant)",
        "sev": "CRÍTICA",
        "title": "Path 'investimentos' do RTDB acessível sem autenticação",
        "loc": "script.js:2655, script.js:2658, script.js:2769",
        "desc": (
            "O banco de dados Firebase Realtime Database (RTDB) expõe um path "
            "raiz 'investimentos' que é lido e escutado sem qualquer verificação "
            "de auth. Em database-rules.json não há regra para esse path, logo o "
            "comportamento default do Firebase é 'read/write público'. O código "
            "faz fetch(INVEST_DB_URL + '/investimentos.json') e db.ref('investimentos') "
            "sem token. Qualquer pessoa com a URL do projeto pode ler (e possivelmente "
            "escrever) dados de investimento de todos os usuários."
        ),
        "fix": (
            "Adicionar em database-rules.json uma regra restritiva para 'investimentos' "
            "(ex.: read/write: false, ou restringir por usuário convidado). Se o dado for "
            "realmente público (cotações), mover para um path dedicado e documentar; "
            "nunca misturar dado público com dado de usuário no mesmo nó raiz."
        ),
        "prio": "P0",
    },
    {
        "id": "F-02",
        "cat": "Chaves expostas",
        "sev": "ALTA",
        "title": "Configuração Firebase (apiKey, projectId, DB URL) hardcoded e commitada",
        "loc": ("firebase-config.js:5-11, www/firebase-config.js:5-11, "
                "script.js:7-15, android/app/google-services.json"),
        "desc": (
            "O arquivo firebase-config.js contém um comentário '⚠️ NUNCA faça commit "
            "deste arquivo! (.gitignore deve protegê-lo)', porém o arquivo está commitado "
            "no repositório (raiz e www/), e o mesmo config foi duplicado dentro de "
            "script.js. A apiKey do Firebase é pública por design (client SDK), mas o "
            "vazamento de projectId, authDomain, databaseURL e storageBucket expõe a "
            "superfície de ataque: o projeto pode sofrer abuso de quota e tentativas "
            "diretas de acesso ao RTDB (agravado pelo item F-01). Há também o "
            "google-services.json do app Android com as mesmas chaves."
        ),
        "fix": (
            "Embora a apiKey deva existir no cliente, o ideal é: (1) garantir .gitignore "
            "cobrindo firebase-config.js e google-services.json; (2) renovar a apiKey no "
            "console Firebase e invalidar a vazada; (3) restringir o projeto por "
            "Application Restriction (HTTP referrer da sua origem + SHA-1 do app Android) "
            "na API Key; (4) nunca versionar google-services.json."
        ),
        "prio": "P1",
    },
    {
        "id": "F-03",
        "cat": "Permissão definida no navegador (CSP)",
        "sev": "MÉDIA",
        "title": "Content-Security-Policy permite 'unsafe-inline' e 'unsafe-eval'",
        "loc": "index.html:9, login.html:9",
        "desc": (
            "Ambas as páginas definem CSP com script-src permitindo 'unsafe-inline' e "
            "'unsafe-eval'. Isso anula boa parte da proteção contra XSS: um vetor de "
            "injeção de script (mesmo com escapeHTML ausente em algum ponto futuro) "
            "executaria livremente. O app usa muitos <script> inline e eval indireto via "
            "Template literals, justificando o relaxed CSP, mas isso eleva o risco."
        ),
        "fix": (
            "Migrar scripts para arquivos externos com nonce, remover 'unsafe-inline' e "
            "'unsafe-eval'. Para o Firebase SDK (que usa eval internamente em alguns modos), "
            "utilizar a build de produção (firebase-app-compat.js) ou mover para módulos "
            "ESM. Aplicar pelo menos 'default-src https:'. Validar via cabeçalho HTTP "
            "(Cloudflare _headers) em vez de meta tag."
        ),
        "prio": "P2",
    },
    {
        "id": "F-04",
        "cat": "Banco sem tranca (Isolamento de tenant)",
        "sev": "MÉDIA",
        "title": "Regras RTDB não cobrem todos os paths de dados do usuário",
        "loc": "database-rules.json:1-15",
        "desc": (
            "database-rules.json protege apenas users/$uid com auth.uid === $uid (correto "
            "para isolamento). Porém paths auxiliares como 'investimentos' (F-01) e "
            "possíveis nós de compartilhamento ('sharedWith') não têm regra explícita, "
            "ficando com default público. Além disso, não há validação de schema/tipo "
            "('.write' sem restrição de estrutura), permitindo que um usuário escreva "
            "estruturas inesperadas que quebrem a app ou exfiltrem dados."
        ),
        "fix": (
            "Cobrir TODOS os paths em database-rules.json com regras explícitas (deny por "
            "default). Adicionar validação de tipo com o operador 'newData.hasChildren()' "
            "e '.validate' para campos obrigatórios. Revisar o nó 'sharedWith' para "
            "garantir que só o proprietário pode conceder acesso."
        ),
        "prio": "P1",
    },
    {
        "id": "F-05",
        "cat": "Chaves expostas",
        "sev": "BAIXA",
        "title": "Service Worker pode servir conteúdo stale/cacheado de versões antigas",
        "loc": "service-worker.js (registrado em script.js), _headers:33",
        "desc": (
            "O service-worker.js é registrado mas não foi auditado em detalhe. Combinado "
            "com _headers que define *.css como 'immutable' por 1 ano (exigiu cache-bust "
            "manual ?v=3.1.0), há risco de o SW servir uma versão antiga do app com código "
            "vulnerável após correções. Se o SW interceptar fetch de dados sensíveis, pode "
            "vazar em cache."
        ),
        "fix": (
            "Auditar o service-worker.js: garantir que NÃO cacheia responses de RTDB/Firebase "
            "Auth (network-only para dados). Implementar estratégia de cache-bust por "
            "versão no nome do SW. Remover 'immutable' de _headers para CSS e usar "
            "cache-control com revalidação."
        ),
        "prio": "P2",
    },
    {
        "id": "F-06",
        "cat": "Inputs sem tratamento (XSS)",
        "sev": "BAIXA",
        "title": "Uso consistente de escapeHTML, mas dependência de regex customizada",
        "loc": "script.js:41-45, usado em ~30 locais de innerHTML",
        "desc": (
            "O app utiliza escapeHTML() (substitui & < > \" ') em TODOS os innerHTML com "
            "dados do usuário (transações, contas, cartões, metas, ativos, etc.). Não foram "
            "encontrados eval(), new Function(), nem v-html/dangerouslySetInnerHTML. No "
            "entanto, a função é uma regex simples; se algum novo dev esquecer de chamá-la "
            "em um innerHTML futuro, haverá XSS. Não há defesa em profundidade (ex.: DOMPurify)."
        ),
        "fix": (
            "Manter escapeHTML como padrão, mas adicionar DOMPurify como camada extra em "
            "toda inserção de HTML. Criar um helper seguro 'setHTML(el, str)' que sempre "
            "sanitiza. Adicionar lint rule (eslint-plugin-no-unsanitized) para bloquear "
            "innerHTML sem sanitização no CI."
        ),
        "prio": "P2",
    },
    {
        "id": "F-07",
        "cat": "Permissão definida no navegador (Auth state)",
        "sev": "BAIXA",
        "title": "auth.onAuthStateChanged usado para gate, mas sem proteção de rota server-side",
        "loc": "script.js:51-56, login.html, index.html",
        "desc": (
            "A proteção de página depende exclusivamente de onAuthStateChanged no cliente: "
            "se não houver usuário, redireciona para login.html. Isso é correto para uma "
            "SPA estática (não há servidor para proteger rotas), mas significa que qualquer "
            "usuário pode abrir index.html e ver o shell da app antes do redirect. O dado "
            "só é carregado após auth, então não há vazamento direto, mas o design confia "
            "100% nas Security Rules do Firebase (que devem ser perfeitas — ver F-01/F-04)."
        ),
        "fix": (
            "Manter arquitetura client-side, mas garantir que as Security Rules sejam a "
            "única fonte de verdade (testadas com firestore/rtdb emulator). Documentar que "
            "o 'gate' de UI é apenas UX, não segurança. Considerar mover para um bundle "
            "ofuscado (esbuild/terser) para dificultar engenharia reversa das regras de "
            "negócio."
        ),
        "prio": "P3",
    },
]

SEV_COLORS = {
    "CRÍTICA": colors.HexColor("#C0392B"),
    "ALTA": colors.HexColor("#E67E22"),
    "MÉDIA": colors.HexColor("#F1C40F"),
    "BAIXA": colors.HexColor("#27AE60"),
}

# Distribuição por severidade (para o gráfico de rosca)
SEV_COUNT = {"CRÍTICA": 0, "ALTA": 0, "MÉDIA": 0, "BAIXA": 0}
for f in FINDINGS:
    SEV_COUNT[f["sev"]] += 1

# Distribuição por categoria (para o gráfico de barras)
CATS = ["Banco sem tranca", "Permissão no navegador", "IDOR", "Chaves expostas", "XSS"]
CAT_KEYS = {
    "Banco sem tranca": "Banco sem tranca (Isolamento de tenant)",
    "Permissão no navegador": "Permissão definida no navegador (CSP)",
    "IDOR": "IDOR (Insecure Direct Object References)",
    "Chaves expostas": "Chaves expostas",
    "XSS": "Inputs sem tratamento (XSS)",
}
CAT_COUNT = {c: 0 for c in CATS}
for f in FINDINGS:
    for c in CATS:
        if f["cat"].startswith(c.split(" ")[0]) or CAT_KEYS[c] == f["cat"]:
            CAT_COUNT[c] += 1
            break

# ----------------------------------------------------------------------------
# Estilos
# ----------------------------------------------------------------------------
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontSize=28, leading=34,
                          alignment=TA_CENTER, textColor=colors.HexColor("#1A2B4A"),
                          spaceAfter=12, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="CoverSub", fontSize=14, leading=18,
                          alignment=TA_CENTER, textColor=colors.HexColor("#5D6D7E")))
styles.add(ParagraphStyle(name="H1", fontSize=16, leading=20, spaceBefore=14,
                          spaceAfter=8, textColor=colors.HexColor("#1A2B4A"),
                          fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="H2", fontSize=12.5, leading=16, spaceBefore=10,
                          spaceAfter=4, textColor=colors.HexColor("#2C3E50"),
                          fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="Body", fontSize=9.5, leading=13.5, alignment=TA_JUSTIFY,
                          spaceAfter=4))
styles.add(ParagraphStyle(name="Small", fontSize=8, leading=11,
                          textColor=colors.HexColor("#7F8C8D")))
styles.add(ParagraphStyle(name="MyBullet", fontSize=9.5, leading=13,
                          leftIndent=12, bulletIndent=2, spaceAfter=2))
styles.add(ParagraphStyle(name="FindTitle", fontSize=11.5, leading=15,
                          fontName="Helvetica-Bold", textColor=colors.white))
styles.add(ParagraphStyle(name="FindMeta", fontSize=8.5, leading=11,
                          textColor=colors.HexColor("#ECF0F1")))
styles.add(ParagraphStyle(name="MyCode", fontSize=8, leading=11,
                          fontName="Courier", textColor=colors.HexColor("#34495E"),
                          backColor=colors.HexColor("#F4F6F7"), borderPadding=4,
                          spaceAfter=4))

# ----------------------------------------------------------------------------
# Funções de desenho
# ----------------------------------------------------------------------------
def draw_sev_pie():
    d = Drawing(240, 180)
    pie = Pie()
    pie.x = 30
    pie.y = 25
    pie.width = 130
    pie.height = 130
    pie.data = list(SEV_COUNT.values())
    pie.labels = None
    pie.slices.strokeWidth = 1
    pie.slices.strokeColor = colors.white
    colormap = [SEV_COLORS["CRÍTICA"], SEV_COLORS["ALTA"],
                SEV_COLORS["MÉDIA"], SEV_COLORS["BAIXA"]]
    for i, v in enumerate(pie.data):
        pie.slices[i].fillColor = colormap[i]
    d.add(pie)
    # legenda
    legend = Legend()
    legend.x = 175
    legend.y = 140
    legend.dx = 8
    legend.dy = 8
    legend.fontSize = 8
    legend.alignment = "right"
    legend.colorNamePairs = [
        (SEV_COLORS["CRÍTICA"], f"Crítica ({SEV_COUNT['CRÍTICA']})"),
        (SEV_COLORS["ALTA"], f"Alta ({SEV_COUNT['ALTA']})"),
        (SEV_COLORS["MÉDIA"], f"Média ({SEV_COUNT['MÉDIA']})"),
        (SEV_COLORS["BAIXA"], f"Baixa ({SEV_COUNT['BAIXA']})"),
    ]
    d.add(legend)
    # título central
    d.add(String(95, 88, str(len(FINDINGS)), fontSize=22,
                 textAnchor="middle", fillColor=colors.HexColor("#1A2B4A"),
                 fontName="Helvetica-Bold"))
    d.add(String(95, 70, "achados", fontSize=9, textAnchor="middle",
                 fillColor=colors.HexColor("#7F8C8D")))
    return d


def draw_cat_bar():
    d = Drawing(460, 200)
    bc = VerticalBarChart()
    bc.x = 40
    bc.y = 40
    bc.height = 140
    bc.width = 380
    bc.data = [[CAT_COUNT[c] for c in CATS]]
    bc.categoryAxis.categoryNames = [c.split(" ")[0] for c in CATS]
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.labels.angle = 20
    bc.categoryAxis.labels.dy = -8
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = max(CAT_COUNT.values()) + 1
    bc.valueAxis.valueStep = 1
    bc.bars[0].fillColor = colors.HexColor("#3498DB")
    bc.bars.strokeWidth = 0
    d.add(bc)
    for i, c in enumerate(CATS):
        d.add(String(40 + 380 * (i + 0.5) / len(CATS), 22,
                     str(CAT_COUNT[c]), fontSize=9, textAnchor="middle",
                     fillColor=colors.HexColor("#2C3E50"),
                     fontName="Helvetica-Bold"))
    return d


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#95A5A6"))
    canvas.drawString(2 * cm, 1.1 * cm,
                      "Auditoria de Segurança — Pulso v3.1.0 — Confidencial")
    canvas.drawRightString(A4[0] - 2 * cm, 1.1 * cm, "Página %d" % doc.page)
    canvas.setStrokeColor(colors.HexColor("#E5E8E8"))
    canvas.line(2 * cm, 1.4 * cm, A4[0] - 2 * cm, 1.4 * cm)
    canvas.restoreState()


# ----------------------------------------------------------------------------
# Montagem do documento
# ----------------------------------------------------------------------------
doc = SimpleDocTemplate(
    os.path.join(os.path.dirname(__file__), "relatorio-auditoria-seguranca.pdf"),
    pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="Relatório de Auditoria de Segurança — Pulso",
    author="Equipe de Segurança"
)
S = []

# --- Capa ---
S.append(Spacer(1, 3.5 * cm))
S.append(Paragraph("Relatório de Auditoria de Segurança", styles["CoverTitle"]))
S.append(Paragraph(PROJECT, styles["CoverSub"]))
S.append(Spacer(1, 0.8 * cm))
S.append(HRFlowable(width="60%", thickness=1.5,
                    color=colors.HexColor("#3498DB"), spaceAfter=14))
S.append(Paragraph("Versão auditada: <b>3.1.0</b>", styles["CoverSub"]))
S.append(Paragraph("Data: 29/08/2026", styles["CoverSub"]))
S.append(Paragraph("Escopo: 5 categorias (isolamento de tenant, "
                   "permissão no navegador, IDOR, chaves expostas, XSS)",
                   styles["CoverSub"]))
S.append(Spacer(1, 1.2 * cm))
S.append(Paragraph("Stack: " + STACK, styles["Small"]))
S.append(PageBreak())

# --- Resumo Executivo ---
S.append(Paragraph("1. Resumo Executivo", styles["H1"]))
S.append(Paragraph(
    "O aplicativo Pulso é uma SPA estática (vanilla JS) cuja única camada de "
    "backend é o Firebase (Auth + Realtime Database). Não há servidor próprio, "
    "logo a segurança depende integralmente das <b>Firebase Security Rules</b> e "
    "do tratamento de dados no cliente. A auditoria cobriu 5 categorias e "
    "identificou <b>%d achados</b>." % len(FINDINGS), styles["Body"]))
S.append(Paragraph(
    "<b>Ponto forte:</b> O isolamento por usuário (users/$uid com auth.uid === "
    "$uid) está correto e todas as operações de dado usam escapeHTML de forma "
    "consistente, ausência de eval/new Function. <b>Ponto fraco:</b> existe um "
    "path RTDB ('investimentos') público sem autenticação, as Security Rules não "
    "cobrem todos os nós, e a CSP permite unsafe-inline/unsafe-eval.",
    styles["Body"]))
S.append(Spacer(1, 6))
S.append(draw_sev_pie())
S.append(Spacer(1, 4))
S.append(Paragraph(
    "Distribuição por categoria (total de achados por tema):", styles["H2"]))
S.append(draw_cat_bar())
S.append(PageBreak())

# --- Pontos Fortes / Fracos ---
S.append(Paragraph("2. Pontos Fortes e Fracos", styles["H1"]))
S.append(Paragraph("Pontos Fortes", styles["H2"]))
for t in [
    "Isolamento de usuário por UID em todas as operações RTDB (users/$uid).",
    "Ausência de eval(), new Function(), v-html ou dangerouslySetInnerHTML.",
    "Uso consistente de escapeHTML() em ~30 locais de innerHTML com dado do usuário.",
    "Auth gate via onAuthStateChanged redireciona para login.html quando não autenticado.",
    "Upload de arquivos (avatar/Excel) usa FileReader sem execução de código.",
]:
    S.append(Paragraph("• " + t, styles["MyBullet"]))
S.append(Paragraph("Pontos Fracos", styles["H2"]))
for t in [
    "Path 'investimentos' do RTDB legível/escutável sem auth (default público).",
    "Security Rules não cobrem todos os paths (ex.: sharedWith, investimentos).",
    "Config Firebase (apiKey, projectId, DB URL) hardcoded e commitado no git.",
    "CSP com 'unsafe-inline' e 'unsafe-eval' enfraquece defesa contra XSS.",
    "Service Worker e _headers (CSS immutable 1 ano) podem servir versão vulnerável.",
    "Dependência de regex customizada para escape, sem DOMPurify (defesa em profundidade).",
]:
    S.append(Paragraph("• " + t, styles["MyBullet"]))
S.append(PageBreak())

# --- Tabela de Achados ---
S.append(Paragraph("3. Tabela de Achados", styles["H1"]))
tbl_data = [["ID", "Categoria", "Severidade", "Prioridade"]]
for f in FINDINGS:
    tbl_data.append([esc(f["id"]), esc(f["cat"].split(" (")[0]),
                     esc(f["sev"]), esc(f["prio"])])
tbl = Table(tbl_data, colWidths=[1.4 * cm, 7.2 * cm, 3 * cm, 2.4 * cm])
ts = [
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A2B4A")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F6F7")]),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]
for i, f in enumerate(FINDINGS, start=1):
    ts.append(("TEXTCOLOR", (2, i), (2, i), SEV_COLORS[f["sev"]]))
    ts.append(("FONTNAME", (2, i), (2, i), "Helvetica-Bold"))
tbl.setStyle(TableStyle(ts))
S.append(tbl)
S.append(Spacer(1, 10))

# --- Detalhe dos Achados ---
S.append(Paragraph("4. Detalhamento dos Achados", styles["H1"]))
for f in FINDINGS:
    sev_c = SEV_COLORS[f["sev"]]
    head = Table(
        [[Paragraph(f"{esc(f['id'])} — {esc(f['title'])}", styles["FindTitle"]),
          Paragraph(esc(f["sev"]), styles["FindMeta"])]],
        colWidths=[13.5 * cm, 3 * cm])
    head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#2C3E50")),
        ("BACKGROUND", (1, 0), (1, 0), sev_c),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (0, 0), 8),
    ]))
    block = [head, Spacer(1, 3)]
    block.append(Paragraph(f"<b>Categoria:</b> {esc(f['cat'])} &nbsp;|&nbsp; "
                           f"<b>Prioridade:</b> {esc(f['prio'])}", styles["Small"]))
    block.append(Paragraph(f"<b>Localização:</b> <font face='Courier' size=8>"
                           f"{esc(f['loc'])}</font>", styles["Small"]))
    block.append(Spacer(1, 3))
    block.append(Paragraph("<b>Descrição</b>", styles["H2"]))
    block.append(Paragraph(esc(f["desc"]), styles["Body"]))
    block.append(Paragraph("<b>Recomendação de correção</b>", styles["H2"]))
    block.append(Paragraph(esc(f["fix"]), styles["Body"]))
    block.append(Spacer(1, 8))
    block.append(HRFlowable(width="100%", thickness=0.5,
                            color=colors.HexColor("#E5E8E8")))
    block.append(Spacer(1, 8))
    S.append(KeepTogether(block))

# --- Recomendações Priorizadas ---
S.append(PageBreak())
S.append(Paragraph("5. Plano de Remediação Priorizado", styles["H1"]))
plan = [
    ("P0", "Imediato", "F-01", "Corrigir regras RTDB do path 'investimentos' (deny por default ou restringir por usuário)."),
    ("P1", "Esta semana", "F-02, F-04", "Renovar apiKey Firebase, aplicar Application Restriction, adicionar .gitignore para configs, cobrir TODOS os paths em database-rules.json com validação de schema."),
    ("P2", "Este mês", "F-03, F-05, F-06", "Endurecer CSP (nonce, sem unsafe-inline/eval), auditar service-worker, adicionar DOMPurify + lint de sanitização."),
    ("P3", "Backlog", "F-07", "Documentar que gate de UI ≠ segurança; ofuscar bundle; testar Security Rules no emulator."),
]
plan_data = [["Prio", "Prazo", "Achados", "Ação"]]
for p in plan:
    plan_data.append([p[0], p[1], p[2], p[3]])
plan_tbl = Table(plan_data, colWidths=[1.2 * cm, 2.5 * cm, 2.5 * cm, 10.3 * cm])
plan_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A2B4A")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F6F7")]),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
S.append(plan_tbl)
S.append(Spacer(1, 14))

# --- Issues GitHub (Markdown) ---
S.append(Paragraph("6. Issues GitHub Sugeridas (Markdown)", styles["H1"]))
S.append(Paragraph("Copie o bloco abaixo para criar as issues no repositório:",
                   styles["Small"]))
md = """<!-- SECURITY AUDIT ISSUES — Pulso v3.1.0 -->
## F-01 [CRÍTICA] RTDB 'investimentos' público sem auth
- Arquivos: script.js:2655, script.js:2658, script.js:2769
- Ação: adicionar regra em database-rules.json negando read/write por default ou restringindo por usuário.
- Prioridade: P0

## F-02 [ALTA] Config Firebase hardcoded e commitado
- Arquivos: firebase-config.js:5-11, www/firebase-config.js:5-11, script.js:7-15, android/app/google-services.json
- Ação: .gitignore para configs, renovar apiKey, Application Restriction por HTTP referrer + SHA-1.
- Prioridade: P1

## F-03 [MÉDIA] CSP com unsafe-inline/unsafe-eval
- Arquivos: index.html:9, login.html:9
- Ação: nonce em scripts, remover unsafe-inline/eval, aplicar via _headers.
- Prioridade: P2

## F-04 [MÉDIA] Security Rules não cobrem todos os paths
- Arquivos: database-rules.json:1-15
- Ação: regras explícitas para todos os nós + validação de schema (.validate).
- Prioridade: P1

## F-05 [BAIXA] Service Worker / _headers CSS immutable
- Arquivos: service-worker.js, _headers:33
- Ação: não cachear responses de RTDB/Auth; cache-bust por versão no SW.
- Prioridade: P2

## F-06 [BAIXA] escapeHTML sem defesa em profundidade
- Arquivos: script.js:41-45 (~30 usos)
- Ação: adicionar DOMPurify + eslint-plugin-no-unsanitized.
- Prioridade: P2

## F-07 [BAIXA] Gate de auth client-side apenas
- Arquivos: script.js:51-56
- Ação: documentar que UI gate ≠ segurança; testar Rules no emulator.
- Prioridade: P3
"""
S.append(Paragraph(md.replace("\n", "<br/>").replace(" ", "&nbsp;"), styles["MyCode"]))

doc.build(S, onFirstPage=lambda c, d: None, onLaterPages=footer)
print("PDF gerado:", os.path.join(os.path.dirname(__file__),
      "relatorio-auditoria-seguranca.pdf"))
