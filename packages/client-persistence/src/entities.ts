import {PrimaryKey} from "./driver/indexeddb.decorator";

export interface IEntity {
    id: string | number | undefined;
}

export abstract class Entity implements IEntity {
    @PrimaryKey({autoIncrement: false})
    public id: string | number | undefined;
}


export const EntityObject = class EntityJS extends Entity {
};