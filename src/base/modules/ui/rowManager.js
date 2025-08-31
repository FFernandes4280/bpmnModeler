/**
 * Gerenciamento de linhas de elementos
 */

import { getParticipantsOptions, updateElementNumbers, moveElementUp, moveElementDown } from '../utils/domHelpers.js';
import { 
  createEventTypeSelect, 
  createActivityTypeSelect, 
  createFinalEventTypeSelect, 
  createDataObjectDirectionSelect,
  createExistingGatewayTypeSelect,
  createExistingGatewaySelect
} from './elementCreators.js';
import { createGatewayCounter } from './gatewayCounter.js';
import { setAddElementRowFunction, hasActiveBranches, updateElementNumbersWithBranches, cleanupGatewayBranches } from './gatewayBranches.js';

// Variável global para armazenar o callback de atualização do diagrama
let globalUpdateDiagramCallback = null;

/**
 * Define o callback global de atualização do diagrama
 * @param {Function} callback - Função de atualização do diagrama
 */
export function setUpdateDiagramCallback(callback) {
  globalUpdateDiagramCallback = callback;
}

// Define a função addElementRow para uso no sistema de branches
setAddElementRowFunction(addElementRow);

/**
 * Adiciona uma nova linha de elementos
 * @param {HTMLElement} elementsContainer - Container dos elementos
 * @param {HTMLInputElement} participantsInput - Input dos participantes
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

  // HTML básico da linha
  row.innerHTML = `
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
    <select class="element-lane">
      ${participantsOptions}
    </select>
    <div class="element-controls">
      <button type="button" class="move-button move-up">↑</button>
      <button type="button" class="move-button move-down">↓</button>
    </div>
    <button type="button" class="removeElementRow">X</button>
  `;

  // Criação dos elementos de seleção específicos
  const eventTypeSelect = createEventTypeSelect();
  const activityTypeSelect = createActivityTypeSelect();
  const finalEventTypeSelect = createFinalEventTypeSelect();
  const dataObjectDirectionSelect = createDataObjectDirectionSelect();
  const gatewayCounter = createGatewayCounter(elementsContainer, participantsInput);
  const existingGatewayTypeSelect = createExistingGatewayTypeSelect();
  const existingGatewaySelect = createExistingGatewaySelect();

  // Elementos da linha atual
  const elementTypeSelect = row.querySelector('.element-type');
  const elementLaneSelect = row.querySelector('.element-lane');
  let elementNameInput = row.querySelector('.element-name');

  // Configurar comportamentos da linha
  setupRowFieldsVisibility(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                          eventTypeSelect, activityTypeSelect, finalEventTypeSelect, 
                          dataObjectDirectionSelect, gatewayCounter, existingGatewayTypeSelect, existingGatewaySelect);
  
  setupRowEventListeners(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                        eventTypeSelect, participantsOptions, externalParticipantsOptions, elementsContainer);

  elementsContainer.appendChild(row);
  
  // Usa numeração com branches se houver branches ativas, senão usa a padrão
  if (hasActiveBranches()) {
    updateElementNumbersWithBranches(elementsContainer);
  } else {
    updateElementNumbers(elementsContainer);
  }
}

/**
 * Configura a visibilidade dos campos baseado no tipo
 */
function setupRowFieldsVisibility(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                                  eventTypeSelect, activityTypeSelect, finalEventTypeSelect, 
                                  dataObjectDirectionSelect, gatewayCounter, existingGatewayTypeSelect, existingGatewaySelect) {
  
  function updateRowFields() {
    // Remove campo nome para tipos que não precisam
    const shouldHideNameField = elementTypeSelect.value === 'Gateway Exclusivo' || 
                               elementTypeSelect.value === 'Gateway Paralelo' ||
                               elementTypeSelect.value === 'Gateway Existente' ||
                               elementTypeSelect.value === 'Mensagem';

    if (shouldHideNameField) {
      if (elementNameInput && elementNameInput.parentNode) {
        elementNameInput.parentNode.removeChild(elementNameInput);
        elementNameInput = null;
      }
    } else {
      // Garante que o campo nome existe para outros tipos
      if (!elementNameInput) {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'element-name';
        nameInput.placeholder = 'Nome';
        row.insertBefore(nameInput, row.querySelector('.element-lane'));
        elementNameInput = nameInput;
      }
      elementNameInput.style.display = '';
    }

    // Configurações específicas para Gateway Existente
    if (elementTypeSelect.value === 'Gateway Existente') {
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
      
      hideOtherSelects(row, ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection']);
      if (row.querySelector('.gateway-counter')) {
        gatewayCounter.style.display = 'none';
      }
    }
    // Configurações para gateways normais
    else if (elementTypeSelect.value === 'Gateway Exclusivo' || elementTypeSelect.value === 'Gateway Paralelo') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.gateway-counter')) {
        row.insertBefore(gatewayCounter, row.querySelector('.element-lane'));
      }
      gatewayCounter.style.display = 'flex';
      hideOtherSelects(row, ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'existingGatewayType', 'existingGatewaySelect']);
    }
    // Configurações para outros tipos
    else {
      elementLaneSelect.style.display = '';
      if (row.querySelector('.gateway-counter')) {
        gatewayCounter.style.display = 'none';
      }
      hideOtherSelects(row, ['existingGatewayType', 'existingGatewaySelect']);
    }

    // Configurações específicas por tipo de elemento
    if (elementTypeSelect.value === 'Data Object') {
      elementLaneSelect.style.display = 'none';
      if (!row.querySelector('.element-dataObjectDirection')) {
        row.insertBefore(dataObjectDirectionSelect, elementNameInput || row.querySelector('.element-lane'));
      }
      dataObjectDirectionSelect.style.display = '';
      hideOtherSelects(row, ['eventType', 'activityType', 'finalEventType', 'existingGatewayType', 'existingGatewaySelect']);
    } else if (elementTypeSelect.value === 'Fim') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.element-finalEventType')) {
        row.insertBefore(finalEventTypeSelect, elementNameInput || row.querySelector('.element-lane'));
      }
      finalEventTypeSelect.style.display = '';
      hideOtherSelects(row, ['eventType', 'activityType', 'dataObjectDirection', 'existingGatewayType', 'existingGatewaySelect']);
    } else if (elementTypeSelect.value === 'Atividade') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.element-activityType')) {
        row.insertBefore(activityTypeSelect, elementNameInput || row.querySelector('.element-lane'));
      }
      activityTypeSelect.style.display = '';
      hideOtherSelects(row, ['eventType', 'finalEventType', 'dataObjectDirection', 'existingGatewayType', 'existingGatewaySelect']);
    } else if (elementTypeSelect.value === 'Evento Intermediario') {
      elementLaneSelect.style.display = '';
      // Para Evento Intermediario, mantém o eventType visível se existir
      if (row.querySelector('.element-eventType')) {
        row.querySelector('.element-eventType').style.display = '';
      }
      hideOtherSelects(row, ['activityType', 'finalEventType', 'dataObjectDirection', 'existingGatewayType', 'existingGatewaySelect']);
    } else {
      elementLaneSelect.style.display = '';
      if (row.querySelector('.element-finalEventType')) {
        row.removeChild(finalEventTypeSelect);
      }
      hideOtherSelects(row, ['eventType', 'activityType', 'finalEventType', 'dataObjectDirection', 'existingGatewayType', 'existingGatewaySelect']);
    }
  }

  // Função para atualizar opções de gateways existentes
  function updateExistingGatewayOptions(currentRow, gatewaySelect, gatewayType) {
    // Limpa as opções atuais (mantém a primeira que é o placeholder)
    gatewaySelect.innerHTML = '<option value="">Selecione um gateway</option>';
    
    // Encontra o índice da linha atual
    const allRows = Array.from(document.querySelectorAll('.element-row'));
    const currentRowIndex = allRows.indexOf(currentRow);
    
    // Busca por gateways do mesmo tipo em outras linhas
    allRows.forEach((row, index) => {
      if (index !== currentRowIndex) {
        const elementType = row.querySelector('.element-type').value;
        if (elementType === gatewayType) {
          const elementNumber = index + 1;
          const option = document.createElement('option');
          option.value = elementNumber;
          option.textContent = `Elemento ${elementNumber}`;
          gatewaySelect.appendChild(option);
        }
      }
    });
  }

  // Event listener para atualizar gateways quando o tipo muda
  existingGatewayTypeSelect.addEventListener('change', () => {
    updateExistingGatewayOptions(row, existingGatewaySelect, existingGatewayTypeSelect.value);
  });

  // Função auxiliar para ocultar outros selects
  function hideOtherSelects(row, typesToHide) {
    typesToHide.forEach(type => {
      const element = row.querySelector(`.element-${type}`);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  // Chama ao iniciar e ao mudar o tipo
  updateRowFields();
  elementTypeSelect.addEventListener('change', updateRowFields);
}

/**
 * Configura os event listeners da linha
 */
function setupRowEventListeners(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                               eventTypeSelect, participantsOptions, externalParticipantsOptions, elementsContainer) {
  
  elementTypeSelect.addEventListener('change', () => {
    // Evento Intermediario: adiciona o select de eventType
    if (elementTypeSelect.value === 'Evento Intermediario') {
      if (!row.querySelector('.element-eventType')) {
        // Insere antes do campo nome se existir, senão antes do lane
        const insertBefore = elementNameInput || row.querySelector('.element-lane');
        row.insertBefore(eventTypeSelect, insertBefore);
        
        // MUDANÇA MÍNIMA: Adiciona listeners apenas para o eventType criado dinamicamente
        if (globalUpdateDiagramCallback) {
          eventTypeSelect.addEventListener('input', globalUpdateDiagramCallback);
          eventTypeSelect.addEventListener('change', globalUpdateDiagramCallback);
        }
      }
      eventTypeSelect.style.display = '';
    } else {
      if (row.querySelector('.element-eventType')) {
        row.removeChild(eventTypeSelect);
      }
    }

    // Atualiza opções de lane baseado no tipo
    if (elementTypeSelect.value === 'Mensagem') {
      elementLaneSelect.innerHTML = externalParticipantsOptions;
    } else {
      elementLaneSelect.innerHTML = participantsOptions;
    }
  });

  // Event listener para remover a linha
  row.querySelector('.removeElementRow').addEventListener('click', () => {
    const elementType = row.querySelector('.element-type').value;
    
    // Se for um gateway, fazer cleanup dos branches antes de remover
    if (elementType === 'Gateway Exclusivo' || elementType === 'Gateway Paralelo') {
      // Gera o ID do gateway da mesma forma que o gatewayCounter
      const branchContainer = row.closest('.branch-elements');
      let gatewayId;
      
      if (branchContainer) {
        // Estamos dentro de uma branch - usar ID mais específico
        const branchId = branchContainer.id; // branch-elements-gatewayX-branchY
        const allRowsInBranch = Array.from(branchContainer.querySelectorAll('.element-row'));
        const rowIndex = allRowsInBranch.indexOf(row);
        gatewayId = `${branchId}_gateway_${elementType.replace(' ', '')}_${rowIndex}`;
      } else {
        // Estamos no container principal
        const allRows = Array.from(document.querySelectorAll('#elementsContainer .element-row'));
        const rowIndex = allRows.indexOf(row);
        gatewayId = `gateway_${elementType.replace(' ', '')}_${rowIndex}`;
      }
      
      cleanupGatewayBranches(gatewayId);
    }
    
    row.remove();
    
    // Usa numeração com branches se houver branches ativas, senão usa a padrão
    if (hasActiveBranches()) {
      updateElementNumbersWithBranches();
    } else {
      updateElementNumbers(elementsContainer);
    }
    
    updateAllExistingGatewaySelects(); // Atualiza selects após remover elemento
  });

  // Event listeners para botões de movimento
  row.querySelector('.move-up').addEventListener('click', () => {
    moveElementUp(row, elementsContainer);
    // Atualiza numeração após movimento
    if (hasActiveBranches()) {
      updateElementNumbersWithBranches();
    }
  });

  row.querySelector('.move-down').addEventListener('click', () => {
    moveElementDown(row, elementsContainer);
    // Atualiza numeração após movimento
    if (hasActiveBranches()) {
      updateElementNumbersWithBranches();
    }
  });
}

/**
 * Atualiza todos os selects de gateways existentes
 */
export function updateAllExistingGatewaySelects() {
  const rows = document.querySelectorAll('.element-row');
  rows.forEach(row => {
    const elementType = row.querySelector('.element-type').value;
    if (elementType === 'Gateway Existente') {
      const gatewaySelect = row.querySelector('.element-existingGatewaySelect');
      const gatewayTypeSelect = row.querySelector('.element-existingGatewayType');
      if (gatewaySelect && gatewayTypeSelect) {
        updateExistingGatewayOptionsGlobal(row, gatewaySelect, gatewayTypeSelect.value);
      }
    }
  });
}

/**
 * Função global para atualizar opções de gateways existentes
 */
function updateExistingGatewayOptionsGlobal(currentRow, gatewaySelect, gatewayType) {
  // Limpa as opções atuais (mantém a primeira que é o placeholder)
  gatewaySelect.innerHTML = '<option value="">Selecione um gateway</option>';
  
  // Encontra o índice da linha atual
  const allRows = Array.from(document.querySelectorAll('.element-row'));
  const currentRowIndex = allRows.indexOf(currentRow);
  
  // Busca por gateways do mesmo tipo em outras linhas
  allRows.forEach((row, index) => {
    if (index !== currentRowIndex) {
      const elementType = row.querySelector('.element-type').value;
      if (elementType === gatewayType) {
        const elementNumber = index + 1;
        const option = document.createElement('option');
        option.value = elementNumber;
        option.textContent = `Elemento ${elementNumber}`;
        gatewaySelect.appendChild(option);
      }
    }
  });
}
