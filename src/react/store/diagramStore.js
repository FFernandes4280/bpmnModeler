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

  // Action para remover elemento de uma divergência (com suporte a aninhamento)
  removeElementFromDivergence: (gatewayId, divergenceIndex, elementId) => set((state) => {
    const removeRecursively = (elements) => {
      return elements.map(el => {
        if (el.id === gatewayId && el.type === 'Gateway') {
          const updatedElement = { ...el };
          if (updatedElement.divergences && updatedElement.divergences[divergenceIndex]) {
            updatedElement.divergences[divergenceIndex] = updatedElement.divergences[divergenceIndex].filter(divEl => divEl.id !== elementId);
          }
          return updatedElement;
        } else if (el.type === 'Gateway' && el.divergences) {
          // Busca recursivamente em gateways aninhados
          const updatedElement = { ...el };
          updatedElement.divergences = {};
          Object.keys(el.divergences).forEach(divIndex => {
            updatedElement.divergences[divIndex] = removeRecursively(el.divergences[divIndex] || []);
          });
          return updatedElement;
        }
        return el;
      });
    };

    return {
      elements: removeRecursively(state.elements)
    };
  }),
  
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
  
  // Helper para processar lista de participantes
  _parseParticipantsList: (participantString) => {
    return participantString.split(',').map(p => p.trim()).filter(p => p);
  },

  // Helpers para obter dados processados
  getParticipantsList: () => {
    const { participants, _parseParticipantsList } = get();
    return _parseParticipantsList(participants);
  },
  
  getExternalParticipantsList: () => {
    const { hasExternalParticipants, externalParticipants, _parseParticipantsList } = get();
    return hasExternalParticipants === 'Sim' 
      ? _parseParticipantsList(externalParticipants)
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
  
  // Função auxiliar para converter estrutura aninhada em flat com índices
  convertToFlatStructure: (elements) => {
    const flatElements = [];
    let currentIndex = 0;
    
    const processElement = (element, isInDivergence = false) => {
      const elementIndex = currentIndex++;
      const processed = {
        type: element.type,
        label: element.label || '',
        participant: element.participant || '',
        index: elementIndex
      };
      
      // Adiciona propriedades específicas baseadas no tipo
      switch (element.type) {
        case 'Atividade':
          processed.name = `${element.subtype || 'Default'}_${element.label || `Atividade_${elementIndex + 1}`}`;
          processed.lane = element.participant;
          break;
          
        case 'Evento Intermediario':
          processed.name = `${element.subtype || 'Padrão'}_${element.label || `Evento_${elementIndex + 1}`}`;
          processed.lane = element.participant;
          break;
          
        case 'Fim':
          processed.name = `${element.subtype || 'Padrão'}_${element.label || `Fim_${elementIndex + 1}`}`;
          processed.lane = element.participant;
          break;
          
        case 'Gateway':
          const gatewaySubtype = element.subtype;
          const gatewayLabel = element.label || 'Conv';
          processed.type = `Gateway ${gatewaySubtype}`;
          processed.lane = element.participant;
          processed.name = `following${element.label || ''}_${element.participant || 'Gateway'}`;
          
          // Se não for convergência, processar divergências
          if (gatewayLabel !== 'Conv' && !isNaN(parseInt(gatewayLabel))) {
            const numDivergences = parseInt(gatewayLabel);
            processed.diverge = [];
            
            // Reserva espaço para o gateway atual
            flatElements.push(processed);
            
            // Processa cada divergência
            for (let divIndex = 1; divIndex <= numDivergences; divIndex++) {
              const divergenceElements = element.divergences?.[divIndex] || [];
              
              if (divergenceElements.length > 0) {
                // Índice do primeiro elemento desta divergência
                processed.diverge.push(currentIndex);
                
                // Processa todos os elementos desta divergência
                divergenceElements.forEach(divEl => {
                  processElement(divEl, true);
                });
              }
            }
            
            // Retorna null pois já adicionamos o elemento
            return null;
          }
          break;
          
        case 'Gateway Existente':
          processed.refGateway = element.refGateway;
          processed.type = 'Gateway Existente';
          processed.originalType = 'Gateway Exclusivo'; // ou Paralelo, baseado no original
          processed.lane = element.participant;
          break;
          
        case 'Mensagem':
          processed.name = `${element.subtype || 'Envio'}_Mensagem_${elementIndex + 1}`;
          processed.direction = element.subtype || 'Envio';
          processed.lane = element.externalParticipant || '';
          break;
          
        case 'Data Object':
          processed.name = `${element.subtype || 'Envio'}_${element.label || `Data_${elementIndex + 1}`}`;
          processed.direction = element.subtype || 'Envio';
          break;
          
        default:
          processed.name = element.label || `${element.type}_${elementIndex + 1}`;
      }
      
      return processed;
    };
    
    // Processa todos os elementos principais
    elements.forEach(element => {
      const processed = processElement(element, false);
      if (processed) {
        flatElements.push(processed);
      }
    });
    
    return flatElements;
  },
  
    // Função auxiliar para converter estrutura aninhada em flat com índices
  convertToFlatStructure: (elements) => {
    const flatElements = [];
    let currentIndex = 0;
    let previousElementName = ''; // Rastreia o nome do elemento anterior
    
    // Obtém o primeiro participante como padrão
    const { getParticipantsList } = get();
    const participantsList = getParticipantsList();
    const defaultParticipant = participantsList.length > 0 ? participantsList[0] : '';
    
    const processElement = (element) => {
      const elementIndex = currentIndex;
      currentIndex++; // Incrementa para o próximo elemento
      const processed = {};
      
      // Adiciona propriedades específicas baseadas no tipo
      switch (element.type) {
        case 'Atividade':
          processed.type = 'Atividade';
          processed.name = `${element.subtype || 'Default'}_${element.label || `Atividade_${elementIndex + 1}`}`;
          processed.lane = element.participant || defaultParticipant;
          previousElementName = element.label || `Atividade_${elementIndex + 1}`;
          break;
          
        case 'Evento Intermediario':
          processed.type = 'Evento Intermediario';
          processed.name = `${element.subtype || 'Padrão'}_${element.label || `Evento_${elementIndex + 1}`}`;
          processed.lane = element.participant || defaultParticipant;
          previousElementName = element.label || `Evento_${elementIndex + 1}`;
          break;
          
        case 'Fim':
          processed.type = 'Fim';
          processed.name = `${element.subtype || 'Padrão'}_${element.label || `Fim_${elementIndex + 1}`}`;
          processed.lane = element.participant || defaultParticipant;
          previousElementName = element.label || `Fim_${elementIndex + 1}`;
          break;
          
        case 'Gateway':
          const gatewaySubtype = element.subtype;
          const gatewayLabel = element.label || 'Conv';
          processed.type = `Gateway ${gatewaySubtype}`;
          processed.lane = element.participant || defaultParticipant;
          // Usa o nome do elemento anterior, normalizado
          const normalizedPrevName = previousElementName.replace(/\s+/g, '_').replace(/[^\w]/g, '');
          processed.name = `following${element.subtype || 'Exclusivo'}_${normalizedPrevName}`;
          previousElementName = `Gateway_${elementIndex + 1}`;
          
          // Se não for convergência, processar divergências
          if (gatewayLabel !== 'Conv' && !isNaN(parseInt(gatewayLabel))) {
            const numDivergences = parseInt(gatewayLabel);
            processed.diverge = [];
            
            // Reserva espaço para o gateway atual
            flatElements.push(processed);
            
            // Processa cada divergência
            for (let divIndex = 1; divIndex <= numDivergences; divIndex++) {
              const divergenceElements = element.divergences?.[divIndex] || [];
              
              if (divergenceElements.length > 0) {
                // Índice do primeiro elemento desta divergência
                processed.diverge.push(currentIndex);
                
                // Processa todos os elementos desta divergência
                divergenceElements.forEach(divEl => {
                  const processedDivEl = processElement(divEl);
                  if (processedDivEl) {
                    flatElements.push(processedDivEl);
                  }
                });
              }
            }
            
            // Retorna null pois já adicionamos o elemento
            return null;
          } else {
            // Gateway de convergência - será preenchido depois
            processed._needsDiverge = true;
            processed._gatewayIndex = elementIndex;
          }
          break;
          
        case 'Gateway Existente':
          processed.type = 'Gateway Existente';
          
          // Busca o gateway referenciado no array original para copiar EXATAMENTE seus dados
          if (element.refGateway !== undefined) {
            const { elements } = get();
            const refGatewayIndex = element.refGateway - 1; // Converte para índice 0-based (React array)
            const referencedGateway = elements[refGatewayIndex];
            
            if (referencedGateway && referencedGateway.type === 'Gateway') {
              // Busca o elemento ANTERIOR ao gateway referenciado para gerar o nome correto
              const elementBeforeGateway = refGatewayIndex > 0 ? elements[refGatewayIndex - 1] : null;
              const prevLabel = elementBeforeGateway?.label || '';
              const normalizedPrevLabel = prevLabel.replace(/\s+/g, '_').replace(/[^\w]/g, '');
              
              // Copia EXATAMENTE o mesmo padrão de nome do gateway referenciado
              processed.name = `following${referencedGateway.subtype || 'Exclusivo'}_${normalizedPrevLabel}`;
              processed.lane = element.participant || referencedGateway.participant || defaultParticipant;
              processed.originalType = `Gateway ${referencedGateway.subtype || 'Exclusivo'}`;
              processed.index = element.refGateway;
            } else {
              // Fallback se não encontrar o gateway referenciado
              processed.name = element.name || `Gateway_Existente_${elementIndex + 1}`;
              processed.lane = element.participant || defaultParticipant;
              processed.originalType = `Gateway ${element.originalSubtype || 'Exclusivo'}`;
              processed.index = element.refGateway;
            }
          } else {
            // Sem referência - gera nome genérico
            processed.name = element.name || `Gateway_Existente_${elementIndex + 1}`;
            processed.lane = element.participant || defaultParticipant;
            processed.originalType = `Gateway ${element.originalSubtype || 'Exclusivo'}`;
          }
          
          previousElementName = `Gateway_Existente_${elementIndex + 1}`;
          break;
          
        case 'Mensagem':
          processed.type = 'Mensagem';
          processed.name = `${element.subtype || 'Envio'}_${element.label || `Mensagem_${elementIndex + 1}`}`;
          processed.lane = element.externalParticipant || '';
          previousElementName = element.label || `Mensagem_${elementIndex + 1}`;
          break;
          
        case 'Data Object':
          processed.type = 'Data Object';
          processed.name = `${element.subtype || 'Envio'}_${element.label || `Data_${elementIndex + 1}`}`;
          previousElementName = element.label || `Data_${elementIndex + 1}`;
          break;
          
        default:
          processed.type = element.type;
          processed.name = element.label || `${element.type}_${elementIndex + 1}`;
          processed.lane = element.participant || defaultParticipant;
          previousElementName = element.label || `${element.type}_${elementIndex + 1}`;
      }
      
      return processed;
    };
    
    // Processa todos os elementos principais
    elements.forEach(element => {
      const processed = processElement(element);
      if (processed) {
        flatElements.push(processed);
      }
    });
    
    // Atualiza diverge dos gateways de convergência após processar tudo
    flatElements.forEach((el, index) => {
      if (el._needsDiverge) {
        const nextIndex = index + 1;
        if (nextIndex < flatElements.length) {
          el.diverge = [nextIndex];
        } else {
          el.diverge = [];
        }
        // Remove propriedades temporárias
        delete el._needsDiverge;
        delete el._gatewayIndex;
      }
    });
    
    return flatElements;
  },
  
  // Função para atualizar diagrama
  updateDiagram: async (processState) => {
    const { viewer, convertToFlatStructure } = get();
    
    if (!processState || !viewer) {
      return;
    }
    
    try {
      // Converte elementos React para formato flat do diagramCreator
      const processedElements = convertToFlatStructure(processState.elements);
      
      // Ajusta os índices do diverge para considerar o elemento inicial que será adicionado
      processedElements.forEach(el => {
        if (el.diverge && Array.isArray(el.diverge) && el.diverge.length > 0) {
          el.diverge = el.diverge.map(idx => idx + 1); // +1 porque o elemento inicial será o índice 0
        }
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
      
    } catch (error) {
      // Silently handle errors
    }
  }
}));