import BpmnModdle from 'bpmn-moddle';
import processarElemento from '../functions/processarElemento.js';
import criarParticipantesExternos from '../functions/criarParticipantesExternos.js';
import criarEventoInicial from '../functions/criarEventoInicial.js';

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

export async function generateDiagramFromInput(processName, participantsInput, hasExternalParticipants, externalParticipantsInput, initialEventName, initialEventType, initialEventLane, elements) {
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
    height: participantNumber * 200 + 200,
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

  // Cria o evento inicial
  const { initialEvent, initialEventBounds } = criarEventoInicial(
    moddle,
    bpmnProcess,
    bpmnPlane,
    participantBounds,
    participants,
    laneHeight,
    initialEventName,
    initialEventType,
    initialEventLane
  );

  // Initialize stacks for elements and bounds
  let previousElements = [initialEvent];
  let previousBounds = [initialEventBounds];
  
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  for (const element of elements) {
    const currentElement = previousElements.pop();
    const currentBounds = previousBounds.pop();

    processarElemento(
      element,
      moddle,
      bpmnProcess,
      bpmnPlane,
      collaboration,
      currentElement,
      currentBounds,
      participantBounds,
      participants,
      laneHeight,
      externalParticipants,
      previousElements,
      previousBounds
    );
  }

  // Finalize the diagram
  bpmnDiagram.plane = bpmnPlane;
  definitions.get('diagrams').push(bpmnDiagram);

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);
  console.log(xmlStrUpdated);

  return xmlStrUpdated;
}

