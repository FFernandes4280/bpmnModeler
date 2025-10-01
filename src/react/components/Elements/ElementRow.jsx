import React, { useEffect } from 'react';
import { useDiagramStore } from '../../store/diagramStore.js';

const ElementRow = ({ element, index }) => {
  const {
    updateElement,
    removeElement,
    moveElement,
    addElement,
    addElementToDivergence,
    updateElementInDivergence,
    removeElementFromDivergence,
    getParticipantsList,
    getExternalParticipantsList,
    getExistingGateways,
    elements
  } = useDiagramStore();

  const internalParticipants = getParticipantsList();
  const externalParticipants = getExternalParticipantsList();
  const elementNumber = index + 1;
  const isFirst = index === 0;
  const isLast = index === elements.length - 1;

  const handleUpdate = (field, value) => {
    updateElement(element.id, { [field]: value });
  };

  const handleAddElement = () => {
    const newElement = {
      type: 'Atividade',
      subtype: 'Default',
      label: '',
      participant: '',
      direction: ''
    };
    addElement(newElement);
  };

  const handleAddElementToDivergence = (divergenceIndex) => {
    const newElement = {
      type: 'Atividade',
      subtype: 'Default',
      label: '',
      participant: '',
      direction: ''
    };
    addElementToDivergence(element.id, divergenceIndex, newElement);
  };

  // Função utilitária para "flatten" dos elementos (inclui divergências recursivamente)
  function flattenElements(elementsList) {
    let flat = [];
    for (const el of elementsList) {
      flat.push(el);
      if (el.type === 'Gateway' && el.divergences) {
        const gatewayValue = el.label || 'Conv';
        if (gatewayValue !== 'Conv' && !isNaN(parseInt(gatewayValue))) {
          const numDivergences = parseInt(gatewayValue);
          for (let d = 1; d <= numDivergences; d++) {
            const divs = el.divergences[d] || [];
            flat = flat.concat(flattenElements(divs));
          }
        }
      }
    }
    return flat;
  }

  // Lista linear de todos os elementos (incluindo aninhados)
  const flatElements = flattenElements(elements);

  // Função para obter o índice absoluto do elemento atual
  const getAbsoluteIndex = (elementId) => {
    return flatElements.findIndex(el => el.id === elementId) + 1;
  };

  // Função recursiva para renderizar elementos (incluindo gateways aninhados)
  const renderDivergenceElement = (divElement, divElementIndex, parentGateway, parentDivIndex, depth = 0) => {
    const divSubtypeOptions = getSubtypeOptions(divElement.type);
    const divHasSubtype = divSubtypeOptions.length > 0;
    const globalNumber = getAbsoluteIndex(divElement.id);

    return (
      <div key={divElement.id} className="element-container">
        {/* Element row principal */}
        <div className="element-row">
          <div className="element-number">{globalNumber}</div>

          <div className="element-controls">
            <button type="button" className="move-button">▲</button>
            <button type="button" className="move-button">▼</button>
          </div>

          <select
            className="element-type"
            value={divElement.type || 'Atividade'}
            onChange={(e) => {
              const newType = e.target.value;
              const updates = { type: newType, subtype: '' };

              // Auto-inicializar subtipo e label para gateways
              if (newType === 'Gateway') {
                updates.subtype = 'Exclusivo';
                updates.label = 'Conv';
                updates.divergences = { 1: [], 2: [] }; // Inicializa divergências
              }

              updateElementInDivergence(parentGateway.id, parentDivIndex, divElement.id, updates);
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

          {/* Subtype para elementos da divergência */}
          {divHasSubtype && (
            <select
              className="element-subtype"
              value={divElement.subtype || divSubtypeOptions[0]?.value || ''}
              onChange={(e) => updateElementInDivergence(parentGateway.id, parentDivIndex, divElement.id, { subtype: e.target.value })}
            >
              {divSubtypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Label ou convergência para elementos da divergência */}
          {divElement.type === 'Gateway' ? (
            <div className="gateway-convergence-container">
              <button
                type="button"
                onClick={() => {
                  const currentLabel = divElement.label || 'Conv';
                  let newLabel;
                  if (currentLabel === 'Conv') {
                    newLabel = '2';
                  } else {
                    const currentNum = parseInt(currentLabel) || 2;
                    if (currentNum > 2) {
                      newLabel = (currentNum - 1).toString();
                    } else {
                      newLabel = 'Conv';
                    }
                  }
                  updateElementInDivergence(parentGateway.id, parentDivIndex, divElement.id, { label: newLabel });
                }}
                disabled={divElement.label === 'Conv'}
                className="convergence-button"
                title="Diminuir convergência"
              >
                −
              </button>
              <div
                className="convergence-display"
                title={divElement.label === 'Conv' ? 'Convergência' : divElement.label}
              >
                {divElement.label || 'Conv'}
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentLabel = divElement.label || 'Conv';
                  let newLabel;
                  if (currentLabel === 'Conv') {
                    newLabel = '2';
                  } else {
                    const currentNum = parseInt(currentLabel) || 1;
                    newLabel = (currentNum + 1).toString();
                  }
                  updateElementInDivergence(parentGateway.id, parentDivIndex, divElement.id, { label: newLabel });
                }}
                className="convergence-button"
                title="Aumentar convergência"
              >
                +
              </button>
            </div>
          ) : (
            <input
              type="text"
              className="element-label"
              value={divElement.label || ''}
              onChange={(e) => updateElementInDivergence(parentGateway.id, parentDivIndex, divElement.id, { label: e.target.value })}
              placeholder="Nome"
            />
          )}

          {/* Participante para elementos da divergência */}
          {!['Mensagem', 'Data Object', 'Gateway Existente'].includes(divElement.type) && (
            <select
              className="element-extra"
              value={divElement.participant || ''}
              onChange={(e) => updateElementInDivergence(parentGateway.id, parentDivIndex, divElement.id, { participant: e.target.value })}
            >
              <option value="" disabled>Participante</option>
              {internalParticipants.map(participant => (
                <option key={participant} value={participant}>
                  {participant}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="removeElementRow"
            onClick={() => removeElementFromDivergence(parentGateway.id, parentDivIndex, divElement.id)}
            title="Remover elemento"
          >
            ×
          </button>
        </div>

        {/* Se for um gateway aninhado com divergências ativas, renderiza suas divergências */}
        {divElement.type === 'Gateway' && (() => {
          const gatewayLabel = divElement.label || 'Conv';
          const numDivergences = parseInt(gatewayLabel);
          
          // Só renderiza divergências se não for convergência e tiver número válido
          if (gatewayLabel === 'Conv' || isNaN(numDivergences) || numDivergences <= 0) {
            return null;
          }

          return (
            <div className="nested-gateway-divergences">
              {Array.from({ length: numDivergences }, (_, i) => i + 1).map(nestedDivIndex => {
                const nestedDivergenceElements = divElement.divergences?.[nestedDivIndex] || [];
                
                // Verifica se o último elemento da divergência aninhada é um Gateway com divergências ativas
                const lastNestedElement = nestedDivergenceElements[nestedDivergenceElements.length - 1];
                const shouldShowNestedAddButton = !lastNestedElement || 
                  lastNestedElement.type !== 'Gateway' || 
                  lastNestedElement.label === 'Conv' || 
                  !lastNestedElement.label ||
                  isNaN(parseInt(lastNestedElement.label));

                return (
                  <div key={nestedDivIndex} className="divergence-section">
                    <div className="divergence-header">
                      Divergência {nestedDivIndex} Gateway {globalNumber}
                    </div>

                    {/* Elementos da divergência aninhada */}
                    {nestedDivergenceElements.map((nestedElement, nestedElementIndex) =>
                      renderDivergenceElement(nestedElement, nestedElementIndex, divElement, nestedDivIndex, depth + 1)
                    )}

                    {shouldShowNestedAddButton && (
                      <button
                        type="button"
                        className="add-element-button divergence-add-button"
                        onClick={() => {
                          const newElement = {
                            type: 'Atividade',
                            subtype: 'Default',
                            label: '',
                            participant: '',
                            direction: ''
                          };
                          addElementToDivergence(divElement.id, nestedDivIndex, newElement);
                        }}
                      >
                        Adicionar Linha
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };
  useEffect(() => {
    if (internalParticipants.length === 1 && !element.participant && !['Mensagem', 'Data Object'].includes(element.type)) {
      handleUpdate('participant', internalParticipants[0]);
    }
  }, [internalParticipants, element.participant, element.type]);

  // Auto-define label inicial para Gateways (apenas na criação)
  useEffect(() => {
    if (element.type === 'Gateway' && !element.label) {
      handleUpdate('label', 'Conv');
    }
  }, [element.type]);

  // Auto-define subtipo inicial para Gateways (apenas na criação)
  useEffect(() => {
    if (element.type === 'Gateway' && !element.subtype) {
      handleUpdate('subtype', 'Exclusivo');
    }
  }, [element.type]);

  // Inicializa divergências baseado no valor do gateway
  useEffect(() => {
    if (element.type === 'Gateway' && element.label) {
      const gatewayValue = element.label;
      if (gatewayValue !== 'Conv' && !isNaN(parseInt(gatewayValue))) {
        const numDivergences = parseInt(gatewayValue);
        const currentDivergences = element.divergences || {};
        const newDivergences = {};

        // Preserva divergências existentes e cria novas se necessário
        for (let i = 1; i <= numDivergences; i++) {
          newDivergences[i] = currentDivergences[i] || [];
        }

        // Só atualiza se houver mudança
        const needsUpdate = Object.keys(currentDivergences).length !== numDivergences ||
          !Object.keys(newDivergences).every(key => currentDivergences[key]);

        if (needsUpdate) {
          handleUpdate('divergences', newDivergences);
        }
      } else if (gatewayValue === 'Conv' && element.divergences && Object.keys(element.divergences).length > 0) {
        handleUpdate('divergences', {});
      }
    }
  }, [element.type, element.label]);

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

  const getSubtypeOptions = (elementType = element.type) => {
    switch (elementType) {
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
  const isGateway = element.type === 'Gateway';

  // Renderização especial para Gateways
  if (isGateway) {
    const gatewayValue = element.label || 'Conv';
    return (
      <div className="gateway-block">
        {/* Controles do Gateway */}
        <div className="element-row">
          <div className="element-number">{elementNumber}</div>
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
          <select
            className="element-extra"
            value={element.participant || (internalParticipants.length === 1 ? internalParticipants[0] : '')}
            onChange={(e) => handleUpdate('participant', e.target.value)}
          >
            <option value="" disabled>Participante</option>
            {internalParticipants.map(participant => (
              <option key={participant} value={participant}>
                {participant}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="removeElementRow"
            onClick={() => removeElement(element.id)}
            title="Remover elemento"
          >
            ×
          </button>
        </div>
        {/* Divergências dinâmicas baseadas no valor do gateway */}
        <div className="gateway-divergences">
          {(() => {
            const numDivergencesLocal = parseInt(gatewayValue);
            if (gatewayValue === 'Conv' || isNaN(numDivergencesLocal) || numDivergencesLocal <= 0) {
              return null;
            }
            const divergenceIndexes = Array.from({ length: numDivergencesLocal }, (_, i) => i + 1);
            return divergenceIndexes.map(divIndex => {
              const divergenceElements = element.divergences?.[divIndex] || [];
              
              // Verifica se o último elemento da divergência é um Gateway com divergências ativas
              const lastDivElement = divergenceElements[divergenceElements.length - 1];
              const shouldShowDivAddButton = !lastDivElement || 
                lastDivElement.type !== 'Gateway' || 
                lastDivElement.label === 'Conv' || 
                !lastDivElement.label ||
                isNaN(parseInt(lastDivElement.label));
              
              return (
                <div key={divIndex} className="divergence-section">
                  <div className="divergence-header">
                    Divergência {divIndex} Gateway {elementNumber}
                  </div>
                  {/* Elementos da divergência */}
                  {divergenceElements.map((divElement, divElementIndex) =>
                    renderDivergenceElement(divElement, divElementIndex, element, divIndex)
                  )}
                  {shouldShowDivAddButton && (
                    <button
                      type="button"
                      className="add-element-button divergence-add-button"
                      onClick={() => handleAddElementToDivergence(divIndex)}
                    >
                      Adicionar Linha
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

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
      ) : element.type === 'Mensagem' ? (
        <select
          className="element-message-participant"
          value={element.externalParticipant || ''}
          onChange={(e) => handleUpdate('externalParticipant', e.target.value)}
        >
          <option value="" disabled>Participante Externo</option>
          {externalParticipants.map(participant => (
            <option key={participant} value={participant}>
              {participant}
            </option>
          ))}
        </select>
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
          value={element.participant || (internalParticipants.length === 1 ? internalParticipants[0] : '')}
          onChange={(e) => handleUpdate('participant', e.target.value)}
        >
          <option value="" disabled>Participante</option>
          {internalParticipants.map(participant => (
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