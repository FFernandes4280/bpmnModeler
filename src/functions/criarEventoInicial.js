export default function criarEventoInicial(
  moddle,
  bpmnProcess,
  bpmnPlane,
  participantBounds,
  participants,
  laneHeight,
  initialEventName,
  initialEventType,
  initialEventLane
) {
  // Create the initial start event
  const initialEventBounds = {
    x: participantBounds.x + 80,
    y: participantBounds.y + participants.indexOf(initialEventLane) * laneHeight + laneHeight / 2 - 18,
    width: 35,
    height: 35,
  };

  const initialEvent = moddle.create('bpmn:StartEvent', {
    id: 'StartEvent_1',
    name: initialEventName,
    isInterrupting: true,
  });

  if (initialEventType === 'Timer') {
    const timerEventDefinition = moddle.create('bpmn:TimerEventDefinition');
    initialEvent.eventDefinitions = [timerEventDefinition];
  }

  if (initialEventType === 'Mensagem') {
    const messageEventDefinition = moddle.create('bpmn:MessageEventDefinition');
    initialEvent.eventDefinitions = [messageEventDefinition];
  }

  if (initialEventType === 'Sinal') {
    const signalEventDefinition = moddle.create('bpmn:SignalEventDefinition');
    initialEvent.eventDefinitions = [signalEventDefinition];
  }

  bpmnProcess.get('flowElements').push(initialEvent);

  const initialEventShape = moddle.create('bpmndi:BPMNShape', {
    id: 'StartEvent_1_di',
    bpmnElement: initialEvent,
    bounds: moddle.create('dc:Bounds', initialEventBounds),
  });

  bpmnPlane.planeElement.push(initialEventShape);

  return {
    initialEvent,
    initialEventBounds,
    initialEventShape
  };
}
