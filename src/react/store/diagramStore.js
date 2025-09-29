import { create } from 'zustand';
import { generateDiagramFromInput } from '../../diagramCreator.js';

export const useDiagramStore = create((set, get) => ({
  // Configuração do Processo
  processName: '',
  participants: '',
  hasExternalParticipants: 'Não',
  externalParticipants: '',
  
  // Evento Inicial
  initialEventName: '',
  initialEventType: 'Padrão',
  initialEventLane: '',
  
  // Elementos
  elements: [],
  
  // Estado do Diagrama
  viewer: null,
  
  // Actions para configuração do processo
  setProcessName: (name) => set({ processName: name }),
  setParticipants: (participants) => set({ participants }),
  setHasExternalParticipants: (hasExternal) => set({ hasExternalParticipants: hasExternal }),
  setExternalParticipants: (external) => set({ externalParticipants: external }),
  
  // Actions para evento inicial
  setInitialEventName: (name) => set({ initialEventName: name }),
  setInitialEventType: (type) => set({ initialEventType: type }),
  setInitialEventLane: (lane) => set({ initialEventLane: lane }),
  
  // Actions para o viewer
  setViewer: (viewer) => set({ viewer }),
  
  // Actions para elementos
  addElement: (element) => set((state) => ({
    elements: [...state.elements, { ...element, id: Date.now() + Math.random() }]
  })),

  // Action para adicionar elemento a uma divergência (com suporte a aninhamento)
  addElementToDivergence: (gatewayId, divergenceIndex, newElement) => set((state) => {
    const addElementRecursively = (elements) => {
      return elements.map(el => {
        if (el.id === gatewayId && el.type === 'Gateway') {
          const updatedElement = { ...el };
          if (!updatedElement.divergences) {
            // Inicializa divergências baseado no valor do gateway
            const gatewayValue = updatedElement.label || 'Conv';
            if (gatewayValue !== 'Conv' && !isNaN(parseInt(gatewayValue))) {
              const numDivergences = parseInt(gatewayValue);
              updatedElement.divergences = {};
              for (let i = 1; i <= numDivergences; i++) {
                updatedElement.divergences[i] = [];
              }
            } else {
              updatedElement.divergences = {};
            }
          }
          if (!updatedElement.divergences[divergenceIndex]) {
            updatedElement.divergences[divergenceIndex] = [];
          }
          
          const elementWithId = {
            ...newElement,
            id: Date.now() + Math.random() // Gerar ID único
          };
          
          updatedElement.divergences[divergenceIndex] = [
            ...updatedElement.divergences[divergenceIndex],
            elementWithId
          ];
          return updatedElement;
        } else if (el.type === 'Gateway' && el.divergences) {
          // Buscar em gateways aninhados
          const updatedElement = { ...el };
          updatedElement.divergences = {
            1: addElementRecursively(updatedElement.divergences[1] || []),
            2: addElementRecursively(updatedElement.divergences[2] || [])
          };
          return updatedElement;
        }
        return el;
      });
    };

    return {
      elements: addElementRecursively(state.elements)
    };
  }),

  // Action para atualizar elemento dentro de uma divergência (com suporte a aninhamento)
  updateElementInDivergence: (gatewayId, divergenceIndex, elementId, updates) => set((state) => {
    const updateElementsRecursively = (elements) => {
      return elements.map(el => {
        if (el.id === gatewayId && el.type === 'Gateway' && el.divergences) {
          const updatedElement = { ...el };
          if (updatedElement.divergences[divergenceIndex]) {
            updatedElement.divergences[divergenceIndex] = updatedElement.divergences[divergenceIndex].map(divEl => {
              if (divEl.id === elementId) {
                const updatedDivEl = { ...divEl, ...updates };
                // Se está se tornando um Gateway, inicializa divergências baseado no valor
                if (updates.type === 'Gateway') {
                  const gatewayValue = updates.label || 'Conv';
                  if (gatewayValue !== 'Conv' && !isNaN(parseInt(gatewayValue))) {
                    const numDivergences = parseInt(gatewayValue);
                    const divergences = {};
                    for (let i = 1; i <= numDivergences; i++) {
                      divergences[i] = [];
                    }
                    updatedDivEl.divergences = divergences;
                  }
                }
                // Se está atualizando o label de um gateway existente
                if (divEl.type === 'Gateway' && updates.label) {
                  const gatewayValue = updates.label;
                  if (gatewayValue !== 'Conv' && !isNaN(parseInt(gatewayValue))) {
                    const numDivergences = parseInt(gatewayValue);
                    const divergences = {};
                    for (let i = 1; i <= numDivergences; i++) {
                      divergences[i] = updatedDivEl.divergences?.[i] || [];
                    }
                    updatedDivEl.divergences = divergences;
                  } else if (gatewayValue === 'Conv') {
                    updatedDivEl.divergences = {};
                  }
                }
                return updatedDivEl;
              } else if (divEl.type === 'Gateway' && divEl.divergences) {
                // Atualizar gateways aninhados
                const nestedUpdate = { ...divEl };
                nestedUpdate.divergences = {
                  1: updateElementsRecursively(nestedUpdate.divergences[1] || []),
                  2: updateElementsRecursively(nestedUpdate.divergences[2] || [])
                };
                return nestedUpdate;
              }
              return divEl;
            });
          }
          return updatedElement;
        } else if (el.type === 'Gateway' && el.divergences) {
          // Buscar em outros gateways principais
          const updatedElement = { ...el };
          updatedElement.divergences = {
            1: updateElementsRecursively(updatedElement.divergences[1] || []),
            2: updateElementsRecursively(updatedElement.divergences[2] || [])
          };
          return updatedElement;
        }
        return el;
      });
    };

    return {
      elements: updateElementsRecursively(state.elements)
    };
  }),

  // Action para remover elemento de uma divergência
  removeElementFromDivergence: (gatewayId, divergenceIndex, elementId) => set((state) => ({
    elements: state.elements.map(el => {
      if (el.id === gatewayId && el.type === 'Gateway') {
        const updatedElement = { ...el };
        if (updatedElement.divergences && updatedElement.divergences[divergenceIndex]) {
          updatedElement.divergences[divergenceIndex] = updatedElement.divergences[divergenceIndex].filter(divEl => divEl.id !== elementId);
        }
        return updatedElement;
      }
      return el;
    })
  })),
  
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
  })),
  
  removeElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id)
  })),
  
  moveElement: (id, direction) => set((state) => {
    const elements = [...state.elements];
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return state;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= elements.length) return state;
    
    [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
    return { elements };
  }),
  
  // Helpers para obter dados processados
  getParticipantsList: () => {
    const { participants } = get();
    return participants.split(',').map(p => p.trim()).filter(p => p);
  },
  
  getExternalParticipantsList: () => {
    const { hasExternalParticipants, externalParticipants } = get();
    return hasExternalParticipants === 'Sim' 
      ? externalParticipants.split(',').map(p => p.trim()).filter(p => p)
      : [];
  },
  
  getAllParticipants: () => {
    const { getParticipantsList, getExternalParticipantsList } = get();
    return [...getParticipantsList(), ...getExternalParticipantsList()];
  },
  
  // Obter gateways existentes com seus índices
  getExistingGateways: () => {
    const { elements } = get();
    return elements
      .map((el, index) => ({ ...el, index: index + 1 }))
      .filter(el => el.type === 'Gateway');
  },
  
  // Obter elemento por índice
  getElementByIndex: (index) => {
    const { elements } = get();
    return elements[index - 1] || null;
  },
  
  // Função para atualizar diagrama
  updateDiagram: async (processState) => {
    const { viewer } = get();
    
    if (!processState || !viewer) {
      console.log('⚠️ Missing processState or viewer, skipping diagram update');
      return;
    }
    
    try {
      console.log('� Starting diagram update...');
      
      // Converte elementos React para formato do diagramCreator
      const processedElements = processState.elements.map((element, index) => {
        const processed = {
          type: element.type,
          label: element.label || '',
          participant: element.participant || ''
        };
        
        // Adiciona propriedades específicas baseadas no tipo
        switch (element.type) {
          case 'Atividade':
            processed.name = `${element.subtype || 'Default'}_${element.label || `Atividade_${index + 1}`}`;
            processed.lane = element.participant;
            break;
            
          case 'Evento Intermediario':
            processed.name = `${element.subtype || 'Padrão'}_${element.label || `Evento_${index + 1}`}`;
            processed.lane = element.participant;
            break;
            
          case 'Fim':
            processed.name = `${element.subtype || 'Padrão'}_${element.label || `Fim_${index + 1}`}`;
            processed.lane = element.participant;
            break;
            
          case 'Gateway':
            const gatewaySubtype = element.subtype;
            const divergenceValue = element.label || '1';
            processed.name = `Gateway_${gatewaySubtype}_${divergenceValue}_${index + 1}`;
            processed.type = `Gateway ${gatewaySubtype}`;
            processed.lane = element.participant;
            break;
            
          case 'Gateway Existente':
            processed.refGateway = element.refGateway;
            // Nome será resolvido pelo diagramCreator baseado na referência
            break;
            
          case 'Mensagem':
            processed.name = `${element.subtype || 'Envio'}_Mensagem_${index + 1}`;
            processed.direction = element.subtype || 'Envio';
            processed.lane = element.externalParticipant || '';
            break;
            
          case 'Data Object':
            processed.name = `${element.subtype || 'Envio'}_${element.label || `Data_${index + 1}`}`;
            processed.direction = element.subtype || 'Envio';
            break;
            
          default:
            processed.name = element.label || `${element.type}_${index + 1}`;
        }
        
        return processed;
      });
      
      // Adiciona elemento inicial
      const initialElement = {
        type: 'Inicio',
        name: `${processState.initialEventType || 'Padrão'}_${processState.initialEventName}`,
        lane: processState.initialEventLane
      };
      
      const allElements = [initialElement, ...processedElements];
      
      // Processa participantes
      const participantsList = processState.participants
        .split(',')
        .map(p => p.trim())
        .filter(p => p);
        
      const externalParticipantsList = processState.hasExternalParticipants === 'Sim'
        ? processState.externalParticipants.split(',').map(p => p.trim()).filter(p => p)
        : [];
      
      console.log('🔍 Elements:', allElements);
      // Chama o diagramCreator
      const diagramXML = await generateDiagramFromInput(
        processState.processName,
        participantsList,
        processState.hasExternalParticipants,
        externalParticipantsList,
        allElements
      );
      
      // Atualiza o viewer com o novo diagrama
      await viewer.importXML(diagramXML);
      
      // Auto-ajusta o zoom para mostrar todo o diagrama
      setTimeout(() => {
        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport', 'auto');
      }, 100);
      
      console.log('✅ Diagram updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating diagram:', error);
    }
  }
}));