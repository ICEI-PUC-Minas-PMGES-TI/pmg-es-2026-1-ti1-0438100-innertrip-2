const psicologos = [
  {
    nome: "Dra. Ana Martins",
    especialidade: "Ansiedade e estresse",
    crp: "CRP 04/12345",
    atendimento: "Online e presencial",
    horario: "Segunda a sexta, 08h às 17h"
  },
  {
    nome: "Dr. Lucas Ferreira",
    especialidade: "Depressão e autoestima",
    crp: "CRP 04/67890",
    atendimento: "Online",
    horario: "Terça e quinta, 14h às 20h"
  },
  {
    nome: "Dra. Mariana Costa",
    especialidade: "Terapia para jovens e adultos",
    crp: "CRP 04/24680",
    atendimento: "Presencial",
    horario: "Segunda, quarta e sexta, 09h às 18h"
  },
  {
    nome: "Dr. Rafael Souza",
    especialidade: "Relacionamentos e conflitos familiares",
    crp: "CRP 04/13579",
    atendimento: "Online e presencial",
    horario: "Segunda a sábado, 10h às 19h"
  }
];

function mostrarPsicologos(lista) {
  const container = document.getElementById("listaPsicologos");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = '<p class="mensagem">Nenhum psicólogo encontrado.</p>';
    return;
  }

  lista.forEach(psicologo => {
    container.innerHTML += `
      <div class="card">
        <h3>${psicologo.nome}</h3>
        <p><strong>Especialidade:</strong> ${psicologo.especialidade}</p>
        <p><strong>CRP:</strong> ${psicologo.crp}</p>
        <p><strong>Atendimento:</strong> ${psicologo.atendimento}</p>
        <p><strong>Horário:</strong> ${psicologo.horario}</p>
        <button onclick="marcarConsulta('${psicologo.nome}')">Marcar consulta</button>
      </div>
    `;
  });
}

function buscarPsicologos() {
  const busca = document.getElementById("campoBusca").value.toLowerCase();

  const resultado = psicologos.filter(psicologo =>
    psicologo.nome.toLowerCase().includes(busca) ||
    psicologo.especialidade.toLowerCase().includes(busca)
  );

  mostrarPsicologos(resultado);
}

function marcarConsulta(nome) {
  alert("Você selecionou " + nome + " para marcar uma consulta.");
}

mostrarPsicologos(psicologos);
