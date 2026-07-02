/**
 * Painel de Indicadores e Resultados — JRS/HNRe
 * Web App (JSON) que lê a planilha ao vivo e alimenta o dashboard.
 *
 * IMPLANTAÇÃO (uma vez):
 *   Implantar > Nova implantação > Tipo: "App da Web"
 *     • Executar como:      Eu (seu e-mail)
 *     • Quem pode acessar:  Qualquer pessoa            <-- necessário p/ o fetch do dashboard
 *   Autorize os escopos e copie a URL que termina em /exec.
 *   Cole essa URL em CONFIG.WEB_APP_URL no dashboard (painel HTML).
 *
 * OBS. de segurança: "Qualquer pessoa" torna o endpoint público (URL longa e não
 * indexada). Ele expõe apenas números AGREGADOS mensais (contagens, %, finalidades),
 * sem qualquer dado pessoal/identificável. Se preferir não expor, veja alternativas
 * no final deste arquivo.
 */

const SPREADSHEET_ID  = '1o86KPHKMiy4khNnknTf6LbijOHOQLbgDfuWuSg4NP7Q';
const ABA_RESULTADOS  = 'Resultados';   // ajuste se o nome real da aba for outro
const ABA_FINALIDADES = 'Finalidades';

const MESES = ['', 'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function doGet(e) {
  try {
    return json_(montarPayload_());
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

function montarPayload_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const porRef = {};                 // "2026-06" -> objeto do mês
  lerResultados_(ss, porRef);
  lerFinalidades_(ss, porRef);
  const meses = Object.keys(porRef).sort().map(function (k) { return porRef[k]; });
  return {
    ok: true,
    atualizadoEm: new Date().toISOString(),
    planilha: ss.getName(),
    meses: meses
  };
}

/* -------------------- Resultados -------------------- */
function lerResultados_(ss, porRef) {
  const sh = ss.getSheetByName(ABA_RESULTADOS);
  if (!sh) return;
  const dados = sh.getDataRange().getValues();
  if (dados.length < 2) return;
  const head = dados[0].map(String);

  const colData = head.indexOf('Data Ref');
  const colMes  = acharCol_(head, /^m[eê]s$/i);
  const colAno  = acharCol_(head, /^ano$/i);

  // classifica cada coluna pelo código no cabeçalho
  const cols = head.map(function (h, i) {
    const isStatus = /\bstatus\b/i.test(h);
    const mVar = h.match(/^\s*(V|W|R|AO)\d+\b/i);
    const mInd = h.match(/^\s*(I\d+)\b/i);
    return {
      i: i,
      codeVar: mVar ? mVar[0].trim().toUpperCase() : null,
      codeInd: mInd ? mInd[1].toUpperCase() : null,
      isStatus: isStatus
    };
  });

  for (var r = 1; r < dados.length; r++) {
    const row = dados[r];
    const ref = refDe_(row[colAno], row[colMes]);
    if (!ref) continue;
    const obj = obterMes_(porRef, ref, row[colData]);

    for (var c = 0; c < cols.length; c++) {
      const col = cols[c], val = row[col.i];
      if (col.codeVar && !col.isStatus) {
        obj.vars[col.codeVar] = inteiro_(val);
      } else if (col.codeInd && col.isStatus) {
        obj.ind[col.codeInd] = obj.ind[col.codeInd] || {};
        obj.ind[col.codeInd].s = (val === '' || val == null) ? null : String(val).trim();
      } else if (col.codeInd && !col.isStatus) {
        obj.ind[col.codeInd] = obj.ind[col.codeInd] || {};
        obj.ind[col.codeInd].v = percentual_(val);
      }
    }
  }
}

/* -------------------- Finalidades -------------------- */
function lerFinalidades_(ss, porRef) {
  const sh = ss.getSheetByName(ABA_FINALIDADES);
  if (!sh) return;
  const dados = sh.getDataRange().getValues();
  if (dados.length < 2) return;
  const head = dados[0].map(String);

  const colData = head.indexOf('Data Ref');
  const colMes  = acharCol_(head, /^m[eê]s$/i);
  const colAno  = acharCol_(head, /^ano$/i);

  const fins = [];
  for (var i = 0; i < head.length; i++) {
    if (i === colData || i === colMes || i === colAno) continue;
    if (!head[i]) continue;
    fins.push({ i: i, nome: String(head[i]).trim() });
  }

  for (var r = 1; r < dados.length; r++) {
    const row = dados[r];
    const ref = refDe_(row[colAno], row[colMes]);
    if (!ref) continue;
    const obj = obterMes_(porRef, ref, row[colData]);
    fins.forEach(function (f) {
      const v = inteiro_(row[f.i]);
      if (v > 0) obj.finalidades[f.nome] = v;
    });
  }
}

/* -------------------- Helpers -------------------- */
function obterMes_(porRef, ref, dataCell) {
  if (!porRef[ref]) {
    const mnum = parseInt(ref.split('-')[1], 10);
    const ano  = ref.split('-')[0];
    porRef[ref] = {
      ref: ref, nome: MESES[mnum] + ' ' + ano,
      data: formatarData_(dataCell),
      vars: {}, ind: {}, finalidades: {}
    };
  }
  return porRef[ref];
}
function refDe_(ano, mes) {
  ano = String(ano || '').trim();
  const m = String(mes || '').match(/(\d{1,2})/);
  if (!ano || !m) return null;
  return ano + '-' + ('0' + parseInt(m[1], 10)).slice(-2);
}
function acharCol_(head, re) {
  for (var i = 0; i < head.length; i++) if (re.test(String(head[i]).trim())) return i;
  return -1;
}
function inteiro_(v) {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return Math.round(v);
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}
function percentual_(v) {              // "3,4 %" ou 3.4 -> 3.4 ; vazio -> null
  if (v === '' || v == null) return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace('%', '').replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function formatarData_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  return String(v || '');
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* Teste rápido no editor (Executar > testar): imprime o JSON nos Logs. */
function testar() { Logger.log(JSON.stringify(montarPayload_(), null, 2)); }

/*
 * ALTERNATIVAS se NÃO quiser endpoint público:
 * 1) Deixe "Quem pode acessar: Somente eu" e rode um gatilho por tempo que grava
 *    o JSON em um arquivo do Drive/GitHub (build estático) consumido pelo painel.
 * 2) Hospede o painel atrás de login e chame a API do Sheets autenticada.
 * Para o modelo client-side atual (painel HTML aberto direto), o acesso "Qualquer
 * pessoa" é o que permite o fetch anônimo do navegador.
 */
