# BPMN Modeler Testing System

This testing system provides comprehensive automated testing for the BPMN diagram generator. It allows you to create test cases, run tests, and validate BPMN output against expected results.

## Directory Structure

```
tests/
├── testCases/          # Test case definitions (.js files)
├── expected/           # Expected BPMN output files (.bpmn files)
├── results/            # Generated test results (.bpmn files)
├── testRunner.js       # Main test runner
├── createTest.js       # Test creation utility
├── testUtils.js        # Additional utilities
└── README.md           # This file
```

## Quick Start

### 1. Create a New Test
```bash
npm run test:create myTestName
```

This creates a new test template in `tests/testCases/myTestName.js`. Edit the file to define your test data.

### 2. Run the Test
```bash
npm run test:specific myTestName
```

This generates the BPMN output and saves it to `tests/results/myTestName.bpmn`.

### 3. Set Expected Result
If the generated BPMN is correct, copy it to the expected folder:
```bash
cp tests/results/myTestName.bpmn tests/expected/myTestName.bpmn
```

### 4. Verify Test Passes
```bash
npm run test:specific myTestName
```

The test should now pass with a green checkmark.

## Available Commands

### Running Tests
- `npm run test` - Run all test cases
- `npm run test:specific <testName>` - Run a specific test case
- `npm run test:watch` - Run tests in watch mode (reruns on file changes)

### Managing Tests
- `npm run test:create <testName>` - Create a new test case template
- `npm run test:create list` - List all existing test cases
- `npm run test:status` - Show detailed status of all test cases
- `npm run test:validate` - Validate test environment setup
- `npm run test:clean` - Clean all generated result files

## Test Case Structure

Each test case is a JavaScript file that exports a `testCase` object:

```javascript
export const testCase = {
    // Process configuration
    processName: "My Test Process",
    
    // Participants (lanes)
    participants: [
        "Lane 1",
        "Lane 2"
    ],
    
    // External participants configuration  
    hasExternalParticipants: "Não", // "Sim" or "Não"
    externalParticipants: [], // Only used if hasExternalParticipants is "Sim"
    
    // Process elements
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
```

## Element Types

| Type | Description | Special Properties |
|------|-------------|-------------------|
| `"Inicio"` | Start event | - |
| `"Fim"` | End event | - |
| `"Atividade"` | Task/Activity | - |
| `"Mensagem"` | Message event | - |
| `"Evento Intermediario"` | Intermediate event | - |
| `"Gateway Exclusivo"` | Exclusive gateway | `diverge: [indices]` for branching |
| `"Gateway Paralelo"` | Parallel gateway | `diverge: [indices]` for branching |
| `"Gateway Existente"` | Existing gateway (convergence) | `originalType: "Gateway Type"` |

### Gateway Examples

**Diverging Gateway:**
```javascript
{
    "type": "Gateway Exclusivo",
    "name": "Decision Point",
    "lane": "Lane 1",
    "diverge": [3, 5] // Connect to elements at indices 3 and 5
}
```

**Converging Gateway:**
```javascript
{
    "type": "Gateway Existente", 
    "name": "Decision Point", // Must match the diverging gateway name
    "lane": "Lane 1",
    "originalType": "Gateway Exclusivo"
}
```

## Example Test Cases

### Simple Linear Process
See `tests/testCases/simpleProcess.js` for a basic start → activity → end flow.

### Complex Process with Gateways
See `tests/testCases/basicProcess.js` for a process with exclusive and parallel gateways, loops, and multiple lanes.

## Test Output and Validation

- **Green ✓**: Test passed - generated output matches expected result
- **Red ✗**: Test failed - output differs from expected result  
- **Yellow ⚠**: Missing expected file or result is newer than expected
- **Blue i**: Test ready to run

When a test fails, the system shows a detailed diff of the differences between expected and actual output.

## Workflow for Adding Tests

1. **Create test case**: `npm run test:create myTest`
2. **Edit test data**: Modify `tests/testCases/myTest.js`
3. **Generate output**: `npm run test:specific myTest`
4. **Review output**: Check `tests/results/myTest.bpmn`
5. **Set as expected**: `cp tests/results/myTest.bpmn tests/expected/myTest.bpmn`
6. **Verify**: `npm run test:specific myTest` should now pass
7. **Run all tests**: `npm run test` to ensure nothing broke

## Debugging Failed Tests

When a test fails:

1. Check the diff output in the terminal
2. Compare files manually:
   - Expected: `tests/expected/testName.bpmn`
   - Actual: `tests/results/testName.bpmn`
3. Use a diff tool or XML formatter to identify differences
4. Update either the test case or the expected result as needed

## Best Practices

- **Descriptive names**: Use clear, descriptive test names
- **Focused tests**: Each test should validate a specific scenario
- **Documentation**: Add comments in test cases explaining what is being tested
- **Regular validation**: Run all tests after changes to ensure nothing breaks
- **Version control**: Commit both test cases and expected results

## Troubleshooting

### "Test case file not found"
- Ensure the test file exists in `tests/testCases/`
- Check file name matches exactly (case sensitive)

### "No testCase export found"
- Ensure your test file exports `testCase` object
- Check JavaScript syntax in test file

### "Missing required fields"
- Ensure all required fields are present: `processName`, `participants`, `hasExternalParticipants`, `elements`
- Check that `elements` is a non-empty array

### Tests run but don't pass
- Generate fresh output with `npm run test:specific testName`
- Compare with expected result
- Update expected result if the new output is correct

Run `npm run test:validate` to check your test environment setup.