import React from 'react';
import { useDiagramStore } from '../../store/diagramStore.js';
import ElementRow from './ElementRow.jsx';
import './ElementRow.css';

const ElementsContainer = () => {
  const { elements, addElement } = useDiagramStore();

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

  // Verifica se o último elemento é um Gateway com divergências ativas
  const lastElement = elements[elements.length - 1];
  const shouldShowAddButton = !lastElement || 
    lastElement.type !== 'Gateway' || 
    lastElement.label === 'Conv' || 
    !lastElement.label ||
    isNaN(parseInt(lastElement.label));

  return (
    <div className="elements-section">
      <label>Elementos:</label>
      
      <div className="elements-container">
        {elements.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic', margin: '10px 0' }}>
            Nenhum elemento adicionado. Clique em "Adicionar Linha" para começar.
          </p>
        ) : (
          elements.map((element, index) => (
            <ElementRow 
              key={element.id} 
              element={element} 
              index={index}
            />
          ))
        )}
      </div>
      
      {shouldShowAddButton && (
        <button 
          type="button" 
          className="add-element-button"
          onClick={handleAddElement}
        >
          Adicionar Linha
        </button>
      )}
    </div>
  );
};

export default ElementsContainer;