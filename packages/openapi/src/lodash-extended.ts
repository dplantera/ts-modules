// noinspection ES6UnusedImports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import lodash from "lodash";
declare module "lodash" {
  interface LoDashStatic {
    isDefined<T>(input: T): input is NonNullable<T>;
  }
  interface LoDashExplicitWrapper<TValue> {
    isDefined(input: TValue): LoDashExplicitWrapper<NonNullable<TValue>>;
  }
}

lodash.mixin({
  isDefined: <T>(input: T | undefined) => !lodash.isNil(input),
});
