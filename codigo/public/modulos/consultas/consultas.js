/**
 * PSYCHE — Lista de Consultas (RF-05)
 * Autor: Arthur Moreira Figueiredo
 *
 * Atualização semana 2:
 *  - Adaptado para estrutura real do db.json do grupo (pacienteID / psicologoID)
 *  - Carrega usuarios e consultas em paralelo via Promise.all
 *  - Resolve nomes cruzando IDs com a lista de usuarios
 *  - Filtro por data (Hoje / Esta semana / Este mês)
 *  - Ordenação por data/hora
 *  - Melhoria no modal: selects de paciente e psicólogo populados do banco
 */

const API_CONSULTAS = '/consultas';
const API_USUARIOS  = '/usuarios';
const POR_PAGINA    = 6;

let todasConsultas     = [];
let todosUsuarios      = [];
let consultasFiltradas = [];
let paginaAtual        = 1;
let editandoId         = null;

/* ═══════════════════════════════════════════
   INICIALIZAÇÃO
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  configurarUsuario();
  carregarDados();
  configurarHamburger();
});

function configurarUsuario() {
  const dados = sessionStorage.getItem('usuarioCorrente');
  if (!dados) return;
  const u = JSON.parse(dados);
  const nome = u.nome || u.login || 'Usuário';
  const el = document.getElementById('topbarGreeting');
  if (el) el.textContent = `Bem-vindo, ${nome}`;
  const av = document.getElementById('sidebarAvatar');
  if (av) av.textContent = nome.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
  const sn = document.getElementById('sidebarName');
  if (sn) sn.textContent = nome;
}

function configurarHamburger() {
  const btn     = document.getElementById('hamburgerBtn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!btn) return;
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
}

function fecharSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

/* ═══════════════════════════════════════════
   CARREGAR DADOS (paralelo)
═══════════════════════════════════════════ */
function carregarDados() {
  // O db.json do grupo é um array com 1 objeto contendo tudo
  // Tenta buscar /consultas e /usuarios normalmente (json-server flat)
  // Se falhar, faz fallback lendo o arquivo inteiro
  Promise.all([
    fetch(API_CONSULTAS).then(r => r.json()),
    fetch(API_USUARIOS).then(r => r.json())
  ])
  .then(([consultas, usuarios]) => {
    // json-server pode retornar array direto ou array-de-objetos
    todasConsultas = Array.isArray(consultas) ? consultas : [];
    todosUsuarios  = Array.isArray(usuarios)  ? usuarios  : [];
    inicializar();
  })
  .catch(err => {
    console.error('[PSYCHE] Erro ao carregar dados:', err);
    mostrarToast('Erro ao carregar dados. Verifique se o servidor está rodando (npm start).');
    renderizarTabelaVazia('Servidor não encontrado. Rode: npm start na pasta /codigo');
  });
}

function inicializar() {
  popularSelectPacientes();
  popularSelectPsicologos();
  popularFiltroLocal();
  aplicarFiltros();
}

/* ─── Helpers de lookup ─── */
function getNomePaciente(pacienteID) {
  const u = todosUsuarios.find(u => String(u.id) === String(pacienteID));
  if (!u) return `Paciente #${pacienteID}`;
  return `${u.nome || ''} ${u.sobrenome || ''}`.trim();
}

function getNomePsicologo(psicologoID) {
  const u = todosUsuarios.find(u => String(u.id) === String(psicologoID));
  if (!u) return `Profissional #${psicologoID}`;
  return `${u.nome || ''} ${u.sobrenome || ''}`.trim();
}

function getIdadePaciente(pacienteID) {
  const u = todosUsuarios.find(u => String(u.id) === String(pacienteID));
  if (!u || !u.nascimento || u.nascimento === 'new Date()') return null;
  const nasc = new Date(u.nascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return isNaN(idade) ? null : idade;
}

/* ═══════════════════════════════════════════
   POPULAR SELECTS DO MODAL
═══════════════════════════════════════════ */
function popularSelectPacientes() {
  const sel = document.getElementById('modalPacienteID');
  if (!sel) return;
  const pacientes = todosUsuarios.filter(u => u.tipoUsuario === 'paciente');
  pacientes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.nome} ${p.sobrenome || ''}`.trim();
    sel.appendChild(opt);
  });
}

function popularSelectPsicologos() {
  const sel = document.getElementById('modalPsicologoID');
  if (!sel) return;
  const prof = todosUsuarios.filter(u => u.tipoUsuario === 'psicologo' || u.tipoUsuario === 'estudante');
  prof.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.nome} ${p.sobrenome || ''}`.trim() + (p.tipoUsuario === 'estudante' ? ' (estagiário)' : '');
    sel.appendChild(opt);
  });
}

function popularFiltroLocal() {
  const sel = document.getElementById('filterLocal');
  if (!sel) return;
  const locais = [...new Set(todasConsultas.map(c => c.local).filter(Boolean))].sort();
  locais.forEach(local => {
    const opt = document.createElement('option');
    opt.value = local; opt.textContent = local;
    sel.appendChild(opt);
  });
}

/* ═══════════════════════════════════════════
   FILTROS
═══════════════════════════════════════════ */
function aplicarFiltros() {
  const busca  = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const status = document.getElementById('filterStatus').value;
  const local  = document.getElementById('filterLocal').value;
  const data   = document.getElementById('filterData').value;

  const hoje   = new Date();
  hoje.setHours(0,0,0,0);

  // 1. Obtém o usuário logado do sessionStorage conforme configurado no teu projeto
  const dadosUsuario = sessionStorage.getItem('usuarioCorrente');
  let usuarioLogado = null;
  if (dadosUsuario) {
    usuarioLogado = JSON.parse(dadosUsuario);
  }

  consultasFiltradas = todasConsultas.filter(c => {
    // 2. FILTRO DE PRIVACIDADE BASEADO NO PERFIL
    if (usuarioLogado) {
      const tipo = usuarioLogado.tipoUsuario;
      const idLogado = String(usuarioLogado.id);

      if (tipo === 'psicologo' || tipo === 'estudante') {
        // Profissionais só veem consultas cujo psicologoID seja igual ao ID deles
        if (String(c.psicologoID) !== idLogado) return false;
      } else if (tipo === 'paciente') {
        // Pacientes só veem consultas cujo pacienteID seja igual ao ID deles
        if (String(c.pacienteID) !== idLogado) return false;
      }
    }

    // 3. Filtros existentes na tua aplicação (Busca por nome, Status, Local, Data)
    const nomePac  = getNomePaciente(c.pacienteID).toLowerCase();
    const nomePsic = getNomePsicologo(c.psicologoID).toLowerCase();
    const matchBusca  = !busca  || nomePac.includes(busca) || nomePsic.includes(busca);
    const matchStatus = !status || c.status === status;
    const matchLocal  = !local  || c.local  === local;

    let matchData = true;
    if (data && c.data_hora) {
      const dt = new Date(c.data_hora);
      dt.setHours(0,0,0,0);
      if (data === 'hoje') {
        matchData = dt.getTime() === hoje.getTime();
      } else if (data === 'semana') {
        const fim = new Date(hoje); fim.setDate(hoje.getDate() + 7);
        matchData = dt >= hoje && dt <= fim;
      } else if (data === 'mes') {
        matchData = dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear();
      }
    }

    return matchBusca && matchStatus && matchLocal && matchData;
  });

  // Ordenar por data mais próxima
  consultasFiltradas.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

  paginaAtual = 1;
  atualizarCards();
  renderizarTabela();
  renderizarPaginacao();
}

/* ═══════════════════════════════════════════
   CARDS DE RESUMO
═══════════════════════════════════════════ */
function atualizarCards() {
const totalSessoes    = consultasFiltradas.length;
  const totalPendentes  = consultasFiltradas.filter(c => c.status === 'pendente').length;
  const totalConfirmadas = consultasFiltradas.filter(c => c.status === 'confirmado').length;
  const totalConcluidas  = consultasFiltradas.filter(c => c.status === 'concluido').length;

  // Injeta os valores reais do usuário nos elementos do HTML
  setText('totalConsultas',   totalSessoes);
  setText('totalPendentes',   String(totalPendentes).padStart(2, '0'));
  setText('totalConfirmadas', totalConfirmadas);
  setText('totalConcluidas',  totalConcluidas);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ═══════════════════════════════════════════
   TABELA
═══════════════════════════════════════════ */
function renderizarTabela() {
  const tbody  = document.getElementById('consultasBody');
  if (!tbody) return;

  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = consultasFiltradas.slice(inicio, inicio + POR_PAGINA);

  if (pagina.length === 0) {
    renderizarTabelaVazia('Nenhuma consulta encontrada com os filtros selecionados.');
    return;
  }

  tbody.innerHTML = pagina.map((c, idx) => {
    const num    = String(inicio + idx + 1).padStart(2, '0');
    const nome   = esc(getNomePaciente(c.pacienteID));
    const idade  = getIdadePaciente(c.pacienteID);
    const prof   = esc(getNomePsicologo(c.psicologoID));
    const data   = formatarDataHora(c.data_hora);
    const badge  = gerarBadge(c.status);
    const modal  = c.modalidade === 'remoto'
      ? '<span class="tag-remoto">Remoto</span>'
      : '';

    // CORREÇÃO: Colocamos '${c.id}' entre aspas simples para garantir que IDs string ou recém-criados funcionem perfeitamente no onclick
    return `<tr>
      <td class="row-num">${num}</td>
      <td>
        <div class="patient-name">${nome}</div>
        <div class="patient-age">${idade ? idade + ' anos' : ''}${modal}</div>
      </td>
      <td>${prof}</td>
      <td class="td-muted">${data}</td>
      <td>${esc(c.local || '—')}</td>
      <td>${badge}</td>
      <td class="actions-cell">
        <button class="btn-ver"  onclick="verDetalhes('${c.id}')">Ver ›</button>
        <button class="btn-edit" onclick="abrirModalEditar('${c.id}')" title="Editar">✏️</button>
        <button class="btn-del"  onclick="excluirConsulta('${c.id}')" title="Excluir">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function renderizarTabelaVazia(msg) {
  document.getElementById('consultasBody').innerHTML =
    `<tr><td colspan="7" class="empty-row">${msg}</td></tr>`;
}

function gerarBadge(status) {
  const map = {
    confirmado: ['badge-confirmado', 'Confirmado'],
    pendente:   ['badge-pendente',   'Pendente'],
    cancelado:  ['badge-cancelado',  'Cancelado'],
    concluido:  ['badge-concluido',  'Concluído'],
  };
  const [cls, label] = map[status] || ['badge-pendente', status || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatarDataHora(str) {
  if (!str) return '—';
  try {
    const d    = new Date(str);
    const hoje = new Date();
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) + ` ${hora}`;
  } catch { return str; }
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════════════════════════════
   PAGINAÇÃO
═══════════════════════════════════════════ */
function renderizarPaginacao() {
  const total  = consultasFiltradas.length;
  const pages  = Math.ceil(total / POR_PAGINA);
  const inicio = Math.min((paginaAtual - 1) * POR_PAGINA + 1, total);
  const fim    = Math.min(paginaAtual * POR_PAGINA, total);

  document.getElementById('pagInfo').textContent =
    total === 0 ? 'Nenhum resultado' : `Exibindo ${inicio}–${fim} de ${total} consultas`;

  const btns = document.getElementById('pagBtns');
  btns.innerHTML = '';
  if (pages <= 1) return;

  const prev = mkBtn('‹', paginaAtual === 1);
  prev.onclick = () => { if (paginaAtual > 1) irPara(paginaAtual - 1); };
  btns.appendChild(prev);

  for (let i = 1; i <= pages; i++) {
    const b = mkBtn(i, false, i === paginaAtual);
    b.onclick = () => irPara(i);
    btns.appendChild(b);
  }

  const next = mkBtn('›', paginaAtual === pages);
  next.onclick = () => { if (paginaAtual < pages) irPara(paginaAtual + 1); };
  btns.appendChild(next);
}

function mkBtn(label, disabled, active = false) {
  const b = document.createElement('button');
  b.className = 'pag-btn' + (active ? ' active' : '');
  b.textContent = label;
  b.disabled = disabled;
  return b;
}

function irPara(n) {
  paginaAtual = n;
  renderizarTabela();
  renderizarPaginacao();
}

/* ═══════════════════════════════════════════
   MODAL
═══════════════════════════════════════════ */
function abrirModalNova() {
  editandoId = null;
  document.getElementById('modalTitle').textContent = 'Nova Consulta';
  limparModal();
  abrirModal();
}

function abrirModalEditar(id) {
  const c = todasConsultas.find(x => String(x.id) === String(id));
  if (!c) return;
  editandoId = id; // Mantém o ID correto para o PUT
  document.getElementById('modalTitle').textContent = 'Editar Consulta';
  document.getElementById('modalPacienteID').value  = c.pacienteID  || '';
  document.getElementById('modalPsicologoID').value = c.psicologoID || '';
  document.getElementById('modalStatus').value      = c.status      || 'pendente';
  document.getElementById('modalModalidade').value  = c.modalidade  || 'presencial';
  document.getElementById('modalLocal').value       = c.local       || '';
  document.getElementById('modalNotas').value       = c.notas       || '';
  document.getElementById('modalAvaliacao').value   = c.avaliacao   || '';
  if (c.data_hora) {
    const dt = new Date(c.data_hora);
    document.getElementById('modalDataHora').value =
      new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  }
  abrirModal();
}

function abrirModal()  { document.getElementById('modalOverlay').classList.add('open'); }
function fecharModal() { document.getElementById('modalOverlay').classList.remove('open'); }

function limparModal() {
  ['modalPacienteID','modalPsicologoID','modalLocal','modalNotas','modalDataHora','modalAvaliacao']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('modalStatus').value    = 'pendente';
  document.getElementById('modalModalidade').value = 'presencial';
}

/* ═══════════════════════════════════════════
   CRUD — SALVAR
═══════════════════════════════════════════ */
function salvarConsulta() {
  const pacienteID  = document.getElementById('modalPacienteID').value;
  const psicologoID = document.getElementById('modalPsicologoID').value;
  const local       = document.getElementById('modalLocal').value.trim();

  if (!pacienteID || !psicologoID || !local) {
    mostrarToast('Preencha Paciente, Profissional e Local.');
    return;
  }

  const payload = {
    pacienteID,
    psicologoID,
    data_hora:  document.getElementById('modalDataHora').value  || null,
    local,
    status:     document.getElementById('modalStatus').value,
    modalidade: document.getElementById('modalModalidade').value,
    avaliacao:  document.getElementById('modalAvaliacao').value  || '',
    notas:      document.getElementById('modalNotas').value.trim() || '',
  };

  const url    = editandoId ? `${API_CONSULTAS}/${editandoId}` : API_CONSULTAS;
  const method = editandoId ? 'PUT' : 'POST';
  if (editandoId) payload.id = editandoId;

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(r => r.json())
  .then(() => {
    fecharModal();
    mostrarToast(editandoId ? 'Consulta atualizada!' : 'Consulta criada!');
    carregarDados();
  })
  .catch(() => mostrarToast('Erro ao salvar. Tente novamente.'));
}

/* ═══════════════════════════════════════════
   CRUD — EXCLUIR
═══════════════════════════════════════════ */
function excluirConsulta(id) {
  if (!confirm('Excluir esta consulta? Esta ação não pode ser desfeita.')) return;
  fetch(`${API_CONSULTAS}/${id}`, { method: 'DELETE' })
  .then(() => { mostrarToast('Consulta excluída.'); carregarDados(); })
  .catch(() => mostrarToast('Erro ao excluir.'));
}

/* ═══════════════════════════════════════════
   VER DETALHES
═══════════════════════════════════════════ */
function verDetalhes(id) {
  // Conversão para String garante que ache tanto id numérico quanto textual
  const c = todasConsultas.find(x => String(x.id) === String(id));
  if (!c) return;
  const paciente = getNomePaciente(c.pacienteID);
  const idade    = getIdadePaciente(c.pacienteID);
  const prof     = getNomePsicologo(c.psicologoID);
  alert([
    `Paciente: ${paciente}${idade ? ' (' + idade + ' anos)' : ''}`,
    `Profissional: ${prof}`,
    `Data/Hora: ${formatarDataHora(c.data_hora)}`,
    `Local: ${c.local || '—'}`,
    `Status: ${c.status}`,
    `Modalidade: ${c.modalidade}`,
    c.avaliacao ? `Avaliação: ${c.avaliacao}/5` : null,
    c.notas ? `Notas: ${c.notas}` : null,
  ].filter(Boolean).join('\n'));
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let _toastTimer;
function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
