const { Participant } = require('../dist/participant-id.js');
const assert = require('assert');

console.log('Verifying CJS build...');
try {
    const participant = new Participant('test_cjs');
    assert.strictEqual(typeof participant.browser_id, 'object'); // null or string
    console.log('CJS build verified successfully.');
} catch (e) {
    console.error('CJS verification failed:', e);
    process.exit(1);
}
