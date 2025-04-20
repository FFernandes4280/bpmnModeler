import BpmnModdle from 'bpmn-moddle';
import criarAtividade from './functions/criarAtividade.js';
import criarEventoIntermediario from './functions/criarEventoIntermediario.js';
import criarGatewayExclusivo from './functions/criarGatewayExclusivo.js';
import criarEventoFinal from './functions/criarEventoFinal.js';

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

async function generateDiagram() {
  const { rootElement: definitions } = await moddle.fromXML(xmlStart);

  // Create the process
  const bpmnProcess = moddle.create('bpmn:Process', { id: 'Process', isExecutable: false });
  definitions.get('rootElements').push(bpmnProcess);
  
  // Create the lane set
  const laneSet = moddle.create('bpmn:LaneSet', { id: 'LaneSet' });
  bpmnProcess.get('laneSets').push(laneSet);

  // Define project name and participants
  let projectName = "Processo de Teste";
  let participants = [];
  let participantNumber = 2;

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
  const participantBounds = {
    x: 160,
    y: 80,
    width: 1800,
    height: 570,
  };

  // Create a participant shape for the process
  const participantShape = moddle.create('bpmndi:BPMNShape', {
    id: 'Participant_di',
    bpmnElement: participant,
    isHorizontal: true,
    bounds: moddle.create('dc:Bounds', participantBounds),
  });
  bpmnPlane.planeElement.push(participantShape);

  // Calculate lane height
  const laneHeight = participantBounds.height / participantNumber;

  // Create lanes and their shapes
  for (let i = 0; i < participantNumber; i++) {
    participants.push(`Participante ${i + 1}`);
    const lane = moddle.create('bpmn:Lane', {
      id: `Lane_${i + 1}`, 
      name: participants[i],
      flowNodeRef: [],
    });
    laneSet.get('lanes').push(lane);

    // Create BPMNShape for the lane
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

    // Add BPMNLabel to the lane shape
    laneShape.label = moddle.create('bpmndi:BPMNLabel', {});

    bpmnPlane.planeElement.push(laneShape);
  }

  const initialEventLane = 'Participante 1'; // Nome da lane onde o evento inicial será posicionado
  // Create the initial start event
  const initialEventBounds = {
    x: participantBounds.x + 80,
    y: participantBounds.y + participants.indexOf(initialEventLane) * laneHeight + laneHeight / 2 - 18, 
    width: 35,
    height: 35,
  };

  const initialEvent = moddle.create('bpmn:StartEvent', {
    id: 'StartEvent_1',
    name: 'Evento Inicial',
    isInterrupting: true
  });

  bpmnProcess.get('flowElements').push(initialEvent);

  const initialEventShape = moddle.create('bpmndi:BPMNShape', {
    id: 'StartEvent_1_di',
    bpmnElement: initialEvent,
    bounds: moddle.create('dc:Bounds', initialEventBounds),
  });

  bpmnPlane.planeElement.push(initialEventShape);

  let previousElement = initialEvent;
  let previousBounds = initialEventBounds;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Example: Switch to create different BPMN elements
  let elementList = ['activity', 'gateway', 'activity', 'activity', 'gateway', 'event', 'event', 'activity', 'event'];
  let laneList = ['Participante 1', 'Participante 1', 'Participante 1', 'Participante 2', 'Participante 2', 'Participante 2', 'Participante 2', 'Participante 1', 'Participante 1'];
  for (let i = 0; i <= 10; i++) {
    const elementType = elementList[i];
    let elementName;

    switch (elementType) {
      case 'gateway':
        elementName = `Gateway ${i}`;
        break;
      case 'event':
        elementName = `Evento Intermediário ${i}`;
        break;
      case 'activity':
        elementName = `Atividade ${i}`;
        break;
      default:
        console.error('Tipo de elemento desconhecido:', elementType);
        continue;
    }

    switch (elementType) {
      case 'gateway':
        previousElement = criarGatewayExclusivo(
          moddle,
          bpmnProcess,
          bpmnPlane,
          previousElement,
          previousBounds,
          participantBounds,
          participants,
          laneHeight,
          elementName,
          laneList[i]
        );
        previousBounds = {
          x: previousBounds.x + 150,
          y: participantBounds.y + participants.indexOf(laneList[i]) * laneHeight + laneHeight / 2 - 18, 
          width: 35,
          height: 35,
        };
        break;

      case 'event':
        previousElement = criarEventoIntermediario(
          moddle,
          bpmnProcess,
          bpmnPlane,
          previousElement,
          previousBounds,
          participantBounds,
          participants,
          laneHeight,
          elementName,
          laneList[i]
        );
        previousBounds = {
          x: previousBounds.x + 150,
          y: participantBounds.y + participants.indexOf(laneList[i]) * laneHeight + laneHeight / 2 - 18, 
          width: 35,
          height: 35,
        };
        break;

        case 'activity':
          previousElement = criarAtividade(
            moddle,
            bpmnProcess,
            bpmnPlane,
            previousElement,
            previousBounds,
            participantBounds,
            participants,
            laneHeight,
            elementName,
            laneList[i]
          );
          previousBounds = {
            x: previousBounds.x + 150,
            y: participantBounds.y + participants.indexOf(laneList[i]) * laneHeight + laneHeight / 2 - 18, 
            width: 100,
            height: 40,
          };
          break;

      default:
        console.error('Tipo de elemento desconhecido em:' + elementType);
    }
  }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

  bpmnDiagram.plane = bpmnPlane; 
  definitions.get('diagrams').push(bpmnDiagram);

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

// Generate the BPMN diagram and export it
export const diagram = await generateDiagram();
// console.log(diagram);