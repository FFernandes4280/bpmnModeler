import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';

export default function criarAtividade(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  sourceBounds,
  participantBounds,
  participants,
  laneHeight,
  activityType,
  activityName,
  activityLane
) {
  // Normaliza o ID removendo espaços e caracteres especiais
  const normalizedId = activityName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
  
  // mapa simples: Default, In ou Out
  const taskTypeMap = {
    'Default': 'bpmn:Task',
    'Out':     'bpmn:SendTask',    // 📤 ícone "out"
    'In':      'bpmn:ReceiveTask'  // 📨 ícone "in"
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
  if (laneIndex === -1) {
    throw new Error(`Participante "${activityLane}" não foi declarado`);
  }
  const laneY = participantBounds.y + laneIndex * laneHeight;
  if(!sourceBounds.yOffset) sourceBounds.yOffset = 0;
  // Define os limites da atividade
  const activityBounds = {
    x: sourceBounds.x + 150, // Deslocamento horizontal
    y: laneY + (laneHeight - 80) / 2 + sourceBounds.yOffset, // Centraliza verticalmente na lane
    width: 100,
    height: 80,
  };

  // Cria o BPMNShape para a atividade
  const activityShape = moddle.create('bpmndi:BPMNShape', {
    id: `Task_${normalizedId}_di`, // ID único para o shape da atividade
    bpmnElement: activity, // Referência ao elemento BPMN da atividade
    bounds: moddle.create('dc:Bounds', activityBounds), // Define os limites da atividade
  });
  activityShape.bounds.yOffset = sourceBounds.yOffset; // Adiciona o offset vertical

  // Adiciona o shape da atividade ao BPMNPlane
  bpmnPlane.planeElement.push(activityShape);

  // Cria o fluxo de sequência entre o elemento anterior e a atividade
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${sourceElement.id}_Task_${normalizedId}`, // ID único para o fluxo
    sourceRef: sourceElement, // Referência ao elemento anterior
    targetRef: activity, // Referência à atividade
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Calcula waypoints usando a nova função
  // Detecta se o elemento anterior é um gateway
  const isFromGateway = sourceElement.id && (
    sourceElement.id.includes('ExclusiveGateway') || 
    sourceElement.id.includes('ParallelGateway')
  );
  
  const sequenceFlowWaypoints = calcularWaypointsSequenceFlow(
    moddle,
    sourceBounds,
    activityBounds,
    isFromGateway // Usa lógica de gateway se vem de um gateway
  );

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${sourceElement.id}_Task_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  return {
    activity, // Retorna a atividade criada
    activityShape, // Retorna o shape da atividade
  }; // Retorna a atividade criada
}