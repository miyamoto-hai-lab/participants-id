import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncParticipant, Participant } from '../src/participants-id';

describe('Participant (Sync)', () => {
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
        const participant = new Participant('test_app');
        const id = participant.browser_id;
        expect(id).toBeDefined();
        expect(uuidValidate(id!)).toBe(true);
        expect(uuidVersion(id!)).toBe(7);
        expect(localStorage.getItem('participants_id.browser_id')).toBe(id);
    });

    it('should validate browser_id with synchronous function', () => {
        const validationFunc = vi.fn((id: string) => true);
        const participant = new Participant('test_app', 'p', validationFunc);
        const id = participant.browser_id;
        expect(validationFunc).toHaveBeenCalled();
        expect(id).toBeDefined();
    });

    it('should retry generation if validation fails', () => {
        let attempts = 0;
        const validationFunc = vi.fn((id: string) => {
            attempts++;
            return attempts > 2;
        });
        const participant = new Participant('test_app', 'p', validationFunc);
        const id = participant.browser_id;
        expect(validationFunc).toHaveBeenCalledTimes(3);
        expect(id).toBeDefined();
    });
});

describe('AsyncParticipant (Async)', () => {
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
        const participant = new AsyncParticipant('test_app');
        const id = await participant.get_browser_id();
        expect(id).toBeDefined();
        expect(uuidValidate(id!)).toBe(true);
        expect(uuidVersion(id!)).toBe(7);
        expect(localStorage.getItem('participants_id.browser_id')).toBe(id);
    });

    it('should validate browser_id with async function', async () => {
        const validationFunc = vi.fn(async (id: string) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return true;
        });
        const participant = new AsyncParticipant('test_app', 'p', validationFunc);
        const id = await participant.get_browser_id();
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
        const participant = new AsyncParticipant('test_app', 'p', validationFunc);
        const id = await participant.get_browser_id();
        expect(validationFunc).toHaveBeenCalledTimes(3);
        expect(id).toBeDefined();
    });

    it('should set created_at and updated_at', async () => {
        const participant = new AsyncParticipant('test_app');
        const id = await participant.get_browser_id();
        const createdAt = await participant.get_created_at();
        expect(createdAt).toBeDefined();
        
        // Simulate update
        localStorage.removeItem('participants_id.browser_id');
        const id2 = await participant.get_browser_id();
        const updatedAt = await participant.get_updated_at();
        expect(updatedAt).toBeDefined();
    });
});
