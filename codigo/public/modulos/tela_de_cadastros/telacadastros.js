// carrega os dados do usuario quando a pagina abre
window.onload = function () {
  carregarDados();
};

// pega os dados do json e coloca nos campos
function carregarDados() {
  fetch("usuario.json")
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (dados) {
      document.querySelector('input[type="text"]').value = dados.nome;
      document.querySelector('input[type="email"]').value = dados.email;
      document.querySelector("textarea").value = dados.bio;

      // coloca o nome na sidebar e no avatar tambem
      document.querySelector(".sidebar-footer strong").textContent = dados.nome;
      document.querySelector(".sidebar-footer span").textContent = dados.tipo;
    })
    .catch(function (erro) {
      console.log("Erro ao carregar os dados:", erro);
    });
}

// funcao do botao trocar senha
document.addEventListener("DOMContentLoaded", function () {
  var btnTrocarSenha = document.querySelector(".btn-change");
  var inputSenha = document.querySelector('input[type="password"]');

  btnTrocarSenha.addEventListener("click", function () {
    var senhaDigitada = inputSenha.value;

    // verifica se o campo nao ta vazio
    if (senhaDigitada === "" || senhaDigitada === "****************") {
      alert("Por favor, digite uma senha nova.");
      return;
    }

    // aqui seria onde salvaria no banco, mas por enquanto so mostra mensagem
    alert("Senha trocada com sucesso!");
    inputSenha.value = "";
  });

  // botao de deletar conta
  var btnDeletar = document.querySelector(".btn-danger");

  btnDeletar.addEventListener("click", function () {
    // pede confirmacao antes de deletar
    var confirmacao = confirm(
      "Tem certeza que quer deletar sua conta? Essa ação não tem como ser desfeita!"
    );

    if (confirmacao) {
      alert("Conta deletada. Redirecionando...");
      // em producao redirecionaria para a pagina de logout
      // window.location.href = "index.html";
    }
  });

  // botao de fazer upload de foto
  var btnUpload = document.querySelector(".btn-upload");

  btnUpload.addEventListener("click", function () {
    // cria um input de arquivo escondido e clica nele
    var inputArquivo = document.createElement("input");
    inputArquivo.type = "file";
    inputArquivo.accept = "image/*";

    inputArquivo.addEventListener("change", function () {
      var arquivo = inputArquivo.files[0];

      if (arquivo) {
        var leitor = new FileReader();

        leitor.onload = function (e) {
          // coloca a foto no circulo de perfil
          var circulo = document.querySelector(".photo-circle");
          circulo.style.backgroundImage = "url(" + e.target.result + ")";
          circulo.style.backgroundSize = "cover";
          circulo.style.backgroundPosition = "center";
        };

        leitor.readAsDataURL(arquivo);
        alert("Foto de perfil atualizada!");
      }
    });

    inputArquivo.click();
  });

  // botao de excluir foto
  var btnExcluirFoto = document.querySelector(".btn-delete");

  btnExcluirFoto.addEventListener("click", function () {
    var circulo = document.querySelector(".photo-circle");
    circulo.style.backgroundImage = "";
    alert("Foto removida.");
  });
});