// ══════════════════════════════════════════════════════════════
//  PSYCHE – Módulo de Cadastro (Paciente & Psicólogo/Estagiário)
//  Integra com JSON Server via API REST em /usuarios
// ══════════════════════════════════════════════════════════════

const API_URL = '/usuarios';

// ─────────────────────────────────────────
//  ABAS
// ─────────────────────────────────────────
function switchTab(tipo) {
  const tabPac  = document.getElementById('tab-paciente');
  const tabPsi  = document.getElementById('tab-psicologo');
  const formPac = document.getElementById('form-paciente');
  const formPsi = document.getElementById('form-psicologo');

  if (tipo === 'paciente') {
    tabPac.classList.add('active');
    tabPsi.classList.remove('active');
    tabPac.setAttribute('aria-selected', 'true');
    tabPsi.setAttribute('aria-selected', 'false');
    formPac.classList.remove('hidden');
    formPsi.classList.add('hidden');
  } else {
    tabPsi.classList.add('active');
    tabPac.classList.remove('active');
    tabPsi.setAttribute('aria-selected', 'true');
    tabPac.setAttribute('aria-selected', 'false');
    formPsi.classList.remove('hidden');
    formPac.classList.add('hidden');
  }
  // limpa erros ao trocar de aba
  clearErrors(tipo === 'paciente' ? 'pac' : 'psi');
}

// ─────────────────────────────────────────
//  TOGGLE SENHA (olho)
// ─────────────────────────────────────────
function toggleSenha(inputId, btn) {
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';

  // troca ícone
  btn.innerHTML = isText
    ? `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>`
    : `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.93 2.93L17.07 17.07M10 4C5 4 1.73 8 1 10c.45 1.77 1.7 3.56 3.43 4.93M7.53 7.53A3 3 0 0 0 10 13a3 3 0 0 0 2.47-1.47M10 4c5 0 8.27 4 9 6a10.06 10.06 0 0 1-2.09 3.41"/></svg>`;
}

// ─────────────────────────────────────────
//  MÁSCARAS
// ─────────────────────────────────────────
function maskCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
  input.value = v;
}

function maskCEP(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 8);
  if (v.length > 5) v = v.replace(/(\d{5})(\d+)/, '$1-$2');
  input.value = v;
}

function maskTelefone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10)     v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/, '($1) $2');
  input.value = v;
}

// ─────────────────────────────────────────
//  CRP condicional (psicólogo vs estagiário)
// ─────────────────────────────────────────
function toggleCRP() {
  const tipo     = document.getElementById('psi-tipo').value;
  const groupCRP = document.getElementById('group-crp');
  const reqCRP   = document.getElementById('req-crp');
  const inputCRP = document.getElementById('psi-crp');

  if (tipo === 'psicologo') {
    groupCRP.style.opacity = '1';
    inputCRP.required = true;
    reqCRP.style.display = 'inline';
  } else {
    groupCRP.style.opacity = '0.5';
    inputCRP.required = false;
    inputCRP.value = '';
    reqCRP.style.display = 'none';
    clearFieldError('psi-crp');
  }
}

// ─────────────────────────────────────────
//  VALIDAÇÃO
// ─────────────────────────────────────────
function setError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const err   = document.getElementById('err-' + fieldId);
  if (input) input.classList.add('invalid');
  if (err)   err.textContent = msg;
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const err   = document.getElementById('err-' + fieldId);
  if (input) input.classList.remove('invalid');
  if (err)   err.textContent = '';
}

function clearErrors(prefix) {
  document.querySelectorAll(`[id^="err-${prefix}-"]`).forEach(el => el.textContent = '');
  document.querySelectorAll(`[id^="${prefix}-"]`).forEach(el => el.classList.remove('invalid'));
}

function validarCPF(cpf) {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(nums[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(nums[10]);
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCEP(cep) {
  return /^\d{5}-\d{3}$/.test(cep);
}

function validarCRP(crp) {
  return /^\d{2}\/\d{5,}$/.test(crp);
}

// Valida formulário de paciente; retorna true se tudo ok
function validarPaciente() {
  clearErrors('pac');
  let ok = true;

  const nome       = document.getElementById('pac-nome').value.trim();
  const sobrenome  = document.getElementById('pac-sobrenome').value.trim();
  const cpf        = document.getElementById('pac-cpf').value.trim();
  const nasc       = document.getElementById('pac-nascimento').value;
  const logradouro = document.getElementById('pac-logradouro').value.trim();
  const tipo       = document.getElementById('pac-tipo').value;
  const cep        = document.getElementById('pac-cep').value.trim();
  const email      = document.getElementById('pac-email').value.trim();
  const telefone   = document.getElementById('pac-telefone').value.trim();
  const login      = document.getElementById('pac-login').value.trim();
  const senha      = document.getElementById('pac-senha').value;
  const confirma   = document.getElementById('pac-confirma').value;

  if (!nome)             { setError('pac-nome', 'Nome é obrigatório.'); ok = false; }
  if (!sobrenome)        { setError('pac-sobrenome', 'Sobrenome é obrigatório.'); ok = false; }
  if (!cpf)              { setError('pac-cpf', 'CPF é obrigatório.'); ok = false; }
  else if (!validarCPF(cpf)) { setError('pac-cpf', 'CPF inválido.'); ok = false; }
  if (!nasc)             { setError('pac-nascimento', 'Data de nascimento é obrigatória.'); ok = false; }
  else {
    const idade = calcularIdade(nasc);
    if (idade < 0 || idade > 120) { setError('pac-nascimento', 'Data inválida.'); ok = false; }
  }
  if (!logradouro)       { setError('pac-logradouro', 'Logradouro é obrigatório.'); ok = false; }
  if (!tipo)             { setError('pac-tipo', 'Selecione o tipo.'); ok = false; }
  if (!cep)              { setError('pac-cep', 'CEP é obrigatório.'); ok = false; }
  else if (!validarCEP(cep)) { setError('pac-cep', 'CEP inválido (00000-000).'); ok = false; }
  if (!email)            { setError('pac-email', 'E-mail é obrigatório.'); ok = false; }
  else if (!validarEmail(email)) { setError('pac-email', 'E-mail inválido.'); ok = false; }
  if (!telefone || telefone.replace(/\D/g,'').length < 10) {
    setError('pac-telefone', 'Telefone inválido.'); ok = false;
  }
  if (!login)            { setError('pac-login', 'Login é obrigatório.'); ok = false; }
  else if (login.length < 3) { setError('pac-login', 'Login deve ter ao menos 3 caracteres.'); ok = false; }
  if (!senha)            { setError('pac-senha', 'Senha é obrigatória.'); ok = false; }
  else if (senha.length < 6) { setError('pac-senha', 'Mínimo de 6 caracteres.'); ok = false; }
  if (senha !== confirma) { setError('pac-confirma', 'As senhas não coincidem.'); ok = false; }

  return ok;
}

// Valida formulário de psicólogo
function validarPsicologo() {
  clearErrors('psi');
  let ok = true;

  const nome       = document.getElementById('psi-nome').value.trim();
  const sobrenome  = document.getElementById('psi-sobrenome').value.trim();
  const cpf        = document.getElementById('psi-cpf').value.trim();
  const nasc       = document.getElementById('psi-nascimento').value;
  const tipoPsi    = document.getElementById('psi-tipo').value;
  const crp        = document.getElementById('psi-crp').value.trim();
  const logradouro = document.getElementById('psi-logradouro').value.trim();
  const tipoEnd    = document.getElementById('psi-tipo-end').value;
  const cep        = document.getElementById('psi-cep').value.trim();
  const email      = document.getElementById('psi-email').value.trim();
  const telefone   = document.getElementById('psi-telefone').value.trim();
  const login      = document.getElementById('psi-login').value.trim();
  const senha      = document.getElementById('psi-senha').value;
  const confirma   = document.getElementById('psi-confirma').value;

  if (!nome)             { setError('psi-nome', 'Nome é obrigatório.'); ok = false; }
  if (!sobrenome)        { setError('psi-sobrenome', 'Sobrenome é obrigatório.'); ok = false; }
  if (!cpf)              { setError('psi-cpf', 'CPF é obrigatório.'); ok = false; }
  else if (!validarCPF(cpf)) { setError('psi-cpf', 'CPF inválido.'); ok = false; }
  if (!nasc)             { setError('psi-nascimento', 'Data de nascimento é obrigatória.'); ok = false; }
  else {
    const idade = calcularIdade(nasc);
    if (idade < 0 || idade > 120) { setError('psi-nascimento', 'Data inválida.'); ok = false; }
  }
  if (!tipoPsi)          { setError('psi-tipo', 'Selecione o tipo.'); ok = false; }
  if (tipoPsi === 'psicologo') {
    if (!crp)            { setError('psi-crp', 'CRP é obrigatório para psicólogos.'); ok = false; }
    else if (!validarCRP(crp)) { setError('psi-crp', 'CRP inválido (ex: 06/12345).'); ok = false; }
  }
  if (!logradouro)       { setError('psi-logradouro', 'Logradouro é obrigatório.'); ok = false; }
  if (!tipoEnd)          { setError('psi-tipo-end', 'Selecione o tipo.'); ok = false; }
  if (!cep)              { setError('psi-cep', 'CEP é obrigatório.'); ok = false; }
  else if (!validarCEP(cep)) { setError('psi-cep', 'CEP inválido (00000-000).'); ok = false; }
  if (!email)            { setError('psi-email', 'E-mail é obrigatório.'); ok = false; }
  else if (!validarEmail(email)) { setError('psi-email', 'E-mail inválido.'); ok = false; }
  if (!telefone || telefone.replace(/\D/g,'').length < 10) {
    setError('psi-telefone', 'Telefone inválido.'); ok = false;
  }
  if (!login)            { setError('psi-login', 'Login é obrigatório.'); ok = false; }
  else if (login.length < 3) { setError('psi-login', 'Login deve ter ao menos 3 caracteres.'); ok = false; }
  if (!senha)            { setError('psi-senha', 'Senha é obrigatória.'); ok = false; }
  else if (senha.length < 6) { setError('psi-senha', 'Mínimo de 6 caracteres.'); ok = false; }
  if (senha !== confirma) { setError('psi-confirma', 'As senhas não coincidem.'); ok = false; }

  return ok;
}

function calcularIdade(dataStr) {
  const hoje = new Date();
  const nasc = new Date(dataStr);
  return hoje.getFullYear() - nasc.getFullYear();
}

// ─────────────────────────────────────────
//  VERIFICAR LOGIN DUPLICADO
// ─────────────────────────────────────────
async function loginExiste(login) {
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    return data.some(u => u.login.toLowerCase() === login.toLowerCase());
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────
//  MONTAR OBJETOS DE USUÁRIO
// ─────────────────────────────────────────
function montarPaciente() {
  return {
    login:      document.getElementById('pac-login').value.trim(),
    senha:      document.getElementById('pac-senha').value,
    tipoUsuario: 'paciente',
    nome:       document.getElementById('pac-nome').value.trim(),
    sobrenome:  document.getElementById('pac-sobrenome').value.trim(),
    nascimento: document.getElementById('pac-nascimento').value,
    cpf:        document.getElementById('pac-cpf').value.trim(),
    enderecoResidencial: {
      logradouro:    document.getElementById('pac-logradouro').value.trim(),
      tipoLogradouro: document.getElementById('pac-tipo').value,
      cep:           document.getElementById('pac-cep').value.trim()
    },
    contato: {
      email:     document.getElementById('pac-email').value.trim(),
      telefone:  document.getElementById('pac-telefone').value.trim(),
      instagran: document.getElementById('pac-instagram').value.trim(),
      linkedin:  document.getElementById('pac-linkedin').value.trim()
    },
    id_quadro: document.getElementById('pac-quadro').value || null
  };
}

function montarPsicologo() {
  const tipoPsi = document.getElementById('psi-tipo').value;
  return {
    login:      document.getElementById('psi-login').value.trim(),
    senha:      document.getElementById('psi-senha').value,
    tipoUsuario: tipoPsi,
    nome:       document.getElementById('psi-nome').value.trim(),
    sobrenome:  document.getElementById('psi-sobrenome').value.trim(),
    nascimento: document.getElementById('psi-nascimento').value,
    cpf:        document.getElementById('psi-cpf').value.trim(),
    crp:        tipoPsi === 'psicologo' ? document.getElementById('psi-crp').value.trim() : '',
    enderecoResidencial: {
      logradouro:    document.getElementById('psi-logradouro').value.trim(),
      tipoLogradouro: document.getElementById('psi-tipo-end').value,
      cep:           document.getElementById('psi-cep').value.trim()
    },
    contato: {
      email:     document.getElementById('psi-email').value.trim(),
      telefone:  document.getElementById('psi-telefone').value.trim(),
      instagran: document.getElementById('psi-instagram').value.trim(),
      linkedin:  document.getElementById('psi-linkedin').value.trim()
    },
    id_especializacao: document.getElementById('psi-especializacao').value || null
  };
}

// ─────────────────────────────────────────
//  SUBMIT
// ─────────────────────────────────────────
async function submitForm(event, tipo) {
  event.preventDefault();

  const isPaciente = tipo === 'paciente';
  const valido = isPaciente ? validarPaciente() : validarPsicologo();
  if (!valido) {
    // scroll para o primeiro erro
    const primeiroErro = document.querySelector('.field-error:not(:empty)');
    if (primeiroErro) primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const loginVal = document.getElementById(isPaciente ? 'pac-login' : 'psi-login').value.trim();
  const btnId    = isPaciente ? 'btn-submit-pac' : 'btn-submit-psi';
  const btn      = document.getElementById(btnId);

  // Verifica login duplicado
  const duplicado = await loginExiste(loginVal);
  if (duplicado) {
    setError(isPaciente ? 'pac-login' : 'psi-login', 'Este login já está em uso.');
    return;
  }

  // Desabilita botão durante envio
  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  const usuario = isPaciente ? montarPaciente() : montarPsicologo();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast('Conta criada com sucesso! Redirecionando...', 'success');

    // Redireciona para login após 2s
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 2000);

  } catch (err) {
    console.error('Erro ao cadastrar:', err);
    showToast('Erro ao criar conta. Verifique se o servidor está rodando.', 'error');
    btn.disabled = false;
    btn.textContent = isPaciente ? 'Criar conta como Paciente' : 'Criar conta como Psicólogo';
  }
}

// ─────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────
let toastTimer = null;

function showToast(msg, tipo = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className   = 'toast show ' + tipo;

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// ─────────────────────────────────────────
//  LIMPAR ERROS AO DIGITAR
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
    el.addEventListener('input',  () => clearFieldError(el.id));
    el.addEventListener('change', () => clearFieldError(el.id));
  });
});
