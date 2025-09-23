export default function calcularWaypointsFluxoReverso(
  moddle,
  sourceBounds,
  targetBounds
) {
  // Posições centrais para determinar direção
  const sourceCenterY = sourceBounds.y + sourceBounds.height / 2;
  const targetCenterY = targetBounds.y + targetBounds.height / 2;
  
  // Distância horizontal para waypoints intermediários
  const horizontalOffset = 40;
  
  let sourceX, sourceY, targetX, targetY;
  let waypoints = [];
  
  if (sourceCenterY > targetCenterY) {
    sourceX = sourceBounds.x + sourceBounds.width / 2;  // Centro horizontal do source
    sourceY = sourceBounds.y + sourceBounds.height;     // Parte inferior do source
    
    targetX = targetBounds.x + targetBounds.width / 2;  // Centro horizontal do target
    targetY = targetBounds.y + targetBounds.height;     // Parte inferior do target
    
    // Ponto de saída vertical do source (para baixo)
    const sourceExitY = sourceY + horizontalOffset;
    
    // Ponto de chegada vertical no target (vindo de baixo)
    const targetEntryY = targetY + horizontalOffset;
    
    waypoints = [
      // Ponto inicial (centro inferior do source)
      moddle.create('dc:Point', { x: sourceX, y: sourceY }),
      
      // Sai verticalmente para baixo do source
      moddle.create('dc:Point', { x: sourceX, y: sourceExitY }),
      
      // Curva horizontal em direção ao target
      moddle.create('dc:Point', { x: targetX, y: sourceExitY }),
      
      // Desce em direção ao target
      moddle.create('dc:Point', { x: targetX, y: targetEntryY }),
      
      // Ponto final (centro inferior do target)
      moddle.create('dc:Point', { x: targetX, y: targetY })
    ];
    
  } else {
    sourceX = sourceBounds.x + sourceBounds.width / 2;  // Centro horizontal do source
    sourceY = sourceBounds.y;                           // Parte superior do source
    
    targetX = targetBounds.x + targetBounds.width / 2;  // Centro horizontal do target
    targetY = targetBounds.y;                           // Parte superior do target
    
    // Ponto de saída vertical do source (para cima)
    const sourceExitY = sourceY - horizontalOffset;
    
    // Ponto de chegada vertical no target (vindo de cima)
    const targetEntryY = targetY - horizontalOffset;
    
    waypoints = [
      // Ponto inicial (centro superior do source)
      moddle.create('dc:Point', { x: sourceX, y: sourceY }),
      
      // Sai verticalmente para cima do source
      moddle.create('dc:Point', { x: sourceX, y: sourceExitY }),
      
      // Curva horizontal em direção ao target
      moddle.create('dc:Point', { x: targetX, y: sourceExitY }),
      
      // Sobe em direção ao target
      moddle.create('dc:Point', { x: targetX, y: targetEntryY }),
      
      // Ponto final (centro superior do target)
      moddle.create('dc:Point', { x: targetX, y: targetY })
    ];
  }
  
  return waypoints;
}
