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
  const participantBounds = {
    x: 160,
    y: 80,
    width: elements.length * 200 + 200,
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

  if (hasExternalParticipants === 'Sim') {
    externalParticipants.forEach((externalParticipant, index) => {
      const blackBoxBPMNProcess = moddle.create('bpmn:Process', { id: `blackBox_${index}`, isExecutable: false })
      definitions.get('rootElements').push(blackBoxBPMNProcess);
      const externalParticipantElement = moddle.create('bpmn:Participant', {
        id: `ExternalParticipant_${index + 1}`,
        name: externalParticipant,
        processRef: blackBoxBPMNProcess,
      });
      collaboration.get('participants').push(externalParticipantElement);

      const externalParticipantBounds = {
        x: 160,
        y: participantBounds.y + index * 200 + participantBounds.height + 50,
        width: participantBounds.width,
        height: 150,
      };

      const externalParticipantShape = moddle.create('bpmndi:BPMNShape', {
        id: `ExternalParticipant_${index + 1}_di`,
        bpmnElement: externalParticipantElement,
        isHorizontal: true,
        bounds: moddle.create('dc:Bounds', externalParticipantBounds),
      });

      bpmnPlane.planeElement.push(externalParticipantShape);
    });
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  for (const element of elements) {
    let { type, name, lane, diverge} = element;
    const currentElement = previousElements.pop();
    const currentBounds = previousBounds.pop();

    switch (type) {
      case 'Mensagem':
        if (name === 'Envio' || name === 'Recebimento') {
          const externalParticipant = collaboration.get('participants').find(
            (participant) => participant.name === lane
          );
          if (!externalParticipant) {
            console.error(`Participante externo "${lane}" não encontrado.`);
            break;
          }
          const messageFlow = moddle.create('bpmn:MessageFlow', {
            id: `MessageFlow_${currentElement.id}_to_${externalParticipant.id}`,
            sourceRef: name === 'Envio' ? currentElement : externalParticipant,
            targetRef: name === 'Envio' ? externalParticipant : currentElement,
          });

          if (!collaboration.get('messageFlows')) {
            collaboration.set('messageFlows', []);
          }
          collaboration.get('messageFlows').push(messageFlow);

          // Define os waypoints para o Message Flow
          const elementX = currentBounds.x + currentBounds.width / 2;
          const elementY = currentBounds.y + currentBounds.height;

          const targetParticipantIndex = externalParticipants.indexOf(lane);

          const participantY = participantBounds.y + targetParticipantIndex * 200 + participantBounds.height + 50;
          const participantX = elementX;

          const messageFlowWaypoints = [
            moddle.create('dc:Point', { x: name === 'Envio' ? elementX : participantX,
                                        y: name === 'Envio' ? elementY : participantY }),
            moddle.create('dc:Point', { x: name === 'Envio' ? participantX : elementX,
                                        y: name === 'Envio' ? participantY : elementY }),
          ];

          // Cria o BPMNEdge para o Message Flow
          const messageFlowEdge = moddle.create('bpmndi:BPMNEdge', {
            id: `MessageFlow_${currentElement.id}_to_${externalParticipant.id}_di`,
            bpmnElement: messageFlow,
            waypoint: messageFlowWaypoints,
          });

          // Adiciona o edge ao BPMNPlane
          bpmnPlane.planeElement.push(messageFlowEdge);
        } else {
          console.error(`Nome de mensagem inválido: "${name}". Use "Envio" ou "Recebimento".`);
        }
        previousElements.push(currentElement);
        previousBounds.push(currentBounds);
        break;

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
          (e) => e.bpmnElement.id === `ExclusiveGateway_${name}` && e.bpmnElement.$type === 'bpmn:ExclusiveGateway'
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
            name,
            lane
          );
          for(let i = 0; i < diverge; i++){
            const yOffset = (i - (diverge - 1) / 2) * (laneHeight / diverge); 
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
          (e) => e.bpmnElement.id === `ParallelGateway_${name}` && e.bpmnElement.$type === 'bpmn:ParallelGateway'
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
            name,
            lane
          );
          
          for(let i = 0; i < diverge; i++){
            const yOffset = (i - (diverge - 1) / 2) * (laneHeight / diverge); 
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

