// --- UUID Utilities (Dependency Free Implementation) ---

// UUID validation regex (based on common UUID standards)
// Checks for 8-4-4-4-12 hex format. 
// Allows standard UUID versions (1-8) and nil/max UUIDs.
const UUID_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

/**
 * UUID文字列が有効な形式かどうかを検証します。
 * @param uuid 検証する文字列
 */
function uuidValidate(uuid: string): boolean {
    return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

/**
 * UUID文字列からバージョン番号を取得します。
 * @param uuid UUID文字列
 * @returns バージョン番号 (例: 7)
 */
function uuidVersion(uuid: string): number {
    if (!uuidValidate(uuid)) {
        throw new TypeError('Invalid UUID');
    }
    // Version is located at the 13th hex digit (index 14 including hyphens)
    // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
    return parseInt(uuid.slice(14, 15), 16);
}

// --- Helper: UUID v7 Generator ---
/**
 * cryptoが利用可能な場合はWeb Crypto APIを使用し、
 * 利用できない場合（HTTP環境など）はMath.random()でフォールバックしてUUID v7を生成します。
 */
function generate_uuidv7(): string {
    // 1. Try to use secure Web Crypto API
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        try {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            
            // Timestamp (48 bits)
            // Note: Date.now() returns milliseconds (fits in 48 bits until year 10889)
            const now = Date.now();
            bytes[0] = (now / 0x10000000000) & 0xff;
            bytes[1] = (now / 0x100000000) & 0xff;
            bytes[2] = (now / 0x1000000) & 0xff;
            bytes[3] = (now / 0x10000) & 0xff;
            bytes[4] = (now / 0x100) & 0xff;
            bytes[5] = now & 0xff;

            // Version 7 (4 bits) -> 0111 (7)
            // bytes[6] is 0x70 to 0x7F
            bytes[6] = (bytes[6] & 0x0f) | 0x70;

            // Variant (2 bits) -> 10 (Variant 1)
            // bytes[8] is 0x80 to 0xBF
            bytes[8] = (bytes[8] & 0x3f) | 0x80;

            // Stringify to UUID format
            const hex = [...bytes].map(b => b.toString(16).padStart(2, '0'));
            return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
        } catch (e) {
            console.warn("Web Crypto API failed, falling back to Math.random", e);
        }
    }

    // 2. Fallback Implementation (Math.random)
    const timestamp = Date.now();
    
    // Timestamp (48 bits)
    const tsHex = timestamp.toString(16).padStart(12, '0');
    
    // random_a (12 bits)
    const randA = Math.floor(Math.random() * 0xFFF).toString(16).padStart(3, '0');
    
    // random_b (62 bits)
    // Variant (2 bits) is fixed to 10xx, so the first hex char is 8, 9, a, or b
    const variantChars = ['8', '9', 'a', 'b'];
    const variant = variantChars[Math.floor(Math.random() * 4)];
    
    const randB_1 = Math.floor(Math.random() * 0xFFF).toString(16).padStart(3, '0');
    
    // Last 48 bits of randomness
    // max safe integer is 2^53, so we can generate 48 bits at once safely.
    const randB_2 = Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).padStart(12, '0');

    // Format: 8-4-4-4-12
    return `${tsHex.substring(0, 8)}-${tsHex.substring(8, 12)}-7${randA}-${variant}${randB_1}-${randB_2}`;
}

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
    private debug: boolean;
    /**
     * @param app_name 実験アプリケーションの名前(attributesの保存に使用されます)
     * @param prefix 他のアプリと区別するためのストレージキーのプレフィックス (通常は指定する必要はありません。)
     * @param browser_id_validation_func ブラウザIDの検証関数
     * (ブラウザIDを生成した後に保存前に呼び出されます。
     * UUIDを受け取り、受理可否をboolで返す同期関数を指定できます。)
     * @param debug trueにするとconsole.infoでINFOレベルのログを出力します。
     */
    constructor(
        app_name: string,
        prefix: string = "participants_id",
        browser_id_validation_func: ((id: string) => boolean) | null = null,
        debug: boolean = false
    ) {
        this.app_name = app_name;
        this.prefix = prefix;
        this.browser_id_validation_func = browser_id_validation_func;
        this.debug = debug;

        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        } else {
            this.storage = null;
            console.error("localStorage is not available. Participant will not persist data.");
        }
    }

    /**
     * UUIDv7を(再)生成してbrowser_idに保存します。
     * * [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
     * 再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
     * * @returns 新しく生成されたブラウザID。保存に失敗した場合はnull。
     */
    private _generate_browser_id(): string | null {
        if (this.debug) console.info("Generating new browser ID...");

        for (let i = 0; i < this.MAX_RETRY_VALIDATION; i++) {
            let newId: string;
            try {
                newId = generate_uuidv7();
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
                    if (this.storage) {
                        this.storage.setItem(`${this.prefix}.browser_id`, newId);
                        const timestamp = new Date().toISOString();
                        if (this.storage.getItem(`${this.prefix}.created_at`)) {
                            this.storage.setItem(`${this.prefix}.updated_at`, timestamp);
                        } else {
                            this.storage.setItem(`${this.prefix}.created_at`, timestamp);
                        }
                    }
                    if (this.debug) console.info("Browser ID generated: ", newId);
                    return newId;
                } catch (e) {
                    console.error("Failed to save browser_id to localStorage", e);
                    return null;
                }
            }
        }
        if (this.debug) console.info("Failed to generate valid browser ID after maximum retries");
        return null;
    }

    /**
     * ブラウザIDを取得します。
     * * ブラウザIDがまだ存在しない時には新たに生成します。
     * * @returns 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はnull。
     */
    public get browser_id(): string | null {
        if (this.debug) console.info("Getting browser ID...");
        const id = this.storage?.getItem(`${this.prefix}.browser_id`);
        if (id) {
            if (this.debug) console.info("Browser ID found: ", id);
            return id;
        } else {
            if (this.debug) console.info("Browser ID not found, generating new ID...");
            return this._generate_browser_id();
        }
    }

    /**
     * ブラウザIDの生成日時を取得します。
     * * @returns 保存されていたブラウザIDの生成日時。生成日時が保存されていない場合はnull。
     */
    public get created_at(): string | null {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.created_at`);
    }

    /**
     * ブラウザIDの更新日時を取得します。
     * * @returns 保存されていたブラウザIDの更新日時。更新日時が保存されていない場合はnull。
     */
    public get updated_at(): string | null {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.updated_at`);
    }

    /**
     * ブラウザIDのバージョンを取得します。
     * * @returns 保存されていたブラウザIDのバージョン。バージョンが保存されていない場合はnull。
     */
    public get browser_id_version(): number | null {
        const id = this.browser_id;
        if (!id) return null;
        if (!uuidValidate(id)) return null;
        return uuidVersion(id);
    }

    /**
     * ブラウザIDがストレージに存在するかを確認します。
     * * @returns ブラウザIDが存在する場合はTrue、それ以外はFalse
     */
    public browser_id_exists(): boolean {
        if (!this.storage) return false;
        return this.storage.getItem(`${this.prefix}.browser_id`) !== null;
    }

    /**
     * ブラウザIDをストレージから削除します。
     * * [注意!] browser_idを削除すると他の実験プロジェクトに影響を及ぼす可能性が高いです。
     * 削除は特別な事情がない限り行わないでください。
     */
    public delete_browser_id(): void {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.browser_id`);
        this.storage.removeItem(`${this.prefix}.created_at`);
        this.storage.removeItem(`${this.prefix}.updated_at`);
        console.warn("Browser ID was deleted!");
    }

    /**
     * 指定されたフィールドに値を保存します。
     * * 参加者のクラウドソーシングIDや属性を保存するのに使用できます。
     * * @param field フィールド名
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
     * * @param field フィールド名
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
            if (this.debug) console.info(`Attribute ${field} does not exist, returning default value`);
            return defaultValue;
        }
    }

    /**
     * 指定されたフィールドがストレージに存在するかを確認します。
     * * @param field フィールド名
     * @returns 属性が存在する場合はTrue、それ以外はFalse
     */
    public attributes_exists(field: string): boolean {
        if (!this.storage) return false;
        return this.storage.getItem(`${this.prefix}.${this.app_name}.${field}`) !== null;
    }

    /**
     * 指定されたフィールドの値をストレージから削除します。
     * * @param field 削除するフィールド名
     */
    public delete_attribute(field: string): void {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.${this.app_name}.${field}`);
        if (this.debug) console.info(`Attribute ${field} was deleted`);
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
    private debug: boolean;
    /**
     * @param app_name 実験アプリケーションの名前(attributesの保存に使用されます)
     * @param prefix 他のアプリと区別するためのストレージキーのプレフィックス (通常は指定する必要はありません。)
     * @param browser_id_validation_func ブラウザIDの検証関数
     * (ブラウザIDを生成した後に保存前に呼び出されます。
     * UUIDを受け取り、受理可否をboolで返す同期/非同期関数を指定できます。)
     * @param debug trueにするとconsole.infoでINFOレベルのログを出力します。
     */
    constructor(
        app_name: string,
        prefix: string = "participants_id",
        browser_id_validation_func: ((id: string) => boolean | Promise<boolean>) | null = null,
        debug: boolean = false
    ) {
        this.app_name = app_name;
        this.prefix = prefix;
        this.browser_id_validation_func = browser_id_validation_func;
        this.debug = debug;

        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        } else {
            this.storage = null;
            console.error("localStorage is not available. AsyncParticipant will not persist data.");
        }
    }

    /**
     * UUIDv7を(再)生成してbrowser_idに保存します。
     * * [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
     * 再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
     * * @returns 新しく生成されたブラウザID。保存に失敗した場合はnull。
     */
    private async _generate_browser_id(): Promise<string | null> {
        if (this.debug) console.info("Generating new browser ID...");

        for (let i = 0; i < this.MAX_RETRY_VALIDATION; i++) {
            let newId: string;
            try {
                newId = generate_uuidv7();
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
                    if (this.storage) {
                        this.storage.setItem(`${this.prefix}.browser_id`, newId);
                        const timestamp = new Date().toISOString();
                        if (this.storage.getItem(`${this.prefix}.created_at`)) {
                            this.storage.setItem(`${this.prefix}.updated_at`, timestamp);
                        } else {
                            this.storage.setItem(`${this.prefix}.created_at`, timestamp);
                        }
                    }
                    if (this.debug) console.info("Browser ID generated: ", newId);
                    return newId;
                } catch (e) {
                    console.error("Failed to save browser_id to localStorage", e);
                    return null;
                }
            }
        }
        console.error("Failed to generate valid browser ID after maximum retries");
        return null;
    }

    /**
     * ブラウザIDを取得します。
     * * ブラウザIDがまだ存在しない時には新たに生成します。
     * * @returns 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はnull。
     */
    public async get_browser_id(): Promise<string | null> {
        if (this.debug) console.info("Getting browser ID...");
        const id = this.storage?.getItem(`${this.prefix}.browser_id`);
        if (id) {
            if (this.debug) console.info("Browser ID found: ", id);
            return id;
        } else {
            if (this.debug) console.info("Browser ID not found, generating new ID...");
            return await this._generate_browser_id();
        }
    }

    /**
     * ブラウザIDの生成日時を取得します。
     * * @returns 保存されていたブラウザIDの生成日時。生成日時が保存されていない場合はnull。
     */
    public async get_created_at(): Promise<string | null> {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.created_at`);
    }

    /**
     * ブラウザIDの更新日時を取得します。
     * * @returns 保存されていたブラウザIDの更新日時。更新日時が保存されていない場合はnull。
     */
    public async get_updated_at(): Promise<string | null> {
        if (!this.storage) return null;
        return this.storage.getItem(`${this.prefix}.updated_at`);
    }

    /**
     * ブラウザIDのバージョンを取得します。
     * * @returns 保存されていたブラウザIDのバージョン。バージョンが保存されていない場合はnull。
     */
    public async get_browser_id_version(): Promise<number | null> {
        const id = await this.get_browser_id();
        if (!id) return null;
        if (!uuidValidate(id)) return null;
        return uuidVersion(id);
    }

    /**
     * ブラウザIDがストレージに存在するかを確認します。
     * * @returns ブラウザIDが存在する場合はTrue、それ以外はFalse
     */
    public async browser_id_exists(): Promise<boolean> {
        if (!this.storage) return false;
        return this.storage.getItem(`${this.prefix}.browser_id`) !== null;
    }

    /**
     * ブラウザIDをストレージから削除します。
     * * [注意!] browser_idを削除すると他の実験プロジェクトに影響を及ぼす可能性が高いです。
     * 削除は特別な事情がない限り行わないでください。
     */
    public async delete_browser_id(): Promise<void> {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.browser_id`);
        this.storage.removeItem(`${this.prefix}.created_at`);
        this.storage.removeItem(`${this.prefix}.updated_at`);
        console.warn("Browser ID was deleted!");
    }

    /**
     * 指定されたフィールドに値を保存します。
     * * 参加者のクラウドソーシングIDや属性を保存するのに使用できます。
     * * @param field フィールド名
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
        if (this.debug) console.info(`Attribute ${field} saved`);
    }

    /**
     * 指定されたフィールドから値を取得します。
     * * @param field フィールド名
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
            if (this.debug) console.info(`Attribute ${field} does not exist, returning default value`);
            return defaultValue;
        }
    }

    /**
     * 指定されたフィールドがストレージに存在するかを確認します。
     * * @param field フィールド名
     * @returns 属性が存在する場合はTrue、それ以外はFalse
     */
    public async attributes_exists(field: string): Promise<boolean> {
        if (!this.storage) return false;
        return this.storage.getItem(`${this.prefix}.${this.app_name}.${field}`) !== null;
    }

    /**
     * 指定されたフィールドの値をストレージから削除します。
     * * @param field 削除するフィールド名
     */
    public async delete_attribute(field: string): Promise<void> {
        if (!this.storage) return;
        this.storage.removeItem(`${this.prefix}.${this.app_name}.${field}`);
        if (this.debug) console.info(`Attribute ${field} deleted`);
    }
}