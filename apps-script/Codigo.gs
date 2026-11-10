/**
 * Formulário de contacto do site de Anabela Rocha.
 * Recebe o pedido do site, valida, grava uma linha na Google Sheet e envia um email.
 *
 * Este script e a Sheet devem ficar na conta Google da Dra. Anabela (ou numa conta que ela controle).
 * Instruções completas: docs/formulario-google-sheets.md
 */

const CONFIG = {
  // ID da Google Sheet (a parte do link entre /d/ e /edit). Se ficar vazio, usa a Sheet onde o script foi criado.
  SPREADSHEET_ID: '',
  SHEET_NAME: 'Pedidos',
  NOTIFICATION_EMAIL: 'anabelarocha-46953p@adv.oa.pt',
};

const COLUNAS = ['Data e hora', 'Teste', 'Origem', 'Tipo de contacto', 'Área', 'Nome completo', 'Email', 'Telemóvel', 'Assunto', 'Consentimento'];
const TIPOS_VALIDOS = ['Cliente final', 'Consultor ou agência'];
const AREAS_VALIDAS = ['Direito imobiliário', 'Fiscalidade', 'Consultoria estratégica', 'Outro assunto'];
const ORIGENS_VALIDAS = ['pagina-inicial', 'consultores', 'teste'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Honeypot: campo escondido que só os bots preenchem. Responde como se tivesse corrido bem
  // (para não dar pistas ao bot) mas não guarda nem envia nada.
  if (String(p.website || '').trim() !== '') {
    return responder({ ok: true });
  }

  const dados = {
    nome: limpar(p.nome, 120),
    email: limpar(p.email, 160),
    telemovel: limpar(p.telemovel, 20),
    tipo: limpar(p.tipo, 40),
    // A área é opcional: um valor fora da lista fica em branco.
    area: AREAS_VALIDAS.indexOf(limpar(p.area, 40)) >= 0 ? limpar(p.area, 40) : '',
    assunto: limpar(p.assunto, 1000),
    consentimento: p.consentimento === 'sim',
    origem: ORIGENS_VALIDAS.indexOf(p.origem) >= 0 ? p.origem : 'desconhecida',
  };

  const erros = validar(dados);
  if (erros.length) {
    return responder({ ok: false, error: 'validacao', campos: erros });
  }

  const teste = dados.origem === 'teste';

  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const folha = obterFolha();
      folha.appendRow([
        new Date(),
        teste ? 'TESTE' : '',
        dados.origem,
        dados.tipo,
        dados.area,
        protegerCelula(dados.nome),
        protegerCelula(dados.email),
        protegerCelula(dados.telemovel),
        protegerCelula(dados.assunto),
        'Sim',
      ]);
    } finally {
      lock.releaseLock();
    }
  } catch (erro) {
    Logger.log('Falha ao gravar na Sheet: ' + erro);
    return responder({ ok: false, error: 'gravacao' });
  }

  try {
    enviarEmail(dados, teste);
  } catch (erro) {
    // O pedido já ficou guardado na Sheet, por isso não falhamos por causa do email.
    Logger.log('Falha ao enviar email: ' + erro);
  }

  return responder({ ok: true });
}

function validar(d) {
  const erros = [];
  if (d.nome.length < 2) erros.push('nome');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) erros.push('email');
  const digitos = d.telemovel.replace(/\D/g, '');
  if (digitos.length < 9 || digitos.length > 15 || /[^0-9+ ]/.test(d.telemovel)) erros.push('telemovel');
  if (TIPOS_VALIDOS.indexOf(d.tipo) < 0) erros.push('tipo');
  if (d.assunto.length < 5) erros.push('assunto');
  if (!d.consentimento) erros.push('consentimento');
  return erros;
}

function enviarEmail(d, teste) {
  const assunto = (teste ? '[TESTE] ' : '') + 'Novo pedido de contacto pelo site, ' + d.nome;
  const corpo = [
    teste ? 'ATENÇÃO: isto é um pedido de TESTE, com dados fictícios.\n' : '',
    'Recebeu um novo pedido de contacto através do site.',
    '',
    'Tipo de contacto: ' + d.tipo,
    'Área: ' + (d.area || 'não indicada'),
    'Nome completo: ' + d.nome,
    'Email: ' + d.email,
    'Telemóvel: ' + d.telemovel,
    'Página de origem: ' + d.origem,
    '',
    'Assunto:',
    d.assunto,
    '',
    'Este pedido também ficou guardado na Google Sheet.',
  ].join('\n');

  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: assunto,
    body: corpo,
    replyTo: d.email,
    name: 'Site Anabela Rocha',
  });
}

function obterFolha() {
  const livro = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const folha = livro.getSheetByName(CONFIG.SHEET_NAME) || livro.insertSheet(CONFIG.SHEET_NAME);
  if (folha.getLastRow() === 0) {
    folha.appendRow(COLUNAS);
    folha.setFrozenRows(1);
  }
  return folha;
}

function limpar(valor, maximo) {
  return String(valor || '').replace(/\s+/g, ' ').trim().slice(0, maximo);
}

// Evita que um texto começado por =, +, - ou @ seja interpretado como fórmula na Sheet.
function protegerCelula(valor) {
  return /^[=+\-@]/.test(valor) ? "'" + valor : valor;
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Correr uma vez no editor (Executar > testarFormulario) depois de colar o código.
 * Pede as autorizações necessárias e cria uma linha de TESTE com dados fictícios,
 * mais um email com [TESTE] no assunto. Também confirma que um envio com o honeypot
 * preenchido NÃO cria linha. Pode apagar as linhas de teste depois.
 */
function testarFormulario() {
  const base = {
    nome: 'TESTE Pessoa Fictícia',
    email: 'teste@example.com',
    telemovel: '+351 000 000 000',
    tipo: 'Cliente final',
    area: 'Fiscalidade',
    assunto: 'TESTE: pedido fictício para confirmar o formulário. Pode apagar esta linha.',
    consentimento: 'sim',
    origem: 'teste',
    website: '',
  };

  const linhasAntes = obterFolha().getLastRow();
  Logger.log('Envio válido: ' + doPost({ parameter: base }).getContent());
  Logger.log('Envio com honeypot: ' + doPost({ parameter: Object.assign({}, base, { website: 'spam' }) }).getContent());
  Logger.log('Envio inválido: ' + doPost({ parameter: Object.assign({}, base, { email: 'invalido', consentimento: '' }) }).getContent());
  Logger.log('Linhas criadas: ' + (obterFolha().getLastRow() - linhasAntes) + ' (deve ser 1)');
}
