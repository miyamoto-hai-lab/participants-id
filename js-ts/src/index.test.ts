import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Participant } from './index';

describe('Participant', () => {
    beforeEach(() => {
        // Mock localStorage
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                for (const key in store) delete store[key];
            }),
        });
        vi.stubGlobal('window', { localStorage: localStorage });
    });

    it('should generate a browser_id if none exists', () => {
        const participant = new Participant('test_app');
        const id = participant.browser_id;
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(localStorage.getItem('participant_id.browser_id')).toBe(id);
    });

    it('should retrieve existing browser_id', () => {
        const participant = new Participant('test_app');
        const id1 = participant.browser_id;
        const id2 = participant.browser_id;
        expect(id1).toBe(id2);
    });

    it('should use custom prefix', () => {
        const participant = new Participant('test_app', 'custom_prefix');
        const id = participant.browser_id;
        expect(localStorage.getItem('custom_prefix.browser_id')).toBe(id);
    });

    it('should set and get attributes with app_name', () => {
        const participant = new Participant('test_app');
        participant.set_attribute('test_attr', 123);
        expect(participant.get_attribute('test_attr')).toBe(123);
        expect(localStorage.getItem('participant_id.test_app.test_attr')).toBe('123');

        participant.set_attribute('obj_attr', { a: 1 });
        expect(participant.get_attribute('obj_attr')).toEqual({ a: 1 });
    });

    it('should return default value if attribute missing', () => {
        const participant = new Participant('test_app');
        expect(participant.get_attribute('missing', 'default')).toBe('default');
    });

    it('should delete attributes', () => {
        const participant = new Participant('test_app');
        participant.set_attribute('to_delete', 'value');
        participant.delete_attribute('to_delete');
        expect(participant.get_attribute('to_delete')).toBeNull();
        expect(localStorage.getItem('participant_id.test_app.to_delete')).toBeNull();
    });

    it('should handle SSR (no window/localStorage)', () => {
        vi.stubGlobal('window', undefined);
        const participant = new Participant('test_app');
        expect(participant.browser_id).toBeNull();
        
        participant.set_attribute('test', 1);
        expect(participant.get_attribute('test')).toBeNull();
    });
});
