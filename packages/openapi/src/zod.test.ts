/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
import {z} from 'zod'
import {Opaque} from "type-fest";


describe('zod test', () => {
    test("merge allOf discriminator when subschema defines a more concrete value than parent", () => {
        const Parent = z.object({type: z.string()})
        const A = z.object({type: z.literal('A'), a: z.string()})

        const MergedA = Parent.merge(A);
        // @ts-expect-error prop 'a' is missing
        const m: z.infer<typeof MergedA> = {type: 'A' }

        expect(MergedA.safeParse({type: 'C', a: 'value'}).success).toEqual(false)
        expect(MergedA.safeParse({type: 'A', a: 'value'}).success).toEqual(true)
    })

    test('enum to value with opaque annotation', () => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        type UNKNOWN = Opaque<string>;
        const MyEnum = z.enum(['Value1', 'Value2', 'Value3']).or(z.string().transform((e => e as UNKNOWN)))

        type Enum = z.infer<typeof MyEnum>

        const a: Enum = MyEnum.parse('Value1')
        switch (a) {
            case 'Value1': {
                expect(a).toBe('Value1');
                break
            }
            case 'Value2': {
                throw new Error('test failed 2')
            }
            default: {
                // @ts-expect-error expected error
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const check: UNKNOWN = a;
                throw new Error('test failed 2')
            }
        }
        const b: Enum = MyEnum.parse('Value4')
        switch (b) {
            case 'Value1': {
                throw new Error('test failed 2')
            }
            case 'Value2': {
                throw new Error('test failed 2')
            }
        }
        const result = MyEnum.safeParse(2)
        expect(result.success).toBeFalsy()
    })

    test('invalid enum with unknown schema handling', () => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const MyEnum = z.enum(['Value1', 'Value2', 'Value3'])
            // eslint-disable-next-line @typescript-eslint/ban-types
            .or(z.string().transform((e => e as string & {})).refine((value) => typeof value !== 'string', {
                message: 'expected value to be of type string'
            }))

        const result = MyEnum.safeParse(2)
        expect(result.success).toBeFalsy()
    })
    test('enum to value without annotation', () => {
        const MyEnum0 = z.enum(['Value1', 'Value2', 'Value3'])
        // eslint-disable-next-line @typescript-eslint/ban-types
        const MyEnum = MyEnum0.or(z.string().transform((e => e as string & {})))

        type Enum = z.infer<typeof MyEnum>
        type Enum0 = z.infer<typeof MyEnum0>

        const a: Enum = MyEnum.parse('Value1')
        switch (a) {
            case 'Value1': {
                expect(a).toBe('Value1');
                break
            }
            case 'Value2': {
                throw new Error('test failed 2')
            }
            default: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const check: never = a as Exclude<Enum0, typeof a>;
                throw new Error('test failed 2')
            }

        }
        const b: Enum = MyEnum.parse('Value4')
        switch (b) {
            case 'Value1': {
                throw new Error('test failed 2')
            }
            case 'Value2': {
                throw new Error('test failed 2')
            }
        }
        const result = MyEnum.safeParse(2)
        expect(result.success).toBeFalsy()
    })

    test('enum to value without default', () => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const MyEnum: z.ZodType<'Value1' | 'Value2' | string & {}> = z.enum(['Value1', 'Value2'])
            .or(z.string())

        type Enum = z.infer<typeof MyEnum>

        const a: Enum = MyEnum.parse('Value1')
        switch (a) {
            case 'Value1': {
                expect(a).toBe('Value1');
                break
            }
            case 'Value2': {
                throw new Error('test failed 2')
            }
            default:
                throw new Error('test failed')
        }
        const b: Enum = MyEnum.parse('Value4')
        switch (b) {
            case 'Value1': {
                throw new Error('test failed 2')
            }
            case 'Value2': {
                throw new Error('test failed 2')
            }
            default:
                expect(b).toBe('Value4')
        }
    })

    test('enum to mixed', () => {
        const MyEnum = z.enum(['Value1', 'Value2'])
            .or(z.string().transform((unknown) => ({type: 'UNKNOWN' as const, value: unknown})))

        interface UnknownEnumVariant {
            type: 'UNKNOWN',
            value: string
        }

        function isUnkown<T extends string | UnknownEnumVariant>(input: T): input is Extract<T, UnknownEnumVariant> {
            return typeof input === 'object'
        }

        type Enum = z.infer<typeof MyEnum>

        const a: Enum = MyEnum.parse('Value1')
        if (isUnkown(a)) {
            throw new Error('test failed')
        } else {
            expect(a).toBe('Value1')
        }

        const b: Enum = MyEnum.parse('Value4')
        if (isUnkown(b)) {
            expect(b.value).toBe('Value4')
        } else {
            throw new Error('test failed')
        }
    })

    test('enum to complex object', () => {
        const MyEnum = z.enum(['Value1', 'Value2'])
            .transform((known) => ({type: 'KNOWN' as const, value: known}))
            .or(z.string().transform((unknown) => ({type: 'UNKNOWN' as const, value: unknown})))

        type Enum = z.infer<typeof MyEnum>

        const a: Enum = MyEnum.parse('Value1')
        switch (a.type) {
            case 'KNOWN':
                expect(a.value).toBe('Value1');
                break
            case 'UNKNOWN':
                throw new Error('test failed')
        }
        const b: Enum = MyEnum.parse('Value4')
        switch (b.type) {
            case 'KNOWN':
                throw new Error('test failed')
            case 'UNKNOWN':
                expect(b.value).toBe('Value4');
                break
        }
    })
})
