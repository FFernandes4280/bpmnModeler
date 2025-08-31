/**
 * Gerenciamento de linhas de elementos
 */

import { getParticipantsOptions, updateElementNumbers, moveElementUp, moveElementDown } from '../utils/domHelpers.js';
import { 
  createEventTypeSelect, 
  createActivityTypeSelect, 
  createFinalEventTypeSelect, 
  createDataObjectDirectionSelect 
} from './elementCreators.js';
import { createGatewayCounter } from './gatewayCounter.js';

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
  const gatewayCounter = createGatewayCounter();

  // Elementos da linha atual
  const elementTypeSelect = row.querySelector('.element-type');
  const elementLaneSelect = row.querySelector('.element-lane');
  let elementNameInput = row.querySelector('.element-name');

  // Configurar comportamentos da linha
  setupRowFieldsVisibility(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                          eventTypeSelect, activityTypeSelect, finalEventTypeSelect, 
                          dataObjectDirectionSelect, gatewayCounter);
  
  setupRowEventListeners(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                        eventTypeSelect, participantsOptions, externalParticipantsOptions, elementsContainer);

  elementsContainer.appendChild(row);
  updateElementNumbers(elementsContainer);
}

/**
 * Configura a visibilidade dos campos baseado no tipo
 */
function setupRowFieldsVisibility(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                                  eventTypeSelect, activityTypeSelect, finalEventTypeSelect, 
                                  dataObjectDirectionSelect, gatewayCounter) {
  
  function updateRowFields() {
    // Atualiza o placeholder baseado no tipo de elemento
    if (elementTypeSelect.value === 'Gateway Exclusivo' || elementTypeSelect.value === 'Gateway Paralelo') {
      // Remove completamente o campo nome para gateways
      if (elementNameInput && elementNameInput.parentNode) {
        elementNameInput.parentNode.removeChild(elementNameInput);
        elementNameInput = null;
      }
      if (!row.querySelector('.gateway-counter')) {
        row.insertBefore(gatewayCounter, row.querySelector('.element-lane'));
      }
      gatewayCounter.style.display = 'flex';
      
      // Atualiza o select de gateways existentes se estiver visível
      const gatewaySelect = gatewayCounter.querySelector('.gateway-select');
      if (gatewaySelect && gatewaySelect.style.display !== 'none') {
        gatewayCounter.updateGatewaySelect(elementTypeSelect.value);
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
      elementNameInput.placeholder = 'Nome';
      elementNameInput.style.display = '';
      if (row.querySelector('.gateway-counter')) {
        gatewayCounter.style.display = 'none';
      }
    }

    // Configurações específicas por tipo de elemento
    if (elementTypeSelect.value === 'Data Object') {
      elementLaneSelect.style.display = 'none';
      if (!row.querySelector('.element-dataObjectDirection')) {
        row.insertBefore(dataObjectDirectionSelect, elementNameInput);
      }
      dataObjectDirectionSelect.style.display = '';
      hideOtherSelects(row, ['eventType', 'activityType', 'finalEventType']);
      elementNameInput.style.display = '';
    } else if (elementTypeSelect.value === 'Fim') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.element-finalEventType')) {
        row.insertBefore(finalEventTypeSelect, elementNameInput);
      }
      finalEventTypeSelect.style.display = '';
      hideOtherSelects(row, ['eventType', 'activityType', 'dataObjectDirection']);
      elementNameInput.style.display = '';
    } else if (elementTypeSelect.value === 'Atividade') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.element-activityType')) {
        row.insertBefore(activityTypeSelect, elementNameInput);
      }
      activityTypeSelect.style.display = '';
      hideOtherSelects(row, ['eventType', 'finalEventType', 'dataObjectDirection']);
      elementNameInput.style.display = '';
    } else {
      elementLaneSelect.style.display = '';
      if (row.querySelector('.element-finalEventType')) {
        row.removeChild(finalEventTypeSelect);
      }
      hideOtherSelects(row, ['activityType', 'dataObjectDirection']);
      if (row.querySelector('.element-eventType')) {
        row.querySelector('.element-eventType').style.display = '';
      }
      elementNameInput.style.display = '';
    }
  }

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
        row.insertBefore(eventTypeSelect, elementNameInput);
      }
    } else {
      if (row.querySelector('.element-eventType')) {
        row.removeChild(eventTypeSelect);
      }
    }

    // Configuração específica para Mensagem
    if (elementTypeSelect.value === 'Mensagem') {
      // Substitui o campo de entrada por um select com opções "Envio" e "Recebimento"
      const nameSelect = document.createElement('select');
      nameSelect.className = 'element-name';
      nameSelect.innerHTML = `
        <option value="Envio">Envio</option>
        <option value="Recebimento">Recebimento</option>
      `;
      row.replaceChild(nameSelect, elementNameInput);
      elementNameInput = nameSelect;
    } else {
      // Substitui o select por um campo de entrada de texto
      if (elementNameInput.tagName.toLowerCase() !== 'input') {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'element-name';
        nameInput.placeholder = elementTypeSelect.value === 'Gateway Exclusivo' || elementTypeSelect.value === 'Gateway Paralelo' 
          ? 'Número de divergências' : 'Nome';
        row.replaceChild(nameInput, elementNameInput);
        elementNameInput = nameInput;
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
    row.remove();
    updateElementNumbers(elementsContainer);
  });

  // Event listeners para botões de movimento
  row.querySelector('.move-up').addEventListener('click', () => {
    moveElementUp(row, elementsContainer);
  });

  row.querySelector('.move-down').addEventListener('click', () => {
    moveElementDown(row, elementsContainer);
  });
}
