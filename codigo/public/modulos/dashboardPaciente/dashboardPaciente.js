/**
 * PSYCHE — Dashboard Psicologo
 * Autor: Vitor Augusto de Souza
 *
 * Funcionalidades:
 *  - Exibe nome e iniciais do usuário logado
 *  - Carrega estatísticas via API REST (JSON Server)
 *  - Exibe avaliações das consultas do usuário logado
 */

const API_USUARIOS = '/usuarios';
const API_CONSULTAS = '/consultas';
const API_HUMOR = '/humor';

/* ═══════════════════════════════════════════
   INICIALIZAÇÃO
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const usuarioLogado = configurarUsuario();
  if (!usuarioLogado) return; // redirecionou para login

  configurarHamburger();
  carregarDados(usuarioLogado);
});

/* ═══════════════════════════════════════════
   USUÁRIO LOGADO
═══════════════════════════════════════════ */
function configurarUsuario() {
  const dados = sessionStorage.getItem('usuarioCorrente');
  if (!dados) {
    window.location.href = '/modulos/login/login.html';
    return null;
  }

  const session = JSON.parse(dados);
  const nomeCompleto = session.nome || session.login || 'Usuário';

  // Saudação
  const titleH1 = document.querySelector('#titleSection h1');
  if (titleH1) titleH1.textContent = `Bem vindo, ${nomeCompleto}!`;

  // Iniciais em todos os avatares
  const iniciais = nomeCompleto
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  document.querySelectorAll('.avatar-circle').forEach(el => {
    el.textContent = iniciais;
  });

  // Nome na sidebar
  const sidebarName = document.getElementById('sidebarName');
  if (sidebarName) sidebarName.textContent = nomeCompleto;

  return session;
}

/* ═══════════════════════════════════════════
   HAMBURGER — SIDEBAR MOBILE
═══════════════════════════════════════════ */
function configurarHamburger() {
  const btn = document.getElementById('hamburgerBtn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  });
}

function fecharSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

/* ═══════════════════════════════════════════
   CARREGAR DADOS DA API
═══════════════════════════════════════════ */
function carregarDados(session) {
  Promise.allSettled([
    fetch(API_USUARIOS).then(r => r.ok ? r.json() : []),
    fetch(API_CONSULTAS).then(r => r.ok ? r.json() : []),
    fetch(API_HUMOR).then(r => r.ok ? r.json() : []),
  ]).then(([resUsuarios, resConsultas, resHumor]) => {
    const usuarios = resUsuarios.status === 'fulfilled' ? resUsuarios.value : [];
    const consultas = resConsultas.status === 'fulfilled' ? resConsultas.value : [];
    const humor = resHumor.status === 'fulfilled' ? resHumor.value : [];

    // Encontra o objeto completo do usuário logado pelo id ou email
    const usuarioCompleto = usuarios.find(u =>
      u.id === session.id || u.contato?.email === session.email
    );

    atualizarSmallCardsPaciente(usuarios, consultas, usuarioCompleto);
    atualizarResumoSessoes(usuarioCompleto, consultas, humor);
    atualizarAvaliacoes(consultas, usuarios, usuarioCompleto);
    atualizarSessoes(consultas, usuarios, usuarioCompleto);
    configurarBotoesEmocoes(usuarioCompleto);

    console.log('Usuários:', usuarios);
    console.log('Consultas:', consultas);
    console.log('Usuário completo:', usuarioCompleto);
    console.log('Session:', session);
  });
}

//att cards
function atualizarSmallCardsPaciente(usuarios, consultas, usuarioCompleto) {
  const cardsTitle = document.querySelectorAll('#smallCards .cardsSm h1');
  let contConsultas = 0;
  let tempoConsultas = 0
  for (let i = 0; i < consultas.length; i++) {
    if (String(usuarioCompleto.id) == String(consultas[i].pacienteID)) {
      contConsultas += 1;
      tempoConsultas += consultas[i].duracao ?? 0;
    }
  }
  if (cardsTitle[0]) cardsTitle[0].textContent = contConsultas;
  if (cardsTitle[1]) cardsTitle[1].textContent = tempoConsultas;
  if (cardsTitle[2]) cardsTitle[2].textContent = usuarioCompleto.perfil.visitasPerfilMes;
  if (cardsTitle[3]) cardsTitle[3].textContent = usuarioCompleto.perfil.conexoes;
}

//att resumo sessoes
function atualizarResumoSessoes(usuarioCompleto, consultas, humor) {
  const textoHumor = document.getElementById('textResumo');
  let contFeliz = 0;
  let contTriste = 0;
  let contAnsioso = 0;
  let contRaiva = 0;
  for (let i = 0; i < usuarioCompleto.humorDiaMes.length; i++) {
    if (usuarioCompleto.humorDiaMes[i] == 1) {
      contFeliz += 1;
    }
    else if (usuarioCompleto.humorDiaMes[i] == 2) {
      contTriste += 1;
    }
    if (usuarioCompleto.humorDiaMes[i] == 3) {
      contAnsioso += 1;
    }
    if (usuarioCompleto.humorDiaMes[i] == 4) {
      contRaiva += 1;
    }
  }

}
function configurarBotoesEmocoes(usuarioCompleto) {
  const botoes = document.querySelectorAll('#btnEmocoes button');
  const barra = document.getElementById('barraProgresso');
  const label = document.getElementById('labelHumor');
  const texto = document.getElementById('textoHumor');

  if (!barra || !label || !texto) {
    console.error('Elemento não encontrado no HTML. Verifique os ids.');
    return;
  }

  const mapaHumor = {
    'Feliz':    { id: 1, cor: '#4caf50' },
    'Triste':   { id: 2, cor: '#5c9bd6' },
    'Ansioso':  { id: 3, cor: '#f0a500' },
    'Irritado': { id: 4, cor: '#e05252' },
    'Exausto':  { id: 5, cor: '#9e9e9e' },
  };

  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      botoes.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');

      const humor = mapaHumor[btn.textContent];
      const total = usuarioCompleto.humorDiaMes.length;
      const contagem = usuarioCompleto.humorDiaMes.filter(h => h === humor.id).length;
      const porcentagem = total > 0 ? Math.round((contagem / total) * 100) : 0;

      label.textContent = `Você demonstrou estar ${btn.textContent} ${contagem} dias esse mês`;
      barra.style.width = porcentagem + '%';
      barra.style.backgroundColor = humor.cor;
    });
  });

  botoes[0].click();
}

//att aval do paciente
function atualizarAvaliacoes(consultas, usuarios, usuarioCompleto) {
  const sectionAval = document.getElementById('cardsAval');

  for (let i = 0; i < consultas.length; i++) {
    if (usuarioCompleto.id == consultas[i].pacienteID) {

      const psicologo = usuarios.find(u => u.id == consultas[i].psicologoID);
      const nomePsi = psicologo ? psicologo.nome : 'Psicólogo';
      const avaliacao = consultas[i].avaliacao || 'Sem avaliação.';

      sectionAval.innerHTML += `
        <div class="cardsAvaliacao">
          <div class="avatar-circle avatarAval">${nomePsi[0]}</div>
          <div>
            <h1>${nomePsi}</h1>
            <p>${avaliacao}</p>
          </div>
        </div>
      `;
    }
  }
}

//proxima e ultm sessao
function renderizarSessao(cardId, consulta, usuarios) {
  const card = document.getElementById(cardId);
  const infoDiv = card.querySelector('.infoSessao');

  if (!consulta) {
    infoDiv.innerHTML = `<p>Nenhuma sessão encontrada.</p>`;
    return;
  }

  const psicologo = usuarios.find(u => u.id == consulta.psicologoID);
  const nomePsi = psicologo ? `${psicologo.nome} ${psicologo.sobrenome}` : 'Psicólogo';
  const inicial = nomePsi[0];

  const dataHora = new Date(consulta.data_hora);
  const data = dataHora.toLocaleDateString('pt-BR');
  const hora = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  infoDiv.innerHTML = `
    <div class="avatar-circle">${inicial}</div>
    <div>
      <h2>${nomePsi}</h2>
      <p>${data}</p>
      <p>${hora} — ${consulta.modalidade}</p>
    </div>
  `;
}

function atualizarSessoes(consultas, usuarios, usuarioCompleto) {
  const agora = new Date();
  const minhasConsultas = consultas.filter(c => usuarioCompleto.id == c.pacienteID);

  const proxima = minhasConsultas
    .filter(c => new Date(c.data_hora) > agora && (c.status === 'confirmado' || c.status === 'pendente'))
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))[0]; // a mais próxima

  const ultima = minhasConsultas
    .filter(c => new Date(c.data_hora) < agora && c.status === 'concluido')
    .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0]; // a mais recente

  renderizarSessao('sessaoNextCard', proxima, usuarios);
  renderizarSessao('sessaoLastCard', ultima, usuarios);
}
