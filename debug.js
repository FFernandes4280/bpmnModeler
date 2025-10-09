import { testElements } from './src/testData/elementsInput.js';

console.log('=== ARRAY ORIGINAL ===');
testElements.forEach((el, i) => {
  console.log(i + ':', el.type, el.name, el.diverge ? 'diverge:' + JSON.stringify(el.diverge) : '');
});

console.log('\n=== ARRAY SEM AUXILIARES ===');
const AUXILIARY_TYPES = ['Data Object', 'Mensagem', 'Gateway Existente'];
const mainFlowElements = testElements.filter(el => !AUXILIARY_TYPES.includes(el.type));

mainFlowElements.forEach((el, i) => {
  console.log(i + ':', el.type, el.name, el.diverge ? 'diverge:' + JSON.stringify(el.diverge) : '');
});

console.log('\n=== AJUSTANDO INDICES DE DIVERGE ===');
// Cria mapa de índices
const indexMap = new Map();
let mainFlowIndex = 0;
testElements.forEach((el, originalIndex) => {
  if (!AUXILIARY_TYPES.includes(el.type)) {
    indexMap.set(originalIndex, mainFlowIndex);
    mainFlowIndex++;
  }
});

console.log('Mapa de índices:', Object.fromEntries(indexMap));

// Ajusta diverge
const adjustedElements = mainFlowElements.map(el => {
  if (el.diverge && Array.isArray(el.diverge)) {
    const adjustedDiverge = el.diverge.map(originalIndex => indexMap.get(originalIndex)).filter(idx => idx !== undefined);
    return { ...el, diverge: adjustedDiverge };
  }
  return el;
});

console.log('\n=== ARRAY FINAL COM DIVERGE AJUSTADO ===');
adjustedElements.forEach((el, i) => {
  console.log(i + ':', el.type, el.name, el.diverge ? 'diverge:' + JSON.stringify(el.diverge) : '');
});