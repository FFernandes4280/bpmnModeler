import React, { useEffect } from 'react';
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

  // Auto-seleciona participante se houver apenas um disponível
  useEffect(() => {
    if (allParticipants.length === 1 && !element.participant && !['Mensagem', 'Data Object'].includes(element.type)) {
      handleUpdate('participant', allParticipants[0]);
    }
  }, [allParticipants, element.participant, element.type]);

  // Auto-define label inicial para Gateways (apenas na criação)
  useEffect(() => {
    if (element.type === 'Gateway' && !element.label) {
      handleUpdate('label', 'Conv');
    }
  }, [element.type]);

  // Função para controlar o contador de convergência
  const handleConvergenceChange = (direction) => {
    const currentLabel = element.label || 'Conv';
    
    if (direction === 'increment') {
      if (currentLabel === 'Conv') {
        handleUpdate('label', '2');
      } else {
        const currentNum = parseInt(currentLabel) || 1;
        handleUpdate('label', (currentNum + 1).toString());
      }
    } else if (direction === 'decrement') {
      if (currentLabel === '2') {
        handleUpdate('label', 'Conv');
      } else {
        const currentNum = parseInt(currentLabel) || 2;
        if (currentNum > 2) {
          handleUpdate('label', (currentNum - 1).toString());
        }
      }
    }
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
      case 'Gateway':
        return [
          { value: 'Exclusivo', label: 'Exclusivo' },
          { value: 'Paralelo', label: 'Paralelo' }
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
        <option value="Evento Intermediario">Evento Intermediário</option>
        <option value="Gateway">Gateway</option>
        <option value="Gateway Existente">Gateway Existente</option>
        <option value="Mensagem">Mensagem</option>
        <option value="Data Object">Data Object</option>
        <option value="Fim">Fim</option>
      </select>

      {hasSubtype && element.type !== 'Gateway Existente' && (
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

      {element.type === 'Gateway Existente' ? (
        <select
          className="element-gateway-ref"
          value={element.refGateway || ''}
          onChange={(e) => handleUpdate('refGateway', parseInt(e.target.value))}
        >
          <option value="">Selecione gateway</option>
          {getExistingGateways().filter(gateway => gateway.id !== element.id).map((gateway) => (
            <option key={gateway.id} value={gateway.index}>
              Índice {gateway.index}
            </option>
          ))}
        </select>
      ) : element.type === 'Gateway' ? (
        <div className="gateway-convergence-container">
          <button
            type="button"
            onClick={() => handleConvergenceChange('decrement')}
            disabled={element.label === 'Conv'}
            className="convergence-button"
            title="Diminuir convergência"
          >
            −
          </button>
          <div 
            className="convergence-display"
            title={element.label === 'Conv' ? 'Convergência' : element.label}
          >
            {element.label || 'Conv'}
          </div>
          <button
            type="button"
            onClick={() => handleConvergenceChange('increment')}
            className="convergence-button"
            title="Aumentar convergência"
          >
            +
          </button>
        </div>
      ) : element.type !== 'Gateway Existente' ? (
        <input
          type="text"
          className="element-label"
          value={element.label || ''}
          onChange={(e) => handleUpdate('label', e.target.value)}
          placeholder="Nome"
        />
      ) : null}

      {!['Mensagem', 'Data Object', 'Gateway Existente'].includes(element.type) && (
        <select
          className="element-extra"
          value={element.participant || (allParticipants.length === 1 ? allParticipants[0] : '')}
          onChange={(e) => handleUpdate('participant', e.target.value)}
        >
          <option value="" disabled>Participante</option>
          {allParticipants.map(participant => (
            <option key={participant} value={participant}>
              {participant}
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
        ×
      </button>
    </div>
  );
};

export default ElementRow;