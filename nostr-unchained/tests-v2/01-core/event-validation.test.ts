import { describe, it, expect } from 'vitest';
import { EventBuilder } from '../../src/core/EventBuilder.js';

const validHex = 'a'.repeat(64);
const buildBaseEvent = () => ({
  id: 'b'.repeat(64),
  pubkey: validHex,
  created_at: Math.floor(Date.now() / 1000),
  kind: 1,
  tags: [] as string[][],
  content: 'test',
  sig: 'c'.repeat(128)
});

describe('EventBuilder.validateEvent', () => {
  it('accepts a well-formed event', () => {
    const event = buildBaseEvent();
    const validation = EventBuilder.validateEvent(event as any);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('rejects invalid pubkey format', () => {
    const event = { ...buildBaseEvent(), pubkey: 'not-hex' };
    const validation = EventBuilder.validateEvent(event as any);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /pubkey/i.test(err))).toBe(true);
  });

  it('rejects non-array tags', () => {
    const event = { ...buildBaseEvent(), tags: ['invalid'] as unknown as string[][] };
    const validation = EventBuilder.validateEvent(event as any);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /Tag 0/i.test(err))).toBe(true);
  });

  it('rejects invalid kind and created_at types', () => {
    const event = { ...buildBaseEvent(), kind: '1', created_at: 'now' } as any;
    const validation = EventBuilder.validateEvent(event);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => /kind/i.test(err))).toBe(true);
    expect(validation.errors.some((err) => /created_at/i.test(err))).toBe(true);
  });

  it('produces valid events via createEvent helper', async () => {
    const created = await EventBuilder.createEvent(
      'hello validation',
      validHex,
      { kind: 1 }
    );
    const validation = EventBuilder.validateEvent(created as any);
    expect(validation.valid).toBe(true);
  });
});

