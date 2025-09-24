export default function calcularWaypointsFluxoReverso(
  moddle,
  sourceBounds,
  targetBounds
) {
  // Posições centrais
  const sourceCenterX = sourceBounds.x + sourceBounds.width / 2;
  const sourceCenterY = sourceBounds.y + sourceBounds.height / 2;
  const targetCenterX = targetBounds.x + targetBounds.width / 2;
  const targetCenterY = targetBounds.y + targetBounds.height / 2;
  
  // Calcular diferenças nos eixos
  const horizontalDistance = Math.abs(targetCenterX - sourceCenterX);
  const isTargetAbove = targetCenterY < sourceCenterY;
  const isTargetBelow = targetCenterY > sourceCenterY;
  
  // Limiar para considerar X como "muito diferente"
  const X_THRESHOLD = 100;
  
  let sourceX, sourceY, targetX, targetY;
  const waypoints = [];
  
  if (horizontalDistance > X_THRESHOLD) {
    // X muito diferente: verificar posição Y relativa
    if (isTargetAbove) {
      // Target em cima (gateway acima do elemento): sair de baixo e entrar em baixo
      sourceX = sourceCenterX;
      sourceY = sourceBounds.y + sourceBounds.height; // Fundo do source
      targetX = targetCenterX;
      targetY = targetBounds.y + targetBounds.height; // Fundo do target
      
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: sourceY }));
      
      // Criar caminho com ângulos de 90 graus
      const intermediateY = Math.max(sourceY, targetY) + 30;
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: intermediateY }));
      waypoints.push(moddle.create('dc:Point', { x: targetX, y: intermediateY }));
      
    } else if (isTargetBelow) {
      // Target em baixo (gateway abaixo do elemento): sair de cima e entrar em cima
      sourceX = sourceCenterX;
      sourceY = sourceBounds.y; // Topo do source
      targetX = targetCenterX;
      targetY = targetBounds.y; // Topo do target
      
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: sourceY }));
      
      // Criar caminho com ângulos de 90 graus
      const intermediateY = Math.min(sourceY, targetY) - 30;
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: intermediateY }));
      waypoints.push(moddle.create('dc:Point', { x: targetX, y: intermediateY }));
      
    } else {
      // Mesma altura Y: usar caminho lateral
      sourceX = targetCenterX < sourceCenterX ? sourceBounds.x : sourceBounds.x + sourceBounds.width;
      sourceY = sourceCenterY;
      targetX = sourceCenterX < targetCenterX ? targetBounds.x : targetBounds.x + targetBounds.width;
      targetY = targetCenterY;
      
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: sourceY }));
    }
    
  } else {
    // X próximo: usar caminho com ângulos de 90 graus saindo de cima/baixo
    if (isTargetAbove) {
      // Target acima: sair do topo do source e entrar por baixo do target
      sourceX = sourceCenterX;
      sourceY = sourceBounds.y; // Topo do source
      targetX = targetCenterX;
      targetY = targetBounds.y + targetBounds.height; // Fundo do target
      
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: sourceY }));
      
      // Criar caminho em L: cima -> cima mais -> esquerda -> baixo
      const intermediateY = sourceY - 60; // Ir para cima
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: intermediateY }));
      waypoints.push(moddle.create('dc:Point', { x: targetX, y: intermediateY }));
      
    } else if (isTargetBelow) {
      // Target abaixo: sair do fundo do source e entrar por cima do target
      sourceX = sourceCenterX;
      sourceY = sourceBounds.y + sourceBounds.height; // Fundo do source
      targetX = targetCenterX;
      targetY = targetBounds.y; // Topo do target
      
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: sourceY }));
      
      // Criar caminho em L: baixo -> baixo mais -> esquerda -> cima
      const intermediateY = sourceY + 60; // Ir para baixo
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: intermediateY }));
      waypoints.push(moddle.create('dc:Point', { x: targetX, y: intermediateY }));
      
    } else {
      // Mesma altura Y: conexão direta lateral
      sourceX = targetCenterX < sourceCenterX ? sourceBounds.x : sourceBounds.x + sourceBounds.width;
      sourceY = sourceCenterY;
      targetX = sourceCenterX < targetCenterX ? targetBounds.x : targetBounds.x + targetBounds.width;
      targetY = targetCenterY;
      
      waypoints.push(moddle.create('dc:Point', { x: sourceX, y: sourceY }));
    }
  }
  
  // Adicionar ponto final
  waypoints.push(moddle.create('dc:Point', { x: targetX, y: targetY }));
  
  return waypoints;
}
