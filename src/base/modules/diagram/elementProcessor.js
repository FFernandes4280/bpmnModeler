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

  // Primeiro, processa todos os elementos e identifica quais devem ter índice
  const processedElements = allElements.map(row => {
    const type = row.querySelector('.element-type').value;
    const lane = row.querySelector('.element-lane').value;
    const originalIndex = parseInt(row.querySelector('.element-number').textContent, 10);

    // Elementos que não devem ter índice na sequência principal
    const shouldHaveIndex = !['Mensagem', 'Data Object'].includes(type);

    if (type !== 'Gateway Exclusivo' && type !== 'Gateway Paralelo') {
      // Para elementos de mensagem, usar o tipo de mensagem se disponível
      let name;
      if (type === 'Mensagem') {
        const messageTypeElement = row.querySelector('.element-messageType');
        const messageType = messageTypeElement ? messageTypeElement.value : 'Envio';
        name = messageType + '_Mensagem_' + originalIndex;
      } else {
        name = row.querySelector('.element-name').value;
      }

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

      if (shouldHaveIndex) {
        previousName = name;
      }

      return { originalIndex, type, name, lane, shouldHaveIndex };
    }

    // Processamento para gateways (sempre têm índice)
    let normalizedName = previousName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const name = "following" + normalizedName;
    previousName = name;

    // Pega o valor do contador para gateways
    const counterElement = row.querySelector('.counter-value');
    let diverge;
    if (counterElement) {
      const counterText = counterElement.textContent;
      // Para gateways com divergências, coletar índices dos primeiros elementos de cada branch
      if (counterText !== 'Convergência') {
        diverge = getBranchFirstElementIndexes(row, originalIndex);
      } else {
        // Gateway de Convergência
        const currentPosition = allElements.indexOf(row);
        const hasNextElement = (currentPosition + 1) < allElements.length;

        if (hasNextElement) {
          const nextElement = allElements[currentPosition + 1];

          // Verifica se o próximo elemento está no mesmo nível (mesmo container)
          const currentContainer = row.closest('.branch-elements, #elementsContainer');
          const nextContainer = nextElement.closest('.branch-elements, #elementsContainer');

          // Se estão no mesmo container (mesmo nível), conecta
          if (currentContainer === nextContainer) {
            const nextOriginalIndex = parseInt(nextElement.querySelector('.element-number').textContent, 10);
            diverge = [nextOriginalIndex];
          } else {
            // Se estão em containers diferentes (níveis diferentes), não conecta
            diverge = [];
          }
        } else {
          diverge = [];
        }
      }
    } else {
      // Fallback: se não há counter-value, tentar pegar do campo nome se existir
      const nameElement = row.querySelector('.element-name');
      diverge = nameElement ? nameElement.value : '';
    }

    return { originalIndex, type, name, lane, diverge, shouldHaveIndex: true }; // Gateways sempre têm índice
  });

  // Agora renumera apenas os elementos que devem ter índice
  let currentIndex = 1;
  const finalElements = processedElements.map(element => {
    if (element.shouldHaveIndex) {
      const index = currentIndex;
      currentIndex++;
      return { ...element, index };
    } else {
      // Elementos sem índice (Mensagem e Data Object) usam null ou um valor especial
      return { ...element, index: null };
    }
  });

  // Ajusta as referências de divergência nos gateways para usar os novos índices
  return finalElements.map(element => {
    if (element.diverge && Array.isArray(element.diverge)) {
      // Mapeia os índices originais para os novos índices
      const newDiverge = element.diverge.map(originalIdx => {
        const targetElement = finalElements.find(el => el.originalIndex === originalIdx);
        return targetElement ? targetElement.index : originalIdx;
      }).filter(idx => idx !== null); // Remove referências para elementos sem índice

      return { ...element, diverge: newDiverge };
    }
    return element;
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

  // Coleta o índice do primeiro elemento de cada branch (apenas filhos diretos)
  const branchIndexes = [];
  const branches = Array.from(branchesContainer.children)
    .filter(el => el.classList && el.classList.contains('gateway-branch'));

  branches.forEach(branch => {
    // Busca apenas a .branch-elements filha direta do branch
    const branchElements = Array.from(branch.children)
      .find(el => el.classList && el.classList.contains('branch-elements'));

    if (!branchElements) return;

    // Primeiro .element-row filho direto (não recursivo)
    const firstElementRow = Array.from(branchElements.children)
      .find(el => el.classList && el.classList.contains('element-row'));

    if (firstElementRow) {
      const numberEl = firstElementRow.querySelector('.element-number');
      const firstElementIndex = numberEl ? parseInt(numberEl.textContent, 10) : NaN;
      if (!Number.isNaN(firstElementIndex)) {
        branchIndexes.push(firstElementIndex);
      }
    }
  });

  // Deduplica e retorna vazio se não há branches
  return branchIndexes.length > 0 ? [...new Set(branchIndexes)] : [];
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
    // Não processa elementos sem índice ou gateways ou mensagens
    if (element.index === null || element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo' || element.type === 'Mensagem') return;

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
      diverge: []
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
