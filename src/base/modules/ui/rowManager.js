/**
 * Gerenciamento de linhas de elementos
 */

import { getParticipantsOptions, updateElementNumbers, moveElementUp, moveElementDown } from '../utils/domHelpers.js';
import { 
  createEventTypeSelect, 
  createActivityTypeSelect, 
  createFinalEventTypeSelect, 
  createDataObjectDirectionSelect,
  createMessageTypeSelect,
  createExistingGatewayTypeSelect,
  createExistingGatewaySelect
} from './elementCreators.js';
import { createGatewayCounter } from './gatewayCounter.js';
import { setAddElementRowFunction, hasActiveBranches, updateElementNumbersWithBranches, cleanupGatewayBranches } from './gatewayBranches.js';

let globalUpdateDiagramCallback = null;

// Tipos de elemento que não precisam do campo nome
const TYPES_WITHOUT_NAME = ['Gateway Exclusivo', 'Gateway Paralelo', 'Gateway Existente', 'Mensagem'];

// Define a função addElementRow para uso no sistema de branches
setAddElementRowFunction(addElementRow);

export function setUpdateDiagramCallback(callback) {
  globalUpdateDiagramCallback = callback;
}

/**
 * Cria o HTML básico da linha
 */
function createRowHTML(participantsOptions) {
  return `
    <div class="element-number">1</div>
    <select class="element-type">
      <option value="Atividade">Atividade</option>
      <option value="Mensagem">Mensagem</option>
      <option value="Data Object">Data Object</option>
      <option value="Gateway Exclusivo">Gateway Exclusivo</option>
      <option value="Gateway Paralelo">Gateway Paralelo</option>
      <option value="Gateway Existente">Gateway Existente</option>
      <option value="Evento Intermediario">Evento Intermediario</option>
      <option value="Fim">Fim</option>
    </select>
    <input type="text" class="element-name" placeholder="Nome" />
    <select class="element-lane">${participantsOptions}</select>
    <div class="element-controls">
      <button type="button" class="move-button move-up">↑</button>
      <button type="button" class="move-button move-down">↓</button>
    </div>
    <button type="button" class="removeElementRow">X</button>
  `;
}

/**
 * Cria elementos auxiliares para a linha
 */
function createAuxiliaryElements(elementsContainer, participantsInput) {
  return {
    eventTypeSelect: createEventTypeSelect(),
    activityTypeSelect: createActivityTypeSelect(),
    finalEventTypeSelect: createFinalEventTypeSelect(),
    dataObjectDirectionSelect: createDataObjectDirectionSelect(),
    messageTypeSelect: createMessageTypeSelect(),
    gatewayCounter: createGatewayCounter(elementsContainer, participantsInput),
    existingGatewayTypeSelect: createExistingGatewayTypeSelect(),
    existingGatewaySelect: createExistingGatewaySelect()
  };
}

/**
 * Adiciona uma nova linha de elementos
 */
export function addElementRow(elementsContainer, participantsInput) {
  const row = document.createElement('div');
  row.className = 'element-row';

  const participantsOptions = getParticipantsOptions(participantsInput)
    .map(participant => `<option value="${participant}">${participant}</option>`)
    .join('');

  const externalParticipantsOptions = document
    .getElementById('externalParticipants')
    .value.split(',')
    .map(participant => participant.trim())
    .filter(participant => participant !== '')
    .map(participant => `<option value="${participant}">${participant}</option>`)
    .join('');

  // Cria estrutura da linha
  row.innerHTML = createRowHTML(participantsOptions);
  
  // Cria elementos auxiliares
  const auxiliaryElements = createAuxiliaryElements(elementsContainer, participantsInput);
  
  // Elementos da linha atual
  const elementTypeSelect = row.querySelector('.element-type');
  const elementLaneSelect = row.querySelector('.element-lane');
  let elementNameInput = row.querySelector('.element-name');

  // Configurar comportamentos da linha
  setupRowFieldsVisibility(row, elementTypeSelect, elementLaneSelect, elementNameInput, auxiliaryElements);
  setupRowEventListeners(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                        auxiliaryElements.eventTypeSelect, participantsOptions, externalParticipantsOptions, elementsContainer);

  elementsContainer.appendChild(row);
  updateRowNumbering(elementsContainer);
}

/**
 * Gerencia o campo nome baseado no tipo do elemento
 */
function manageNameField(row, elementTypeSelect, elementNameInput) {
  const shouldHideNameField = TYPES_WITHOUT_NAME.includes(elementTypeSelect.value);
  
  if (shouldHideNameField) {
    if (elementNameInput?.parentNode) {
      elementNameInput.parentNode.removeChild(elementNameInput);
      elementNameInput = null;
    }
  } else if (!elementNameInput) {
    // Recria o campo nome se necessário
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'element-name';
    nameInput.placeholder = 'Nome';
    row.insertBefore(nameInput, row.querySelector('.element-lane'));
    elementNameInput = nameInput;
  }
  
  return elementNameInput;
}

/**
 * Gerencia elementos específicos para Gateway Existente
 */
function manageExistingGatewayElements(row, elementLaneSelect, auxiliaryElements) {
  const { existingGatewayTypeSelect, existingGatewaySelect } = auxiliaryElements;
  
  elementLaneSelect.style.display = 'none';
  
  // Adiciona select de tipo de gateway
  if (!row.querySelector('.element-existingGatewayType')) {
    row.insertBefore(existingGatewayTypeSelect, row.querySelector('.element-lane'));
  }
  existingGatewayTypeSelect.style.display = '';
  
  // Adiciona select de gateway existente
  if (!row.querySelector('.element-existingGatewaySelect')) {
    row.insertBefore(existingGatewaySelect, row.querySelector('.element-lane'));
  }
  existingGatewaySelect.style.display = '';
  updateExistingGatewayOptions(row, existingGatewaySelect, existingGatewayTypeSelect.value);
}

/**
 * Gerencia elementos específicos para gateways normais
 */
function manageNormalGatewayElements(row, elementLaneSelect, auxiliaryElements) {
  const { gatewayCounter } = auxiliaryElements;
  
  elementLaneSelect.style.display = '';
  if (!row.querySelector('.gateway-counter')) {
    row.insertBefore(gatewayCounter, row.querySelector('.element-lane'));
  }
  gatewayCounter.style.display = 'flex';
}

/**
 * Gerencia elementos específicos para tipos especiais
 */
function manageSpecialTypeElements(row, elementTypeSelect, elementNameInput, auxiliaryElements) {
  const { dataObjectDirectionSelect, finalEventTypeSelect, activityTypeSelect, messageTypeSelect } = auxiliaryElements;
  
  switch (elementTypeSelect.value) {
    case 'Data Object':
      row.querySelector('.element-lane').style.display = 'none';
      if (!row.querySelector('.element-dataObjectDirection')) {
        row.insertBefore(dataObjectDirectionSelect, elementNameInput || row.querySelector('.element-lane'));
      }
      dataObjectDirectionSelect.style.display = '';
      break;
      
    case 'Fim':
      if (!row.querySelector('.element-finalEventType')) {
        row.insertBefore(finalEventTypeSelect, elementNameInput || row.querySelector('.element-lane'));
      }
      finalEventTypeSelect.style.display = '';
      break;
      
    case 'Atividade':
      if (!row.querySelector('.element-activityType')) {
        row.insertBefore(activityTypeSelect, elementNameInput || row.querySelector('.element-lane'));
      }
      activityTypeSelect.style.display = '';
      break;
      
    case 'Mensagem':
      if (!row.querySelector('.element-messageType')) {
        row.insertBefore(messageTypeSelect, row.querySelector('.element-lane'));
      }
      messageTypeSelect.style.display = '';
      break;
      
    case 'Evento Intermediario':
      // Mantém eventType visível se existir
      const eventType = row.querySelector('.element-eventType');
      if (eventType) eventType.style.display = '';
      break;
  }
}

/**
 * Oculta elementos não utilizados baseado no tipo selecionado
 */
function hideUnusedElements(row, elementTypeSelect) {
  const hideMap = {
    'Gateway Existente': ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'messageType'],
    'Gateway Exclusivo': ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'messageType', 'existingGatewayType', 'existingGatewaySelect'],
    'Gateway Paralelo': ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'messageType', 'existingGatewayType', 'existingGatewaySelect'],
    'Data Object': ['eventType', 'activityType', 'finalEventType', 'messageType', 'existingGatewayType', 'existingGatewaySelect'],
    'Fim': ['eventType', 'activityType', 'dataObjectDirection', 'messageType', 'existingGatewayType', 'existingGatewaySelect'],
    'Atividade': ['eventType', 'finalEventType', 'dataObjectDirection', 'messageType', 'existingGatewayType', 'existingGatewaySelect'],
    'Mensagem': ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'existingGatewayType', 'existingGatewaySelect'],
    'Evento Intermediario': ['activityType', 'finalEventType', 'dataObjectDirection', 'messageType', 'existingGatewayType', 'existingGatewaySelect']
  };

  const elementsToHide = hideMap[elementTypeSelect.value] || ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'messageType', 'existingGatewayType', 'existingGatewaySelect'];
  
  elementsToHide.forEach(type => {
    const element = row.querySelector(`.element-${type}`);
    if (element) element.style.display = 'none';
  });
}

/**
 * Atualiza a numeração dos elementos
 */
function updateRowNumbering(elementsContainer) {
  if (hasActiveBranches()) {
    updateElementNumbersWithBranches(elementsContainer);
  } else {
    updateElementNumbers(elementsContainer);
  }
}

/**
 * Configura a visibilidade dos campos baseado no tipo
 */
function setupRowFieldsVisibility(row, elementTypeSelect, elementLaneSelect, elementNameInput, auxiliaryElements) {
  const { existingGatewayTypeSelect, existingGatewaySelect, gatewayCounter } = auxiliaryElements;
  
  function updateRowFields() {
    // Gerencia campo nome
    elementNameInput = manageNameField(row, elementTypeSelect, elementNameInput);
    
    // Reset lane select visibility
    elementLaneSelect.style.display = '';
    
    // Gerencia elementos baseado no tipo
    const elementType = elementTypeSelect.value;
    
    if (elementType === 'Gateway Existente') {
      manageExistingGatewayElements(row, elementLaneSelect, auxiliaryElements);
      if (row.querySelector('.gateway-counter')) {
        gatewayCounter.style.display = 'none';
      }
    } else if (['Gateway Exclusivo', 'Gateway Paralelo'].includes(elementType)) {
      manageNormalGatewayElements(row, elementLaneSelect, auxiliaryElements);
    } else {
      if (row.querySelector('.gateway-counter')) {
        gatewayCounter.style.display = 'none';
      }
      manageSpecialTypeElements(row, elementTypeSelect, elementNameInput, auxiliaryElements);
    }
    
    // Oculta elementos não utilizados
    hideUnusedElements(row, elementTypeSelect);
  }

  // Event listener para atualizar gateways quando o tipo muda
  existingGatewayTypeSelect.addEventListener('change', () => {
    updateExistingGatewayOptions(row, existingGatewaySelect, existingGatewayTypeSelect.value);
  });

  // Chama ao iniciar e ao mudar o tipo
  updateRowFields();
  elementTypeSelect.addEventListener('change', updateRowFields);
}

/**
 * Atualiza opções de gateways existentes
 */
function updateExistingGatewayOptions(currentRow, gatewaySelect, gatewayType) {
  gatewaySelect.innerHTML = '<option value="">Selecione o índice</option>';
  
  const allRows = Array.from(document.querySelectorAll('.element-row'));
  const currentRowIndex = allRows.indexOf(currentRow);
  
  allRows.forEach((row, index) => {
    if (index !== currentRowIndex) {
      const elementType = row.querySelector('.element-type').value;
      if (elementType === gatewayType) {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = `Elemento ${index + 1}`;
        gatewaySelect.appendChild(option);
      }
    }
  });
}

/**
 * Gera ID do gateway para cleanup
 */
function generateGatewayId(row, elementType) {
  const branchContainer = row.closest('.branch-elements');
  
  if (branchContainer) {
    const branchId = branchContainer.id;
    const allRowsInBranch = Array.from(branchContainer.querySelectorAll('.element-row'));
    const rowIndex = allRowsInBranch.indexOf(row);
    return `${branchId}_gateway_${elementType.replace(' ', '')}_${rowIndex}`;
  } else {
    const allRows = Array.from(document.querySelectorAll('#elementsContainer .element-row'));
    const rowIndex = allRows.indexOf(row);
    return `gateway_${elementType.replace(' ', '')}_${rowIndex}`;
  }
}

/**
 * Configura os event listeners da linha
 */
function setupRowEventListeners(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                               eventTypeSelect, participantsOptions, externalParticipantsOptions, elementsContainer) {
  
  // Event listener para mudança de tipo
  elementTypeSelect.addEventListener('change', () => {
    // Evento Intermediario: adiciona o select de eventType
    if (elementTypeSelect.value === 'Evento Intermediario') {
      if (!row.querySelector('.element-eventType')) {
        const insertBefore = elementNameInput || row.querySelector('.element-lane');
        row.insertBefore(eventTypeSelect, insertBefore);
        
        if (globalUpdateDiagramCallback) {
          eventTypeSelect.addEventListener('input', globalUpdateDiagramCallback);
          eventTypeSelect.addEventListener('change', globalUpdateDiagramCallback);
        }
      }
      eventTypeSelect.style.display = '';
    } else if (row.querySelector('.element-eventType')) {
      row.removeChild(eventTypeSelect);
    }

    // Atualiza opções de lane baseado no tipo
    elementLaneSelect.innerHTML = elementTypeSelect.value === 'Mensagem' 
      ? externalParticipantsOptions 
      : participantsOptions;
  });

  // Event listener para remover a linha
  row.querySelector('.removeElementRow').addEventListener('click', () => {
    const elementType = row.querySelector('.element-type').value;
    
    // Se for um gateway, fazer cleanup dos branches antes de remover
    if (['Gateway Exclusivo', 'Gateway Paralelo'].includes(elementType)) {
      const gatewayId = generateGatewayId(row, elementType);
      cleanupGatewayBranches(gatewayId);
    }
    
    row.remove();
    updateRowNumbering(elementsContainer);
    updateAllExistingGatewaySelects();
  });

  // Event listeners para botões de movimento
  row.querySelector('.move-up').addEventListener('click', () => {
    moveElementUp(row, elementsContainer);
    if (hasActiveBranches()) updateElementNumbersWithBranches();
  });

  row.querySelector('.move-down').addEventListener('click', () => {
    moveElementDown(row, elementsContainer);
    if (hasActiveBranches()) updateElementNumbersWithBranches();
  });
}

/**
 * Atualiza todos os selects de gateways existentes
 */
export function updateAllExistingGatewaySelects() {
  document.querySelectorAll('.element-row').forEach(row => {
    if (row.querySelector('.element-type').value === 'Gateway Existente') {
      const gatewaySelect = row.querySelector('.element-existingGatewaySelect');
      const gatewayTypeSelect = row.querySelector('.element-existingGatewayType');
      if (gatewaySelect && gatewayTypeSelect) {
        updateExistingGatewayOptions(row, gatewaySelect, gatewayTypeSelect.value);
      }
    }
  });
}
