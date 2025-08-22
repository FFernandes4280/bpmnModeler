import criarFluxoSequencia from './criarFluxoSequencia.js';

export default function conectarGatewayParaleloExistente(
  moddle,
  bpmnProcess,
  bpmnPlane,
  currentElement,
  currentBounds,
  existingGateway
) {
  // Para conexões com gateways existentes, usa waypoints que contornam elementos
  const sourceX = currentBounds.x + currentBounds.width / 2;
  const sourceY = currentBounds.y;
  
  const targetX = existingGateway.bounds.x + existingGateway.bounds.width / 2;
  const targetY = existingGateway.bounds.y;
  
  // Cria waypoints que passam por cima dos elementos intermediários
  const offsetY = 60; // Espaço para passar por cima
  const intermediateY = Math.min(sourceY, targetY) - offsetY;
  
  const sequenceFlowWaypoints = [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }),
    moddle.create('dc:Point', { x: sourceX, y: intermediateY }),
    moddle.create('dc:Point', { x: targetX, y: intermediateY }),
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
