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

  // Cria a atividade como um elemento BPMN
  const activity = moddle.create('bpmn:Task', {
    id: `Task_${normalizedId}`, // ID único para a atividade
    name: activityName, // Nome da atividade
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

  const sourceX = sourceBounds.x + sourceBounds.width;
  const sourceY = sourceBounds.y + sourceBounds.height / 2;

  const targetX = activityBounds.x;
  const targetY = activityBounds.y + activityBounds.height / 2;

  const middleX = targetX;
  const middleY = sourceY;

  // Define os waypoints para o fluxo de sequência
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
    moddle.create('dc:Point', { x: middleX, y: middleY }), // Ponto intermediário
    moddle.create('dc:Point', { x: targetX, y: targetY }), // Entrada na atividade
  ];

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