import { describe, it, expect } from 'vitest';

describe('Simple Tests', () => {
  it('should work with basic functionality', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with strings', () => {
    expect('hello').toBe('hello');
  });

  it('should work with arrays', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });
}); 