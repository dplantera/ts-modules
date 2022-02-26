import {IEntity} from "../entities";
import {IDBRepository} from "./IDBRepository";
import {PrimaryKey, Store} from "../driver/indexeddb.decorator";

require("fake-indexeddb/auto");


describe("IDBRepository", () => {
    @Store({name: "TestEntity"})
    class TestEntity implements IEntity {
        @PrimaryKey({autoIncrement: true})
        public id: number | undefined;

        constructor(public name: String) {
        }
    }

    it("can retrieve last entry from a store", async () => {
        const entityA = new TestEntity("entityA");
        const entityB = new TestEntity("entityB");

        const testEntityRepo = new IDBRepository(TestEntity);
        const savedEntities = await testEntityRepo.insertAll([entityA, entityB]);
        expect(savedEntities.length).toBe(2);

        const lastEntry = await testEntityRepo.getLast();
        expect(lastEntry.id).toBe(2);
    })
})
export {}