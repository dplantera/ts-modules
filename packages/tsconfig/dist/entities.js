"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityObject = exports.Entity = void 0;
const indexeddb_decorator_1 = require("./driver/indexeddb.decorator");
class Entity {
    id;
}
exports.Entity = Entity;
__decorate([
    (0, indexeddb_decorator_1.PrimaryKey)({ autoIncrement: false })
], Entity.prototype, "id", void 0);
const EntityObject = class EntityJS extends Entity {
};
exports.EntityObject = EntityObject;
