import * as z from 'zod';

const A = z.object({a: z.string()})
const B = z.object({b: z.string()})

const M = B.merge(A);


