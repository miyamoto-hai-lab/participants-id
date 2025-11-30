import { Participant } from '../dist/participant-id.mjs';

console.log('Verifying ESM build...');
try {
    const participant = new Participant('test_esm');
    // In node environment without localStorage, browser_id should be null or we mock it?
    // The library handles missing localStorage gracefully (returns null or warns).
    // We just want to check if the class is importable and instantiable.
    console.log('Participant instance created.');
    console.log('ESM build verified successfully.');
} catch (e) {
    console.error('ESM verification failed:', e);
    process.exit(1);
}
