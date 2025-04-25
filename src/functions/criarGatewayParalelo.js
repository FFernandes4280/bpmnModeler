/**
 * Cria um gateway paralelo no diagrama BPMN.
 * 
 * @param {Object} moddle - Instância do BpmnModdle.
 * @param {Object} bpmnProcess - Processo BPMN ao qual o gateway será adicionado.
 * @param {Object} bpmnPlane - Plano BPMN onde o shape será adicionado.
 * @param {Object} sourceElement - Elemento BPMN anterior (para criar o fluxo de sequência).
 * @param {Object} sourceBounds - Limites do elemento anterior.
 * @param {Object} participantBounds - Limites do participante.
 * @param {Array} participants - Lista de participantes.
 * @param {number} laneHeight - Altura de cada lane.
 * @param {string} gatewayName - Nome do gateway.
 * @param {string} gatewayLane - Nome do participante associado ao gateway.
 * @returns {Object} - Retorna o gateway paralelo criado.
 */
export default function criarGatewayParalelo(
    moddle,
    bpmnProcess,
    bpmnPlane,
    sourceElement,
    sourceBounds,
    participantBounds,
    participants,
    laneHeight,
    gatewayName,
    gatewayLane
  ) {
    // Localiza o índice da lane correspondente ao participante
    const gatewayLaneIndex = participants.indexOf(gatewayLane);
    if (gatewayLaneIndex === -1) {
      throw new Error(`Participante "${gatewayLane}" não foi declarado`);
    }
  
    // Calcula os limites da lane correspondente
    const gatewayLaneY = participantBounds.y + gatewayLaneIndex * laneHeight;
    const gatewayBounds = {
      x: sourceBounds.x + 150, // Desloca o gateway horizontalmente
      y: gatewayLaneY + (laneHeight - 36) / 2, // Centraliza verticalmente na lane
      width: 36, // Largura padrão do gateway
      height: 36, // Altura padrão do gateway
    };
  
    // Cria o gateway como um elemento BPMN
    const gateway = moddle.create('bpmn:ParallelGateway', {
      id: `ParallelGateway_${gatewayName.replace(/\s+/g, '_')}`, // ID único para o gateway
      name: gatewayName, // Nome do gateway
    });
  
    // Adiciona o gateway ao processo
    bpmnProcess.get('flowElements').push(gateway);
  
    // Cria o BPMNShape para o gateway
    const gatewayShape = moddle.create('bpmndi:BPMNShape', {
      id: `ParallelGateway_${gatewayName.replace(/\s+/g, '_')}_di`, // ID único para o shape do gateway
      bpmnElement: gateway, // Referência ao elemento BPMN do gateway
      bounds: moddle.create('dc:Bounds', gatewayBounds), // Define os limites do gateway
      isMarkerVisible: true, // Torna o marcador visível
    });
  
    // Adiciona o shape do gateway ao BPMNPlane
    bpmnPlane.planeElement.push(gatewayShape);
  
    // Cria o fluxo de sequência entre o elemento anterior e o gateway
    const sequenceFlow = moddle.create('bpmn:SequenceFlow', {
      id: `SequenceFlow_${sourceElement.id}_${gateway.id}`, // ID único para o fluxo
      sourceRef: sourceElement, // Referência ao elemento anterior
      targetRef: gateway, // Referência ao gateway
    });
  
    // Adiciona o fluxo de sequência ao processo
    bpmnProcess.get('flowElements').push(sequenceFlow);
  
    // Calcula as coordenadas de origem e destino
    const sourceX = sourceBounds.x + sourceBounds.width;
    const sourceY = sourceBounds.y + sourceBounds.height / 2;

    const targetX = gatewayBounds.x;
    const targetY = gatewayBounds.y + gatewayBounds.height / 2;

    const middleX = targetX;
    const middleY = sourceY;

    // Define os waypoints para o fluxo de sequência
    const sequenceFlowWaypoints = [
      moddle.create('dc:Point', { x: sourceX, y: sourceY }), // Saída do elemento anterior
      moddle.create('dc:Point', { x: middleX, y: middleY }), // Ponto intermediário
      moddle.create('dc:Point', { x: targetX, y: targetY }), // Entrada no gateway
    ];
  
    // Cria o BPMNEdge para o fluxo de sequência
    const sequenceFlowEdge = moddle.create('bpmndi:BPMNEdge', {
      id: `SequenceFlow_${sourceElement.id}_${gateway.id}_di`, // ID único para o edge
      bpmnElement: sequenceFlow, // Referência ao fluxo de sequência
      waypoint: sequenceFlowWaypoints, // Define os waypoints
    });
  
    // Adiciona o edge ao BPMNPlane
    bpmnPlane.planeElement.push(sequenceFlowEdge);
  
    return gateway; // Retorna o gateway criado
  }