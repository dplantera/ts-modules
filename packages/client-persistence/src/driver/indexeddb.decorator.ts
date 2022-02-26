/*https://saul-mirone.github.io/a-complete-guide-to-typescript-decorator/*/

import {StoreConfig, TStoreParameters} from "./indexeddb.config";

type TMetaInfo = { store: string, database?: string } & TStoreParameters;
const MetaInfo: Record<string, TMetaInfo & { type: Function }> = {};

type ClassDecoratorFactory = (...args: any) => (constructor: Function) => any
type PropertyDecoratorFactory = (...args: any) => (target: any, propertyKey: string) => any

interface IStoreDecorator extends ClassDecoratorFactory {
    (args: { name?: string, database?: string }): (constructor: Function) => any
}

interface IPrimaryKey extends PropertyDecoratorFactory {
    (args: { autoIncrement: boolean }): (target: any, propertyKey: string) => any
}

interface IIndex extends PropertyDecoratorFactory {
    (): (target: any, propertyKey: string) => any
}

function updateConfig(store:string, storeConfig:Partial<TStoreParameters>) {
    StoreConfig.getInstance().add([
            {store, storeConfig: {...storeConfig}}
        ]
    );
}

export const Store: IStoreDecorator = (args: { name?: string, database?: string }) => {
    return (constructor: Function) => {
        const cfg = MetaInfo[constructor.name];
        MetaInfo[constructor.name] = {
            ...cfg,
            store: args?.name ?? constructor.name,
            type: constructor
        }

        if (args?.database)
            MetaInfo[constructor.name].database = args.database;

        updateConfig(constructor.name, MetaInfo[constructor.name])
    }
}

export const PrimaryKey: IPrimaryKey = (args: { autoIncrement: boolean }) => {
    return (target: any, propertyKey: string) => {
        const cfg = MetaInfo[target.constructor.name];
        const getKeyPath = () => {
            if (cfg?.keyPath && typeof cfg.keyPath === "string")
                return [cfg.keyPath, propertyKey];
            if (cfg?.keyPath && Array.isArray(cfg.keyPath))
                return [...cfg.keyPath, propertyKey];

            return propertyKey;
        }
        const keyPath = getKeyPath();
        MetaInfo[target.constructor.name] = {
            ...cfg, keyPath, ...args
        }

        updateConfig(target.constructor.name, {...args, keyPath})
    }
}

export const Index: IIndex = () => {
    return (target: any, propertyKey: string) => {
        const cfg = MetaInfo[target.constructor.name];
        const getIndices = () => {
            const newIndex = {name: propertyKey};
            if (cfg?.indices)
                return [...cfg.indices, newIndex]
            return [newIndex];
        }
        const indices = getIndices();
        MetaInfo[target.constructor.name] = {...cfg, indices};

        updateConfig(target.constructor.name, {indices})
    }
}

export const getCollectedMetaInfo = () => ({...MetaInfo});