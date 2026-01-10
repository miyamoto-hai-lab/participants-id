import { AsyncBrowser, Browser } from '../dist/browser-id.mjs';

// Mock localStorage
global.window = {
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    }
};

// Verify Sync
const b = new Browser('test');
console.log('Sync Browser ID:', b.id);

if (b.id) {
    console.log('ESM Sync Verification Passed');
} else {
    console.error('ESM Sync Verification Failed');
    process.exit(1);
}

// Verify Async
const ab = new AsyncBrowser('test_async');
const id = await ab.get_id();
console.log('Async Browser ID:', id);

if (id) {
    console.log('ESM Async Verification Passed');
} else {
    console.error('ESM Async Verification Failed');
    process.exit(1);
}
