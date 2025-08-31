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
  
  return Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => {
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
        diverge = counterText === 'Convergência' ? "1" : counterText;
      }
    } else {
      diverge = row.querySelector('.element-name').value;
    }

    return { type, name, lane, diverge };
  });
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
