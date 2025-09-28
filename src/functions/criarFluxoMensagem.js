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
  console.log('🔍 criarFluxoMensagem - Debug:', { name, lane, externalParticipants });
  
  // Extrair tipo de mensagem do nome
  const messageType = name.split('_')[0]; // "Envio" ou "Recebimento"

  // Buscar participante externo
  const availableParticipants = collaboration.get('participants');
  console.log('🔍 Available participants:', availableParticipants.map(p => ({ id: p.id, name: p.name })));
  
  const externalParticipant = availableParticipants.find(
    (participant) => {
      return participant.name === lane;
    }
  );

  console.log('🔍 Found external participant:', externalParticipant);

  // Verificar se o participante externo foi encontrado
  if (!externalParticipant) {
    console.error(`❌ Participante externo '${lane}' não encontrado na colaboração`);
    console.error('Available participants:', availableParticipants.map(p => p.name));
    return dictEntry;
  }

  const prevShape = dictEntry;
  const prevElement = dictEntry.bpmnElement;

  const messageFlow = moddle.create('bpmn:MessageFlow', {
    id: `MessageFlow_${prevElement.id}_to_${externalParticipant.id}`,
    sourceRef: messageType === 'Envio' ? prevElement : externalParticipant,
    targetRef: messageType === 'Envio' ? externalParticipant : prevElement,
  });

  if (!collaboration.get('messageFlows')) {
    collaboration.set('messageFlows', []);
  }
  collaboration.get('messageFlows').push(messageFlow);

  // Define os waypoints para o Message Flow
  const elementX = prevShape.bounds.x + prevShape.bounds.width / 2;
  const elementY = prevShape.bounds.y; 

  const targetParticipantIndex = externalParticipants.indexOf(lane);
 
  const participantY = participantBounds.y - (externalParticipants.length - targetParticipantIndex) * 200 + 100;
  const participantX = elementX;

  const messageFlowWaypoints = [
    moddle.create('dc:Point', {
      x: messageType === 'Envio' ? elementX : participantX,
      y: messageType === 'Envio' ? elementY : participantY
    }),
    moddle.create('dc:Point', {
      x: messageType === 'Envio' ? participantX : elementX,
      y: messageType === 'Envio' ? participantY : elementY
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

  return dictEntry;
}