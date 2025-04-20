import BpmnModdle from 'bpmn-moddle';
import criarGatewayExclusivo from './functions/criarGatewayExclusivo.js';

const moddle = new BpmnModdle();

async function generateDiagram() {
  const xmlStart =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" ' +
                       'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ' +
                       'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ' +
                       'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ' +
                       'id="Definitions_1a88msi" ' +
                       'targetNamespace="http://bpmn.io/schema/bpmn">' +
    '</bpmn2:definitions>';

  const { rootElement: definitions } = await moddle.fromXML(xmlStart);

  // Create the process
  const bpmnProcess = moddle.create('bpmn:Process', { id: 'Process', isExecutable: false });
  definitions.get('rootElements').push(bpmnProcess);

  // Create the BPMNDiagram and BPMNPlane
  const bpmnDiagram = moddle.create('bpmndi:BPMNDiagram', { id: 'BPMNDiagram' });
  const bpmnPlane = moddle.create('bpmndi:BPMNPlane', { id: 'BPMNPlane', bpmnElement: bpmnProcess });
  bpmnPlane.planeElement = [];
  bpmnDiagram.plane = bpmnPlane;
  definitions.get('diagrams').push(bpmnDiagram);

  // Define participant bounds
  const participantBounds = {
    x: 160,
    y: 80,
    width: 1070,
    height: 570,
  };

  // Create a participant shape for the process
  const participantShape = moddle.create('bpmndi:BPMNShape', {
    id: 'Participant_di',
    bpmnElement: bpmnProcess,
    isHorizontal: true,
    bounds: moddle.create('dc:Bounds', participantBounds),
  });
  bpmnPlane.planeElement.push(participantShape);

  // Define lane height and participants
  const laneHeight = participantBounds.height;
  const participants = ['Participante 1'];

  // Create the initial start event
  const startEventBounds = {
    x: participantBounds.x + 20,
    y: participantBounds.y + laneHeight / 2 - 18,
    width: 36,
    height: 36,
  };

  const startEvent = moddle.create('bpmn:StartEvent', {
    id: 'StartEvent_1',
    name: 'Evento Inicial',
  });

  bpmnProcess.get('flowElements').push(startEvent);

  const startEventShape = moddle.create('bpmndi:BPMNShape', {
    id: 'StartEvent_1_di',
    bpmnElement: startEvent,
    bounds: moddle.create('dc:Bounds', startEventBounds),
  });

  bpmnPlane.planeElement.push(startEventShape);

  // Create 5 exclusive gateways in a loop
  let previousElement = startEvent;
  let previousBounds = startEventBounds;

  for (let i = 1; i <= 5; i++) {
    const gatewayName = `Gateway Exclusivo ${i}`;
    const gatewayLane = participants[0];
    const gatewayOffsetX = 100;

    const gateway = criarGatewayExclusivo(
      moddle,
      bpmnProcess,
      bpmnPlane,
      previousElement, // Elemento anterior
      previousBounds, // Limites do elemento anterior
      participantBounds, // Limites do participante
      participants, // Lista de participantes
      laneHeight, // Altura da lane
      gatewayName, // Nome do gateway
      gatewayLane, // Nome do participante associado ao gateway
      gatewayOffsetX // Deslocamento horizontal
    );

    // Atualiza o elemento anterior para a próxima iteração
    previousElement = gateway;
    previousBounds = {
      x: previousBounds.x + gatewayOffsetX,
      y: participantBounds.y + laneHeight / 2 - 20,
      width: 50,
      height: 40,
    };
  }

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

// Generate the BPMN diagram and export it
export const diagram = await generateDiagram();
console.log(diagram);