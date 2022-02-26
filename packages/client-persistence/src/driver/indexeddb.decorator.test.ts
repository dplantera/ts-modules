import {Index, PrimaryKey, Store} from "./indexeddb.decorator";
import {StoreConfig} from "./indexeddb.config";

const NAME_DB_CUSTOM = "test-db-2";

@Store({name: "test-obj"})
class TestObj {
    @PrimaryKey({autoIncrement: true})
    id?: string | number;
    date: Date;
    @Index()
    name: string;

    constructor(date: Date, name: string) {
        this.date = date;
        this.name = name;
    }
}

@Store({database:NAME_DB_CUSTOM})
class OtherObj {
    @PrimaryKey({autoIncrement: false})
    date: Date;
    @Index()
    @PrimaryKey({autoIncrement: false})
    name: string;

    constructor(date: Date, name: string) {
        this.date = date;
        this.name = name;
    }
}

test("decorator for indexed db", () => {
    const storeConfigTestObj = StoreConfig.getInstance().for(TestObj.name);
    expect(storeConfigTestObj.indices).toEqual([{name: "name"}]);
    expect(storeConfigTestObj.keyPath).toEqual("id");
    expect(storeConfigTestObj.database).toBe(StoreConfig.NAME_DB_DEFAULT);
    expect(storeConfigTestObj.autoIncrement).toBe(true);

    const storeConfigOtherObj = StoreConfig.getInstance().for(OtherObj.name);
    expect(storeConfigOtherObj.indices).toEqual([{name: "name"}]);
    expect(storeConfigOtherObj.keyPath).toEqual(["date","name"]);
    expect(storeConfigOtherObj.database).toBe(NAME_DB_CUSTOM);
    expect(storeConfigOtherObj.autoIncrement).toBe(false);


    const date = new Date(2021, 4, 13);
    const tr = new TestObj(date, "index-val");
    expect(tr.date).toBe(date)

    tr.name = "changed";
    expect(tr.name).toBe("changed")
})

export {}