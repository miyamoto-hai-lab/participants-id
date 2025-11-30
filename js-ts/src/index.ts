import { v7 as uuidv7, validate as uuidValidate, version as uuidVersion } from 'uuid';

// --- Synchronous Participant ---
/**
 * ブラウザのローカルストレージを使用してUUIDv7を保存・取得・管理するライブラリです。
 * (同期版)
 */
export class Participant {
    private prefix: string;
    private app_name: string;
    private storage: Storage | null;
    private browser_id_validation_func: ((id: string) => boolean) | null;
    private MAX_RETRY_VALIDATION = 10; // ブラウザID検証の最大試行回数

    /**
     * @param app_name 実験アプリケーションの名前(attributesの保存に使用されます)
     * @param prefix 他のアプリと区別するためのストレージキーのプレフィックス (通常は指定する必要はありません。)
     * @param browser_id_validation_func ブラウザIDの検証関数
     *     (ブラウザIDを生成した後に保存前に呼び出されます。
     *     UUIDを受け取り、受理可否をboolで返す同期関数を指定できます。)
     */
    constructor(
        app_name: string,
        prefix: string = "participant_id",
        browser_id_validation_func: ((id: string) => boolean) | null = null
    ) {
        this.app_name = app_name;
        this.prefix = prefix;
        this.browser_id_validation_func = browser_id_validation_func;

        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        } else {
            this.storage = null;
            console.warn("localStorage is not available. Participant will not persist data.");
        }
    }

    /**
     * UUIDv7を(再)生成してbrowser_idに保存します。
     * 
     * [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
     * 再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
     * 
     * @returns 新しく生成されたブラウザID。保存に失敗した場合はnull。
     */
    private _generate_browser_id(): string | null {
        if (!this.storage) return null;

        for (let i = 0; i < this.MAX_RETRY_VALIDATION; i++) {
            let newId: string;
            try {
                newId = uuidv7();
            } catch (e) {
                console.error("Failed to generate UUID v7", e);
                return null;
            }

            let isValid = true;
            if (this.browser_id_validation_func) {
                isValid = this.browser_id_validation_func(newId);
            }

            if (isValid) {
                try {
                    this.storage.setItem(`${this.prefix}.browser_id`, newId);
                    const timestamp = new Date().toISOString();
                    if (this.storage.getItem(`${this.prefix}.created_at`)) {
                        this.storage.setItem(`${this.prefix}.updated_at`, timestamp);
                    } else {
                        this.storage.setItem(`${this.prefix}.created_at`, timestamp);
                    }
                    return newId;
                } catch (e) {
                    console.error("Failed to save browser_id to localStorage", e);
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * ブラウザIDを取得します。
     * 
     * ブラウザIDがまだ存在しない時には新たに生成します。
     * 
     * @returns 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はnull。
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
     * ブラウザIDの生成日時を取得します。
     * 
     * @returns 保存されていたブラウザIDの生成日時。生成日時が保存されていない場合はnull。
     */
    public get created_at(): string | null {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.created_at`);
    }

    /**
     * ブラウザIDの更新日時を取得します。
     * 
     * @returns 保存されていたブラウザIDの更新日時。更新日時が保存されていない場合はnull。
     */
    public get updated_at(): string | null {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.updated_at`);
    }

    /**
     * ブラウザIDのバージョンを取得します。
     * 
     * @returns 保存されていたブラウザIDのバージョン。バージョンが保存されていない場合はnull。
     */
    public get browser_id_version(): number | null {
        const id = this.browser_id;
        if (!id) return null;
        if (!uuidValidate(id)) return null;
        return uuidVersion(id);
    }

    /**
     * ブラウザIDをストレージから削除します。
     * 
     * [注意!] browser_idを削除すると他の実験プロジェクトに影響を及ぼす可能性が高いです。
     * 削除は特別な事情がない限り行わないでください。
     */
    public delete_browser_id(): void {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.browser_id`);
        this.storage.removeItem(`${this.prefix}.created_at`);
        this.storage.removeItem(`${this.prefix}.updated_at`);
    }

    /**
     * 指定されたフィールドに値を保存します。
     * 
     * 参加者のクラウドソーシングIDや属性を保存するのに使用できます。
     * 
     * @param field フィールド名
     * @param value 保存する値
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
     * 指定されたフィールドから値を取得します。
     * 
     * @param field フィールド名
     * @param defaultValue デフォルト値
     * @returns 保存されていた属性値、またはデフォルト値
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
     * 指定されたフィールドの値をストレージから削除します。
     * 
     * @param field 削除するフィールド名
     */
    public delete_attribute(field: string): void {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.${this.app_name}.${field}`);
    }
}

// --- Asynchronous Participant ---
/**
 * ブラウザのローカルストレージを使用してUUIDv7を保存・取得・管理するライブラリです。
 * (非同期版)
 */
export class AsyncParticipant {
    private prefix: string;
    private app_name: string;
    private storage: Storage | null;
    private browser_id_validation_func: ((id: string) => boolean | Promise<boolean>) | null;
    private MAX_RETRY_VALIDATION = 10; // ブラウザID検証の最大試行回数

    /**
     * @param app_name 実験アプリケーションの名前(attributesの保存に使用されます)
     * @param prefix 他のアプリと区別するためのストレージキーのプレフィックス (通常は指定する必要はありません。)
     * @param browser_id_validation_func ブラウザIDの検証関数
     *     (ブラウザIDを生成した後に保存前に呼び出されます。
     *     UUIDを受け取り、受理可否をboolで返す同期/非同期関数を指定できます。)
     */
    constructor(
        app_name: string,
        prefix: string = "participant_id",
        browser_id_validation_func: ((id: string) => boolean | Promise<boolean>) | null = null
    ) {
        this.app_name = app_name;
        this.prefix = prefix;
        this.browser_id_validation_func = browser_id_validation_func;

        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        } else {
            this.storage = null;
            console.warn("localStorage is not available. AsyncParticipant will not persist data.");
        }
    }

    /**
     * UUIDv7を(再)生成してbrowser_idに保存します。
     * 
     * [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
     * 再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
     * 
     * @returns 新しく生成されたブラウザID。保存に失敗した場合はnull。
     */
    private async _generate_browser_id(): Promise<string | null> {
        if (!this.storage) return null;

        for (let i = 0; i < this.MAX_RETRY_VALIDATION; i++) {
            let newId: string;
            try {
                newId = uuidv7();
            } catch (e) {
                console.error("Failed to generate UUID v7", e);
                return null;
            }

            let isValid = true;
            if (this.browser_id_validation_func) {
                isValid = await this.browser_id_validation_func(newId);
            }

            if (isValid) {
                try {
                    this.storage.setItem(`${this.prefix}.browser_id`, newId);
                    const timestamp = new Date().toISOString();
                    if (this.storage.getItem(`${this.prefix}.created_at`)) {
                        this.storage.setItem(`${this.prefix}.updated_at`, timestamp);
                    } else {
                        this.storage.setItem(`${this.prefix}.created_at`, timestamp);
                    }
                    return newId;
                } catch (e) {
                    console.error("Failed to save browser_id to localStorage", e);
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * ブラウザIDを取得します。
     * 
     * ブラウザIDがまだ存在しない時には新たに生成します。
     * 
     * @returns 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はnull。
     */
    public async get_browser_id(): Promise<string | null> {
        if (!this.storage) return null;
        const id = this.storage.getItem(`${this.prefix}.browser_id`);
        if (id) {
            return id;
        } else {
            return await this._generate_browser_id();
        }
    }

    /**
     * ブラウザIDの生成日時を取得します。
     * 
     * @returns 保存されていたブラウザIDの生成日時。生成日時が保存されていない場合はnull。
     */
    public async get_created_at(): Promise<string | null> {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.created_at`);
    }

    /**
     * ブラウザIDの更新日時を取得します。
     * 
     * @returns 保存されていたブラウザIDの更新日時。更新日時が保存されていない場合はnull。
     */
    public async get_updated_at(): Promise<string | null> {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.updated_at`);
    }

    /**
     * ブラウザIDのバージョンを取得します。
     * 
     * @returns 保存されていたブラウザIDのバージョン。バージョンが保存されていない場合はnull。
     */
    public async get_browser_id_version(): Promise<number | null> {
        const id = await this.get_browser_id();
        if (!id) return null;
        if (!uuidValidate(id)) return null;
        return uuidVersion(id);
    }

    /**
     * ブラウザIDをストレージから削除します。
     * 
     * [注意!] browser_idを削除すると他の実験プロジェクトに影響を及ぼす可能性が高いです。
     * 削除は特別な事情がない限り行わないでください。
     */
    public async delete_browser_id(): Promise<void> {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.browser_id`);
        this.storage.removeItem(`${this.prefix}.created_at`);
        this.storage.removeItem(`${this.prefix}.updated_at`);
    }

    /**
     * 指定されたフィールドに値を保存します。
     * 
     * 参加者のクラウドソーシングIDや属性を保存するのに使用できます。
     * 
     * @param field フィールド名
     * @param value 保存する値
     */
    public async set_attribute(field: string, value: any): Promise<void> {
        if (!this.storage) return;
        try {
            const serializedValue = JSON.stringify(value);
            this.storage.setItem(`${this.prefix}.${this.app_name}.${field}`, serializedValue);
        } catch (e) {
            console.error(`Failed to save attribute ${field}`, e);
        }
    }

    /**
     * 指定されたフィールドから値を取得します。
     * 
     * @param field フィールド名
     * @param defaultValue デフォルト値
     * @returns 保存されていた属性値、またはデフォルト値
     */
    public async get_attribute(field: string, defaultValue: any = null): Promise<any> {
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
     * 指定されたフィールドの値をストレージから削除します。
     * 
     * @param field 削除するフィールド名
     */
    public async delete_attribute(field: string): Promise<void> {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.${this.app_name}.${field}`);
    }
}
