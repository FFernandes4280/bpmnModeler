import fs from 'fs';
import path from 'path';
import { generateDiagramFromInput } from '../src/diagramCreator.js';

class TestRunner {
  constructor() {
    this.testsDir = path.join(process.cwd(), 'tests', 'cases');
    this.results = [];
  }

  /**
   * Carrega todos os casos de teste disponíveis
   */
  loadTestCases() {
    const testCases = [];
    const files = fs.readdirSync(this.testsDir);
    
    // Busca por arquivos de configuração
    const configFiles = files.filter(file => file.endsWith('-config.json'));
    
    for (const configFile of configFiles) {
      try {
        const configPath = path.join(this.testsDir, configFile);
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Verifica se os arquivos de input e expected existem
        const inputPath = path.join(this.testsDir, config.inputFile);
        const expectedPath = path.join(this.testsDir, config.expectedFile);
        
        if (fs.existsSync(inputPath) && fs.existsSync(expectedPath)) {
          testCases.push({
            ...config,
            configFile,
            inputPath,
            expectedPath
          });
        } else {
          console.warn(`⚠️ Arquivos faltando para teste: ${config.name}`);
          if (!fs.existsSync(inputPath)) console.warn(`   Input: ${config.inputFile}`);
          if (!fs.existsSync(expectedPath)) console.warn(`   Expected: ${config.expectedFile}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao carregar config ${configFile}:`, error.message);
      }
    }
    
    return testCases;
  }

  /**
   * Normaliza XML para comparação (remove espaços e quebras de linha desnecessárias)
   */
  normalizeXML(xml) {
    return xml
      .replace(/>\s+</g, '><')  // Remove espaços entre tags
      .replace(/\s+/g, ' ')     // Normaliza espaços múltiplos
      .trim();
  }

  /**
   * Compara dois arquivos BPMN
   */
  compareBPMN(generated, expected) {
    const normalizedGenerated = this.normalizeXML(generated);
    const normalizedExpected = this.normalizeXML(expected);
    
    return {
      isEqual: normalizedGenerated === normalizedExpected,
      generated: normalizedGenerated,
      expected: normalizedExpected
    };
  }

  /**
   * Executa um caso de teste específico
   */
  async runSingleTest(testCase) {
    console.log(`\n🧪 Executando: ${testCase.name}`);
    console.log(`📝 ${testCase.description}`);
    
    try {
      // Carrega o input
      const inputData = JSON.parse(fs.readFileSync(testCase.inputPath, 'utf8'));
      
      // Carrega o resultado esperado
      const expectedResult = fs.readFileSync(testCase.expectedPath, 'utf8');
      
      // Gera o diagrama usando diagramCreator
      const generatedXML = await generateDiagramFromInput(
        testCase.processName,
        testCase.participants,
        testCase.hasExternalParticipants,
        testCase.externalParticipants,
        inputData
      );
      
      // Compara os resultados
      const comparison = this.compareBPMN(generatedXML, expectedResult);
      
      const testResult = {
        name: testCase.name,
        configFile: testCase.configFile,
        passed: comparison.isEqual,
        generated: comparison.generated,
        expected: comparison.expected,
        error: null
      };
      
      if (comparison.isEqual) {
        console.log(`✅ PASSOU`);
      } else {
        console.log(`❌ FALHOU`);
        console.log(`   Resultado gerado difere do esperado`);
        
        // Salva o resultado gerado para debug
        const debugPath = testCase.expectedPath.replace('.bpmn', '-generated.bpmn');
        fs.writeFileSync(debugPath, generatedXML);
        console.log(`   Resultado gerado salvo em: ${path.basename(debugPath)}`);
      }
      
      return testResult;
      
    } catch (error) {
      console.log(`💥 ERRO: ${error.message}`);
      return {
        name: testCase.name,
        configFile: testCase.configFile,
        passed: false,
        generated: null,
        expected: null,
        error: error.message
      };
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🚀 Iniciando execução dos testes...\n');
    
    const testCases = this.loadTestCases();
    
    if (testCases.length === 0) {
      console.log('⚠️ Nenhum caso de teste encontrado!');
      return;
    }
    
    console.log(`📋 Encontrados ${testCases.length} caso(s) de teste:`);
    testCases.forEach(test => {
      console.log(`   - ${test.name}`);
    });
    
    this.results = [];
    
    for (const testCase of testCases) {
      const result = await this.runSingleTest(testCase);
      this.results.push(result);
    }
    
    this.generateReport();
  }

  /**
   * Gera relatório final dos testes
   */
  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    
    console.log(`Total de testes: ${this.results.length}`);
    console.log(`✅ Passaram: ${passed}`);
    console.log(`❌ Falharam: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.name}`);
        if (result.error) {
          console.log(`     Erro: ${result.error}`);
        }
      });
    }
    
    // Salva relatório em arquivo
    const reportPath = path.join(process.cwd(), 'tests', 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total: this.results.length, passed, failed },
      results: this.results
    }, null, 2));
    
    console.log(`\n📄 Relatório detalhado salvo em: tests/test-report.json`);
  }

  /**
   * Executa um teste específico pelo nome do arquivo de config
   */
  async runTest(configFileName) {
    const testCases = this.loadTestCases();
    const testCase = testCases.find(tc => tc.configFile === configFileName);
    
    if (!testCase) {
      console.error(`❌ Teste não encontrado: ${configFileName}`);
      return;
    }
    
    const result = await this.runSingleTest(testCase);
    
    console.log('\n📊 RESULTADO:');
    if (result.passed) {
      console.log('✅ Teste passou!');
    } else {
      console.log('❌ Teste falhou!');
      if (result.error) {
        console.log(`Erro: ${result.error}`);
      }
    }
  }
}

// Permite usar como módulo ou executar diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  
  // Verifica se foi especificado um teste específico
  const specificTest = process.argv[2];
  
  if (specificTest) {
    await runner.runTest(specificTest);
  } else {
    await runner.runAllTests();
  }
}

export { TestRunner };
