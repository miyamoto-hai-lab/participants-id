const { Browser, AsyncBrowser } = require('../dist/browser-id.js');

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
    console.log('CJS Sync Verification Passed');
} else {
    console.error('CJS Sync Verification Failed');
    process.exit(1);
}

// Verify Async
(async () => {
    const ab = new AsyncBrowser('test_async');
    const id = await ab.get_id();
    console.log('Async Browser ID:', id);

    if (id) {
        console.log('CJS Async Verification Passed');
    } else {
        console.error('CJS Async Verification Failed');
        process.exit(1);
    }
})();
