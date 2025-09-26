import React, { useRef, useEffect } from 'react';
import BpmnViewer from 'bpmn-js';
import { useDiagramStore } from '../../store/diagramStore.js';
import './DiagramViewer.css';

const DiagramViewer = () => {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const { setViewer } = useDiagramStore();

  // Controles de zoom
  const handleZoomIn = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      const currentZoom = canvas.zoom();
      canvas.zoom(currentZoom + 0.1);
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      const canvas = viewerRef.current.get('canvas');
      const currentZoom = canvas.zoom();
      canvas.zoom(Math.max(0.1, currentZoom - 0.1));
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
    let dragThreshold = 5; // Distância mínima para iniciar drag
    let dragStartPosition = { x: 0, y: 0 };
    let hasMoved = false;
    let currentZoom = 1.0;
    const zoomStep = 0.2;
    const minZoom = 0.2;
    const maxZoom = 3.0;

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

        // Aplica fator de amortecimento para tornar dragging menos sensível
        const dampingFactor = 0.8;

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
        // Centraliza o diagrama
        viewer.get('canvas').zoom('fit-viewport', 'auto');
        
        // Setup drag/pan behavior
        setupCanvasDragBehavior(viewer);
        
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
        
        document.addEventListener('keydown', handleKeyboard);
        
        console.log('✅ Zoom e Pan habilitados - Use scroll do mouse para zoom, drag para mover');
        
        // Cleanup keyboard listener quando componente é desmontado
        return () => {
          document.removeEventListener('keydown', handleKeyboard);
        };
      });
      
      // Importa um diagrama vazio inicial
      const emptyDiagram = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                          id="Definitions_1" 
                          targetNamespace="http://bpmn.io/schema/bpmn">
          <bpmn:process id="Process_1" isExecutable="true">
          </bpmn:process>
          <bpmndi:BPMNDiagram id="BPMNDiagram_1">
            <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            </bpmndi:BPMNPlane>
          </bpmndi:BPMNDiagram>
        </bpmn:definitions>`;
      
      viewer.importXML(emptyDiagram).catch(err => {
        console.error('Erro ao importar diagrama vazio:', err);
      });
    }

    // Cleanup
    return () => {
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