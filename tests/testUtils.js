import fs from 'fs';
import path from 'path';

/**
 * Utilitários para debugging e validação de testes
 */
class TestUtils {
  
  /**
   * Valida se um arquivo de input está bem formado
   */
  static validateInputFile(inputPath) {
    try {
      const content = fs.readFileSync(inputPath, 'utf8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        return { valid: false, error: 'Input deve ser um array' };
      }
      
      const requiredFields = ['type', 'name', 'lane'];
      const errors = [];
      
      data.forEach((element, index) => {
        requiredFields.forEach(field => {
          if (!element[field]) {
            errors.push(`Elemento ${index}: campo '${field}' obrigatório`);
          }
        });
        
        // Validar tipos conhecidos
        const validTypes = [
          'Inicio', 'Fim', 'Atividade', 'Gateway Exclusivo', 
          'Gateway Paralelo', 'Gateway Existente', 'Evento Intermediario'
        ];
        
        if (!validTypes.includes(element.type)) {
          errors.push(`Elemento ${index}: tipo '${element.type}' não reconhecido`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        elementCount: data.length
      };
      
    } catch (error) {
      return { 
        valid: false, 
        error: `Erro ao parsear JSON: ${error.message}` 
      };
    }
  }
  
  /**
   * Lista todos os casos de teste e seu status
   */
  static listTestCases() {
    const testsDir = path.join(process.cwd(), 'tests', 'cases');
    const files = fs.readdirSync(testsDir);
    
    const configFiles = files.filter(f => f.endsWith('-config.json'));
    const testCases = [];
    
    for (const configFile of configFiles) {
      try {
        const config = JSON.parse(fs.readFileSync(path.join(testsDir, configFile), 'utf8'));
        const inputExists = fs.existsSync(path.join(testsDir, config.inputFile));
        const expectedExists = fs.existsSync(path.join(testsDir, config.expectedFile));
        
        let inputValidation = null;
        if (inputExists) {
          inputValidation = this.validateInputFile(path.join(testsDir, config.inputFile));
        }
        
        testCases.push({
          name: config.name,
          configFile,
          inputFile: config.inputFile,
          expectedFile: config.expectedFile,
          inputExists,
          expectedExists,
          inputValid: inputValidation?.valid || false,
          inputErrors: inputValidation?.errors || [],
          complete: inputExists && expectedExists && (inputValidation?.valid || false)
        });
        
      } catch (error) {
        testCases.push({
          name: `[ERRO] ${configFile}`,
          configFile,
          error: error.message,
          complete: false
        });
      }
    }
    
    return testCases;
  }
  
  /**
   * Gera relatório de status dos testes
   */
  static generateStatusReport() {
    const testCases = this.listTestCases();
    
    console.log('📋 STATUS DOS CASOS DE TESTE');
    console.log('='.repeat(60));
    
    if (testCases.length === 0) {
      console.log('⚠️ Nenhum caso de teste encontrado');
      return;
    }
    
    testCases.forEach(test => {
      const status = test.complete ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
      
      if (test.error) {
        console.log(`   💥 Erro na configuração: ${test.error}`);
      } else {
        if (!test.inputExists) {
          console.log(`   📄 Arquivo de input ausente: ${test.inputFile}`);
        } else if (!test.inputValid) {
          console.log(`   ❌ Arquivo de input inválido:`);
          test.inputErrors.forEach(error => {
            console.log(`      - ${error}`);
          });
        }
        
        if (!test.expectedExists) {
          console.log(`   📄 Arquivo expected ausente: ${test.expectedFile}`);
        }
      }
    });
    
    const complete = testCases.filter(t => t.complete).length;
    console.log(`\n📊 RESUMO: ${complete}/${testCases.length} testes completos`);
  }
}

// Execução direta
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      TestUtils.generateStatusReport();
      break;
    case 'validate':
      const inputFile = process.argv[3];
      if (!inputFile) {
        console.log('❌ Uso: node tests/testUtils.js validate <arquivo-input>');
        break;
      }
      const result = TestUtils.validateInputFile(inputFile);
      console.log(result.valid ? '✅ Válido' : '❌ Inválido');
      if (!result.valid) {
        if (result.error) {
          console.log(`Erro: ${result.error}`);
        }
        if (result.errors) {
          result.errors.forEach(error => console.log(`- ${error}`));
        }
      }
      break;
    default:
      console.log('📝 Comandos disponíveis:');
      console.log('  status   - Mostra status de todos os testes');
      console.log('  validate - Valida um arquivo de input');
      console.log('');
      console.log('📝 Exemplos:');
      console.log('  node tests/testUtils.js status');
      console.log('  node tests/testUtils.js validate tests/cases/test1-input.json');
  }
}

export { TestUtils };
