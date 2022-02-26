import {StoreConfig, TStoreParameters} from "./indexeddb.config";
import {getLogger} from "../logging";
const log = getLogger("IDBClient");


class DBVersion {
    private dbVersionMap: Record<string, number | undefined> = {}

    constructor(public defaultDbName: string) {
    }

    set(version: number | undefined, dbName: string = this.defaultDbName) {
        this.dbVersionMap[dbName] = version;
    }

    get(dbName: string = this.defaultDbName): number | undefined {
        return this.dbVersionMap[dbName];
    }
}

export class IDBClient {
    private static dbVersion: DBVersion;
    private indexedDB: IDBFactory;
    nameDbDefault: string;

    constructor(public readonly storeConfig: StoreConfig = StoreConfig.getInstance()) {
        const windowBrowser = window as any;
        this.indexedDB = windowBrowser.indexedDB || windowBrowser.mozIndexedDB || windowBrowser.webkitIndexedDB || windowBrowser.msIndexedDB || indexedDB;
        this.nameDbDefault = StoreConfig.NAME_DB_DEFAULT;
        IDBClient.dbVersion = new DBVersion(StoreConfig.NAME_DB_DEFAULT);
    }

    get version() {
        return IDBClient.dbVersion;
    }

    private getDbName(store?: string) {
        if (!store)
            return this.nameDbDefault;
        return this.storeConfig.for(store)?.database || this.nameDbDefault;
    }

    async deleteDb(dbName: string = this.getDbName()): Promise<boolean> {
        return new Promise(((resolve, reject) => {
            const request = this.indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => {
                this.version.set(undefined, dbName);
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        }))
    }

    async connect(dbName: string, version?: number, upgradeNeeded = function (this: IDBOpenDBRequest, e: Event) {
    }): Promise<IDBDatabase> {
        const request: IDBOpenDBRequest = this.indexedDB.open(dbName, version);
        return new Promise((resolve, reject) => {
            request.onblocked = (e) => reject(e);
            request.onupgradeneeded = upgradeNeeded;
            request.onerror = (e) => reject(request.error);
            request.onsuccess = (e) => resolve(request.result);
        });
    }

    async getDb(dbName: string): Promise<IDBDatabase> {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.connect(dbName);

                resolve(db)
            } catch (err) {
                reject(err);
            }
        })
    }

    async getDbForStore(storeName: string, params: TStoreParameters) {
        const dbName = params.database ?? this.getDbName(storeName);
        let db = await this.getDb(dbName);
        let dbVersionCurrent = this.version.get(dbName);
        log.debug((db.name ?? "") + " - version: " + (db.version ?? -1) + " | " + (dbVersionCurrent ?? -1))
        if (!dbVersionCurrent)
            dbVersionCurrent = db.version

        if (!db.objectStoreNames.contains(storeName))
            dbVersionCurrent++

        if (db.version === dbVersionCurrent) {
            log.debug("no need to upgrade: ", storeName)
            return db;
        }
        this.version.set(dbVersionCurrent, dbName);

        // upgrade needed
        db.close();

        const {indices} = params;
        const indexedDb = this;
        return await this.connect(dbName, dbVersionCurrent, function (e) {
            let db = this.result;
            indexedDb.version.set(db.version, dbName);
            if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, params);
                log.debug("objectStore created: ", {objectStore, params});
                if (!indices) {
                    return;
                }
                for (let index of indices) {
                    objectStore.createIndex(index.name, index.keyPath ?? index.name, index.options ?? {})
                    log.debug("index created: ", {index});
                }
            }
        });
    }

    async storeTransaction(storeName: string, mode: IDBTransactionMode = "readonly", params: TStoreParameters = this.storeConfig.for(storeName)) {
        let db = await this.getDbForStore(storeName, params);

        db.onversionchange = (e) => {
            log.debug("reloading db: " + storeName, e);
            db.close();
        };

        // make transaction
        const tx = db.transaction(storeName, mode);
        // tx.oncomplete = (e) => {log.debug("transaction ", e)}
        return tx.objectStore(storeName);
    }
}