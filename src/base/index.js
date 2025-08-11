import BpmnViewer from 'bpmn-js';
import { generateDiagramFromInput } from './chatbot.js';

const viewer = new BpmnViewer({ container: '#canvas' });

const elementsContainer = document.getElementById('elementsContainer');
const addElementRowButton = document.getElementById('addElementRow');
const participantsInput = document.getElementById('participants');

// Função para obter os participantes como opções
function getParticipantsOptions() {
  return participantsInput.value
    .split(',')
    .map(participant => participant.trim())
    .filter(participant => participant !== '');
}

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

  const eventTypeSelect = document.createElement('select');
  eventTypeSelect.className = 'element-eventType';
  eventTypeSelect.innerHTML = `
    <option value="Padrão">Padrão</option>
    <option value="Mensagem">Mensagem</option>
    <option value="Timer">Timer</option>
    <option value="Erro">Erro</option>
  `;

  // Cria o select para o tipo de atividade
  const activityTypeSelect = document.createElement('select');
  activityTypeSelect.className = 'element-activityType';
  activityTypeSelect.innerHTML = `
    <option value="Default">Padrão</option>
    <option value="In">Recebimento</option>
    <option value="Out">Envio</option>
  `;

  // Cria o select para o tipo do evento final
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

  // Add event listener to update element-lane options based on element-type
  const elementTypeSelect = row.querySelector('.element-type');
  const elementLaneSelect = row.querySelector('.element-lane');
  let elementNameInput = row.querySelector('.element-name');

  // Cria o select para o tipo de data object (envio/recebimento)
  const dataObjectDirectionSelect = document.createElement('select');
  dataObjectDirectionSelect.className = 'element-dataObjectDirection';
  dataObjectDirectionSelect.innerHTML = `
    <option value="Envio">Envio</option>
    <option value="Recebimento">Recebimento</option>
  `;

  // Cria o contador para gateways
  const gatewayCounter = document.createElement('div');
  gatewayCounter.className = 'gateway-counter';
  gatewayCounter.innerHTML = `
    <button type="button" class="counter-btn counter-decrease">-</button>
    <span class="counter-value">Convergência</span>
    <button type="button" class="counter-btn counter-increase">+</button>
  `;

  let counterValue = 0; // 0 = Convergência, 1+ = números

  // Event listeners para o contador dos gateways
  gatewayCounter.querySelector('.counter-decrease').addEventListener('click', () => {
    if (counterValue > 0) {
      counterValue--;
      const valueSpan = gatewayCounter.querySelector('.counter-value');
      if (counterValue === 0) {
        valueSpan.textContent = 'Convergência';
      } else {
        valueSpan.textContent = counterValue + 1; // +1 porque começamos do 2
      }
    }
  });

  gatewayCounter.querySelector('.counter-increase').addEventListener('click', () => {
    counterValue++;
    const valueSpan = gatewayCounter.querySelector('.counter-value');
    if (counterValue === 1) {
      valueSpan.textContent = '2';
    } else {
      valueSpan.textContent = counterValue + 1;
    }
  });

  // Função para mostrar/ocultar campos conforme o tipo
  function updateRowFields() {
    // Atualiza o placeholder baseado no tipo de elemento
    if (elementTypeSelect.value === 'Gateway Exclusivo' || elementTypeSelect.value === 'Gateway Paralelo') {
      elementNameInput.style.display = 'none';
      if (!row.querySelector('.gateway-counter')) {
        row.insertBefore(gatewayCounter, elementNameInput);
      }
      gatewayCounter.style.display = 'flex';
    } else {
      elementNameInput.placeholder = 'Nome';
      elementNameInput.style.display = '';
      if (row.querySelector('.gateway-counter')) {
        gatewayCounter.style.display = 'none';
      }
    }

    if (elementTypeSelect.value === 'Data Object') {
      elementLaneSelect.style.display = 'none';
      if (!row.querySelector('.element-dataObjectDirection')) {
        row.insertBefore(dataObjectDirectionSelect, elementNameInput);
      }
      dataObjectDirectionSelect.style.display = '';
      if (row.querySelector('.element-eventType')) {
        row.querySelector('.element-eventType').style.display = 'none';
      }
      if (row.querySelector('.element-activityType')) {
        row.querySelector('.element-activityType').style.display = 'none';
      }
      if (row.querySelector('.element-finalEventType')) {
        row.querySelector('.element-finalEventType').style.display = 'none';
      }
      elementNameInput.style.display = '';
    } else if (elementTypeSelect.value === 'Fim') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.element-finalEventType')) {
        row.insertBefore(finalEventTypeSelect, elementNameInput);
      }
      finalEventTypeSelect.style.display = '';
      if (row.querySelector('.element-eventType')) {
        row.querySelector('.element-eventType').style.display = 'none';
      }
      if (row.querySelector('.element-activityType')) {
        row.querySelector('.element-activityType').style.display = 'none';
      }
      if (row.querySelector('.element-dataObjectDirection')) {
        row.querySelector('.element-dataObjectDirection').style.display = 'none';
      }
      elementNameInput.style.display = '';
    } else if (elementTypeSelect.value === 'Atividade') {
      elementLaneSelect.style.display = '';
      if (!row.querySelector('.element-activityType')) {
        row.insertBefore(activityTypeSelect, elementNameInput);
      }
      activityTypeSelect.style.display = '';
      if (row.querySelector('.element-eventType')) {
        row.querySelector('.element-eventType').style.display = 'none';
      }
      if (row.querySelector('.element-finalEventType')) {
        row.querySelector('.element-finalEventType').style.display = 'none';
      }
      if (row.querySelector('.element-dataObjectDirection')) {
        row.querySelector('.element-dataObjectDirection').style.display = 'none';
      }
      elementNameInput.style.display = '';
    } else {
      elementLaneSelect.style.display = '';
      if (row.querySelector('.element-finalEventType')) {
        row.removeChild(finalEventTypeSelect);
      }
      if (row.querySelector('.element-activityType')) {
        row.querySelector('.element-activityType').style.display = 'none';
      }
      if (row.querySelector('.element-dataObjectDirection')) {
        row.querySelector('.element-dataObjectDirection').style.display = 'none';
      }
      if (row.querySelector('.element-eventType')) {
        row.querySelector('.element-eventType').style.display = '';
      }
      elementNameInput.style.display = '';
    }
  }

  // Chame ao iniciar e ao mudar o tipo
  updateRowFields();
  elementTypeSelect.addEventListener('change', updateRowFields);

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
        // Define o placeholder baseado no tipo de elemento
        if (elementTypeSelect.value === 'Gateway Exclusivo' || elementTypeSelect.value === 'Gateway Paralelo') {
          nameInput.placeholder = 'Número de divergências';
        } else {
          nameInput.placeholder = 'Nome';
        }
        row.replaceChild(nameInput, elementNameInput);
        elementNameInput = nameInput;
      }
    }

    if (elementTypeSelect.value === 'Mensagem') {
      elementLaneSelect.innerHTML = externalParticipantsOptions;
    } else {
      elementLaneSelect.innerHTML = participantsOptions;
    }
  });

  // Add event listener to remove the row
  row.querySelector('.removeElementRow').addEventListener('click', () => {
    row.remove();
    updateElementNumbers();
  });

  // Add event listeners for move buttons
  row.querySelector('.move-up').addEventListener('click', () => {
    moveElementUp(row);
  });

  row.querySelector('.move-down').addEventListener('click', () => {
    moveElementDown(row);
  });

  elementsContainer.appendChild(row);
  updateElementNumbers();
  updateElementNumbers();
}

// Adiciona uma nova linha ao clicar no botão
addElementRowButton.addEventListener('click', () => {
  addElementRow();
});

const initialEventLaneSelect = document.getElementById('initialEventLane');

participantsInput.addEventListener('input', () => {
  const participantsOptions = getParticipantsOptions()
    .map(participant => `<option value="${participant}">${participant}</option>`)
    .join('');

  initialEventLaneSelect.innerHTML = participantsOptions;
});

// Atualiza as opções de lane ao alterar os participantes
participantsInput.addEventListener('input', () => {
  const rows = elementsContainer.querySelectorAll('.element-row');
  const participantsOptions = getParticipantsOptions()
    .map(participant => `<option value="${participant}">${participant}</option>`)
    .join('');

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

let lastDiagramXML = ''; // Variável para armazenar o XML mais recente

async function updateDiagram() {
  const processName = document.getElementById('processName').value;
  const participants = getParticipantsOptions();
  const hasExternalParticipants = document.getElementById('hasExternalParticipants').value;
  const externalParticipants = document.getElementById('externalParticipants').value.split(',').map(participant => participant.trim());
  const initialEventName = document.getElementById('initialEventName').value;
  const initialEventType = document.getElementById('initialEventType').value;
  const initialEventLane = document.getElementById('initialEventLane').value;
  if(!processName || !participants.length || !initialEventName || !initialEventLane) {
    console.error('Preencha todos os campos obrigatórios.');
    return;
  }

  let previousName = initialEventName;
  const elements = Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => {
    const type = row.querySelector('.element-type').value;
    const lane = row.querySelector('.element-lane').value;
    if(type !== 'Gateway Exclusivo' && type !== 'Gateway Paralelo') {
      let name = row.querySelector('.element-name').value;
      if(type === 'Evento Intermediario') {
        const eventType = row.querySelector('.element-eventType').value;
        name = eventType + '_' + name;
        previousName = name;
        return { type, name, lane };
      }
      if(type === 'Fim') {
        const finalEventType = row.querySelector('.element-finalEventType').value;
        name = finalEventType + '_' + name;
        previousName = name;
        return { type, name, lane };
      }
      if(type === 'Atividade') {
        const activityType = row.querySelector('.element-activityType').value;
        name = activityType + '_' + name;
        previousName = name;
        return { type, name, lane};
      }
      if(type === 'Data Object') {
        const dataObjectDirection = row.querySelector('.element-dataObjectDirection').value;
        name = dataObjectDirection + '_' + name;
        previousName = name;
        return { type, name, lane };
      }
      previousName = name;
      return { type, name, lane };
    }
    
    let normalizedName = previousName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const name = "following" + normalizedName;
    
    // Pega o valor do contador para gateways
    const counterElement = row.querySelector('.counter-value');
    let diverge;
    if (counterElement) {
      const counterText = counterElement.textContent;
      diverge = counterText === 'Convergência' ? 'Convergência' : counterText;
    } else {
      diverge = row.querySelector('.element-name').value;
    }
    
    return { type, name, lane, diverge };
  });
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
      diverge: 1
    };

    elements.splice(duplicates[0], 0, gateway);
    indexesList = indexesList.map(idx => (idx >= duplicates[0] ? idx + 1 : idx));

    duplicates.slice(1).forEach(idx => {
      elements[idx + 1] = gateway;
    });
  });

  try {
    const diagramXML = await generateDiagramFromInput(
      processName,
      participants,
      hasExternalParticipants,
      externalParticipants,
      initialEventName,
      initialEventType,
      initialEventLane,
      elements
    );

    lastDiagramXML = diagramXML; // Salva o XML para download

    await viewer.importXML(diagramXML);
    
    // Setup drag behavior only once
    setupCanvasDragBehavior();
  } catch (error) {
    console.error('Error generating diagram:', error);
  }
}

setInterval(updateDiagram, 2000);

const hasExternalParticipantsSelect = document.getElementById('hasExternalParticipants');
const externalParticipantsContainer = document.getElementById('externalParticipantsContainer');

hasExternalParticipantsSelect.addEventListener('change', () => {
  if (hasExternalParticipantsSelect.value === 'Sim') {
    externalParticipantsContainer.style.display = 'block';
  } else {
    externalParticipantsContainer.style.display = 'none';
  }
});

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

document.getElementById('saveDiagramButton').addEventListener('click', downloadDiagram);

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

let dragBehaviorSetup = false;

// Setup canvas drag behavior only once
function setupCanvasDragBehavior() {
  if (dragBehaviorSetup) return;
  
  const canvas = viewer.get('canvas');
  let isPanning = false;
  let lastMousePosition = { x: 0, y: 0 };
  let dragThreshold = 5; // Minimum distance to start dragging
  let dragStartPosition = { x: 0, y: 0 };
  let hasMoved = false;

  const canvasElement = document.querySelector('#canvas');

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

  // Setup return home button functionality
  document.getElementById('returnHomeButton').addEventListener('click', () => {
    canvas.viewbox({ x: 0, y: 0, width: 600, height: 600 });
  });
  
  dragBehaviorSetup = true;
}
