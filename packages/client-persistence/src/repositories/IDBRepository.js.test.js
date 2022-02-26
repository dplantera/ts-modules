const {IDBRepository} = require("./IDBRepository")
const {StoreConfig} = require("../driver/indexeddb.config")

require("fake-indexeddb/auto");
const {IDBClient} = require("../driver/IDBClient");

const idbClient = new IDBClient();

async function resetDefaultDatabase() {
    await idbClient.deleteDb()
}

describe("IDBRepository in vanilla javascript", () => {
    const NAME_REPOSITORY = "data";

    beforeEach(async () => {
        await resetDefaultDatabase();
    })

    it("can create", async () => {
        const dataStore = new IDBRepository(NAME_REPOSITORY);
        const savedData = await dataStore.insert({name: "test", value: 123});
        expect(savedData).toEqual({id: 1, name: "test", value: 123})
    })

    it("can retrieve", async () => {
        const dataStore = new IDBRepository(NAME_REPOSITORY);
        const toSaveWithId = {id: "uuid-1", name: "test1", value: 123};
        const toSaveWithoutId = {name: "test2", value: 321};
        await dataStore.insert(toSaveWithId);
        await dataStore.insert(toSaveWithoutId);

        expect(await dataStore.getAll()).toEqual([toSaveWithoutId, toSaveWithId])
        expect(await dataStore.getById(toSaveWithId.id)).toEqual(toSaveWithId)
        expect(await dataStore.get(toSaveWithoutId.id)).toEqual([toSaveWithoutId])

        const dataStoreCopy = new IDBRepository(NAME_REPOSITORY);
        expect(await dataStoreCopy.getById(toSaveWithId.id)).toEqual(toSaveWithId)
    })

    it("only the repoName and Database matters not the IDBRepository instance", async () => {
        const repoName = NAME_REPOSITORY;
        const dataStoreInstance1 = new IDBRepository(repoName);
        const dataStoreInstance2 = new IDBRepository(repoName);
        const dataStoreInstance3 = new IDBRepository(repoName);

        const dataA = {id: 1, name: "test A", value: 123};
        const dataB = {id: 2, name: "test B", value: 321};

        await dataStoreInstance1.insert(dataA);
        await dataStoreInstance2.insert(dataB);

        expect(await dataStoreInstance3.getAll()).toEqual([dataA, dataB])
    })
})

describe("Only the repoName/Store matters not the IDBRepository instance or Database", () => {
    beforeEach(() => {
        resetDefaultDatabase();
    })
    it("REPOSITORY INSTANCE has no impact on results within a DATABASE", async () => {
        const repoName = "data";
        const dataStoreInstance1 = new IDBRepository(repoName);
        const dataStoreInstance2 = new IDBRepository(repoName);
        const dataStoreInstance3 = new IDBRepository(repoName);

        const dataA = {id: 1, name: "test A", value: 123};
        const dataB = {id: 2, name: "test B", value: 321};

        await dataStoreInstance1.insert(dataA);
        await dataStoreInstance2.insert(dataB);

        expect(await dataStoreInstance3.getAll()).toEqual([dataA, dataB])
    })

    it("StoreConfig behaves static over all DATABASES", async () => {
        const repoName = "data";
        const dataRepo = new IDBRepository(repoName);

        const dataA = {id: 1, name: "test A", value: 123};
        const dataB = {id: 1, name: "test B", value: 321};

        const dataStoreConfig = StoreConfig.getInstance().for(repoName);

        dataStoreConfig.database = "TestDbA";
        await dataRepo.insert(dataA);

        dataStoreConfig.database = "TestDbB";
        await dataRepo.insert(dataB);

        dataStoreConfig.database = "TestDbA";
        expect(await dataRepo.getAll()).toEqual([dataA])

        dataStoreConfig.database = "TestDbB";
        expect(await dataRepo.getAll()).toEqual([dataB])
    })
})
