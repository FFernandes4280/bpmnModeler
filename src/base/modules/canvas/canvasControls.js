/**
 * Controles de canvas - drag, pan e zoom
 */

let dragBehaviorSetup = false;

/**
 * Configura o comportamento de arrastar do canvas
 * @param {Object} viewer - Instância do BpmnViewer
 */
export function setupCanvasDragBehavior(viewer) {
  if (dragBehaviorSetup) return;

  const canvas = viewer.get('canvas');
  const canvasElement = document.querySelector('#canvas');
  
  // Variáveis de controle
  let isPanning = false;
  let lastMousePosition = { x: 0, y: 0 };
  let dragThreshold = 5; // Minimum distance to start dragging
  let dragStartPosition = { x: 0, y: 0 };
  let hasMoved = false;
  let currentZoom = 1.0;
  const zoomStep = 0.2;
  const minZoom = 0.2;
  const maxZoom = 3.0;

  // ===================================================================
  // CONTROLES DE ARRASTAR (PAN)
  // ===================================================================
  
  canvasElement.addEventListener('mousedown', (event) => {
    // Only start panning with left mouse button
    if (event.button !== 0) return;

    isPanning = true;
    hasMoved = false;
    lastMousePosition = { x: event.clientX, y: event.clientY };
    dragStartPosition = { x: event.clientX, y: event.clientY };

    // Prevent text selection during drag
    event.preventDefault();
  });

  canvasElement.addEventListener('mousemove', (event) => {
    if (!isPanning) return;

    const deltaX = event.clientX - lastMousePosition.x;
    const deltaY = event.clientY - lastMousePosition.y;

    // Check if we've moved enough to start dragging
    const totalDistance = Math.sqrt(
      Math.pow(event.clientX - dragStartPosition.x, 2) +
      Math.pow(event.clientY - dragStartPosition.y, 2)
    );

    if (totalDistance > dragThreshold) {
      hasMoved = true;

      // Apply damping factor to make dragging less sensitive
      const dampingFactor = 0.8;

      canvas.scroll({
        dx: deltaX * dampingFactor,
        dy: deltaY * dampingFactor,
      });
    }

    lastMousePosition = { x: event.clientX, y: event.clientY };
  });

  canvasElement.addEventListener('mouseup', () => {
    isPanning = false;
    hasMoved = false;
  });

  canvasElement.addEventListener('mouseleave', () => {
    isPanning = false;
    hasMoved = false;
  });

  // Prevent context menu on right click
  canvasElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  // ===================================================================
  // CONTROLES DE ZOOM
  // ===================================================================

  // Setup return home button functionality
  document.getElementById('returnHomeButton').addEventListener('click', () => {
    currentZoom = 1.0;
    canvas.viewbox({ x: 0, y: 0, width: 850, height: 850 });
  });

  // Adiciona suporte para zoom com scroll do mouse
  canvasElement.addEventListener('wheel', (event) => {
    event.preventDefault();

    // Obtém as coordenadas do mouse relativas ao canvas
    const canvasRect = canvasElement.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;

    // Converte para coordenadas do viewbox
    const viewbox = canvas.viewbox();
    const worldX = viewbox.x + (mouseX / canvasRect.width) * viewbox.width;
    const worldY = viewbox.y + (mouseY / canvasRect.height) * viewbox.height;

    const oldZoom = currentZoom;
    const delta = event.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta));

    if (oldZoom === newZoom) return;

    currentZoom = newZoom;
    const scaleFactor = oldZoom / currentZoom;

    // Calcula as novas dimensões
    const newWidth = viewbox.width * scaleFactor;
    const newHeight = viewbox.height * scaleFactor;

    // Calcula a nova posição para manter o ponto do mouse como centro do zoom
    const newX = worldX - (mouseX / canvasRect.width) * newWidth;
    const newY = worldY - (mouseY / canvasRect.height) * newHeight;

    // Aplica o novo viewbox
    canvas.viewbox({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  });

  dragBehaviorSetup = true;
}
