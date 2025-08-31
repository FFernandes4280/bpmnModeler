/**
 * Gerenciamento da atualização do diagrama
 */

import { validateRequiredFields } from '../utils/validation.js';
import { getParticipantsOptions } from '../utils/domHelpers.js';
import { processElementsFromUI, processDuplicateElements } from './elementProcessor.js';

// Variável para controle de debounce
let updateTimeout;

/**
 * Atualiza o diagrama com debounce
 * @param {Object} viewer - Instância do BpmnViewer
 * @param {Function} generateDiagramFromInput - Função para gerar XML do diagrama
 * @param {Function} setupCanvasDragBehavior - Função para configurar canvas
 * @param {HTMLElement} elementsContainer - Container dos elementos
 */
export async function updateDiagram(viewer, generateDiagramFromInput, setupCanvasDragBehavior, elementsContainer) {
  // Cancela o timeout anterior se existir
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  
  // Define um novo timeout para executar a atualização após 300ms
  updateTimeout = setTimeout(async () => {
    await performDiagramUpdate(viewer, generateDiagramFromInput, setupCanvasDragBehavior, elementsContainer);
  }, 300);
}

/**
 * Executa a atualização do diagrama
 */
async function performDiagramUpdate(viewer, generateDiagramFromInput, setupCanvasDragBehavior, elementsContainer) {
  // Verificação silenciosa - só atualiza se todos os campos estão preenchidos
  if (!validateRequiredFields(false)) {
    return; // Retorna silenciosamente sem exibir erro no console
  }

  // Obter valores dos campos
  const processName = document.getElementById('processName').value;
  const participantsInput = document.getElementById('participants');
  const participants = getParticipantsOptions(participantsInput);
  const hasExternalParticipants = document.getElementById('hasExternalParticipants').value;
  const externalParticipants = document.getElementById('externalParticipants').value.split(',').map(participant => participant.trim());
  const initialEventName = document.getElementById('initialEventName').value;
  const initialEventType = document.getElementById('initialEventType').value;
  const initialEventLane = document.getElementById('initialEventLane').value;

  // Criar elemento inicial
  const initialElement = {
    index: 0,
    type: 'Inicio',
    name: initialEventType+ "_" + initialEventName,
    lane: initialEventLane
  };

  // Processamento dos elementos (incluindo o inicial como primeiro)
  const uiElements = processElementsFromUI(elementsContainer);
  const elements = [initialElement, ...uiElements];
  
  // Processamento de duplicatas para inserção de gateways
  const processedElements = processDuplicateElements(elements);
  console.log('Processed Elements:', processedElements);
  try {
    const diagramXML = await generateDiagramFromInput(
      processName,
      participants,
      hasExternalParticipants,
      externalParticipants,
      processedElements
    );

    // Salva o XML globalmente
    window.lastDiagramXML = diagramXML;
    await viewer.importXML(diagramXML);
    setupCanvasDragBehavior();
  } catch (error) {
    console.error('Error generating diagram:', error);
  }
}
