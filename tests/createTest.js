#!/usr/bin/env node

/**
 * Script para criar novos casos de teste facilmente
 * Uso: node tests/createTest.js <nome-do-teste> [descrição]
 */

import fs from 'fs';
import path from 'path';

function createNewTest() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 Uso: node tests/createTest.js <nome-do-teste> [descrição]');
    console.log('📝 Exemplo: node tests/createTest.js test2 "Teste com gateways paralelos"');
    return;
  }
  
  const testName = args[0];
  const testDescription = args[1] || `Teste ${testName}`;
  const testNumber = testName.replace('test', '');
  
  const testsDir = path.join(process.cwd(), 'tests', 'cases');
  
  // Verifica se teste já existe
  const configFile = `${testName}-config.json`;
  if (fs.existsSync(path.join(testsDir, configFile))) {
    console.error(`❌ Teste ${testName} já existe!`);
    return;
  }
  
  // Template da configuração
  const configTemplate = {
    name: `Test ${testNumber} - ${testDescription}`,
    description: testDescription,
    processName: "Processo de Teste",
    participants: ["Participante 1", "Participante 2"],
    hasExternalParticipants: false,
    externalParticipants: [],
    inputFile: `${testName}-input.json`,
    expectedFile: `${testName}-expected.bpmn`
  };
  
  // Template do input (caso básico)
  const inputTemplate = [
    {
      type: "Inicio",
      name: "Início do Processo",
      lane: "Participante 1"
    },
    {
      type: "Atividade", 
      name: "Primeira Atividade",
      lane: "Participante 1",
      index: 1
    },
    {
      type: "Fim",
      name: "Fim do Processo", 
      lane: "Participante 1",
      index: 2
    }
  ];
  
  try {
    // Cria arquivos
    fs.writeFileSync(
      path.join(testsDir, `${testName}-config.json`),
      JSON.stringify(configTemplate, null, 2)
    );
    
    fs.writeFileSync(
      path.join(testsDir, `${testName}-input.json`),
      JSON.stringify(inputTemplate, null, 2)
    );
    
    console.log(`✅ Teste ${testName} criado com sucesso!`);
    console.log(`📁 Arquivos criados:`);
    console.log(`   - tests/cases/${testName}-config.json`);
    console.log(`   - tests/cases/${testName}-input.json`);
    console.log(`\n📝 Próximos passos:`);
    console.log(`1. Edite o arquivo ${testName}-input.json com seus elementos de teste`);
    console.log(`2. Execute: npm run test:specific ${testName}-config.json`);
    console.log(`3. Se o resultado estiver correto, renomeie o arquivo gerado:`);
    console.log(`   mv tests/cases/${testName}-expected-generated.bpmn tests/cases/${testName}-expected.bpmn`);
    console.log(`4. Execute o teste novamente para confirmar que passa`);
    
  } catch (error) {
    console.error(`❌ Erro ao criar teste: ${error.message}`);
  }
}

createNewTest();
