
const initialFeatures = [
  { id: 1, name: "Login de usuários", team: "Equipe A", priority: "Alta", dependency: "Nenhuma", status: "Concluído" },
  { id: 2, name: "Recuperação de senha", team: "Equipe A", priority: "Média", dependency: "Login de usuários", status: "Concluído" },
  { id: 3, name: "Painel de relatórios", team: "Equipe B", priority: "Alta", dependency: "Login de usuários", status: "Em andamento" },
  { id: 4, name: "Filtros de relatórios", team: "Equipe B", priority: "Média", dependency: "Painel de relatórios", status: "Em andamento" },
  { id: 5, name: "Integração com API", team: "Equipe C", priority: "Alta", dependency: "Login de usuários", status: "Pendente" },
  { id: 6, name: "Exportação de dados", team: "Equipe C", priority: "Baixa", dependency: "Integração com API", status: "Pendente" }
];

const storageKey = "safe-pi-planning-features";

function loadFeatures() {
  try {
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Não foi possível carregar os dados salvos.", error);
  }

  return initialFeatures.map(feature => ({ ...feature }));
}

let features = loadFeatures();
let nextId = Math.max(0, ...features.map(feature => Number(feature.id) || 0)) + 1;
let toastTimeout;

const tableBody = document.querySelector("#featureTableBody");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#featureSearch");
const dialog = document.querySelector("#featureDialog");
const featureForm = document.querySelector("#featureForm");
const toast = document.querySelector("#toast");

function saveFeatures() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(features));
  } catch (error) {
    console.error("Não foi possível salvar os dados.", error);
    showToast("Não foi possível salvar os dados neste navegador.");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
  const searchTerm = normalizeText(searchInput ? searchInput.value : "");

  const visibleFeatures = features.filter(feature => {
    const matchesStatus =
      selectedStatus === "all" || feature.status === selectedStatus;

    const searchableText = normalizeText([
      feature.name,
      feature.team,
      feature.priority,
      feature.dependency,
      feature.status
    ].join(" "));

    const matchesSearch = searchableText.includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  if (visibleFeatures.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhuma funcionalidade encontrada.
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
              `<option value="${status}"${feature.status === status ? " selected" : ""}>${status}</option>`
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
    String(feature.dependency || "").trim() !== "" &&
    normalizeText(feature.dependency) !== "nenhuma"
  ).length;

  document.querySelector("#teamCount").textContent = teams;
  document.querySelector("#featureCount").textContent = total;
  document.querySelector("#doneCount").textContent = done;
  document.querySelector("#dependencyCount").textContent = dependencies;
  document.querySelector("#progressText").textContent = `${percent}%`;
  document.querySelector("#progressBar").style.width = `${percent}%`;

  const lastUpdated = document.querySelector("#lastUpdated");

  if (lastUpdated) {
    lastUpdated.textContent = `Última atualização: ${new Date().toLocaleString("pt-BR")}`;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimeout);

  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("show");
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
  const team = String(formData.get("featureTeam") || "").trim();

  if (!name || !team) {
    showToast("Preencha o nome e a equipe responsável.");
    return;
  }

  features.push({
    id: nextId++,
    name,
    team,
    priority: String(formData.get("featurePriority")),
    dependency: String(formData.get("featureDependency") || "").trim() || "Nenhuma",
    status: String(formData.get("featureStatus"))
  });

  saveFeatures();
  statusFilter.value = "all";

  if (searchInput) searchInput.value = "";

  renderFeatures();
  closeDialog();
  showToast("Funcionalidade adicionada ao quadro.");
});

statusFilter.addEventListener("change", renderFeatures);

if (searchInput) {
  searchInput.addEventListener("input", renderFeatures);
}

tableBody.addEventListener("change", event => {
  const select = event.target.closest("[data-status-id]");
  if (!select) return;

  const feature = features.find(item =>
    item.id === Number(select.dataset.statusId)
  );

  if (!feature) return;

  feature.status = select.value;
  saveFeatures();
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
  saveFeatures();
  renderFeatures();
  showToast("Funcionalidade removida.");
});

renderFeatures();
