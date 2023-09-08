import * as z from 'zod';
import {extendShape, ZodRawShape} from "zod";

describe("test", () => {

    it("should work", () => {

        const A = z.object({a: z.string()})
        const B = z.object({b: z.string()})
        const C = z.object({a: z.string().optional()})

        const AB = B.merge(A);
        const CA = A.merge(C);

        expect(AB.parse({a: "a", b: "b"})).toEqual({a: "a", b: "b"})
        expect(() => AB.parse({a: "a"})).toThrow()
        expect(() => CA.parse({b: "b"})).not.toThrow()
    })
})

type TA = z.ZodObject<{ a: z.ZodString }>
type TB = z.ZodObject<{ b: z.ZodString }>
type TC = z.ZodObject<{ a: z.ZodOptional<z.ZodString> }>
const A:TA = z.object({a: z.string()})
const B:TB = z.object({b: z.string()})
const C:TC = z.object({a: z.string().optional()})

type _Merge<T extends ZodRawShape, Incoming extends z.ZodTypeAny> = z.ZodObject<extendShape<T, ReturnType<Incoming["_def"]["shape"]>>, Incoming["_def"]["unknownKeys"], Incoming["_def"]["catchall"]>
type Merge<T extends z.AnyZodObject, Incoming extends z.AnyZodObject> = _Merge<T['shape'], Incoming>
module T1 {
    type TAB = z.ZodObject<z.objectUtil.MergeShapes<TA['shape'], TB['shape']>>
    type TCA = z.ZodObject<z.objectUtil.MergeShapes<TA['shape'], TC['shape']>>
    const AB: TAB = B.merge(A);
    const CA: TCA = A.merge(C);
}
module T2 {
    type TAB = Merge<TA, TB>
    type TCA = z.ZodObject<z.objectUtil.MergeShapes<TA['shape'], TC['shape']>>
    const AB: TAB = B.merge(A);
    const CA: TCA = A.merge(C);
}

