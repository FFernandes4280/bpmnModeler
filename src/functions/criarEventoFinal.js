/**
 * Cria um evento final no diagrama BPMN.
 * 
 * @param {Object} moddle - Instância do BpmnModdle.
 * @param {Object} bpmnProcess - Processo BPMN ao qual o evento será adicionado.
 * @param {Object} bpmnPlane - Plano BPMN onde o shape será adicionado.
 * @param {Object} sourceElement - Elemento BPMN anterior (para criar o fluxo de sequência).
 * @param {Object} sourceBounds - Limites do elemento anterior.
 * @param {Object} participantBounds - Limites do participante.
 * @param {Array} participants - Lista de participantes.
 * @param {number} laneHeight - Altura de cada lane.
 * @param {string} eventName - Nome do evento final.
 * @param {string} laneName - Nome da lane onde o evento será posicionado.
 * @returns {Object} - Retorna o evento final criado.
 */
export default function criarEventoFinal(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  sourceBounds,
  participantBounds,
  participants,
  laneHeight,
  eventName,
  laneName
) {
  // Normaliza o ID removendo espaços e caracteres especiais
  const normalizedId = eventName.replace(/\s+/g, '_').replace(/[^\w]/g, '');

  
  // Calcula os bounds do evento final com base na lane correspondente
  const laneIndex = participants.indexOf(laneName); // Obtém o índice da lane
  const finalEventBounds = {
    x: sourceBounds.x + 150, // Posiciona o evento final à direita do elemento anterior
    y: participantBounds.y + laneIndex * laneHeight + laneHeight / 2 - 18 + sourceBounds.yOffset, // Centraliza na lane
    width: 35,
    height: 35,
  };

  // Cria o evento final como um elemento BPMN
  const finalEvent = moddle.create('bpmn:EndEvent', {
    id: `EndEvent_${normalizedId}`, // ID único para o evento
    name: eventName, // Nome do evento
  });

  // Adiciona o evento final ao processo
  bpmnProcess.get('flowElements').push(finalEvent);

  // Cria o BPMNShape para o evento final
  const finalEventShape = moddle.create('bpmndi:BPMNShape', {
    id: `EndEvent_${normalizedId}_di`, // ID único para o shape do evento
    bpmnElement: finalEvent, // Referência ao elemento BPMN do evento
    bounds: moddle.create('dc:Bounds', finalEventBounds), // Define os limites do evento
  });

  // Adiciona o shape do evento ao BPMNPlane
  bpmnPlane.planeElement.push(finalEventShape);

  // Cria o fluxo de sequência entre o elemento anterior e o evento final
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${sourceElement.id}_EndEvent_${normalizedId}`, // ID único para o fluxo
    sourceRef: sourceElement, // Referência ao elemento anterior
    targetRef: finalEvent, // Referência ao evento final
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Calcula as coordenadas de origem e destino
  const sourceX = sourceBounds.x + sourceBounds.width;
  const sourceY = sourceBounds.y + sourceBounds.height / 2;

  const targetX = finalEventBounds.x;
  const targetY = finalEventBounds.y + finalEventBounds.height / 2;

  const middleX = targetX;
  const middleY = sourceY;

  // Define os waypoints para o fluxo de sequência
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
    moddle.create('dc:Point', { x: middleX, y: middleY }), // Ponto intermediário
    moddle.create('dc:Point', { x: targetX, y: targetY }), // Entrada no evento final
  ];

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${sourceElement.id}_EndEvent_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  return finalEvent; // Retorna o evento final criado
}