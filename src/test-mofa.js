import { calculateMofaFee } from './utils/calculations.js';

// Test MOFA fee calculation with various invoice values
console.log('=== MOFA Fee Calculation Tests ===');
console.log('Invoice 10,000 QAR:', calculateMofaFee(10000), 'QAR (expected: 650 = 500 + 150)');
console.log('Invoice 50,000 QAR:', calculateMofaFee(50000), 'QAR (expected: 1150 = 1000 + 150)');
console.log('Invoice 200,000 QAR:', calculateMofaFee(200000), 'QAR (expected: 2650 = 2500 + 150)');
console.log('Invoice 500,000 QAR:', calculateMofaFee(500000), 'QAR (expected: 5150 = 5000 + 150)');
console.log('Invoice 2,000,000 QAR:', calculateMofaFee(2000000), 'QAR (expected: 12150 = 12000 + 150)');

// Test edge cases
console.log('\n=== Edge Cases ===');
console.log('Invoice 15,000 QAR (boundary):', calculateMofaFee(15000), 'QAR (expected: 650)');
console.log('Invoice 15,001 QAR (next tier):', calculateMofaFee(15001), 'QAR (expected: 1150)');
console.log('Invoice 1,000,000 QAR (boundary):', calculateMofaFee(1000000), 'QAR (expected: 5150)');
console.log('Invoice 1,000,001 QAR (percentage):', calculateMofaFee(1000001), 'QAR (expected: 6156.006 = 6000.006 + 150)');