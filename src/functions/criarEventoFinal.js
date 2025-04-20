/**
 * Cria um evento final no diagrama BPMN.
 * 
 * @param {Object} moddle - Instância do BpmnModdle.
 * @param {Object} bpmnProcess - Processo BPMN ao qual o evento será adicionado.
 * @param {Object} bpmnPlane - Plano BPMN onde o shape será adicionado.
 * @param {Object} sourceElement - Elemento BPMN anterior (para criar o fluxo de sequência).
 * @param {Object} sourceBounds - Limites do elemento anterior.
 * @param {Object} finalEventBounds - Limites do evento final.
 * @param {string} eventName - Nome do evento final.
 * @returns {Object} - Retorna o evento final criado.
 */
export default function criarEventoFinal(
    moddle,
    bpmnProcess,
    bpmnPlane,
    sourceElement,
    sourceBounds,
    finalEventBounds,
    eventName
  ) {
    // Normaliza o ID removendo espaços e caracteres especiais
    const normalizedId = eventName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
  
    // Cria o evento final como um elemento BPMN
    const finalEvent = moddle.create('bpmn:EndEvent', {
      id: `EndEvent_${normalizedId}`, // ID único para o evento
      name: eventName, // Nome do evento
    });
  
    // Adiciona o evento final ao processo
    bpmnProcess.get('flowElements').push(finalEvent);
  
    // Cria o BPMNShape para o evento final
    const finalEventShape = moddle.create('bpmndi:BPMNShape', {
      id: `EndEvent_${normalizedId}_di`, // ID único para o shape do evento
      bpmnElement: finalEvent, // Referência ao elemento BPMN do evento
      bounds: moddle.create('dc:Bounds', finalEventBounds), // Define os limites do evento
    });
  
    // Adiciona o shape do evento ao BPMNPlane
    bpmnPlane.planeElement.push(finalEventShape);
  
    // Cria o fluxo de sequência entre o elemento anterior e o evento final
    const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
      id: `SequenceFlow_${sourceElement.id}_EndEvent_${normalizedId}`, // ID único para o fluxo
      sourceRef: sourceElement, // Referência ao elemento anterior
      targetRef: finalEvent, // Referência ao evento final
    });
  
    // Adiciona o fluxo de sequência ao processo
    bpmnProcess.get('flowElements').push(sequenceFlow);
  
    // Define os waypoints para o fluxo de sequência
    const sequenceFlowWaypoints = [
      moddle.create('dc:Point', { x: sourceBounds.x + sourceBounds.width, y: sourceBounds.y + sourceBounds.height / 2 }), // Saída do elemento anterior
      moddle.create('dc:Point', { x: finalEventBounds.x, y: finalEventBounds.y + finalEventBounds.height / 2 }), // Entrada no evento final
    ];
  
    // Cria o BPMNEdge para o fluxo de sequência
    const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
      id: `SequenceFlow_${sourceElement.id}_EndEvent_${normalizedId}_di`, // ID único para o edge
      bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
      waypoint: sequenceFlowWaypoints, // Define os waypoints
    });
  
    // Adiciona o edge ao BPMNPlane
    bpmnPlane.planeElement.push(sequenceFlowEdge);
  
    return finalEvent; // Retorna o evento final criado
  }