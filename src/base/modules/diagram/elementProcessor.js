/**
 * Processamento dos elementos da UI para o diagrama
 */

/**
 * Processa elementos da UI para o formato usado na geração do diagrama
 * @param {HTMLElement} elementsContainer - Container dos elementos
 * @returns {Array} Array de elementos processados
 */
export function processElementsFromUI(elementsContainer) {
  let previousName = document.getElementById('initialEventName').value;
  
  // Coleta elementos do container principal
  const mainElements = Array.from(elementsContainer.querySelectorAll('.element-row'));
  
  // Coleta elementos de todos os containers de branch (divergências)
  const branchElements = Array.from(document.querySelectorAll('.branch-elements .element-row'));
  
  // Combina todos os elementos
  const allElements = [...mainElements, ...branchElements];
  
  return allElements.map(row => {
    const type = row.querySelector('.element-type').value;
    const lane = row.querySelector('.element-lane').value;
    const index = parseInt(row.querySelector('.element-number').textContent, 10);

    if (type !== 'Gateway Exclusivo' && type !== 'Gateway Paralelo') {
      let name = row.querySelector('.element-name').value;
      
      // Processamento específico por tipo
      if (type === 'Evento Intermediario') {
        const eventType = row.querySelector('.element-eventType').value;
        name = eventType + '_' + name;
      } else if (type === 'Fim') {
        const finalEventType = row.querySelector('.element-finalEventType').value;
        name = finalEventType + '_' + name;
      } else if (type === 'Atividade') {
        const activityType = row.querySelector('.element-activityType').value;
        name = activityType + '_' + name;
      } else if (type === 'Data Object') {
        const dataObjectDirection = row.querySelector('.element-dataObjectDirection').value;
        name = dataObjectDirection + '_' + name;
      }
      previousName = name;
      return { index, type, name, lane };
    }

    // Processamento para gateways
    let normalizedName = previousName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const name = "following" + normalizedName;
    previousName = name;

    // Pega o valor do contador para gateways
    const counterElement = row.querySelector('.counter-value');
    let diverge;
    if (counterElement) {
      const counterText = counterElement.textContent;
      if (counterText === 'Gateway Existente') {
        const gatewaySelect = row.querySelector('.gateway-select');
        diverge = 'existing_' + (gatewaySelect.value || '1'); // Prefixo para identificar gateway existente
      } else {
        // Para gateways com divergências, coletar índices dos primeiros elementos de cada branch
        if (counterText !== 'Convergência') {
          diverge = getBranchFirstElementIndexes(row, index);
        } else {
          // Para convergência, retorna array com o próximo elemento
          diverge = [index + 1];
        }
      }
    } else {
      diverge = row.querySelector('.element-name').value;
    }

    return { index, type, name, lane, diverge };
  });
}

/**
 * Coleta os índices dos primeiros elementos de cada branch de um gateway
 * @param {HTMLElement} gatewayRow - Linha do gateway
 * @param {number} gatewayIndex - Índice do gateway
 * @returns {Array|string} Array com índices ou string para convergência
 */
function getBranchFirstElementIndexes(gatewayRow, gatewayIndex) {
  // Gera o ID do gateway baseado na sua posição e tipo
  const elementType = gatewayRow.querySelector('.element-type').value;
  const branchContainer = gatewayRow.closest('.branch-elements');
  
  let gatewayId;
  if (branchContainer) {
    const branchId = branchContainer.id;
    const allRowsInBranch = Array.from(branchContainer.querySelectorAll('.element-row'));
    const rowIndex = allRowsInBranch.indexOf(gatewayRow);
    gatewayId = `${branchId}_gateway_${elementType.replace(' ', '')}_${rowIndex}`;
  } else {
    const allRows = Array.from(document.querySelectorAll('#elementsContainer .element-row'));
    const rowIndex = allRows.indexOf(gatewayRow);
    gatewayId = `gateway_${elementType.replace(' ', '')}_${rowIndex}`;
  }

  // Procura pelo container de branches deste gateway
  const branchesContainer = document.getElementById(`branches-${gatewayId}`);
  if (!branchesContainer) {
    // Se não encontrou branches, retorna array vazio (gateway divergente sem elementos)
    return [];
  }

  // Coleta o índice do primeiro elemento de cada branch
  const branchIndexes = [];
  const branches = branchesContainer.querySelectorAll('.gateway-branch');
  
  branches.forEach(branch => {
    const branchElements = branch.querySelector('.branch-elements');
    if (branchElements) {
      const firstElementRow = branchElements.querySelector('.element-row');
      if (firstElementRow) {
        const firstElementIndex = parseInt(firstElementRow.querySelector('.element-number').textContent, 10);
        branchIndexes.push(firstElementIndex);
      }
    }
  });

  // Retorna array vazio se não há branches (gateway divergente sem elementos)
  return branchIndexes.length > 0 ? branchIndexes : [];
}

/**
 * Processa elementos duplicados e insere gateways automáticos
 * @param {Array} elements - Array de elementos
 * @returns {Array} Array de elementos processados
 */
export function processDuplicateElements(elements) {
  let indexesList = [];
  
  elements.forEach((element, index) => {
    if (indexesList.includes(index)) return;
    indexesList.push(index);
    if (element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo' || element.type === 'Mensagem') return;
    
    const duplicates = elements
      .map((el, idx) => (el.name === element.name ? idx : -1))
      .filter(idx => idx !== -1);

    indexesList.push(...duplicates);

    if (duplicates.length <= 1) return;
    
    let normalizedName = element.name.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const gateway = {
      type: "Gateway Exclusivo",
      name: "followedBy" + normalizedName,
      lane: element.lane,
      diverge: "1" // Sempre convergência para gateways inseridos automaticamente
    };

    elements.splice(duplicates[0], 0, gateway);
    indexesList = indexesList.map(idx => (idx >= duplicates[0] ? idx + 1 : idx));

    // Substitui todas as ocorrências duplicadas por referências ao mesmo gateway
    duplicates.slice(1).forEach(dupIdx => {
      const adjustedIndex = dupIdx + 1; // +1 porque inserimos o gateway
      if (adjustedIndex < elements.length) {
        elements[adjustedIndex] = gateway;
      }
    });
  });
  
  return elements;
}
