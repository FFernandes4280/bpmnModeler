/**
 * Cria um evento intermediário no diagrama BPMN.
 * 
 * @param {Object} moddle - Instância do BpmnModdle.
 * @param {Object} bpmnProcess - Processo BPMN ao qual o evento será adicionado.
 * @param {Object} bpmnPlane - Plano BPMN onde o shape será adicionado.
 * @param {Object} sourceElement - Elemento BPMN anterior (para criar o fluxo de sequência).
 * @param {Object} sourceBounds - Limites do elemento anterior.
 * @param {Object} participantBounds - Limites do participante.
 * @param {Array} participants - Lista de participantes.
 * @param {number} laneHeight - Altura de cada lane.
 * @param {string} eventName - Nome do evento intermediário.
 * @param {string} eventLane - Nome do participante associado ao evento.
 * @returns {Object} - Retorna o evento intermediário criado.
 */
export default function criarEventoIntermediario(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  sourceBounds,
  participantBounds,
  participants,
  laneHeight,
  eventName,
  eventLane
) {
  // Normaliza o ID removendo espaços e caracteres especiais
  const normalizedId = eventName.replace(/\s+/g, '_').replace(/[^\w]/g, '');

  // Cria o evento intermediário como um elemento BPMN
  const intermediateEvent = moddle.create('bpmn:IntermediateThrowEvent', {
    id: `IntermediateThrowEvent_${normalizedId}`, // ID único para o evento
    name: eventName, // Nome do evento
  });

  // Adiciona o evento intermediário ao processo
  bpmnProcess.get('flowElements').push(intermediateEvent);

  // Calcula a posição vertical com base na lane associada
  const laneIndex = participants.indexOf(eventLane);
  const laneY = participantBounds.y + laneIndex * laneHeight;

  if(!sourceBounds.yOffset) sourceBounds.yOffset = 0;
  // Define os limites do evento intermediário
  const eventBounds = {
    x: sourceBounds.x + 150, // Deslocamento horizontal
    y: laneY + laneHeight / 2 - 18 + sourceBounds.yOffset, // Centraliza verticalmente na lane
    width: 36,
    height: 36,
  };

  // Cria o BPMNShape para o evento intermediário
  const intermediateEventShape = moddle.create('bpmndi:BPMNShape', {
    id: `IntermediateThrowEvent_${normalizedId}_di`, // ID único para o shape do evento
    bpmnElement: intermediateEvent, // Referência ao elemento BPMN do evento
    bounds: moddle.create('dc:Bounds', eventBounds), // Define os limites do evento
  });

  // Adiciona o shape do evento ao BPMNPlane
  bpmnPlane.planeElement.push(intermediateEventShape);

  // Cria o fluxo de sequência entre o elemento anterior e o evento intermediário
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${sourceElement.id}_IntermediateThrowEvent_${normalizedId}`, // ID único para o fluxo
    sourceRef: sourceElement, // Referência ao elemento anterior
    targetRef: intermediateEvent, // Referência ao evento intermediário
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  const sourceX = sourceBounds.x + sourceBounds.width;
  const sourceY = sourceBounds.y + sourceBounds.height / 2;

  const targetX = eventBounds.x;
  const targetY = eventBounds.y + eventBounds.height / 2;

  const middleX = targetX;
  const middleY = sourceY;

  // Define os waypoints para o fluxo de sequência
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
    moddle.create('dc:Point', { x: middleX, y: middleY }), // Ponto intermediário
    moddle.create('dc:Point', { x: targetX, y: targetY }), // Entrada no evento intermediário
  ];

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${sourceElement.id}_IntermediateThrowEvent_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  return {
    intermediateEvent, // Retorna o evento intermediário criado
    intermediateEventShape, // Retorna o shape do evento intermediário
  }; // Retorna o evento intermediário criado
}