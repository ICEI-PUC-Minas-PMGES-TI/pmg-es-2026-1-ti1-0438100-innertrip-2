const API_USUARIOS  = '/usuarios';
const API_CONSULTAS = '/consultas';

let formatoSelecionado = 'remoto';
document.addEventListener('DOMContentLoaded', () => {
  const session = verificarAcesso();
  if (!session) return;

  preencherDadosPaciente(session);
  carregarPsicologos();
  configurarFormatos();

  document.querySelector('.btn-confirmar')
    .addEventListener('click', confirmarAgendamento);
});
function verificarAcesso() {
  const raw = sessionStorage.getItem('usuarioCorrente');
  if (!raw) {
    window.location.href = '/modulos/login/login.html';
    return null;
  }

  const session = JSON.parse(raw);

  if (session.tipoUsuario !== 'paciente') {
    document.querySelector('main').innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;
                  justify-content:center; height:60vh; gap:16px; text-align:center;">
        <div style="font-size:48px;">🚫</div>
        <h2>Acesso restrito</h2>
        <p style="color:#6B6B6B;">
          O agendamento de consultas é exclusivo para pacientes.<br>
          Você será redirecionado em instantes...
        </p>
      </div>
    `;
    setTimeout(() => {
      window.location.href = '/modulos/dashboard/dashboard.html';
    }, 3000);
    return null;
  }

  return session;
}

function preencherDadosPaciente(session) {
  fetch(`${API_USUARIOS}/${session.id}`)
    .then(r => r.json())
    .then(usuario => {
      setVal('inputNome',     `${usuario.nome || ''} ${usuario.sobrenome || ''}`.trim());
      setVal('inputEmail',    usuario.contato?.email    || session.email || '');
      setVal('inputTelefone', usuario.contato?.telefone || '');
    })
    .catch(() => {
      setVal('inputNome',  session.nome  || '');
      setVal('inputEmail', session.email || '');
    });
}

function carregarPsicologos() {
  const params   = new URLSearchParams(window.location.search);
  const idPreSel = params.get('psicologoId');

  Promise.all([
    fetch(`${API_USUARIOS}?tipoUsuario=psicologo`).then(r => r.json()),
    fetch(`${API_USUARIOS}?tipoUsuario=estudante`).then(r => r.json()),
  ])
  .then(([psicologos, estudantes]) => {
    const todos  = [...psicologos, ...estudantes];
    const select = document.getElementById('selectPsicologo');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um profissional</option>';
    todos.forEach(p => {
      const nome = `${p.nome || ''} ${p.sobrenome || ''}`.trim();
      const tipo = p.tipoUsuario === 'estudante' ? ' (Estagiário)' : '';
      const opt  = document.createElement('option');
      opt.value       = p.id;
      opt.textContent = nome + tipo;
      select.appendChild(opt);
    });

    // Pré-seleciona e preenche card do psicólogo se veio via query param
    if (idPreSel) {
      select.value = idPreSel;
      const psicologo = todos.find(p => String(p.id) === String(idPreSel));
      if (psicologo) preencherCardPsicologo(psicologo);
    }

    // Atualiza card quando o usuário troca o select manualmente
    select.addEventListener('change', () => {
      const escolhido = todos.find(p => String(p.id) === select.value);
      if (escolhido) preencherCardPsicologo(escolhido);
      else           limparCardPsicologo();
      atualizarResumo();
    });
  })
  .catch(err => console.error('[PSYCHE] Erro ao carregar profissionais:', err));
}

function preencherCardPsicologo(p) {
  const nomeCompleto = `${p.nome || ''} ${p.sobrenome || ''}`.trim();
  const iniciais     = nomeCompleto.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();

  setHTML('psicAvatar',  iniciais);
  setTxt('psicNome',     nomeCompleto);
  setTxt('psicCrp',      p.crp || 'CRP não informado');
  setTxt('psicEsp',      getEspecializacao(p.id_especializacao));
  setTxt('psicHorario',  p.perfil?.horarioAtivo || 'Não informado');
  setTxt('psicEmail',    p.contato?.email       || '—');
  setTxt('psicTelefone', p.contato?.telefone    || '—');

  const card = document.getElementById('cardPsicologo');
  if (card) card.style.display = 'block';
}

function limparCardPsicologo() {
  const card = document.getElementById('cardPsicologo');
  if (card) card.style.display = 'none';
}

const ESPECIALIZACOES = { 1:'Escolar', 2:'Geral', 3:'Emocional', 4:'Infanto-juvenil' };
function getEspecializacao(id) { return ESPECIALIZACOES[id] || 'Geral'; }

function configurarFormatos() {
  document.querySelectorAll('.opcao').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.opcao').forEach(o => o.classList.remove('active'));
      el.classList.add('active');
      formatoSelecionado = el.dataset.formato || 'remoto';
      atualizarResumo();
    });
  });
}

function atualizarResumo() {
  const data    = document.getElementById('inputData')?.value;
  const horario = document.getElementById('selectHorario')?.value;
  const local   = document.getElementById('inputLocal')?.value?.trim();
  const formato = formatoSelecionado === 'remoto' ? 'Online' : 'Presencial';

  setTxt('resumoData',    data    ? formatarData(data) : '—');
  setTxt('resumoHorario', horario || '—');
  setTxt('resumoFormato', formato);
  setTxt('resumoLocal',   local   || '—');
}

function formatarData(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function confirmarAgendamento() {
  const session     = JSON.parse(sessionStorage.getItem('usuarioCorrente') || '{}');
  const psicologoId = document.getElementById('selectPsicologo')?.value;
  const data        = document.getElementById('inputData')?.value;
  const horario     = document.getElementById('selectHorario')?.value;
  const local       = document.getElementById('inputLocal')?.value?.trim() || 'A definir';

  if (!psicologoId) return mostrarFeedback('Selecione um profissional.', true);
  if (!data)        return mostrarFeedback('Informe a data da consulta.', true);
  if (!horario)     return mostrarFeedback('Selecione um horário.', true);

  const consulta = {
    pacienteID:  session.id,
    psicologoID: Number(psicologoId),
    data_hora:   `${data}T${horario}`,
    local,
    status:      'pendente',
    modalidade:  formatoSelecionado,
    duracao:     1,
    avaliacao:   '',
    notas:       ''
  };

  const btn = document.querySelector('.btn-confirmar');
  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  fetch(API_CONSULTAS, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(consulta)
  })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(saved => {
    mostrarFeedback(`Consulta agendada! (ID: ${saved.id}) Redirecionando...`);
    setTimeout(() => window.location.href = '/modulos/consultas/index.html', 2000);
  })
  .catch(() => mostrarFeedback('Erro ao salvar. Verifique se o servidor está rodando.', true))
  .finally(() => { btn.disabled = false; btn.textContent = 'Confirmar agendamento'; });
}

function setVal(id, val)  { const el = document.getElementById(id); if (el) el.value       = val; }
function setTxt(id, val)  { const el = document.getElementById(id); if (el) el.textContent = val; }
function setHTML(id, val) { const el = document.getElementById(id); if (el) el.innerHTML   = val; }

function mostrarFeedback(msg, erro = false) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent      = msg;
    toast.style.background = erro ? '#ff5555' : '#FFD60A';
    toast.style.color      = erro ? '#fff'    : '#121212';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  } else {
    alert(msg);
  }
}

document.addEventListener('change', atualizarResumo);
document.addEventListener('input',  atualizarResumo);
