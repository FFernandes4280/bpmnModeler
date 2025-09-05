import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';

export default function criarEventoIntermediario(
  moddle,
  bpmnProcess,
  bpmnPlane,
  participantBounds,
  participants,
  laneHeight,
  eventType,
  eventName,
  eventLane,
  dictEntry,
  positionConfig = null,  // Nova configuração de posição
  gatewayPai = null       // Novo parâmetro para conexão com gateway
) {
  // Normaliza o ID removendo espaços e caracteres especiais
  const normalizedId = eventName.replace(/\s+/g, '_').replace(/[^\w]/g, '');

  // Cria o evento intermediário como um elemento BPMN
  const intermediateEvent = moddle.create('bpmn:IntermediateThrowEvent', {
    id: `IntermediateThrowEvent_${normalizedId}`, // ID único para o evento
    name: eventName, // Nome do evento
  });

  if(eventType === 'Timer') {
    const timerEventDefinition = moddle.create('bpmn:TimerEventDefinition');
    intermediateEvent.eventDefinitions = [timerEventDefinition];
  }

  if(eventType === 'Mensagem') {
    const messageEventDefinition = moddle.create('bpmn:MessageEventDefinition');
    intermediateEvent.eventDefinitions = [messageEventDefinition];
  }

  if(eventType === 'Erro') {
    const errorEventDefinition = moddle.create('bpmn:ErrorEventDefinition');
    intermediateEvent.eventDefinitions = [errorEventDefinition];
  }

  // Adiciona o evento intermediário ao processo
  bpmnProcess.get('flowElements').push(intermediateEvent);

  // Calcula a posição vertical com base na lane associada
  const laneIndex = participants.indexOf(eventLane);
  const laneY = participantBounds.y + laneIndex * laneHeight;

  const prevBounds = dictEntry.get("bounds");
  const prevElement = dictEntry.get("element");

  // Calcula posição base
  let baseX = prevBounds.x + 150; // Deslocamento horizontal
  let baseY = laneY + laneHeight / 2 - 18; // Centraliza verticalmente na lane

  // Aplica as regras de posicionamento se houver configuração
  if (positionConfig) {
    baseX = baseX + (positionConfig.adjustX || 0);
    baseY = baseY + (positionConfig.adjustY || 0) + positionConfig.yOffset;
    
    console.log(`Evento Intermediário ${eventName} (${eventType}) posicionado:`, {
      tipo: positionConfig.type,
      x: baseX, 
      y: baseY,
      yOffset: positionConfig.yOffset,
      gatewayPai: gatewayPai
    });
  }

  // Define os limites do evento intermediário
  const eventBounds = {
    x: baseX,
    y: baseY,
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
    id: `SequenceFlow_${prevElement.id}_IntermediateThrowEvent_${normalizedId}`, // ID único para o fluxo
    sourceRef: prevElement, // Referência ao elemento anterior
    targetRef: intermediateEvent, // Referência ao evento intermediário
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
    eventBounds,
    isFromGateway // Usa lógica de gateway se vem de um gateway
  );

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${prevElement.id}_IntermediateThrowEvent_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  const newDictEntry = new Map();
  newDictEntry.set("element", intermediateEvent);
  newDictEntry.set("bounds", eventBounds);
  newDictEntry.set("shape", intermediateEventShape);

  return newDictEntry;
}