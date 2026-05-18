// Máscara do CPF
document.getElementById("cpf").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  this.value = v;
});

// Máscara do telefone
document.getElementById("telefone").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{2})(\d)/, "($1) $2");
  v = v.replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  this.value = v;
});

// Botão Salvar
document.querySelector(".btn-save").addEventListener("click", function () {
  let nome = document.getElementById("nome").value.trim();
  let cpf = document.getElementById("cpf").value.trim();
  let email = document.getElementById("email").value.trim();
  let nascimento = document.getElementById("nascimento").value;
  let telefone = document.getElementById("telefone").value.trim();
  let genero = document.getElementById("genero").value;

  // Validação básica
  if (nome === "") {
    alert("Por favor, informe o nome completo.");
    return;
  }
  if (nascimento === "") {
    alert("Por favor, informe a data de nascimento.");
    return;
  }
  if (cpf.length < 14) {
    alert("Por favor, informe um CPF válido.");
    return;
  }
  if (email === "" || !email.includes("@")) {
    alert("Por favor, informe um e-mail válido.");
    return;
  }
  if (telefone.length < 14) {
    alert("Por favor, informe um telefone válido.");
    return;
  }
  if (genero === "") {
    alert("Por favor, selecione o gênero.");
    return;
  }

  // Monta o objeto do paciente
  let paciente = {
    nome: nome,
    nascimento: nascimento,
    cpf: cpf,
    email: email,
    telefone: telefone,
    genero: genero,
    endereco: document.getElementById("endereco").value.trim(),
    status: document.querySelector('input[name="status"]:checked').value,
    observacoes: document.getElementById("obs").value.trim()
  };

  // Salva no localStorage
  let lista = JSON.parse(localStorage.getItem("pacientes")) || [];
  lista.push(paciente);
  localStorage.setItem("pacientes", JSON.stringify(lista));

  alert("Paciente " + paciente.nome + " cadastrado com sucesso!");

  // Limpa o formulário
  document.getElementById("nome").value = "";
  document.getElementById("nascimento").value = "";
  document.getElementById("cpf").value = "";
  document.getElementById("email").value = "";
  document.getElementById("telefone").value = "";
  document.getElementById("genero").selectedIndex = 0;
  document.getElementById("endereco").value = "";
  document.getElementById("obs").value = "";
  document.querySelector('input[name="status"][value="ativo"]').checked = true;
});

// Botão Cancelar
document.querySelector(".btn-cancel").addEventListener("click", function () {
  let confirmar = confirm("Deseja limpar o formulário?");
  if (confirmar) {
    document.getElementById("nome").value = "";
    document.getElementById("nascimento").value = "";
    document.getElementById("cpf").value = "";
    document.getElementById("email").value = "";
    document.getElementById("telefone").value = "";
    document.getElementById("genero").selectedIndex = 0;
    document.getElementById("endereco").value = "";
    document.getElementById("obs").value = "";
    document.querySelector('input[name="status"][value="ativo"]').checked = true;
  }
});