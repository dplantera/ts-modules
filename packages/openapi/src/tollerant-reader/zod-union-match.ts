import { z } from "zod";

export module ZodUnionMatch {
  // export type UNKNOWN = string & z.BRAND<"UNKNOWN">;
  export type Matcher = Record<string, z.ZodSchema>;

  export type Schemas<T extends Matcher> = T[keyof T];
  export type Discriminator<T extends Matcher> = keyof z.infer<T[keyof T]>;
  export function matcher<T extends Matcher>(discriminator: Discriminator<T>, matcher: T): Schemas<T> {
    return z
      .custom<T>()
      .transform((val) => {
        const result = matchSafe(val, matcher, discriminator);
        return { result, val };
      })
      .superRefine((prev, ctx) => {
        if (!prev.result.success) {
          const discriminatorValue = prev.val?.[discriminator];
          const discriminatorProp = JSON.stringify(discriminator);
          const discriminatorWithValue = `${discriminatorProp}: ${discriminatorValue}`;
          const expected =
            typeof discriminatorValue === "string" && discriminatorValue in matcher
              ? "respective schema"
              : `{${discriminatorProp}: ${Object.keys(matcher).join(" | ")}}`;
          ctx.addIssue({
            code: "invalid_union",
            unionErrors: [prev.result.error],
            message: `Invalid discriminated union: expected input to match with discriminator ${expected} but received discriminator: (${
              discriminatorWithValue ?? ""
            }) `,
          });
        }
      })
      .transform((v) => (v.result.success ? v.result.data : v.val)) as unknown as Schemas<T>;
  }
  export function match<T extends Matcher>(union: z.infer<Schemas<T>>, matcher: T, discriminator: Discriminator<T>): T {
    const handlerKey = union[discriminator] as keyof typeof matcher;
    return handlerKey in matcher ? (matcher[handlerKey] as z.Schema).parse(union) : matcher.onDefault.parse(union);
  }
  export function matchSafe<T extends Matcher>(
    union: z.infer<Schemas<T>>,
    matcher: T,
    discriminator: Discriminator<T>
  ): z.SafeParseSuccess<Schemas<T>> | z.SafeParseError<z.ZodError> {
    const handlerKey = union?.[discriminator] as keyof typeof matcher;
    return handlerKey in matcher ? (matcher?.[handlerKey] as z.Schema)?.safeParse(union) : matcher.onDefault.safeParse(union);
  }
}
