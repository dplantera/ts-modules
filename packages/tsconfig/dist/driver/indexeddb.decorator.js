"use strict";
/*https://saul-mirone.github.io/a-complete-guide-to-typescript-decorator/*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectedMetaInfo = exports.Index = exports.PrimaryKey = exports.Store = void 0;
const indexeddb_config_1 = require("./indexeddb.config");
const MetaInfo = {};
function updateConfig(store, storeConfig) {
    indexeddb_config_1.StoreConfig.getInstance().add([
        { store, storeConfig: { ...storeConfig } }
    ]);
}
const Store = (args) => {
    return (constructor) => {
        const cfg = MetaInfo[constructor.name];
        MetaInfo[constructor.name] = {
            ...cfg,
            store: args?.name ?? constructor.name,
            type: constructor
        };
        if (args?.database)
            MetaInfo[constructor.name].database = args.database;
        updateConfig(constructor.name, MetaInfo[constructor.name]);
    };
};
exports.Store = Store;
const PrimaryKey = (args) => {
    return (target, propertyKey) => {
        const cfg = MetaInfo[target.constructor.name];
        const getKeyPath = () => {
            if (cfg?.keyPath && typeof cfg.keyPath === "string")
                return [cfg.keyPath, propertyKey];
            if (cfg?.keyPath && Array.isArray(cfg.keyPath))
                return [...cfg.keyPath, propertyKey];
            return propertyKey;
        };
        const keyPath = getKeyPath();
        MetaInfo[target.constructor.name] = {
            ...cfg, keyPath, ...args
        };
        updateConfig(target.constructor.name, { ...args, keyPath });
    };
};
exports.PrimaryKey = PrimaryKey;
const Index = () => {
    return (target, propertyKey) => {
        const cfg = MetaInfo[target.constructor.name];
        const getIndices = () => {
            const newIndex = { name: propertyKey };
            if (cfg?.indices)
                return [...cfg.indices, newIndex];
            return [newIndex];
        };
        const indices = getIndices();
        MetaInfo[target.constructor.name] = { ...cfg, indices };
        updateConfig(target.constructor.name, { indices });
    };
};
exports.Index = Index;
const getCollectedMetaInfo = () => ({ ...MetaInfo });
exports.getCollectedMetaInfo = getCollectedMetaInfo;
