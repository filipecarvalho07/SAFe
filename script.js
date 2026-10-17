
const initialFeatures = [
  { id: 1, name: "Login de usuários", team: "Equipe A", priority: "Alta", dependency: "Nenhuma", status: "Concluído" },
  { id: 2, name: "Recuperação de senha", team: "Equipe A", priority: "Média", dependency: "Login de usuários", status: "Concluído" },
  { id: 3, name: "Painel de relatórios", team: "Equipe B", priority: "Alta", dependency: "Login de usuários", status: "Em andamento" },
  { id: 4, name: "Filtros de relatórios", team: "Equipe B", priority: "Média", dependency: "Painel de relatórios", status: "Em andamento" },
  { id: 5, name: "Integração com API", team: "Equipe C", priority: "Alta", dependency: "Login de usuários", status: "Pendente" },
  { id: 6, name: "Exportação de dados", team: "Equipe C", priority: "Baixa", dependency: "Integração com API", status: "Pendente" }
];

let features = initialFeatures.map(feature => ({ ...feature }));
let nextId = Math.max(...features.map(feature => feature.id)) + 1;
let toastTimeout;

const tableBody = document.querySelector("#featureTableBody");
const statusFilter = document.querySelector("#statusFilter");
const dialog = document.querySelector("#featureDialog");
const featureForm = document.querySelector("#featureForm");
const toast = document.querySelector("#toast");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getStatusClass(status) {
  if (status === "Concluído") return "status-done";
  if (status === "Em andamento") return "status-progress";
  return "status-pending";
}

function getPriorityClass(priority) {
  if (priority === "Alta") return "priority-high";
  if (priority === "Média") return "priority-medium";
  return "priority-low";
}

function getTeamClass(team) {
  if (team === "Equipe B") return "team-b";
  if (team === "Equipe C") return "team-c";
  return "";
}

function renderFeatures() {
  const selectedStatus = statusFilter.value;

  const visibleFeatures = features.filter(feature =>
    selectedStatus === "all" || feature.status === selectedStatus
  );

  if (visibleFeatures.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhuma funcionalidade encontrada para este filtro.
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = visibleFeatures.map(feature => `
      <tr>
        <td>
          <span class="feature-name">${escapeHtml(feature.name)}</span>
          <span class="feature-id">F-${String(feature.id).padStart(3, "0")}</span>
        </td>
        <td>
          <span class="team-label">
            <span class="team-dot ${getTeamClass(feature.team)}"></span>
            ${escapeHtml(feature.team)}
          </span>
        </td>
        <td>
          <span class="priority ${getPriorityClass(feature.priority)}">
            ${escapeHtml(feature.priority)}
          </span>
        </td>
        <td>${escapeHtml(feature.dependency || "Nenhuma")}</td>
        <td>
          <select
            class="status-select ${getStatusClass(feature.status)}"
            data-status-id="${feature.id}"
            aria-label="Status de ${escapeHtml(feature.name)}"
          >
            ${["Pendente", "Em andamento", "Concluído"].map(status =>
              `<option${feature.status === status ? " selected" : ""}>${status}</option>`
            ).join("")}
          </select>
        </td>
        <td>
          <button
            type="button"
            class="remove-button"
            data-remove-id="${feature.id}"
            aria-label="Remover ${escapeHtml(feature.name)}"
          >Remover</button>
        </td>
      </tr>
    `).join("");
  }

  updateSummary();
}

function updateSummary() {
  const total = features.length;
  const done = features.filter(feature => feature.status === "Concluído").length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const teams = new Set(features.map(feature => feature.team)).size;

  const dependencies = features.filter(feature =>
    feature.dependency.trim() !== "" &&
    feature.dependency.toLowerCase() !== "nenhuma"
  ).length;

  document.querySelector("#teamCount").textContent = teams;
  document.querySelector("#featureCount").textContent = total;
  document.querySelector("#doneCount").textContent = done;
  document.querySelector("#dependencyCount").textContent = dependencies;
  document.querySelector("#progressText").textContent = `${percent}%`;
  document.querySelector("#progressBar").style.width = `${percent}%`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");

  window.clearTimeout(toastTimeout);

  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
}

document.querySelector("#addFeatureBtn").addEventListener("click", () => {
  featureForm.reset();
  dialog.showModal();
  document.querySelector("#featureName").focus();
});

function closeDialog() {
  dialog.close();
}

document.querySelector("#closeDialogBtn").addEventListener("click", closeDialog);
document.querySelector("#cancelDialogBtn").addEventListener("click", closeDialog);

dialog.addEventListener("click", event => {
  if (event.target === dialog) closeDialog();
});

featureForm.addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(featureForm);
  const name = String(formData.get("featureName") || "").trim();

  if (!name) {
    showToast("Digite o nome da funcionalidade.");
    return;
  }

  features.push({
    id: nextId++,
    name,
    team: String(formData.get("featureTeam")),
    priority: String(formData.get("featurePriority")),
    dependency: String(formData.get("featureDependency") || "").trim() || "Nenhuma",
    status: String(formData.get("featureStatus"))
  });

  statusFilter.value = "all";
  renderFeatures();
  closeDialog();
  showToast("Funcionalidade adicionada ao quadro.");
});

statusFilter.addEventListener("change", renderFeatures);

tableBody.addEventListener("change", event => {
  const select = event.target.closest("[data-status-id]");
  if (!select) return;

  const feature = features.find(item =>
    item.id === Number(select.dataset.statusId)
  );

  if (!feature) return;

  feature.status = select.value;
  renderFeatures();
  showToast(`Status atualizado: ${feature.name}.`);
});

tableBody.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-id]");
  if (!button) return;

  const feature = features.find(item =>
    item.id === Number(button.dataset.removeId)
  );

  if (!feature) return;

  const confirmed = window.confirm(
    `Deseja remover "${feature.name}" do quadro?`
  );

  if (!confirmed) return;

  features = features.filter(item => item.id !== feature.id);
  renderFeatures();
  showToast("Funcionalidade removida.");
});

renderFeatures();
