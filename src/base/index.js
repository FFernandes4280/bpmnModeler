import BpmnViewer from 'bpmn-js';
import { generateDiagramFromInput } from './chatbot.js';
import { addElementRow } from './modules/ui/rowManager.js';
import { createGatewayCounter, ensureGatewayCounterSeparation } from './modules/ui/gatewayCounter.js';
import { updateDiagram } from './modules/diagram/diagramUpdater.js';
import { setupRealtimeUpdate, setupElementRowListeners } from './modules/diagram/realtimeSystem.js';
import { setupCanvasDragBehavior } from './modules/canvas/canvasControls.js';
import { getParticipantsOptions } from './modules/utils/domHelpers.js';
import { downloadDiagram } from './modules/utils/download.js';

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================
const viewer = new BpmnViewer({ container: '#canvas' });

const elementsContainer = document.getElementById('elementsContainer');
const addElementRowButton = document.getElementById('addElementRow');
const participantsInput = document.getElementById('participants');
const initialEventLaneSelect = document.getElementById('initialEventLane');
const hasExternalParticipantsSelect = document.getElementById('hasExternalParticipants');
const externalParticipantsContainer = document.getElementById('externalParticipantsContainer');

// Variável global para armazenar o XML
window.lastDiagramXML = '';

// ===================================================================
// CONFIGURAÇÃO DE EVENT LISTENERS PRINCIPAIS
// ===================================================================

// Função wrapper para updateDiagram com dependências
const updateDiagramWrapper = () => updateDiagram(
  viewer, 
  generateDiagramFromInput, 
  () => setupCanvasDragBehavior(viewer), 
  elementsContainer
);

// Adiciona uma nova linha ao clicar no botão
addElementRowButton.addEventListener('click', () => {
  addElementRow(elementsContainer, participantsInput);
  // Garante separação visual dos elementos
  setTimeout(ensureGatewayCounterSeparation, 100);
  // Configura listeners para a nova linha
  setTimeout(() => setupElementRowListeners(updateDiagramWrapper), 100);
});

// Atualiza opções de participantes
participantsInput.addEventListener('input', () => {
  const participantsOptions = getParticipantsOptions(participantsInput)
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
// INICIALIZAÇÃO DO SISTEMA
// ===================================================================

// Inicializa o sistema de atualização em tempo real quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  setupRealtimeUpdate(updateDiagramWrapper, elementsContainer);
  setupElementRowListeners(updateDiagramWrapper);
  ensureGatewayCounterSeparation();
});

// Fallback caso o DOMContentLoaded já tenha disparado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupRealtimeUpdate(updateDiagramWrapper, elementsContainer);
    setupElementRowListeners(updateDiagramWrapper);
    ensureGatewayCounterSeparation();
  });
} else {
  setupRealtimeUpdate(updateDiagramWrapper, elementsContainer);
  setupElementRowListeners(updateDiagramWrapper);
  ensureGatewayCounterSeparation();
}
