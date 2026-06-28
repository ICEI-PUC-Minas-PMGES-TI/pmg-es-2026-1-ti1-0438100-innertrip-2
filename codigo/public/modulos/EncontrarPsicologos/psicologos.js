const API_USUARIOS = '/usuarios';
 
let todosPsicologos = [];
 
document.addEventListener('DOMContentLoaded', () => {
  carregarPsicologos();
 
  // Busca ao pressionar Enter no campo
  document.getElementById('campoBusca').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarPsicologos();
  });
});
 
function carregarPsicologos() {
  const container = document.getElementById('listaPsicologos');
  container.innerHTML = '<p class="mensagem">Carregando profissionais...</p>';
 
  Promise.all([
    fetch(`${API_USUARIOS}?tipoUsuario=psicologo`).then(r => r.json()),
    fetch(`${API_USUARIOS}?tipoUsuario=estudante`).then(r => r.json()),
  ])
  .then(([psicologos, estudantes]) => {
    todosPsicologos = [...psicologos, ...estudantes];
    mostrarPsicologos(todosPsicologos);
  })
  .catch(err => {
    console.error('[PSYCHE] Erro ao carregar profissionais:', err);
    container.innerHTML = '<p class="mensagem">Erro ao carregar. Verifique se o servidor está rodando (npm start).</p>';
  });
}
 
function mostrarPsicologos(lista) {
  const container = document.getElementById('listaPsicologos');
 
  if (lista.length === 0) {
    container.innerHTML = '<p class="mensagem">Nenhum psicólogo encontrado.</p>';
    return;
  }
 
  container.innerHTML = lista.map(p => {
    const nomeCompleto  = `${p.nome || ''} ${p.sobrenome || ''}`.trim();
    const crp           = p.crp || 'CRP não informado';
    const horario       = p.perfil?.horarioAtivo || 'Não informado';
    const email         = p.contato?.email || '';
    const telefone      = p.contato?.telefone || '';
    const instagram     = p.contato?.instagran || p.contato?.instagram || '';
    const conexoes      = p.perfil?.conexoes ?? 0;
    const solicitacoes  = p.perfil?.solicitacoes ?? 0;
 
    // Especialização: busca pelo id_especializacao se disponível
    const especializacao = getEspecializacao(p.id_especializacao);
 
    // Iniciais para o avatar
    const iniciais = nomeCompleto
      .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
 
    return `
      <div class="card">
        <div class="card-header">
          <div class="avatar-circle">${iniciais}</div>
          <div>
            <h3>${nomeCompleto}</h3>
            <span class="crp-badge">${crp}</span>
            ${p.tipoUsuario === 'estudante' ? '<span class="crp-badge" style="background:#121212;color:#FFD60A;margin-left:6px">Estagiário</span>' : ''}
          </div>
        </div>
 
        <div class="card-body">
          <p><strong>Especialidade:</strong> ${especializacao}</p>
          <p><strong>Horário:</strong> ${horario}</p>
          ${email    ? `<p><strong>Email:</strong> ${email}</p>` : ''}
          ${telefone ? `<p><strong>Telefone:</strong> ${telefone}</p>` : ''}
          ${instagram ? `<p><strong>Instagram:</strong> ${instagram}</p>` : ''}
        </div>
 
        <div class="card-stats">
          <span>${conexoes} conexões</span>
          <span>${solicitacoes} solicitações</span>
        </div>
 
        <div class="card-footer">
          <button class="btn-consulta" onclick="marcarConsulta(${p.id}, '${nomeCompleto}')">
            Marcar consulta
          </button>
        </div>
      </div>
    `;
  }).join('');
}
 
const ESPECIALIZACOES = {
  1: 'Escolar',
  2: 'Geral',
  3: 'Emocional',
  4: 'Infanto-juvenil'
};
 
function getEspecializacao(id) {
  return ESPECIALIZACOES[id] || 'Geral';
}
 
function buscarPsicologos() {
  const termo = document.getElementById('campoBusca').value.toLowerCase().trim();
 
  if (!termo) {
    mostrarPsicologos(todosPsicologos);
    return;
  }
 
  const resultado = todosPsicologos.filter(p => {
    const nome = `${p.nome || ''} ${p.sobrenome || ''}`.toLowerCase();
    const esp  = getEspecializacao(p.id_especializacao).toLowerCase();
    return nome.includes(termo) || esp.includes(termo);
  });
 
  mostrarPsicologos(resultado);
}
 
function marcarConsulta(psicologoId, nomePsicologo) {
  const usuario = sessionStorage.getItem('usuarioCorrente');
  if (!usuario) {
    window.location.href = '/modulos/login/login.html';
    return;
  }
 
  // Redireciona para consultas passando o id do psicólogo
  window.location.href = `/modulos/consultas/index.html?psicologoId=${psicologoId}`;
}
