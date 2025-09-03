/**
 * Teste simples para verificar o funcionamento do GerenciadorDivergencias
 */
import { gerenciadorDivergencias } from './gerenciarDivergencias.js';

// Mock data para testes
const mockCurrentBounds = { x: 100, y: 200, width: 36, height: 36 };
const mockParticipantBounds = { x: 0, y: 100, width: 800, height: 300 };
const mockParticipants = ['Lane 1', 'Lane 2'];
const mockLaneHeight = 150;
const mockLane = 'Lane 1';

// Teste 1: Gateway com 2 divergências
console.log('=== Teste 1: Gateway com 2 divergências ===');
gerenciadorDivergencias.limpar();

gerenciadorDivergencias.registrarDivergencia(
  'gateway_1', 
  [2, 3], // Primeiros elementos dos branches
  mockCurrentBounds,
  mockParticipantBounds,
  mockParticipants,
  mockLaneHeight,
  mockLane
);

console.log('Elemento 2 - Configuração:', gerenciadorDivergencias.obterConfiguracaoCompleta(2));
console.log('Elemento 3 - Configuração:', gerenciadorDivergencias.obterConfiguracaoCompleta(3));

// Teste 2: Gateway com 3 divergências
console.log('\n=== Teste 2: Gateway com 3 divergências ===');
gerenciadorDivergencias.limpar();

gerenciadorDivergencias.registrarDivergencia(
  'gateway_2', 
  [4, 5, 6], // Primeiros elementos dos branches
  mockCurrentBounds,
  mockParticipantBounds,
  mockParticipants,
  mockLaneHeight,
  mockLane
);

console.log('Elemento 4 - Configuração:', gerenciadorDivergencias.obterConfiguracaoCompleta(4));
console.log('Elemento 5 - Configuração:', gerenciadorDivergencias.obterConfiguracaoCompleta(5));
console.log('Elemento 6 - Configuração:', gerenciadorDivergencias.obterConfiguracaoCompleta(6));

// Teste 3: Aplicar regras de posicionamento
console.log('\n=== Teste 3: Aplicar regras de posicionamento ===');
const basePosition = { x: 300, y: 200 };

console.log('Posição base:', basePosition);
console.log('Elemento 4 - Posição final:', gerenciadorDivergencias.aplicarRegrasPositionamento(4, basePosition.x, basePosition.y));
console.log('Elemento 5 - Posição final:', gerenciadorDivergencias.aplicarRegrasPositionamento(5, basePosition.x, basePosition.y));
console.log('Elemento 6 - Posição final:', gerenciadorDivergencias.aplicarRegrasPositionamento(6, basePosition.x, basePosition.y));

console.log('\n=== Testes concluídos ===');
