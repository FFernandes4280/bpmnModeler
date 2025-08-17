import calcularWaypointsSequenceFlow from './calcularWaypointsSequenceFlow.js';
import criarFluxoSequencia from './criarFluxoSequencia.js';

export default function criarFluxoSequenciaGateway(
  moddle,
  bpmnProcess,
  bpmnPlane,
  sourceElement,
  sourceBounds,
  targetElement,
  targetBounds
) {
  // Para fluxos que saem de gateways, usa lógica específica
  const waypoints = calcularWaypointsSequenceFlow(
    moddle,
    sourceBounds,
    targetBounds,
    true // isGatewayFlow = true para fluxos que saem de gateways
  );

  return criarFluxoSequencia(
    moddle,
    bpmnProcess,
    bpmnPlane,
    sourceElement,
    targetElement,
    waypoints
  );
}
