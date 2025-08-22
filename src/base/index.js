// ===================================================================
// IMPORTS E INICIALIZAÇÃO
// ===================================================================
import BpmnViewer from 'bpmn-js';
import { generateDiagramFromInput } from './chatbot.js';

const viewer = new BpmnViewer({ container: '#canvas' });

// ===================================================================
// ELEMENTOS DOM E VARIÁVEIS GLOBAIS
// ===================================================================
const elementsContainer = document.getElementById('elementsContainer');
const addElementRowButton = document.getElementById('addElementRow');
const participantsInput = document.getElementById('participants');
const initialEventLaneSelect = document.getElementById('initialEventLane');
const hasExternalParticipantsSelect = document.getElementById('hasExternalParticipants');
const externalParticipantsContainer = document.getElementById('externalParticipantsContainer');

let lastDiagramXML = ''; // Variável para armazenar o XML mais recente
let dragBehaviorSetup = false;

// ===================================================================
// FUNÇÕES UTILITÁRIAS
// ===================================================================

// Função para obter os participantes como opções
function getParticipantsOptions() {
  return participantsInput.value
    .split(',')
    .map(participant => participant.trim())
    .filter(participant => participant !== '');
}

// Função para atualizar a numeração dos elementos
function updateElementNumbers() {
  const rows = elementsContainer.querySelectorAll('.element-row');
  rows.forEach((row, index) => {
    const numberElement = row.querySelector('.element-number');
    if (numberElement) {
      numberElement.textContent = index + 1;
    }

    // Atualiza o estado dos botões de movimento
    const moveUpBtn = row.querySelector('.move-up');
    const moveDownBtn = row.querySelector('.move-down');

    if (moveUpBtn) {
      moveUpBtn.disabled = index === 0;
    }
    if (moveDownBtn) {
      moveDownBtn.disabled = index === rows.length - 1;
    }
  });
}

// Função para mover elemento para cima
function moveElementUp(row) {
  const previousRow = row.previousElementSibling;
  if (previousRow) {
    elementsContainer.insertBefore(row, previousRow);
    updateElementNumbers();
  }
}

// Função para mover elemento para baixo
function moveElementDown(row) {
  const nextRow = row.nextElementSibling;
  if (nextRow) {
    elementsContainer.insertBefore(nextRow, row);
    updateElementNumbers();
  }
}

// Função para baixar o diagrama como arquivo .bpmn
function downloadDiagram() {
  if (!lastDiagramXML) {
    alert('Nenhum diagrama gerado para salvar.');
    return;
  }
  const blob = new Blob([lastDiagramXML], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diagrama.bpmn';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===================================================================
// CRIAÇÃO DE ELEMENTOS DA INTERFACE
// ===================================================================

// Função para criar uma nova linha de elementos
function addElementRow() {
  const row = document.createElement('div');
  row.className = 'element-row';

  const participantsOptions = getParticipantsOptions()
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
                        eventTypeSelect, participantsOptions, externalParticipantsOptions);

  elementsContainer.appendChild(row);
  updateElementNumbers();
}

// Funções auxiliares para criação de elementos de seleção
function createEventTypeSelect() {
  const eventTypeSelect = document.createElement('select');
  eventTypeSelect.className = 'element-eventType';
  eventTypeSelect.innerHTML = `
    <option value="Padrão">Padrão</option>
    <option value="Mensagem">Mensagem</option>
    <option value="Timer">Timer</option>
    <option value="Erro">Erro</option>
  `;
  return eventTypeSelect;
}

function createActivityTypeSelect() {
  const activityTypeSelect = document.createElement('select');
  activityTypeSelect.className = 'element-activityType';
  activityTypeSelect.innerHTML = `
    <option value="Default">Padrão</option>
    <option value="In">Recebimento</option>
    <option value="Out">Envio</option>
  `;
  return activityTypeSelect;
}

function createFinalEventTypeSelect() {
  const finalEventTypeSelect = document.createElement('select');
  finalEventTypeSelect.className = 'element-finalEventType';
  finalEventTypeSelect.innerHTML = `
    <option value="Padrão">Padrão</option>
    <option value="Mensagem">Mensagem</option>
    <option value="Timer">Timer</option>
    <option value="Erro">Erro</option>
    <option value="Sinal">Sinal</option>
    <option value="Cancelamento">Cancelamento</option>
    <option value="Compensação">Compensação</option>
    <option value="Escalonamento">Escalonamento</option>
    <option value="Terminar">Terminar</option>
    <option value="Link">Link</option>
  `;
  return finalEventTypeSelect;
}

function createDataObjectDirectionSelect() {
  const dataObjectDirectionSelect = document.createElement('select');
  dataObjectDirectionSelect.className = 'element-dataObjectDirection';
  dataObjectDirectionSelect.innerHTML = `
    <option value="Envio">Envio</option>
    <option value="Recebimento">Recebimento</option>
  `;
  return dataObjectDirectionSelect;
}

function createGatewayCounter() {
  const gatewayCounter = document.createElement('div');
  gatewayCounter.className = 'gateway-counter';
  gatewayCounter.innerHTML = `
    <button type="button" class="counter-btn counter-decrease">-</button>
    <span class="counter-value">Convergência</span>
    <button type="button" class="counter-btn counter-increase">+</button>
    <select class="gateway-select" style="display: none; width: 100px; margin-left: 10px;">
      <option value="">Selecione...</option>
    </select>
  `;

  let counterValue = 0; // -1 = Gateway Existente, 0 = Convergência, 1+ = números

  // Função para atualizar o select de gateways existentes
  function updateGatewaySelect(gatewayType) {
    const select = gatewayCounter.querySelector('.gateway-select');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    // Encontra o índice da linha atual para excluí-la
    const currentRow = gatewayCounter.closest('.element-row');
    const allRows = Array.from(document.querySelectorAll('.element-row'));
    const currentRowIndex = allRows.indexOf(currentRow);
    
    // Busca por elementos que sejam gateways do mesmo tipo
    const rows = document.querySelectorAll('.element-row');
    rows.forEach((row, index) => {
      const elementType = row.querySelector('.element-type').value;
      // Só adiciona se for do mesmo tipo E não for a linha atual
      if (elementType === gatewayType && index !== currentRowIndex) {
        const elementNumber = index + 1; // +1 porque: 0=evento inicial, depois começam os elementos em 1
        const option = document.createElement('option');
        option.value = elementNumber;
        option.textContent = `Elemento ${elementNumber}`;
        select.appendChild(option);
      }
    });
  }

  // Event listeners para o contador dos gateways
  gatewayCounter.querySelector('.counter-decrease').addEventListener('click', () => {
    if (counterValue > -1) {
      counterValue--;
      const valueSpan = gatewayCounter.querySelector('.counter-value');
      const select = gatewayCounter.querySelector('.gateway-select');
      
      if (counterValue === -1) {
        valueSpan.textContent = 'Gateway Existente';
        select.style.display = 'inline-block';
        
        // Atualiza o select baseado no tipo de gateway atual
        const currentRow = gatewayCounter.closest('.element-row');
        if (currentRow) {
          const gatewayType = currentRow.querySelector('.element-type').value;
          updateGatewaySelect(gatewayType);
        }
      } else if (counterValue === 0) {
        valueSpan.textContent = 'Convergência';
        select.style.display = 'none';
      } else {
        valueSpan.textContent = counterValue + 1; // +1 porque começamos do 2
        select.style.display = 'none';
      }
    }
  });

  gatewayCounter.querySelector('.counter-increase').addEventListener('click', () => {
    counterValue++;
    const valueSpan = gatewayCounter.querySelector('.counter-value');
    const select = gatewayCounter.querySelector('.gateway-select');
    
    if (counterValue === -1) {
      valueSpan.textContent = 'Gateway Existente';
      select.style.display = 'inline-block';
      
      // Atualiza o select baseado no tipo de gateway atual
      const currentRow = gatewayCounter.closest('.element-row');
      if (currentRow) {
        const gatewayType = currentRow.querySelector('.element-type').value;
        updateGatewaySelect(gatewayType);
      }
    } else if (counterValue === 0) {
      valueSpan.textContent = 'Convergência';
      select.style.display = 'none';
    } else if (counterValue === 1) {
      valueSpan.textContent = '2';
      select.style.display = 'none';
    } else {
      valueSpan.textContent = counterValue + 1;
      select.style.display = 'none';
    }
  });

  // Adiciona a função updateGatewaySelect ao elemento para poder ser chamada externamente
  gatewayCounter.updateGatewaySelect = updateGatewaySelect;

  return gatewayCounter;
}

// ===================================================================
// CONFIGURAÇÃO DE COMPORTAMENTOS DA LINHA
// ===================================================================

// Função para mostrar/ocultar campos conforme o tipo
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

// Configurar event listeners da linha
function setupRowEventListeners(row, elementTypeSelect, elementLaneSelect, elementNameInput, 
                               eventTypeSelect, participantsOptions, externalParticipantsOptions) {
  
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
    updateElementNumbers();
  });

  // Event listeners para botões de movimento
  row.querySelector('.move-up').addEventListener('click', () => {
    moveElementUp(row);
  });

  row.querySelector('.move-down').addEventListener('click', () => {
    moveElementDown(row);
  });
}

// ===================================================================
// EVENT LISTENERS PRINCIPAIS
// ===================================================================

// Função para atualizar todos os selects de gateways existentes
function updateAllGatewaySelects() {
  const rows = document.querySelectorAll('.element-row');
  rows.forEach(row => {
    const gatewayCounter = row.querySelector('.gateway-counter');
    if (gatewayCounter && gatewayCounter.updateGatewaySelect) {
      const elementType = row.querySelector('.element-type').value;
      const gatewaySelect = gatewayCounter.querySelector('.gateway-select');
      if (gatewaySelect && gatewaySelect.style.display !== 'none') {
        gatewayCounter.updateGatewaySelect(elementType);
      }
    }
  });
}

// Adiciona uma nova linha ao clicar no botão
addElementRowButton.addEventListener('click', () => {
  addElementRow();
  // Atualiza os selects de gateways após adicionar novo elemento
  setTimeout(updateAllGatewaySelects, 100);
});

// Atualiza opções de participantes
participantsInput.addEventListener('input', () => {
  const participantsOptions = getParticipantsOptions()
    .map(participant => `<option value="${participant}">${participant}</option>`)
    .join('');

  initialEventLaneSelect.innerHTML = participantsOptions;

  // Atualiza as opções de lane nas linhas existentes
  const rows = elementsContainer.querySelectorAll('.element-row');
  rows.forEach(row => {
    const laneSelect = row.querySelector('.element-lane');
    const currentValue = laneSelect.value;

    laneSelect.innerHTML = participantsOptions;

    // Mantém o valor atual se ainda for válido
    if (Array.from(laneSelect.options).some(option => option.value === currentValue)) {
      laneSelect.value = currentValue;
    }
  });
});

// Controle de participantes externos
hasExternalParticipantsSelect.addEventListener('change', () => {
  if (hasExternalParticipantsSelect.value === 'Sim') {
    externalParticipantsContainer.style.display = 'block';
  } else {
    externalParticipantsContainer.style.display = 'none';
  }
});

// Event listener para salvar diagrama
document.getElementById('saveDiagramButton').addEventListener('click', downloadDiagram);

// ===================================================================
// PROCESSAMENTO E ATUALIZAÇÃO DO DIAGRAMA
// ===================================================================

// ===================================================================
// PROCESSAMENTO E ATUALIZAÇÃO DO DIAGRAMA
// ===================================================================

async function updateDiagram() {
  // Validação dos campos obrigatórios
  const processName = document.getElementById('processName').value;
  const participants = getParticipantsOptions();
  const hasExternalParticipants = document.getElementById('hasExternalParticipants').value;
  const externalParticipants = document.getElementById('externalParticipants').value.split(',').map(participant => participant.trim());
  const initialEventName = document.getElementById('initialEventName').value;
  const initialEventType = document.getElementById('initialEventType').value;
  const initialEventLane = document.getElementById('initialEventLane').value;
  
  if (!processName || !participants.length || !initialEventName || !initialEventLane) {
    console.error('Preencha todos os campos obrigatórios.');
    return;
  }

  // Processamento dos elementos
  const elements = processElementsFromUI();
  
  // Processamento de duplicatas para inserção de gateways
  const processedElements = processDuplicateElements(elements);

  try {
    const diagramXML = await generateDiagramFromInput(
      processName,
      participants,
      hasExternalParticipants,
      externalParticipants,
      initialEventName,
      initialEventType,
      initialEventLane,
      processedElements
    );

    lastDiagramXML = diagramXML; // Salva o XML para download
    await viewer.importXML(diagramXML);
    setupCanvasDragBehavior();
  } catch (error) {
    console.error('Error generating diagram:', error);
  }
}

// Função para processar elementos da UI
function processElementsFromUI() {
  let previousName = document.getElementById('initialEventName').value;
  
  return Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => {
    const type = row.querySelector('.element-type').value;
    const lane = row.querySelector('.element-lane').value;
    
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
      return { type, name, lane };
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

// Função para processar elementos duplicados e inserir gateways
function processDuplicateElements(elements) {
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

// Atualização automática do diagrama
setInterval(updateDiagram, 2000);

// Remove declarações duplicadas e organiza seções restantes

// ===================================================================
// CONTROLES DO CANVAS E ZOOM
// ===================================================================

// Setup canvas drag behavior only once
function setupCanvasDragBehavior() {
  if (dragBehaviorSetup) return;

  const canvas = viewer.get('canvas');
  const canvasElement = document.querySelector('#canvas');
  
  // Variáveis de controle
  let isPanning = false;
  let lastMousePosition = { x: 0, y: 0 };
  let dragThreshold = 5; // Minimum distance to start dragging
  let dragStartPosition = { x: 0, y: 0 };
  let hasMoved = false;
  let currentZoom = 1.0;
  const zoomStep = 0.2;
  const minZoom = 0.2;
  const maxZoom = 3.0;

  // ===================================================================
  // CONTROLES DE ARRASTAR (PAN)
  // ===================================================================
  
  canvasElement.addEventListener('mousedown', (event) => {
    // Only start panning with left mouse button
    if (event.button !== 0) return;

    isPanning = true;
    hasMoved = false;
    lastMousePosition = { x: event.clientX, y: event.clientY };
    dragStartPosition = { x: event.clientX, y: event.clientY };

    // Prevent text selection during drag
    event.preventDefault();
  });

  canvasElement.addEventListener('mousemove', (event) => {
    if (!isPanning) return;

    const deltaX = event.clientX - lastMousePosition.x;
    const deltaY = event.clientY - lastMousePosition.y;

    // Check if we've moved enough to start dragging
    const totalDistance = Math.sqrt(
      Math.pow(event.clientX - dragStartPosition.x, 2) +
      Math.pow(event.clientY - dragStartPosition.y, 2)
    );

    if (totalDistance > dragThreshold) {
      hasMoved = true;

      // Apply damping factor to make dragging less sensitive
      const dampingFactor = 0.8;

      canvas.scroll({
        dx: deltaX * dampingFactor,
        dy: deltaY * dampingFactor,
      });
    }

    lastMousePosition = { x: event.clientX, y: event.clientY };
  });

  canvasElement.addEventListener('mouseup', () => {
    isPanning = false;
    hasMoved = false;
  });

  canvasElement.addEventListener('mouseleave', () => {
    isPanning = false;
    hasMoved = false;
  });

  // Prevent context menu on right click
  canvasElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  // ===================================================================
  // CONTROLES DE ZOOM
  // ===================================================================

  // Setup return home button functionality
  document.getElementById('returnHomeButton').addEventListener('click', () => {
    currentZoom = 1.0;
    canvas.viewbox({ x: 0, y: 0, width: 850, height: 850 });
  });

  // Adiciona suporte para zoom com scroll do mouse
  canvasElement.addEventListener('wheel', (event) => {
    event.preventDefault();

    // Obtém as coordenadas do mouse relativas ao canvas
    const canvasRect = canvasElement.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;

    // Converte para coordenadas do viewbox
    const viewbox = canvas.viewbox();
    const worldX = viewbox.x + (mouseX / canvasRect.width) * viewbox.width;
    const worldY = viewbox.y + (mouseY / canvasRect.height) * viewbox.height;

    const oldZoom = currentZoom;
    const delta = event.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta));

    if (oldZoom === newZoom) return;

    currentZoom = newZoom;
    const scaleFactor = oldZoom / currentZoom;

    // Calcula as novas dimensões
    const newWidth = viewbox.width * scaleFactor;
    const newHeight = viewbox.height * scaleFactor;

    // Calcula a nova posição para manter o ponto do mouse como centro do zoom
    const newX = worldX - (mouseX / canvasRect.width) * newWidth;
    const newY = worldY - (mouseY / canvasRect.height) * newHeight;

    // Aplica o novo viewbox
    canvas.viewbox({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  });

  dragBehaviorSetup = true;
}
