"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IDBClient_1 = require("./IDBClient");
require("fake-indexeddb/auto");
const NAME_DB = "test-db";
const NAME_STORE = "test-store";
describe("Default IDBClient", () => {
    it("can connect, create store and get transaction", async () => {
        let underTest = new IDBClient_1.IDBClient();
        //connection
        let db = await underTest.connect(NAME_DB);
        expect(db.version).toBe(1);
        //auto store creation
        db.onversionchange = () => {
            db.close();
        };
        const storeParams = {
            database: NAME_DB,
        };
        db = await underTest.getDbForStore(NAME_STORE, storeParams);
        expect(db.version).toBe(2);
        expect(db.name).toContain(NAME_DB);
        expect(db.objectStoreNames).toContain(NAME_STORE);
        //transaction
        const transaction = await db.transaction(NAME_STORE);
        expect(transaction.error).toBeNull();
        const store = transaction.objectStore(NAME_STORE);
        expect(store.name).toBe(NAME_STORE);
    });
    it("can use storeTransaction to perform transactions", async () => {
        let underTest = new IDBClient_1.IDBClient();
        const store = await underTest.storeTransaction(NAME_STORE, "readwrite");
        expect(store.name).toBe(NAME_STORE);
        let itemToStore = { name: "test", type: "some-type" };
        const add = async (itemToStore) => new Promise(async (resolve) => {
            const addRequest = await store.add(itemToStore);
            addRequest.onerror = () => fail("could not create");
            addRequest.onsuccess = () => {
                resolve(addRequest.result);
            };
        });
        let createdID = await add(itemToStore);
        expect(createdID).toBe(1);
        createdID = await add({ name: "test2", type: "other-type" });
        expect(createdID).toBe(2);
    });
});
