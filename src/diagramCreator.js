import BpmnModdle from 'bpmn-moddle';
import processarElemento from './functions/processarElemento.js';
import criarParticipantesExternos from './functions/criarParticipantesExternos.js';
import { calcularAlturaParticipante } from './functions/calcularAlturaParticipante.js';

const moddle = new BpmnModdle();

const xmlStart =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
  'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
  'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
  'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ' +
  'id="Definitions_1a88msi" ' +
  'targetNamespace="http://bpmn.io/schema/bpmn">' +
  '</bpmn2:definitions>';

export async function generateDiagramFromInput(processName, participantsInput, hasExternalParticipants, externalParticipantsInput, elements) {


  const { rootElement: definitions } = await moddle.fromXML(xmlStart);

  // Create the process
  const bpmnProcess = moddle.create('bpmn:Process', { id: 'mainProcess', isExecutable: false });
  definitions.get('rootElements').push(bpmnProcess);

  // Create the lane set
  const laneSet = moddle.create('bpmn:LaneSet', { id: 'LaneSet' });
  bpmnProcess.get('laneSets').push(laneSet);

  // Define project name and participants
  let projectName = processName;
  let participants = participantsInput;
  let participantNumber = participants.length;

  let externalParticipants = externalParticipantsInput;

  // Create collaboration and participant
  const collaboration = moddle.create('bpmn:Collaboration', { id: 'Collaboration' });

  const participant = moddle.create('bpmn:Participant', {
    id: 'Participant',
    name: projectName,
    processRef: bpmnProcess,
  });
  collaboration.get('participants').push(participant);
  definitions.get('rootElements').push(collaboration);

  // Create the BPMNDiagram and BPMNPlane
  const bpmnDiagram = moddle.create('bpmndi:BPMNDiagram', { id: 'BPMNDiagram' });
  const bpmnPlane = moddle.create('bpmndi:BPMNPlane', { id: 'BPMNPlane', bpmnElement: collaboration });
  bpmnPlane.planeElement = [];



  // Define participant bounds
  const externalParticipantsCount = hasExternalParticipants === 'Sim' ? externalParticipants.length : 0;
  const participantBounds = {
    x: 160,
    y: 80 + externalParticipantsCount * 200 + (externalParticipantsCount > 0 ? 50 : 0),
    width: elements.length * 200 + 200,
    height: calcularAlturaParticipante(elements, participantNumber), // Usa a nova função importada
  };

  // Create a participant shape for the process
  const participantShape = moddle.create('bpmndi:BPMNShape', {
    id: 'Participant_di',
    bpmnElement: participant,
    isHorizontal: true,
    bounds: moddle.create('dc:Bounds', participantBounds),
  });
  bpmnPlane.planeElement.push(participantShape);

  // Cria os participantes externos se necessário
  if (hasExternalParticipants === 'Sim') {
    criarParticipantesExternos(
      moddle,
      definitions,
      collaboration,
      bpmnPlane,
      externalParticipants,
      participantBounds
    );
  }

  // Calculate lane height
  const laneHeight = participantBounds.height / participantNumber;

  // Create lanes and their shapes
  for (let i = 0; i < participantNumber; i++) {
    const lane = moddle.create('bpmn:Lane', {
      id: `Lane_${i + 1}`,
      name: participants[i],
      flowNodeRef: [],
    });
    laneSet.get('lanes').push(lane);

    const laneShape = moddle.create('bpmndi:BPMNShape', {
      id: `Lane_${i + 1}_di`,
      bpmnElement: lane,
      isHorizontal: true,
      bounds: moddle.create('dc:Bounds', {
        x: participantBounds.x + 30,
        y: participantBounds.y + i * laneHeight,
        width: participantBounds.width - 30,
        height: laneHeight,
      }),
    });

    bpmnPlane.planeElement.push(laneShape);
  }

  const elementsList = [];

  // Constantes para tipos auxiliares
  const AUXILIARY_TYPES = ['Data Object', 'Mensagem'];
  const isAuxiliaryElement = (type) => AUXILIARY_TYPES.includes(type);

  // Separa elementos do fluxo principal dos auxiliares (Data Object, Mensagem)
  const mainFlowElements = elements.filter(el => !isAuxiliaryElement(el.type));
  const auxiliaryElements = elements.filter(el => isAuxiliaryElement(el.type));
  
  // Cria um mapa de índices: índice original -> índice no mainFlowElements
  const indexMap = new Map();
  let mainFlowIndex = 0;
  elements.forEach((el, originalIndex) => {
    if (!isAuxiliaryElement(el.type)) {
      indexMap.set(originalIndex, mainFlowIndex);
      mainFlowIndex++;
    }
  });
  
  // Ajusta os índices de diverge nos elementos do fluxo principal
  const adjustedMainFlowElements = mainFlowElements.map(el => {
    if (el.diverge && Array.isArray(el.diverge)) {
      const adjustedDiverge = el.diverge.map(originalIndex => indexMap.get(originalIndex)).filter(idx => idx !== undefined);
      return {
        ...el,
        diverge: adjustedDiverge
      };
    }
    return el;
  });
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Processa primeiro o fluxo principal (sem elementos auxiliares)
  // Gateways Existentes serão processados em uma segunda passada
  adjustedMainFlowElements.some((element, index) => {
    const resultado = processarElemento(
      element,
      moddle,
      bpmnProcess,
      bpmnPlane,
      collaboration,
      elementsList.length ? elementsList[elementsList.length - 1] : null,
      participantBounds,
      participants,
      laneHeight,
      externalParticipants,
      adjustedMainFlowElements, // Passa elementos com índices ajustados
      0,
      adjustedMainFlowElements.length // Limite padrão: todos os elementos
    );

    if (Array.isArray(resultado)) {
      elementsList.push(...resultado);
    } else {
      elementsList.push(resultado);
    }
    
    // Para o loop apenas se for um gateway DE DIVERGÊNCIA (que tem campo diverge)
    // Gateways de convergência (sem diverge) continuam o fluxo normalmente
    const isGatewayWithDiverge = element.type.includes('Gateway') && element.diverge && element.diverge.length > 0;
    return isGatewayWithDiverge;
  });

  // Segunda passada: processa Gateways Existentes agora que todos os elementos foram criados
  adjustedMainFlowElements.forEach((element, index) => {
    if (element.type === 'Gateway Existente') {
      // Procura o elemento anterior ao Gateway Existente no array original
      const previousElement = index > 0 ? adjustedMainFlowElements[index - 1] : null;
      
      if (!previousElement) {
        console.warn(`⚠️ Gateway Existente sem elemento anterior: ${element.name}`);
        return;
      }
      
      // Procura o shape correspondente ao elemento anterior na lista processada
      let sourceElement = null;
      
      // Busca no bpmnPlane pelo elemento anterior já criado
      const planeElements = bpmnPlane.planeElement;
      for (let planeElement of planeElements) {
        if (planeElement.bpmnElement) {
          const bpmnEl = planeElement.bpmnElement;
          // Verifica se é o elemento anterior baseado no nome
          if (bpmnEl.name && previousElement.name) {
            const previousName = previousElement.name.split('_').pop(); // Remove prefixo Default_/Padrão_
            if (bpmnEl.name === previousName || bpmnEl.name.includes(previousName)) {
              sourceElement = planeElement;
              break;
            }
          }
        }
      }
      
      if (!sourceElement) {
        console.warn(`⚠️ Elemento source não encontrado para Gateway Existente: ${element.name}`);
        return;
      }
      
      // Cria um elemento temporário com type modificado para processar na segunda passada
      const elementoSegundaPassada = {
        ...element,
        type: 'Gateway Existente (segunda passada)'
      };
      
      processarElemento(
        elementoSegundaPassada,
        moddle,
        bpmnProcess,
        bpmnPlane,
        collaboration,
        sourceElement,
        participantBounds,
        participants,
        laneHeight,
        externalParticipants,
        adjustedMainFlowElements,
        0,
        adjustedMainFlowElements.length
      );
    }
  });

  // Processa elementos auxiliares depois, associando-os aos elementos já criados
  auxiliaryElements.forEach((auxElement) => {
    if (auxElement.type === 'Data Object') {
      // Encontra o elemento de referência através de busca por posição no array original
      let targetElement = null;

      // Encontra a posição do Data Object no array original de elementos
      const dataObjectPosition = elements.indexOf(auxElement);

      if (dataObjectPosition > 0) {
        // Busca o elemento anterior ao Data Object no array original
        const previousElement = elements[dataObjectPosition - 1];
        // Se o elemento anterior não é auxiliar, busca ele na lista processada
        if (!['Data Object', 'Mensagem'].includes(previousElement.type)) {
          // Encontra o índice do elemento anterior no mainFlowElements
          const previousIndex = mainFlowElements.indexOf(previousElement);
          if (previousIndex >= 0 && previousIndex < elementsList.length) {
            targetElement = elementsList[previousIndex];
          }
        }
      }

      // Se não encontrou por posição, usa o último elemento como fallback
      if (!targetElement && elementsList.length > 0) {
        targetElement = elementsList[elementsList.length - 1];
      }

      if (targetElement) {
        processarElemento(
          auxElement,
          moddle,
          bpmnProcess,
          bpmnPlane,
          collaboration,
          targetElement,
          participantBounds,
          participants,
          laneHeight,
          externalParticipants,
          elements, // Passa o array completo para referência
          0,
          elements.length // Limite padrão para elementos auxiliares
        );
      }
    } else if (auxElement.type === 'Mensagem') {


      // Para mensagens, encontra o elemento de referência através de busca por posição
      let targetElement = null;

      // Encontra a posição da mensagem no array original de elementos
      const messagePosition = elements.indexOf(auxElement);


      if (messagePosition > 0) {
        // Busca o elemento anterior à mensagem no array original
        const previousElement = elements[messagePosition - 1];
        // Se o elemento anterior não é auxiliar, busca ele na lista processada
        if (!['Data Object', 'Mensagem'].includes(previousElement.type)) {
          // Encontra o índice do elemento anterior no mainFlowElements
          const previousIndex = mainFlowElements.indexOf(previousElement);
          if (previousIndex >= 0 && previousIndex < elementsList.length) {
            targetElement = elementsList[previousIndex];

          }
        }
      }

      // Se não encontrou por posição, usa o último elemento como fallback
      if (!targetElement && elementsList.length > 0) {
        targetElement = elementsList[elementsList.length - 1];
      }


      processarElemento(
        auxElement,
        moddle,
        bpmnProcess,
        bpmnPlane,
        collaboration,
        targetElement,
        participantBounds,
        participants,
        laneHeight,
        externalParticipants,
        elements, // Passa o array completo para referência
        0,
        elements.length // Limite padrão para mensagens
      );

    }
  });

  // Finalize the diagram
  bpmnDiagram.plane = bpmnPlane;
  definitions.get('diagrams').push(bpmnDiagram);

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

