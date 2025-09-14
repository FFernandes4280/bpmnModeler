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
  dictEntry, 
  yOffset
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

  const prevShape = dictEntry;
  const prevElement = dictEntry.bpmnElement;

  // Calcula posição base
  let baseX = prevShape.bounds.x + 150; // Deslocamento horizontal
  let baseY = laneY + (laneHeight - 80) / 2; // Centraliza verticalmente na lane



  // Define os limites da atividade com as posições ajustadas
  const activityBounds = {
    x: baseX,
    y: baseY + yOffset,
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

  // Determina qual elemento anterior usar para a conexão
  let sourceElement = prevElement;
  
  // Cria o fluxo de sequência entre o elemento anterior e a atividade
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${sourceElement.id}_Task_${normalizedId}`, // ID único para o fluxo
    sourceRef: sourceElement, // Referência ao elemento anterior (ou gateway pai)
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

  // Obtém os bounds do elemento fonte
  const sourceBounds = prevShape.bounds;
  
  const sequenceFlowWaypoints = calcularWaypointsSequenceFlow(
    moddle,
    sourceBounds,
    activityBounds,
    isFromGateway 
  );

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${sourceElement.id}_Task_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  return activityShape;
}