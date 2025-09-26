import React from 'react';
import { useDiagramStore } from '../../store/diagramStore.js';

const ElementRow = ({ element, index }) => {
  const { 
    updateElement, 
    removeElement, 
    moveElement, 
    getAllParticipants,
    getExistingGateways,
    elements
  } = useDiagramStore();

  const allParticipants = getAllParticipants();
  const elementNumber = index + 1;
  const isFirst = index === 0;
  const isLast = index === elements.length - 1;

  const handleUpdate = (field, value) => {
    updateElement(element.id, { [field]: value });
  };

  const getSubtypeOptions = () => {
    switch (element.type) {
      case 'Atividade':
        return [
          { value: 'Default', label: 'Padrão' },
          { value: 'In', label: 'Recebimento' },
          { value: 'Out', label: 'Envio' }
        ];
      
      case 'Evento Intermediario':
        return [
          { value: 'Padrão', label: 'Padrão' },
          { value: 'Mensagem', label: 'Mensagem' },
          { value: 'Timer', label: 'Timer' },
          { value: 'Erro', label: 'Erro' }
        ];
      
      case 'Fim':
        return [
          { value: 'Padrão', label: 'Padrão' },
          { value: 'Mensagem', label: 'Mensagem' },
          { value: 'Timer', label: 'Timer' },
          { value: 'Erro', label: 'Erro' },
          { value: 'Sinal', label: 'Sinal' },
          { value: 'Cancelamento', label: 'Cancelamento' },
          { value: 'Compensação', label: 'Compensação' },
          { value: 'Escalonamento', label: 'Escalonamento' },
          { value: 'Terminar', label: 'Terminar' },
          { value: 'Link', label: 'Link' }
        ];
      
      case 'Data Object':
        return [
          { value: 'Envio', label: 'Envio' },
          { value: 'Recebimento', label: 'Recebimento' }
        ];
      
      case 'Mensagem':
        return [
          { value: 'Envio', label: 'Envio' },
          { value: 'Recebimento', label: 'Recebimento' }
        ];
      
      default:
        return [];
    }
  };

  const subtypeOptions = getSubtypeOptions();
  const hasSubtype = subtypeOptions.length > 0;
  const requiresDirection = ['Data Object', 'Mensagem'].includes(element.type);

  return (
    <div className="element-row">
      <div className="element-number">{elementNumber}</div>
      
      {/* Mostrar indicador especial para gateways */}
      {['Gateway Exclusivo', 'Gateway Paralelo'].includes(element.type) && (
        <div className="gateway-indicator" title={`Este gateway pode ser referenciado pelo índice ${elementNumber}`}>
          🔗
        </div>
      )}
      
      <div className="element-controls">
        <button
          type="button"
          className="move-button"
          onClick={() => moveElement(element.id, 'up')}
          disabled={isFirst}
          title="Mover para cima"
        >
          ▲
        </button>
        <button
          type="button"
          className="move-button"
          onClick={() => moveElement(element.id, 'down')}
          disabled={isLast}
          title="Mover para baixo"
        >
          ▼
        </button>
      </div>

      <select
        className="element-type"
        value={element.type || 'Atividade'}
        onChange={(e) => {
          const newType = e.target.value;
          // Reset subtype when type changes
          handleUpdate('type', newType);
          handleUpdate('subtype', '');
        }}
      >
        <option value="Atividade">Atividade</option>
        <option value="Gateway Exclusivo">Gateway Exclusivo</option>
        <option value="Gateway Paralelo">Gateway Paralelo</option>
        <option value="Gateway Existente">Gateway Existente</option>
        <option value="Evento Intermediario">Evento Intermediário</option>
        <option value="Fim">Fim</option>
        <option value="Mensagem">Mensagem</option>
        <option value="Data Object">Data Object</option>
      </select>

      {hasSubtype && (
        <select
          className="element-subtype"
          value={element.subtype || subtypeOptions[0]?.value || ''}
          onChange={(e) => handleUpdate('subtype', e.target.value)}
        >
          {subtypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        className="element-label"
        value={element.label || ''}
        onChange={(e) => handleUpdate('label', e.target.value)}
        placeholder="Nome/descrição do elemento"
      />

      {!['Mensagem', 'Data Object'].includes(element.type) && (
        <select
          className="element-participant"
          value={element.participant || ''}
          onChange={(e) => handleUpdate('participant', e.target.value)}
        >
          <option value="">Selecione participante</option>
          {allParticipants.map(participant => (
            <option key={participant} value={participant}>
              {participant}
            </option>
          ))}
        </select>
      )}

      {element.type === 'Gateway Existente' && (
        <select
          className="element-gateway-ref"
          value={element.refGateway || ''}
          onChange={(e) => handleUpdate('refGateway', parseInt(e.target.value))}
        >
          <option value="">Selecione gateway</option>
          {getExistingGateways().map((gateway) => (
            <option key={gateway.id} value={gateway.index}>
              Índice {gateway.index} - {gateway.label || gateway.type}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        className="removeElementRow"
        onClick={() => removeElement(element.id)}
        title="Remover elemento"
      >
        ✕
      </button>
    </div>
  );
};

export default ElementRow;