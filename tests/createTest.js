#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function createTestTemplate(testName) {
    const template = `// Test case: ${testName}
// Description: [Add description of what this test validates]

export const testCase = {
    // Process configuration
    processName: "Test Process - ${testName}",
    
    // Participants (lanes)
    participants: [
        "Lane 1",
        "Lane 2"
    ],
    
    // External participants configuration
    hasExternalParticipants: "Não", // "Sim" or "Não"
    externalParticipants: [], // Only used if hasExternalParticipants is "Sim"
    
    // Process elements - modify this array with your test data
    elements: [
        {
            "type": "Inicio",
            "name": "Start Event",
            "lane": "Lane 1"
        },
        {
            "type": "Atividade", 
            "name": "Default_Task 1",
            "lane": "Lane 1"
        },
        {
            "type": "Fim",
            "name": "End Event",
            "lane": "Lane 1"
        }
    ]
};

/*
Available element types:
- "Inicio" - Start event
- "Fim" - End event
- "Atividade" - Task/Activity
- "Mensagem" - Message event
- "Evento Intermediario" - Intermediate event
- "Gateway Exclusivo" - Exclusive gateway
- "Gateway Paralelo" - Parallel gateway
- "Gateway Existente" - Existing gateway (for convergence)

For gateways with divergence, add a "diverge" property with an array of target indices:
{
    "type": "Gateway Exclusivo",
    "name": "Decision Gateway",
    "lane": "Lane 1", 
    "diverge": [2, 4] // indices of elements to connect to
}

For existing gateways (convergence), add "originalType":
{
    "type": "Gateway Existente",
    "name": "gatewayName", // must match the original gateway name
    "lane": "Lane 1",
    "originalType": "Gateway Exclusivo"
}
*/`;

    return template;
}

async function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function createTest(testName) {
    const testCasesDir = path.join(__dirname, 'testCases');
    const testPath = path.join(testCasesDir, `${testName}.js`);

    // Ensure directory exists
    if (!fs.existsSync(testCasesDir)) {
        fs.mkdirSync(testCasesDir, { recursive: true });
    }

    // Check if test already exists
    if (fs.existsSync(testPath)) {
        const overwrite = await promptUser(
            `${colors.yellow}Test '${testName}' already exists. Overwrite? (y/N): ${colors.reset}`
        );
        
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
            log(`${colors.blue}Test creation cancelled.${colors.reset}`);
            return;
        }
    }

    // Create test file
    const template = createTestTemplate(testName);
    fs.writeFileSync(testPath, template, 'utf8');

    log(`${colors.green}✓ Test case created: ${testPath}${colors.reset}`);
    log(`${colors.blue}Next steps:${colors.reset}`);
    log(`  1. Edit the test case file to define your test data`);
    log(`  2. Run: ${colors.bold}npm run test:specific ${testName}${colors.reset}`);
    log(`  3. If the output is correct, copy the result to expected:`);
    log(`     ${colors.bold}cp tests/results/${testName}.bpmn tests/expected/${testName}.bpmn${colors.reset}`);
    log(`  4. Run the test again to verify it passes`);
}

async function listTests() {
    const testCasesDir = path.join(__dirname, 'testCases');
    
    if (!fs.existsSync(testCasesDir)) {
        log(`${colors.yellow}No test cases directory found.${colors.reset}`);
        return;
    }

    const testFiles = fs.readdirSync(testCasesDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.basename(file, '.js'));

    if (testFiles.length === 0) {
        log(`${colors.yellow}No test cases found.${colors.reset}`);
        return;
    }

    log(`${colors.bold}Available test cases:${colors.reset}`);
    testFiles.forEach(test => {
        const expectedPath = path.join(__dirname, 'expected', `${test}.bpmn`);
        const hasExpected = fs.existsSync(expectedPath);
        const status = hasExpected ? `${colors.green}✓${colors.reset}` : `${colors.yellow}⚠${colors.reset}`;
        log(`  ${status} ${test}`);
    });

    if (testFiles.some(test => !fs.existsSync(path.join(__dirname, 'expected', `${test}.bpmn`)))) {
        log(`\n${colors.yellow}⚠ = Missing expected result file${colors.reset}`);
        log(`${colors.green}✓ = Ready to run${colors.reset}`);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        log(`${colors.red}Usage: npm run test:create <testName>${colors.reset}`);
        log(`${colors.red}   or: npm run test:create list${colors.reset}`);
        process.exit(1);
    }

    const command = args[0];

    if (command === 'list') {
        await listTests();
    } else if (command === '--help' || command === '-h') {
        console.log(`
Test Creator Utility

Usage:
  npm run test:create <testName>  Create a new test case
  npm run test:create list        List all test cases

Example:
  npm run test:create simpleProcess
        `);
    } else {
        const testName = command;
        await createTest(testName);
    }
}

main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
});