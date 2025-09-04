export default function calcularWaypointsSequenceFlow(
  moddle,
  sourceBounds,
  targetBounds,
  isGatewayFlow = false
) {

  if (isGatewayFlow) {
    let sourceX = sourceBounds.x + sourceBounds.width;
    let sourceY = sourceBounds.y + sourceBounds.height / 2;

    const targetX = targetBounds.x;
    const targetY = targetBounds.y + targetBounds.height / 2;

    if (targetY > sourceY) {
      sourceX = sourceBounds.x + sourceBounds.width / 2;
      sourceY = sourceBounds.y + sourceBounds.height;
    }
    if (targetY < sourceY) {
      sourceX = sourceBounds.x + sourceBounds.width / 2;
      sourceY = sourceBounds.y;
    }

    const middleX = sourceX;
    const middleY = targetY;

    return [
      moddle.create('dc:Point', { x: sourceX, y: sourceY }),
      moddle.create('dc:Point', { x: middleX, y: middleY }),
      moddle.create('dc:Point', { x: targetX, y: targetY }),
    ];
  }

  let sourceX = sourceBounds.x + sourceBounds.width;
  let sourceY = sourceBounds.y + sourceBounds.height / 2;

  let targetX = targetBounds.x;
  let targetY = targetBounds.y + targetBounds.height / 2;

  if (targetY > sourceY) {
    sourceX = sourceBounds.x + sourceBounds.width / 2;
    sourceY = sourceBounds.y + sourceBounds.height;
  }
  if (targetY < sourceY) {
    sourceX = sourceBounds.x + sourceBounds.width / 2;
    sourceY = sourceBounds.y;
  }

  let middleX = sourceX;
  let middleY = targetY;

  return [
    moddle.create('dc:Point', { x: sourceX, y: sourceY }),
    moddle.create('dc:Point', { x: middleX, y: middleY }),
    moddle.create('dc:Point', { x: targetX, y: targetY }),
  ];
}

