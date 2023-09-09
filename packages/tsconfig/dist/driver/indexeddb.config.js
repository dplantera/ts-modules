"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreConfig = void 0;
const indexeddb_decorator_1 = require("./indexeddb.decorator");
class StoreConfig {
    static __DEFAULT_DB_NAME = "default_db";
    static get NAME_DB_DEFAULT() {
        return StoreConfig.__DEFAULT_DB_NAME;
    }
    ;
    static set NAME_DB_DEFAULT(databaseName) {
        StoreConfig.__DEFAULT_DB_NAME = databaseName;
        this.getInstance().storeConfig.switchDatabase(databaseName);
    }
    ;
    static instance;
    storeConfig;
    constructor() {
        this.storeConfig = new IDBStoreConfig(StoreConfig.NAME_DB_DEFAULT);
    }
    static getInstance() {
        if (!StoreConfig.instance)
            StoreConfig.init();
        return StoreConfig.instance;
    }
    static init() {
        StoreConfig.instance = new StoreConfig();
        const collectedMeta = (0, indexeddb_decorator_1.getCollectedMetaInfo)();
        Object.keys(collectedMeta).forEach(className => {
            const collectedInfo = collectedMeta[className];
            const { database, store, ...props } = collectedInfo;
            const dbName = database ?? StoreConfig.NAME_DB_DEFAULT;
            StoreConfig.instance.storeConfig.add(className, { ...props, name: store, database: dbName });
        });
    }
    for(store) {
        return StoreConfig.getInstance().storeConfig.get(store);
    }
    add(configs) {
        configs.forEach(config => {
            StoreConfig.instance.storeConfig.add(config.store, config.storeConfig);
        });
    }
}
exports.StoreConfig = StoreConfig;
class IDBStoreConfig {
    static STORE_CONFIGS = {};
    storeParamsDefault;
    constructor(defaultDbName) {
        this.storeParamsDefault = {
            keyPath: "id",
            autoIncrement: true,
            database: defaultDbName
        };
    }
    switchDatabase(database) {
        this.storeParamsDefault.database = database;
    }
    add(storeName, config = this.storeParamsDefault) {
        const storeNameLowerCase = storeName.toLowerCase();
        let storeConfig = this.get(storeNameLowerCase);
        if (storeConfig)
            IDBStoreConfig.STORE_CONFIGS[storeName] = { ...storeConfig, ...config };
        else
            IDBStoreConfig.STORE_CONFIGS[storeName] = { ...this.storeParamsDefault, ...config };
        return this;
    }
    get(storeName) {
        if (!IDBStoreConfig.STORE_CONFIGS[storeName])
            return this.storeParamsDefault;
        return IDBStoreConfig.STORE_CONFIGS[storeName];
    }
}
