#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function showTestStatus() {
    const testCasesDir = path.join(__dirname, 'testCases');
    const expectedDir = path.join(__dirname, 'expected');
    const resultsDir = path.join(__dirname, 'results');

    log(`${colors.bold}Test Environment Status:${colors.reset}\n`);

    // Check directories
    const dirs = [
        { name: 'Test Cases', path: testCasesDir },
        { name: 'Expected Results', path: expectedDir },
        { name: 'Test Results', path: resultsDir }
    ];

    dirs.forEach(dir => {
        const exists = fs.existsSync(dir.path);
        const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        const count = exists ? fs.readdirSync(dir.path).length : 0;
        log(`${status} ${dir.name}: ${dir.path} (${count} files)`);
    });

    if (!fs.existsSync(testCasesDir)) {
        log(`\n${colors.yellow}No test cases found. Create your first test with:${colors.reset}`);
        log(`${colors.bold}npm run test:create myFirstTest${colors.reset}`);
        return;
    }

    // Analyze test cases
    const testFiles = fs.readdirSync(testCasesDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.basename(file, '.js'));

    if (testFiles.length === 0) {
        log(`\n${colors.yellow}No test cases found.${colors.reset}`);
        return;
    }

    log(`\n${colors.bold}Test Cases Analysis:${colors.reset}`);
    
    let ready = 0;
    let missing = 0;
    let outdated = 0;

    testFiles.forEach(testName => {
        const testPath = path.join(testCasesDir, `${testName}.js`);
        const expectedPath = path.join(expectedDir, `${testName}.bpmn`);
        const resultPath = path.join(resultsDir, `${testName}.bpmn`);

        const hasExpected = fs.existsSync(expectedPath);
        const hasResult = fs.existsSync(resultPath);

        let status, description;

        if (!hasExpected && !hasResult) {
            status = `${colors.red}✗${colors.reset}`;
            description = 'Never run';
            missing++;
        } else if (!hasExpected && hasResult) {
            status = `${colors.yellow}⚠${colors.reset}`;
            description = 'Missing expected file';
            missing++;
        } else if (hasExpected && !hasResult) {
            status = `${colors.blue}i${colors.reset}`;
            description = 'Ready to run';
            ready++;
        } else {
            // Both exist, check if result is newer than expected
            const expectedStat = fs.statSync(expectedPath);
            const resultStat = fs.statSync(resultPath);
            
            if (resultStat.mtime > expectedStat.mtime) {
                status = `${colors.yellow}⚠${colors.reset}`;
                description = 'Result newer than expected';
                outdated++;
            } else {
                status = `${colors.green}✓${colors.reset}`;
                description = 'Ready';
                ready++;
            }
        }

        log(`  ${status} ${testName.padEnd(20)} ${description}`);
    });

    log(`\n${colors.bold}Summary:${colors.reset}`);
    log(`  ${colors.green}Ready: ${ready}${colors.reset}`);
    log(`  ${colors.yellow}Missing/Outdated: ${missing + outdated}${colors.reset}`);
    log(`  ${colors.blue}Total: ${testFiles.length}${colors.reset}`);

    if (missing > 0 || outdated > 0) {
        log(`\n${colors.yellow}Recommended actions:${colors.reset}`);
        if (missing > 0) {
            log(`  • Run tests and review results, then copy to expected folder`);
        }
        if (outdated > 0) {
            log(`  • Review updated results and update expected files if correct`);
        }
    }
}

function validateTestEnvironment() {
    log(`${colors.bold}Validating Test Environment...${colors.reset}\n`);

    const issues = [];
    
    // Check if main directories exist
    const testCasesDir = path.join(__dirname, 'testCases');
    const expectedDir = path.join(__dirname, 'expected');
    const resultsDir = path.join(__dirname, 'results');

    [testCasesDir, expectedDir, resultsDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`${colors.green}✓ Created directory: ${dir}${colors.reset}`);
        }
    });

    // Check test cases
    if (!fs.existsSync(testCasesDir) || fs.readdirSync(testCasesDir).filter(f => f.endsWith('.js')).length === 0) {
        issues.push('No test cases found');
    }

    // Check if diagramCreator is accessible
    try {
        const diagramCreatorPath = path.join(__dirname, '../src/diagramCreator.js');
        if (!fs.existsSync(diagramCreatorPath)) {
            issues.push('diagramCreator.js not found in src folder');
        }
    } catch (error) {
        issues.push(`Cannot access diagramCreator: ${error.message}`);
    }

    // Check package.json scripts
    try {
        const packagePath = path.join(__dirname, '../package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const requiredScripts = ['test', 'test:specific', 'test:create'];
        const missingScripts = requiredScripts.filter(script => !packageData.scripts[script]);
        
        if (missingScripts.length > 0) {
            issues.push(`Missing npm scripts: ${missingScripts.join(', ')}`);
        }
    } catch (error) {
        issues.push(`Cannot read package.json: ${error.message}`);
    }

    if (issues.length === 0) {
        log(`${colors.green}✓ Test environment is properly configured!${colors.reset}`);
        log(`\n${colors.blue}Available commands:${colors.reset}`);
        log(`  npm run test              - Run all tests`);
        log(`  npm run test:specific <name> - Run specific test`);
        log(`  npm run test:create <name>   - Create new test`);
        log(`  npm run test:status       - Show test status`);
    } else {
        log(`${colors.red}Issues found:${colors.reset}`);
        issues.forEach(issue => log(`  ${colors.red}• ${issue}${colors.reset}`));
        process.exit(1);
    }
}

function cleanResults() {
    const resultsDir = path.join(__dirname, 'results');
    
    if (!fs.existsSync(resultsDir)) {
        log(`${colors.yellow}Results directory doesn't exist.${colors.reset}`);
        return;
    }

    const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.bpmn'));
    
    if (files.length === 0) {
        log(`${colors.blue}No result files to clean.${colors.reset}`);
        return;
    }

    files.forEach(file => {
        fs.unlinkSync(path.join(resultsDir, file));
    });

    log(`${colors.green}✓ Cleaned ${files.length} result file(s).${colors.reset}`);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        log(`${colors.red}Usage: node testUtils.js <command>${colors.reset}`);
        log(`${colors.blue}Commands: status, validate, clean${colors.reset}`);
        process.exit(1);
    }

    const command = args[0];

    switch (command) {
        case 'status':
            showTestStatus();
            break;
        case 'validate':
            validateTestEnvironment();
            break;
        case 'clean':
            cleanResults();
            break;
        case '--help':
        case '-h':
            console.log(`
Test Utilities

Commands:
  status    Show detailed status of all test cases
  validate  Validate test environment setup
  clean     Clean all result files

Usage:
  npm run test:status
  npm run test:validate
  node tests/testUtils.js clean
            `);
            break;
        default:
            log(`${colors.red}Unknown command: ${command}${colors.reset}`);
            log(`${colors.blue}Available commands: status, validate, clean${colors.reset}`);
            process.exit(1);
    }
}

main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
});