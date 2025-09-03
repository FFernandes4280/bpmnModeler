export default function criarFluxoMensagem(
  moddle,
  collaboration,
  bpmnPlane,
  dictEntry,
  externalParticipants,
  participantBounds,
  name,
  lane
) {
  const externalParticipant = collaboration.get('participants').find(
    (participant) => participant.name === lane
  );

  const prevBounds = dictEntry.get("bounds");
  const prevElement = dictEntry.get("element");

  const messageFlow = moddle.create('bpmn:MessageFlow', {
    id: `MessageFlow_${prevElement.id}_to_${externalParticipant.id}`,
    sourceRef: name === 'Envio' ? prevElement : externalParticipant,
    targetRef: name === 'Envio' ? externalParticipant : prevElement,
  });

  if (!collaboration.get('messageFlows')) {
    collaboration.set('messageFlows', []);
  }
  collaboration.get('messageFlows').push(messageFlow);

  // Define os waypoints para o Message Flow
  const elementX = prevBounds.x + prevBounds.width / 2;
  const elementY = prevBounds.y; 

  const targetParticipantIndex = externalParticipants.indexOf(lane);
 
  const participantY = participantBounds.y - (externalParticipants.length - targetParticipantIndex) * 200 + 100;
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
    id: `MessageFlow_${prevElement.id}_to_${externalParticipant.id}_di`,
    bpmnElement: messageFlow,
    waypoint: messageFlowWaypoints,
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(messageFlowEdge);
}
