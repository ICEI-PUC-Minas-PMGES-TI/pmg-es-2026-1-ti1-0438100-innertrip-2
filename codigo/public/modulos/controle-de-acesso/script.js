const formCadastro = document.getElementById('formCadastro');
const mensagem = document.getElementById('mensagem');
const botaoEntrar = document.getElementById('btnEntrar');

const textos = {
  sucesso: 'Cadastro realizado com sucesso!',
  erroCampos: 'Preencha todos os campos.',
  erroEmail: 'Digite um e-mail válido.',
  login: 'Área de login ainda não configurada.'
};

formCadastro.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const usuario = {
    nome: document.getElementById('nome').value.trim(),
    email: document.getElementById('email').value.trim(),
    senha: document.getElementById('senha').value.trim()
  };

  if (!usuario.nome || !usuario.email || !usuario.senha) {
    mostrarMensagem(textos.erroCampos);
    return;
  }

  if (!usuario.email.includes('@')) {
    mostrarMensagem(textos.erroEmail);
    return;
  }

  localStorage.setItem('usuarioPsyche', JSON.stringify(usuario));
  mostrarMensagem(textos.sucesso);
  formCadastro.reset();
});

botaoEntrar.addEventListener('click', function () {
  mostrarMensagem(textos.login);
});

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.style.color = '#111111';
}
