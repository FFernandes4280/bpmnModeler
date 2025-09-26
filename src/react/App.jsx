import React, { useEffect } from 'react';
import { useDiagramStore } from './store/diagramStore.js';
import ProcessConfig from './components/ProcessConfig/ProcessConfig.jsx';
import ElementsContainer from './components/Elements/ElementsContainer.jsx';
import DiagramViewer from './components/Diagram/DiagramViewer.jsx';
import './styles/App.css';

const App = () => {
  const {
    processName,
    participants,
    hasExternalParticipants,
    externalParticipants,
    initialEventName,
    initialEventType,
    initialEventLane,
    elements,
    updateDiagram
  } = useDiagramStore();

  // useEffect que observa mudanças no estado do processo
  useEffect(() => {
    // Debounce para evitar muitas chamadas
    const timeoutId = setTimeout(() => {
      // Monta o estado completo do processo
      const processState = {
        processName,
        participants,
        hasExternalParticipants,
        externalParticipants,
        initialEventName,
        initialEventType,
        initialEventLane,
        elements
      };

      // Chama a função de atualização apenas se temos dados básicos
      if (processName && participants && initialEventName && initialEventLane) {
        updateDiagram(processState);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [
    processName,
    participants,
    hasExternalParticipants,
    externalParticipants,
    initialEventName,
    initialEventType,
    initialEventLane,
    elements,
    updateDiagram
  ]);

  return (
    <div className="app">
      <div className="form-container">
        <div className="form-content">
          <ProcessConfig />
          <ElementsContainer />
        </div>
      </div>
      <div className="diagram-container">
        <DiagramViewer />
      </div>
    </div>
  );
};

export default App;