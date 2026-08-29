#!/usr/bin/env python3
"""Gera relatorio de correcoes (PDF) com reportlab apenas."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, HRFlowable)

PROJECT = "Pulso — Controle Financeiro"
VER = "v3.1.1"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontSize=24, leading=30,
                          alignment=TA_CENTER, textColor=colors.HexColor("#1A2B4A"),
                          fontName="Helvetica-Bold", spaceAfter=10))
styles.add(ParagraphStyle(name="CoverSub", fontSize=12, leading=16,
                          alignment=TA_CENTER, textColor=colors.HexColor("#5D6D7E")))
styles.add(ParagraphStyle(name="H1", fontSize=15, leading=19, spaceBefore=12,
                          spaceAfter=6, textColor=colors.HexColor("#1A2B4A"),
                          fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="H2", fontSize=11.5, leading=15, spaceBefore=8,
                          spaceAfter=3, textColor=colors.HexColor("#2C3E50"),
                          fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="Body", fontSize=9.5, leading=13.5,
                          alignment=TA_JUSTIFY, spaceAfter=4))
styles.add(ParagraphStyle(name="Small", fontSize=8, leading=11,
                          textColor=colors.HexColor("#7F8C8D")))
styles.add(ParagraphStyle(name="MyBullet", fontSize=9.5, leading=13,
                          leftIndent=12, bulletIndent=2, spaceAfter=2))
styles.add(ParagraphStyle(name="MyCode", fontSize=8, leading=11,
                          fontName="Courier", textColor=colors.HexColor("#34495E"),
                          backColor=colors.HexColor("#F4F6F7"), borderPadding=4,
                          spaceAfter=4))

from xml.sax.saxutils import escape as _x
def esc(s): return _x(str(s))

S = []
S.append(Spacer(1, 3.2 * cm))
S.append(Paragraph("Relatório de Correções", styles["CoverTitle"]))
S.append(Paragraph(PROJECT + " — " + VER, styles["CoverSub"]))
S.append(Spacer(1, 0.6 * cm))
S.append(HRFlowable(width="55%", thickness=1.5, color=colors.HexColor("#3498DB"),
                    spaceAfter=12))
S.append(Paragraph("Data: 29/08/2026", styles["CoverSub"]))
S.append(Spacer(1, 0.4 * cm))
S.append(Paragraph("Escopo: correções de sidebar (CSS), fluxo de login/Google, "
                   "e duplicação de lançamentos (receita/despesa).", styles["Small"]))
S.append(PageBreak())

S.append(Paragraph("1. Resumo", styles["H1"]))
S.append(Paragraph(
    "Este relatório documenta as correções aplicadas após a auditoria de "
    "segurança e os testes de uso relatados pelo cliente. Foram resolvidos "
    "problemas de UX de login (teclado/Enter, tela em branco com Google), "
    "erros de autenticação sem mensagem, e a duplicação de lançamentos de "
    "receita/despesa causada por envio duplo e pela camada de dados RTDB.",
    styles["Body"]))

S.append(Paragraph("2. Correções de Login / Autenticação", styles["H1"]))
for t in [
    "Teclado: Enter no e-mail foca a senha; Enter na senha dispara o login (handleAuth).",
    "Google: adicionado provider.setCustomParameters({prompt:'select_account'}) para forçar seleção de conta.",
    "Google: mensagens de erro específicas para network-request-failed, unauthorized-domain e operation-not-allowed.",
    "Loader de autenticação: fundo escuro fixo (evita tela branca no tema claro) + auto-remoção de segurança em 8s.",
    "onAuthStateChanged: timeout de redirecionamento para login.html subiu de 1s para 5s (corrige corrida que expulsava o usuário com sessão Google lenta); init envolvida em try/catch com hideAuthLoader() no finally.",
    "Contas Gmail: não dispara mais o Google silenciosamente; exibe dica para usar o botão 'Continuar com Google'.",
]:
    S.append(Paragraph("• " + t, styles["MyBullet"]))

S.append(Paragraph("3. Correção de Duplicação de Lançamentos (inputs)", styles["H1"]))
for t in [
    "Guard anti-duplo-envio no modal de lançamento (dataset.submitting + botão desabilitado) — impede lançamento duplicado por duplo clique ou Enter repetido.",
    "addTransaction em modo RTDB não faz mais unshift local; o listener 'value' do Firebase é a única fonte de verdade, eliminando a duplicação otimista.",
    "snapshotToArray com dedupe por key/id para garantir 1 ocorrência por item.",
    "attachRtdbListener desengata listeners anteriores (detachRtdbListener) — evita bind duplo em refresh de token de sessão.",
    "Cache-bust de script.js elevado para v=3.1.1 em index.html e login.html.",
]:
    S.append(Paragraph("• " + t, styles["MyBullet"]))

S.append(PageBreak())
S.append(Paragraph("4. Status da Auditoria de Segurança (pendente)", styles["H1"]))
S.append(Paragraph("As correções de segurança (F-01 a F-07) ainda não foram "
                   "aplicadas. Resumo de prioridade:", styles["Body"]))
audit = [
    ["ID", "Achado", "Severidade", "Prioridade", "Status"],
    ["F-01", "RTDB 'investimentos' público sem auth", "CRÍTICA", "P0", "Pendente"],
    ["F-02", "Config Firebase hardcoded/commitado", "ALTA", "P1", "Pendente"],
    ["F-03", "CSP com unsafe-inline/eval", "MÉDIA", "P2", "Pendente"],
    ["F-04", "Security Rules não cobrem todos os paths", "MÉDIA", "P1", "Pendente"],
    ["F-05", "Service Worker / _headers CSS immutable", "BAIXA", "P2", "Pendente"],
    ["F-06", "escapeHTML sem defesa em profundidade", "BAIXA", "P2", "Pendente"],
    ["F-07", "Gate de auth client-side apenas", "BAIXA", "P3", "Pendente"],
]
tbl = Table([[esc(c) for c in r] for r in audit],
            colWidths=[1.3*cm, 6.6*cm, 2.3*cm, 1.8*cm, 2.4*cm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1A2B4A")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 8.2),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#BDC3C7")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F4F6F7")]),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
S.append(tbl)
S.append(Spacer(1, 10))
S.append(Paragraph("Observação: a dedupe na camada de dados (item 3) elimina o "
                   "sintoma relatado, mas a causa-raiz de exposição (F-01/F-04 nas "
                   "Firebase Security Rules) deve ser corrigida para evitar perda/"
                   "vazamento de dados.", styles["Small"]))
S.append(Spacer(1, 8))
S.append(Paragraph("Arquivos alterados: script.js, www/script.js, index.html, "
                   "www/index.html, login.html, www/login.html (commit 947c0ca + "
                   "correções de inputs).", styles["MyCode"]))

doc = SimpleDocTemplate(
    os.path.join(os.path.dirname(__file__), "relatorio-correcoes.pdf"),
    pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
    title="Relatório de Correções — Pulso " + VER)
doc.build(S)
print("PDF:", os.path.join(os.path.dirname(__file__), "relatorio-correcoes.pdf"))
