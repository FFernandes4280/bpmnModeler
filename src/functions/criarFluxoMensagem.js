export default function criarFluxoMensagem(
  moddle,
  collaboration,
  bpmnPlane,
  currentElement,
  currentBounds,
  externalParticipants,
  participantBounds,
  name,
  lane
) {
  const externalParticipant = collaboration.get('participants').find(
    (participant) => participant.name === lane
  );
  
  if (!externalParticipant) {
    console.error(`Participante externo "${lane}" não encontrado.`);
    return null;
  }

  const messageFlow = moddle.create('bpmn:MessageFlow', {
    id: `MessageFlow_${currentElement.id}_to_${externalParticipant.id}`,
    sourceRef: name === 'Envio' ? currentElement : externalParticipant,
    targetRef: name === 'Envio' ? externalParticipant : currentElement,
  });

  if (!collaboration.get('messageFlows')) {
    collaboration.set('messageFlows', []);
  }
  collaboration.get('messageFlows').push(messageFlow);

  // Define os waypoints para o Message Flow
  const elementX = currentBounds.x + currentBounds.width / 2;
  const elementY = currentBounds.y + currentBounds.height;

  const targetParticipantIndex = externalParticipants.indexOf(lane);
  const participantY = participantBounds.y + targetParticipantIndex * 200 + participantBounds.height + 50;
  const participantX = elementX;

  const messageFlowWaypoints = [
    moddle.create('dc:Point', {
      x: name === 'Envio' ? elementX : participantX,
      y: name === 'Envio' ? elementY : participantY
    }),
    moddle.create('dc:Point', {
      x: name === 'Envio' ? participantX : elementX,
      y: name === 'Envio' ? participantY : elementY
    }),
  ];

  // Cria o BPMNEdge para o Message Flow
  const messageFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `MessageFlow_${currentElement.id}_to_${externalParticipant.id}_di`,
    bpmnElement: messageFlow,
    waypoint: messageFlowWaypoints,
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(messageFlowEdge);

  return {
    messageFlow,
    messageFlowEdge
  };
}
