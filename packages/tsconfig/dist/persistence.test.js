"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("./entities");
const IDBRepository_1 = require("./repositories/IDBRepository");
const IDBClient_1 = require("./driver/IDBClient");
const indexeddb_decorator_1 = require("./driver/indexeddb.decorator");
const indexeddb_config_1 = require("./driver/indexeddb.config");
require("fake-indexeddb/auto");
let indexedDbClient = new IDBClient_1.IDBClient();
describe("persistence tests", () => {
    beforeEach(async () => {
        await indexedDbClient.deleteDb();
    });
    test('test crud operations on an object', async () => {
        const data = { id: undefined, attrNum: 1, attrStr: "test" };
        const storeData = new IDBRepository_1.IDBRepository("data", indexedDbClient);
        // create
        const storedDate = await storeData.insert(data);
        expect(storedDate.id).toBe(1);
        //read
        let foundData = await storeData.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData.attrNum).toBe(1);
        expect(foundData.attrStr).toBe("test");
        expect(storeData.dbClient.version.get()).toBe(2);
        //update
        foundData.attrNum = 2;
        foundData.attrStr = "test updated";
        let uptData = await storeData.update(foundData);
        expect(uptData).toBe(true);
        foundData = await storeData.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData.attrNum).toBe(2);
        expect(foundData.attrStr).toBe("test updated");
        // _id:undefined TS Workaround for IDB
        const forUpdate = { ...foundData, attrStr: "test partial upt" };
        uptData = await storeData.update(forUpdate);
        expect(uptData).toBe(true);
        foundData = await storeData.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData.attrNum).toBe(2);
        expect(foundData.attrStr).toBe("test partial upt");
        //delete
        const deleted = await storeData.delete(1);
        expect(deleted).toBe(true);
        foundData = await storeData.getById(1);
        expect(foundData).toBe(undefined);
    });
    test('create multiply objects of same type', async () => {
        jest.setTimeout(20000);
        const data = [];
        for (let i = 0; i < 20; i++) {
            data.push({ id: undefined, attrNum: i, attrStr: "test-" + i });
        }
        const storeData = new IDBRepository_1.IDBRepository("data", indexedDbClient);
        const storedDate = await storeData.insertAll(data);
        expect(storedDate.length).toBe(data.length);
        for (let i = 0; i < 20; i++) {
            expect(storedDate[i].id).toBe(i + 1);
            expect(storedDate[i].attrNum).toBe(i);
            expect(storedDate[i].attrStr).toBe("test-" + i);
        }
        try {
            const existing = await storeData.insert(storedDate[0]);
            fail("should raise ConstraintException: \n" + JSON.stringify(existing));
        }
        catch (err) {
            if (err instanceof Error)
                expect(err.name).toBe("ConstraintError");
        }
    });
    test('create multiply objects and stores of different type', async () => {
        const dataStore = new IDBRepository_1.IDBRepository("data", indexedDbClient);
        const dataTwoStore = new IDBRepository_1.IDBRepository("data-two", indexedDbClient);
        const dataThreeStore = new IDBRepository_1.IDBRepository("data-three", indexedDbClient);
        const data = { id: undefined, attrNum: 1, attrStr: "test data" };
        let created = await dataStore.insert(data);
        expect(created.id).toBe(1);
        expect(dataStore.dbClient.version.get()).toBe(2);
        const data2 = { id: undefined, attrNum: 2 };
        created = await dataTwoStore.insert(data2);
        expect(created.id).toBe(1);
        expect(dataTwoStore.dbClient.version.get()).toBe(3);
        const data3 = { id: undefined, attrNum: 3, attrBool: true };
        created = await dataThreeStore.insert(data3);
        expect(created.id).toBe(1);
        expect(dataThreeStore.dbClient.version.get()).toBe(4);
    });
    test("class without decorator", async () => {
        class Data extends entities_1.Entity {
            attrNum;
            attrStr;
            static map = new Map();
            constructor(attrNum, attrStr) {
                super();
                this.attrNum = attrNum;
                this.attrStr = attrStr;
                Data.map.set("test", 1);
            }
        }
        const data = new Data(1, "test");
        const dataStore = new IDBRepository_1.IDBRepository(Data, indexedDbClient);
        const created = await dataStore.insert(data);
        expect(created.id).toBe(1);
        expect(dataStore.dbClient.version.get()).toBe(2);
        let foundData = await dataStore.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData).toBeInstanceOf(Data);
    });
    test("newable", () => {
        class Generic {
            type;
            constructor(type) {
                this.type = type;
            }
            transform(object) {
                const newObj = Object.create(this.type.prototype);
                return Object.assign(newObj, object);
            }
        }
        class Data extends entities_1.Entity {
            attrNum;
            attrStr;
            static map = new Map();
            constructor(attrNum, attrStr) {
                super();
                this.attrNum = attrNum;
                this.attrStr = attrStr;
                Data.map.set("test", 1);
            }
        }
        const generic = new Generic(Data);
        const obj = generic.transform({ id: undefined, attrNum: 1, attrStr: "test-attr" });
        expect(obj).toBeInstanceOf(Data);
    });
    test("test js context - manual store config", async () => {
        const Foo = (id, partiakPk, data) => {
            return { id: id, partialPk: partiakPk, data: data };
        };
        let repoName = Foo.name;
        let fooStoreConfig = indexeddb_config_1.StoreConfig.getInstance().for(repoName);
        fooStoreConfig.database = "MyMaybeUniquePersonalDatabase";
        fooStoreConfig.autoIncrement = false;
        fooStoreConfig.keyPath = ["id", "partialPk"];
        const fooRepo = new IDBRepository_1.IDBRepository(repoName);
        const foo = Foo(111, "ab", "test data");
        await fooRepo.insert(foo);
        const fooGetDbResult = await fooRepo.getById([111, "ab"]);
        expect(fooGetDbResult).toEqual(foo);
        //clean database here because the name is not public
        await fooRepo.dbClient.deleteDb(fooStoreConfig.database);
    });
    test("test js context - manual store config with index", async () => {
        const Foo = (id, refForIdx, data) => {
            return { id: id, refForIdx: refForIdx, data: data };
        };
        let fooStoreConfig = indexeddb_config_1.StoreConfig.getInstance().for(Foo.name);
        fooStoreConfig.database = "MyMaybeUniquePersonalDatabase";
        fooStoreConfig.autoIncrement = false;
        fooStoreConfig.keyPath = ["id"];
        fooStoreConfig.indices = [{ name: "refForIdx" }];
        const fooRepo = new IDBRepository_1.IDBRepository(Foo.name);
        const foo = Foo(111, "ab", "test data foo");
        await fooRepo.insert(foo);
        // one result
        let fooGetDbResult = await fooRepo.getByIndex({ refForIdx: "ab" });
        expect(fooGetDbResult).toEqual([foo]);
        // no result
        fooGetDbResult = await fooRepo.getByIndex({ refForIdx: "a" });
        expect(fooGetDbResult).toEqual([]);
        // multiple result
        const bar = Foo(112, "ab", "test data bar");
        await fooRepo.insert(bar);
        fooGetDbResult = await fooRepo.getByIndex({ refForIdx: "ab" });
        expect(fooGetDbResult).toEqual([foo, bar]);
        //clean database here because the name is not public
        await fooRepo.dbClient.deleteDb(fooStoreConfig.database);
    });
});
describe("Persist with configuration", () => {
    let DataDecorated = class DataDecorated extends entities_1.Entity {
        attrNum;
        attrStr;
        constructor(attrNum, attrStr) {
            super();
            this.attrNum = attrNum;
            this.attrStr = attrStr;
        }
    };
    __decorate([
        (0, indexeddb_decorator_1.Index)()
    ], DataDecorated.prototype, "attrStr", void 0);
    DataDecorated = __decorate([
        (0, indexeddb_decorator_1.Store)()
    ], DataDecorated);
    let DataDecoratedWithConfig = class DataDecoratedWithConfig {
        attrNum;
        id;
        compositeId;
        attrStr;
        constructor(attrNum, attrStr) {
            this.attrNum = attrNum;
            this.attrStr = attrStr;
        }
    };
    __decorate([
        (0, indexeddb_decorator_1.PrimaryKey)({ autoIncrement: false })
    ], DataDecoratedWithConfig.prototype, "id", void 0);
    __decorate([
        (0, indexeddb_decorator_1.PrimaryKey)()
    ], DataDecoratedWithConfig.prototype, "compositeId", void 0);
    __decorate([
        (0, indexeddb_decorator_1.Index)()
    ], DataDecoratedWithConfig.prototype, "attrStr", void 0);
    DataDecoratedWithConfig = __decorate([
        (0, indexeddb_decorator_1.Store)({ database: "OptionalTargetDatabaseName", name: "OptionalDataStoreName" })
    ], DataDecoratedWithConfig);
    beforeEach(() => {
        indexedDbClient.deleteDb();
    });
    test("class with decorator", async () => {
        const data = new DataDecorated(1, "test2");
        const dataDecorated = new IDBRepository_1.IDBRepository(DataDecorated);
        const created = await dataDecorated.insert(data);
        expect(created.id).toBe(1);
        expect(dataDecorated.dbClient.version.get()).toBe(2);
        let foundData = await dataDecorated.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData).toBeInstanceOf(DataDecorated);
        expect(foundData).toEqual(data);
        expect(await dataDecorated.getByIndex({ attrStr: "test2" })).toEqual([data]);
    });
    test("class with decorator and config", async () => {
        const data = new DataDecoratedWithConfig(11, "test2");
        data.id = 123;
        data.compositeId = "some-id-part";
        const dataDecoratedWithConfigRepo = new IDBRepository_1.IDBRepository(DataDecoratedWithConfig);
        await dataDecoratedWithConfigRepo.insert(data);
        let foundData = await dataDecoratedWithConfigRepo.getById([123, "some-id-part"]);
        const expected = { id: 123, compositeId: "some-id-part", attrNum: 11, attrStr: "test2" };
        expect(foundData).toEqual(expected);
    });
});
