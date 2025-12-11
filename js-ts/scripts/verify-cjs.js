const { Participant, AsyncParticipant } = require('../dist/participants-id.js');

// Mock localStorage
global.window = {
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    }
};

// Verify Sync
const p = new Participant('test');
console.log('Sync Browser ID:', p.browser_id);

if (p.browser_id) {
    console.log('CJS Sync Verification Passed');
} else {
    console.error('CJS Sync Verification Failed');
    process.exit(1);
}

// Verify Async
(async () => {
    const ap = new AsyncParticipant('test_async');
    const id = await ap.get_browser_id();
    console.log('Async Browser ID:', id);

    if (id) {
        console.log('CJS Async Verification Passed');
    } else {
        console.error('CJS Async Verification Failed');
        process.exit(1);
    }
})();
