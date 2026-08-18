// ============================================================
// APPS SCRIPT — Google Sheets → Firebase RTDB
// Fluxo: Planilha → Apps Script (trigger a cada 6h) → Firebase → PWA
// ============================================================

const FIREBASE_URL = 'https://planejamento-familiar-b3a1c-default-rtdb.firebaseio.com';
const FIREBASE_SECRET = 'SUA_CHAVE_FIREBASE_SECRET_AQUI'; // substituir

// ============================================================
// 1. SYNC DADOS FINANCEIROS (aba "DADOS 2026")
// ============================================================
function syncDadosFinanceiros() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('DADOS 2026');
  if (!sheet) { Logger.log('Aba DADOS 2026 não encontrada'); return; }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const dados = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const mes = row[0]; // Coluna A: Mês
    if (!mes) continue;

    dados[mes] = {
      renda: parseFloat(row[2]) || 0,        // C: Renda
      despFixa: parseFloat(row[3]) || 0,      // D: Desp_Fixa
      despVar: parseFloat(row[4]) || 0,       // E: Desp_Var
      totalDesp: parseFloat(row[5]) || 0,     // F: Total_Desp
      sobra: parseFloat(row[6]) || 0,         // G: Sobra
      pctGasto: parseFloat(row[7]) || 0,      // H: %_Gasto
      status: row[8] || ''                    // I: Status
    };
  }

  sendToFirebase('/orcamento/dados_2026', dados);
  Logger.log('Dados 2026 sincronizados: ' + Object.keys(dados).length + ' meses');
}

// ============================================================
// 2. SYNC TRANSAÇÕES (abas mensais: Jan, Fev, Mar, etc.)
// ============================================================
function syncTransacoes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const allTransactions = [];

  meses.forEach(mes => {
    const sheet = ss.getSheetByName(mes);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    // Assumindo: A=Data, B=Descrição, C=Categoria, D=Tipo (Renda/Desp), E=Valor, F=Status
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[1]) continue; // pular se vazio

      const date = row[0] instanceof Date ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') : row[0];
      const valor = parseFloat(row[4]) || 0;
      if (valor === 0) continue;

      allTransactions.push({
        date: date,
        description: String(row[1]),
        category: String(row[2] || 'Sem categoria'),
        type: String(row[3] || '').toLowerCase().includes('renda') ? 'entrada' : 'saida',
        value: valor,
        status: String(row[5] || 'pago'),
        source: 'sheets',
        mes: mes
      });
    }
  });

  sendToFirebase('/orcamento/transacoes', allTransactions);
  Logger.log('Transações sincronizadas: ' + allTransactions.length + ' registros');
}

// ============================================================
// 3. SYNC LIMITES DE GASTOS (aba "Limites" ou intervalo editável)
// ============================================================
function syncLimitesGastos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Limites');
  if (!sheet) { Logger.log('Aba Limites não encontrada'); return; }

  const data = sheet.getDataRange().getValues();
  const limites = {};

  for (let i = 1; i < data.length; i++) {
    const cat = String(data[i][0]);
    const limite = parseFloat(data[i][1]) || 0;
    if (cat && limite > 0) {
      limites[cat] = limite;
    }
  }

  sendToFirebase('/orcamento/limites_gastos', limites);
  Logger.log('Limites sincronizados: ' + Object.keys(limites).length + ' categorias');
}

// ============================================================
// 4. SYNC INVESTIMENTOS (aba "Investimentos")
// ============================================================
function syncInvestimentos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Investimentos');
  if (!sheet) { Logger.log('Aba Investimentos não encontrada'); return; }

  const data = sheet.getDataRange().getValues();
  const acoes = [], fiis = [], etfs = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const tipo = String(row[0] || '').toUpperCase();
    const item = {
      codigo: String(row[1] || ''),
      nome: String(row[2] || ''),
      preco: parseFloat(row[3]) || 0,
      dy: parseFloat(row[4]) || 0,
      pvp: parseFloat(row[5]) || 0,
      desconto: parseFloat(row[6]) || 0,
      status: String(row[7] || 'neutro'),
      indice: String(row[8] || '')
    };

    if (tipo === 'AÇÃO' || tipo === 'ACAO') acoes.push(item);
    else if (tipo === 'FII') fiis.push(item);
    else if (tipo === 'ETF') etfs.push(item);
  }

  const investData = {
    acoes: acoes,
    fiis: fiis,
    etfs: etfs,
    atualizadoEm: new Date().toISOString()
  };

  sendToFirebase('/investimentos', investData);
  Logger.log('Investimentos sincronizados: ' + acoes.length + ' ações, ' + fiis.length + ' FIIs, ' + etfs.length + ' ETFs');
}

// ============================================================
// 5. SYNC METAS (aba "Metas")
// ============================================================
function syncMetas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Metas');
  if (!sheet) { Logger.log('Aba Metas não encontrada'); return; }

  const data = sheet.getDataRange().getValues();
  const setores = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const objetivo = String(row[0] || '');
    if (!objetivo) continue;

    setores[objetivo] = {
      alocacao: parseFloat(row[1]) || 0,
      meta: parseFloat(row[2]) || 0,
      acumulado: parseFloat(row[3]) || 0,
      observacao: String(row[4] || '')
    };
  }

  sendToFirebase('/orcamento/metas', setores);
  Logger.log('Metas sincronizadas: ' + Object.keys(setores).length + ' objetivos');
}

// ============================================================
// FUNÇÃO GENÉRICA PARA ENVIAR AO FIREBASE
// ============================================================
function sendToFirebase(path, data) {
  const payload = JSON.stringify(data);
  const url = FIREBASE_URL + path + '.json?auth=' + FIREBASE_SECRET;

  const options = {
    method: 'PUT',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code === 200) {
    Logger.log('OK → ' + path);
  } else {
    Logger.log('ERRO ' + code + ' → ' + path + ': ' + response.getContentText());
  }
}

// ============================================================
// TRIGGER PRINCIPAL — executar tudo de uma vez
// ============================================================
function syncTudo() {
  Logger.log('=== INICIO SYNC === ' + new Date().toISOString());
  syncDadosFinanceiros();
  syncTransacoes();
  syncLimitesGastos();
  syncInvestimentos();
  syncMetas();
  Logger.log('=== FIM SYNC ===');
}

// ============================================================
// CRIAR TRIGGER AUTOMÁTICO (executar uma vez manualmente)
// ============================================================
function criarTriggerAutomatico() {
  // Remove triggers antigos
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncTudo') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Cria novo trigger a cada 6 horas
  ScriptApp.newTrigger('syncTudo')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('Trigger criado: syncTudo a cada 6 horas');
}

// ============================================================
// WEB APP — Receber dados do Firebase (push do site)
// ============================================================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'status') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      ultimaSync: PropertiesService.getScriptProperties().getProperty('ultimaSync') || 'nunca'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'ação desconhecida' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'sync_from_sheets') {
      syncTudo();
      PropertiesService.getScriptProperties().setProperty('ultimaSync', new Date().toISOString());
      return ContentService.createTextOutput(JSON.stringify({ status: 'sync concluido' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'save_limite') {
      const cat = data.categoria;
      const limite = data.limite;
      sendToFirebase('/orcamento/limites_gastos/' + cat, limite);
      return ContentService.createTextOutput(JSON.stringify({ status: 'limite salvo' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'acao desconhecida' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
