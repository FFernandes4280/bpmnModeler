export default function calcularWaypointsSequenceFlow(
  moddle,
  sourceBounds,
  targetBounds,
  customSourceX = null,
  customSourceY = null,
  customTargetX = null,
  customTargetY = null
) {
  // Calcula pontos de origem e destino
  const sourceX = customSourceX || (sourceBounds.x + sourceBounds.width);
  const sourceY = customSourceY || (sourceBounds.y + sourceBounds.height / 2);
  
  const targetX = customTargetX || targetBounds.x;
  const targetY = customTargetY || (targetBounds.y + targetBounds.height / 2);
  
  // Novo padrão: X da origem, Y do destino
  const middleX = sourceX;
  const middleY = targetY;
  
  // Define os waypoints para o fluxo de sequência
  return [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }),
    moddle.create('dc:Point', { x: middleX, y: middleY }),
    moddle.create('dc:Point', { x: targetX, y: targetY }),
  ];
}
