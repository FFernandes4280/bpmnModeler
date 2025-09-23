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
    type: 'Inicio',
    name: initialEventType+ "_" + initialEventName,
    lane: initialEventLane
  };

  // Processamento dos elementos (incluindo o inicial como primeiro)
  const uiElements = processElementsFromUI(elementsContainer);
  const elements = [initialElement, ...uiElements];
  
  // const processedElements = processDuplicateElements(elements);
  const processedElements = [
  {
    "type": "Inicio",
    "name": "Padrão_Artigo recebido",
    "lane": "Comissão julgadora"
  },
  {
    "type": "Gateway Exclusivo",
    "name": "followingArtigo_recebido",
    "lane": "Comissão julgadora",
    "diverge": [2],
    "index": 1
  },
  {
    "type": "Atividade",
    "name": "Default_Checar formatação",
    "lane": "Comissão julgadora",
    "index": 2
  },
  {
    "type": "Data Object",
    "name": "Entrada_Norma de formatação",
    "lane": "Comissão julgadora",
    "index": 2
  },
  {
    "type": "Gateway Exclusivo",
    "name": "followingDefault_Checar_formatao",
    "lane": "Comissão julgadora",
    "diverge": [4, 10, 13],
    "index": 3
  },
  {
    "type": "Evento Intermediario",
    "name": "Padrão_Artigo com formatação aprovada",
    "lane": "Comissão julgadora",
    "index": 4
  },
  {
    "type": "Gateway Exclusivo",
    "name": "followingPadro_Artigo_com_formatao_aprovada",
    "lane": "Comissão julgadora",
    "diverge": [6],
    "index": 5
  },
  {
    "type": "Atividade",
    "name": "Default_Avaliar o artigo",
    "lane": "Comissão julgadora",
    "index": 6
  },
  {
    "type": "Gateway Exclusivo",
    "name": "followingDefault_Avaliar_o_artigo",
    "lane": "Comissão julgadora",
    "diverge": [8, 9],
    "index": 7
  },
  {
    "type": "Fim",
    "name": "Padrão_Artigo avaliado para apresentação oral",
    "lane": "Comissão julgadora",
    "index": 8
  },
  {
    "type": "Fim",
    "name": "Padrão_Artigo indicado para apresentação em poster",
    "lane": "Comissão julgadora",
    "index": 9
  },
  {
    "type": "Evento Intermediario",
    "name": "Default_Identificadas falhas pequenas de formatação",
    "lane": "Comissão julgadora",
    "index": 10
  },
  {
    "type": "Atividade",
    "name": "Default_Corrigir falhas",
    "lane": "Comissão julgadora",
    "index": 11
  },
  {
    "type": "Gateway Existente",
    "name": "followingPadro_Artigo_com_formatao_aprovada",
    "lane": "Comissão julgadora",
    "originalType": "Gateway Exclusivo",
    "index": 12
  },
  {
    "type": "Evento Intermediario",
    "name": "Padrão_Artigo com formatação reprovada",
    "lane": "Comissão julgadora",
    "index": 13
  },
  {
    "type": "Gateway Existente",
    "name": "followingArtigo_recebido",
    "lane": "Comissão julgadora",
    "originalType": "Gateway Exclusivo",
    "index": 14
  }
];
  try {
    console.log('Processed Elements:', processedElements);
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
