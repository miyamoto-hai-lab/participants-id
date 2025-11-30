import { AsyncParticipant, Participant } from '../dist/index.mjs';

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
    console.log('ESM Sync Verification Passed');
} else {
    console.error('ESM Sync Verification Failed');
    process.exit(1);
}

// Verify Async
const ap = new AsyncParticipant('test_async');
const id = await ap.get_browser_id();
console.log('Async Browser ID:', id);

if (id) {
    console.log('ESM Async Verification Passed');
} else {
    console.error('ESM Async Verification Failed');
    process.exit(1);
}
