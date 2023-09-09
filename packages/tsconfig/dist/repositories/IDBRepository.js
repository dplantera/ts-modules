"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDBRepository = void 0;
const entities_1 = require("../entities");
const IDBClient_1 = require("../driver/IDBClient");
const logging_1 = require("../logging");
class IDBRepository {
    repository;
    dbClient;
    storeName;
    isJavascriptContext = false;
    constructor(repository, dbClient = new IDBClient_1.IDBClient()) {
        this.repository = repository;
        this.dbClient = dbClient;
        this.isJavascriptContext = typeof repository == "string";
        this.storeName = typeof repository == "string" ? repository : repository.name;
    }
    async insert(item) {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.add(item);
            request.onsuccess = (e) => {
                const id = item.id ?? e?.target?.result;
                item.id = id;
                resolve(item);
            };
            request.onerror = () => {
                reject(request.error);
            };
        }));
    }
    async insertAll(items) {
        const created = [];
        await items.reduce(async (prevPromise, next) => {
            await prevPromise;
            logging_1.log.debug("adding to db: ", next);
            const newItem = await this.insert(next);
            created.push(newItem);
            return newItem;
        }, new Promise((resolve => resolve(items[0]))));
        return new Promise(resolve => resolve(created));
    }
    async updateAll(items) {
        await items.reduce(async (prevPromise, next) => {
            await prevPromise;
            logging_1.log.debug("updating: ", next);
            return await this.update(next);
        }, new Promise((resolve => resolve(items[0]))));
        return new Promise(resolve => resolve(true));
    }
    async deleteAll(items) {
        if (!items)
            await this.clear();
        else
            await items.reduce(async (prevPromise, next) => {
                await prevPromise;
                logging_1.log.debug("updating: ", next);
                return await this.delete(next.id);
            }, new Promise((resolve => resolve(items[0]))));
        return new Promise(resolve => resolve(true));
    }
    async delete(id) {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                logging_1.log.debug(request.error);
                resolve(false);
            };
        }));
    }
    async clear() {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                logging_1.log.debug(request.error);
                resolve(false);
            };
        }));
    }
    async update(item, id) {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName, "readwrite");
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.put(item, id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                logging_1.log.debug(request.error);
                resolve(false);
            };
        }));
    }
    async getById(id) {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.get(id);
            request.onsuccess = () => resolve(this.transform(request.result));
            request.onerror = () => {
                reject(request.error);
            };
        }));
    }
    async getByIndex(index) {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            let indexName = Object.keys(index)[0];
            let indexKey = index[indexName];
            const request = storeTransaction.index(indexName).getAll(indexKey);
            request.onsuccess = () => resolve(request.result.map(res => {
                return this.transform(res);
            }));
            request.onerror = () => {
                reject(request.error);
            };
        }));
    }
    async get(query) {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.getAll(query);
            request.onsuccess = () => resolve(request.result.map(this.transform.bind(this)));
            request.onerror = () => {
                reject(request.error);
            };
        }));
    }
    async getAll() {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.getAll();
            request.onsuccess = () => resolve(request.result.map(res => {
                return this.transform(res);
            }));
            request.onerror = () => {
                reject(request.error);
            };
        }));
    }
    async getLast() {
        const storeTransaction = await this.dbClient.storeTransaction(this.storeName);
        return new Promise(((resolve, reject) => {
            const request = storeTransaction.openCursor(null, "prev");
            request.onsuccess = () => resolve(request.result.value);
            request.onerror = () => reject(request.error);
        }));
    }
    transform(object) {
        if (!object)
            return object;
        const repoType = this.getType();
        const newObj = Object.create(repoType.prototype);
        return Object.assign(newObj, object);
    }
    getType() {
        return typeof this.repository == "string" ? entities_1.EntityObject : this.repository;
    }
}
exports.IDBRepository = IDBRepository;
