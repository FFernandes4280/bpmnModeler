/**
 * Gerenciamento de branches de gateways
 */

import { updateElementNumbers } from '../utils/domHelpers.js';

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
  
  // Determina o contexto de inserção baseado no container
  let insertionParent, insertionReference;
  
  if (mainContainer.id === 'elementsContainer') {
    // Estamos no container principal
    const mainAddButton = document.getElementById('addElementRow');
    if (mainAddButton) {
      mainAddButton.style.display = 'none';
    }
    insertionParent = mainContainer.parentNode;
    insertionReference = mainAddButton;
  } else {
    // Estamos dentro de uma branch - inserir dentro da própria branch
    // Encontra e esconde o botão "Adicionar Linha" da branch pai
    const parentBranch = mainContainer.closest('.gateway-branch');
    if (parentBranch) {
      const parentAddButton = parentBranch.querySelector('.add-branch-element');
      if (parentAddButton) {
        parentAddButton.style.display = 'none';
      }
    }
    
    insertionParent = mainContainer;
    insertionReference = null; // Adicionar no final da branch
  }

  // Cria container para as divisões
  const branchesContainer = document.createElement('div');
  branchesContainer.className = 'gateway-branches-container';
  branchesContainer.id = `branches-${gatewayId}`;

  // Cria cada divisão
  gatewayData.branches.forEach((branch, index) => {
    addBranchDivision(gatewayId, index, branchesContainer);
  });

  // Adiciona as divisões no local apropriado
  if (insertionReference) {
    insertionParent.insertBefore(branchesContainer, insertionReference);
  } else {
    insertionParent.appendChild(branchesContainer);
  }
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
  
  // Atualiza numeração com sistema de branches
  updateGlobalElementNumbers();
}

/**
 * Remove as divisões de um gateway
 * @param {string} gatewayId - ID do gateway
 */
export function removeGatewayBranches(gatewayId) {
  const gatewayData = gatewayBranches.get(gatewayId);
  const branchesContainer = document.getElementById(`branches-${gatewayId}`);
  
  if (branchesContainer) {
    branchesContainer.remove();
  }

  gatewayBranches.delete(gatewayId);

  // Verifica se devemos mostrar botões novamente
  if (gatewayBranches.size === 0) {
    // Não há mais gateways com branches - mostra o botão principal
    const mainAddButton = document.getElementById('addElementRow');
    if (mainAddButton) {
      mainAddButton.style.display = '';
    }
  } else if (gatewayData) {
    // Verifica o contexto do gateway removido
    const wasMainContainer = gatewayData.originalContainer && gatewayData.originalContainer.id === 'elementsContainer';
    
    if (wasMainContainer) {
      // Gateway estava no container principal
      const hasMainGateways = Array.from(gatewayBranches.values()).some(data => 
        data.originalContainer && data.originalContainer.id === 'elementsContainer'
      );
      
      if (!hasMainGateways) {
        const mainAddButton = document.getElementById('addElementRow');
        if (mainAddButton) {
          mainAddButton.style.display = '';
        }
      }
    } else {
      // Gateway estava dentro de uma branch - verifica se deve restaurar o botão da branch pai
      const parentBranch = gatewayData.originalContainer.closest('.gateway-branch');
      if (parentBranch) {
        // Verifica se não há outros gateways aninhados nesta branch
        const hasNestedGateways = Array.from(gatewayBranches.values()).some(data => {
          return data.originalContainer && 
                 data.originalContainer.closest('.gateway-branch') === parentBranch;
        });
        
        if (!hasNestedGateways) {
          const parentAddButton = parentBranch.querySelector('.add-branch-element');
          if (parentAddButton) {
            parentAddButton.style.display = '';
          }
        }
      }
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
  // Primeiro, numera os elementos do container principal (antes dos gateways)
  const mainContainer = document.getElementById('elementsContainer');
  if (mainContainer) {
    const mainRows = mainContainer.querySelectorAll('.element-row');
    mainRows.forEach((row, index) => {
      const numberElement = row.querySelector('.element-number');
      if (numberElement) {
        numberElement.textContent = index + 1;
      }
    });
  }

  // Depois, numera cada branch independentemente
  gatewayBranches.forEach((gatewayData, gatewayId) => {
    gatewayData.branches.forEach((branch, branchIndex) => {
      if (branch.container) {
        const branchRows = branch.container.querySelectorAll('.element-row');
        branchRows.forEach((row, index) => {
          const numberElement = row.querySelector('.element-number');
          if (numberElement) {
            numberElement.textContent = index + 1; // Cada branch começa do 1
          }
        });
      }
    });
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

/**
 * Atualiza numeração considerando branches (função pública para usar no lugar da do domHelpers)
 * @param {HTMLElement} container - Container que foi modificado (pode ser main ou branch)
 */
export function updateElementNumbersWithBranches(container = null) {
  updateGlobalElementNumbers();
}

/**
 * Limpa branches de um gateway removido e migra elementos para o container pai
 * @param {string} gatewayId - ID do gateway removido
 */
export function cleanupGatewayBranches(gatewayId) {
  if (!gatewayBranches.has(gatewayId)) {
    return; // Gateway não tinha branches
  }

  const gatewayData = gatewayBranches.get(gatewayId);
  const branchesContainer = document.getElementById(`branches-${gatewayId}`);
  
  if (!branchesContainer) {
    // Remove do registro se não encontrou o container
    gatewayBranches.delete(gatewayId);
    return;
  }

  // Encontra o container pai onde os elementos serão migrados
  const parentContainer = gatewayData.originalContainer;
  
  // Para cada branch, migra os elementos para o container pai
  gatewayData.branches.forEach((branch, branchIndex) => {
    if (branch.container) {
      const elementsInBranch = branch.container.querySelectorAll('.element-row');
      
      // Migra cada elemento da branch para o container pai
      elementsInBranch.forEach(element => {
        // Remove da branch e adiciona ao container pai
        element.remove();
        parentContainer.appendChild(element);
      });
    }
  });
  
  // Remove as branches usando a função existente
  removeGatewayBranches(gatewayId);
  
  // Renumera todos os elementos
  if (hasActiveBranches()) {
    updateElementNumbersWithBranches();
  } else {
    updateElementNumbers(parentContainer);
  }
  
  console.log(`Gateway ${gatewayId} removido com cleanup de branches`);
}
