import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncBrowser, Browser } from '../src/browser-id';

describe('Browser (Sync)', () => {
    beforeEach(() => {
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
            removeItem: vi.fn((key: string) => { delete store[key]; }),
            clear: vi.fn(() => { for (const key in store) delete store[key]; }),
        });
        vi.stubGlobal('window', { localStorage: localStorage });
    });

    it('should generate a browser_id if none exists', () => {
        const browser = new Browser('test_app');
        const id = browser.id;
        expect(id).toBeDefined();
        expect(uuidValidate(id!)).toBe(true);
        expect(uuidVersion(id!)).toBe(7);
        expect(localStorage.getItem('browser_id_lib.browser_id')).toBe(id);
    });

    it('should validate browser_id with synchronous function', () => {
        const validationFunc = vi.fn((id: string) => true);
        const browser = new Browser('test_app', 'p', validationFunc);
        const id = browser.id;
        expect(validationFunc).toHaveBeenCalled();
        expect(id).toBeDefined();
    });

    it('should retry generation if validation fails', () => {
        let attempts = 0;
        const validationFunc = vi.fn((id: string) => {
            attempts++;
            return attempts > 2;
        });
        const browser = new Browser('test_app', 'p', validationFunc);
        const id = browser.id;
        expect(validationFunc).toHaveBeenCalledTimes(3);
        expect(id).toBeDefined();
    });
});

describe('AsyncBrowser (Async)', () => {
    beforeEach(() => {
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
            removeItem: vi.fn((key: string) => { delete store[key]; }),
            clear: vi.fn(() => { for (const key in store) delete store[key]; }),
        });
        vi.stubGlobal('window', { localStorage: localStorage });
    });

    it('should generate a browser_id asynchronously', async () => {
        const browser = new AsyncBrowser('test_app');
        const id = await browser.get_id();
        expect(id).toBeDefined();
        expect(uuidValidate(id!)).toBe(true);
        expect(uuidVersion(id!)).toBe(7);
        expect(localStorage.getItem('browser_id_lib.browser_id')).toBe(id);
    });

    it('should validate browser_id with async function', async () => {
        const validationFunc = vi.fn(async (id: string) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return true;
        });
        const browser = new AsyncBrowser('test_app', 'p', validationFunc);
        const id = await browser.get_id();
        expect(validationFunc).toHaveBeenCalled();
        expect(id).toBeDefined();
    });

    it('should retry generation if async validation fails', async () => {
        let attempts = 0;
        const validationFunc = vi.fn(async (id: string) => {
            await new Promise(resolve => setTimeout(resolve, 1));
            attempts++;
            return attempts > 2;
        });
        const browser = new AsyncBrowser('test_app', 'p', validationFunc);
        const id = await browser.get_id();
        expect(validationFunc).toHaveBeenCalledTimes(3);
        expect(id).toBeDefined();
    });

    it('should set created_at and updated_at', async () => {
        const browser = new AsyncBrowser('test_app');
        const id = await browser.get_id();
        const createdAt = await browser.get_created_at();
        expect(createdAt).toBeDefined();
        
        // Simulate update
        localStorage.removeItem('browser_id.browser_id');
        const id2 = await browser.get_id();
        const updatedAt = await browser.get_updated_at();
        expect(updatedAt).toBeDefined();
    });
});
