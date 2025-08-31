/**
 * Gerenciamento de branches de gateways
 */

// Armazena informações sobre as branches dos gateways
const gatewayBranches = new Map();

// Referência para a função addElementRow (será definida na inicialização)
let addElementRowFunction = null;

/**
 * Define a função addElementRow para uso interno
 * @param {Function} addRowFunc - Função addElementRow
 */
export function setAddElementRowFunction(addRowFunc) {
  addElementRowFunction = addRowFunc;
}

/**
 * Inicializa ou atualiza as branches de um gateway
 * @param {string} gatewayId - ID do gateway
 * @param {number} count - Quantidade de divergências
 * @param {HTMLElement} elementsContainer - Container principal dos elementos
 * @param {HTMLInputElement} participantsInput - Input dos participantes
 */
export function initGatewayBranches(gatewayId, count, elementsContainer, participantsInput) {
  if (count <= 1) {
    removeGatewayBranches(gatewayId);
    return;
  }

  const existingData = gatewayBranches.get(gatewayId);
  
  if (existingData) {
    // Atualiza divisões existentes
    updateExistingBranches(gatewayId, count);
  } else {
    // Cria novas divisões
    createNewBranches(gatewayId, count, elementsContainer, participantsInput);
  }
}

/**
 * Cria novas divisões para um gateway
 */
function createNewBranches(gatewayId, count, elementsContainer, participantsInput) {
  // Cria estrutura de branches
  const branches = Array.from({ length: count }, (_, index) => ({
    index: index,
    lastElement: null,
    container: null,
    addButton: null
  }));

  gatewayBranches.set(gatewayId, {
    branches: branches,
    count: count,
    originalContainer: elementsContainer,
    participantsInput: participantsInput
  });

  // Cria a interface das divisões
  createBranchDivisions(gatewayId);
}

/**
 * Atualiza o número de branches existentes
 */
function updateExistingBranches(gatewayId, newCount) {
  const gatewayData = gatewayBranches.get(gatewayId);
  if (!gatewayData) return;

  const currentCount = gatewayData.branches.length;
  
  if (newCount === currentCount) {
    return; // Não há mudança
  }

  if (newCount > currentCount) {
    // Adiciona novas branches
    for (let i = currentCount; i < newCount; i++) {
      gatewayData.branches.push({
        index: i,
        lastElement: null,
        container: null,
        addButton: null
      });
      
      // Adiciona nova divisão visual
      addBranchDivision(gatewayId, i);
    }
  } else {
    // Remove branches excedentes
    for (let i = currentCount - 1; i >= newCount; i--) {
      removeBranchDivision(gatewayId, i);
      gatewayData.branches.splice(i, 1);
    }
  }
  
  gatewayData.count = newCount;
}

/**
 * Cria as divisões visuais para as branches do gateway
 * @param {string} gatewayId - ID do gateway
 */
function createBranchDivisions(gatewayId) {
  const gatewayData = gatewayBranches.get(gatewayId);
  if (!gatewayData) return;

  const mainContainer = gatewayData.originalContainer;
  
  // Esconde o botão principal de adicionar linha
  const mainAddButton = document.getElementById('addElementRow');
  if (mainAddButton) {
    mainAddButton.style.display = 'none';
  }

  // Cria container para as divisões
  const branchesContainer = document.createElement('div');
  branchesContainer.className = 'gateway-branches-container';
  branchesContainer.id = `branches-${gatewayId}`;

  // Cria cada divisão
  gatewayData.branches.forEach((branch, index) => {
    addBranchDivision(gatewayId, index, branchesContainer);
  });

  // Adiciona as divisões após o container principal
  mainContainer.parentNode.insertBefore(branchesContainer, mainAddButton);
}

/**
 * Adiciona uma nova divisão de branch
 */
function addBranchDivision(gatewayId, branchIndex, container = null) {
  const gatewayData = gatewayBranches.get(gatewayId);
  if (!gatewayData) return;

  if (!container) {
    container = document.getElementById(`branches-${gatewayId}`);
  }
  if (!container) return;

  const branch = gatewayData.branches[branchIndex];
  
  const branchDiv = document.createElement('div');
  branchDiv.className = 'gateway-branch';
  branchDiv.id = `branch-${gatewayId}-${branchIndex}`;
  branchDiv.innerHTML = `
    <div class="branch-separator">
      -------------Divergência ${branchIndex + 1}-------------
    </div>
    <div class="branch-elements" id="branch-elements-${gatewayId}-${branchIndex}">
    </div>
    <button type="button" class="add-branch-element" data-gateway="${gatewayId}" data-branch="${branchIndex}">
      Adicionar Linha
    </button>
  `;

  container.appendChild(branchDiv);

  // Armazena referências
  branch.container = branchDiv.querySelector('.branch-elements');
  branch.addButton = branchDiv.querySelector('.add-branch-element');

  // Adiciona event listener para o botão
  branch.addButton.addEventListener('click', () => {
    addElementToBranch(gatewayId, branchIndex);
  });
}

/**
 * Remove uma divisão de branch específica
 */
function removeBranchDivision(gatewayId, branchIndex) {
  const branchDiv = document.getElementById(`branch-${gatewayId}-${branchIndex}`);
  if (branchDiv) {
    branchDiv.remove();
  }
}

/**
 * Adiciona um elemento a uma branch específica
 * @param {string} gatewayId - ID do gateway
 * @param {number} branchIndex - Índice da branch
 */
function addElementToBranch(gatewayId, branchIndex) {
  const gatewayData = gatewayBranches.get(gatewayId);
  if (!gatewayData || !gatewayData.branches[branchIndex]) return;

  const branch = gatewayData.branches[branchIndex];
  
  // Adiciona elemento à branch específica
  if (addElementRowFunction) {
    addElementRowFunction(branch.container, gatewayData.participantsInput);
  } else {
    console.error('addElementRowFunction não foi definida');
  }
  
  // Atualiza numeração global
  updateGlobalElementNumbers();
}

/**
 * Remove as divisões de um gateway
 * @param {string} gatewayId - ID do gateway
 */
export function removeGatewayBranches(gatewayId) {
  const branchesContainer = document.getElementById(`branches-${gatewayId}`);
  if (branchesContainer) {
    branchesContainer.remove();
  }

  gatewayBranches.delete(gatewayId);

  // Mostra o botão principal novamente se não há mais gateways com branches
  if (gatewayBranches.size === 0) {
    const mainAddButton = document.getElementById('addElementRow');
    if (mainAddButton) {
      mainAddButton.style.display = '';
    }
  }
}

/**
 * Obtém as branches de um gateway
 * @param {string} gatewayId - ID do gateway
 * @returns {Object|null} Dados das branches
 */
export function getGatewayBranches(gatewayId) {
  return gatewayBranches.get(gatewayId) || null;
}

/**
 * Define o último elemento de uma branch
 * @param {string} gatewayId - ID do gateway
 * @param {number} branchIndex - Índice da branch
 * @param {Object} element - Elemento
 */
export function setBranchLastElement(gatewayId, branchIndex, element) {
  const gatewayData = gatewayBranches.get(gatewayId);
  if (!gatewayData || !gatewayData.branches[branchIndex]) return;
  
  gatewayData.branches[branchIndex].lastElement = element;
}

/**
 * Obtém o último elemento de uma branch
 * @param {string} gatewayId - ID do gateway
 * @param {number} branchIndex - Índice da branch
 * @returns {Object|null} Último elemento da branch
 */
export function getBranchLastElement(gatewayId, branchIndex) {
  const gatewayData = gatewayBranches.get(gatewayId);
  if (!gatewayData || !gatewayData.branches[branchIndex]) return null;
  
  return gatewayData.branches[branchIndex].lastElement;
}

/**
 * Atualiza a numeração global dos elementos
 */
function updateGlobalElementNumbers() {
  const allRows = document.querySelectorAll('.element-row');
  allRows.forEach((row, index) => {
    const numberElement = row.querySelector('.element-number');
    if (numberElement) {
      numberElement.textContent = index + 1;
    }
  });
}

/**
 * Verifica se existem branches ativas
 * @returns {boolean} Se há branches ativas
 */
export function hasActiveBranches() {
  return gatewayBranches.size > 0;
}

/**
 * Lista todos os gateways com branches
 * @returns {Array} Lista de IDs de gateways com branches
 */
export function getActiveGatewayIds() {
  return Array.from(gatewayBranches.keys());
}
