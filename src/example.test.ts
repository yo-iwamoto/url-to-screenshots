import { fc, it } from '@fast-check/vitest';

const add = (a: number, b: number) => a + b;

describe('add', () => {
  it.prop([fc.integer(), fc.integer()])('works', (a, b) => {
    return add(a, b) === a + b;
  });
});
