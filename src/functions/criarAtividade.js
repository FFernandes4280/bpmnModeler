import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';

export default function criarAtividade(
  moddle,
  bpmnProcess,
  bpmnPlane,
  participantBounds,
  participants,
  laneHeight,
  activityType,
  activityName,
  activityLane,
  index,
  elementsList
) {
  // Normaliza o ID removendo espaços e caracteres especiais
  const normalizedId = activityName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
  
  const taskTypeMap = {
    'Default': 'bpmn:Task',
    'Out':     'bpmn:SendTask',    
    'In':      'bpmn:ReceiveTask'  
  };

  // mapeia o activityType para o tipo BPMN correspondente
  const elementType = taskTypeMap[activityType] || 'bpmn:Task';

  const activity = moddle.create(elementType, {
    id:   `Task_${normalizedId}`,
    name: activityName
  });

  // Adiciona a atividade ao processo
  bpmnProcess.get('flowElements').push(activity);

  // Calcula a posição vertical com base na lane associada
  const laneIndex = participants.indexOf(activityLane);
  const laneY = participantBounds.y + laneIndex * laneHeight;

  const prevEntry = elementsList[index - 1];
  const prevBounds = prevEntry.get("bounds");
  const prevElement = prevEntry.get("element");

  // Define os limites da atividade
  const activityBounds = {
    x: prevBounds.x + 150, // Deslocamento horizontal
    y: laneY + (laneHeight - 80) / 2, // Centraliza verticalmente na lane
    width: 100,
    height: 80,
  };

  // Cria o BPMNShape para a atividade
  const activityShape = moddle.create('bpmndi:BPMNShape', {
    id: `Task_${normalizedId}_di`, // ID único para o shape da atividade
    bpmnElement: activity, // Referência ao elemento BPMN da atividade
    bounds: moddle.create('dc:Bounds', activityBounds), // Define os limites da atividade
  });

  // Adiciona o shape da atividade ao BPMNPlane
  bpmnPlane.planeElement.push(activityShape);

  // Cria o fluxo de sequência entre o elemento anterior e a atividade
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${prevElement.id}_Task_${normalizedId}`, // ID único para o fluxo
    sourceRef: prevElement, // Referência ao elemento anterior
    targetRef: activity, // Referência à atividade
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Calcula waypoints usando a nova função
  // Detecta se o elemento anterior é um gateway
  const isFromGateway = prevElement.id && (
    prevElement.id.includes('ExclusiveGateway') || 
    prevElement.id.includes('ParallelGateway')
  );
  
  const sequenceFlowWaypoints = calcularWaypointsSequenceFlow(
    moddle,
    prevBounds,
    activityBounds,
    isFromGateway // Usa lógica de gateway se vem de um gateway
  );

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${prevElement.id}_Task_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  const dictEntry = new Map();
  dictEntry.set("element", activity);
  dictEntry.set("bounds", activityBounds);
  dictEntry.set("shape", activityShape);

  elementsList.push(dictEntry);
  return elementsList;
}