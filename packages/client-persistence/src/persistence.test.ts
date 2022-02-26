import {Entity, IEntity} from "./entities";
import {IDBRepository} from "./repositories/IDBRepository";
import {IDBClient} from "./driver/IDBClient";
import {Newable} from "./repositories/interfaces";
import {Index, PrimaryKey, Store} from "./driver/indexeddb.decorator";
import {StoreConfig} from "./driver/indexeddb.config";

require("fake-indexeddb/auto");

let indexedDbClient = new IDBClient();

describe("persistence tests", () => {
    beforeEach(async () => {
        await indexedDbClient.deleteDb();
    })

    test('test crud operations on an object', async () => {
        type Data = { attrNum: number, attrStr: string } & Entity
        const data: Data = {id: undefined, attrNum: 1, attrStr: "test"};
        const storeData = new IDBRepository<Data>("data", indexedDbClient);

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

        let uptData = await storeData.update(foundData)
        expect(uptData).toBe(true);

        foundData = await storeData.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData.attrNum).toBe(2);
        expect(foundData.attrStr).toBe("test updated");
        // _id:undefined TS Workaround for IDB
        const forUpdate = {...foundData, attrStr: "test partial upt"};
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
    })

    test('create multiply objects of same type', async () => {
        jest.setTimeout(20000)
        type Data = { attrNum: number, attrStr: string } & Entity
        const data: Data[] = [];

        for (let i = 0; i < 20; i++) {
            data.push({id: undefined, attrNum: i, attrStr: "test-" + i})
        }

        const storeData = new IDBRepository<Data>("data", indexedDbClient);

        const storedDate = await storeData.insertAll(data);
        expect(storedDate.length).toBe(data.length);
        for (let i = 0; i < 20; i++) {
            expect(storedDate[i].id).toBe(i + 1);
            expect(storedDate[i].attrNum).toBe(i);
            expect(storedDate[i].attrStr).toBe("test-" + i);
        }

        try {
            const existing = await storeData.insert(storedDate[0]);
            fail("should raise ConstraintException: \n" + JSON.stringify(existing))
        } catch (err) {
            if (err instanceof Error)
                expect(err.name).toBe("ConstraintError");
        }
    })

    test('create multiply objects and stores of different type', async () => {
        type Data = { attrNum: number, attrStr: string } & Entity
        type DataTwo = { attrNum: number } & Entity
        type DataThree = { attrNum: number, attrBool: boolean } & Entity

        const dataStore = new IDBRepository("data", indexedDbClient);
        const dataTwoStore = new IDBRepository("data-two", indexedDbClient);
        const dataThreeStore = new IDBRepository("data-three", indexedDbClient);

        const data: Data = {id: undefined, attrNum: 1, attrStr: "test data"};

        let created = await dataStore.insert(data);
        expect(created.id).toBe(1);
        expect(dataStore.dbClient.version.get()).toBe(2);

        const data2: DataTwo = {id: undefined, attrNum: 2};
        created = await dataTwoStore.insert(data2);
        expect(created.id).toBe(1);
        expect(dataTwoStore.dbClient.version.get()).toBe(3);

        const data3: DataThree = {id: undefined, attrNum: 3, attrBool: true};
        created = await dataThreeStore.insert(data3);
        expect(created.id).toBe(1);
        expect(dataThreeStore.dbClient.version.get()).toBe(4);
    })

    test("class without decorator", async () => {
        class Data extends Entity {
            static map = new Map();

            constructor(public attrNum: number, public attrStr: string) {
                super();
                Data.map.set("test", 1);
            }
        }

        const data = new Data(1, "test");
        const dataStore = new IDBRepository(Data, indexedDbClient);
        const created = await dataStore.insert(data);
        expect(created.id).toBe(1);
        expect(dataStore.dbClient.version.get()).toBe(2);

        let foundData = await dataStore.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData).toBeInstanceOf(Data)
    })


    test("newable", () => {
        class Generic<T> {
            constructor(public type: Newable<T>) {
            }

            transform(object: T) {
                const newObj = Object.create(this.type.prototype);
                return Object.assign(newObj, object);
            }
        }

        class Data extends Entity {
            static map = new Map();

            constructor(public attrNum: number, public attrStr: string) {
                super();
                Data.map.set("test", 1);
            }
        }

        const generic = new Generic<Data>(Data);
        const obj = generic.transform({id: undefined, attrNum: 1, attrStr: "test-attr"})
        expect(obj).toBeInstanceOf(Data)
    })


    test("test js context - manual store config", async () => {
        const Foo = (id: number, partiakPk: string, data: string) => {
            return {id: id, partialPk: partiakPk, data: data}
        }
        let repoName = Foo.name;
        let fooStoreConfig = StoreConfig.getInstance().for(repoName);
        fooStoreConfig.database = "MyMaybeUniquePersonalDatabase";
        fooStoreConfig.autoIncrement = false;
        fooStoreConfig.keyPath = ["id", "partialPk"];

        const fooRepo = new IDBRepository(repoName);
        const foo = Foo(111, "ab", "test data");
        await fooRepo.insert(foo);

        const fooGetDbResult = await fooRepo.getById([111, "ab"]);
        expect(fooGetDbResult).toEqual(foo);

        //clean database here because the name is not public
        await fooRepo.dbClient.deleteDb(fooStoreConfig.database);
    })

    test("test js context - manual store config with index", async () => {
        const Foo = (id: number, refForIdx: IDBValidKey, data: string) => {
            return {id: id, refForIdx: refForIdx, data: data}
        }
        let fooStoreConfig = StoreConfig.getInstance().for(Foo.name);
        fooStoreConfig.database = "MyMaybeUniquePersonalDatabase";
        fooStoreConfig.autoIncrement = false;
        fooStoreConfig.keyPath = ["id"];
        fooStoreConfig.indices = [{name: "refForIdx"}]

        const fooRepo = new IDBRepository(Foo.name);
        const foo = Foo(111, "ab", "test data foo");
        await fooRepo.insert(foo);

        // one result
        let fooGetDbResult = await fooRepo.getByIndex({refForIdx: "ab"});
        expect(fooGetDbResult).toEqual([foo]);
        // no result
        fooGetDbResult = await fooRepo.getByIndex({refForIdx: "a"});
        expect(fooGetDbResult).toEqual([]);
        // multiple result
        const bar = Foo(112, "ab", "test data bar");
        await fooRepo.insert(bar);
        fooGetDbResult = await fooRepo.getByIndex({refForIdx: "ab"});
        expect(fooGetDbResult).toEqual([foo, bar]);

        //clean database here because the name is not public
        await fooRepo.dbClient.deleteDb(fooStoreConfig.database);
    })
})


describe("Persist with configuration", () => {
    @Store()
    class DataDecorated extends Entity {
        attrNum: number;
        @Index()
        attrStr: string;

        constructor(attrNum: number, attrStr: string) {
            super();
            this.attrNum = attrNum;
            this.attrStr = attrStr;
        }
    }

    @Store({database: "OptionalTargetDatabaseName", name: "OptionalDataStoreName"})
    class DataDecoratedWithConfig implements IEntity {
        @PrimaryKey({autoIncrement: false})
        id: number | undefined
        @PrimaryKey()
        compositeId: string | undefined
        @Index()
        attrStr: string;

        constructor(public attrNum: number, attrStr: string) {
            this.attrStr = attrStr;
        }
    }

    beforeEach(() => {
        indexedDbClient.deleteDb();
    })

    test("class with decorator", async () => {

        const data = new DataDecorated(1, "test2");
        const dataDecorated = new IDBRepository(DataDecorated);
        const created = await dataDecorated.insert(data);
        expect(created.id).toBe(1);
        expect(dataDecorated.dbClient.version.get()).toBe(2);

        let foundData = await dataDecorated.getById(1);
        expect(foundData.id).toBe(1);
        expect(foundData).toBeInstanceOf(DataDecorated)
        expect(foundData).toEqual(data)
        expect(await dataDecorated.getByIndex({attrStr: "test2"})).toEqual([data])
    })

    test("class with decorator and config", async () => {
        const data = new DataDecoratedWithConfig(11, "test2");
        data.id = 123
        data.compositeId = "some-id-part";

        const dataDecoratedWithConfigRepo = new IDBRepository(DataDecoratedWithConfig);
        await dataDecoratedWithConfigRepo.insert(data);
        let foundData = await dataDecoratedWithConfigRepo.getById([123, "some-id-part"]);
        const expected: DataDecoratedWithConfig = {id: 123, compositeId: "some-id-part", attrNum: 11, attrStr: "test2"}
        expect(foundData).toEqual(expected)
    })
})

export {}