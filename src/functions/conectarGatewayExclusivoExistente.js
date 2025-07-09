import criarFluxoSequencia from './criarFluxoSequencia.js';

export default function conectarGatewayExclusivoExistente(
  moddle,
  bpmnProcess,
  bpmnPlane,
  currentElement,
  currentBounds,
  existingGateway,
  previousElements
) {
  // Verifica se há outro gateway exclusivo na pilha
  const hasAnotherExclusiveGateway = previousElements.some(
    el => el && el.$type === 'bpmn:ExclusiveGateway'
  );

  const sourceX = currentBounds.x + currentBounds.width / 2;
  const targetX = existingGateway.bounds.x + existingGateway.bounds.width / 2;

  // Se for o último gateway, inverte o sentido do Y
  let intermediateY;
  let sourceY;
  let targetY;
  
  if (hasAnotherExclusiveGateway) {
    sourceY = currentBounds.y + currentBounds.height;
    targetY = existingGateway.bounds.y + existingGateway.bounds.height;
    intermediateY = sourceY + currentBounds.height / 4;
  } else {
    sourceY = currentBounds.y;
    targetY = existingGateway.bounds.y;
    intermediateY = sourceY - currentBounds.height / 4;
  }

  const intermediateX_A = sourceX;
  const intermediateY_A = intermediateY;
  const intermediateX_B = targetX;
  const intermediateY_B = intermediateY;

  // Define os waypoints para o fluxo de sequência
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }),
    moddle.create('dc:Point', { x: intermediateX_A, y: intermediateY_A }),
    moddle.create('dc:Point', { x: intermediateX_B, y: intermediateY_B }),
    moddle.create('dc:Point', { x: targetX, y: targetY }),
  ];

  return criarFluxoSequencia(
    moddle,
    bpmnProcess,
    bpmnPlane,
    currentElement,
    existingGateway.bpmnElement,
    sequenceFlowWaypoints
  );
}
