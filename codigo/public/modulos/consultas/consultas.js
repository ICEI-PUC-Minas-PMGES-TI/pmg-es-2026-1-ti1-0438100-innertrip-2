/**
 * PSYCHE — Lista de Consultas (RF-05)
 * Autor: Arthur Moreira Figueiredo
 *
 * Funcionalidades:
 *  - Carrega consultas via API REST (JSON Server)
 *  - Busca em tempo real por paciente ou estagiário
 *  - Filtros por status e local
 *  - CRUD completo (criar, editar, deletar)
 *  - Paginação
 *  - Cards de resumo dinâmicos
 *  - Sidebar responsiva (hamburger no mobile)
 */

const API_BASE   = '/consultas';
const POR_PAGINA = 6;

let todasConsultas  = [];
let consultasFiltradas = [];
let paginaAtual     = 1;
let consultaEmEdicao = null;

/* ═══════════════════════════════════════════
   INICIALIZAÇÃO
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  configurarUsuario();
  carregarConsultas();
  configurarHamburger();
});

/* ─── Exibe nome do usuário logado ─── */
function configurarUsuario() {
  const dados = sessionStorage.getItem('usuarioCorrente');
  if (!dados) return;

  const usuario = JSON.parse(dados);
  const nomeCompleto = usuario.nome || usuario.login || 'Usuário';

  // Topbar
  const greeting = document.getElementById('topbarGreeting');
  if (greeting) greeting.textContent = `Bem-vindo, ${nomeCompleto}`;

  // Sidebar avatar (iniciais)
  const avatar = document.getElementById('sidebarAvatar');
  const sidebarName = document.getElementById('sidebarName');
  if (avatar) {
    const iniciais = nomeCompleto.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    avatar.textContent = iniciais;
  }
  if (sidebarName) sidebarName.textContent = nomeCompleto;
}

/* ─── Hamburger menu (mobile) ─── */
function configurarHamburger() {
  const btn      = document.getElementById('hamburgerBtn');
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
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
   API — CARREGAR CONSULTAS
═══════════════════════════════════════════ */
function carregarConsultas() {
  fetch(API_BASE)
    .then(res => {
      if (!res.ok) throw new Error('Erro ao acessar API');
      return res.json();
    })
    .then(dados => {
      todasConsultas = dados;
      popularFiltroLocal();
      aplicarFiltros();
    })
    .catch(err => {
      console.error('[PSYCHE] Erro ao carregar consultas:', err);
      mostrarToast('Erro ao carregar consultas. Verifique se o servidor está rodando.');
      renderizarTabelaVazia('Não foi possível carregar os dados.');
    });
}

/* ─── Popular select de locais ─── */
function popularFiltroLocal() {
  const select = document.getElementById('filterLocal');
  const locais = [...new Set(todasConsultas.map(c => c.local).filter(Boolean))].sort();
  locais.forEach(local => {
    const opt = document.createElement('option');
    opt.value = local;
    opt.textContent = local;
    select.appendChild(opt);
  });
}

/* ═══════════════════════════════════════════
   FILTROS E BUSCA
═══════════════════════════════════════════ */
function aplicarFiltros() {
  const busca  = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const status = document.getElementById('filterStatus').value;
  const local  = document.getElementById('filterLocal').value;

  consultasFiltradas = todasConsultas.filter(c => {
    const matchBusca  = !busca ||
      (c.paciente  && c.paciente.toLowerCase().includes(busca)) ||
      (c.estagiario && c.estagiario.toLowerCase().includes(busca));
    const matchStatus = !status || c.status === status;
    const matchLocal  = !local  || c.local  === local;
    return matchBusca && matchStatus && matchLocal;
  });

  paginaAtual = 1;
  atualizarCards();
  renderizarTabela();
  renderizarPaginacao();
}

/* ═══════════════════════════════════════════
   CARDS DE RESUMO
═══════════════════════════════════════════ */
function atualizarCards() {
  // Sempre usa o total geral para os cards (não o filtrado)
  const total        = todasConsultas.length;
  const pendentes    = todasConsultas.filter(c => c.status === 'pendente').length;
  const confirmadas  = todasConsultas.filter(c => c.status === 'confirmado').length;
  const concluidas   = todasConsultas.filter(c => c.status === 'concluido').length;

  setText('totalConsultas',  total);
  setText('totalPendentes',  String(pendentes).padStart(2, '0'));
  setText('totalConfirmadas', confirmadas);
  setText('totalConcluidas',  concluidas);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ═══════════════════════════════════════════
   RENDERIZAR TABELA
═══════════════════════════════════════════ */
function renderizarTabela() {
  const tbody = document.getElementById('consultasBody');
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = consultasFiltradas.slice(inicio, inicio + POR_PAGINA);

  if (pagina.length === 0) {
    renderizarTabelaVazia('Nenhuma consulta encontrada.');
    return;
  }

  tbody.innerHTML = pagina.map((c, idx) => {
    const num   = String(inicio + idx + 1).padStart(2, '0');
    const data  = formatarDataHora(c.data_hora);
    const badge = gerarBadge(c.status);

    return `
      <tr>
        <td class="row-num">${num}</td>
        <td>
          <div class="patient-name">${escape(c.paciente || '—')}</div>
          <div class="patient-age">${c.idade ? c.idade + ' anos' : ''}</div>
        </td>
        <td>${escape(c.estagiario || '—')}</td>
        <td class="muted">${data}</td>
        <td>${escape(c.local || '—')}</td>
        <td>${badge}</td>
        <td>
          <button class="btn-ver" onclick="verDetalhes(${c.id})">Ver ›</button>
          <button class="btn-edit" onclick="abrirModalEditar(${c.id})" title="Editar">✏️</button>
          <button class="btn-del"  onclick="excluirConsulta(${c.id})" title="Excluir">🗑</button>
        </td>
      </tr>`;
  }).join('');
}

function renderizarTabelaVazia(msg) {
  document.getElementById('consultasBody').innerHTML =
    `<tr><td colspan="7" class="empty-row">${msg}</td></tr>`;
}

/* ─── Badge de status ─── */
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

/* ─── Formatar data ─── */
function formatarDataHora(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    const hoje = new Date();
    const eHoje = d.toDateString() === hoje.toDateString();
    const hora  = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (eHoje) return `Hoje, ${hora}`;
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) + ` ${hora}`;
  } catch { return str; }
}

/* ─── Escape XSS ─── */
function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════
   PAGINAÇÃO
═══════════════════════════════════════════ */
function renderizarPaginacao() {
  const total   = consultasFiltradas.length;
  const paginas = Math.ceil(total / POR_PAGINA);
  const inicio  = Math.min((paginaAtual - 1) * POR_PAGINA + 1, total);
  const fim     = Math.min(paginaAtual * POR_PAGINA, total);

  document.getElementById('pagInfo').textContent =
    total === 0 ? 'Nenhum resultado' : `Exibindo ${inicio}–${fim} de ${total} consultas`;

  const btns = document.getElementById('pagBtns');
  btns.innerHTML = '';

  if (paginas <= 1) return;

  // Anterior
  const prev = criarBtnPag('‹', paginaAtual === 1);
  prev.onclick = () => { if (paginaAtual > 1) irParaPagina(paginaAtual - 1); };
  btns.appendChild(prev);

  // Números
  for (let i = 1; i <= paginas; i++) {
    const btn = criarBtnPag(i, false, i === paginaAtual);
    btn.onclick = () => irParaPagina(i);
    btns.appendChild(btn);
  }

  // Próximo
  const next = criarBtnPag('›', paginaAtual === paginas);
  next.onclick = () => { if (paginaAtual < paginas) irParaPagina(paginaAtual + 1); };
  btns.appendChild(next);
}

function criarBtnPag(label, disabled, active = false) {
  const btn = document.createElement('button');
  btn.className = 'pag-btn' + (active ? ' active' : '');
  btn.textContent = label;
  btn.disabled = disabled;
  return btn;
}

function irParaPagina(n) {
  paginaAtual = n;
  renderizarTabela();
  renderizarPaginacao();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════
   MODAL — NOVA CONSULTA
═══════════════════════════════════════════ */
function abrirModalNova() {
  consultaEmEdicao = null;
  document.getElementById('modalTitle').textContent = 'Nova Consulta';
  limparModal();

  // Pré-preencher estagiário com usuário logado
  const dados = sessionStorage.getItem('usuarioCorrente');
  if (dados) {
    const u = JSON.parse(dados);
    document.getElementById('modalEstagiario').value = u.nome || u.login || '';
  }

  abrirModal();
}

function abrirModalEditar(id) {
  const c = todasConsultas.find(x => x.id === id);
  if (!c) return;

  consultaEmEdicao = id;
  document.getElementById('modalTitle').textContent = 'Editar Consulta';

  document.getElementById('modalId').value         = c.id;
  document.getElementById('modalPaciente').value   = c.paciente   || '';
  document.getElementById('modalIdade').value      = c.idade      || '';
  document.getElementById('modalEstagiario').value = c.estagiario || '';
  document.getElementById('modalStatus').value     = c.status     || 'pendente';
  document.getElementById('modalModalidade').value = c.modalidade || 'presencial';
  document.getElementById('modalLocal').value      = c.local      || '';
  document.getElementById('modalNotas').value      = c.notas      || '';

  if (c.data_hora) {
    // Formato datetime-local: yyyy-MM-ddTHH:mm
    const dt = new Date(c.data_hora);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    document.getElementById('modalDataHora').value = local;
  }

  abrirModal();
}

function abrirModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function limparModal() {
  ['modalId','modalPaciente','modalIdade','modalEstagiario',
   'modalLocal','modalNotas','modalDataHora'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('modalStatus').value    = 'pendente';
  document.getElementById('modalModalidade').value = 'presencial';
}

/* ═══════════════════════════════════════════
   API — SALVAR (POST / PUT)
═══════════════════════════════════════════ */
function salvarConsulta() {
  const paciente   = document.getElementById('modalPaciente').value.trim();
  const estagiario = document.getElementById('modalEstagiario').value.trim();
  const local      = document.getElementById('modalLocal').value.trim();

  if (!paciente || !estagiario || !local) {
    mostrarToast('Preencha ao menos Paciente, Estagiário e Local.');
    return;
  }

  const payload = {
    paciente,
    idade:      parseInt(document.getElementById('modalIdade').value) || null,
    estagiario,
    data_hora:  document.getElementById('modalDataHora').value || null,
    local,
    status:     document.getElementById('modalStatus').value,
    modalidade: document.getElementById('modalModalidade').value,
    notas:      document.getElementById('modalNotas').value.trim() || null,
  };

  if (consultaEmEdicao) {
    // PUT — editar existente
    fetch(`${API_BASE}/${consultaEmEdicao}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: consultaEmEdicao, ...payload }),
    })
      .then(res => res.json())
      .then(() => {
        fecharModal();
        mostrarToast('Consulta atualizada!');
        carregarConsultas();
      })
      .catch(() => mostrarToast('Erro ao atualizar consulta.'));
  } else {
    // POST — nova
    fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(() => {
        fecharModal();
        mostrarToast('Consulta criada!');
        carregarConsultas();
      })
      .catch(() => mostrarToast('Erro ao criar consulta.'));
  }
}

/* ═══════════════════════════════════════════
   API — EXCLUIR (DELETE)
═══════════════════════════════════════════ */
function excluirConsulta(id) {
  if (!confirm('Tem certeza que deseja excluir esta consulta?')) return;

  fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    .then(() => {
      mostrarToast('Consulta excluída.');
      carregarConsultas();
    })
    .catch(() => mostrarToast('Erro ao excluir consulta.'));
}

/* ═══════════════════════════════════════════
   VER DETALHES
═══════════════════════════════════════════ */
function verDetalhes(id) {
  const c = todasConsultas.find(x => x.id === id);
  if (!c) return;

  const msg = [
    `Paciente: ${c.paciente || '—'} (${c.idade ? c.idade + ' anos' : 'idade não informada'})`,
    `Estagiário: ${c.estagiario || '—'}`,
    `Data/Hora: ${formatarDataHora(c.data_hora)}`,
    `Local: ${c.local || '—'}`,
    `Status: ${c.status || '—'}`,
    `Modalidade: ${c.modalidade || '—'}`,
    c.notas ? `Notas: ${c.notas}` : null,
  ].filter(Boolean).join('\n');

  alert(msg);
  // Futuramente: redirecionar para página de detalhes
  // window.location.href = `detalhe.html?id=${id}`;
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let toastTimer;
function mostrarToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}