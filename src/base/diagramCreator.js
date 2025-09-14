import BpmnModdle from 'bpmn-moddle';
import processarElemento from '../functions/processarElemento.js';
import criarParticipantesExternos from '../functions/criarParticipantesExternos.js';

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

  // Função para calcular altura baseada na maior divergência
  function calcularAlturaParticipante() {
    let maiorDivergencia = 0;
    let defaultHeight = participantNumber * 200;
    // Procura por gateways e encontra a maior divergência
    if(!elements || elements.length === 0) {
      return defaultHeight;
    }
    
    elements.forEach(element => {
      if (element.type === 'Gateway Exclusivo' || element.type === 'Gateway Paralelo') {
        if (element.diverge && element.diverge.length > maiorDivergencia) {
          maiorDivergencia = element.diverge.length;
        }
      }
    });

    // Se não há divergências, usa altura baseada no número de participantes
    if (maiorDivergencia === 0) {
      return defaultHeight;
    }

    // Calcula altura baseada na maior divergência
    return defaultHeight + maiorDivergencia * 80;
  }

  // Define participant bounds
  const externalParticipantsCount = hasExternalParticipants === 'Sim' ? externalParticipants.length : 0;
  const participantBounds = {
    x: 160,
    y: 80 + externalParticipantsCount * 200 + (externalParticipantsCount > 0 ? 50 : 0),
    width: elements.length * 200 + 200,
    height: calcularAlturaParticipante(), // Executa a função e armazena o resultado
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  elements.some((element, index) => {
    const resultado = processarElemento(
      element,
      moddle,
      bpmnProcess,
      bpmnPlane,
      collaboration,
      elementsList.length ? elementsList[index - 1] : null,
      participantBounds,
      participants,
      laneHeight,
      externalParticipants,
      elements,
      0
    );

    if (Array.isArray(resultado)) {
      elementsList.push(...resultado);
    } else {
      elementsList.push(resultado);
    }
    return element.type.includes('Gateway') ? true : false;
  });

  // Finalize the diagram
  bpmnDiagram.plane = bpmnPlane;
  definitions.get('diagrams').push(bpmnDiagram);

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

