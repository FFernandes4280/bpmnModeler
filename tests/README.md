# Sistema de Testes - BPMN Modeler

Este sistema permite testar automaticamente se o `diagramCreator` está gerando os diagramas BPMN corretos a partir dos elementos de entrada.

## Estrutura dos Testes

```
tests/
├── testRunner.js           # Sistema principal de testes
├── test-report.json       # Relatório dos últimos testes executados  
└── cases/                 # Casos de teste
    ├── test1-config.json  # Configuração do teste 1
    ├── test1-input.json   # Entrada do teste 1 
    └── test1-expected.bpmn # Saída esperada do teste 1
```

## Como Usar

### Executar todos os testes
```bash
npm test
```

### Executar um teste específico
```bash
npm run test:specific test1-config.json
```

### Executar testes em modo watch (reexecuta quando arquivos mudam)
```bash
npm run test:watch
```

## Como Adicionar Novos Testes

### 1. Criar arquivos do teste
Para adicionar um novo teste (exemplo: teste2), crie 3 arquivos na pasta `tests/cases/`:

**test2-config.json**
```json
{
  "name": "Teste 2 - Descrição do seu teste",
  "description": "Descrição detalhada do que este teste valida",
  "processName": "Nome do processo",
  "participants": ["Participante 1", "Participante 2"],
  "hasExternalParticipants": false,
  "externalParticipants": [],
  "inputFile": "test2-input.json",
  "expectedFile": "test2-expected.bpmn"
}
```

**test2-input.json**
```json
[
  {
    "type": "Inicio", 
    "name": "Evento inicial",
    "lane": "Participante 1"
  },
  // ... seus elementos de teste
]
```

**test2-expected.bpmn**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions ...>
  <!-- XML BPMN esperado -->
</bpmn2:definitions>
```

### 2. Gerar arquivo esperado
Para gerar o arquivo `.bpmn` esperado:

1. Execute o teste (vai falhar na primeira vez):
   ```bash
   npm run test:specific test2-config.json
   ```

2. Um arquivo `test2-expected-generated.bpmn` será criado com o resultado atual

3. Se o resultado estiver correto, renomeie para `test2-expected.bpmn`:
   ```bash
   cd tests/cases
   mv test2-expected-generated.bpmn test2-expected.bpmn
   ```

4. Execute o teste novamente para confirmar que passa

## Estrutura do Relatório

O sistema gera um relatório em `tests/test-report.json` com:
- Timestamp da execução
- Resumo (total, passou, falhou)
- Detalhes de cada teste
- Arquivos gerados para debug quando testes falham

## Como Funciona

1. **Carregamento**: O sistema busca todos os arquivos `*-config.json` na pasta `cases/`
2. **Validação**: Verifica se os arquivos de input e expected existem
3. **Execução**: Para cada teste:
   - Carrega o JSON de entrada
   - Executa `generateDiagramFromInput()` com os parâmetros do config
   - Compara o XML gerado com o esperado
4. **Relatório**: Mostra resultados no console e salva relatório detalhado

## Dicas

- Use nomes descritivos para os testes (test1, test2, etc.)
- Sempre teste cases de sucesso e casos de erro
- Mantenha os arquivos de input pequenos e focados
- Use a descrição no config para explicar o que está sendo testado
- Quando um teste falhar, verifique o arquivo `-generated.bpmn` para debug
