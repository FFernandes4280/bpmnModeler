import React, { useRef, useEffect } from 'react';
import BpmnViewer from 'bpmn-js';
import { useDiagramStore } from '../../store/diagramStore.js';
import './DiagramViewer.css';

const DiagramViewer = () => {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const cleanupDragRef = useRef(null);
  const keyboardHandlerRef = useRef(null);
  const { setViewer } = useDiagramStore();

  // Controles de zoom
  const handleZoomIn = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      const currentZoom = canvas.zoom();
      canvas.zoom(currentZoom + 0.08); // Aumentado de 0.05 para 0.08 - mais responsivo
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      const currentZoom = canvas.zoom();
      canvas.zoom(Math.max(0.1, currentZoom - 0.08)); // Aumentado de 0.05 para 0.08 - mais responsivo
    }
  };

  const handleZoomFit = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
    }
  };

  // Função para configurar drag/pan behavior baseada no canvasControls.js
  const setupCanvasDragBehavior = (viewer) => {
    const canvas = viewer.get('canvas');
    const canvasElement = canvasRef.current;
    
    if (!canvasElement) return;
    
    // Variáveis de controle
    let isPanning = false;
    let lastMousePosition = { x: 0, y: 0 };
    let dragThreshold = 8; // Reduzido de 15 para 8 - mais responsivo
    let dragStartPosition = { x: 0, y: 0 };
    let hasMoved = false;
    let currentZoom = 1.0;
    const zoomStep = 0.06; // Aumentado de 0.03 para 0.06 - mais responsivo
    const minZoom = 0.2;
    const maxZoom = 3.0;
    const dampingFactor = 0.7; // Aumentado de 0.3 para 0.5 - menos amortecimento

    // ===================================================================
    // CONTROLES DE ARRASTAR (PAN)
    // ===================================================================
    
    const handleMouseDown = (event) => {
      // Apenas inicia pan com botão esquerdo do mouse
      if (event.button !== 0) return;

      isPanning = true;
      hasMoved = false;
      lastMousePosition = { x: event.clientX, y: event.clientY };
      dragStartPosition = { x: event.clientX, y: event.clientY };

      // Adiciona classe CSS para cursor de drag
      canvasElement.classList.add('dragging');

      // Previne seleção de texto durante drag
      event.preventDefault();
    };

    const handleMouseMove = (event) => {
      if (!isPanning) return;

      const deltaX = event.clientX - lastMousePosition.x;
      const deltaY = event.clientY - lastMousePosition.y;

      // Verifica se moveu o suficiente para iniciar dragging
      const totalDistance = Math.sqrt(
        Math.pow(event.clientX - dragStartPosition.x, 2) +
        Math.pow(event.clientY - dragStartPosition.y, 2)
      );

      if (totalDistance > dragThreshold) {
        hasMoved = true;

        // Aplica fator de amortecimento para reduzir sensibilidade drasticamente
        canvas.scroll({
          dx: deltaX * dampingFactor,
          dy: deltaY * dampingFactor,
        });
      }

      lastMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isPanning = false;
      hasMoved = false;
      // Remove classe CSS do cursor de drag
      canvasElement.classList.remove('dragging');
    };

    const handleMouseLeave = () => {
      isPanning = false;
      hasMoved = false;
      // Remove classe CSS do cursor de drag
      canvasElement.classList.remove('dragging');
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    // ===================================================================
    // CONTROLES DE ZOOM COM SCROLL
    // ===================================================================

    const handleWheel = (event) => {
      event.preventDefault();

      // Normaliza e reduz drasticamente a sensibilidade do scroll
      let normalizedDelta = event.deltaY;
      if (event.deltaMode === 1) { // DOM_DELTA_LINE
        normalizedDelta *= 16;
      } else if (event.deltaMode === 2) { // DOM_DELTA_PAGE
        normalizedDelta *= 16 * 24;
      }

      // Aumentar sensibilidade do scroll para nível confortável
      const scrollSensitivity = 0.001; // Aumentado de 0.0003 para 0.001 - mais responsivo
      const zoomDelta = Math.sign(normalizedDelta) * Math.min(Math.abs(normalizedDelta * scrollSensitivity), zoomStep);

      // Obtém as coordenadas do mouse relativas ao canvas
      const canvasRect = canvasElement.getBoundingClientRect();
      const mouseX = event.clientX - canvasRect.left;
      const mouseY = event.clientY - canvasRect.top;

      // Converte para coordenadas do viewbox
      const viewbox = canvas.viewbox();
      const worldX = viewbox.x + (mouseX / canvasRect.width) * viewbox.width;
      const worldY = viewbox.y + (mouseY / canvasRect.height) * viewbox.height;

      const oldZoom = currentZoom;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom - zoomDelta)); // Invertido para comportamento natural

      if (Math.abs(oldZoom - newZoom) < 0.005) return; // Aumentado de 0.001 para 0.005 - permite mais responsividade

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
    };

    // Adiciona event listeners
    canvasElement.addEventListener('mousedown', handleMouseDown);
    canvasElement.addEventListener('mousemove', handleMouseMove);
    canvasElement.addEventListener('mouseup', handleMouseUp);
    canvasElement.addEventListener('mouseleave', handleMouseLeave);
    canvasElement.addEventListener('contextmenu', handleContextMenu);
    canvasElement.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup function
    return () => {
      canvasElement.removeEventListener('mousedown', handleMouseDown);
      canvasElement.removeEventListener('mousemove', handleMouseMove);
      canvasElement.removeEventListener('mouseup', handleMouseUp);
      canvasElement.removeEventListener('mouseleave', handleMouseLeave);
      canvasElement.removeEventListener('contextmenu', handleContextMenu);
      canvasElement.removeEventListener('wheel', handleWheel);
    };
  };

  useEffect(() => {
    // Inicializa o BPMN Viewer
    if (canvasRef.current && !viewerRef.current) {
      const viewer = new BpmnViewer({
        container: canvasRef.current,
        keyboard: { bindTo: document }
      });
      
      viewerRef.current = viewer;
      setViewer(viewer);
      
      // Habilita funcionalidades de zoom e pan
      viewer.on('import.done', () => {
        // Remove event listeners antigos se existirem
        if (cleanupDragRef.current) {
          cleanupDragRef.current();
          cleanupDragRef.current = null;
        }
        if (keyboardHandlerRef.current) {
          document.removeEventListener('keydown', keyboardHandlerRef.current);
          keyboardHandlerRef.current = null;
        }
        
        // Centraliza o diagrama
        viewer.get('canvas').zoom('fit-viewport', 'auto');
        
        // Setup drag/pan behavior e guarda cleanup
        cleanupDragRef.current = setupCanvasDragBehavior(viewer);
        
        // Adiciona suporte a atalhos de teclado para zoom
        const handleKeyboard = (event) => {
          if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
              case '+':
              case '=':
                event.preventDefault();
                handleZoomIn();
                break;
              case '-':
                event.preventDefault();
                handleZoomOut();
                break;
              case '0':
                event.preventDefault();
                handleZoomFit();
                break;
            }
          }
        };
        
        keyboardHandlerRef.current = handleKeyboard;
        document.addEventListener('keydown', handleKeyboard);
      });
    }

    // Cleanup completo
    return () => {
      // Remove event listeners primeiro
      if (cleanupDragRef.current) {
        cleanupDragRef.current();
        cleanupDragRef.current = null;
      }
      if (keyboardHandlerRef.current) {
        document.removeEventListener('keydown', keyboardHandlerRef.current);
        keyboardHandlerRef.current = null;
      }
      
      // Depois destroi o viewer
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [setViewer]);

  const handleSaveDiagram = () => {
    if (viewerRef.current) {
      viewerRef.current.saveXML({ format: true }).then(result => {
        const blob = new Blob([result.xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.bpmn';
        a.click();
        URL.revokeObjectURL(url);
      }).catch(err => {
        console.error('Erro ao salvar diagrama:', err);
      });
    }
  };

  const handleReturnHome = () => {
    // Placeholder para funcionalidade de retorno ao início
    console.log('Retornar ao início');
  };

  return (
    <div className="diagram-container">
      <div className="canvas" ref={canvasRef}></div>
      
      {/* Controles principais - mantém o mesmo estilo do original */}
      <div className="diagram-controls">
        <button 
          type="button" 
          className="control-button save-button"
          onClick={handleSaveDiagram}
          title="Salvar Diagrama"
        >
          💾
        </button>
        <button 
          type="button" 
          className="control-button home-button"
          onClick={handleReturnHome}
          title="Voltar ao Início"
        >
          🏠
        </button>
      </div>

      {/* Controles de zoom */}
      <div className="zoom-controls">
        <button 
          type="button" 
          className="zoom-button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
        >
          🔍+
        </button>
        <button 
          type="button" 
          className="zoom-button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
        >
          🔍−
        </button>
        <button 
          type="button" 
          className="zoom-button"
          onClick={handleZoomFit}
          title="Ajustar à Tela"
        >
          📐
        </button>
      </div>

      {/* Instruções de uso */}
      <div className="pan-zoom-instructions">
        <small>
          💡 Scroll: Zoom | Drag: Mover | Ctrl/Cmd + (+/-/0): Zoom In/Out/Fit
        </small>
      </div>
    </div>
  );
};

export default DiagramViewer;