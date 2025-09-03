import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';

export default function criarEventoFinal(
  moddle,
  bpmnProcess,
  bpmnPlane,
  participantBounds,
  participants,
  laneHeight,
  finalEventType,
  eventName,
  laneName,
  index,
  dictEntry
) {
  // Recupera o elemento anterior da elementsList
  const prevBounds = dictEntry.get("bounds");
  const prevElement = dictEntry.get("element");

  // Normaliza o ID removendo espaços e caracteres especiais
  const normalizedId = eventName.replace(/\s+/g, '_').replace(/[^\w]/g, '');

  // Calcula os bounds do evento final com base na lane correspondente
  const laneIndex = participants.indexOf(laneName); // Obtém o índice da lane
  const laneY = participantBounds.y + laneIndex * laneHeight;
  const finalEventBounds = {
    x: prevBounds.x + 150, // Posiciona o evento final à direita do elemento anterior
    y: laneY + (laneHeight - 35) / 2, // Centraliza na lane
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

  if (finalEventType === 'Timer') {
    const timerEventDefinition = moddle.create('bpmn:TimerEventDefinition');
    finalEvent.eventDefinitions = [timerEventDefinition];
  }
  if (finalEventType === 'Mensagem' || finalEventType === 'Message') {
    const messageEventDefinition = moddle.create('bpmn:MessageEventDefinition');
    finalEvent.eventDefinitions = [messageEventDefinition];
  }
  if (finalEventType === 'Sinal' || finalEventType === 'Signal') {
    const signalEventDefinition = moddle.create('bpmn:SignalEventDefinition');
    finalEvent.eventDefinitions = [signalEventDefinition];
  }
  if (finalEventType === 'Erro' || finalEventType === 'Error') {
    const errorEventDefinition = moddle.create('bpmn:ErrorEventDefinition');
    finalEvent.eventDefinitions = [errorEventDefinition];
  }
  if (finalEventType === 'Cancelamento' || finalEventType === 'Cancel') {
    const cancelEventDefinition = moddle.create('bpmn:CancelEventDefinition');
    finalEvent.eventDefinitions = [cancelEventDefinition];
  }
  if (finalEventType === 'Compensação' || finalEventType === 'Compensation') {
    const compensateEventDefinition = moddle.create('bpmn:CompensateEventDefinition');
    finalEvent.eventDefinitions = [compensateEventDefinition];
  }
  if (finalEventType === 'Escalation' || finalEventType === 'Escalonamento') {
    const escalationEventDefinition = moddle.create('bpmn:EscalationEventDefinition');
    finalEvent.eventDefinitions = [escalationEventDefinition];
  }
  if (finalEventType === 'Terminar' || finalEventType === 'Terminate') {
    const terminateEventDefinition = moddle.create('bpmn:TerminateEventDefinition');
    finalEvent.eventDefinitions = [terminateEventDefinition];
  }

  // Cria o fluxo de sequência entre o elemento anterior e o evento final
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${prevElement.id}_EndEvent_${normalizedId}`, // ID único para o fluxo
    sourceRef: prevElement, // Referência ao elemento anterior
    targetRef: finalEvent, // Referência ao evento final
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
    finalEventBounds,
    isFromGateway // Usa lógica de gateway se vem de um gateway
  );

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${prevElement.id}_EndEvent_${normalizedId}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  // Cria um Map para o elemento final
  // const endEventEntry = new Map();
  // endEventEntry.set("element", finalEvent);
  // endEventEntry.set("bounds", finalEventBounds);
  // endEventEntry.set("shape", finalEventShape);

  // Adiciona o elemento à elementsList
  // elementsList.push(endEventEntry);

  // return elementsList;
}