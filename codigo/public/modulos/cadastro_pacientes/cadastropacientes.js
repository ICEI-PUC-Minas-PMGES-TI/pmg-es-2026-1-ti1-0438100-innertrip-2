const API_USUARIOS = '/usuarios';

// Máscara do CPF
document.getElementById('cpf').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  this.value = v;
});

// Máscara do telefone
document.getElementById('telefone').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{2})(\d)/, '($1) $2');
  v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  this.value = v;
});

// helpers
function limparFormulario() {
  ['nome', 'nascimento', 'cpf', 'email', 'telefone', 'endereco', 'obs']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('genero').selectedIndex = 0;
  document.querySelector('input[name="status"][value="ativo"]').checked = true;
}
 
function mostrarFeedback(msg, erro = false) {
  // Tenta usar um toast se existir, senão usa alert
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.style.background = erro ? '#ff5555' : '#FFD60A';
    toast.style.color = erro ? '#fff' : '#121212';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  } else {
    alert(msg);
  }
}


// Botão Salvar
document.querySelector('.btn-save').addEventListener('click', function () {
  // Coleta valores
  const nome       = document.getElementById('nome').value.trim();
  const nascimento = document.getElementById('nascimento').value;
  const cpf        = document.getElementById('cpf').value.trim();
  const email      = document.getElementById('email').value.trim();
  const telefone   = document.getElementById('telefone').value.trim();
  const genero     = document.getElementById('genero').value;
  const endereco   = document.getElementById('endereco').value.trim();
  const status     = document.querySelector('input[name="status"]:checked').value;
  const obs        = document.getElementById('obs').value.trim();
 
  // Validações
  if (!nome)              return mostrarFeedback('Informe o nome completo.', true);
  if (!nascimento)        return mostrarFeedback('Informe a data de nascimento.', true);
  if (cpf.length < 14)   return mostrarFeedback('Informe um CPF válido.', true);
  if (!email.includes('@')) return mostrarFeedback('Informe um e-mail válido.', true);
  if (telefone.length < 14) return mostrarFeedback('Informe um telefone válido.', true);
  if (!genero)            return mostrarFeedback('Selecione o gênero.', true);


  // Monta o objeto do paciente
  const paciente = {
    tipoUsuario: 'paciente',
    nome: nome,
    sobrenome: '',           // pode ser separado futuramente
    login: nome.toLowerCase().replace(/\s+/g, '.'),
    senha: cpf.replace(/\D/g, '').slice(0, 6), // senha inicial = 6 primeiros dígitos do CPF
    nascimento: nascimento,
    cpf: cpf,
    genero: genero,
    status: status,
    observacoes: obs,
    enderecoResidencial: {
      logradouro: endereco,
      tipoLogradouro: '',
      cep: ''
    },
    contato: {
      email: email,
      telefone: telefone,
      telefoneEmergencia: '',
      instagram: '',
      linkedin: ''
    },
    perfil: {
      visitasPerfilMes: 0,
      conexoes: 0,
      solicitacoes: 0,
      biografia: ''
    },
    humorDiaMes: [],
    consultasId: [],
    id_quadro: '2'           // 'geral' por padrão
  };


  // Desabilita botão para evitar duplo clique
  const btnSave = document.querySelector('.btn-save');
  btnSave.disabled = true;
  btnSave.textContent = 'Salvando...';
 
  fetch(API_USUARIOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paciente)
  })
    .then(r => {
      if (!r.ok) throw new Error('Resposta do servidor: ' + r.status);
      return r.json();
    })
    .then(data => {
      mostrarFeedback(`Paciente ${data.nome} cadastrado com sucesso! (ID: ${data.id})`);
      limparFormulario();
    })
    .catch(err => {
      console.error('[PSYCHE] Erro ao cadastrar paciente:', err);
      mostrarFeedback('Erro ao salvar. Verifique se o servidor está rodando (npm start).', true);
    })
    .finally(() => {
      btnSave.disabled = false;
      btnSave.textContent = 'Salvar';
    });
});


// Botão Cancelar
document.querySelector('.btn-cancel').addEventListener('click', function () {
  if (confirm('Deseja limpar o formulário?')) limparFormulario();
});
