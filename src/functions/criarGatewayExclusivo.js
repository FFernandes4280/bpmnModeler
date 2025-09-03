import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';

export default function criarGatewayExclusivo(
  moddle,
  bpmnProcess,
  bpmnPlane,
  participantBounds,
  participants,
  laneHeight,
  gatewayName,
  gatewayLane,
  index,
  elementsList,
  positionConfig = null  // Nova configuração de posição
) {

  // Obtém o elemento anterior da lista usando o índice
  const prevEntry = elementsList[index - 1];
  const sourceElement = prevEntry ? prevEntry.get("element") : null;
  const sourceBounds = prevEntry ? prevEntry.get("bounds") : null;

  if (!sourceElement || !sourceBounds) {
    throw new Error(`Elemento anterior não encontrado para o gateway "${gatewayName}"`);
  }

  // Localiza o índice da lane correspondente ao participante
  const gatewayLaneIndex = participants.indexOf(gatewayLane);
  if (gatewayLaneIndex === -1) {
    throw new Error(`Participante "${gatewayLane}" não foi declarado`);
  }

  // Calcula os limites da lane correspondente
  const gatewayLaneY = participantBounds.y + gatewayLaneIndex * laneHeight;
  
  // Calcula posição base
  let baseX = sourceBounds.x + 150; // Desloca o gateway horizontalmente
  let baseY = gatewayLaneY + (laneHeight - 36) / 2; // Centraliza verticalmente na lane

  // Aplica as regras de posicionamento se houver configuração
  if (positionConfig) {
    baseX = baseX + (positionConfig.adjustX || 0);
    baseY = baseY + (positionConfig.adjustY || 0) + positionConfig.yOffset;
    
    console.log(`Gateway Exclusivo ${gatewayName} posicionado:`, {
      tipo: positionConfig.type,
      x: baseX, 
      y: baseY,
      yOffset: positionConfig.yOffset
    });
  }

  const gatewayBounds = {
    x: baseX,
    y: baseY,
    width: 36, // Largura padrão do gateway
    height: 36, // Altura padrão do gateway
  };

  // Cria o gateway como um elemento BPMN
  const gateway = moddle.create('bpmn:ExclusiveGateway', {
    id: `ExclusiveGateway_${gatewayName}`, // ID único para o gateway
  });

  // Adiciona o gateway ao processo
  bpmnProcess.get('flowElements').push(gateway);

  // Cria o BPMNShape para o gateway
  const gatewayShape = moddle.create('bpmndi:BPMNShape', {
    id: `ExclusiveGateway_${gatewayName}_di`, // ID único para o shape do gateway
    bpmnElement: gateway, // Referência ao elemento BPMN do gateway
    bounds: moddle.create('dc:Bounds', gatewayBounds), // Define os limites do gateway
    isMarkerVisible: true, // Torna o marcador visível
  });

  // Adiciona o shape do gateway ao BPMNPlane
  bpmnPlane.planeElement.push(gatewayShape);

  // Cria o fluxo de sequência entre o elemento anterior e o gateway
  const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
    id: `SequenceFlow_${sourceElement.id}_${gateway.id}`, // ID único para o fluxo
    sourceRef: sourceElement, // Referência ao elemento anterior
    targetRef: gateway, // Referência ao gateway
  });

  // Adiciona o fluxo de sequência ao processo
  bpmnProcess.get('flowElements').push(sequenceFlow);

  // Calcula waypoints usando a nova função
  // Detecta se o elemento anterior é um gateway
  const isFromGateway = sourceElement.id && (
    sourceElement.id.includes('ExclusiveGateway') || 
    sourceElement.id.includes('ParallelGateway')
  );
  
  const sequenceFlowWaypoints = calcularWaypointsSequenceFlow(
    moddle,
    sourceBounds,
    gatewayBounds,
    isFromGateway // Usa lógica de gateway se vem de um gateway
  );

  // Cria o BPMNEdge para o fluxo de sequência
  const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
    id: `SequenceFlow_${sourceElement.id}_${gateway.id}_di`, // ID único para o edge
    bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
    waypoint: sequenceFlowWaypoints, // Define os waypoints
  });

  // Adiciona o edge ao BPMNPlane
  bpmnPlane.planeElement.push(sequenceFlowEdge);

  // Adiciona o gateway à lista de elementos
  elementsList.push(new Map([
    ['element', gateway],
    ['bounds', gatewayBounds],
    ['index', index]
  ]));

  return gatewayBounds; // Retorna os bounds do gateway para o gerenciador de divergências
}