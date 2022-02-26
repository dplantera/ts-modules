//@ts-nocheck
import {IRead, IWrite, Newable} from "./interfaces";
import {Entity, EntityObject} from "../entities";
import {IDBClient} from "../driver/IDBClient";
import {log} from "../logging";

export class IDBRepository<T extends Entity> implements IWrite<T>, IRead<T> {
    private storeName: string;
    private isJavascriptContext = false;

    constructor(public repository: Newable<T> | string, public dbClient = new IDBClient()) {
        this.isJavascriptContext = typeof repository == "string";
        this.storeName = typeof repository == "string" ? repository : repository.name;
    }

    async insert(item: T): Promise<T> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.add(item);
            request.onsuccess = (e) => {
                const id = item.id ?? (e as Event & { target: { result: number } })?.target?.result;
                item.id = id;
                resolve(item)
            };
            request.onerror = () => {
                reject(request.error);
            };
        }));
    }

    async insertAll(items: T[]): Promise<T[]> {
        const created: T[] = [];
        await items.reduce(async (prevPromise: Promise<T>, next: T) => {
            await prevPromise;
            log.debug("adding to db: ", next)
            const newItem = await this.insert(next);
            created.push(newItem)
            return newItem;
        }, new Promise<T>((resolve => resolve(items[0]))));
        return new Promise(resolve => resolve(created));
    }

    async updateAll(items: T[]): Promise<T[]> {
        await items.reduce(async (prevPromise: Promise<T>, next: T) => {
            await prevPromise;
            log.debug("updating: ", next)
            return await this.update(next);
        }, new Promise<T>((resolve => resolve(items[0]))));
        return new Promise(resolve => resolve(true));
    }

    async deleteAll(items?: T[]): Promise<T[]> {
        if (!items)
            await this.clear()
        else
            await items.reduce(async (prevPromise: Promise<T>, next: T) => {
                await prevPromise;
                log.debug("updating: ", next)
                return await this.delete(next.id);
            }, new Promise<T>((resolve => resolve(items[0]))));
        return new Promise(resolve => resolve(true));
    }

    async delete(id: string | number): Promise<boolean> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                log.debug(request.error);
                resolve(false);
            };
        }));
    }

    async clear(): Promise<boolean> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                log.debug(request.error);
                resolve(false);
            };
        }));
    }

    async update(item: T, id?: string | number): Promise<boolean> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.put(item, id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                log.debug(request.error);
                resolve(false);
            };
        }));
    }


    async getById(id: string | number | any[]): Promise<T> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.get(id);
            request.onsuccess = () => resolve(this.transform(request.result));
            request.onerror = () => {
                reject(request.error)
            };
        }));
    }

    async getByIndex(index: { [indexName: string]: IDBValidKey | IDBKeyRange }): Promise<T[]> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            let indexName = Object.keys(index)[0];
            let indexKey = index[indexName];
            const request = storeTransaction.index(indexName).getAll(indexKey);
            request.onsuccess = () => resolve(request.result.map(res => {
                return this.transform(res)
            }));
            request.onerror = () => {
                reject(request.error)
            };
        }));
    }

    async get(query: IDBValidKey | IDBKeyRange): Promise<T[]> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.getAll(query);
            request.onsuccess = () => resolve(request.result.map(this.transform.bind(this)));
            request.onerror = () => {
                reject(request.error)
            };
        }));
    }

    async getAll(): Promise<T[]> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.getAll();
            request.onsuccess = () => resolve(request.result.map(res => {
                return this.transform(res)
            }));
            request.onerror = () => {
                reject(request.error)
            };
        }));
    }

    async getLast(): Promise<T> {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.openCursor(null, "prev");
            request.onsuccess = () => resolve(request.result.value);
            request.onerror = () => reject(request.error);
        }));
    }

    private transform(object: T) {
        if (!object)
            return object;
        const repoType = this.getType();
        const newObj = Object.create(repoType.prototype);
        return Object.assign(newObj, object);
    }

    private getType() {
        return typeof this.repository == "string" ? EntityObject : this.repository;
    }
}