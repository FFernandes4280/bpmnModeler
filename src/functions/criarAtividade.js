/**
 * Cria uma atividade no diagrama BPMN.
 * 
 * @param {Object} moddle - Instância do BpmnModdle.
 * @param {Object} bpmnProcess - Processo BPMN ao qual a atividade será adicionada.
 * @param {Object} bpmnPlane - Plano BPMN onde o shape será adicionado.
 * @param {Object} sourceElement - Elemento BPMN anterior (para criar o fluxo de sequência).
 * @param {Object} sourceBounds - Limites do elemento anterior.
 * @param {Object} participantBounds - Limites do participante.
 * @param {Array} participants - Lista de participantes.
 * @param {number} laneHeight - Altura de cada lane.
 * @param {string} activityName - Nome da atividade.
 * @param {string} activityLane - Nome do participante associado à atividade.
 * @returns {Object} - Retorna a atividade criada.
 */
export default function criarAtividade(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  sourceBounds,
  participantBounds,
  participants,
  laneHeight,
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

  // Define os limites da atividade
  const activityBounds = {
    x: sourceBounds.x + 150, // Deslocamento horizontal
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

  // Define os waypoints para o fluxo de sequência
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
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

  return activity; // Retorna a atividade criada
}