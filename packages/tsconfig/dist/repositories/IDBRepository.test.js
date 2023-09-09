"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const IDBRepository_1 = require("./IDBRepository");
const indexeddb_decorator_1 = require("../driver/indexeddb.decorator");
require("fake-indexeddb/auto");
describe("IDBRepository", () => {
    let TestEntity = class TestEntity {
        name;
        id;
        constructor(name) {
            this.name = name;
        }
    };
    __decorate([
        (0, indexeddb_decorator_1.PrimaryKey)({ autoIncrement: true })
    ], TestEntity.prototype, "id", void 0);
    TestEntity = __decorate([
        (0, indexeddb_decorator_1.Store)({ name: "TestEntity" })
    ], TestEntity);
    it("can retrieve last entry from a store", async () => {
        const entityA = new TestEntity("entityA");
        const entityB = new TestEntity("entityB");
        const testEntityRepo = new IDBRepository_1.IDBRepository(TestEntity);
        const savedEntities = await testEntityRepo.insertAll([entityA, entityB]);
        expect(savedEntities.length).toBe(2);
        const lastEntry = await testEntityRepo.getLast();
        expect(lastEntry.id).toBe(2);
    });
});
