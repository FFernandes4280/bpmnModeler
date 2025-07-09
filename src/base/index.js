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
    <select class="element-type">
      <option value="Atividade">Atividade</option>
      <option value="Mensagem">Mensagem</option>
      <option value="Data Object">Data Object</option>
      <option value="Gateway Exclusivo">Gateway Exclusivo</option>
      <option value="Gateway Paralelo">Gateway Paralelo</option>
      <option value="Evento Intermediario">Evento Intermediario</option>
      <option value="Fim">Fim</option>
    </select>
    <input type="text" class="element-name" placeholder="Nome ou Divergência" />
    <select class="element-lane">
      ${participantsOptions}
    </select>
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

  // Função para mostrar/ocultar campos conforme o tipo
  function updateRowFields() {
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
        nameInput.placeholder = 'Nome ou Divergência';
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
  });

  elementsContainer.appendChild(row);
}

// Adiciona uma nova linha ao clicar no botão
addElementRowButton.addEventListener('click', addElementRow);

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
    const diverge = row.querySelector('.element-name').value;
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
    const canvas = viewer.get('canvas');
    
    // Implement drag behavior
    let isPanning = false;
    let lastMousePosition = { x: 0, y: 0 };

    const canvasElement = document.querySelector('#canvas');

    canvasElement.addEventListener('mousedown', (event) => {
      isPanning = true;
      lastMousePosition = { x: event.clientX, y: event.clientY };
    });

    canvasElement.addEventListener('mousemove', (event) => {
      if (!isPanning) return;

      const deltaX = event.clientX - lastMousePosition.x;
      const deltaY = event.clientY - lastMousePosition.y;

      canvas.scroll({
        dx: deltaX,
        dy: deltaY,
      });

      lastMousePosition = { x: event.clientX, y: event.clientY };
    });

    canvasElement.addEventListener('mouseup', () => {
      isPanning = false;
    });

    canvasElement.addEventListener('mouseleave', () => {
      isPanning = false;
    });

    document.getElementById('returnHomeButton').addEventListener('click', () => {
      canvas.viewbox({ x: 0, y: 0, width: 600, height: 600 }); // Ajuste os valores conforme necessário
    });
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
