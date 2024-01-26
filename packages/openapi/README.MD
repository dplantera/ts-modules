# @dsp/openapi

Collection of ready to use tools to facilitate OpenApi specification centered workflows.
Standard tooling is incorporated but configured and modified to yield consistent and opinionated results.

## Project Goals

1. We write **tech stack agnostic** OpenApi specifications which are as compatible as possible with widespread OpenApi tooling **across domains** and the use
   cases **json payload validation**, **api documentation** and **code generation**.
    1. We leverage tooling helping us to write specifications to fulfill rule 1 by automatically applying opinionated practices.
    2. We express concepts like inheritance and polymorphism as precise as possible with OpenApi rather than extending OpenApi syntax which need to be known for
       interpreting the specification.
2. We aim for generated code which is suitable for statically analysing the correctness of our programs
    1. We want generated code which respects a **tolerant reader**
    2. We want the generated code to be usable in vanilla tech stacks without forcing a framework on our consumers.

## Features

### Openapi Specification

#### bundler

- ✅ Configured wrapper of the standard [redocly](https://redocly.com/docs/cli/) bundler.

#### post processing

- ✅ merge all of
- ✅ ensure discriminator values
- ✅ support muli schema usage in discriminator mapping (1:n discriminator value to mapping)
#### example
| examples | src                                 | bundled                                     | post-processed                                       |
|----------|-------------------------------------|---------------------------------------------|------------------------------------------------------|
| simple   | [link to src][simple-petstore-src]  | [link to bundled][simple-petstore-bundled]  | [link to post-processed][simple-petstore-processed]  |
| complex  | [link to src][complex-petstore-src] | [link to bundled][complex-petstore-bundled] | [link to post-processed][complex-petstore-processed] |

### Code Generator

#### typescript-axios

- ✅ configured wrapper of the standard [typescript-axios](https://github.com/OpenAPITools/openapi-generator/blob/master/docs/generators/typescript-axios.md)
  generator
- modifications
    - ✅ ensured discriminator values on all union sub types
    - ✅ recursively ensured discriminator values for nested union types
    - ✅ typescript compatible **unknown enum variant** which can be used in exhaustive switch cases
    - ✅ cleaned generator output
    - ✅ match (switch alternative) utility for every union like type
- example
    ````typescript
    export type UNKNOWN_ENUM_VARIANT = string & { readonly [tag]: "UNKNOWN"; };
    
    interface Seam {
        catType: 'SEAM',
        type: 'CAT'
    }
    
    interface ShortHair {
        catType: 'SHORT',
        type: 'CAT'
    }
    
    type Cat = | { catType: 'SEAM' } & Seam 
               | { catType: 'SHORT' } & ShortHair 
               | { type: UNKNOWN_ENUM_VARIANT, [prop: string]: unknown }
    
    interface Dog {
        type: 'DOG'
    }
    
    type Pet = | { type: 'CAT' } & Cat 
               | { type: 'DOG' } & Dog 
               | { type: UNKNOWN_ENUM_VARIANT, [prop: string]: unknown }
  
  /** Utilities to work with the discriminated union Pet (will be generated for every discriminated or simple union) */  
  export module Pet {
        type Handler<I, R> = (e: I) => R;
        type MatchObj<T extends Pet, R> = { [K in T as K["type"]]: Handler<Extract<T, { type: K["type"] }>, R> } & { onDefault: Handler<unknown, R> };
        
        /** All handler must return the same type*/
        export function match<R>(union: Pet, handler: MatchObj<Pet, R>): R {
            return union.type in handler ? handler[union.type](union as never) : handler.onDefault(union);
        }
        
        /** All handler must return the same type*/
        export function matchPartial<R>(union: Pet, handler: Partial<MatchObj<Pet, R>>): R | undefined {
            return union.type in handler ? handler[union.type]?.(union as never) : handler.onDefault?.(union);
        }
    }
  
    /* some example usage without utilities */
    function fooPet(pet: Pet): any {
        switch (pet.type) {
            case 'CAT':
                return doSomethingWithCat(pet);
            case 'DOG':
                return doSomethingWithDog(pet);
            default:
                // exhaustiveness check: will throw compiler error for new variats
                const unknownVariant: UNKNOWN_ENUM_VARIANT = pet;
                logger.warning(`can't explicitly handle variant '${unknownVariant.type}' at the moment`);
                return applyDefaultOrThrow();
        }
    }
  
    /* some example usage with utilities, note that the discriminator handling is handled by the generator */
    function fooPet(pet: Pet): any {
       return Pet.match(pet, {
           'CAT': doSomethingWithCat,
           'DOG': doSomethingWithDog,
           onDefault: () => {
               logger.warning(`can't explicitly handle variant '${unknownVariant.type}' at the moment`);
               return applyDefaultOrThrow();
           }
        })
    }
  
    /* some example usage with utilities, note that the handler arguments are type safe*/
    function fooPetNested(pet: Pet): any {
        return Pet.match(pet, {
            'CAT': (c) =>
                  Cat.match(c, {
                    'SEAM': () => 1.1,
                    'SHORT': () => 1.2,
                    onDefault: () => 1.3,
                  }),
            'DOG': (d) => 2,
            onDefault: (unknown) => 3,
        });
    }
    ````

#### zod

- 🔲 generate 100 % compatible schemas with generated typescript types
- 🔲 support **unknown enum variant**
- 🔲 support of nested (discriminated) unions
- 🔲 support of circular (lacy) schemas

[complex-petstore-src]: ./test/specs/pets-modular-complex/petstore-api.yml

[complex-petstore-bundled]: ./docs/examples/specs/complex-petstore-bundled.yml

[complex-petstore-processed]: ./docs/examples/specs/complex-petstore-post-processed.yml

[simple-petstore-src]: ./test/specs/pets-simple/pets-api.yml

[simple-petstore-bundled]: ./docs/examples/specs/simple-petstore-bundled.yml

[simple-petstore-processed]: ./docs/examples/specs/simple-petstore-post-processed.yml