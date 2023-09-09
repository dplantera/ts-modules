"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDBClient = void 0;
const indexeddb_config_1 = require("./indexeddb.config");
const logging_1 = require("../logging");
const log = (0, logging_1.getLogger)("IDBClient");
class DBVersion {
    defaultDbName;
    dbVersionMap = {};
    constructor(defaultDbName) {
        this.defaultDbName = defaultDbName;
    }
    set(version, dbName = this.defaultDbName) {
        this.dbVersionMap[dbName] = version;
    }
    get(dbName = this.defaultDbName) {
        return this.dbVersionMap[dbName];
    }
}
class IDBClient {
    storeConfig;
    static dbVersion;
    indexedDB;
    nameDbDefault;
    constructor(storeConfig = indexeddb_config_1.StoreConfig.getInstance()) {
        this.storeConfig = storeConfig;
        const windowBrowser = window;
        this.indexedDB = windowBrowser.indexedDB || windowBrowser.mozIndexedDB || windowBrowser.webkitIndexedDB || windowBrowser.msIndexedDB || indexedDB;
        this.nameDbDefault = indexeddb_config_1.StoreConfig.NAME_DB_DEFAULT;
        IDBClient.dbVersion = new DBVersion(indexeddb_config_1.StoreConfig.NAME_DB_DEFAULT);
    }
    get version() {
        return IDBClient.dbVersion;
    }
    getDbName(store) {
        if (!store)
            return this.nameDbDefault;
        return this.storeConfig.for(store)?.database || this.nameDbDefault;
    }
    async deleteDb(dbName = this.getDbName()) {
        return new Promise(((resolve, reject) => {
            const request = this.indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => {
                this.version.set(undefined, dbName);
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        }));
    }
    async connect(dbName, version, upgradeNeeded = function (e) {
    }) {
        const request = this.indexedDB.open(dbName, version);
        return new Promise((resolve, reject) => {
            request.onblocked = (e) => reject(e);
            request.onupgradeneeded = upgradeNeeded;
            request.onerror = (e) => reject(request.error);
            request.onsuccess = (e) => resolve(request.result);
        });
    }
    async getDb(dbName) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.connect(dbName);
                resolve(db);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async getDbForStore(storeName, params) {
        const dbName = params.database ?? this.getDbName(storeName);
        let db = await this.getDb(dbName);
        let dbVersionCurrent = this.version.get(dbName);
        log.debug((db.name ?? "") + " - version: " + (db.version ?? -1) + " | " + (dbVersionCurrent ?? -1));
        if (!dbVersionCurrent)
            dbVersionCurrent = db.version;
        if (!db.objectStoreNames.contains(storeName))
            dbVersionCurrent++;
        if (db.version === dbVersionCurrent) {
            log.debug("no need to upgrade: ", storeName);
            return db;
        }
        this.version.set(dbVersionCurrent, dbName);
        // upgrade needed
        db.close();
        const { indices } = params;
        const indexedDb = this;
        return await this.connect(dbName, dbVersionCurrent, function (e) {
            let db = this.result;
            indexedDb.version.set(db.version, dbName);
            if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, params);
                log.debug("objectStore created: ", { objectStore, params });
                if (!indices) {
                    return;
                }
                for (let index of indices) {
                    objectStore.createIndex(index.name, index.keyPath ?? index.name, index.options ?? {});
                    log.debug("index created: ", { index });
                }
            }
        });
    }
    async storeTransaction(storeName, mode = "readonly", params = this.storeConfig.for(storeName)) {
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
exports.IDBClient = IDBClient;
