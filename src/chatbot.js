import BpmnModdle from 'bpmn-moddle';

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
  // let projectName = prompt("Qual o nome do processo?");
  let projectName = "Processo de Teste";
  let participants = [];
  // let participantNumber = prompt("Quantos participantes tem o processo?");
  let participantNumber = 3;

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
    width: 1070,
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
    // participants.push(prompt(`Qual o nome do participante ${i + 1}?`));
    participants.push(`Participante ${i + 1}`); // Default names for testing
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

  // let initialEventName = prompt("Qual o nome do evento inicial?");
  let initialEventName = "Evento Inicial";
  // let initialEventLane = prompt("O evento inicial deve ser associado a qual participante?"); 
  let initialEventLane = participants[0]; // Default to the first participant

  const laneIndex = participants.indexOf(initialEventLane);
  if (laneIndex === -1) {
    throw new Error(`Participante não foi declarado`);
  }
  
  const laneY = participantBounds.y + laneIndex * laneHeight;
  const laneBounds = {
    x: participantBounds.x + 60, 
    y: laneY, 
    width: participantBounds.width - 30, 
    height: laneHeight, 
  };

  const initialEventBounds = {
    x: laneBounds.x + 20, 
    y: laneBounds.y + laneBounds.height / 2 - 18, 
    width: 36, 
    height: 36,
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

  initialEventShape.label = moddle.create('bpmndi:BPMNLabel', {
    bounds: moddle.create('dc:Bounds', {
      x: initialEventBounds.x - 30, 
      y: initialEventBounds.y + initialEventBounds.height + 5, 
      width: 100,
      height: 20,
    }),
  });

/////////////////////////////////////////////////////////////////////////////////////////////////
  
  // Criação de uma atividade no diagrama BPMN
  // let activityName = prompt("Qual o nome da atividade?");
  let activityName = "Atividade de Teste"; // Nome da atividade (pode ser dinâmico)

  // let activityLane = prompt("A atividade deve ser associada a qual participante?");
  let activityLane = participants[0]; // Define a lane associada à atividade (pode ser dinâmico)

  // Localiza o índice da lane correspondente ao participante
  const activityLaneIndex = participants.indexOf(activityLane);
  if (activityLaneIndex === -1) {
    throw new Error(`Participante não foi declarado`);
  }

  // Calcula os limites da lane correspondente
  const activityLaneY = participantBounds.y + activityLaneIndex * laneHeight;
  const activityLaneBounds = {
    x: participantBounds.x + 60, // Margem interna da lane
    y: activityLaneY, // Posição Y da lane
    width: participantBounds.width - 30, // Largura da lane
    height: laneHeight, // Altura da lane
  };

  // Calcula os limites da atividade
  // Adiciona um deslocamento no eixo X para evitar sobreposição de atividades
  const activityOffsetX = 150; // Define o deslocamento horizontal entre atividades
  const activityBounds = {
    x: activityLaneBounds.x + activityOffsetX, // Desloca a atividade horizontalmente
    y: activityLaneBounds.y + activityLaneBounds.height / 2 - 40, // Centraliza verticalmente na lane
    width: 100, // Largura da atividade
    height: 80, // Altura da atividade
  };

  // Cria a atividade como um elemento BPMN
  const activity = moddle.create('bpmn:Task', {
    id: 'Task_1', // ID único para a atividade
    name: activityName, // Nome da atividade
  });

  // Adiciona a atividade ao processo
  bpmnProcess.get('flowElements').push(activity);

  // Cria o BPMNShape para a atividade
  const activityShape = moddle.create('bpmndi:BPMNShape', {
    id: 'Task_1_di', // ID único para o shape da atividade
    bpmnElement: activity, // Referência ao elemento BPMN da atividade
    bounds: moddle.create('dc:Bounds', activityBounds), // Define os limites da atividade
  });

  // Adiciona um rótulo à atividade
  activityShape.label = moddle.create('bpmndi:BPMNLabel', {
    bounds: moddle.create('dc:Bounds', {
      x: activityBounds.x - 30, // Ajusta a posição do rótulo no eixo X
      y: activityBounds.y + activityBounds.height + 5, // Posiciona o rótulo abaixo da atividade
      width: 100, // Largura do rótulo
      height: 20, // Altura do rótulo
    }),
  });

  // Adiciona o shape da atividade ao BPMNPlane
  bpmnPlane.planeElement.push(activityShape);

  // Cria o fluxo de sequência entre o evento inicial e a atividade
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: 'SequenceFlow_1', // ID único para o fluxo
    sourceRef: initialEvent, // Referência ao evento inicial
    targetRef: activity, // Referência à atividade de teste
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Define os waypoints para o fluxo de sequência
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: initialEventBounds.x + initialEventBounds.width, y: initialEventBounds.y + initialEventBounds.height / 2 }), // Saída do evento inicial
    moddle.create('dc:Point', { x: activityBounds.x, y: activityBounds.y + activityBounds.height / 2 }), // Entrada na atividade
  ];

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: 'SequenceFlow_1_di', // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);



  bpmnPlane.planeElement.push(initialEventShape);
  bpmnDiagram.plane = bpmnPlane; 
  definitions.get('diagrams').push(bpmnDiagram);

  const { xml: xmlStrUpdated } = await moddle.toXML(definitions);

  return xmlStrUpdated;
}

// Generate the BPMN diagram and export it
export const diagram = await generateDiagram();
console.log(diagram);