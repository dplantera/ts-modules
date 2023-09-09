"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const indexeddb_decorator_1 = require("./indexeddb.decorator");
const indexeddb_config_1 = require("./indexeddb.config");
const NAME_DB_CUSTOM = "test-db-2";
let TestObj = class TestObj {
    id;
    date;
    name;
    constructor(date, name) {
        this.date = date;
        this.name = name;
    }
};
__decorate([
    (0, indexeddb_decorator_1.PrimaryKey)({ autoIncrement: true })
], TestObj.prototype, "id", void 0);
__decorate([
    (0, indexeddb_decorator_1.Index)()
], TestObj.prototype, "name", void 0);
TestObj = __decorate([
    (0, indexeddb_decorator_1.Store)({ name: "test-obj" })
], TestObj);
let OtherObj = class OtherObj {
    date;
    name;
    constructor(date, name) {
        this.date = date;
        this.name = name;
    }
};
__decorate([
    (0, indexeddb_decorator_1.PrimaryKey)({ autoIncrement: false })
], OtherObj.prototype, "date", void 0);
__decorate([
    (0, indexeddb_decorator_1.Index)(),
    (0, indexeddb_decorator_1.PrimaryKey)({ autoIncrement: false })
], OtherObj.prototype, "name", void 0);
OtherObj = __decorate([
    (0, indexeddb_decorator_1.Store)({ database: NAME_DB_CUSTOM })
], OtherObj);
test("decorator for indexed db", () => {
    const storeConfigTestObj = indexeddb_config_1.StoreConfig.getInstance().for(TestObj.name);
    expect(storeConfigTestObj.indices).toEqual([{ name: "name" }]);
    expect(storeConfigTestObj.keyPath).toEqual("id");
    expect(storeConfigTestObj.database).toBe(indexeddb_config_1.StoreConfig.NAME_DB_DEFAULT);
    expect(storeConfigTestObj.autoIncrement).toBe(true);
    const storeConfigOtherObj = indexeddb_config_1.StoreConfig.getInstance().for(OtherObj.name);
    expect(storeConfigOtherObj.indices).toEqual([{ name: "name" }]);
    expect(storeConfigOtherObj.keyPath).toEqual(["date", "name"]);
    expect(storeConfigOtherObj.database).toBe(NAME_DB_CUSTOM);
    expect(storeConfigOtherObj.autoIncrement).toBe(false);
    const date = new Date(2021, 4, 13);
    const tr = new TestObj(date, "index-val");
    expect(tr.date).toBe(date);
    tr.name = "changed";
    expect(tr.name).toBe("changed");
});
