/**
 * Funcionalidades de download do diagrama
 */

import { validateRequiredFields } from '../utils/validation.js';

/**
 * Faz o download do diagrama como arquivo .bpmn
 */
export function downloadDiagram() {
  // Valida campos obrigatórios com mensagem de erro
  if (!validateRequiredFields(true)) {
    alert('Preencha todos os campos obrigatórios antes de salvar o diagrama.');
    return;
  }
  
  if (!window.lastDiagramXML) {
    alert('Nenhum diagrama gerado para salvar.');
    return;
  }
  
  const blob = new Blob([window.lastDiagramXML], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diagrama.bpmn';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
