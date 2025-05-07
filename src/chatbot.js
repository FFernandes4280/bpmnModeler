import BpmnModdle from 'bpmn-moddle';
import criarAtividade from './functions/criarAtividade.js';
import criarEventoIntermediario from './functions/criarEventoIntermediario.js';
import criarGatewayExclusivo from './functions/criarGatewayExclusivo.js';
import criarGatewayParalelo from './functions/criarGatewayParalelo.js';
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

export async function generateDiagramFromInput(processName, participantsInput, hasExternalParticipants, externalParticipantsInput, initialEventName, initialEventLane, elements) {
  const { rootElement: definitions } = await moddle.fromXML(xmlStart);

  // Create the process
  const bpmnProcess = moddle.create('bpmn:Process', { id: 'Process', isExecutable: false });
  definitions.get('rootElements').push(bpmnProcess);

  // Create the lane set
  const laneSet = moddle.create('bpmn:LaneSet', { id: 'LaneSet' });
  bpmnProcess.get('laneSets').push(laneSet);

  const externalLaneSet = moddle.create('bpmn:LaneSet', { id: 'ExternalLaneSet' });
  if (hasExternalParticipants === 'Sim') {
    bpmnProcess.get('laneSets').push(externalLaneSet);
  }

  // Define project name and participants
  let projectName = processName;
  let participants = participantsInput;
  let participantNumber = participants.length;

  let externalParticipants = externalParticipantsInput;
  let externalParticipantsNumber = hasExternalParticipants === 'Sim' ? externalParticipants.length : 0;

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
    height: participantNumber * 200,
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
  const externalLaneHeight = participantBounds.height / externalParticipantsNumber;

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

  //Create external lanes and their shapes
  for (let i = 0; i < externalParticipantsNumber; i++) {
    const externalLane = moddle.create('bpmn:Lane', {
      id: `ExternalLane_${i + 1}`,
      name: externalParticipants[i],
      flowNodeRef: [],
    });
    externalLaneSet.get('lanes').push(externalLane);

    const externalLaneShape = moddle.create('bpmndi:BPMNShape', {
      id: `ExternalLane_${i + 1}_di`,
      bpmnElement: externalLane,
      isHorizontal: true,
      bounds: moddle.create('dc:Bounds', {
        x: participantBounds.x + 30,
        y: participantBounds.y + participantNumber * laneHeight + i * externalLaneHeight + 40,
        width: participantBounds.width - 30,
        height: externalLaneHeight,
      }),
    });

    bpmnPlane.planeElement.push(externalLaneShape);
  }
  // Create the initial start event
  const initialEventBounds = {
    x: participantBounds.x + 80,
    y: participantBounds.y + participants.indexOf(initialEventLane) * laneHeight + laneHeight / 2 - 18,
    width: 35,
    height: 35,
  };

  const initialEvent = moddle.create('bpmn:StartEvent', {
    id: 'StartEvent_1',
    name: initialEventName,
    isInterrupting: true,
  });

  bpmnProcess.get('flowElements').push(initialEvent);

  const initialEventShape = moddle.create('bpmndi:BPMNShape', {
    id: 'StartEvent_1_di',
    bpmnElement: initialEvent,
    bounds: moddle.create('dc:Bounds', initialEventBounds),
  });

  bpmnPlane.planeElement.push(initialEventShape);

  // Initialize stacks for elements and bounds
  let previousElements = [initialEvent];
  let previousBounds = [initialEventBounds];

  let gatewayCount = 0;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  for (const element of elements) {
    let { type, name, lane} = element;
    const currentElement = previousElements.pop();
    const currentBounds = previousBounds.pop();

    switch (type) {
      case 'Atividade':
        const activityElement = criarAtividade(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          name,
          lane
        );
        previousElements.push(activityElement.activity);
        previousBounds.push(activityElement.activityShape.bounds);
        break;

      case 'Evento Intermediario':
        const intermediateEvent = criarEventoIntermediario(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          name,
          lane
        );
        previousElements.push(intermediateEvent.intermediateEvent);
        previousBounds.push(intermediateEvent.intermediateEventShape.bounds);
        break;

      case 'Gateway Exclusivo':
        // Verifica se já existe um gateway com o mesmo nome
        const existingExclusiveGateway = bpmnPlane.planeElement.find(
          (e) => e.bpmnElement.name === name && e.bpmnElement.$type === 'bpmn:ExclusiveGateway'
        );

        if (existingExclusiveGateway) {
          // Cria apenas o sequence flow entre o elemento anterior e o gateway existente
          const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
            id: `SequenceFlow_${currentElement.id}_to_${existingExclusiveGateway.bpmnElement.id}`, // ID único para o fluxo
            sourceRef: currentElement, // Referência ao elemento anterior
            targetRef: existingExclusiveGateway.bpmnElement, // Referência ao gateway existente
          });

          // Adiciona o fluxo de sequência ao processo
          bpmnProcess.get('flowElements').push(sequenceFlow);

          const sourceX = currentBounds.x + currentBounds.width;
          const sourceY = currentBounds.y + currentBounds.height / 2;

          const targetX = existingExclusiveGateway.bounds.x;
          const targetY = existingExclusiveGateway.bounds.y + existingExclusiveGateway.bounds.height / 2;

          const middleX = targetX;
          const middleY = sourceY;
          // Define os waypoints para o fluxo de sequência
          const sequenceFlowWaypoints = [
            moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
            moddle.create('dc:Point', { x: middleX, y: middleY }), // Ponto intermediário
            moddle.create('dc:Point', { x: targetX, y: targetY }), // Entrada no gateway existente
          ];

          // Cria o BPMNEdge para o fluxo de sequência
          const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
            id: `SequenceFlow_${currentElement.id}_to_${existingExclusiveGateway.bpmnElement.id}_di`, // ID único para o edge
            bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
            waypoint: sequenceFlowWaypoints, // Define os waypoints
          });

          // Adiciona o edge ao BPMNPlane
          bpmnPlane.planeElement.push(sequenceFlowEdge);
        } else {
          // Cria um novo gateway exclusivo
          const exclusiveGateway = criarGatewayExclusivo(
            moddle,
            bpmnProcess,
            bpmnPlane,
            currentElement,
            currentBounds,
            participantBounds,
            participants,
            laneHeight,
            gatewayCount,
            lane
          );
          gatewayCount++;
          for(let i = 0; i < name; i++){
            const yOffset = (i - (name - 1) / 2) * (laneHeight / name); 
            previousElements.push(exclusiveGateway);
            previousBounds.push({
              x: currentBounds.x + 150,
              y: participantBounds.y + participants.indexOf(lane) * laneHeight + laneHeight / 2 - 18,
              width: 35,
              height: 35,
              yOffset: yOffset,
            });
          }
        }
        break;

      case 'Gateway Paralelo':
        // Verifica se já existe um gateway com o mesmo nome
        const existingParallelGateway = bpmnPlane.planeElement.find(
          (e) => e.bpmnElement.name === name && e.bpmnElement.$type === 'bpmn:ParallelGateway'
        );

        if (existingParallelGateway) {
          // Cria apenas o sequence flow entre o elemento anterior e o gateway existente
          const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
            id: `SequenceFlow_${currentElement.id}_to_${existingParallelGateway.bpmnElement.id}`, // ID único para o fluxo
            sourceRef: currentElement, // Referência ao elemento anterior
            targetRef: existingParallelGateway.bpmnElement, // Referência ao gateway existente
          });

          // Adiciona o fluxo de sequência ao processo
          bpmnProcess.get('flowElements').push(sequenceFlow);

          const sourceX = currentBounds.x + currentBounds.width;
          const sourceY = currentBounds.y + currentBounds.height / 2;

          const targetX = existingParallelGateway.bounds.x;
          const targetY = existingParallelGateway.bounds.y + existingParallelGateway.bounds.height / 2;

          const middleX = targetX;
          const middleY = sourceY;

          // Define os waypoints para o fluxo de sequência
          const sequenceFlowWaypoints = [
            moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
            moddle.create('dc:Point', { x: middleX, y: middleY }), // Ponto intermediário
            moddle.create('dc:Point', { x: targetX, y: targetY }), // Entrada no gateway existente
          ];

          // Cria o BPMNEdge para o fluxo de sequência
          const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
            id: `SequenceFlow_${currentElement.id}_to_${existingParallelGateway.bpmnElement.id}_di`, // ID único para o edge
            bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
            waypoint: sequenceFlowWaypoints, // Define os waypoints
          });

          // Adiciona o edge ao BPMNPlane
          bpmnPlane.planeElement.push(sequenceFlowEdge);
        } else {
          // Cria um novo gateway paralelo
          const parallelGateway = criarGatewayParalelo(
            moddle,
            bpmnProcess,
            bpmnPlane,
            currentElement,
            currentBounds,
            participantBounds,
            participants,
            laneHeight,
            gatewayCount,
            lane
          );
          
          gatewayCount++;
          for(let i = 0; i < name; i++){
            const yOffset = (i - (name - 1) / 2) * (laneHeight / name); 
            previousElements.push(parallelGateway);
            previousBounds.push({
              x: currentBounds.x + 150,
              y: participantBounds.y + participants.indexOf(lane) * laneHeight + laneHeight / 2 - 18,
              width: 35,
              height: 35,
              yOffset: yOffset,
            });
        }
        }
        break;

      case 'Fim':
        const endEvent = criarEventoFinal(
          moddle,
          bpmnProcess,
          bpmnPlane,
          currentElement,
          currentBounds,
          participantBounds,
          participants,
          laneHeight,
          name,
          lane
        );
        break;

      default:
        console.error('Unknown element type:', type);
    }
  }

  // Finalize the diagram
  bpmnDiagram.plane = bpmnPlane;
  definitions.get('diagrams').push(bpmnDiagram);

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);
  // console.log(xmlStrUpdated);
  
  return xmlStrUpdated;
}

