const API_USUARIOS  = '/usuarios';
const API_CONSULTAS = '/consultas';
 
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
  const primeiroNome = nomeCompleto.split(' ')[0];
 
  // Saudação
  const titleH1 = document.querySelector('#titleSection h1');
  if (titleH1) titleH1.textContent = `Bem vindo, ${primeiroNome}!`;
 
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
  const btn     = document.getElementById('hamburgerBtn');
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
  ]).then(([resUsuarios, resConsultas]) => {
    const usuarios  = resUsuarios.status  === 'fulfilled' ? resUsuarios.value  : [];
    const consultas = resConsultas.status === 'fulfilled' ? resConsultas.value : [];
 
    // Encontra o objeto completo do usuário logado pelo id ou email
    const usuarioCompleto = usuarios.find(u =>
      u.id === session.id || u.contato?.email === session.email
    );
 
    atualizarSmallCards(usuarios, consultas, usuarioCompleto);
    atualizarResultadoConsultas(usuarioCompleto);
    atualizarAvaliacoes(consultas, usuarios, usuarioCompleto);
    atualizarSubtituloDashboard(consultas, usuarioCompleto);
    atualizarConquista(usuarios, usuarioCompleto);
    atualizarMeusPacientes(usuarios, usuarioCompleto);

    console.log('Usuários:', usuarios);
    console.log('Consultas:', consultas);
    console.log('Usuário completo:', usuarioCompleto);
    console.log('Session:', session);
  });
}

 
/* ═══════════════════════════════════════════
   SMALL CARDS
═══════════════════════════════════════════ */
function atualizarSmallCards(usuarios, consultas, usuarioCompleto) {
  const cards = document.querySelectorAll('#smallCards .cardsSm h1');
 
  // [0] Total de Pacientes — usuários do tipo 'paciente'
  const totalPacientes = usuarioCompleto?.pacientesId?.length ?? 0;
  if (cards[0]) cards[0].textContent = totalPacientes;

 
  // [1] Total de Horas Trabalhadas — soma de 'duracao' nas consultas do usuário logado
  let totalHoras = 0;
  if (usuarioCompleto?.consultasId) {
    const consultasDoUsuario = consultas.filter(c =>
      usuarioCompleto.consultasId.map(String).includes(String(c.id))
    );
    totalHoras = consultasDoUsuario.reduce((acc, c) => acc + (c.duracao || 0), 0);
  }
  if (cards[1]) cards[1].textContent = `${totalHoras}h`;
  
  // [2] Visitas no Perfil — sem API por enquanto
  const totalVisitas = usuarioCompleto?.perfil.visitasPerfilMes;
  if (cards[2]) cards[2].textContent = totalVisitas;
 
  // [3] Solicitações — sem API por enquanto
  const totalSolicitacoes = usuarioCompleto?.perfil.solicitacoes;  
  if (cards[3]) cards[3].textContent = totalSolicitacoes;
}
 
/* ═══════════════════════════════════════════
   RESULTADO DAS CONSULTAS
   Usa statusCasos do próprio objeto do usuário logado
═══════════════════════════════════════════ */
function atualizarResultadoConsultas(usuarioCompleto) {
  const status = usuarioCompleto?.statusCasos;
  const items  = document.querySelectorAll('#inRes .resultadosC h2');
 
  const resolvidos   = status?.resolvidos   ?? 0;
  const encaminhados = status?.encaminhados ?? 0;
  const andamento    = status?.andamento    ?? 0;
 
  if (items[0]) items[0].textContent = `${resolvidos} caso${resolvidos !== 1 ? 's' : ''} resolvido${resolvidos !== 1 ? 's' : ''}`;
  if (items[1]) items[1].textContent = `${encaminhados} caso${encaminhados !== 1 ? 's' : ''} encaminhado${encaminhados !== 1 ? 's' : ''}`;
  if (items[2]) items[2].textContent = `${andamento} caso${andamento !== 1 ? 's' : ''} em andamento`;
}
 
/* ═══════════════════════════════════════════
   AVALIAÇÕES
   Busca avaliações nas consultas do usuário logado
   e exibe nome do paciente + texto da avaliação
═══════════════════════════════════════════ */
function atualizarAvaliacoes(consultas, usuarios, usuarioCompleto) {
  const container = document.getElementById('cardsAval');
  if (!container) return;
 
  // Filtra consultas do usuário logado que tenham avaliação
  const consultasComAvaliacao = consultas.filter(c =>
    usuarioCompleto?.consultasId?.map(String).includes(String(c.id)) && c.avaliacao
  );
 
  if (consultasComAvaliacao.length === 0) {
    container.innerHTML = '<p style="color:#888">Nenhuma avaliação ainda.</p>';
    return;
  }
 
  container.innerHTML = consultasComAvaliacao.map(c => {
    const paciente = usuarios.find(u => String(u.id) === String(c.pacienteID));
    const nomePaciente = paciente
      ? `${paciente.nome} ${paciente.sobrenome || ''}`.trim()
      : 'Paciente';
    const iniciais = nomePaciente
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
 
    return `
      <div class="cardsAvaliacao">
        <div class="avatar-circle avatarAval">${iniciais}</div>
        <div>
          <h1>${nomePaciente}</h1>
          <p>${c.avaliacao}</p>
        </div>
      </div>`;
  }).join('');
}


/* ═══════════════════════════════════════════
   CONQUISTA DE PACIENTES
   Lê mesPsicologoId de cada paciente e conta
   quantos iniciaram com o usuário logado por mês
═══════════════════════════════════════════ */
function atualizarConquista(usuarios, usuarioCompleto) {
  const container = document.getElementById('inConq');
  if (!container || !usuarioCompleto) return;
 
  const MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];
 
  // Conta pacientes por mês para o usuário logado
  // mesPsicologoId é um objeto { "psicologoId": "NomeMes" }
  const contagemPorMes = {};
  MESES.forEach(m => contagemPorMes[m] = 0);
 
  usuarios.forEach(u => {
    if (u.tipoUsuario !== 'paciente' || !u.mesPsicologoId) return;
    const mes = u.mesPsicologoId[String(usuarioCompleto.id)];
    if (mes && contagemPorMes.hasOwnProperty(mes)) {
      contagemPorMes[mes]++;
    }
  });

  container.innerHTML = MESES.slice(0, 8).map(mes => {
    const qtd = contagemPorMes[mes];
    const classe = qtd > 0 ? 'conMes conPlus' : qtd < 0 ? 'conMes conMinus' : 'conMes';
    const label  = qtd > 0 ? `+${qtd} paciente${qtd !== 1 ? 's' : ''}`
                 : qtd < 0 ? `${qtd} paciente${Math.abs(qtd) !== 1 ? 's' : ''}`
                 : '0 pacientes';
    return `<div class="${classe}"><p>${mes}</p><h2>${label}</h2></div>`;
  }).join('');
}


 
/* ═══════════════════════════════════════════
   SUBTÍTULO DO DASHBOARD
═══════════════════════════════════════════ */
function atualizarSubtituloDashboard(consultas, usuarioCompleto) {
  const subtitulo = document.querySelector('#titleSection p');
  if (!subtitulo || !usuarioCompleto) return;
 
  const consultasDoUsuario = usuarioCompleto.consultasId
    ? consultas.filter(c => usuarioCompleto.consultasId.map(String).includes(String(c.id)))
    : [];
 
  const totalHoras     = consultasDoUsuario.reduce((acc, c) => acc + (c.duracao || 0), 0);
  const totalPacientes = usuarioCompleto.pacientesId?.length ?? 0;
 
  subtitulo.textContent =
    `Você trabalhou ${totalHoras}h e atende ${totalPacientes} paciente${totalPacientes !== 1 ? 's' : ''} no total.`;
}

/* ═══════════════════════════════════════════
   MEUS PACIENTES ATENDIDOS
═══════════════════════════════════════════ */
function atualizarMeusPacientes(usuarios, usuarioCompleto) {
  const container = document.getElementById('listaPacientes');
  if (!container) return;

  // Garante que o container comece vazio
  container.innerHTML = '';

  // Verifica se o psicólogo possui pacientes vinculados
  if (usuarioCompleto && Array.isArray(usuarioCompleto.pacientesId) && usuarioCompleto.pacientesId.length > 0) {
    
    container.innerHTML = usuarioCompleto.pacientesId.map(pacienteID => {
      // Procura o usuário correspondente ao ID (convertendo ambos para String)
      const paciente = usuarios.find(u => String(u.id) === String(pacienteID));
      
      if (!paciente) return '';

      const nomePaciente = `${paciente.nome} ${paciente.sobrenome || ''}`.trim();
      const emailPaciente = paciente.contato?.email || 'Sem e-mail cadastrado';
      
      // Gera as iniciais do nome do paciente para o avatar
      const iniciais = nomePaciente
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();

      return `
        <div class="cardsAvaliacao" style="margin-bottom: 2px;  padding-bottom: 8px; display: flex; align-items: center; gap: 12px;">
          <div class="avatar-circle avatarAval" style="width: 40px; height: 40px; font-size: 14px; flex-shrink: 0;">${iniciais}</div>
          <div>
            <h1 style="font-size: 20px; font-weight: 600; margin: 0; color: #333;">${nomePaciente}</h1>
            <p style="font-size: 12px; color: #777; margin: 2px 0 0 0;">${emailPaciente}</p>
          </div>
        </div>`;
    }).join('');

  } else {
    container.innerHTML = '<p style="color:#888; font-style: italic; font-size: 14px;">Nenhum paciente vinculado ao seu perfil ainda.</p>';
  }
}
