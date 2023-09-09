"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const z = __importStar(require("zod"));
describe("test", () => {
    it("should work", () => {
        const A = z.object({ a: z.string() });
        const B = z.object({ b: z.string() });
        const C = z.object({ a: z.string().optional() });
        const AB = B.merge(A);
        const CA = A.merge(C);
        expect(AB.parse({ a: "a", b: "b" })).toEqual({ a: "a", b: "b" });
        expect(() => AB.parse({ a: "a" })).toThrow();
        expect(() => CA.parse({ b: "b" })).not.toThrow();
    });
});
const A = z.object({ a: z.string() });
const B = z.object({ b: z.string() });
const C = z.object({ a: z.string().optional() });
var T1;
(function (T1) {
    const AB = B.merge(A);
    const CA = A.merge(C);
})(T1 || (T1 = {}));
var T2;
(function (T2) {
    const AB = B.merge(A);
    const CA = A.merge(C);
})(T2 || (T2 = {}));
