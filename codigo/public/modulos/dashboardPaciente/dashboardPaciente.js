/**
 * PSYCHE — Dashboard Psicologo
 * Autor: Vitor Augusto de Souza
 *
 * Funcionalidades:
 *  - Exibe nome e iniciais do usuário logado
 *  - Carrega estatísticas via API REST (JSON Server)
 *  - Exibe avaliações das consultas do usuário logado
 */
 
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

    console.log('Usuários:', usuarios);
    console.log('Consultas:', consultas);
    console.log('Usuário completo:', usuarioCompleto);
    console.log('Session:', session);
  });
}
