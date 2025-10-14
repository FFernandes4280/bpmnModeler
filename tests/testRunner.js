#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDiagramFromInput } from '../src/diagramCreator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class TestRunner {
    constructor() {
        this.testCasesDir = path.join(__dirname, 'testCases');
        this.expectedDir = path.join(__dirname, 'expected');
        this.resultsDir = path.join(__dirname, 'results');
        this.passed = 0;
        this.failed = 0;
        this.errors = [];
    }

    log(message, color = colors.reset) {
        console.log(`${color}${message}${colors.reset}`);
    }

    async loadTestCase(testName) {
        const testPath = path.join(this.testCasesDir, `${testName}.js`);
        
        if (!fs.existsSync(testPath)) {
            throw new Error(`Test case file not found: ${testPath}`);
        }

        // Dynamic import to load the test case
        const testModule = await import(`file://${testPath}`);
        return testModule.testCase;
    }

    async runSingleTest(testName) {
        this.log(`\n${colors.blue}Running test: ${testName}${colors.reset}`);
        
        try {
            // Load test case
            const testCase = await this.loadTestCase(testName);
            
            if (!testCase) {
                throw new Error(`No testCase export found in ${testName}.js`);
            }

            // Validate test case structure
            this.validateTestCase(testCase, testName);

            // Generate BPMN from test input
            const result = await generateDiagramFromInput(
                testCase.processName,
                testCase.participants,
                testCase.hasExternalParticipants,
                testCase.externalParticipants,
                testCase.elements
            );

            // Save result
            const resultPath = path.join(this.resultsDir, `${testName}.bpmn`);
            fs.writeFileSync(resultPath, result, 'utf8');

            // Compare with expected result
            const expectedPath = path.join(this.expectedDir, `${testName}.bpmn`);
            
            if (!fs.existsSync(expectedPath)) {
                this.log(`${colors.yellow}⚠ Expected file not found: ${expectedPath}${colors.reset}`);
                this.log(`${colors.yellow}  Result saved to: ${resultPath}${colors.reset}`);
                this.log(`${colors.yellow}  Please review and copy to expected folder if correct.${colors.reset}`);
                return 'no-expected';
            }

            const expected = fs.readFileSync(expectedPath, 'utf8');
            
            if (this.compareXML(result, expected)) {
                this.log(`${colors.green}✓ PASSED: ${testName}${colors.reset}`);
                this.passed++;
                return 'passed';
            } else {
                this.log(`${colors.red}✗ FAILED: ${testName}${colors.reset}`);
                this.log(`${colors.red}  Expected: ${expectedPath}${colors.reset}`);
                this.log(`${colors.red}  Actual:   ${resultPath}${colors.reset}`);
                this.showDifferences(expected, result, testName);
                this.failed++;
                this.errors.push(testName);
                return 'failed';
            }

        } catch (error) {
            this.log(`${colors.red}✗ ERROR in ${testName}: ${error.message}${colors.reset}`);
            this.failed++;
            this.errors.push(`${testName}: ${error.message}`);
            return 'error';
        }
    }

    validateTestCase(testCase, testName) {
        const required = ['processName', 'participants', 'hasExternalParticipants', 'elements'];
        const missing = required.filter(field => testCase[field] === undefined);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields in ${testName}: ${missing.join(', ')}`);
        }

        if (!Array.isArray(testCase.elements) || testCase.elements.length === 0) {
            throw new Error(`${testName}: elements must be a non-empty array`);
        }
    }

    compareXML(xml1, xml2) {
        // Normalize whitespace and remove non-significant differences
        const normalize = (xml) => {
            return xml
                .replace(/>\s+</g, '><') // Remove whitespace between tags
                .replace(/\s+/g, ' ')    // Normalize internal whitespace
                .trim();
        };

        return normalize(xml1) === normalize(xml2);
    }

    showDifferences(expected, actual, testName) {
        const expectedLines = expected.split('\n');
        const actualLines = actual.split('\n');
        const maxLines = Math.max(expectedLines.length, actualLines.length);
        
        this.log(`${colors.yellow}\nDifferences in ${testName}:${colors.reset}`);
        
        let diffCount = 0;
        for (let i = 0; i < maxLines && diffCount < 10; i++) {
            const expectedLine = expectedLines[i] || '';
            const actualLine = actualLines[i] || '';
            
            if (expectedLine !== actualLine) {
                diffCount++;
                this.log(`${colors.yellow}Line ${i + 1}:${colors.reset}`);
                this.log(`${colors.red}- ${expectedLine}${colors.reset}`);
                this.log(`${colors.green}+ ${actualLine}${colors.reset}`);
            }
        }
        
        if (diffCount >= 10) {
            this.log(`${colors.yellow}... (showing first 10 differences)${colors.reset}`);
        }
    }

    async getAllTestCases() {
        if (!fs.existsSync(this.testCasesDir)) {
            return [];
        }

        return fs.readdirSync(this.testCasesDir)
            .filter(file => file.endsWith('.js'))
            .map(file => path.basename(file, '.js'));
    }

    async runAllTests() {
        const testCases = await this.getAllTestCases();
        
        if (testCases.length === 0) {
            this.log(`${colors.yellow}No test cases found in ${this.testCasesDir}${colors.reset}`);
            return;
        }

        this.log(`${colors.bold}Running ${testCases.length} test(s)...${colors.reset}`);
        
        for (const testName of testCases) {
            await this.runSingleTest(testName);
        }

        this.showSummary();
    }

    showSummary() {
        this.log(`\n${colors.bold}Test Summary:${colors.reset}`);
        this.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
        this.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
        
        if (this.errors.length > 0) {
            this.log(`\n${colors.red}Errors:${colors.reset}`);
            this.errors.forEach(error => this.log(`  ${colors.red}• ${error}${colors.reset}`));
        }

        if (this.failed === 0) {
            this.log(`\n${colors.green}${colors.bold}All tests passed! 🎉${colors.reset}`);
        } else {
            this.log(`\n${colors.red}${colors.bold}Some tests failed. Please check the output above.${colors.reset}`);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const runner = new TestRunner();

    // Ensure directories exist
    [runner.testCasesDir, runner.expectedDir, runner.resultsDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    if (args.length === 0) {
        // Run all tests
        await runner.runAllTests();
    } else if (args[0] === '--help' || args[0] === '-h') {
        console.log(`
Usage: npm run test [testName]

Commands:
  npm run test              Run all tests
  npm run test:specific [testName]  Run a specific test
  npm run test:create [testName]    Create a new test template
  npm run test:watch        Run tests in watch mode

Examples:
  npm run test
  npm run test:specific myTest
  npm run test:create newTest
        `);
    } else {
        // Run specific test
        const testName = args[0];
        const result = await runner.runSingleTest(testName);
        
        if (result === 'passed') {
            runner.log(`\n${colors.green}${colors.bold}Test passed! ✓${colors.reset}`);
        } else if (result === 'no-expected') {
            runner.log(`\n${colors.yellow}${colors.bold}Test completed but no expected file found.${colors.reset}`);
        } else {
            runner.log(`\n${colors.red}${colors.bold}Test failed! ✗${colors.reset}`);
            process.exit(1);
        }
    }
}

main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
});