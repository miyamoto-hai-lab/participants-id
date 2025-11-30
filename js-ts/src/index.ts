import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';

export class Participant {
    private prefix: string;
    private app_name: string;
    private storage: Storage | null;

    /**
     * @param app_name Name of the application (used for attribute storage).
     * @param prefix Prefix for storage keys to distinguish from other apps.
     */
    constructor(app_name: string, prefix: string = "participant_id") {
        this.app_name = app_name;
        this.prefix = prefix;
        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        } else {
            this.storage = null;
            console.warn("localStorage is not available. Participant will not persist data.");
        }
    }

    /**
     * Generates a new UUID (v7) and saves it to browser_id.
     * Fallback to v4 if v7 fails.
     * Note: Regenerating browser_id may affect other experiments.
     * @returns The newly generated browser ID, or null if storage is unavailable.
     */
    private _generate_browser_id(): string | null {
        if (!this.storage) return null;
        let newId: string;
        try {
            newId = uuidv7();
        } catch (e) {
            console.warn("Failed to generate UUID v7, falling back to v4", e);
            newId = uuidv4();
        }

        try {
            this.storage.setItem(`${this.prefix}.browser_id`, newId);
            return newId;
        } catch (e) {
            console.error("Failed to save browser_id to localStorage", e);
            return null;
        }
    }

    /**
     * Gets the browser ID.
     * If it doesn't exist, generates a new one.
     * @returns The stored or new browser ID, or null if storage is unavailable.
     */
    public get browser_id(): string | null {
        if (!this.storage) return null;
        const id = this.storage.getItem(`${this.prefix}.browser_id`);
        if (id) {
            return id;
        } else {
            return this._generate_browser_id();
        }
    }

    /**
     * Deletes the browser ID from storage.
     */
    public delete_browser_id(): void {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.browser_id`);
    }

    /**
     * Sets an attribute value.
     * @param field Field name
     * @param value Value to save
     */
    public set_attribute(field: string, value: any): void {
        if (!this.storage) return;
        try {
            const serializedValue = JSON.stringify(value);
            this.storage.setItem(`${this.prefix}.${this.app_name}.${field}`, serializedValue);
        } catch (e) {
            console.error(`Failed to save attribute ${field}`, e);
        }
    }

    /**
     * Gets an attribute value.
     * @param field Field name
     * @param defaultValue Default value if not found
     * @returns The stored value or default value
     */
    public get_attribute(field: string, defaultValue: any = null): any {
        if (!this.storage) return defaultValue;
        const value = this.storage.getItem(`${this.prefix}.${this.app_name}.${field}`);
        if (value) {
            try {
                return JSON.parse(value);
            } catch (e) {
                console.warn(`Failed to parse attribute ${field}, returning raw value`, e);
                return value;
            }
        } else {
            return defaultValue;
        }
    }

    /**
     * Deletes an attribute.
     * @param field Field name to delete
     */
    public delete_attribute(field: string): void {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.${this.app_name}.${field}`);
    }
}
