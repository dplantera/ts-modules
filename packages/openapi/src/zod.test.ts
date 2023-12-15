import { z } from 'zod'

describe('zod test', () => {
  test('enum to value without default', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const MyEnum: z.ZodType<'Value1' | 'Value2' | string & {}> = z.enum(['Value1', 'Value2'])
      .or(z.string())

    type Enum = z.infer<typeof MyEnum>

    const a: Enum = MyEnum.parse('Value1')
    switch (a) {
      case 'Value1': { expect(a).toBe('Value1'); break }
      case 'Value2': { throw new Error('test failed 2') }
      default:
        throw new Error('test failed')
    }
    const b: Enum = MyEnum.parse('Value4')
    switch (b) {
      case 'Value1': { throw new Error('test failed 2') }
      case 'Value2': { throw new Error('test failed 2') }
      default:
        expect(b).toBe('Value4')
    }
  })

  test('enum to mixed', () => {
    const MyEnum = z.enum(['Value1', 'Value2'])
      .or(z.string().transform((unknown) => ({ type: 'UNKNOWN' as const, value: unknown })))
    interface UnknownEnumVariant { type: 'UNKNOWN', value: string }
    function isUnkown<T extends string | UnknownEnumVariant> (input: T): input is Extract<T, UnknownEnumVariant> {
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
      .transform((known) => ({ type: 'KNOWN' as const, value: known }))
      .or(z.string().transform((unknown) => ({ type: 'UNKNOWN' as const, value: unknown })))

    type Enum = z.infer<typeof MyEnum>

    const a: Enum = MyEnum.parse('Value1')
    switch (a.type) {
      case 'KNOWN': expect(a.value).toBe('Value1'); break
      case 'UNKNOWN': throw new Error('test failed')
    }
    const b: Enum = MyEnum.parse('Value4')
    switch (b.type) {
      case 'KNOWN': throw new Error('test failed')
      case 'UNKNOWN': expect(b.value).toBe('Value4'); break
    }
  })
})
