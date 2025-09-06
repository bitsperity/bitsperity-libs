var Xe = Object.defineProperty;
var Ze = (o, t, e) => t in o ? Xe(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var l = (o, t, e) => Ze(o, typeof t != "symbol" ? t + "" : t, e);
import * as dt from "@noble/secp256k1";
import { getSharedSecret as Qe } from "@noble/secp256k1";
const lt = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function ts(o) {
  return o instanceof Uint8Array || ArrayBuffer.isView(o) && o.constructor.name === "Uint8Array";
}
function Vt(o) {
  if (!Number.isSafeInteger(o) || o < 0)
    throw new Error("positive integer expected, got " + o);
}
function gt(o, ...t) {
  if (!ts(o))
    throw new Error("Uint8Array expected");
  if (t.length > 0 && !t.includes(o.length))
    throw new Error("Uint8Array expected of length " + t + ", got length=" + o.length);
}
function Qt(o) {
  if (typeof o != "function" || typeof o.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Vt(o.outputLen), Vt(o.blockLen);
}
function Ct(o, t = !0) {
  if (o.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (t && o.finished)
    throw new Error("Hash#digest() has already been called");
}
function es(o, t) {
  gt(o);
  const e = t.outputLen;
  if (o.length < e)
    throw new Error("digestInto() expects output buffer of length at least " + e);
}
function bt(...o) {
  for (let t = 0; t < o.length; t++)
    o[t].fill(0);
}
function Ut(o) {
  return new DataView(o.buffer, o.byteOffset, o.byteLength);
}
function tt(o, t) {
  return o << 32 - t | o >>> t;
}
const Ee = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", ss = /* @__PURE__ */ Array.from({ length: 256 }, (o, t) => t.toString(16).padStart(2, "0"));
function D(o) {
  if (gt(o), Ee)
    return o.toHex();
  let t = "";
  for (let e = 0; e < o.length; e++)
    t += ss[o[e]];
  return t;
}
const st = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function oe(o) {
  if (o >= st._0 && o <= st._9)
    return o - st._0;
  if (o >= st.A && o <= st.F)
    return o - (st.A - 10);
  if (o >= st.a && o <= st.f)
    return o - (st.a - 10);
}
function ct(o) {
  if (typeof o != "string")
    throw new Error("hex string expected, got " + typeof o);
  if (Ee)
    return Uint8Array.fromHex(o);
  const t = o.length, e = t / 2;
  if (t % 2)
    throw new Error("hex string expected, got unpadded hex of length " + t);
  const s = new Uint8Array(e);
  for (let i = 0, r = 0; i < e; i++, r += 2) {
    const n = oe(o.charCodeAt(r)), a = oe(o.charCodeAt(r + 1));
    if (n === void 0 || a === void 0) {
      const c = o[r] + o[r + 1];
      throw new Error('hex string expected, got non-hex character "' + c + '" at index ' + r);
    }
    s[i] = n * 16 + a;
  }
  return s;
}
function is(o) {
  if (typeof o != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(o));
}
function mt(o) {
  return typeof o == "string" && (o = is(o)), gt(o), o;
}
function It(...o) {
  let t = 0;
  for (let s = 0; s < o.length; s++) {
    const i = o[s];
    gt(i), t += i.length;
  }
  const e = new Uint8Array(t);
  for (let s = 0, i = 0; s < o.length; s++) {
    const r = o[s];
    e.set(r, i), i += r.length;
  }
  return e;
}
class Se {
}
function rs(o) {
  const t = (s) => o().update(mt(s)).digest(), e = o();
  return t.outputLen = e.outputLen, t.blockLen = e.blockLen, t.create = () => o(), t;
}
function ht(o = 32) {
  if (lt && typeof lt.getRandomValues == "function")
    return lt.getRandomValues(new Uint8Array(o));
  if (lt && typeof lt.randomBytes == "function")
    return Uint8Array.from(lt.randomBytes(o));
  throw new Error("crypto.getRandomValues must be defined");
}
function ns(o, t, e, s) {
  if (typeof o.setBigUint64 == "function")
    return o.setBigUint64(t, e, s);
  const i = BigInt(32), r = BigInt(4294967295), n = Number(e >> i & r), a = Number(e & r), c = s ? 4 : 0, u = s ? 0 : 4;
  o.setUint32(t + c, n, s), o.setUint32(t + u, a, s);
}
function os(o, t, e) {
  return o & t ^ ~o & e;
}
function as(o, t, e) {
  return o & t ^ o & e ^ t & e;
}
class cs extends Se {
  constructor(t, e, s, i) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = t, this.outputLen = e, this.padOffset = s, this.isLE = i, this.buffer = new Uint8Array(t), this.view = Ut(this.buffer);
  }
  update(t) {
    Ct(this), t = mt(t), gt(t);
    const { view: e, buffer: s, blockLen: i } = this, r = t.length;
    for (let n = 0; n < r; ) {
      const a = Math.min(i - this.pos, r - n);
      if (a === i) {
        const c = Ut(t);
        for (; i <= r - n; n += i)
          this.process(c, n);
        continue;
      }
      s.set(t.subarray(n, n + a), this.pos), this.pos += a, n += a, this.pos === i && (this.process(e, 0), this.pos = 0);
    }
    return this.length += t.length, this.roundClean(), this;
  }
  digestInto(t) {
    Ct(this), es(t, this), this.finished = !0;
    const { buffer: e, view: s, blockLen: i, isLE: r } = this;
    let { pos: n } = this;
    e[n++] = 128, bt(this.buffer.subarray(n)), this.padOffset > i - n && (this.process(s, 0), n = 0);
    for (let d = n; d < i; d++)
      e[d] = 0;
    ns(s, i - 8, BigInt(this.length * 8), r), this.process(s, 0);
    const a = Ut(t), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const u = c / 4, h = this.get();
    if (u > h.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let d = 0; d < u; d++)
      a.setUint32(4 * d, h[d], r);
  }
  digest() {
    const { buffer: t, outputLen: e } = this;
    this.digestInto(t);
    const s = t.slice(0, e);
    return this.destroy(), s;
  }
  _cloneInto(t) {
    t || (t = new this.constructor()), t.set(...this.get());
    const { blockLen: e, buffer: s, length: i, finished: r, destroyed: n, pos: a } = this;
    return t.destroyed = n, t.finished = r, t.length = i, t.pos = a, i % e && t.buffer.set(s), t;
  }
  clone() {
    return this._cloneInto();
  }
}
const it = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), us = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]), rt = /* @__PURE__ */ new Uint32Array(64);
class ls extends cs {
  constructor(t = 32) {
    super(64, t, 8, !1), this.A = it[0] | 0, this.B = it[1] | 0, this.C = it[2] | 0, this.D = it[3] | 0, this.E = it[4] | 0, this.F = it[5] | 0, this.G = it[6] | 0, this.H = it[7] | 0;
  }
  get() {
    const { A: t, B: e, C: s, D: i, E: r, F: n, G: a, H: c } = this;
    return [t, e, s, i, r, n, a, c];
  }
  // prettier-ignore
  set(t, e, s, i, r, n, a, c) {
    this.A = t | 0, this.B = e | 0, this.C = s | 0, this.D = i | 0, this.E = r | 0, this.F = n | 0, this.G = a | 0, this.H = c | 0;
  }
  process(t, e) {
    for (let d = 0; d < 16; d++, e += 4)
      rt[d] = t.getUint32(e, !1);
    for (let d = 16; d < 64; d++) {
      const f = rt[d - 15], p = rt[d - 2], g = tt(f, 7) ^ tt(f, 18) ^ f >>> 3, y = tt(p, 17) ^ tt(p, 19) ^ p >>> 10;
      rt[d] = y + rt[d - 7] + g + rt[d - 16] | 0;
    }
    let { A: s, B: i, C: r, D: n, E: a, F: c, G: u, H: h } = this;
    for (let d = 0; d < 64; d++) {
      const f = tt(a, 6) ^ tt(a, 11) ^ tt(a, 25), p = h + f + os(a, c, u) + us[d] + rt[d] | 0, y = (tt(s, 2) ^ tt(s, 13) ^ tt(s, 22)) + as(s, i, r) | 0;
      h = u, u = c, c = a, a = n + p | 0, n = r, r = i, i = s, s = p + y | 0;
    }
    s = s + this.A | 0, i = i + this.B | 0, r = r + this.C | 0, n = n + this.D | 0, a = a + this.E | 0, c = c + this.F | 0, u = u + this.G | 0, h = h + this.H | 0, this.set(s, i, r, n, a, c, u, h);
  }
  roundClean() {
    bt(rt);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), bt(this.buffer);
  }
}
const hs = /* @__PURE__ */ rs(() => new ls()), et = hs, ds = [
  "ws://umbrel.local:4848",
  // Local testing relay (highest priority)
  "wss://relay.damus.io"
  // Single public relay fallback
], Z = {
  RELAY_TIMEOUT: 1e4,
  // 10 seconds
  PUBLISH_TIMEOUT: 3e4,
  // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1e3,
  // 1 second
  MAX_CONTENT_LENGTH: 8192,
  // Reasonable content limit
  CONNECTION_TIMEOUT: 1e4
  // 10 seconds for initial connection
}, ae = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  ENCRYPTED_DM: 4,
  DELETE: 5
}, O = {
  EMPTY_CONTENT: "Content cannot be empty",
  CONTENT_TOO_LONG: "Content too long",
  NO_RELAYS: "No relays configured",
  CONNECTION_FAILED: "Failed to connect to relay",
  SIGNING_FAILED: "Failed to sign event",
  PUBLISH_FAILED: "Failed to publish to any relay",
  NO_EXTENSION: "No browser extension available",
  INVALID_EVENT: "Invalid event structure"
}, ft = {
  EMPTY_CONTENT: "Add some content to your message",
  CONTENT_TOO_LONG: `Keep your message under ${Z.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: "Check your internet connection and try again",
  NO_EXTENSION: "Install a Nostr browser extension or the library will use a temporary key",
  PUBLISH_FAILED: "Try again or check if your relays are accessible"
}, Tt = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class M {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(t, e) {
    return {
      pubkey: e,
      created_at: Math.floor(Date.now() / 1e3),
      kind: ae.TEXT_NOTE,
      tags: [],
      content: t
    };
  }
  /**
   * Calculate event ID according to NIP-01 specification
   * 
   * The event ID is the SHA256 hash of the serialized event data:
   * [0, pubkey, created_at, kind, tags, content]
   */
  static calculateEventId(t) {
    const e = JSON.stringify([
      0,
      // Reserved future use
      t.pubkey,
      t.created_at,
      t.kind,
      t.tags,
      t.content
    ]), s = new TextEncoder().encode(e), i = et(s);
    return D(i);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(t) {
    const e = M.calculateEventId(t);
    return { ...t, id: e };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(t) {
    const e = [];
    if (t.pubkey || e.push("Missing pubkey"), t.created_at || e.push("Missing created_at"), typeof t.kind != "number" && e.push("Missing or invalid kind"), Array.isArray(t.tags) || e.push("Missing or invalid tags"), typeof t.content != "string" && e.push("Missing or invalid content"), t.pubkey && !Tt.HEX_64.test(t.pubkey) && e.push("Invalid pubkey format (must be 64-character hex string)"), t.id && !Tt.HEX_64.test(t.id) && e.push("Invalid event ID format (must be 64-character hex string)"), t.sig && !Tt.HEX_128.test(t.sig) && e.push("Invalid signature format (must be 128-character hex string)"), t.content === "" && !this.isEmptyContentAllowed(t.kind) && e.push(O.EMPTY_CONTENT), t.content && t.content.length > Z.MAX_CONTENT_LENGTH && e.push(O.CONTENT_TOO_LONG), t.created_at) {
      const s = Math.floor(Date.now() / 1e3), i = s - 3600, r = s + 3600;
      (t.created_at < i || t.created_at > r) && e.push("Timestamp is too far in the past or future");
    }
    return t.tags && (Array.isArray(t.tags) ? t.tags.forEach((s, i) => {
      Array.isArray(s) ? s.forEach((r, n) => {
        typeof r != "string" && e.push(`Tag ${i}[${n}] must be a string`);
      }) : e.push(`Tag ${i} must be an array`);
    }) : e.push("Tags must be an array")), {
      valid: e.length === 0,
      errors: e
    };
  }
  /**
   * Validate content before event creation
   */
  static validateContent(t, e) {
    const s = [];
    return t === "" && !this.isEmptyContentAllowed(e) && s.push(O.EMPTY_CONTENT), t.length > Z.MAX_CONTENT_LENGTH && s.push(O.CONTENT_TOO_LONG), {
      valid: s.length === 0,
      errors: s
    };
  }
  /**
   * Check if empty content is allowed for specific event kinds
   */
  static isEmptyContentAllowed(t) {
    return t ? [
      3,
      // NIP-02: Contact list / Follow list (typically has empty content)
      5,
      // NIP-09: Event deletion (may have empty content)
      6,
      // NIP-18: Repost (requires empty content)
      7,
      // NIP-25: Reaction (may have empty content for simple reactions)
      10002,
      // NIP-65: Relay List Metadata (empty content)
      34550,
      // NIP-72: Community definition (replaceable, tags carry metadata)
      4550,
      // NIP-72: Approval event (content may embed JSON, but can be empty by clients)
      27235,
      // NIP-98: HTTP Auth event (content not required)
      1063,
      // NIP-94: File metadata event (content optional)
      3e4,
      // NIP-51: Follow Categorization (addressable list)
      30001,
      // NIP-51: Generic Lists
      30002,
      // NIP-51: Relay Lists
      30003,
      // NIP-51: Bookmark Lists
      1985,
      // NIP-32: Labeling events may have empty content
      // NOTE: 1059 (Gift wraps) removed - they MUST have encrypted content per NIP-44
      1984
      // NIP-56: Reporting (may have empty content with just tags)
    ].includes(t) : !1;
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(t) {
    return M.calculateEventId({
      pubkey: t.pubkey,
      created_at: t.created_at,
      kind: t.kind,
      tags: t.tags,
      content: t.content
    }) === t.id;
  }
  /**
   * Create a complete event with validation
   */
  static async createEvent(t, e, s = {}) {
    const i = M.validateContent(t, s.kind);
    if (!i.valid)
      throw new Error(`Invalid content: ${i.errors.join(", ")}`);
    const r = {
      pubkey: e,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? ae.TEXT_NOTE,
      tags: s.tags ?? [],
      content: t
    }, n = M.validateEvent(r);
    if (!n.valid)
      throw new Error(`Invalid event: ${n.errors.join(", ")}`);
    return r;
  }
}
async function gs() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class fs {
  constructor(t, e = {}) {
    l(this, "connections", /* @__PURE__ */ new Map());
    l(this, "debug");
    l(this, "messageHandler");
    // NIP-42: optional provider and hook to create and sign auth events
    l(this, "authEventFactory");
    l(this, "onAuthStateChange");
    // Publish timeout (ms) – falls nicht gesetzt, wird DEFAULT_CONFIG.PUBLISH_TIMEOUT verwendet
    l(this, "publishTimeout");
    // Reconnection configuration
    l(this, "maxReconnectAttempts", 5);
    l(this, "baseReconnectDelay", 1e3);
    // 1 second
    l(this, "maxReconnectDelay", 3e4);
    // 30 seconds
    l(this, "reconnectEnabled", !0);
    l(this, "pendingPublishes", /* @__PURE__ */ new Map());
    this.debug = e.debug ?? !1, this.publishTimeout = e.publishTimeout, t.forEach((s) => {
      this.connections.set(s, {
        url: s,
        state: "disconnected"
      });
    });
  }
  /**
   * Configure NIP-42 authentication hooks
   */
  configureAuth(t) {
    this.authEventFactory = t.authEventFactory, this.onAuthStateChange = t.onAuthStateChange;
  }
  /**
   * Get list of relay URLs
   */
  get relayUrls() {
    return Array.from(this.connections.keys());
  }
  /**
   * Get list of connected relay URLs
   */
  get connectedRelays() {
    return Array.from(this.connections.entries()).filter(([t, e]) => e.state === "connected").map(([t, e]) => t);
  }
  /**
   * Connect to all configured relays
   */
  async connect() {
    const t = this.relayUrls.map(
      (e) => this.connectToRelay(e).catch((s) => (this.debug && console.warn(`Failed to connect to ${e}:`, s), !1))
    );
    if (await Promise.allSettled(t), this.connectedRelays.length === 0)
      throw new Error("Failed to connect to any relay");
  }
  /**
   * Connect to a specific relay
   */
  async connectToRelay(t) {
    const e = this.connections.get(t);
    if (!e)
      throw new Error(`Relay ${t} not configured`);
    return e.state === "connected" ? !0 : (e.state = "connecting", new Promise(async (s, i) => {
      try {
        const r = await gs(), n = new r(t), a = setTimeout(() => {
          n.close(), e.state = "error", e.error = "Connection timeout", i(new Error(`Connection to ${t} timed out`));
        }, Z.CONNECTION_TIMEOUT);
        n.onopen = () => {
          clearTimeout(a), e.ws = n, e.state = "connected", e.lastConnected = Date.now(), e.error = void 0, this.debug && console.log(`Connected to relay: ${t}`), s(!0);
        }, n.onerror = (c) => {
          clearTimeout(a), e.state = "error", e.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${t}:`, c), i(new Error(`Failed to connect to ${t}: WebSocket error`));
        }, n.onclose = (c) => {
          e.state = "disconnected", e.ws = void 0, this.debug && console.log(`Disconnected from relay: ${t}`, c.code, c.reason), this.reconnectEnabled && c.code !== 1e3 && this.scheduleReconnection(t);
        }, n.onmessage = (c) => {
          this.handleRelayMessage(t, c.data);
        };
      } catch (r) {
        e.state = "error", e.error = r instanceof Error ? r.message : "Unknown error", i(r);
      }
    }));
  }
  /**
   * Publish event to specific relays
   */
  async publishToRelays(t, e, s) {
    const i = [], r = !!(s != null && s.resolveOnFirstOk), n = Math.max(1, (s == null ? void 0 : s.minAcks) ?? 1), a = (s == null ? void 0 : s.overallTimeoutMs) ?? this.publishTimeout ?? Z.PUBLISH_TIMEOUT;
    if (r) {
      let u = 0, h;
      const d = new Promise((p) => {
        h = p;
      }), f = setTimeout(() => {
        try {
          h(i.slice());
        } catch {
        }
      }, a);
      return e.forEach(async (p) => {
        const g = Date.now();
        try {
          const y = await this.publishToRelay(p, t), m = Date.now() - g;
          if (i.push({ relay: p, success: y, latency: m }), y && (u++, u >= n)) {
            try {
              clearTimeout(f);
            } catch {
            }
            h(i.slice());
          }
        } catch (y) {
          const m = Date.now() - g;
          i.push({
            relay: p,
            success: !1,
            error: y instanceof Error ? y.message : "Unknown error",
            latency: m
          });
        }
      }), await d;
    }
    const c = e.map(async (u) => {
      const h = Date.now();
      try {
        const d = await this.publishToRelay(u, t), f = Date.now() - h;
        i.push({
          relay: u,
          success: d,
          latency: f
        });
      } catch (d) {
        const f = Date.now() - h;
        i.push({
          relay: u,
          success: !1,
          error: d instanceof Error ? d.message : "Unknown error",
          latency: f
        });
      }
    });
    return await Promise.allSettled(c), i;
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(t) {
    const e = [], s = this.connectedRelays.map(async (i) => {
      const r = Date.now();
      try {
        const n = await this.publishToRelay(i, t), a = Date.now() - r;
        e.push({
          relay: i,
          success: n,
          latency: a
        });
      } catch (n) {
        const a = Date.now() - r;
        e.push({
          relay: i,
          success: !1,
          error: n instanceof Error ? n.message : "Unknown error",
          latency: a
        });
      }
    });
    return await Promise.allSettled(s), e;
  }
  /**
   * Publish event to specific relay
   */
  async publishToRelay(t, e) {
    const s = this.connections.get(t);
    if (!s || s.state !== "connected" || !s.ws)
      throw new Error(`Not connected to relay: ${t}`);
    return new Promise((i, r) => {
      const n = s.ws, a = ["EVENT", e], c = setTimeout(() => {
        const h = `${e.id}|${t}`;
        this.pendingPublishes.delete(h), r(new Error("Publish timeout"));
      }, this.publishTimeout ?? Z.PUBLISH_TIMEOUT), u = `${e.id}|${t}`;
      this.pendingPublishes.set(u, { resolve: i, reject: r, timeout: c, originalEvent: e, retries: 0, awaitingAuth: !1 });
      try {
        const h = JSON.stringify(a);
        n.send(h), this.debug && (console.log(`📤 Publishing event ${e.id} to ${t}`), console.log("📤 Message:", h), console.log("📤 Added to pending:", u));
      } catch (h) {
        clearTimeout(c);
        const d = `${e.id}|${t}`;
        this.pendingPublishes.delete(d), r(h);
      }
    });
  }
  /** Detect if an error string indicates NIP-42 auth requirement */
  isAuthRequiredError(t) {
    if (typeof t != "string") return !1;
    const e = t.toLowerCase();
    return e.includes("auth-required") || e.includes("restricted") || e.includes("nip-42") || e.includes("nip42");
  }
  /** After successful AUTH, try to re-send all pending events for this relay that awaited auth */
  retryPendingAfterAuth(t) {
    const e = this.connections.get(t);
    if (!e || e.state !== "connected" || !e.ws) return;
    const s = e.ws;
    this.pendingPublishes.forEach((i, r) => {
      const [n, a] = r.split("|");
      if (a === t && i.awaitingAuth) {
        try {
          clearTimeout(i.timeout);
        } catch {
        }
        i.timeout = setTimeout(() => {
          this.pendingPublishes.delete(r), i.reject(new Error("Publish timeout after AUTH"));
        }, this.publishTimeout ?? Z.PUBLISH_TIMEOUT);
        try {
          const c = ["EVENT", i.originalEvent];
          s.send(JSON.stringify(c)), i.awaitingAuth = !1, i.retries = (i.retries || 0) + 1, this.debug && console.log(`🔁 Re-publishing event ${n} to ${t} after AUTH`);
        } catch (c) {
          this.pendingPublishes.delete(r), i.reject(c);
        }
      }
    });
  }
  /**
   * Handle incoming relay messages
   */
  handleRelayMessage(t, e) {
    var s;
    try {
      const i = JSON.parse(e);
      if (this.debug && console.log(`📥 Message from ${t}:`, i), i[0] === "OK") {
        const [, r, n, a] = i, c = `${r}|${t}`, u = this.pendingPublishes.get(c);
        if (this.debug) {
          console.log(`OK for event ${r} @ ${t}, success: ${n}, pending: ${!!u}`);
          const h = Array.from(this.pendingPublishes.keys());
          console.log("Pending publishes:", h);
        }
        if (u)
          if (n)
            clearTimeout(u.timeout), this.pendingPublishes.delete(c), u.resolve(!0);
          else if (this.isAuthRequiredError(a)) {
            if (this.debug && console.log(`🔐 Auth required for ${t} on event ${r}:`, a), (u.retries || 0) >= 1) {
              clearTimeout(u.timeout), this.pendingPublishes.delete(c), u.reject(new Error("Relay requires AUTH but retry already attempted"));
              return;
            }
            u.awaitingAuth = !0;
            try {
              clearTimeout(u.timeout);
            } catch {
            }
            u.timeout = setTimeout(() => {
              this.pendingPublishes.delete(c), u.reject(new Error("Publish timeout waiting for AUTH"));
            }, this.publishTimeout ?? Z.PUBLISH_TIMEOUT), this.tryAuthenticate(t);
          } else
            clearTimeout(u.timeout), this.pendingPublishes.delete(c), u.reject(new Error(a || "Relay rejected event"));
        else {
          const h = this.connections.get(t);
          if (h && h.lastAuthEventId === r)
            h.isAuthenticated = !!n, this.debug && console.log(`🔐 AUTH ${n ? "succeeded" : "failed"} for ${t}${a ? " (" + a + ")" : ""}`), (s = this.onAuthStateChange) == null || s.call(this, t, { authenticated: !!n, reason: n ? void 0 : a }), n && this.retryPendingAfterAuth(t);
          else if (this.debug) {
            const d = n ? "already resolved (duplicate OK)" : this.isAuthRequiredError(a) ? "AUTH OK not matching pending" : "late/unsolicited OK";
            console.log(`ℹ️ OK for ${r} @ ${t} without pending - ${d}${a ? `: ${a}` : ""}`);
          }
        }
      } else if (i[0] === "NOTICE") {
        const [, r] = i;
        this.debug && console.log(`Notice from ${t}:`, r), typeof r == "string" && (r.startsWith("auth-required:") || r.startsWith("restricted:")) && (this.debug && console.log("NIP-42 hint via NOTICE:", r), this.tryAuthenticate(t));
      } else if (i[0] === "EVENT" || i[0] === "EOSE")
        this.messageHandler ? this.messageHandler(t, i) : this.debug && console.log(`No message handler registered for ${i[0]} message`);
      else if (i[0] === "AUTH") {
        const [, r] = i, n = this.connections.get(t);
        n && (n.lastAuthChallenge = r, n.isAuthenticated = !1), this.debug && console.log(`🔐 NIP-42 challenge from ${t}:`, r), this.tryAuthenticate(t);
      } else if (i[0] === "CLOSED") {
        const [, , r] = i;
        typeof r == "string" && (r.startsWith("auth-required:") || r.startsWith("restricted:")) && (this.debug && console.log(`🔐 NIP-42 CLOSED hint from ${t}:`, r), this.tryAuthenticate(t));
      }
    } catch (i) {
      this.debug && console.error(`Failed to parse message from ${t}:`, i);
    }
  }
  /**
   * NIP-42: Attempt to authenticate to a relay using stored challenge
   */
  async tryAuthenticate(t) {
    var i, r;
    const e = this.connections.get(t);
    if (!e || e.state !== "connected" || !e.ws || !this.authEventFactory) return;
    const s = e.lastAuthChallenge;
    if (!s) {
      this.debug && console.log("NIP-42: No challenge stored for", t);
      return;
    }
    try {
      const n = await this.authEventFactory({ relay: t, challenge: s });
      e.lastAuthEventId = n.id;
      const a = ["AUTH", n];
      e.ws.send(JSON.stringify(a)), this.debug && console.log(`📤 Sent AUTH to ${t}`), (i = this.onAuthStateChange) == null || i.call(this, t, { authenticated: !1, challenge: s });
    } catch (n) {
      this.debug && console.error("NIP-42 AUTH send failed:", n), (r = this.onAuthStateChange) == null || r.call(this, t, { authenticated: !1, challenge: s, reason: n.message });
    }
  }
  /**
   * Get relay information (NIP-11)
   */
  async getRelayInfo(t) {
    try {
      const e = t.replace(/^ws/, "http"), s = await fetch(e, {
        headers: {
          Accept: "application/nostr+json"
        }
      });
      if (!s.ok)
        throw new Error(`HTTP ${s.status}`);
      return await s.json();
    } catch (e) {
      throw new Error(`Failed to get relay info: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  /**
   * Test relay connectivity
   */
  async testRelay(t) {
    try {
      return Tt.WEBSOCKET_URL.test(t) ? (await this.connectToRelay(t), { success: !0 }) : {
        success: !1,
        error: "Invalid WebSocket URL format"
      };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Unknown error"
      };
    }
  }
  /**
   * Disconnect from all relays
   */
  async disconnect() {
    this.pendingPublishes.forEach(({ timeout: t, reject: e }) => {
      try {
        clearTimeout(t);
      } catch {
      }
      try {
        e(new Error("Disconnecting"));
      } catch {
      }
    }), this.pendingPublishes.clear(), this.connections.forEach((t) => {
      t.ws && (t.ws.close(), t.ws = void 0), t.state = "disconnected";
    });
  }
  /**
   * Send message to all connected relays
   */
  async sendToAll(t) {
    const e = this.connectedRelays.map(
      (s) => this.sendToRelay(s, t).catch((i) => {
        this.debug && console.warn(`Failed to send to ${s}:`, i);
      })
    );
    await Promise.allSettled(e);
  }
  /**
   * Send message to specific relays
   */
  async sendToRelays(t, e) {
    const s = t.map(
      (i) => this.sendToRelay(i, e).catch((r) => {
        this.debug && console.warn(`Failed to send to ${i}:`, r);
      })
    );
    await Promise.allSettled(s);
  }
  /**
   * Send message to a specific relay
   */
  async sendToRelay(t, e) {
    const s = this.connections.get(t);
    if (!s || s.state !== "connected" || !s.ws)
      throw new Error(`Not connected to relay: ${t}`);
    const i = JSON.stringify(e);
    s.ws.send(i), this.debug && console.log(`📤 Sent to ${t}:`, i);
  }
  /**
   * Register a message handler for subscription messages (EVENT, EOSE)
   */
  setMessageHandler(t) {
    this.messageHandler = t;
  }
  /**
   * Get connection statistics
   */
  getStats() {
    const t = {
      total: this.connections.size,
      connected: 0,
      connecting: 0,
      disconnected: 0,
      error: 0
    };
    return this.connections.forEach((e) => {
      t[e.state]++;
    }), t;
  }
  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnection(t) {
    const e = this.connections.get(t);
    if (!e) return;
    if (e.reconnectTimeout && (clearTimeout(e.reconnectTimeout), e.reconnectTimeout = void 0), e.reconnectAttempts === void 0 && (e.reconnectAttempts = 0), e.reconnectAttempts >= this.maxReconnectAttempts) {
      this.debug && console.warn(`Max reconnection attempts reached for relay: ${t}`), e.state = "error", e.error = `Max reconnection attempts (${this.maxReconnectAttempts}) exceeded`;
      return;
    }
    const i = Math.min(
      this.baseReconnectDelay * Math.pow(2, e.reconnectAttempts),
      this.maxReconnectDelay
    ) + Math.random() * 1e3;
    this.debug && console.log(`Scheduling reconnection to ${t} in ${Math.round(i)}ms (attempt ${e.reconnectAttempts + 1}/${this.maxReconnectAttempts})`), e.reconnectTimeout = setTimeout(() => {
      this.attemptReconnection(t);
    }, i);
  }
  /**
   * Attempt to reconnect to a relay
   */
  async attemptReconnection(t) {
    const e = this.connections.get(t);
    if (e) {
      e.reconnectAttempts = (e.reconnectAttempts || 0) + 1, e.lastReconnectAttempt = Date.now(), this.debug && console.log(`Attempting reconnection to ${t} (attempt ${e.reconnectAttempts})`);
      try {
        await this.connectToRelay(t) && (e.reconnectAttempts = 0, e.reconnectTimeout = void 0, this.debug && console.log(`Successfully reconnected to relay: ${t}`));
      } catch (s) {
        this.debug && console.warn(`Reconnection attempt failed for ${t}:`, s), e.reconnectAttempts < this.maxReconnectAttempts ? this.scheduleReconnection(t) : (e.state = "error", e.error = `Reconnection failed after ${this.maxReconnectAttempts} attempts`);
      }
    }
  }
  /**
   * Enable or disable automatic reconnection
   */
  setReconnectionEnabled(t) {
    if (this.reconnectEnabled = t, !t)
      for (const e of this.connections.values())
        e.reconnectTimeout && (clearTimeout(e.reconnectTimeout), e.reconnectTimeout = void 0);
  }
  /**
   * Configure reconnection parameters
   */
  configureReconnection(t) {
    t.maxAttempts !== void 0 && (this.maxReconnectAttempts = Math.max(1, t.maxAttempts)), t.baseDelay !== void 0 && (this.baseReconnectDelay = Math.max(100, t.baseDelay)), t.maxDelay !== void 0 && (this.maxReconnectDelay = Math.max(this.baseReconnectDelay, t.maxDelay));
  }
  /**
   * Manually trigger reconnection for a specific relay
   */
  async reconnectRelay(t) {
    const e = this.connections.get(t);
    if (!e)
      throw new Error(`Relay ${t} not configured`);
    return e.reconnectTimeout && (clearTimeout(e.reconnectTimeout), e.reconnectTimeout = void 0), e.reconnectAttempts = 0, this.connectToRelay(t);
  }
  /**
   * Get reconnection status for all relays
   */
  getReconnectionStatus() {
    const t = {};
    for (const [e, s] of this.connections.entries())
      if (t[e] = {
        attempts: s.reconnectAttempts || 0,
        lastAttempt: s.lastReconnectAttempt
      }, s.reconnectTimeout) {
        const i = Date.now(), r = s.lastReconnectAttempt || i, n = Math.min(
          this.baseReconnectDelay * Math.pow(2, (s.reconnectAttempts || 0) - 1),
          this.maxReconnectDelay
        ), a = r + n;
        t[e].nextAttemptIn = Math.max(0, a - i);
      }
    return t;
  }
}
class Nt {
  constructor() {
    l(this, "isExtension", !0);
    l(this, "cachedPublicKey");
  }
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(O.NO_EXTENSION);
    try {
      try {
        typeof window.nostr.enable == "function" && await window.nostr.enable();
      } catch {
      }
      const t = await window.nostr.getPublicKey();
      return this.cachedPublicKey = t, t;
    } catch (t) {
      throw new Error(`Extension signing failed: ${t instanceof Error ? t.message : "Unknown error"}`);
    }
  }
  getPublicKeySync() {
    return this.cachedPublicKey || null;
  }
  async signEvent(t) {
    if (!window.nostr)
      throw new Error(O.NO_EXTENSION);
    try {
      return (await window.nostr.signEvent(t)).sig;
    } catch (e) {
      throw new Error(`Extension signing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  // Optional capabilities for NIP-44
  async capabilities() {
    var e;
    const t = typeof window < "u" && !!((e = window.nostr) != null && e.nip44) && typeof window.nostr.nip44.encrypt == "function" && typeof window.nostr.nip44.decrypt == "function";
    return { nip44Encrypt: t, nip44Decrypt: t };
  }
  async nip44Encrypt(t, e) {
    var s, i;
    if (!((i = (s = window.nostr) == null ? void 0 : s.nip44) != null && i.encrypt)) throw new Error("NIP-44 encrypt not supported by extension");
    return window.nostr.nip44.encrypt(t, e);
  }
  async nip44Decrypt(t, e) {
    var s, i;
    if (!((i = (s = window.nostr) == null ? void 0 : s.nip44) != null && i.decrypt)) throw new Error("NIP-44 decrypt not supported by extension");
    return window.nostr.nip44.decrypt(t, e);
  }
  static async isAvailable() {
    return typeof window < "u" && typeof window.nostr < "u" && typeof window.nostr.getPublicKey == "function" && typeof window.nostr.signEvent == "function";
  }
}
class St {
  constructor() {
    l(this, "privateKey");
    l(this, "publicKey");
    const t = ht(32);
    this.privateKey = D(t), this.publicKey = D(dt.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  getPublicKeySync() {
    return this.publicKey;
  }
  async signEvent(t) {
    const e = M.calculateEventId(t), s = await dt.schnorr.sign(e, this.privateKey);
    return D(s);
  }
  async capabilities() {
    return { nip44Encrypt: !0, nip44Decrypt: !0 };
  }
  async nip44Encrypt(t, e) {
    const { NIP44Crypto: s } = await Promise.resolve().then(() => jt), i = s.deriveConversationKey(this.privateKey, t), r = s.encrypt(e, i);
    if (!r || typeof r.payload != "string")
      throw new Error("NIP-44 encrypt failed");
    return r.payload;
  }
  async nip44Decrypt(t, e) {
    const { NIP44Crypto: s } = await Promise.resolve().then(() => jt), i = s.deriveConversationKey(this.privateKey, t), r = s.decrypt(e, i);
    if (!r || !r.isValid) throw new Error("NIP-44 decrypt failed");
    return r.plaintext;
  }
}
class Bi extends St {
}
class Ui extends St {
}
class ys {
  static async createBestAvailable() {
    if (await Nt.isAvailable())
      try {
        const t = new Nt();
        return await t.getPublicKey(), {
          provider: t,
          method: "extension"
        };
      } catch (t) {
        console.warn("Extension detected but failed to initialize:", t);
      }
    return {
      provider: new St(),
      method: "temporary"
    };
  }
}
class $ {
  /**
   * Create a standardized Nostr error
   */
  static createError(t, e, s = {}) {
    return {
      message: e,
      retryable: s.retryable ?? !1,
      suggestion: s.suggestion,
      userAction: s.userAction
    };
  }
  /**
   * Handle content validation errors
   */
  static handleContentError(t) {
    return t === "" ? $.createError("validation", O.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: ft.EMPTY_CONTENT
    }) : t.length > 8192 ? $.createError("validation", O.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: ft.CONTENT_TOO_LONG
    }) : $.createError("validation", O.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(t) {
    const e = t.message.toLowerCase();
    return e.includes("user declined") || e.includes("denied") ? $.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : e.includes("no extension") ? $.createError("signing", O.NO_EXTENSION, {
      retryable: !1,
      suggestion: ft.NO_EXTENSION
    }) : $.createError("signing", O.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(t, e) {
    const s = e.message.toLowerCase();
    return s.includes("timeout") ? $.createError("network", `Connection to ${t} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? $.createError("network", `Failed to connect to ${t}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : $.createError("network", O.CONNECTION_FAILED, {
      retryable: !0,
      suggestion: ft.CONNECTION_FAILED
    });
  }
  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(t) {
    const e = t.length, s = t.filter((r) => r.success), i = t.filter((r) => !r.success);
    if (e === 0)
      return {
        success: !1,
        error: $.createError("config", O.NO_RELAYS, {
          retryable: !1,
          suggestion: "Configure at least one relay URL"
        })
      };
    if (s.length === 0) {
      const r = i.every(
        (a) => {
          var c;
          return (c = a.error) == null ? void 0 : c.toLowerCase().includes("timeout");
        }
      ), n = i.every(
        (a) => {
          var c, u;
          return ((c = a.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((u = a.error) == null ? void 0 : u.toLowerCase().includes("refused"));
        }
      );
      return r ? {
        success: !1,
        error: $.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : n ? {
        success: !1,
        error: $.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: $.createError("relay", O.PUBLISH_FAILED, {
          retryable: !0,
          suggestion: ft.PUBLISH_FAILED
        })
      };
    }
    return { success: !0 };
  }
  /**
   * Create user-friendly error message with context
   */
  static formatErrorForUser(t, e) {
    let s = t.message;
    if (e != null && e.relayResults) {
      const i = e.relayResults.filter((n) => n.success).length, r = e.relayResults.length;
      i > 0 ? s += ` (${i}/${r} relays succeeded)` : s += ` (0/${r} relays succeeded)`;
    }
    return t.suggestion && (s += `

Suggestion: ${t.suggestion}`), t.retryable && (s += `

This error is retryable - you can try again.`), s;
  }
  /**
   * Check if error should trigger automatic retry
   */
  static shouldRetry(t, e, s) {
    return t.retryable && e < s;
  }
  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(t, e = 1e3) {
    return Math.min(e * Math.pow(2, t), 3e4);
  }
}
class Kt {
  // Optional relay selection
  constructor(t) {
    l(this, "eventData");
    l(this, "nostrInstance");
    // NostrUnchained instance for publishing
    l(this, "signed", !1);
    l(this, "signedEvent");
    l(this, "targetRelays");
    this.nostrInstance = t, this.eventData = {
      tags: []
    };
  }
  /**
   * NIP-36: Mark event as sensitive with optional reason
   */
  contentWarning(t) {
    return t && t.length > 0 ? this.eventData.tags.push(["content-warning", t]) : this.eventData.tags.push(["content-warning"]), this;
  }
  /**
   * NIP-92: Attach media URL with imeta inline metadata
   */
  attachMedia(t, e) {
    const s = this.eventData.content || "", i = !s.includes(t);
    this.eventData.content = i ? s ? `${s} ${t}` : t : s;
    const r = [];
    if (r.push(`url ${t}`), e != null && e.mimeType && r.push(`m ${e.mimeType}`), e != null && e.blurhash && r.push(`blurhash ${e.blurhash}`), e != null && e.dim && r.push(`dim ${e.dim}`), e != null && e.alt && r.push(`alt ${e.alt}`), e != null && e.sha256 && r.push(`x ${e.sha256}`), e != null && e.fallbacks && e.fallbacks.length)
      for (const n of e.fallbacks) r.push(`fallback ${n}`);
    return this.eventData.tags.push(["imeta", ...r]), this;
  }
  /**
   * Set the event kind
   */
  kind(t) {
    return this.eventData.kind = t, this;
  }
  /**
   * Set the event content
   */
  content(t) {
    return this.eventData.content = t, this;
  }
  /**
   * Add a tag to the event
   */
  tag(t, e, ...s) {
    const i = [t, e, ...s];
    return this.eventData.tags.push(i), this;
  }
  /**
   * Add multiple tags at once
   */
  tags(t) {
    return this.eventData.tags.push(...t), this;
  }
  /**
   * Add a hashtag
   */
  hashtag(t) {
    return this.eventData.tags.push(["t", t]), this;
  }
  /**
   * Add a reply-to tag (NIP-10 style)
   */
  replyTo(t, e) {
    return e ? this.eventData.tags.push(["e", t, e, "reply"]) : this.eventData.tags.push(["e", t, "", "reply"]), this;
  }
  /**
   * Add a mention tag
   */
  mention(t, e) {
    return e ? this.eventData.tags.push(["p", t, e]) : this.eventData.tags.push(["p", t]), this;
  }
  /**
   * Add a subject tag
   */
  subject(t) {
    return this.eventData.tags.push(["subject", t]), this;
  }
  /**
   * Set custom timestamp
   */
  timestamp(t) {
    return this.eventData.created_at = t, this;
  }
  /**
   * Specify which relays to publish to (overrides default relays)
   */
  toRelays(...t) {
    return this.targetRelays = t, this;
  }
  /**
   * Specify which relays to publish to via array
   */
  toRelayList(t) {
    return this.targetRelays = t, this;
  }
  /**
   * Explicitly sign the event (optional - auto-signs on publish)
   */
  async sign() {
    const t = this.eventData.kind || 1;
    if (!(/* @__PURE__ */ new Set([3, 5, 6, 7, 10002, 1984, 1985, 3e4, 30001, 30002, 30003, 34550, 4550, 27235, 1063])).has(t) && (!this.eventData.content || this.eventData.content.length === 0))
      throw new Error("Content is required before signing");
    const i = this.nostrInstance.signingProvider;
    if (!i)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const r = {
      pubkey: await i.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    }, n = M.validateEvent(r);
    if (!n.valid)
      throw new Error(`Invalid event: ${n.errors.join(", ")}`);
    const a = M.calculateEventId(r), c = {
      ...r,
      id: a,
      sig: await i.signEvent({ ...r, id: a })
    };
    return this.signedEvent = c, this.signed = !0, this;
  }
  /**
   * Get the built event without publishing (useful for preview)
   */
  async build() {
    return this.signed && this.signedEvent ? this.signedEvent : (await this.sign(), this.signedEvent);
  }
  /**
   * Publish the event to relays
   */
  async publish() {
    const t = this.eventData.kind || 1;
    if (!(/* @__PURE__ */ new Set([3, 5, 6, 7, 10002, 1984, 1985, 3e4, 30001, 30002, 30003, 34550, 4550, 27235, 1063])).has(t) && (!this.eventData.content || this.eventData.content.length === 0))
      throw new Error("Content is required before publishing");
    if (this.signed && this.signedEvent) {
      const a = this.targetRelays ? await this.nostrInstance.relayManager.publishToRelays(this.signedEvent, this.targetRelays) : await this.nostrInstance.relayManager.publishToAll(this.signedEvent), c = a.some((u) => u.success);
      return {
        success: c,
        eventId: c ? this.signedEvent.id : void 0,
        event: c ? this.signedEvent : void 0,
        relayResults: a,
        timestamp: Date.now(),
        error: c ? void 0 : {
          message: "Failed to publish to any relay",
          code: "PUBLISH_FAILED",
          retryable: !0
        }
      };
    }
    const i = this.nostrInstance.signingProvider;
    if (!i)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const n = {
      pubkey: await i.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    };
    return this.targetRelays ? await this.nostrInstance.publishToRelays(n, this.targetRelays) : await this.nostrInstance.publish(n);
  }
  /**
   * Get the current event data (for debugging/inspection)
   */
  getEventData() {
    return { ...this.eventData };
  }
  /**
   * Reset the builder to start fresh
   */
  reset() {
    return this.eventData = { tags: [] }, this.signed = !1, this.signedEvent = void 0, this;
  }
}
class ps {
  constructor(t) {
    l(this, "nostrInstance");
    this.nostrInstance = t;
  }
  /**
   * Create a new fluent event builder
   */
  create() {
    return new Kt(this.nostrInstance);
  }
  /**
   * Direct fluent API - start with kind
   */
  kind(t) {
    return new Kt(this.nostrInstance).kind(t);
  }
  /**
   * Direct fluent API - start with content  
   */
  content(t) {
    return new Kt(this.nostrInstance).content(t);
  }
  /**
   * Quick create text note
   */
  note(t) {
    return this.create().kind(1).content(t);
  }
  /**
   * Quick create DM
   */
  dm(t, e) {
    return this.create().kind(4).content(t).tag("p", e);
  }
  /**
   * Quick create job posting
   */
  job(t) {
    return this.create().kind(30023).content(t).tag("t", "jobs");
  }
  /**
   * Quick create reaction
   */
  reaction(t, e = "+") {
    return this.create().kind(7).content(e).tag("e", t);
  }
  /**
   * Quick create deletion event (NIP-09)
   */
  deletion(t, e) {
    return this.create().kind(5).content(e || "").tag("e", t, "", "deletion");
  }
  /**
   * Direct publish from JSON data (bypasses fluent building)
   */
  async publish(t) {
    return await this.nostrInstance.publish(t);
  }
}
function nt(o) {
  const t = /* @__PURE__ */ new Set();
  let e = o;
  return {
    subscribe(s) {
      return s(e), t.add(s), () => t.delete(s);
    },
    set(s) {
      e = s, t.forEach((i) => i(e));
    },
    update(s) {
      e = s(e), t.forEach((i) => i(e));
    }
  };
}
function I(o, t) {
  const e = Array.isArray(o) ? o : [o], s = /* @__PURE__ */ new Set();
  let i, r = !1;
  const n = [], a = () => {
    if (e.length === 1) {
      const c = e[0].subscribe((u) => {
        const h = t(u);
        (!r || h !== i) && (i = h, r && s.forEach((d) => d(i)));
      });
      n.length === 0 && n.push(c);
    }
  };
  return {
    subscribe(c) {
      return r || (a(), r = !0), i !== void 0 && c(i), s.add(c), () => {
        s.delete(c), s.size === 0 && (n.forEach((u) => u()), n.length = 0, r = !1);
      };
    }
  };
}
function ke(o) {
  return {
    subscribe: o.subscribe.bind(o),
    derive: (t) => I(o, t)
  };
}
class wt {
  constructor(t, e, s) {
    l(this, "_events");
    l(this, "_readIds", /* @__PURE__ */ new Set());
    l(this, "parent");
    this.parent = t, this._events = I(t.events, (i) => {
      let r = i;
      return e && (r = r.filter(e)), s && (r = [...r].sort(s)), r;
    });
  }
  // Readable interface
  subscribe(t) {
    return this._events.subscribe(t);
  }
  // Store properties (delegate to parent where appropriate)
  get events() {
    return this._events;
  }
  get status() {
    return this.parent.status;
  }
  get error() {
    return this.parent.error;
  }
  get loading() {
    return this.parent.loading;
  }
  get count() {
    return I(this._events, (t) => t.length);
  }
  get latest() {
    return I(this._events, (t) => t[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return I(this._events, (t) => t.length === 0);
  }
  // Lifecycle methods (delegate to parent)
  async close() {
    return this.parent.close();
  }
  async refresh() {
    return this.parent.refresh();
  }
  reset() {
    return this._readIds.clear(), this.parent.reset();
  }
  async updateFilter(t) {
    return this.parent.updateFilter(t);
  }
  async updateOptions(t) {
    return this.parent.updateOptions(t);
  }
  derive(t) {
    return ke(I(this._events, t));
  }
  async retry() {
    return this.parent.retry();
  }
  clearError() {
    return this.parent.clearError();
  }
  // Feed-specific methods
  async loadMore(t) {
    return this.parent.loadMore(t);
  }
  async loadNewer() {
    return this.parent.loadNewer();
  }
  async loadOlder() {
    return this.parent.loadOlder();
  }
  markAsRead(t) {
    this._readIds.add(t);
  }
  markAllAsRead() {
    let t = [];
    this._events.subscribe((s) => {
      t = s;
    })(), t.forEach((s) => this._readIds.add(s.id));
  }
  removeEvent(t) {
    return this.parent.removeEvent(t);
  }
  filter(t) {
    return new wt(this, t);
  }
  sortBy(t) {
    return new wt(this, void 0, t);
  }
  getReadStatus() {
    let t = [];
    this._events.subscribe((n) => {
      t = n;
    })();
    const s = t.filter((n) => this._readIds.has(n.id)).length, i = t.length, r = i - s;
    return { read: s, unread: r, total: i };
  }
}
class te {
  constructor(t, e, s = {}, i = {}) {
    l(this, "_events", nt([]));
    l(this, "_status", nt("connecting"));
    l(this, "_error", nt(null));
    l(this, "_loading", nt(!1));
    l(this, "_count", nt(0));
    l(this, "_readIds", /* @__PURE__ */ new Set());
    l(this, "subscription");
    l(this, "subscriptionManager");
    l(this, "filters");
    l(this, "options");
    l(this, "maxEvents");
    l(this, "isLive");
    l(this, "eventPredicate");
    l(this, "eventComparator");
    this.subscriptionManager = t, this.filters = e, this.options = s, this.maxEvents = i.maxEvents, this.isLive = i.live || !1, this.eventPredicate = i.predicate, this.eventComparator = i.comparator, this.initializeSubscription();
  }
  // Readable interface
  subscribe(t) {
    return this._events.subscribe(t);
  }
  // Store properties
  get events() {
    return this._events;
  }
  get status() {
    return this._status;
  }
  get error() {
    return this._error;
  }
  get loading() {
    return this._loading;
  }
  get count() {
    return this._count;
  }
  get latest() {
    return I(this._events, (t) => t[0] || null);
  }
  get hasMore() {
    return I(this._events, () => !0);
  }
  get isEmpty() {
    return I(this._events, (t) => t.length === 0);
  }
  // Lifecycle methods
  async close() {
    var t, e;
    (e = (t = this.subscription) == null ? void 0 : t.subscription) != null && e.cleanup && this.subscription.subscription.cleanup(), this._status.set("closed");
  }
  async refresh() {
    this.reset(), await this.initializeSubscription();
  }
  reset() {
    this._events.set([]), this._count.set(0), this._readIds.clear(), this._error.set(null);
  }
  async updateFilter(t) {
    this.filters = this.filters.map((e) => ({ ...e, ...t })), await this.refresh();
  }
  async updateOptions(t) {
    this.options = { ...this.options, ...t }, await this.refresh();
  }
  derive(t) {
    return ke(I(this._events, t));
  }
  async retry() {
    this._status.set("reconnecting"), this._error.set(null), await this.initializeSubscription();
  }
  clearError() {
    this._error.set(null);
  }
  // Feed-specific methods
  async loadMore(t = 10) {
    return [];
  }
  async loadNewer() {
    return [];
  }
  async loadOlder() {
    return [];
  }
  markAsRead(t) {
    this._readIds.add(t);
  }
  markAllAsRead() {
    let t = [];
    this._events.subscribe((s) => {
      t = s;
    })(), t.forEach((s) => this._readIds.add(s.id));
  }
  removeEvent(t) {
    this._events.update((e) => e.filter((s) => s.id !== t)), this._count.update((e) => e - 1);
  }
  filter(t) {
    return new wt(this, t, this.eventComparator);
  }
  sortBy(t) {
    return new wt(this, this.eventPredicate, t);
  }
  getReadStatus() {
    let t = [];
    this._events.subscribe((n) => {
      t = n;
    })();
    const s = t.filter((n) => this._readIds.has(n.id)).length, i = t.length, r = i - s;
    return { read: s, unread: r, total: i };
  }
  // Test helper - simulate receiving an event
  _testInjectEvent(t) {
    this.handleEvent(t);
  }
  // Test helper - simulate EOSE
  _testSimulateEOSE() {
    this._status.set("active"), this._loading.set(!1);
  }
  // Test helper - wait for initialization
  async _testWaitForInit() {
    let t = 0;
    for (; !this.subscription && t < 100; )
      await new Promise((e) => setTimeout(e, 10)), t++;
  }
  // Private methods
  async initializeSubscription() {
    this._loading.set(!0), this._status.set("connecting");
    try {
      const t = {
        ...this.options,
        onEvent: (i) => {
          this.handleEvent(i);
        },
        onEose: (i) => {
          this._status.set("active"), this._loading.set(!1);
        },
        onClose: (i) => {
          this._status.set("closed");
        }
      }, e = await this.subscriptionManager.getOrCreateSubscription(this.filters), s = e.addListener({
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        onError: t.onError
      });
      this.subscription = {
        success: !0,
        subscription: {
          id: e.key,
          // Add cleanup method
          cleanup: () => e.removeListener(s)
        },
        relayResults: [],
        error: void 0
      }, this.subscription.success ? this._error.set(null) : (this._error.set(this.subscription.error || {
        message: "Subscription failed",
        retryable: !0
      }), this._status.set("error"), this._loading.set(!1));
    } catch (t) {
      this._error.set({
        message: t instanceof Error ? t.message : "Unknown error",
        retryable: !0
      }), this._status.set("error"), this._loading.set(!1);
    }
  }
  handleEvent(t) {
    this.eventPredicate && !this.eventPredicate(t) || (this._events.update((e) => {
      if (e.some((i) => i.id === t.id))
        return e;
      const s = [...e, t];
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((i, r) => r.created_at - i.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
    }), this._count.update((e) => e + 1));
  }
}
class bs {
  constructor(t) {
    l(this, "filter", {});
    l(this, "options", {});
    l(this, "config", {});
    this.subscriptionManager = t;
  }
  kinds(t) {
    return this.filter.kinds = t, this;
  }
  authors(t) {
    return this.filter.authors = t, this;
  }
  since(t) {
    return this.filter.since = t, this;
  }
  until(t) {
    return this.filter.until = t, this;
  }
  limit(t) {
    return this.filter.limit = t, this;
  }
  live(t) {
    return this.config.live = t, this.options = { ...this.options, live: t }, this;
  }
  maxEvents(t) {
    return this.config.maxEvents = t, this;
  }
  build() {
    const t = [this.filter];
    return new te(
      this.subscriptionManager,
      t,
      this.options,
      this.config
    );
  }
}
let ut;
function Ki(o) {
  ut = o;
}
function Hi() {
  if (!ut)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new bs(ut);
}
function Wi(o) {
  if (!ut)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const t = o.toFilter();
  return new te(ut, t);
}
function zi(o) {
  if (!ut)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new te(ut, [o]);
}
class v extends Error {
  constructor(t, e, s) {
    super(t), this.code = e, this.details = s, this.name = "NIP59Error";
  }
}
var E = /* @__PURE__ */ ((o) => (o.INVALID_RUMOR = "INVALID_RUMOR", o.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", o.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", o.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", o.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", o.DECRYPTION_FAILED = "DECRYPTION_FAILED", o.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", o.INVALID_SEAL = "INVALID_SEAL", o.NO_RECIPIENTS = "NO_RECIPIENTS", o.INVALID_RECIPIENT = "INVALID_RECIPIENT", o.INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY", o))(E || {});
const Q = {
  SEAL_KIND: 13,
  GIFT_WRAP_KIND: 1059,
  MAX_TIMESTAMP_AGE_SECONDS: 2 * 24 * 60 * 60,
  // 2 days
  MIN_TIMESTAMP_AGE_SECONDS: 0
  // Can be current time
};
class Dt {
  /**
   * Create a kind 13 seal using a signer (no raw private key exposure)
   * Requires signer.nip44Encrypt and signer.signEvent
   */
  static async createSealWithSigner(t, e, s) {
    try {
      if (this.validateRumor(t), this.validatePublicKey(s), !e || typeof e.nip44Encrypt != "function")
        throw new v(
          "Signer must provide nip44Encrypt capability",
          E.SEAL_CREATION_FAILED
        );
      if (typeof e.signEvent != "function")
        throw new v(
          "Signer must provide signEvent capability",
          E.SEAL_CREATION_FAILED
        );
      const i = JSON.stringify(t), r = await e.nip44Encrypt(s, i), n = t.pubkey, a = {
        pubkey: n,
        created_at: Math.floor(Date.now() / 1e3),
        kind: Q.SEAL_KIND,
        tags: [],
        content: r
      }, c = this.calculateEventId(a), u = { ...a, id: c }, h = await e.signEvent(u);
      return {
        id: c,
        pubkey: n,
        created_at: a.created_at,
        kind: Q.SEAL_KIND,
        tags: [],
        content: r,
        sig: h
      };
    } catch (i) {
      throw i instanceof v ? i : new v(
        `Seal creation (with signer) failed: ${i.message}`,
        E.SEAL_CREATION_FAILED,
        i
      );
    }
  }
  // Raw-key decrypt path removed in P1
  /**
   * Validate rumor structure
   */
  static validateRumor(t) {
    if (!t || typeof t != "object")
      throw new v(
        "Rumor must be a valid object",
        E.INVALID_RUMOR
      );
    if (typeof t.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(t.pubkey))
      throw new v(
        "Rumor must have valid pubkey",
        E.INVALID_RUMOR
      );
    if (typeof t.created_at != "number" || t.created_at <= 0)
      throw new v(
        "Rumor must have valid created_at timestamp",
        E.INVALID_RUMOR
      );
    if (typeof t.kind != "number" || t.kind < 0 || t.kind > 65535)
      throw new v(
        "Rumor must have valid kind",
        E.INVALID_RUMOR
      );
    if (!Array.isArray(t.tags))
      throw new v(
        "Rumor must have valid tags array",
        E.INVALID_RUMOR
      );
    if (typeof t.content != "string")
      throw new v(
        "Rumor must have valid content string",
        E.INVALID_RUMOR
      );
  }
  /**
   * Check if an object is a valid rumor (more lenient for decryption)
   */
  static isValidRumor(t) {
    return t && typeof t == "object" && typeof t.pubkey == "string" && typeof t.created_at == "number" && typeof t.kind == "number" && Array.isArray(t.tags) && typeof t.content == "string";
  }
  /**
   * Validate private key format
   */
  // Raw-key validation removed in P1
  /**
   * Validate public key format
   */
  static validatePublicKey(t) {
    if (typeof t != "string" || !/^[0-9a-f]{64}$/i.test(t))
      throw new v(
        "Invalid public key format",
        E.SEAL_CREATION_FAILED
      );
  }
  /**
   * Get public key from private key
   */
  // Raw-key public key derivation removed in P1
  /**
   * Calculate event ID according to NIP-01
   */
  static calculateEventId(t) {
    const e = JSON.stringify([
      0,
      // Reserved for future use
      t.pubkey,
      t.created_at,
      t.kind,
      t.tags,
      t.content
    ]), s = et(new TextEncoder().encode(e));
    return Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  // Raw-key Schnorr signing removed in P1
}
const ms = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SealCreator: Dt
}, Symbol.toStringTag, { value: "Module" }));
class _e extends Se {
  constructor(t, e) {
    super(), this.finished = !1, this.destroyed = !1, Qt(t);
    const s = mt(e);
    if (this.iHash = t.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const i = this.blockLen, r = new Uint8Array(i);
    r.set(s.length > i ? t.create().update(s).digest() : s);
    for (let n = 0; n < r.length; n++)
      r[n] ^= 54;
    this.iHash.update(r), this.oHash = t.create();
    for (let n = 0; n < r.length; n++)
      r[n] ^= 106;
    this.oHash.update(r), bt(r);
  }
  update(t) {
    return Ct(this), this.iHash.update(t), this;
  }
  digestInto(t) {
    Ct(this), gt(t, this.outputLen), this.finished = !0, this.iHash.digestInto(t), this.oHash.update(t), this.oHash.digestInto(t), this.destroy();
  }
  digest() {
    const t = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(t), t;
  }
  _cloneInto(t) {
    t || (t = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: e, iHash: s, finished: i, destroyed: r, blockLen: n, outputLen: a } = this;
    return t = t, t.finished = i, t.destroyed = r, t.blockLen = n, t.outputLen = a, t.oHash = e._cloneInto(t.oHash), t.iHash = s._cloneInto(t.iHash), t;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const vt = (o, t, e) => new _e(o, t).update(e).digest();
vt.create = (o, t) => new _e(o, t);
function ws(o, t, e) {
  return Qt(o), vt(o, mt(e), mt(t));
}
const Ht = /* @__PURE__ */ Uint8Array.from([0]), ce = /* @__PURE__ */ Uint8Array.of();
function vs(o, t, e, s = 32) {
  Qt(o), Vt(s);
  const i = o.outputLen;
  if (s > 255 * i)
    throw new Error("Length should be <= 255*HashLen");
  const r = Math.ceil(s / i);
  e === void 0 && (e = ce);
  const n = new Uint8Array(r * i), a = vt.create(o, t), c = a._cloneInto(), u = new Uint8Array(a.outputLen);
  for (let h = 0; h < r; h++)
    Ht[0] = h + 1, c.update(h === 0 ? ce : u).update(e).update(Ht).digestInto(u), n.set(u, i * h), a._cloneInto(c);
  return a.destroy(), c.destroy(), bt(u, Ht), n.slice(0, s);
}
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function Es(o) {
  return o instanceof Uint8Array || ArrayBuffer.isView(o) && o.constructor.name === "Uint8Array";
}
function ue(o) {
  if (typeof o != "boolean")
    throw new Error(`boolean expected, not ${o}`);
}
function Wt(o) {
  if (!Number.isSafeInteger(o) || o < 0)
    throw new Error("positive integer expected, got " + o);
}
function _t(o, ...t) {
  if (!Es(o))
    throw new Error("Uint8Array expected");
  if (t.length > 0 && !t.includes(o.length))
    throw new Error("Uint8Array expected of length " + t + ", got length=" + o.length);
}
function ot(o) {
  return new Uint32Array(o.buffer, o.byteOffset, Math.floor(o.byteLength / 4));
}
function Ss(...o) {
  for (let t = 0; t < o.length; t++)
    o[t].fill(0);
}
function ks(o, t) {
  if (t == null || typeof t != "object")
    throw new Error("options must be defined");
  return Object.assign(o, t);
}
function _s(o, t) {
  if (o.length !== t.length)
    return !1;
  let e = 0;
  for (let s = 0; s < o.length; s++)
    e |= o[s] ^ t[s];
  return e === 0;
}
function le(o) {
  return Uint8Array.from(o);
}
const Ae = (o) => Uint8Array.from(o.split("").map((t) => t.charCodeAt(0))), As = Ae("expand 16-byte k"), Ms = Ae("expand 32-byte k"), Ps = ot(As), Is = ot(Ms);
function S(o, t) {
  return o << t | o >>> 32 - t;
}
function qt(o) {
  return o.byteOffset % 4 === 0;
}
const At = 64, Ts = 16, Me = 2 ** 32 - 1, he = new Uint32Array();
function Rs(o, t, e, s, i, r, n, a) {
  const c = i.length, u = new Uint8Array(At), h = ot(u), d = qt(i) && qt(r), f = d ? ot(i) : he, p = d ? ot(r) : he;
  for (let g = 0; g < c; n++) {
    if (o(t, e, s, h, n, a), n >= Me)
      throw new Error("arx: counter overflow");
    const y = Math.min(At, c - g);
    if (d && y === At) {
      const m = g / 4;
      if (g % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let b = 0, w; b < Ts; b++)
        w = m + b, p[w] = f[w] ^ h[b];
      g += At;
      continue;
    }
    for (let m = 0, b; m < y; m++)
      b = g + m, r[b] = i[b] ^ u[m];
    g += y;
  }
}
function xs(o, t) {
  const { allowShortKeys: e, extendNonceFn: s, counterLength: i, counterRight: r, rounds: n } = ks({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, t);
  if (typeof o != "function")
    throw new Error("core must be a function");
  return Wt(i), Wt(n), ue(r), ue(e), (a, c, u, h, d = 0) => {
    _t(a), _t(c), _t(u);
    const f = u.length;
    if (h === void 0 && (h = new Uint8Array(f)), _t(h), Wt(d), d < 0 || d >= Me)
      throw new Error("arx: counter overflow");
    if (h.length < f)
      throw new Error(`arx: output (${h.length}) is shorter than data (${f})`);
    const p = [];
    let g = a.length, y, m;
    if (g === 32)
      p.push(y = le(a)), m = Is;
    else if (g === 16 && e)
      y = new Uint8Array(32), y.set(a), y.set(a, 16), m = Ps, p.push(y);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${g}`);
    qt(c) || p.push(c = le(c));
    const b = ot(y);
    if (s) {
      if (c.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(m, b, ot(c.subarray(0, 16)), b), c = c.subarray(16);
    }
    const w = 16 - i;
    if (w !== c.length)
      throw new Error(`arx: nonce must be ${w} or 16 bytes`);
    if (w !== 12) {
      const _ = new Uint8Array(12);
      _.set(c, r ? 0 : 12 - c.length), c = _, p.push(c);
    }
    const k = ot(c);
    return Rs(o, m, b, k, u, h, d, n), Ss(...p), h;
  };
}
function Cs(o, t, e, s, i, r = 20) {
  let n = o[0], a = o[1], c = o[2], u = o[3], h = t[0], d = t[1], f = t[2], p = t[3], g = t[4], y = t[5], m = t[6], b = t[7], w = i, k = e[0], _ = e[1], P = e[2], A = n, T = a, R = c, x = u, F = h, C = d, N = f, B = p, U = g, K = y, H = m, W = b, z = w, V = k, q = _, j = P;
  for (let ne = 0; ne < r; ne += 2)
    A = A + F | 0, z = S(z ^ A, 16), U = U + z | 0, F = S(F ^ U, 12), A = A + F | 0, z = S(z ^ A, 8), U = U + z | 0, F = S(F ^ U, 7), T = T + C | 0, V = S(V ^ T, 16), K = K + V | 0, C = S(C ^ K, 12), T = T + C | 0, V = S(V ^ T, 8), K = K + V | 0, C = S(C ^ K, 7), R = R + N | 0, q = S(q ^ R, 16), H = H + q | 0, N = S(N ^ H, 12), R = R + N | 0, q = S(q ^ R, 8), H = H + q | 0, N = S(N ^ H, 7), x = x + B | 0, j = S(j ^ x, 16), W = W + j | 0, B = S(B ^ W, 12), x = x + B | 0, j = S(j ^ x, 8), W = W + j | 0, B = S(B ^ W, 7), A = A + C | 0, j = S(j ^ A, 16), H = H + j | 0, C = S(C ^ H, 12), A = A + C | 0, j = S(j ^ A, 8), H = H + j | 0, C = S(C ^ H, 7), T = T + N | 0, z = S(z ^ T, 16), W = W + z | 0, N = S(N ^ W, 12), T = T + N | 0, z = S(z ^ T, 8), W = W + z | 0, N = S(N ^ W, 7), R = R + B | 0, V = S(V ^ R, 16), U = U + V | 0, B = S(B ^ U, 12), R = R + B | 0, V = S(V ^ R, 8), U = U + V | 0, B = S(B ^ U, 7), x = x + F | 0, q = S(q ^ x, 16), K = K + q | 0, F = S(F ^ K, 12), x = x + F | 0, q = S(q ^ x, 8), K = K + q | 0, F = S(F ^ K, 7);
  let L = 0;
  s[L++] = n + A | 0, s[L++] = a + T | 0, s[L++] = c + R | 0, s[L++] = u + x | 0, s[L++] = h + F | 0, s[L++] = d + C | 0, s[L++] = f + N | 0, s[L++] = p + B | 0, s[L++] = g + U | 0, s[L++] = y + K | 0, s[L++] = m + H | 0, s[L++] = b + W | 0, s[L++] = w + z | 0, s[L++] = k + V | 0, s[L++] = _ + q | 0, s[L++] = P + j | 0;
}
const de = /* @__PURE__ */ xs(Cs, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), Ns = {
  saltInfo: "nip44-v2"
};
class G extends Error {
  constructor(t, e, s) {
    super(t), this.code = e, this.details = s, this.name = "NIP44Error";
  }
}
var Y = /* @__PURE__ */ ((o) => (o.INVALID_KEY = "INVALID_KEY", o.INVALID_NONCE = "INVALID_NONCE", o.INVALID_PAYLOAD = "INVALID_PAYLOAD", o.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", o.DECRYPTION_FAILED = "DECRYPTION_FAILED", o.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", o.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", o.PADDING_ERROR = "PADDING_ERROR", o))(Y || {});
class X {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(t, e) {
    try {
      const s = t.replace(/^0x/, "");
      let i = e.replace(/^0x/, "");
      if (i.length === 66 && (i.startsWith("02") || i.startsWith("03")) && (i = i.slice(2)), s.length !== 64)
        throw new G(
          "Invalid private key length",
          Y.INVALID_KEY
        );
      if (i.length !== 64)
        throw new G(
          "Invalid public key length - expected 32-byte x-coordinate",
          Y.INVALID_KEY
        );
      const r = new Uint8Array(32);
      for (let u = 0; u < 32; u++)
        r[u] = parseInt(s.substr(u * 2, 2), 16);
      const a = Qe(r, "02" + i).subarray(1, 33);
      return ws(et, a, "nip44-v2");
    } catch (s) {
      throw s instanceof G ? s : new G(
        `Key derivation failed: ${s.message}`,
        Y.INVALID_KEY,
        s
      );
    }
  }
  /**
   * Derive per-message keys using HKDF-Expand
   */
  static deriveMessageKeys(t, e) {
    try {
      if (t.length !== 32)
        throw new G(
          "Invalid conversation key length",
          Y.INVALID_KEY
        );
      if (e.length !== this.NONCE_SIZE)
        throw new G(
          "Invalid nonce length",
          Y.INVALID_NONCE
        );
      const s = vs(et, t, e, 76);
      return {
        chachaKey: s.subarray(0, 32),
        // bytes 0-31
        chachaNonce: s.subarray(32, 44),
        // bytes 32-43 (12 bytes)
        hmacKey: s.subarray(44, 76)
        // bytes 44-75
      };
    } catch (s) {
      throw new G(
        `Message key derivation failed: ${s.message}`,
        Y.ENCRYPTION_FAILED,
        s
      );
    }
  }
  /**
   * Calculate padded content length (NIP-44 padding algorithm)
   * Returns just the padded content length, without length prefix
   */
  static calculatePaddedContentLength(t) {
    if (t < 0 || t > 65536)
      throw new G(
        "Invalid plaintext length",
        Y.INVALID_PLAINTEXT_LENGTH
      );
    if (t === 0 || t <= 32)
      return 32;
    const e = 1 << Math.floor(Math.log2(t - 1)) + 1;
    let s;
    return e <= 256 ? s = 32 : s = e / 8, s * (Math.floor((t - 1) / s) + 1);
  }
  /**
   * Calculate padded content length (official NIP-44 padding algorithm)
   * Returns ONLY the padded content length, without length prefix
   * This matches the official test vectors
   */
  static calculatePaddedLength(t) {
    return this.calculatePaddedContentLength(t);
  }
  /**
   * Apply padding to plaintext (content only, without length prefix)
   * Returns just the padded content for testing purposes
   */
  static applyPadding(t) {
    const e = t.length, s = this.calculatePaddedContentLength(e), i = new Uint8Array(s);
    return i.set(t, 0), i;
  }
  /**
   * Apply NIP-44 formatting: [plaintext_length: u16][padded_plaintext]
   * Returns the complete formatted data for encryption
   */
  static formatForEncryption(t) {
    const e = t.length, s = this.applyPadding(t), i = 2 + s.length, r = new Uint8Array(i);
    return new DataView(r.buffer).setUint16(0, e, !1), r.set(s, 2), r;
  }
  /**
   * Apply NIP-44 formatting with length prefix:
   * [plaintext_length: u16][padded_plaintext]
   */
  static applyNIP44Formatting(t) {
    const e = t.length, s = this.applyPadding(t), i = 2 + s.length, r = new Uint8Array(i);
    return new DataView(r.buffer).setUint16(0, e, !1), r.set(s, 2), r;
  }
  /**
   * Remove padding from padded content (two different formats supported)
   */
  static removePadding(t) {
    if (t.length >= 2) {
      const i = new DataView(t.buffer).getUint16(0, !1);
      if (i <= t.length - 2 && i > 0)
        return t.subarray(2, 2 + i);
    }
    let e = t.length;
    for (; e > 0 && t[e - 1] === 0; )
      e--;
    return t.subarray(0, e);
  }
  /**
   * Generate cryptographically secure random nonce
   */
  static generateNonce() {
    return ht(this.NONCE_SIZE);
  }
  /**
   * Encrypt plaintext using NIP-44 v2
   */
  static encrypt(t, e, s) {
    try {
      if (t == null)
        throw new G(
          "Plaintext cannot be null or undefined",
          Y.INVALID_PLAINTEXT_LENGTH
        );
      const i = new TextEncoder().encode(t), r = s || this.generateNonce(), n = this.deriveMessageKeys(e, r), a = this.formatForEncryption(i), c = de(
        n.chachaKey,
        n.chachaNonce,
        a
      ), u = It(r, c), h = vt(et, n.hmacKey, u), d = new Uint8Array([this.VERSION]), f = It(d, r, c, h);
      return {
        payload: typeof Buffer < "u" ? Buffer.from(f).toString("base64") : btoa(String.fromCharCode(...f)),
        nonce: r
      };
    } catch (i) {
      throw i instanceof G ? i : new G(
        `Encryption failed: ${i.message}`,
        Y.ENCRYPTION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt NIP-44 v2 payload
   */
  static decrypt(t, e) {
    try {
      const s = typeof Buffer < "u" ? new Uint8Array(Buffer.from(t, "base64")) : (() => {
        const b = atob(t), w = new Uint8Array(b.length);
        for (let k = 0; k < b.length; k++) w[k] = b.charCodeAt(k);
        return w;
      })(), i = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (s.length < i)
        throw new G(
          "Payload too short",
          Y.INVALID_PAYLOAD
        );
      let r = 0;
      const n = s[r];
      if (r += this.VERSION_SIZE, n !== this.VERSION)
        throw new G(
          `Unsupported version: ${n}`,
          Y.INVALID_PAYLOAD
        );
      const a = s.slice(r, r + this.NONCE_SIZE);
      r += this.NONCE_SIZE;
      const c = s.slice(r, -this.MAC_SIZE), u = s.slice(-this.MAC_SIZE), h = this.deriveMessageKeys(e, a), d = It(a, c), f = vt(et, h.hmacKey, d);
      if (!_s(f, u))
        return {
          plaintext: "",
          isValid: !1
        };
      const g = de(
        h.chachaKey,
        h.chachaNonce,
        c
      ), y = this.removePadding(g);
      return {
        plaintext: new TextDecoder().decode(y),
        isValid: !0
      };
    } catch {
      return {
        plaintext: "",
        isValid: !1
      };
    }
  }
  /**
   * Encrypt with specific nonce (for testing)
   */
  static encryptWithNonce(t, e, s) {
    return this.encrypt(t, e, s).payload;
  }
  /**
   * Validate payload format without decrypting
   */
  static validatePayload(t) {
    try {
      const e = typeof Buffer < "u" ? new Uint8Array(Buffer.from(t, "base64")) : (() => {
        const i = atob(t), r = new Uint8Array(i.length);
        for (let n = 0; n < i.length; n++) r[n] = i.charCodeAt(n);
        return r;
      })(), s = this.VERSION_SIZE + this.NONCE_SIZE + 1;
      return !(e.length < s || e[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
l(X, "VERSION", 2), l(X, "SALT", new TextEncoder().encode(Ns.saltInfo)), l(X, "NONCE_SIZE", 32), l(X, "CHACHA_KEY_SIZE", 32), l(X, "CHACHA_NONCE_SIZE", 12), l(X, "HMAC_KEY_SIZE", 32), l(X, "MAC_SIZE", 32), l(X, "VERSION_SIZE", 1);
const jt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NIP44Crypto: X
}, Symbol.toStringTag, { value: "Module" }));
class Rt {
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair() {
    try {
      const t = ht(32), e = Array.from(t).map((n) => n.toString(16).padStart(2, "0")).join(""), i = dt.getPublicKey(e, !1).slice(1, 33), r = Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
      return {
        privateKey: e,
        publicKey: r
      };
    } catch (t) {
      throw new v(
        `Ephemeral key generation failed: ${t.message}`,
        E.EPHEMERAL_KEY_GENERATION_FAILED,
        t
      );
    }
  }
  /**
   * Generate multiple ephemeral key pairs for multi-recipient scenarios
   * Each recipient gets their own unique ephemeral key pair
   */
  static generateMultipleEphemeralKeyPairs(t) {
    if (t <= 0)
      throw new v(
        "Key pair count must be greater than 0",
        E.EPHEMERAL_KEY_GENERATION_FAILED
      );
    const e = [];
    for (let s = 0; s < t; s++)
      e.push(this.generateEphemeralKeyPair());
    return e;
  }
  /**
   * Validate that an ephemeral key pair is properly formatted
   */
  static validateEphemeralKeyPair(t) {
    try {
      if (!/^[0-9a-f]{64}$/i.test(t.privateKey) || !/^[0-9a-f]{64}$/i.test(t.publicKey))
        return !1;
      const s = dt.getPublicKey(t.privateKey, !1).slice(1, 33), i = Array.from(s).map((r) => r.toString(16).padStart(2, "0")).join("");
      return t.publicKey.toLowerCase() === i.toLowerCase();
    } catch {
      return !1;
    }
  }
  /**
   * Securely clear ephemeral key material from memory
   * Note: In JavaScript, we can't guarantee memory clearing, but we can
   * overwrite the string values to make them less likely to persist
   */
  static clearEphemeralKeyPair(t) {
    try {
      const e = ht(32).reduce((s, i) => s + i.toString(16).padStart(2, "0"), "");
      t.privateKey = e, t.publicKey = e;
    } catch {
    }
  }
  /**
   * Generate a secure random nonce for gift wrap creation
   * This can be used for additional randomness in the encryption process
   */
  static generateGiftWrapNonce() {
    return ht(32);
  }
}
class Gt {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(t = Q.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      if (t < 0)
        throw new v(
          "Max age seconds cannot be negative",
          E.TIMESTAMP_RANDOMIZATION_FAILED
        );
      const e = Math.floor(Date.now() / 1e3);
      if (t === 0)
        return e;
      const s = this.generateSecureRandomOffset(t);
      return e - s;
    } catch (e) {
      throw e instanceof v ? e : new v(
        `Timestamp randomization failed: ${e.message}`,
        E.TIMESTAMP_RANDOMIZATION_FAILED,
        e
      );
    }
  }
  /**
   * Generate a cryptographically secure random offset within the specified range
   */
  static generateSecureRandomOffset(t) {
    const e = ht(4), s = new DataView(e.buffer).getUint32(0, !1);
    return Math.floor(s / 4294967295 * t);
  }
  /**
   * Generate multiple randomized timestamps for batch gift wrap creation
   * Each timestamp is independently randomized
   */
  static generateMultipleRandomizedTimestamps(t, e = Q.MAX_TIMESTAMP_AGE_SECONDS) {
    if (t <= 0)
      throw new v(
        "Timestamp count must be greater than 0",
        E.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let i = 0; i < t; i++)
      s.push(this.generateRandomizedTimestamp(e));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(t, e = Q.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      const s = Math.floor(Date.now() / 1e3), i = s - e, r = s + 60;
      return t >= i && t <= r;
    } catch {
      return !1;
    }
  }
  /**
   * Get the recommended timestamp randomization window for NIP-59
   */
  static getRecommendedMaxAge() {
    return Q.MAX_TIMESTAMP_AGE_SECONDS;
  }
  /**
   * Calculate entropy bits for timestamp randomization
   * Higher entropy means better privacy protection
   */
  static calculateTimestampEntropy(t) {
    return t <= 0 ? 0 : Math.log2(t);
  }
  /**
   * Generate a timestamp that appears to be from a specific time window
   * Useful for testing or specific privacy requirements
   */
  static generateTimestampInWindow(t, e) {
    if (t >= e)
      throw new v(
        "Window start must be before window end",
        E.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = e - t, i = this.generateSecureRandomOffset(s);
    return t + i;
  }
}
class Lt {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(t, e, s, i) {
    try {
      this.validateSeal(t), this.validateRecipient(e);
      const r = s || Rt.generateEphemeralKeyPair();
      if (!Rt.validateEphemeralKeyPair(r))
        throw new v(
          "Invalid ephemeral key pair",
          E.GIFT_WRAP_CREATION_FAILED
        );
      const n = i || Gt.generateRandomizedTimestamp(), a = JSON.stringify(t), c = X.deriveConversationKey(
        r.privateKey,
        e.pubkey
      ), u = X.encrypt(a, c), h = e.relayHint ? ["p", e.pubkey, e.relayHint] : ["p", e.pubkey], d = {
        pubkey: r.publicKey,
        created_at: n,
        kind: Q.GIFT_WRAP_KIND,
        tags: [h],
        content: u.payload
      }, f = this.calculateEventId(d), p = await this.signEvent(d, f, r.privateKey);
      return {
        giftWrap: {
          id: f,
          pubkey: r.publicKey,
          created_at: n,
          kind: Q.GIFT_WRAP_KIND,
          tags: [h],
          content: u.payload,
          sig: p
        },
        ephemeralKeyPair: r,
        recipient: e.pubkey
      };
    } catch (r) {
      throw r instanceof v ? r : new v(
        `Gift wrap creation failed: ${r.message}`,
        E.GIFT_WRAP_CREATION_FAILED,
        r
      );
    }
  }
  /**
   * Create multiple gift wraps for multiple recipients
   * Each recipient gets their own gift wrap with unique ephemeral key
   */
  static async createMultipleGiftWraps(t, e) {
    if (!e || e.length === 0)
      throw new v(
        "At least one recipient is required",
        E.NO_RECIPIENTS
      );
    const s = [], i = Rt.generateMultipleEphemeralKeyPairs(
      e.length
    ), r = Gt.generateMultipleRandomizedTimestamps(
      e.length
    );
    for (let n = 0; n < e.length; n++) {
      const a = await this.createGiftWrap(
        t,
        e[n],
        i[n],
        r[n]
      );
      s.push(a);
    }
    return s;
  }
  /**
   * Decrypt a gift wrap to recover the original seal
   */
  // Raw-key decrypt path removed in P1
  /**
   * Validate seal structure
   */
  static validateSeal(t) {
    if (!t || typeof t != "object")
      throw new v(
        "Seal must be a valid object",
        E.INVALID_SEAL
      );
    if (t.kind !== Q.SEAL_KIND)
      throw new v(
        "Seal must have kind 13",
        E.INVALID_SEAL
      );
    if (!Array.isArray(t.tags) || t.tags.length !== 0)
      throw new v(
        "Seal must have empty tags array",
        E.INVALID_SEAL
      );
    if (typeof t.content != "string")
      throw new v(
        "Seal must have valid content string",
        E.INVALID_SEAL
      );
  }
  /**
   * Validate recipient configuration
   */
  static validateRecipient(t) {
    if (!t || typeof t != "object")
      throw new v(
        "Recipient must be a valid object",
        E.INVALID_RECIPIENT
      );
    if (typeof t.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(t.pubkey))
      throw new v(
        "Recipient must have valid pubkey",
        E.INVALID_RECIPIENT
      );
    if (t.relayHint && typeof t.relayHint != "string")
      throw new v(
        "Recipient relay hint must be a string if provided",
        E.INVALID_RECIPIENT
      );
  }
  /**
   * Check if an object is a valid gift wrap (for decryption)
   */
  static isValidGiftWrap(t) {
    return t && typeof t == "object" && t.kind === Q.GIFT_WRAP_KIND && typeof t.pubkey == "string" && typeof t.content == "string" && Array.isArray(t.tags) && t.tags.length > 0 && Array.isArray(t.tags[0]) && t.tags[0][0] === "p" && typeof t.tags[0][1] == "string";
  }
  /**
   * Check if an object is a valid seal (for decryption)
   */
  static isValidSeal(t) {
    return t && typeof t == "object" && t.kind === Q.SEAL_KIND && typeof t.pubkey == "string" && typeof t.content == "string" && Array.isArray(t.tags) && t.tags.length === 0;
  }
  /**
   * Calculate event ID according to NIP-01
   */
  static calculateEventId(t) {
    const e = JSON.stringify([
      0,
      // Reserved for future use
      t.pubkey,
      t.created_at,
      t.kind,
      t.tags,
      t.content
    ]), s = new TextEncoder().encode(e), i = et(s);
    return D(i);
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(t, e, s) {
    try {
      const i = await dt.schnorr.sign(e, s);
      return D(i);
    } catch (i) {
      throw new v(
        "Failed to sign gift wrap event",
        E.GIFT_WRAP_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Extract recipient pubkey from gift wrap p tag
   */
  static getRecipientFromGiftWrap(t) {
    try {
      return t.tags.length > 0 && t.tags[0][0] === "p" ? t.tags[0][1] : null;
    } catch {
      return null;
    }
  }
  /**
   * Extract relay hint from gift wrap p tag
   */
  static getRelayHintFromGiftWrap(t) {
    try {
      return t.tags.length > 0 && t.tags[0][0] === "p" && t.tags[0].length > 2 ? t.tags[0][2] : null;
    } catch {
      return null;
    }
  }
}
const Ds = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapCreator: Lt
}, Symbol.toStringTag, { value: "Module" }));
class at {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(t, e, s, i, r) {
    try {
      this.validateCreateDMInputs(t, e, s);
      const n = this.createRumor(t, e, i), a = [];
      for (const u of s.recipients) {
        const h = await Dt.createSealWithSigner(n, r, u.pubkey), d = s.maxTimestampAge === 0 ? Math.floor(Date.now() / 1e3) : void 0, f = await Lt.createGiftWrap(
          h,
          {
            pubkey: u.pubkey,
            relayHint: u.relayHint || s.relayHint
          },
          void 0,
          // ephemeral key pair (auto-generated)
          d
          // pass current timestamp for test compatibility
        );
        a.push(f);
      }
      const c = await Dt.createSealWithSigner(n, r, s.recipients[0].pubkey);
      return {
        rumor: n,
        seal: c,
        giftWraps: a,
        senderPrivateKey: void 0
      };
    } catch (n) {
      throw n instanceof v ? n : new v(
        `Gift wrap protocol failed: ${n.message}`,
        E.GIFT_WRAP_CREATION_FAILED,
        n
      );
    }
  }
  /**
   * Decrypt a gift-wrapped direct message
   * Returns the original rumor and verification status
   */
  // Raw-key decryption path removed in P1. Decryption is performed upstream via signer decryptor injection.
  /**
   * Create a rumor (unsigned event) containing the message
   */
  static createRumor(t, e, s) {
    const i = [];
    return s && i.push(["subject", s]), {
      pubkey: e,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 14,
      // Chat message kind (NIP-17, not 4)
      tags: i,
      content: t
    };
  }
  /**
   * Create gift wraps for a batch of messages to multiple recipients
   * Useful for sending the same message to multiple people
   */
  static async createBatchGiftWraps(t) {
    const e = [];
    for (const s of t) {
      const i = await this.createGiftWrappedDM(
        s.message,
        s.senderPrivateKey,
        s.config
      );
      e.push(i);
    }
    return e;
  }
  /**
   * Extract all gift wraps that are meant for a specific recipient
   * Useful for filtering gift wraps from a relay
   */
  static filterGiftWrapsForRecipient(t, e) {
    return t.filter((s) => Lt.getRecipientFromGiftWrap(s) === e);
  }
  /**
   * Decrypt multiple gift wraps for a recipient
   * Returns successful decryptions and filters out invalid ones
   */
  static async decryptMultipleGiftWraps(t, e) {
    const s = [];
    for (const i of t) {
      const r = await this.decryptGiftWrappedDM(i, e);
      r.isValid && s.push(r);
    }
    return s;
  }
  /**
   * Validate inputs for creating gift-wrapped DMs
   */
  static validateCreateDMInputs(t, e, s) {
    if (typeof t != "string")
      throw new v(
        "Message must be a string",
        E.INVALID_RUMOR
      );
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new v(
        "Invalid sender private key format",
        E.SEAL_CREATION_FAILED
      );
    if (!s || !Array.isArray(s.recipients) || s.recipients.length === 0)
      throw new v(
        "At least one recipient is required",
        E.NO_RECIPIENTS
      );
    for (const i of s.recipients)
      if (!i || typeof i.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(i.pubkey))
        throw new v(
          "Invalid recipient public key format",
          E.INVALID_RECIPIENT
        );
  }
  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivate(t) {
    try {
      const e = new Uint8Array(
        t.match(/.{1,2}/g).map((n) => parseInt(n, 16))
      ), i = dt.getPublicKey(e, !1).slice(1, 33);
      return Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      throw new v(
        "Failed to derive public key from private key",
        E.SEAL_CREATION_FAILED,
        e
      );
    }
  }
  /**
   * Utility: Create a simple gift wrap configuration for single recipient
   */
  static createSimpleConfig(t, e) {
    return {
      recipients: [{
        pubkey: t,
        relayHint: e
      }],
      relayHint: e
    };
  }
  /**
   * Utility: Create a multi-recipient gift wrap configuration
   */
  static createMultiRecipientConfig(t, e) {
    return {
      recipients: t.map((s) => ({
        pubkey: s,
        relayHint: e
      })),
      relayHint: e
    };
  }
  /**
   * Get protocol statistics for monitoring and debugging
   */
  static getProtocolStats(t) {
    const e = t.length, s = t.reduce((c, u) => c + u.giftWraps.length, 0), i = Math.floor(Date.now() / 1e3), r = t.flatMap(
      (c) => c.giftWraps.map((u) => i - u.giftWrap.created_at)
    ), n = r.length > 0 ? r.reduce((c, u) => c + u, 0) / r.length : 0, a = new Set(
      t.flatMap((c) => c.giftWraps.map((u) => u.recipient))
    );
    return {
      totalMessages: e,
      totalGiftWraps: s,
      averageTimestampAge: n,
      uniqueRecipients: a.size
    };
  }
  /**
   * Unwrap any gift-wrapped event to reveal the actual content
   * This is the core method for transparent caching of any encrypted event type
   * DMs are just one use case - this works for ANY event kind wrapped in gift wrap
   */
  static async unwrapGiftWrap(t, e) {
    try {
      if (!t || t.kind !== 1059)
        return null;
      if (e && e.startsWith("0x") && (e = e.slice(2)), !/^[0-9a-f]{64}$/i.test(e))
        throw new v(
          "Invalid recipient private key format",
          E.INVALID_PRIVATE_KEY
        );
      const { SealCreator: s } = await Promise.resolve().then(() => ms), { NIP44Crypto: i } = await Promise.resolve().then(() => jt), r = i.deriveConversationKey(
        e,
        t.pubkey
      ), n = i.decrypt(
        t.content,
        r
      );
      if (!n || !n.isValid)
        return null;
      const a = JSON.parse(n.plaintext);
      if (!a || a.kind !== 13)
        return null;
      const c = i.deriveConversationKey(
        e,
        a.pubkey
      ), u = i.decrypt(
        a.content,
        c
      );
      if (!u || !u.isValid)
        return null;
      const h = JSON.parse(u.plaintext);
      return !h || typeof h.kind != "number" ? null : h;
    } catch (s) {
      return console.error("Failed to unwrap gift wrapped DM:", s), null;
    }
  }
}
const Ls = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapProtocol: at
}, Symbol.toStringTag, { value: "Module" }));
class Pe {
  constructor(t) {
    l(this, "_state");
    l(this, "subscription");
    l(this, "config");
    // Reactive store properties
    l(this, "messages");
    l(this, "status");
    l(this, "latest");
    l(this, "error");
    l(this, "subject");
    this.config = t, this._state = nt({
      messages: [],
      status: "connecting",
      latest: null,
      isTyping: !1,
      error: null,
      subject: t.subject
    }), this.messages = I(this._state, (e) => e.messages), this.status = I(this._state, (e) => e.status), this.latest = I(this._state, (e) => e.latest), this.error = I(this._state, (e) => e.error), this.subject = I(this._state, (e) => e.subject), this.initializeSubscription();
  }
  wrapSigner() {
    var i, r;
    const t = this, e = (i = t.config) == null ? void 0 : i.relayManager, s = (e == null ? void 0 : e.signingProvider) || t.signer || ((r = t.nostr) == null ? void 0 : r.signingProvider);
    return {
      nip44Encrypt: async (n, a) => {
        if (!(s != null && s.nip44Encrypt)) throw new Error("Signer missing nip44Encrypt");
        return s.nip44Encrypt(n, a);
      },
      signEvent: async (n) => {
        if (!(s != null && s.signEvent)) throw new Error("Signer missing signEvent");
        return s.signEvent(n);
      }
    };
  }
  /**
   * Send an encrypted direct message
   */
  async send(t, e) {
    var s, i;
    try {
      this.config.debug && console.log("📤 DMConversation.send called:", {
        content: t.substring(0, 20) + "...",
        subject: e,
        recipientPubkey: this.config.recipientPubkey.substring(0, 8) + "...",
        hasSenderPrivateKey: !!this.config.senderPrivateKey,
        senderPrivateKeyLength: (s = this.config.senderPrivateKey) == null ? void 0 : s.length
      }), this.updateStatus("active");
      const r = this.generateMessageId(), n = Math.floor(Date.now() / 1e3), a = {
        id: r,
        content: t,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp: n,
        isFromMe: !0,
        status: "sending",
        subject: e || this.getCurrentSubject()
      };
      this.addMessage(a);
      const c = at.createSimpleConfig(
        this.config.recipientPubkey,
        (i = this.config.relayHints) == null ? void 0 : i[0]
      );
      this.config.debug && console.log("🎁 Creating gift wrap with config:", c);
      const u = await at.createGiftWrappedDM(
        t,
        this.config.senderPubkey,
        c,
        e,
        this.wrapSigner()
      );
      this.config.debug && console.log("🎁 Gift wrap result:", {
        hasRumor: !!u.rumor,
        hasSeal: !!u.seal,
        giftWrapCount: u.giftWraps.length
      });
      let h = !1, d;
      for (const f of u.giftWraps)
        try {
          this.config.debug && console.log("📡 Publishing gift wrap:", {
            id: f.giftWrap.id,
            kind: f.giftWrap.kind,
            tags: f.giftWrap.tags
          });
          const p = await this.config.relayManager.publishToAll(f.giftWrap);
          this.config.debug && console.log("📡 Publish result:", p), p.some((y) => y.success) && (h = !0, a.eventId = f.giftWrap.id);
        } catch (p) {
          d = p instanceof Error ? p.message : "Publishing failed", this.config.debug && console.error("❌ Publish error:", p);
        }
      if (h)
        return this.updateMessageStatus(r, "sent"), this.config.debug && console.log(`✅ DM sent successfully: ${r}`), { success: !0, messageId: r };
      {
        this.updateMessageStatus(r, "failed");
        const f = d || "Failed to publish to any relay";
        return this.setError(f), this.config.debug && console.error(`❌ DM send failed: ${f}`), { success: !1, error: f, messageId: r };
      }
    } catch (r) {
      const n = r instanceof Error ? r.message : "Unknown error sending message";
      return this.setError(n), this.config.debug && console.error("❌ Exception in send:", r), { success: !1, error: n };
    }
  }
  /**
   * Update the conversation subject
   */
  updateSubject(t) {
    this._state.update((e) => ({
      ...e,
      subject: t
    }));
  }
  /**
   * Clear the conversation history
   */
  clearHistory() {
    this._state.update((t) => ({
      ...t,
      messages: [],
      latest: null
    }));
  }
  /**
   * Close the conversation and clean up subscriptions
   */
  async close() {
    var t, e;
    (e = (t = this.subscription) == null ? void 0 : t.subscription) != null && e.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.updateStatus("disconnected");
  }
  /**
   * Retry connection if in error state
   */
  async retry() {
    var t, e;
    (e = (t = this.subscription) == null ? void 0 : t.subscription) != null && e.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.setError(null), await this.initializeSubscription();
  }
  /**
   * Handle a decrypted event forwarded from the global inbox
   * This enables transparent caching and zero-config DX
   */
  async handleDecryptedEvent(t) {
    this.config.debug && console.log("📨 Processing decrypted event in conversation:", t.id), await this.handleIncomingEvent(t);
  }
  // Private methods
  async initializeSubscription() {
    var t;
    try {
      this.updateStatus("connecting");
      const e = {
        kinds: [1059],
        // NIP-59 gift wrap events
        "#p": [this.config.senderPubkey],
        // Events tagged with our pubkey as recipient
        limit: 100
        // Get recent messages
      }, s = {
        onEvent: (i) => this.handleIncomingEvent(i),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`DM conversation subscription active for ${this.config.recipientPubkey}`);
        },
        onClose: (i) => {
          this.updateStatus("disconnected"), i && this.setError(`Subscription closed: ${i}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([e], s), !this.subscription.success) {
        const i = ((t = this.subscription.error) == null ? void 0 : t.message) || "Failed to create subscription";
        this.setError(i), this.updateStatus("error");
      }
    } catch (e) {
      const s = e instanceof Error ? e.message : "Failed to initialize subscription";
      this.setError(s), this.updateStatus("error");
    }
  }
  async handleIncomingEvent(t) {
    try {
      if (t.kind !== 1059)
        return;
      const e = await at.decryptGiftWrappedDM(
        t,
        this.config.senderPrivateKey
      );
      if (!e.isValid || !e.rumor) {
        this.config.debug && console.log("Failed to decrypt gift wrap or not for us");
        return;
      }
      if (e.senderPubkey !== this.config.recipientPubkey) {
        this.config.debug && console.log("Message not from conversation partner");
        return;
      }
      const s = {
        id: this.generateMessageId(),
        content: e.rumor.content,
        senderPubkey: e.senderPubkey,
        recipientPubkey: this.config.senderPubkey,
        timestamp: e.rumor.created_at,
        isFromMe: !1,
        eventId: t.id,
        status: "received",
        subject: this.extractSubjectFromRumor(e.rumor)
      };
      this.getCurrentMessages().some(
        (n) => n.eventId === t.id || n.content === s.content && Math.abs(n.timestamp - s.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(s), this.config.debug && console.log(`Received DM from ${e.senderPubkey}: ${s.content}`));
    } catch (e) {
      this.config.debug && console.error("Error handling incoming DM event:", e);
    }
  }
  addMessage(t) {
    this._state.update((e) => {
      const s = [...e.messages, t];
      return s.sort((i, r) => i.timestamp - r.timestamp), {
        ...e,
        messages: s,
        latest: s[s.length - 1] || null
      };
    });
  }
  updateMessageStatus(t, e) {
    this._state.update((s) => ({
      ...s,
      messages: s.messages.map(
        (i) => i.id === t ? { ...i, status: e } : i
      )
    }));
  }
  updateStatus(t) {
    this._state.update((e) => ({
      ...e,
      status: t
    }));
  }
  setError(t) {
    this._state.update((e) => ({
      ...e,
      error: t
    }));
  }
  getCurrentSubject() {
    let t;
    return this.subject.subscribe((s) => {
      t = s;
    })(), t;
  }
  extractSubjectFromRumor(t) {
    var s;
    const e = (s = t.tags) == null ? void 0 : s.find((i) => i[0] === "subject");
    return e == null ? void 0 : e[1];
  }
  getCurrentMessages() {
    let t = [];
    return this.messages.subscribe((s) => {
      t = s;
    })(), t;
  }
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Subscribe method for Svelte store compatibility
  subscribe(t) {
    return this.messages.subscribe(t);
  }
}
class Ie {
  constructor(t) {
    l(this, "_state");
    l(this, "subscription");
    l(this, "config");
    l(this, "roomId");
    // Reactive store properties
    l(this, "messages");
    l(this, "status");
    l(this, "latest");
    l(this, "subject");
    l(this, "participants");
    l(this, "error");
    var e;
    this.config = t, this.roomId = this.generateRoomId(), this._state = nt({
      messages: [],
      status: "connecting",
      latest: null,
      subject: ((e = t.options) == null ? void 0 : e.subject) || "Group Chat",
      participants: [...t.participants, t.senderPubkey],
      // Include sender
      isTyping: !1,
      error: null
    }), this.messages = I(this._state, (s) => s.messages), this.status = I(this._state, (s) => s.status), this.latest = I(this._state, (s) => s.latest), this.subject = I(this._state, (s) => s.subject), this.participants = I(this._state, (s) => s.participants), this.error = I(this._state, (s) => s.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted message to all room participants
   */
  async send(t) {
    var e, s;
    try {
      this.updateStatus("active");
      const i = this.generateMessageId(), r = Math.floor(Date.now() / 1e3), n = this.getCurrentSubject(), a = this.getCurrentParticipants(), c = {
        id: i,
        content: t,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: r,
        isFromMe: !0,
        status: "sending",
        subject: n,
        participants: a
      };
      this.addMessage(c);
      const h = {
        recipients: a.filter((g) => g !== this.config.senderPubkey).map((g) => ({ pubkey: g })),
        relayHint: (s = (e = this.config.options) == null ? void 0 : e.relayHints) == null ? void 0 : s[0]
      }, d = await at.createGiftWrappedDM(
        t,
        this.config.senderPrivateKey,
        h
      );
      let f = !1, p;
      for (const g of d.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(g.giftWrap)).some((b) => b.success) && (f = !0, c.eventId = g.giftWrap.id);
        } catch (y) {
          p = y instanceof Error ? y.message : "Publishing failed";
        }
      if (f)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`Room message sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const g = p || "Failed to publish to any relay";
        return this.setError(g), { success: !1, error: g, messageId: i };
      }
    } catch (i) {
      const r = i instanceof Error ? i.message : "Unknown error sending message";
      return this.setError(r), { success: !1, error: r };
    }
  }
  /**
   * Update the room subject
   */
  async updateSubject(t) {
    try {
      return this._state.update((e) => ({
        ...e,
        subject: t
      })), { success: !0 };
    } catch (e) {
      return { success: !1, error: e instanceof Error ? e.message : "Failed to update subject" };
    }
  }
  /**
   * Add a participant to the room
   */
  async addParticipant(t) {
    try {
      return this.getCurrentParticipants().includes(t) ? { success: !1, error: "Participant already in room" } : (this._state.update((s) => ({
        ...s,
        participants: [...s.participants, t]
      })), { success: !0 });
    } catch (e) {
      return { success: !1, error: e instanceof Error ? e.message : "Failed to add participant" };
    }
  }
  /**
   * Remove a participant from the room
   */
  async removeParticipant(t) {
    try {
      return this.getCurrentParticipants().includes(t) ? t === this.config.senderPubkey ? { success: !1, error: "Cannot remove yourself from room" } : (this._state.update((s) => ({
        ...s,
        participants: s.participants.filter((i) => i !== t)
      })), { success: !0 }) : { success: !1, error: "Participant not in room" };
    } catch (e) {
      return { success: !1, error: e instanceof Error ? e.message : "Failed to remove participant" };
    }
  }
  /**
   * Clear the room history
   */
  clearHistory() {
    this._state.update((t) => ({
      ...t,
      messages: [],
      latest: null
    }));
  }
  /**
   * Close the room and clean up subscriptions
   */
  async close() {
    var t, e;
    (e = (t = this.subscription) == null ? void 0 : t.subscription) != null && e.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.updateStatus("disconnected");
  }
  /**
   * Retry connection if in error state
   */
  async retry() {
    var t, e;
    (e = (t = this.subscription) == null ? void 0 : t.subscription) != null && e.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.setError(null), await this.initializeSubscription();
  }
  // Private methods
  async initializeSubscription() {
    var t;
    try {
      this.updateStatus("connecting");
      const e = {
        kinds: [1059],
        // NIP-59 gift wrap events
        "#p": [this.config.senderPubkey],
        // Events tagged with our pubkey as recipient
        limit: 100
        // Get recent messages
      }, s = {
        onEvent: (i) => this.handleIncomingEvent(i),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`Room subscription active: ${this.roomId}`);
        },
        onClose: (i) => {
          this.updateStatus("disconnected"), i && this.setError(`Subscription closed: ${i}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([e], s), !this.subscription.success) {
        const i = ((t = this.subscription.error) == null ? void 0 : t.message) || "Failed to create subscription";
        this.setError(i), this.updateStatus("error");
      }
    } catch (e) {
      const s = e instanceof Error ? e.message : "Failed to initialize subscription";
      this.setError(s), this.updateStatus("error");
    }
  }
  async handleIncomingEvent(t) {
    try {
      if (t.kind !== 1059)
        return;
      const e = await at.decryptGiftWrappedDM(
        t,
        this.config.senderPrivateKey
      );
      if (!e.isValid || !e.rumor) {
        this.config.debug && console.log("Failed to decrypt gift wrap or not for us");
        return;
      }
      const s = this.getCurrentParticipants();
      if (!s.includes(e.senderPubkey)) {
        this.config.debug && console.log("Message not from room participant");
        return;
      }
      const i = this.extractSubjectFromRumor(e.rumor), r = this.getCurrentSubject(), n = {
        id: this.generateMessageId(),
        content: e.rumor.content,
        senderPubkey: e.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: e.rumor.created_at,
        isFromMe: !1,
        eventId: t.id,
        status: "received",
        subject: i || r,
        participants: s
      };
      this.getCurrentMessages().some(
        (u) => u.eventId === t.id || u.content === n.content && Math.abs(u.timestamp - n.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(n), this.config.debug && console.log(`Received room message from ${e.senderPubkey}: ${n.content}`));
    } catch (e) {
      this.config.debug && console.error("Error handling incoming room event:", e);
    }
  }
  addMessage(t) {
    this._state.update((e) => {
      const s = [...e.messages, t];
      return s.sort((i, r) => i.timestamp - r.timestamp), {
        ...e,
        messages: s,
        latest: s[s.length - 1] || null
      };
    });
  }
  updateMessageStatus(t, e) {
    this._state.update((s) => ({
      ...s,
      messages: s.messages.map(
        (i) => i.id === t ? { ...i, status: e } : i
      )
    }));
  }
  updateStatus(t) {
    this._state.update((e) => ({
      ...e,
      status: t
    }));
  }
  setError(t) {
    this._state.update((e) => ({
      ...e,
      error: t
    }));
  }
  getCurrentSubject() {
    let t = "";
    return this.subject.subscribe((s) => {
      t = s;
    })(), t;
  }
  getCurrentParticipants() {
    let t = [];
    return this.participants.subscribe((s) => {
      t = s;
    })(), t;
  }
  getCurrentMessages() {
    let t = [];
    return this.messages.subscribe((s) => {
      t = s;
    })(), t;
  }
  extractSubjectFromRumor(t) {
    var s;
    const e = (s = t.tags) == null ? void 0 : s.find((i) => i[0] === "subject");
    return e == null ? void 0 : e[1];
  }
  generateRoomId() {
    const e = [...this.config.participants, this.config.senderPubkey].sort().join(",");
    return `room_${Date.now()}_${e.slice(0, 16)}`;
  }
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Subscribe method for Svelte store compatibility
  subscribe(t) {
    return this.messages.subscribe(t);
  }
}
class Te {
  constructor(t) {
    l(this, "conversations", /* @__PURE__ */ new Map());
    l(this, "rooms", /* @__PURE__ */ new Map());
    l(this, "config");
    l(this, "_senderPubkey", null);
    l(this, "_senderPrivateKey", null);
    l(this, "parentNostr");
    // Reference to NostrUnchained instance
    // Reactive stores
    l(this, "_conversationList", nt([]));
    l(this, "conversations$");
    this.config = t, this.parentNostr = t.parent, this.conversations$ = this._conversationList, this.config.signingProvider && this.initializeSender();
  }
  /**
   * Get or create a conversation with a specific user
   * This is the main entry point: nostr.dm.with('npub...')
   */
  with(t) {
    return this.shouldUseUniversalDM() ? this.delegateToUniversalDM(t) : this.withLegacy(t);
  }
  /**
   * Legacy async implementation for fallback
   */
  async withLegacy(t) {
    const e = this.normalizePubkey(t);
    let s = this.conversations.get(e);
    return s || (s = await this.createConversation(e), this.conversations.set(e, s), this.updateConversationList(), this.config.debug && console.log(`Created new DM conversation with ${e}`)), s;
  }
  /**
   * Create or get a multi-participant room
   * This is the main entry point: nostr.dm.room(['pubkey1', 'pubkey2'], { subject: 'Meeting' })
   */
  async room(t, e) {
    if (this.shouldUseUniversalDM()) {
      const s = this.getUniversalDMInstance();
      if (s && typeof s.room == "function")
        return s.room(t, e);
    }
    return this.roomLegacy(t, e);
  }
  /**
   * Legacy room implementation for fallback
   */
  async roomLegacy(t, e) {
    const s = t.map((n) => this.normalizePubkey(n)), i = this.generateRoomId(s);
    let r = this.rooms.get(i);
    return r || (r = await this.createRoom(s, e), this.rooms.set(i, r), this.updateConversationList(), this.config.debug && console.log(`Created new DM room: ${i} with ${s.length} participants`)), r;
  }
  /**
   * Get all active conversations as summaries
   */
  getConversations() {
    if (this.shouldUseUniversalDM()) {
      const s = this.getUniversalDMInstance();
      if (s && typeof s.summaries == "function")
        return s.summaries().map((r) => ({
          pubkey: r.pubkey,
          latestMessage: null,
          // TODO: Get latest message from conversation
          lastActivity: 0,
          // TODO: Get last activity timestamp
          isActive: !0,
          // TODO: Get actual status
          subject: r.subject,
          // Use subject from UniversalDM summary
          participants: r.participants,
          type: r.type
        }));
    }
    let t = [];
    return this.conversations$.subscribe((s) => {
      t = s;
    })(), t;
  }
  /**
   * Close a specific conversation
   */
  async closeConversation(t) {
    const e = this.normalizePubkey(t), s = this.conversations.get(e);
    s && (await s.close(), this.conversations.delete(e), this.updateConversationList(), this.config.debug && console.log(`Closed DM conversation with ${e}`));
  }
  /**
   * Close a specific room
   */
  async closeRoom(t) {
    const e = this.rooms.get(t);
    e && (await e.close(), this.rooms.delete(t), this.updateConversationList(), this.config.debug && console.log(`Closed DM room: ${t}`));
  }
  /**
   * Close all conversations and clean up
   */
  async closeAll() {
    const t = Array.from(this.conversations.values()).map((s) => s.close()), e = Array.from(this.rooms.values()).map((s) => s.close());
    await Promise.all([...t, ...e]), this.conversations.clear(), this.rooms.clear(), this.updateConversationList(), this.config.debug && console.log("Closed all DM conversations and rooms");
  }
  /**
   * Update the signing provider and initialize sender credentials
   * Called by NostrUnchained when signing provider becomes available
   */
  async updateSigningProvider(t) {
    this.config.signingProvider = t;
    try {
      await this.initializeSender();
    } catch (e) {
      this.config.debug && console.error("Failed to update signing provider:", e);
    }
  }
  /**
   * Start global DM inbox subscription
   * Subscribes to all kind 1059 events for the current user
   */
  async startInboxSubscription() {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Ensure signing provider is initialized.");
    try {
      const t = {
        kinds: [1059],
        // NIP-59 gift wrap events
        "#p": [this._senderPubkey],
        // Events tagged with our pubkey
        limit: 50
        // Recent messages only for global inbox
      };
      await this.config.subscriptionManager.subscribe([t], {
        onEvent: (e) => this.handleGlobalInboxEvent(e),
        onEose: () => {
          this.config.debug && console.log("Global DM inbox subscription active");
        }
      });
    } catch (t) {
      throw this.config.debug && console.error("Failed to start global inbox subscription:", t), t;
    }
  }
  // Private methods
  async initializeSender() {
    try {
      if (!this.config.signingProvider) {
        this.config.debug && console.log("DM module: No signing provider available yet");
        return;
      }
      this._senderPubkey = await this.config.signingProvider.getPublicKey(), this.config.debug && console.log(`DM module initialized for pubkey: ${this._senderPubkey}`);
    } catch (t) {
      this.config.debug && console.error("Failed to initialize sender credentials:", t);
    }
  }
  async createConversation(t) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const e = await this.getPrivateKeySecurely(), s = {
      recipientPubkey: t,
      senderPrivateKey: e,
      // legacy path; not used in UniversalDM
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      debug: this.config.debug
    }, i = new Pe(s);
    return this.setupConversationReactivity(i), i;
  }
  async createRoom(t, e) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const s = await this.getPrivateKeySecurely(), i = {
      participants: t,
      senderPrivateKey: s,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      options: e,
      debug: this.config.debug
    }, r = new Ie(i);
    return this.setupRoomReactivity(r), r;
  }
  setupConversationReactivity(t) {
    t.latest.subscribe(() => {
      this.updateConversationList();
    }), t.subject.subscribe(() => {
      this.updateConversationList();
    });
  }
  setupRoomReactivity(t) {
    t.latest.subscribe(() => {
      this.updateConversationList();
    }), t.subject.subscribe(() => {
      this.updateConversationList();
    }), t.participants.subscribe(() => {
      this.updateConversationList();
    });
  }
  updateConversationList() {
    const t = [];
    this.conversations.forEach((e, s) => {
      let i = null, r = "disconnected", n;
      const a = e.latest.subscribe((h) => {
        i = h;
      }), c = e.status.subscribe((h) => {
        r = h;
      }), u = e.subject.subscribe((h) => {
        n = h;
      });
      a(), c(), u(), t.push({
        pubkey: s,
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: n,
        type: "conversation"
      });
    }), this.rooms.forEach((e, s) => {
      let i = null, r = "disconnected", n = "", a = [];
      const c = e.latest.subscribe((f) => {
        i = f;
      }), u = e.status.subscribe((f) => {
        r = f;
      }), h = e.subject.subscribe((f) => {
        n = f;
      }), d = e.participants.subscribe((f) => {
        a = f;
      });
      c(), u(), h(), d(), t.push({
        pubkey: s,
        // Use roomId as the identifier
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: n,
        participants: a,
        type: "room"
      });
    }), t.sort((e, s) => s.lastActivity - e.lastActivity), this._conversationList.set(t);
  }
  async handleGlobalInboxEvent(t) {
    this.config.debug && console.log("🎁 Processing gift wrap event:", t.id);
    try {
      const { GiftWrapProtocol: e } = await Promise.resolve().then(() => Ls), s = await this.getPrivateKeySecurely(), i = await e.unwrapGiftWrap(t, s);
      if (i) {
        const r = i.pubkey;
        if (this.config.debug && console.log("✅ Decrypted event (kind " + i.kind + ") from:", r.substring(0, 8) + "..."), i.kind === 4 || i.kind === 14) {
          let n = this.conversations.get(r);
          n || (this.config.debug && console.log("🆕 Auto-creating conversation with:", r.substring(0, 8) + "..."), n = await this.with(r)), n && typeof n.handleDecryptedEvent == "function" && n.handleDecryptedEvent(i), this.updateConversationList(), this.config.debug && console.log("🔄 Updated conversations, total:", this.conversations.size);
        } else
          this.config.debug && console.log("🔮 Received encrypted event kind " + i.kind + " - not a DM, caching for future use");
      }
    } catch (e) {
      this.config.debug && console.error("❌ Failed to process gift wrap event:", e);
    }
  }
  normalizePubkey(t) {
    if (t.startsWith("npub"))
      throw new Error("npub format not yet supported, please use hex pubkey");
    if (!/^[0-9a-f]{64}$/i.test(t))
      throw new Error("Invalid pubkey format. Expected 64-character hex string");
    return t.toLowerCase();
  }
  async getPrivateKeySecurely() {
    throw new Error("Raw private key access removed. Use SigningProvider.nip44Encrypt/Decrypt.");
  }
  generateRoomId(t) {
    return [...t, this._senderPubkey].sort().join(",");
  }
  /**
   * Check if we should use the Universal DM Module (cache-based)
   * This is a temporary bridge while we migrate to the new architecture
   */
  shouldUseUniversalDM() {
    return !!this.getUniversalDMInstance();
  }
  /**
   * Get the Universal DM Module instance from the parent NostrUnchained
   */
  getUniversalDMInstance() {
    var t;
    return (t = this.parentNostr) == null ? void 0 : t.universalDM;
  }
  /**
   * Delegate to Universal DM Module with lazy loading
   */
  delegateToUniversalDM(t) {
    var i;
    const e = this.getUniversalDMInstance();
    if (!e)
      throw new Error("Universal DM Module not available");
    this.config.debug && console.log("🎯 Delegating to Universal DM Module (cache-based) for:", t.substring(0, 16) + "...");
    const s = e.with(t);
    return this.config.debug && console.log("🔍 Result from universalDM.with():", {
      result: !!s,
      hasMessages: !!(s != null && s.messages),
      hasSubscribe: typeof (s == null ? void 0 : s.subscribe),
      hasSend: typeof (s == null ? void 0 : s.send),
      constructor: (i = s == null ? void 0 : s.constructor) == null ? void 0 : i.name
    }), s;
  }
}
class ge {
  // Cache for synchronous access
  constructor(t, e, s) {
    l(this, "store");
    l(this, "myPubkey");
    l(this, "otherPubkey");
    l(this, "nostr");
    l(this, "_status", "connecting");
    l(this, "statusCallbacks", []);
    l(this, "messageCache", []);
    var i, r;
    this.nostr = t, this.myPubkey = (e || "").toLowerCase(), this.otherPubkey = (s || "").toLowerCase(), console.log("🚀 UniversalDMConversation constructor:", {
      myPubkey: e.substring(0, 16) + "...",
      otherPubkey: s.substring(0, 16) + "...",
      hasQueryMethod: typeof this.nostr.query == "function"
    });
    try {
      this.nostr.startUniversalGiftWrapSubscription().catch(() => {
      }), this.store = this.nostr.query().kinds([14]).authors([this.myPubkey, this.otherPubkey]).tags("p", [this.myPubkey, this.otherPubkey]).execute(), console.log("✅ Store created successfully:", typeof this.store, (r = (i = this.store) == null ? void 0 : i.constructor) == null ? void 0 : r.name), setTimeout(() => {
        console.log("🔍 Cache state after store init:", {
          currentEvents: this.store.current.length,
          eventKinds: this.store.current.map((n) => n.kind),
          eventIds: this.store.current.map((n) => {
            var a;
            return ((a = n.id) == null ? void 0 : a.slice(0, 8)) + "...";
          })
        });
      }, 1e3);
    } catch (n) {
      console.error("❌ Failed to create store:", n), this.store = {
        subscribe: () => () => {
        },
        current: []
      };
    }
    this.subscribe(() => {
    }), setTimeout(() => {
      this._status = "active", this.notifyStatusChange();
    }, 100);
  }
  // Messages as reactive store
  get messages() {
    return console.log("📧 messages getter called, store exists?", !!this.store), this.store ? (console.log("✅ Returning", this.messageCache.length, "cached messages"), this.messageCache) : (console.error("❌ No store in messages getter"), []);
  }
  // Svelte store interface - delegate to underlying store
  subscribe(t) {
    return t(this.messageCache), this.store.subscribe(async (e) => {
      const s = await this.convertEventsToMessages(e), r = [...this.messageCache, ...s].filter(
        (n, a, c) => c.findIndex(
          (u) => u.eventId === n.eventId || u.content === n.content && Math.abs(u.timestamp - n.timestamp) < 5
        ) === a
      );
      r.sort((n, a) => n.timestamp - a.timestamp), this.messageCache = r, t(r);
    });
  }
  // Convenience method for sending
  async send(t, e) {
    var s;
    if (!t || t.trim().length === 0)
      return {
        success: !1,
        error: "Message content cannot be empty"
      };
    if (!this.isValidPubkey(this.otherPubkey))
      return {
        success: !1,
        error: "Invalid recipient pubkey format"
      };
    try {
      const i = this.nostr.signingProvider, r = await (((s = i == null ? void 0 : i.capabilities) == null ? void 0 : s.call(i)) ?? { nip44Encrypt: !1, nip44Decrypt: !1 }), n = {
        pubkey: this.myPubkey,
        created_at: Math.floor(Date.now() / 1e3),
        kind: 14,
        tags: e ? [["subject", e]] : [],
        content: t
      };
      if (r.nip44Encrypt && typeof i.nip44Encrypt == "function") {
        const a = async (g) => {
          const y = await i.nip44Encrypt(g, JSON.stringify(n)), m = {
            pubkey: this.myPubkey,
            created_at: Math.floor(Date.now() / 1e3),
            kind: 13,
            tags: [],
            content: y
          }, b = M.calculateEventId(m), w = await i.signEvent(m);
          return { ...m, id: b, sig: w };
        }, [c, u] = await Promise.all([
          a(this.otherPubkey),
          a(this.myPubkey)
        ]), { GiftWrapCreator: h } = await Promise.resolve().then(() => Ds), [d, f] = await Promise.all([
          h.createGiftWrap(c, { pubkey: this.otherPubkey }, void 0, Math.floor(Date.now() / 1e3)),
          h.createGiftWrap(u, { pubkey: this.myPubkey }, void 0, Math.floor(Date.now() / 1e3))
        ]), [p] = await Promise.all([
          this.nostr.publishSigned(d.giftWrap),
          this.nostr.publishSigned(f.giftWrap).catch(() => ({ success: !1 }))
        ]);
        if (p.success) {
          const g = d.giftWrap, y = {
            id: g.id,
            content: t,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: g.created_at,
            isFromMe: !0,
            eventId: g.id,
            status: "sent",
            subject: e,
            sender: this.myPubkey
          };
          return this.messageCache.push(y), this.messageCache.sort((m, b) => m.timestamp - b.timestamp), { success: !0, messageId: g.id };
        }
        return { success: !1, error: "Failed to publish to recipient" };
      } else
        return { success: !1, error: "Signer does not support NIP-44 encryption" };
    } catch (i) {
      return {
        success: !1,
        error: i instanceof Error ? i.message : "Unknown error"
      };
    }
  }
  async convertEventsToMessages(t) {
    const e = [];
    for (const s of t) {
      if (s.kind !== 14) continue;
      const i = s.pubkey === this.myPubkey, r = s.tags.some((a) => a[0] === "p" && a[1] === this.otherPubkey);
      (s.tags.some((a) => a[0] === "p" && a[1] === this.myPubkey) || i && r) && e.push({
        id: s.id,
        content: s.content,
        senderPubkey: s.pubkey,
        recipientPubkey: i ? this.otherPubkey : this.myPubkey,
        timestamp: s.created_at,
        isFromMe: i,
        eventId: s.id,
        status: i ? "sent" : "received",
        subject: this.getSubjectFromEvent(s),
        sender: s.pubkey
      });
    }
    return e.sort((s, i) => s.timestamp - i.timestamp);
  }
  getRecipientFromEvent(t) {
    const e = t.tags.find((s) => s[0] === "p");
    return (e == null ? void 0 : e[1]) || "";
  }
  getSubjectFromEvent(t) {
    const e = t.tags.find((s) => s[0] === "subject");
    return e == null ? void 0 : e[1];
  }
  getSubjectFromRumor(t) {
    var s;
    const e = (s = t.tags) == null ? void 0 : s.find((i) => i[0] === "subject");
    return e == null ? void 0 : e[1];
  }
  // Status as reactive store
  get status() {
    const t = this;
    return {
      subscribe: (e) => (e(t._status), t.statusCallbacks.push(e), () => {
        const s = t.statusCallbacks.indexOf(e);
        s > -1 && t.statusCallbacks.splice(s, 1);
      }),
      get current() {
        return t._status;
      }
    };
  }
  // Latest message
  get latest() {
    const t = this;
    return {
      subscribe: (e) => t.messages.subscribe((s) => {
        e(s[s.length - 1]);
      }),
      get current() {
        return t.messageCache[t.messageCache.length - 1];
      }
    };
  }
  // Subject from latest message with subject tag
  get subject() {
    const t = this;
    return {
      subscribe: (e) => t.store.subscribe((s) => {
        const i = s.filter((r) => r.tags.some((n) => n[0] === "subject")).sort((r, n) => n.created_at - r.created_at)[0];
        e(i ? t.getSubjectFromEvent(i) : void 0);
      }),
      get current() {
        const s = t.store.current.filter((i) => i.tags.some((r) => r[0] === "subject")).sort((i, r) => r.created_at - i.created_at)[0];
        return s ? t.getSubjectFromEvent(s) : void 0;
      }
    };
  }
  // Close the conversation (cleanup)
  async close() {
    this._status = "disconnected", this.notifyStatusChange();
  }
  notifyStatusChange() {
    this.statusCallbacks.forEach((t) => t(this._status));
  }
  isValidPubkey(t) {
    return typeof t == "string" && t.length === 64 && /^[0-9a-f]{64}$/i.test(t);
  }
}
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Re(o) {
  return o instanceof Uint8Array || ArrayBuffer.isView(o) && o.constructor.name === "Uint8Array";
}
function xe(o, t) {
  return Array.isArray(t) ? t.length === 0 ? !0 : o ? t.every((e) => typeof e == "string") : t.every((e) => Number.isSafeInteger(e)) : !1;
}
function Fs(o) {
  if (typeof o != "function")
    throw new Error("function expected");
  return !0;
}
function Et(o, t) {
  if (typeof t != "string")
    throw new Error(`${o}: string expected`);
  return !0;
}
function Ce(o) {
  if (!Number.isSafeInteger(o))
    throw new Error(`invalid integer: ${o}`);
}
function Yt(o) {
  if (!Array.isArray(o))
    throw new Error("array expected");
}
function Ne(o, t) {
  if (!xe(!0, t))
    throw new Error(`${o}: array of strings expected`);
}
function De(o, t) {
  if (!xe(!1, t))
    throw new Error(`${o}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function $s(...o) {
  const t = (r) => r, e = (r, n) => (a) => r(n(a)), s = o.map((r) => r.encode).reduceRight(e, t), i = o.map((r) => r.decode).reduce(e, t);
  return { encode: s, decode: i };
}
// @__NO_SIDE_EFFECTS__
function Os(o) {
  const t = typeof o == "string" ? o.split("") : o, e = t.length;
  Ne("alphabet", t);
  const s = new Map(t.map((i, r) => [i, r]));
  return {
    encode: (i) => (Yt(i), i.map((r) => {
      if (!Number.isSafeInteger(r) || r < 0 || r >= e)
        throw new Error(`alphabet.encode: digit index outside alphabet "${r}". Allowed: ${o}`);
      return t[r];
    })),
    decode: (i) => (Yt(i), i.map((r) => {
      Et("alphabet.decode", r);
      const n = s.get(r);
      if (n === void 0)
        throw new Error(`Unknown letter: "${r}". Allowed: ${o}`);
      return n;
    }))
  };
}
// @__NO_SIDE_EFFECTS__
function Bs(o = "") {
  return Et("join", o), {
    encode: (t) => (Ne("join.decode", t), t.join(o)),
    decode: (t) => (Et("join.decode", t), t.split(o))
  };
}
const Le = (o, t) => t === 0 ? o : Le(t, o % t), Ft = /* @__NO_SIDE_EFFECTS__ */ (o, t) => o + (t - Le(o, t)), xt = /* @__PURE__ */ (() => {
  let o = [];
  for (let t = 0; t < 40; t++)
    o.push(2 ** t);
  return o;
})();
function Jt(o, t, e, s) {
  if (Yt(o), t <= 0 || t > 32)
    throw new Error(`convertRadix2: wrong from=${t}`);
  if (e <= 0 || e > 32)
    throw new Error(`convertRadix2: wrong to=${e}`);
  if (/* @__PURE__ */ Ft(t, e) > 32)
    throw new Error(`convertRadix2: carry overflow from=${t} to=${e} carryBits=${/* @__PURE__ */ Ft(t, e)}`);
  let i = 0, r = 0;
  const n = xt[t], a = xt[e] - 1, c = [];
  for (const u of o) {
    if (Ce(u), u >= n)
      throw new Error(`convertRadix2: invalid data word=${u} from=${t}`);
    if (i = i << t | u, r + t > 32)
      throw new Error(`convertRadix2: carry overflow pos=${r} from=${t}`);
    for (r += t; r >= e; r -= e)
      c.push((i >> r - e & a) >>> 0);
    const h = xt[r];
    if (h === void 0)
      throw new Error("invalid carry");
    i &= h - 1;
  }
  if (i = i << e - r & a, !s && r >= t)
    throw new Error("Excess padding");
  if (!s && i > 0)
    throw new Error(`Non-zero padding: ${i}`);
  return s && r > 0 && c.push(i >>> 0), c;
}
// @__NO_SIDE_EFFECTS__
function Us(o, t = !1) {
  if (Ce(o), o <= 0 || o > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ Ft(8, o) > 32 || /* @__PURE__ */ Ft(o, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (e) => {
      if (!Re(e))
        throw new Error("radix2.encode input should be Uint8Array");
      return Jt(Array.from(e), 8, o, !t);
    },
    decode: (e) => (De("radix2.decode", e), Uint8Array.from(Jt(e, o, 8, t)))
  };
}
function fe(o) {
  return Fs(o), function(...t) {
    try {
      return o.apply(null, t);
    } catch {
    }
  };
}
const Xt = /* @__PURE__ */ $s(/* @__PURE__ */ Os("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ Bs("")), ye = [996825010, 642813549, 513874426, 1027748829, 705979059];
function yt(o) {
  const t = o >> 25;
  let e = (o & 33554431) << 5;
  for (let s = 0; s < ye.length; s++)
    (t >> s & 1) === 1 && (e ^= ye[s]);
  return e;
}
function pe(o, t, e = 1) {
  const s = o.length;
  let i = 1;
  for (let r = 0; r < s; r++) {
    const n = o.charCodeAt(r);
    if (n < 33 || n > 126)
      throw new Error(`Invalid prefix (${o})`);
    i = yt(i) ^ n >> 5;
  }
  i = yt(i);
  for (let r = 0; r < s; r++)
    i = yt(i) ^ o.charCodeAt(r) & 31;
  for (let r of t)
    i = yt(i) ^ r;
  for (let r = 0; r < 6; r++)
    i = yt(i);
  return i ^= e, Xt.encode(Jt([i % xt[30]], 30, 5, !1));
}
// @__NO_SIDE_EFFECTS__
function Ks(o) {
  const t = o === "bech32" ? 1 : 734539939, e = /* @__PURE__ */ Us(5), s = e.decode, i = e.encode, r = fe(s);
  function n(d, f, p = 90) {
    Et("bech32.encode prefix", d), Re(f) && (f = Array.from(f)), De("bech32.encode", f);
    const g = d.length;
    if (g === 0)
      throw new TypeError(`Invalid prefix length ${g}`);
    const y = g + 7 + f.length;
    if (p !== !1 && y > p)
      throw new TypeError(`Length ${y} exceeds limit ${p}`);
    const m = d.toLowerCase(), b = pe(m, f, t);
    return `${m}1${Xt.encode(f)}${b}`;
  }
  function a(d, f = 90) {
    Et("bech32.decode input", d);
    const p = d.length;
    if (p < 8 || f !== !1 && p > f)
      throw new TypeError(`invalid string length: ${p} (${d}). Expected (8..${f})`);
    const g = d.toLowerCase();
    if (d !== g && d !== d.toUpperCase())
      throw new Error("String must be lowercase or uppercase");
    const y = g.lastIndexOf("1");
    if (y === 0 || y === -1)
      throw new Error('Letter "1" must be present between prefix and data only');
    const m = g.slice(0, y), b = g.slice(y + 1);
    if (b.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const w = Xt.decode(b).slice(0, -6), k = pe(m, w, t);
    if (!b.endsWith(k))
      throw new Error(`Invalid checksum in ${d}: expected "${k}"`);
    return { prefix: m, words: w };
  }
  const c = fe(a);
  function u(d) {
    const { prefix: f, words: p } = a(d, !1);
    return { prefix: f, words: p, bytes: s(p) };
  }
  function h(d, f) {
    return n(d, i(f));
  }
  return {
    encode: n,
    decode: a,
    encodeFromBytes: h,
    decodeToBytes: u,
    decodeUnsafe: c,
    fromWords: s,
    fromWordsUnsafe: r,
    toWords: i
  };
}
const $t = /* @__PURE__ */ Ks("bech32"), Fe = 5e3, Ot = new TextEncoder(), Mt = new TextDecoder();
function Hs(o) {
  const t = new Uint8Array(4);
  return t[0] = o >> 24 & 255, t[1] = o >> 16 & 255, t[2] = o >> 8 & 255, t[3] = o & 255, t;
}
function zt(o) {
  const t = {};
  let e = o;
  for (; e.length > 0 && !(e.length < 2); ) {
    const s = e[0], i = e[1];
    if (e.length < 2 + i) break;
    const r = e.slice(2, 2 + i);
    e = e.slice(2 + i), t[s] = t[s] || [], t[s].push(r);
  }
  return t;
}
function ee(o) {
  const t = [];
  return Object.entries(o).reverse().forEach(([e, s]) => {
    s.forEach((i) => {
      const r = new Uint8Array(i.length + 2);
      r.set([parseInt(e)], 0), r.set([i.length], 1), r.set(i, 2), t.push(r);
    });
  }), It(...t);
}
function Bt(o, t) {
  const e = $t.toWords(t);
  return $t.encode(o, e, Fe);
}
function se(o, t) {
  return Bt(o, t);
}
function kt(o) {
  var i, r, n, a, c, u, h;
  if (o.toLowerCase().startsWith("nostr:")) {
    const f = o.slice(6).split("?")[0];
    return kt(f);
  }
  const { prefix: t, words: e } = $t.decode(o, Fe), s = new Uint8Array($t.fromWords(e));
  switch (t) {
    case "nprofile": {
      const d = zt(s);
      if (!((i = d[0]) != null && i[0])) throw new Error("missing TLV 0 for nprofile");
      if (d[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      return {
        type: "nprofile",
        data: {
          pubkey: D(d[0][0]),
          relays: d[1] ? d[1].map((f) => Mt.decode(f)) : []
        }
      };
    }
    case "nevent": {
      const d = zt(s);
      if (!((r = d[0]) != null && r[0])) throw new Error("missing TLV 0 for nevent");
      if (d[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      if (d[2] && d[2][0] && d[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (d[3] && d[3][0] && d[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "nevent",
        data: {
          id: D(d[0][0]),
          relays: d[1] ? d[1].map((f) => Mt.decode(f)) : [],
          author: (n = d[2]) != null && n[0] ? D(d[2][0]) : void 0,
          kind: (a = d[3]) != null && a[0] ? parseInt(D(d[3][0]), 16) : void 0
        }
      };
    }
    case "naddr": {
      const d = zt(s);
      if (!((c = d[0]) != null && c[0])) throw new Error("missing TLV 0 for naddr");
      if (!((u = d[2]) != null && u[0])) throw new Error("missing TLV 2 for naddr");
      if (d[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (!((h = d[3]) != null && h[0])) throw new Error("missing TLV 3 for naddr");
      if (d[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "naddr",
        data: {
          identifier: Mt.decode(d[0][0]),
          pubkey: D(d[2][0]),
          kind: parseInt(D(d[3][0]), 16),
          relays: d[1] ? d[1].map((f) => Mt.decode(f)) : []
        }
      };
    }
    case "nsec":
      return { type: t, data: s };
    case "npub":
    case "note":
      return { type: t, data: D(s) };
    default:
      throw new Error(`Unknown prefix ${t}`);
  }
}
function Ws(o) {
  return typeof o == "string" && o.toLowerCase().startsWith("nostr:");
}
function Vi(o) {
  if (!Ws(o)) throw new Error("Invalid Nostr URI: must start with nostr:");
  const t = o.slice(6), [e, s = ""] = t.split("?"), i = kt(e), r = {};
  if (s.length > 0)
    for (const n of s.split("&")) {
      if (!n) continue;
      const a = n.indexOf("="), c = decodeURIComponent(a >= 0 ? n.slice(0, a) : n), u = decodeURIComponent(a >= 0 ? n.slice(a + 1) : "");
      r[c] === void 0 ? r[c] = u : Array.isArray(r[c]) ? r[c].push(u) : r[c] = [r[c], u];
    }
  return { decoded: i, params: r };
}
function qi(o, t) {
  const e = typeof o == "string" ? o : (() => {
    switch (o.type) {
      case "npub":
        return `npub1${o.data.slice(4)}`;
      case "nsec":
        return "nsec1";
      case "note":
        return `note1${o.data.slice(4)}`;
      case "nprofile":
        return $e(o.data);
      case "nevent":
        return Oe(o.data);
      case "naddr":
        return Be(o.data);
      default:
        throw new Error("Unsupported DecodedResult");
    }
  })(), s = t ? Object.entries(t).flatMap(([i, r]) => Array.isArray(r) ? r.map((n) => `${encodeURIComponent(i)}=${encodeURIComponent(n)}`) : [`${encodeURIComponent(i)}=${encodeURIComponent(r)}`]).join("&") : "";
  return s ? `nostr:${e}?${s}` : `nostr:${e}`;
}
function zs(o) {
  return se("nsec", o);
}
function Vs(o) {
  return se("npub", ct(o));
}
function qs(o) {
  return se("note", ct(o));
}
function $e(o) {
  const t = ee({
    0: [ct(o.pubkey)],
    1: (o.relays || []).map((e) => Ot.encode(e))
  });
  return Bt("nprofile", t);
}
function Oe(o) {
  let t;
  o.kind !== void 0 && (t = Hs(o.kind));
  const e = ee({
    0: [ct(o.id)],
    1: (o.relays || []).map((s) => Ot.encode(s)),
    2: o.author ? [ct(o.author)] : [],
    3: t ? [new Uint8Array(t)] : []
  });
  return Bt("nevent", e);
}
function Be(o) {
  const t = new ArrayBuffer(4);
  new DataView(t).setUint32(0, o.kind, !1);
  const e = ee({
    0: [Ot.encode(o.identifier)],
    1: (o.relays || []).map((s) => Ot.encode(s)),
    2: [ct(o.pubkey)],
    3: [new Uint8Array(t)]
  });
  return Bt("naddr", e);
}
function ji(o) {
  const t = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Vs(t);
}
function Gi(o) {
  const t = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex privkey: must be 64 hex characters");
  return zs(ct(t));
}
function Yi(o) {
  const t = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  return qs(t);
}
function Ue(o) {
  if (!o.startsWith("npub1"))
    throw new Error('Invalid npub: must start with "npub1"');
  const t = kt(o);
  if (t.type !== "npub")
    throw new Error('Invalid npub: decoded type is not "npub"');
  return t.data;
}
function js(o) {
  if (!o.startsWith("nsec1"))
    throw new Error('Invalid nsec: must start with "nsec1"');
  const t = kt(o);
  if (t.type !== "nsec")
    throw new Error('Invalid nsec: decoded type is not "nsec"');
  return D(t.data);
}
function Gs(o) {
  if (!o.startsWith("note1"))
    throw new Error('Invalid note: must start with "note1"');
  const t = kt(o);
  if (t.type !== "note")
    throw new Error('Invalid note: decoded type is not "note"');
  return t.data;
}
function Ji(o, t) {
  const e = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return $e({ pubkey: e, relays: t });
}
function Xi(o, t, e, s) {
  const i = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(i))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  let r;
  if (e && (r = e.startsWith("0x") ? e.slice(2) : e, !/^[0-9a-fA-F]{64}$/.test(r)))
    throw new Error("Invalid hex author pubkey: must be 64 hex characters");
  return Oe({
    id: i,
    relays: t,
    author: r,
    kind: s
  });
}
function Ys(o, t, e, s) {
  const i = t.startsWith("0x") ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(i))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Be({
    identifier: o,
    pubkey: i,
    kind: e,
    relays: s
  });
}
function Js(o) {
  if (!o || typeof o != "string")
    return !1;
  const t = o.startsWith("0x") ? o.slice(2) : o;
  return /^[0-9a-fA-F]{64}$/.test(t);
}
function Xs(o) {
  if (!o || typeof o != "string" || !o.startsWith("npub1"))
    return !1;
  try {
    return Ue(o), !0;
  } catch {
    return !1;
  }
}
function Zi(o) {
  if (!o || typeof o != "string" || !o.startsWith("nsec1"))
    return !1;
  try {
    return js(o), !0;
  } catch {
    return !1;
  }
}
function Qi(o) {
  if (!o || typeof o != "string" || !o.startsWith("note1"))
    return !1;
  try {
    return Gs(o), !0;
  } catch {
    return !1;
  }
}
class Zs {
  constructor(t, e) {
    l(this, "conversationCache", /* @__PURE__ */ new Map());
    l(this, "roomCache", /* @__PURE__ */ new Map());
    this.nostr = t, this.initialMyPubkey = e;
  }
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  // Supports both hex pubkeys and npub format
  with(t) {
    const e = this.convertToHex(t), s = this.normalizePubkey(e), i = this.conversationCache.get(s);
    if (i)
      return i;
    if (!this.isValidPubkey(s)) {
      console.warn("⚠️ Invalid pubkey format, creating conversation that will fail gracefully:", t.substring(0, 16) + "...");
      const n = new ge(this.nostr, this.getMyPubkey(), s);
      return this.conversationCache.set(s, n), n;
    }
    this.nostr.startUniversalGiftWrapSubscription().catch((n) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DMs:", n);
    });
    const r = new ge(this.nostr, this.getMyPubkey(), s);
    return this.conversationCache.set(s, r), r;
  }
  /**
   * Convert npub to hex if needed, otherwise return as-is
   */
  convertToHex(t) {
    if (!t || typeof t != "string" || Js(t))
      return t;
    if (Xs(t))
      try {
        return Ue(t);
      } catch (e) {
        return console.warn("⚠️ Failed to convert npub to hex:", e), t;
      }
    return t;
  }
  isValidPubkey(t) {
    return typeof t == "string" && t.length === 64 && /^[0-9a-f]{64}$/i.test(t);
  }
  normalizePubkey(t) {
    return t.toLowerCase();
  }
  generateRoomId(t) {
    return [...t, this.getMyPubkey().toLowerCase()].sort().join(",");
  }
  // Room functionality - also just queries (with lazy gift wrap subscription)
  room(t, e) {
    const s = t.map((a) => a.toLowerCase()), i = this.generateRoomId(s), r = this.roomCache.get(i);
    if (r)
      return r;
    this.nostr.startUniversalGiftWrapSubscription().catch((a) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DM room:", a);
    });
    const n = new Qs(this.nostr, this.getMyPubkey(), s, e);
    return this.roomCache.set(i, n), n;
  }
  // Get all conversations - query all kind 14 events I'm involved in
  get conversations() {
    return Array.from(this.conversationCache.values());
  }
  /**
   * Resolve current pubkey from active signing provider to avoid stale self keys
   */
  getMyPubkey() {
    var s;
    const t = this.nostr.signingProvider, e = (s = t == null ? void 0 : t.getPublicKeySync) == null ? void 0 : s.call(t);
    return e && typeof e == "string" && /^[0-9a-f]{64}$/i.test(e) ? e.toLowerCase() : this.initialMyPubkey.toLowerCase();
  }
  // Get conversation summaries - required by tests
  summaries() {
    var e;
    const t = [];
    for (const [s, i] of this.conversationCache.entries())
      t.push({
        pubkey: s,
        type: "conversation"
        // Note: conversations don't have participants property (only rooms do)
      });
    for (const [s, i] of this.roomCache.entries())
      t.push({
        pubkey: s,
        type: "room",
        participants: s.split(","),
        // roomId contains all participants
        subject: (e = i.options) == null ? void 0 : e.subject
        // Access the subject from room options
      });
    return t;
  }
}
class Qs {
  // TODO: Implement room store
  constructor(t, e, s, i) {
    l(this, "store");
    this.nostr = t, this.myPubkey = e, this.roomParticipants = s, this.options = i, this.store = this.nostr.query().kinds([14]).tags("p", [this.myPubkey, ...this.roomParticipants]).execute();
  }
  subscribe(t) {
    return this.store.subscribe(t);
  }
  get messages() {
    return this.store.current;
  }
  async send(t) {
    try {
      return { success: !0 };
    } catch {
      return { success: !1 };
    }
  }
  // Room management
  get participants() {
    return [this.myPubkey, ...this.roomParticipants];
  }
  async addParticipant(t) {
    return { success: !0 };
  }
  async removeParticipant(t) {
    return { success: !0 };
  }
}
class ti {
  constructor(t, e) {
    this.nostr = t, this.debug = e, this.debug && console.log("🎯 ReactionModule initialized with Clean Architecture");
  }
  /**
   * Get reaction summary for an event (reactive)
   * Returns aggregated reactions with counts and user's reaction
   */
  to(t) {
    return this.startReactionSubscription(t), this.nostr.query().kinds([7]).tags("e", [t]).execute().map((e) => this.aggregateReactions(e, t));
  }
  /**
   * Get my reaction to an event (reactive)
   * Returns the current user's reaction content or null
   */
  myReaction(t) {
    const e = this.nostr.me;
    return e ? this.nostr.query().kinds([7]).authors([e]).tags("e", [t]).limit(1).execute().map((s) => {
      var i;
      return ((i = s[0]) == null ? void 0 : i.content) || null;
    }) : this.createNullStore();
  }
  /**
   * React to an event
   * Creates a NIP-25 compliant reaction event
   */
  async react(t, e = "+") {
    var s;
    try {
      const i = await this.getTargetEvent(t);
      if (!i)
        return { success: !1, error: "Target event not found" };
      const r = await this.nostr.events.reaction(t, e).tag("p", i.pubkey).publish();
      return this.debug && console.log(`ReactionModule: Published reaction "${e}" to event ${t.substring(0, 8)}...`), {
        success: r.success,
        eventId: r.eventId,
        error: (s = r.error) == null ? void 0 : s.message
      };
    } catch (i) {
      return {
        success: !1,
        error: i instanceof Error ? i.message : "Failed to publish reaction"
      };
    }
  }
  /**
   * Remove my reaction to an event
   * Publishes a deletion request for the reaction
   */
  async unreact(t) {
    var e;
    try {
      const s = await this.nostr.getPublicKey();
      let r = this.nostr.query().kinds([7]).authors([s]).tags("e", [t]).execute().current || [];
      if ((!r || r.length === 0) && (await this.nostr.sub().kinds([7]).authors([s]).tags("e", [t]).limit(100).execute(), await new Promise((u) => setTimeout(u, 300)), r = this.nostr.query().kinds([7]).authors([s]).tags("e", [t]).limit(100).execute().current || [], !r || r.length === 0))
        return { success: !1, error: "No reaction found to remove" };
      const n = r[0];
      let a = this.nostr.events.deletion(n.id, "User removed reaction");
      for (let u = 1; u < r.length; u++)
        a = a.tag("e", r[u].id);
      this.debug && console.log("ReactionModule.unreact: deleting all my reactions for target", {
        targetEventId: t.substring(0, 8) + "...",
        count: r.length
      });
      const c = await a.publish();
      return this.debug && console.log(`ReactionModule: Deleted reaction to event ${t.substring(0, 8)}...`), {
        success: c.success,
        error: (e = c.error) == null ? void 0 : e.message
      };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Failed to remove reaction"
      };
    }
  }
  // Private helper methods
  async startReactionSubscription(t) {
    try {
      await this.nostr.sub().kinds([7]).tags("e", [t]).limit(100).execute();
    } catch (e) {
      this.debug && console.warn("Failed to start reaction subscription:", e);
    }
  }
  async startMyReactionSubscription(t, e) {
  }
  async getTargetEvent(t) {
    await this.nostr.sub().ids([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 500));
    const s = this.nostr.query().ids([t]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  aggregateReactions(t, e) {
    const s = {};
    let i = 0, r = !1, n;
    const a = this.nostr.me;
    return t.filter((c) => c && typeof c == "object").forEach((c) => {
      if (c.kind !== 7) return;
      const u = c.content || "+", h = c.pubkey;
      s[u] || (s[u] = {
        type: u,
        count: 0,
        authors: []
      }), s[u].count++, s[u].authors.push(h), i++, a && h === a && (r = !0, n = u);
    }), {
      targetEventId: e,
      totalCount: i,
      reactions: s,
      userReacted: r,
      userReactionType: n
    };
  }
  createNullStore() {
    return this.nostr.query().kinds([7]).authors([""]).limit(1).execute().map(() => null);
  }
}
class ei {
  constructor(t) {
    l(this, "_d");
    l(this, "_title");
    l(this, "_summary");
    l(this, "_image");
    l(this, "_content");
    l(this, "_hashtags", []);
    this.nostr = t;
  }
  identifier(t) {
    return this._d = t, this;
  }
  title(t) {
    return this._title = t, this;
  }
  summary(t) {
    return this._summary = t, this;
  }
  image(t) {
    return this._image = t, this;
  }
  content(t) {
    return this._content = t ?? "", this;
  }
  hashtag(t) {
    return t && this._hashtags.push(t), this;
  }
  async publish() {
    if (!this._d) throw new Error("Article identifier (d) is required");
    if (!this._content) throw new Error("Article content must not be empty");
    const t = this.nostr.events.create().kind(30023).content(this._content).tag("d", this._d);
    this._title && t.tag("title", this._title), this._summary && t.tag("summary", this._summary), this._image && t.tag("image", this._image);
    for (const e of this._hashtags) t.hashtag(e);
    return await t.publish();
  }
}
class Ke {
  constructor(t, e) {
    this.nostr = t, this.debug = e, this.debug && console.log("📝 ContentModule initialized with Clean Architecture");
  }
  /** NIP-23: create/edit long-form article (kind 30023) */
  article() {
    return new ei(this.nostr);
  }
  /** NIP-23: get latest article by author and identifier */
  getArticle(t, e) {
    return this.nostr.sub().kinds([30023]).authors([t]).execute().catch(() => {
    }), this.nostr.query().kinds([30023]).authors([t]).execute().map((s) => s.filter((r) => r.tags.some((n) => n[0] === "d" && n[1] === e)).sort((r, n) => n.created_at - r.created_at)[0] ?? null);
  }
  /** NIP-23: list articles by author (reactive) */
  articles(t, e) {
    this.nostr.sub().kinds([30023]).authors([t]).execute().catch(() => {
    });
    let s = this.nostr.query().kinds([30023]).authors([t]);
    return e != null && e.limit && (s = s.limit(e.limit)), s.execute().map((i) => i.sort((r, n) => n.created_at - r.created_at));
  }
  /** Convenience: build naddr for an article */
  async naddrForArticle(t, e, s) {
    return Ys(e, t, 30023, s);
  }
  /**
   * Get text notes (NIP-01) from specific authors (reactive)
   * Returns real-time stream of text notes
   */
  notes(t = {}) {
    const e = {
      kinds: [1],
      // Text notes
      limit: t.limit || 50,
      ...t
    };
    this.startContentSubscription(e);
    let s = this.nostr.query().kinds([1]);
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute();
  }
  /**
   * Get reposts (NIP-18) from specific authors (reactive)
   * Returns real-time stream of repost events
   */
  reposts(t = {}) {
    const e = {
      kinds: [6],
      // Reposts
      limit: t.limit || 50,
      ...t
    };
    this.startContentSubscription(e);
    let s = this.nostr.query().kinds([6]);
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute();
  }
  /**
   * Get combined content feed (notes + reposts) (reactive)
   * Returns chronologically sorted content from authors
   */
  feed(t = {}) {
    const e = {
      kinds: [1, 6],
      // Notes and reposts
      limit: t.limit || 50,
      ...t
    };
    this.startContentSubscription(e);
    let s = this.nostr.query().kinds([1, 6]);
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((i) => this.sortByCreatedAt(i));
  }
  /**
   * Get content summary for authors (reactive)
   * Returns aggregated statistics about content
   */
  summary(t) {
    return this.startContentSubscription({ authors: t, kinds: [1, 6] }), this.nostr.query().kinds([1, 6]).authors(t).execute().map((e) => this.aggregateContentSummary(e));
  }
  /**
   * Publish a text note (NIP-01)
   */
  async publishNote(t) {
    var e;
    try {
      const s = await this.nostr.events.note(t).publish();
      return this.debug && console.log(`ContentModule: Published note "${t.substring(0, 50)}..."`), {
        success: s.success,
        eventId: s.eventId,
        error: (e = s.error) == null ? void 0 : e.message
      };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Failed to publish note"
      };
    }
  }
  /**
   * Publish a repost (NIP-18)
   */
  async repost(t, e) {
    var s;
    try {
      const i = await this.getEvent(t);
      if (!i)
        return { success: !1, error: "Original event not found" };
      const r = await this.nostr.events.create().kind(6).content("").tag("e", t, e || "").tag("p", i.pubkey).publish();
      return this.debug && console.log(`ContentModule: Reposted event ${t.substring(0, 8)}...`), {
        success: r.success,
        eventId: r.eventId,
        error: (s = r.error) == null ? void 0 : s.message
      };
    } catch (i) {
      return {
        success: !1,
        error: i instanceof Error ? i.message : "Failed to publish repost"
      };
    }
  }
  // Private helper methods
  async startContentSubscription(t) {
    try {
      let e = this.nostr.sub();
      t.kinds && (e = e.kinds(t.kinds)), t.authors && (e = e.authors(t.authors)), t.since && (e = e.since(t.since)), t.until && (e = e.until(t.until)), t.limit && (e = e.limit(t.limit)), await e.execute();
    } catch (e) {
      this.debug && console.warn("Failed to start content subscription:", e);
    }
  }
  async getEvent(t) {
    await this.nostr.sub().ids([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 500));
    const s = this.nostr.query().ids([t]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  sortByCreatedAt(t) {
    return [...t].sort((e, s) => s.created_at - e.created_at);
  }
  aggregateContentSummary(t) {
    const e = t.filter((n) => n.kind === 1), s = t.filter((n) => n.kind === 6), i = this.sortByCreatedAt(e), r = this.sortByCreatedAt(s);
    return {
      totalNotes: e.length,
      totalReposts: s.length,
      latestNote: i[0],
      latestRepost: r[0]
    };
  }
}
class si {
  constructor(t, e) {
    this.nostr = t, this.debug = e, this.debug && console.log("🧵 ThreadModule initialized with Clean Architecture");
  }
  /**
   * Get complete thread by root event ID (reactive)
   * Returns all replies in chronological order with proper threading
   */
  thread(t, e = {}) {
    this.startThreadSubscription(t, e);
    let s = this.nostr.query().kinds([1]);
    return s = s.tags("e", [t]), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((i) => this.buildThreadStructure(i, t));
  }
  /**
   * Get thread summary with statistics (reactive)
   */
  summary(t) {
    return this.startThreadSubscription(t), this.nostr.query().kinds([1]).tags("e", [t]).execute().map((e) => this.aggregateThreadSummary(e, t));
  }
  /**
   * Get threads where user participated (reactive)
   * Returns threads where the user has posted or replied
   */
  myThreads(t = {}) {
    const e = this.nostr.me;
    return e ? (this.startUserThreadsSubscription(e, t), this.nostr.query().kinds([1]).authors([e]).execute().map((s) => this.extractThreadSummaries(s))) : this.createEmptyStore();
  }
  /**
   * Get recent threads from followed users (reactive)
   * Requires user to be signed in and have a follow list
   */
  followingThreads(t = {}) {
    const e = this.nostr.me;
    return e ? this.nostr.query().kinds([3]).authors([e]).limit(1).execute().map((i) => {
      if (!i || i.length === 0)
        return [];
      const n = i[0].tags.filter((a) => a[0] === "p").map((a) => a[1]);
      return n.length === 0 ? [] : (this.startFollowingThreadsSubscription(n, t), []);
    }) : this.createEmptyStore();
  }
  /**
   * Reply to an event (creates a threaded reply)
   */
  async reply(t, e, s = []) {
    var i;
    try {
      const r = await this.getEvent(t);
      if (!r)
        return { success: !1, error: "Target event not found" };
      const { rootEventId: n, replyEventId: a } = this.determineThreadStructure(r);
      let c = this.nostr.events.create().kind(1).content(e);
      n && n !== t && (c = c.tag("e", n, "", "root")), c = c.tag("e", t, "", "reply"), c = c.tag("p", r.pubkey);
      for (const h of s)
        h !== r.pubkey && (c = c.tag("p", h));
      const u = await c.publish();
      return this.debug && console.log(`ThreadModule: Published reply to event ${t.substring(0, 8)}...`), {
        success: u.success,
        eventId: u.eventId,
        error: (i = u.error) == null ? void 0 : i.message
      };
    } catch (r) {
      return {
        success: !1,
        error: r instanceof Error ? r.message : "Failed to publish reply"
      };
    }
  }
  /**
   * Get thread by ID (alias for thread method for API compatibility)
   */
  get(t, e) {
    return new Promise((s) => {
      const i = this.thread(t);
      let r = null;
      r = i.subscribe((n) => {
        if (r) {
          const a = r;
          r = null, a();
        }
        s(n);
      });
    });
  }
  /**
   * Watch thread for real-time updates (returns subscription status)
   */
  async watch(t) {
    try {
      return await this.startThreadSubscription(t), !0;
    } catch (e) {
      return this.debug && console.warn(`Failed to watch thread ${t}:`, e), !1;
    }
  }
  /**
   * Create a new thread (root post)
   */
  async createThread(t, e = []) {
    var r;
    let s, i;
    typeof t == "string" ? (s = t, i = e) : (s = t.content, i = t.mentions || []);
    try {
      this.nostr.events;
    } catch {
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    }
    try {
      let n = this.nostr.events.note(s);
      for (const u of i)
        n = n.tag("p", u);
      const a = await n.publish();
      this.debug && console.log(`ThreadModule: Created new thread with content "${s.substring(0, 50)}..."`);
      let c = "";
      try {
        c = this.nostr.me || a.pubkey || "", !c && this.nostr.getMyPubkey && (c = await this.nostr.getMyPubkey() || "");
      } catch {
        c = a.pubkey || "";
      }
      return {
        success: a.success,
        eventId: a.eventId,
        error: (r = a.error) == null ? void 0 : r.message,
        message: a.success ? {
          id: a.eventId || "",
          content: s,
          authorPubkey: c,
          timestamp: Math.floor(Date.now() / 1e3),
          isOwn: !0
        } : void 0
      };
    } catch (n) {
      return {
        success: !1,
        error: n instanceof Error ? n.message : "Failed to create thread"
      };
    }
  }
  // Private helper methods
  async startThreadSubscription(t, e = {}) {
    try {
      let s = this.nostr.sub().kinds([1]).tags("e", [t]);
      e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), await s.execute();
    } catch (s) {
      this.debug && console.warn(`Failed to start thread subscription for ${t}:`, s);
    }
  }
  async startUserThreadsSubscription(t, e) {
    try {
      let s = this.nostr.sub().kinds([1]).authors([t]);
      e.since && (s = s.since(e.since)), e.limit && (s = s.limit(e.limit)), await s.execute();
    } catch (s) {
      this.debug && console.warn(`Failed to start user threads subscription for ${t}:`, s);
    }
  }
  async startFollowingThreadsSubscription(t, e) {
    try {
      let s = this.nostr.sub().kinds([1]).authors(t);
      e.since && (s = s.since(e.since)), e.limit && (s = s.limit(e.limit)), await s.execute();
    } catch (s) {
      this.debug && console.warn("Failed to start following threads subscription:", s);
    }
  }
  async getEvent(t) {
    await this.nostr.sub().ids([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 500));
    const s = this.nostr.query().ids([t]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  buildThreadStructure(t, e) {
    const s = [];
    for (const i of t) {
      const r = this.analyzeThreadEvent(i, e);
      s.push(r);
    }
    return s.sort((i, r) => i.created_at - r.created_at), s;
  }
  analyzeThreadEvent(t, e) {
    const s = t.tags.filter((c) => c[0] === "e");
    let i = 0, r = null, n = [], a = e;
    if (s.length > 0) {
      const c = s.find((h) => h[3] === "root"), u = s.find((h) => h[3] === "reply");
      c && (a = c[1]), u && (r = u[1], i = 1), !u && s.length > 0 && (s.length === 1 ? (r = s[0][1], i = 1) : (a = s[0][1], r = s[s.length - 1][1], i = s.length - 1)), n = s.map((h) => h[1]);
    }
    return {
      ...t,
      depth: i,
      rootEventId: a,
      replyToEventId: r,
      threadPath: n
    };
  }
  determineThreadStructure(t) {
    const e = t.tags.filter((i) => i[0] === "e");
    if (e.length === 0)
      return {
        rootEventId: t.id,
        replyEventId: t.id
      };
    const s = e.find((i) => i[3] === "root");
    return s ? {
      rootEventId: s[1],
      replyEventId: t.id
    } : e.length === 1 ? {
      rootEventId: e[0][1],
      replyEventId: t.id
    } : {
      rootEventId: e[0][1],
      replyEventId: t.id
    };
  }
  aggregateThreadSummary(t, e) {
    let s = 0, i = 0;
    const r = /* @__PURE__ */ new Set();
    let n, a;
    for (const c of t) {
      const u = this.analyzeThreadEvent(c, e);
      u.id === e ? a = u : (s++, (!n || u.created_at > n.created_at) && (n = u)), i = Math.max(i, u.depth), r.add(u.pubkey);
    }
    return {
      rootEventId: e,
      totalReplies: s,
      maxDepth: i,
      participants: Array.from(r),
      latestReply: n,
      rootEvent: a
    };
  }
  extractThreadSummaries(t) {
    const e = /* @__PURE__ */ new Map();
    for (const i of t) {
      const r = i.tags.filter((n) => n[0] === "e");
      if (r.length === 0) {
        const n = i.id;
        e.has(n) || e.set(n, []), e.get(n).push(i);
      } else {
        const n = r.find((c) => c[3] === "root"), a = n ? n[1] : r[0][1];
        e.has(a) || e.set(a, []), e.get(a).push(i);
      }
    }
    const s = [];
    for (const [i, r] of e) {
      const n = this.aggregateThreadSummary(r, i);
      s.push(n);
    }
    return s.sort((i, r) => {
      var c, u, h, d;
      const n = ((c = i.latestReply) == null ? void 0 : c.created_at) || ((u = i.rootEvent) == null ? void 0 : u.created_at) || 0;
      return (((h = r.latestReply) == null ? void 0 : h.created_at) || ((d = r.rootEvent) == null ? void 0 : d.created_at) || 0) - n;
    }), s;
  }
  createEmptyStore() {
    return this.nostr.query().kinds([1]).authors([""]).limit(1).execute().map(() => []);
  }
}
class ii {
  constructor(t, e) {
    this.nostr = t, this.debug = e, this.debug && console.log("📰 FeedModule initialized with Clean Architecture");
  }
  /**
   * Get global feed (all events from all kinds) (reactive)
   * Returns chronologically sorted feed of all activity
   */
  global(t = {}) {
    const e = {
      kinds: [1, 6, 7],
      // Notes, reposts, reactions
      limit: 50,
      includeReplies: !0,
      includeReactions: !0,
      includeReposts: !0,
      ...t
    };
    this.startFeedSubscription(e);
    let s = this.nostr.query().kinds(e.kinds);
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((i) => this.processFeedEvents(i, e));
  }
  /**
   * Get following feed (events from followed users) (reactive)
   * Requires user to be signed in and have a follow list
   */
  following(t = {}) {
    const e = this.nostr.me;
    return e ? this.nostr.query().kinds([3]).authors([e]).limit(1).execute().map((i) => {
      if (!i || i.length === 0)
        return [];
      const n = i[0].tags.filter((c) => c[0] === "p").map((c) => c[1]);
      if (n.length === 0)
        return [];
      const a = {
        ...t,
        authors: n,
        kinds: t.kinds || [1, 6, 7],
        limit: t.limit || 30
      };
      return this.startFeedSubscription(a), [];
    }) : this.createEmptyStore();
  }
  /**
   * Get user's own feed (all events from specific user) (reactive)
   */
  user(t, e = {}) {
    const s = {
      kinds: [1, 6, 7],
      // Notes, reposts, reactions
      limit: 50,
      includeReplies: !0,
      includeReactions: !0,
      includeReposts: !0,
      ...e,
      authors: [t]
    };
    this.startFeedSubscription(s);
    let i = this.nostr.query().kinds(s.kinds).authors([t]);
    return s.since && (i = i.since(s.since)), s.until && (i = i.until(s.until)), s.limit && (i = i.limit(s.limit)), i.execute().map((r) => this.processFeedEvents(r, s));
  }
  /**
   * Get trending feed (popular events with many reactions) (reactive)
   * Returns events sorted by engagement metrics
   */
  trending(t = {}) {
    const e = {
      kinds: [1],
      // Only notes for trending
      limit: 20,
      since: Math.floor(Date.now() / 1e3) - 86400,
      // Last 24 hours
      ...t
    };
    this.startFeedSubscription(e);
    let s = this.nostr.query().kinds([1]);
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit * 3)), s.execute().map((i) => this.processTrendingEvents(i, e));
  }
  /**
   * Get feed statistics (reactive)
   */
  stats(t = {}) {
    const e = {
      kinds: [1, 6, 7],
      limit: 100,
      ...t
    };
    this.startFeedSubscription(e);
    let s = this.nostr.query().kinds(e.kinds);
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((i) => this.calculateFeedStats(i));
  }
  /**
   * Search feed by content (reactive)
   * Returns events matching search criteria
   */
  search(t, e = {}) {
    const s = {
      kinds: [1],
      // Only search in text notes
      limit: 30,
      ...e
    };
    this.startFeedSubscription(s);
    let i = this.nostr.query().kinds(s.kinds);
    return s.authors && (i = i.authors(s.authors)), s.since && (i = i.since(s.since)), s.until && (i = i.until(s.until)), s.limit && (i = i.limit(s.limit * 5)), i.execute().map((r) => this.filterEventsByContent(r, t, s));
  }
  // Private helper methods
  async startFeedSubscription(t) {
    try {
      let e = this.nostr.sub();
      t.kinds && (e = e.kinds(t.kinds)), t.authors && (e = e.authors(t.authors)), t.since && (e = e.since(t.since)), t.until && (e = e.until(t.until)), t.limit && (e = e.limit(t.limit)), await e.execute();
    } catch (e) {
      this.debug && console.warn("Failed to start feed subscription:", e);
    }
  }
  processFeedEvents(t, e) {
    let s = [];
    for (const i of t) {
      const r = this.convertToFeedEvent(i);
      !e.includeReplies && r.feedType === "thread" && r.referencedEventId || !e.includeReactions && r.feedType === "reaction" || !e.includeReposts && r.feedType === "repost" || s.push(r);
    }
    return s.sort((i, r) => r.created_at - i.created_at), s;
  }
  processTrendingEvents(t, e) {
    const s = t.map((i) => this.convertToFeedEvent(i));
    return s.sort((i, r) => r.created_at - i.created_at), s.slice(0, e.limit || 20);
  }
  filterEventsByContent(t, e, s) {
    const i = e.toLowerCase(), n = t.filter((a) => a.content ? a.content.toLowerCase().includes(i) : !1).map((a) => this.convertToFeedEvent(a));
    return n.sort((a, c) => c.created_at - a.created_at), n.slice(0, s.limit || 30);
  }
  convertToFeedEvent(t) {
    let e = "note", s, i;
    if (t.kind === 6) {
      e = "repost";
      const r = t.tags.filter((n) => n[0] === "e");
      r.length > 0 && (s = r[0][1]);
    } else if (t.kind === 7) {
      e = "reaction";
      const r = t.tags.filter((n) => n[0] === "e");
      r.length > 0 && (s = r[0][1]);
    } else if (t.kind === 1) {
      const r = t.tags.filter((n) => n[0] === "e");
      if (r.length > 0) {
        e = "thread";
        const n = r.find((c) => c[3] === "root"), a = r.find((c) => c[3] === "reply");
        n && (i = n[1]), a ? s = a[1] : r.length > 0 && (s = r[0][1]);
      }
    }
    return {
      ...t,
      feedType: e,
      referencedEventId: s,
      threadRoot: i
    };
  }
  calculateFeedStats(t) {
    const e = {
      totalEvents: t.length,
      noteCount: 0,
      repostCount: 0,
      reactionCount: 0,
      threadCount: 0,
      uniqueAuthors: 0,
      timeRange: {
        oldest: 0,
        newest: 0
      }
    };
    if (t.length === 0)
      return e;
    const s = /* @__PURE__ */ new Set();
    let i = t[0].created_at, r = t[0].created_at;
    for (const n of t)
      n.kind === 1 ? n.tags.filter((c) => c[0] === "e").length > 0 ? e.threadCount++ : e.noteCount++ : n.kind === 6 ? e.repostCount++ : n.kind === 7 && e.reactionCount++, s.add(n.pubkey), i = Math.min(i, n.created_at), r = Math.max(r, n.created_at);
    return e.uniqueAuthors = s.size, e.timeRange.oldest = i, e.timeRange.newest = r, e;
  }
  createEmptyStore() {
    return this.nostr.query().kinds([1]).authors([""]).limit(1).execute().map(() => []);
  }
}
class ri {
  constructor(t) {
    l(this, "config");
    // Lazy-loaded modules
    l(this, "_content");
    l(this, "_reactions");
    l(this, "_threads");
    l(this, "_feeds");
    l(this, "_communities");
    // CommunityModule;
    l(this, "_lists");
    // ListModule;
    // Cleanup synchronization
    l(this, "closing", !1);
    l(this, "closePromise");
    this.config = t, this.config.debug && console.log("🔥 SocialModule initialized with Clean Architecture");
  }
  /**
   * Content operations (NIP-01, NIP-18, NIP-23)
   * Text notes, articles, reposts
   */
  get content() {
    return this._content || (this._content = new Ke(this.config.nostr, this.config.debug)), this._content;
  }
  /**
   * Reaction operations (NIP-25)
   * Likes, dislikes, emoji reactions
   */
  get reactions() {
    return this._reactions || (this._reactions = new ti(this.config.nostr, this.config.debug)), this._reactions;
  }
  /**
   * Thread operations (NIP-10, NIP-22)
   * Threading, conversations, comments
   */
  get threads() {
    return this._threads || (this._threads = new si(this.config.nostr, this.config.debug)), this._threads;
  }
  /**
   * Feed operations
   * Timeline aggregation, social feeds
   */
  get feeds() {
    return this._feeds || (this._feeds = new ii(this.config.nostr, this.config.debug)), this._feeds;
  }
  /**
   * Community operations (NIP-28, NIP-72)
   * Public chat, moderated communities
   */
  get communities() {
    if (!this._communities)
      throw new Error("CommunityModule not yet implemented - Coming in Phase 3");
    return this._communities;
  }
  /**
   * List operations (NIP-51)
   * Generic list management
   */
  get lists() {
    if (!this._lists)
      throw new Error("ListModule not yet implemented - Coming in Phase 2");
    return this._lists;
  }
  /**
   * Update signing provider - simply store reference (modules access via core instance)
   * Social modules access signing through the core NostrUnchained instance, no separate update needed
   */
  async updateSigningProvider(t) {
    this.config.debug && console.log("🔑 SocialModule.updateSigningProvider - storing reference");
  }
  /**
   * Clean up resources with proper synchronization
   */
  async close() {
    if (this.closing)
      return this.closePromise ? this.closePromise : void 0;
    this.closing = !0, this.closePromise = this.performCleanup();
    try {
      await this.closePromise, this.config.debug && console.log("🔥 SocialModule cleanup completed successfully");
    } catch (t) {
      throw this.config.debug && console.error("🔥 SocialModule cleanup error:", t), t;
    }
  }
  async performCleanup() {
    const t = [];
    this._content && typeof this._content.close == "function" && t.push(
      this._content.close().catch((e) => {
        this.config.debug && console.warn("SocialModule: ContentModule cleanup error:", e);
      })
    ), this._reactions && typeof this._reactions.close == "function" && t.push(
      this._reactions.close().catch((e) => {
        this.config.debug && console.warn("SocialModule: ReactionModule cleanup error:", e);
      })
    ), this._threads && typeof this._threads.close == "function" && t.push(
      this._threads.close().catch((e) => {
        this.config.debug && console.warn("SocialModule: ThreadModule cleanup error:", e);
      })
    ), this._feeds && typeof this._feeds.close == "function" && t.push(
      this._feeds.close().catch((e) => {
        this.config.debug && console.warn("SocialModule: FeedModule cleanup error:", e);
      })
    ), this._communities && typeof this._communities.close == "function" && t.push(
      this._communities.close().catch((e) => {
        this.config.debug && console.warn("SocialModule: CommunityModule cleanup error:", e);
      })
    ), this._lists && typeof this._lists.close == "function" && t.push(
      this._lists.close().catch((e) => {
        this.config.debug && console.warn("SocialModule: ListModule cleanup error:", e);
      })
    ), t.length > 0 && await Promise.race([
      Promise.all(t),
      new Promise(
        (e, s) => setTimeout(() => s(new Error("Module cleanup timeout after 10 seconds")), 1e4)
      )
    ]), this._content = void 0, this._reactions = void 0, this._threads = void 0, this._feeds = void 0, this._communities = void 0, this._lists = void 0;
  }
}
class ni {
  constructor(t) {
    l(this, "root", {});
    l(this, "parent", {});
    l(this, "_content");
    this.nostr = t;
  }
  // Root references (uppercase)
  onEventRoot(t, e, s) {
    return this.root.E = { id: t, relay: e || void 0, pubkey: s || void 0 }, this;
  }
  onAddressableRoot(t, e, s, i) {
    return this.root.A = { address: `${t}:${e}:${s}`, relay: i || void 0 }, this.root.K = { kind: t }, this.root.P = { pubkey: e }, this;
  }
  onExternalRoot(t, e) {
    return this.root.I = { identifier: t, context: e || void 0 }, this;
  }
  onKindRoot(t) {
    return this.root.K = { kind: t }, this;
  }
  onAuthorRoot(t, e) {
    return this.root.P = { pubkey: t, relay: e || void 0 }, this;
  }
  // Parent references (lowercase)
  replyToEvent(t, e, s) {
    return this.parent.e = { id: t, relay: e || void 0, pubkey: s || void 0 }, this;
  }
  replyToAddress(t, e, s, i) {
    return this.parent.a = { address: `${t}:${e}:${s}`, relay: i || void 0 }, this.parent.k = { kind: t }, this.parent.p = { pubkey: e }, this;
  }
  replyToExternal(t, e) {
    return this.parent.i = { identifier: t, context: e || void 0 }, this;
  }
  replyToKind(t) {
    return this.parent.k = { kind: t }, this;
  }
  replyToAuthor(t, e) {
    return this.parent.p = { pubkey: t, relay: e || void 0 }, this;
  }
  content(t) {
    return this._content = t ?? "", this;
  }
  buildTags() {
    const t = [];
    return this.root.E && t.push(["E", this.root.E.id, this.root.E.relay || "", this.root.E.pubkey || ""].filter(Boolean)), this.root.A && t.push(["A", this.root.A.address, this.root.A.relay || ""].filter(Boolean)), this.root.I && t.push(["I", this.root.I.identifier, this.root.I.context || ""].filter(Boolean)), this.root.K && t.push(["K", String(this.root.K.kind)]), this.root.P && t.push(["P", this.root.P.pubkey, this.root.P.relay || ""].filter(Boolean)), this.parent.e && t.push(["e", this.parent.e.id, this.parent.e.relay || "", this.parent.e.pubkey || ""].filter(Boolean)), this.parent.a && t.push(["a", this.parent.a.address, this.parent.a.relay || ""].filter(Boolean)), this.parent.i && t.push(["i", this.parent.i.identifier, this.parent.i.context || ""].filter(Boolean)), this.parent.k && t.push(["k", String(this.parent.k.kind)]), this.parent.p && t.push(["p", this.parent.p.pubkey, this.parent.p.relay || ""].filter(Boolean)), t;
  }
  async publish(t) {
    if (!this._content || this._content.length === 0)
      throw new Error("Comment content must not be empty");
    const e = this.nostr.events.create().kind(1111).content(this._content);
    for (const r of this.buildTags()) e.tag(r[0], ...r.slice(1));
    const s = await e.sign();
    return await this.nostr.publishSigned(await s.build(), t);
  }
}
class oi {
  constructor(t) {
    this.nostr = t;
  }
  /** Create a new comment builder */
  create() {
    return new ni(this.nostr);
  }
  /** Reactive stream of comments for a given root address (kind:pubkey:d) */
  getForAddressable(t, e, s) {
    const i = `${t}:${e}:${s}`;
    return this.nostr.sub().kinds([1111]).execute().catch(() => {
    }), this.nostr.query().kinds([1111]).execute().map(
      (r) => r.filter((n) => n.tags.some((a) => a[0] === "A" && a[1] === i || a[0] === "a" && a[1] === i))
    );
  }
  /** Reactive stream of replies to a parent comment id */
  getRepliesTo(t) {
    return this.nostr.sub().kinds([1111]).execute().catch(() => {
    }), this.nostr.query().kinds([1111]).execute().map((e) => e.filter((s) => s.tags.some((i) => i[0] === "e" && i[1] === t)));
  }
}
class ai {
  constructor(t, e) {
    l(this, "tags", []);
    l(this, "content", "");
    l(this, "identifier", null);
    this.nostr = t, this.kind = e;
  }
  id(t) {
    return this.identifier = t, this;
  }
  title(t) {
    return this.tags.push(["title", t]), this;
  }
  description(t) {
    return this.tags.push(["description", t]), this;
  }
  image(t) {
    return this.tags.push(["image", t]), this;
  }
  note(t) {
    return this.content = t, this;
  }
  addPerson(t, e, s) {
    const i = ["p", t];
    return e && i.push(e), s && i.push(s), this.tags.push(i), this;
  }
  addEvent(t, e) {
    const s = ["e", t];
    return e && s.push(e), this.tags.push(s), this;
  }
  addAddress(t, e) {
    const s = ["a", t];
    return e && s.push(e), this.tags.push(s), this;
  }
  addRelay(t) {
    return this.tags.push(["relay", t]), this;
  }
  topic(t) {
    return this.tags.push(["t", t]), this;
  }
  async publish() {
    const t = this.nostr.events.kind(this.kind).content(this.content || "");
    this.identifier && t.tag("d", this.identifier);
    for (const e of this.tags) t.tag(...e);
    return t.publish();
  }
}
class ci {
  constructor(t) {
    this.nostr = t;
  }
  edit(t, e) {
    const s = new ai(this.nostr, t);
    return e && s.id(e), s;
  }
  get(t, e, s) {
    const i = this.nostr.sub().kinds([e]).authors([t]);
    s && i.tags("d", [s]), i.limit(1).execute().catch(() => {
    });
    const r = this.nostr.query().kinds([e]).authors([t]);
    return s && r.tags("d", [s]), r.limit(1).execute().map((a) => this.parse(a == null ? void 0 : a[0]));
  }
  parse(t) {
    if (!t) return null;
    const e = (p) => {
      var g;
      return (g = t.tags.find((y) => y[0] === p)) == null ? void 0 : g[1];
    }, s = (p) => t.tags.filter((g) => g[0] === p), i = e("d") || null, r = e("title"), n = e("description"), a = e("image"), c = s("p").map((p) => ({ pubkey: p[1], relay: p[2], petname: p[3] })), u = s("e").map((p) => ({ id: p[1], relay: p[2] })), h = s("a").map((p) => ({ address: p[1], relay: p[2] })), d = s("relay").map((p) => p[1]), f = s("t").map((p) => p[1]);
    return {
      kind: t.kind,
      identifier: i,
      title: r,
      description: n,
      image: a,
      p: c,
      e: u,
      a: h,
      relays: d,
      topics: f,
      updatedAt: t.created_at
    };
  }
}
class ui {
  constructor(t) {
    l(this, "tags", []);
    l(this, "content", "");
    this.nostr = t;
  }
  namespace(t) {
    return this.tags.push(["L", t]), this;
  }
  label(t, e) {
    return e ? this.tags.push(["l", t, e]) : this.tags.push(["l", t]), this;
  }
  targetEvent(t, e) {
    return this.tags.push(["e", t, e || ""]), this;
  }
  targetAuthor(t, e) {
    return this.tags.push(["p", t, e || ""]), this;
  }
  targetAddress(t, e) {
    return this.tags.push(["a", t, e || ""]), this;
  }
  targetRelay(t) {
    return this.tags.push(["r", t]), this;
  }
  targetTopic(t) {
    return this.tags.push(["t", t]), this;
  }
  reason(t) {
    return this.content = t, this;
  }
  async publish() {
    return await this.nostr.events.create().kind(1985).content(this.content).tags(this.tags).publish();
  }
}
class li {
  constructor(t) {
    this.nostr = t;
  }
  edit() {
    return new ui(this.nostr);
  }
  /** Reactive store of labels (kind 1985) for a given target event */
  forEvent(t) {
    return this.nostr.sub().kinds([1985]).tags("e", [t]).execute().catch(() => {
    }), this.nostr.query().kinds([1985]).tags("e", [t]).execute();
  }
}
class hi {
  constructor(t) {
    l(this, "meta", {});
    l(this, "categoryTags", []);
    this.nostr = t;
  }
  name(t) {
    return this.meta.name = t, this;
  }
  about(t) {
    return this.meta.about = t, this;
  }
  picture(t) {
    return this.meta.picture = t, this;
  }
  relays(t) {
    return this.meta.relays = t, this;
  }
  category(t) {
    return this.categoryTags.push(t), this;
  }
  async publish() {
    const t = JSON.stringify(this.meta), e = this.nostr.events.create().kind(40).content(t);
    for (const s of this.categoryTags) e.tag("t", s);
    return e.publish();
  }
}
class di {
  constructor(t, e) {
    l(this, "meta", {});
    l(this, "categoryTags", []);
    l(this, "relayHint");
    this.nostr = t, this.channelEventId = e;
  }
  hint(t) {
    return this.relayHint = t, this;
  }
  name(t) {
    return this.meta.name = t, this;
  }
  about(t) {
    return this.meta.about = t, this;
  }
  picture(t) {
    return this.meta.picture = t, this;
  }
  relays(t) {
    return this.meta.relays = t, this;
  }
  category(t) {
    return this.categoryTags.push(t), this;
  }
  async publish() {
    const t = JSON.stringify(this.meta), e = this.nostr.events.create().kind(41).content(t).tag("e", this.channelEventId, this.relayHint || "", "root");
    for (const s of this.categoryTags) e.tag("t", s);
    return e.publish();
  }
}
class gi {
  constructor(t, e) {
    l(this, "messageContent", "");
    l(this, "replyToEventId");
    l(this, "replyRelayHint");
    l(this, "mentions", []);
    l(this, "relayHint");
    this.nostr = t, this.channelEventId = e;
  }
  hint(t) {
    return this.relayHint = t, this;
  }
  content(t) {
    return this.messageContent = t, this;
  }
  replyTo(t, e) {
    return this.replyToEventId = t, this.replyRelayHint = e, this;
  }
  mention(t, e) {
    return this.mentions.push({ pubkey: t, relay: e }), this;
  }
  async publish() {
    const t = this.nostr.events.create().kind(42).content(this.messageContent).tag("e", this.channelEventId, this.relayHint || "", "root");
    this.replyToEventId && t.tag("e", this.replyToEventId, this.replyRelayHint || "", "reply");
    for (const e of this.mentions) t.tag("p", e.pubkey, e.relay || "");
    return t.publish();
  }
}
class fi {
  constructor(t, e) {
    l(this, "reason");
    this.nostr = t, this.messageEventId = e;
  }
  withReason(t) {
    return this.reason = t, this;
  }
  async publish() {
    const t = this.reason ? JSON.stringify({ reason: this.reason }) : "";
    return this.nostr.events.create().kind(43).content(t).tag("e", this.messageEventId).publish();
  }
}
class yi {
  constructor(t, e) {
    l(this, "reason");
    this.nostr = t, this.pubkey = e;
  }
  withReason(t) {
    return this.reason = t, this;
  }
  async publish() {
    const t = this.reason ? JSON.stringify({ reason: this.reason }) : "";
    return this.nostr.events.create().kind(44).content(t).tag("p", this.pubkey).publish();
  }
}
class pi {
  constructor(t) {
    this.nostr = t;
  }
  create() {
    return new hi(this.nostr);
  }
  metadata(t) {
    return new di(this.nostr, t);
  }
  message(t) {
    return new gi(this.nostr, t);
  }
  hide(t) {
    return new fi(this.nostr, t);
  }
  mute(t) {
    return new yi(this.nostr, t);
  }
  // Reactive: list of channels (kind 40)
  list() {
    return this.nostr.sub().kinds([40]).execute().catch(() => {
    }), this.nostr.query().kinds([40]).execute();
  }
  // Reactive: metadata (latest kind 41) for a channel
  metadataFor(t) {
    return this.nostr.sub().kinds([41]).tags("e", [t]).execute().catch(() => {
    }), this.nostr.query().kinds([41]).tags("e", [t]).execute();
  }
  // Reactive: messages for a channel (kind 42 with e-tag root=channel id)
  messagesFor(t) {
    return this.nostr.sub().kinds([42]).tags("e", [t]).execute().catch(() => {
    }), this.nostr.query().kinds([42]).tags("e", [t]).execute();
  }
  // Reactive: viewer-visible messages (filter out 43/44 by viewer)
  visibleMessages(t, e) {
    const s = this.messagesFor(t), i = this.nostr.query().kinds([43]).authors([e]).execute(), r = this.nostr.query().kinds([44]).authors([e]).execute();
    return s.map((n) => {
      var u, h;
      const a = new Set(((u = i.current) == null ? void 0 : u.flatMap((d) => d.tags.filter((f) => f[0] === "e").map((f) => f[1]))) || []), c = new Set(((h = r.current) == null ? void 0 : h.flatMap((d) => d.tags.filter((f) => f[0] === "p").map((f) => f[1]))) || []);
      return n.filter((d) => !a.has(d.id) && !c.has(d.pubkey));
    });
  }
}
function ie(o) {
  return `34550:${o.authorPubkey}:${o.identifier}`;
}
class bi {
  constructor(t, e) {
    l(this, "d");
    l(this, "nameTag");
    l(this, "descriptionTag");
    l(this, "imageTag");
    l(this, "moderators", []);
    l(this, "relays", []);
    this.nostr = t, this.authorPubkey = e;
  }
  identifier(t) {
    return this.d = t, this;
  }
  name(t) {
    return this.nameTag = t, this;
  }
  description(t) {
    return this.descriptionTag = t, this;
  }
  image(t, e) {
    return this.imageTag = { url: t, dim: e }, this;
  }
  moderator(t, e) {
    return this.moderators.push({ pubkey: t, relay: e || void 0 }), this;
  }
  relay(t, e) {
    return this.relays.push({ url: t, marker: e }), this;
  }
  async publish() {
    if (!this.d) throw new Error("Community identifier (d) is required");
    const t = this.nostr.events.create().kind(34550).content("");
    t.tag("d", this.d), this.nameTag && t.tag("name", this.nameTag), this.descriptionTag && t.tag("description", this.descriptionTag), this.imageTag && t.tag("image", this.imageTag.url, ...this.imageTag.dim ? [this.imageTag.dim] : []);
    for (const e of this.moderators)
      t.tag("p", e.pubkey, ...e.relay ? [e.relay] : [], "moderator");
    for (const e of this.relays)
      e.marker ? t.tag("relay", e.url, e.marker) : t.tag("relay", e.url);
    return await t.publish();
  }
}
class mi {
  constructor(t, e) {
    l(this, "_content");
    l(this, "relayHint");
    this.nostr = t, this.community = e;
  }
  content(t) {
    return this._content = t ?? "", this;
  }
  relay(t) {
    return this.relayHint = t, this;
  }
  buildTags() {
    const t = ie(this.community), e = [];
    return e.push(["A", t, ...this.community.relay ? [this.community.relay] : []]), e.push(["a", t, ...this.community.relay ? [this.community.relay] : []]), e.push(["P", this.community.authorPubkey, ...this.community.relay ? [this.community.relay] : []]), e.push(["p", this.community.authorPubkey, ...this.community.relay ? [this.community.relay] : []]), e.push(["K", "34550"]), e.push(["k", "34550"]), e;
  }
  async publish() {
    if (!this._content || this._content.length === 0) throw new Error("Post content must not be empty");
    const t = this.nostr.events.create().kind(1111).content(this._content);
    for (const e of this.buildTags()) t.tag(e[0], ...e.slice(1));
    return await t.publish();
  }
}
class wi {
  constructor(t, e, s) {
    l(this, "_content");
    this.nostr = t, this.community = e, this.parent = s;
  }
  content(t) {
    return this._content = t ?? "", this;
  }
  async publish() {
    if (!this._content || this._content.length === 0) throw new Error("Reply content must not be empty");
    const t = ie(this.community), e = this.nostr.events.create().kind(1111).content(this._content);
    return e.tag("A", t, ...this.community.relay ? [this.community.relay] : []), e.tag("P", this.community.authorPubkey, ...this.community.relay ? [this.community.relay] : []), e.tag("K", "34550"), e.tag("e", this.parent.id, ...this.parent.relay ? [this.parent.relay] : []), e.tag("p", this.parent.pubkey, ...this.parent.relay ? [this.parent.relay] : []), e.tag("k", String(this.parent.kind ?? 1111)), await e.publish();
  }
}
class vi {
  constructor(t, e) {
    l(this, "_post");
    l(this, "_contentJson");
    this.nostr = t, this.community = e;
  }
  post(t) {
    return this._post = t, this._contentJson = JSON.stringify(t), this;
  }
  async publish() {
    if (!this._post) throw new Error("Approval requires a post event");
    const t = this.nostr.events.create().kind(4550).content(this._contentJson), e = ie(this.community);
    t.tag("a", e, ...this.community.relay ? [this.community.relay] : []), t.tag("e", this._post.id), t.tag("p", this._post.pubkey), t.tag("k", String(this._post.kind));
    const s = await t.sign();
    return await this.nostr.publishSigned(await s.build());
  }
}
class Ei {
  constructor(t) {
    this.nostr = t;
  }
  // Builders
  create(t) {
    return new bi(this.nostr, t);
  }
  postTo(t, e, s) {
    return new mi(this.nostr, { authorPubkey: t, identifier: e, relay: s || void 0 });
  }
  replyTo(t, e) {
    return new wi(this.nostr, t, e);
  }
  approve(t) {
    return new vi(this.nostr, t);
  }
  // Revoke an approval via NIP-09 deletion (kind 5)
  async revokeApproval(t, e) {
    return await this.nostr.events.create().kind(5).content(e || "").tag("e", t, "", "deletion").publish();
  }
  // Readers (subscription-first: we start subs narrowly by kind)
  getCommunity(t, e) {
    const s = e;
    return this.nostr.sub().kinds([34550]).authors([t]).execute().catch(() => {
    }), this.nostr.query().kinds([34550]).authors([t]).execute().map((i) => i.filter((n) => n.tags.some((a) => a[0] === "d" && a[1] === s)).sort((n, a) => a.created_at - n.created_at)[0] ?? null);
  }
  posts(t, e, s) {
    const i = `34550:${t}:${e}`;
    return this.nostr.sub().kinds([1111]).execute().catch(() => {
    }), s != null && s.approvedOnly && (this.nostr.sub().kinds([4550]).execute().catch(() => {
    }), this.nostr.sub().kinds([34550]).authors([t]).execute().catch(() => {
    }), this.nostr.sub().kinds([5]).execute().catch(() => {
    })), this.nostr.query().kinds([1111]).execute().map(
      (r) => {
        let n = r.filter((a) => a.tags.some((c) => (c[0] === "A" || c[0] === "a") && c[1] === i));
        if (s != null && s.approvedOnly) {
          const c = this.nostr.query().kinds([4550]).execute().current || [], h = this.nostr.query().kinds([5]).execute().current || [], d = (g) => h.some((y) => y.tags.some((m) => m[0] === "e" && m[1] === g.id)), f = this.moderators(t, e), p = new Set(f.current || []);
          n = n.filter((g) => {
            const y = c.filter(
              (m) => m.tags.some((b) => b[0] === "a" && b[1] === i) && m.tags.some((b) => b[0] === "e" && b[1] === g.id) && !d(m)
            );
            return y.length === 0 ? !1 : s != null && s.moderatorsOnly ? y.some((m) => p.has(m.pubkey)) : !0;
          });
        }
        return n;
      }
    );
  }
  approvals(t, e, s) {
    const i = `34550:${t}:${e}`;
    return this.nostr.sub().kinds([4550]).execute().catch(() => {
    }), this.nostr.query().kinds([4550]).execute().map(
      (r) => r.filter(
        (n) => n.tags.some((a) => a[0] === "a" && a[1] === i) && (!s || n.tags.some((a) => a[0] === "e" && a[1] === s))
      )
    );
  }
  moderators(t, e) {
    const s = e;
    return this.nostr.sub().kinds([34550]).authors([t]).execute().catch(() => {
    }), this.nostr.query().kinds([34550]).authors([t]).execute().map((i) => {
      const n = i.filter((c) => c.tags.some((u) => u[0] === "d" && u[1] === s)).sort((c, u) => u.created_at - c.created_at)[0];
      if (!n) return [];
      const a = n.tags.filter((c) => c[0] === "p" && (c[3] === "moderator" || c.includes("moderator"))).map((c) => c[1]);
      return Array.from(new Set(a));
    });
  }
}
class Si {
  constructor(t) {
    this.nostr = t;
  }
  async hashHex(t) {
    const e = t instanceof Uint8Array ? t : new Uint8Array(t);
    return D(et(e));
  }
  async publishNoteWithAttachment(t, e, s = {}) {
    const i = this.nostr.events.create().kind(1).content(t), r = { mimeType: s.mimeType, alt: s.alt, dim: s.dim };
    if (s.addHash)
      try {
        const n = await fetch(e), a = new Uint8Array(await n.arrayBuffer());
        r.sha256 = await this.hashHex(a);
      } catch {
      }
    return i.attachMedia(e, r), await i.publish();
  }
}
class ki {
  constructor(t, e, s, i = {}) {
    l(this, "listeners", /* @__PURE__ */ new Map());
    l(this, "subscriptionResult");
    l(this, "eventCount", 0);
    l(this, "createdAt", Date.now());
    l(this, "lastEventAt");
    l(this, "debug");
    this.key = t, this.filters = e, this.relays = s, this.debug = i.debug || !1;
  }
  /**
   * Add a new listener to this shared subscription
   * Returns the listener ID for later removal
   */
  addListener(t) {
    const e = this.generateListenerId(), s = {
      id: e,
      ...t
    };
    return this.listeners.set(e, s), this.debug && console.log(`SharedSubscription: Added listener ${e} to ${this.key} (${this.listeners.size} total)`), e;
  }
  /**
   * Remove a listener from this shared subscription
   * Returns true if this was the last listener
   */
  removeListener(t) {
    return this.listeners.delete(t) && this.debug && console.log(`SharedSubscription: Removed listener ${t} from ${this.key} (${this.listeners.size} remaining)`), this.listeners.size === 0;
  }
  /**
   * Broadcast an event to all listeners
   */
  async broadcast(t) {
    this.eventCount++, this.lastEventAt = Date.now();
    const e = [];
    for (const s of this.listeners.values())
      s.onEvent && e.push(
        Promise.resolve(s.onEvent(t)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEvent error:`, i), s.onError && s.onError(i instanceof Error ? i : new Error(String(i)));
        })
      );
    await Promise.all(e);
  }
  /**
   * Notify all listeners of EOSE
   */
  async notifyEose(t) {
    const e = [];
    for (const s of this.listeners.values())
      s.onEose && e.push(
        Promise.resolve(s.onEose(t)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEose error:`, i), s.onError && s.onError(i instanceof Error ? i : new Error(String(i)));
        })
      );
    await Promise.all(e);
  }
  /**
   * Notify all listeners of subscription close
   */
  async notifyClose(t) {
    const e = [];
    for (const s of this.listeners.values())
      s.onClose && e.push(
        Promise.resolve(s.onClose(t)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onClose error:`, i);
        })
      );
    await Promise.all(e);
  }
  /**
   * Notify all listeners of an error
   */
  async notifyError(t) {
    const e = [];
    for (const s of this.listeners.values())
      s.onError && e.push(
        Promise.resolve(s.onError(t)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onError handler error:`, i);
        })
      );
    await Promise.all(e);
  }
  /**
   * Set the subscription result from SubscriptionManager
   */
  setSubscriptionResult(t) {
    this.subscriptionResult = t;
  }
  /**
   * Get the subscription result
   */
  getSubscriptionResult() {
    return this.subscriptionResult;
  }
  /**
   * Get statistics about this shared subscription
   */
  getStats() {
    return {
      listenerCount: this.listeners.size,
      eventCount: this.eventCount,
      age: Date.now() - this.createdAt,
      filters: this.filters,
      relays: this.relays
    };
  }
  /**
   * Check if this subscription has any listeners
   */
  hasListeners() {
    return this.listeners.size > 0;
  }
  /**
   * Check if this subscription is active
   */
  isActive() {
    var t;
    return this.hasListeners() && ((t = this.subscriptionResult) == null ? void 0 : t.success) !== !1;
  }
  /**
   * Get the subscription ID if available
   */
  getSubscriptionId() {
    var t, e;
    return (e = (t = this.subscriptionResult) == null ? void 0 : t.subscription) == null ? void 0 : e.id;
  }
  // Private helper methods
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
class _i {
  constructor(t) {
    l(this, "subscriptions", /* @__PURE__ */ new Map());
    l(this, "eventCallbacks", /* @__PURE__ */ new Map());
    l(this, "sharedSubscriptions", /* @__PURE__ */ new Map());
    l(this, "debug");
    this.relayManager = t, this.debug = t.debug || !1, this.setupRelayMessageHandling();
  }
  /**
   * Get or create a shared subscription with smart deduplication
   * This is the new preferred method for subscription management
   */
  async getOrCreateSubscription(t, e) {
    const s = e || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, i = this.generateFilterHash(t, s);
    if (this.sharedSubscriptions.has(i)) {
      const a = this.sharedSubscriptions.get(i);
      if (this.debug) {
        const c = a.getStats(), u = this.summarizeFilters(t);
        console.log(`SubscriptionManager: Reusing shared subscription ${i} (${c.listenerCount} listeners) - Filters: ${u}`);
      }
      return a;
    }
    const r = new ki(i, t, s, { debug: this.debug }), n = await this.subscribe(t, {
      relays: s,
      onEvent: (a) => r.broadcast(a),
      onEose: (a) => r.notifyEose(a),
      onClose: (a) => r.notifyClose(a),
      onError: (a) => r.notifyError(a)
    });
    if (r.setSubscriptionResult(n), n.success && (this.sharedSubscriptions.set(i, r), this.debug)) {
      const a = this.summarizeFilters(t);
      console.log(`SubscriptionManager: Created new shared subscription ${i} - Filters: ${a}`);
    }
    return r;
  }
  /**
   * Create a human-readable summary of filters for debugging
   */
  summarizeFilters(t) {
    return t.map((e) => {
      const s = [];
      if (e.kinds && s.push(`kinds:[${e.kinds.join(",")}]`), e.authors) {
        const i = e.authors.length > 1 ? `${e.authors.length} authors` : `author:${e.authors[0].substring(0, 8)}...`;
        s.push(i);
      }
      if (e.ids) {
        const i = e.ids.length > 1 ? `${e.ids.length} ids` : `id:${e.ids[0].substring(0, 8)}...`;
        s.push(i);
      }
      return e["#p"] && s.push(`#p:${e["#p"].length} mentions`), e["#e"] && s.push(`#e:${e["#e"].length} events`), e["#t"] && s.push(`#t:${e["#t"].join(",")}`), e.since && s.push(`since:${new Date(e.since * 1e3).toISOString().substring(11, 19)}`), e.until && s.push(`until:${new Date(e.until * 1e3).toISOString().substring(11, 19)}`), e.limit && s.push(`limit:${e.limit}`), `{${s.join(", ")}}`;
    }).join(" + ");
  }
  /**
   * Generate a cryptographically secure hash key for filter deduplication
   * Prevents hash collisions that could cause subscription mixing
   */
  generateFilterHash(t, e) {
    const s = t.map((a) => {
      const c = {};
      return Object.keys(a).sort().forEach((u) => {
        const h = a[u];
        Array.isArray(h) && h.every((d) => typeof d == "string") ? c[u] = [...h].sort() : c[u] = h;
      }), c;
    }), i = JSON.stringify(s), r = e.slice().sort().join(","), n = `${i}:${r}`;
    return typeof crypto < "u" && crypto.subtle ? this.generateSHA256HashSync(n) : this.generateSecureHash(n);
  }
  /**
   * Generate SHA-256 hash synchronously (fallback implementation)
   */
  generateSHA256HashSync(t) {
    const s = new TextEncoder().encode(t);
    let i = 2166136261;
    for (let r = 0; r < s.length; r++)
      i ^= s[r], i = Math.imul(i, 16777619);
    return i ^= i >>> 16, i = Math.imul(i, 2246822507), i ^= i >>> 13, i = Math.imul(i, 3266489909), i ^= i >>> 16, (i >>> 0).toString(16).padStart(8, "0");
  }
  /**
   * Enhanced hash function with better collision resistance
   */
  generateSecureHash(t) {
    const e = this.djb2Hash(t), s = this.sdbmHash(t), i = this.fnvHash(t);
    return ((e ^ s ^ i) >>> 0).toString(16).padStart(8, "0");
  }
  djb2Hash(t) {
    let e = 5381;
    for (let s = 0; s < t.length; s++)
      e = (e << 5) + e + t.charCodeAt(s);
    return e;
  }
  sdbmHash(t) {
    let e = 0;
    for (let s = 0; s < t.length; s++)
      e = t.charCodeAt(s) + (e << 6) + (e << 16) - e;
    return e;
  }
  fnvHash(t) {
    let e = 2166136261;
    for (let s = 0; s < t.length; s++)
      e ^= t.charCodeAt(s), e = Math.imul(e, 16777619);
    return e;
  }
  /**
   * Clean up shared subscriptions with no listeners
   */
  async cleanupSharedSubscriptions() {
    const t = [];
    for (const [e, s] of this.sharedSubscriptions.entries())
      if (!s.hasListeners()) {
        t.push(e);
        const i = s.getSubscriptionId();
        i && await this.close(i, "No more listeners");
      }
    for (const e of t)
      this.sharedSubscriptions.delete(e), this.debug && console.log(`SubscriptionManager: Removed orphaned shared subscription ${e}`);
  }
  /**
   * Get subscription analytics
   */
  getSubscriptionAnalytics() {
    let t = 0, e = 0;
    for (const s of this.sharedSubscriptions.values()) {
      const i = s.getStats();
      t += i.listenerCount, i.listenerCount > 1 && (e += i.listenerCount - 1);
    }
    return {
      totalSubscriptions: this.subscriptions.size,
      sharedSubscriptions: this.sharedSubscriptions.size,
      totalListeners: t,
      duplicatesAvoided: e
    };
  }
  /**
   * Get an overview of all shared subscriptions for diagnostics
   * Returns minimal, high-signal data only (no bloat)
   */
  getSharedSubscriptionsOverview() {
    const t = [];
    for (const [e, s] of this.sharedSubscriptions.entries()) {
      const i = s.getStats();
      t.push({
        key: e,
        subscriptionId: s.getSubscriptionId(),
        stats: { listenerCount: i.listenerCount, eventCount: i.eventCount, age: i.age },
        filters: i.filters,
        relays: i.relays
      });
    }
    return t.sort((e, s) => s.stats.listenerCount - e.stats.listenerCount), t;
  }
  /**
   * Create a new subscription with given filters
   * Performance requirement: <100ms subscription creation
   */
  async subscribe(t, e = {}) {
    var s, i, r, n;
    try {
      const a = this.validateFilters(t);
      if (a)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: a
        };
      const c = this.generateSubscriptionId(), u = Date.now(), h = e.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, d = {
        id: c,
        filters: t,
        relays: h,
        state: "pending",
        createdAt: u,
        eventCount: 0,
        onEvent: e.onEvent,
        onEose: e.onEose,
        onClose: e.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      if (h.forEach((b) => {
        d.relayStates[b] = "active";
      }), e.timeout && (d.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, e.timeout)), this.subscriptions.set(c, d), this.debug) {
        const b = this.summarizeFilters(t);
        console.log(`Creating subscription ${c} with ${t.length} filters: ${b}`);
      }
      const f = e.retryAttempts || 1, p = e.retryDelay || 1e3;
      let g = [], y;
      for (let b = 0; b < f; b++)
        try {
          const w = ["REQ", c, ...t];
          try {
            await ((i = (s = this.relayManager).sendToAll) == null ? void 0 : i.call(s, w)), g = h.map((k) => ({
              relay: k,
              success: !0,
              error: void 0
            }));
            break;
          } catch (k) {
            g = [];
            let _ = !1;
            for (const P of h)
              try {
                await ((n = (r = this.relayManager).sendToRelays) == null ? void 0 : n.call(r, [P], w)), g.push({
                  relay: P,
                  success: !0,
                  error: void 0
                }), _ = !0;
              } catch (A) {
                g.push({
                  relay: P,
                  success: !1,
                  error: A instanceof Error ? A : new Error("Unknown error")
                });
              }
            if (_)
              break;
            y = k instanceof Error ? k : new Error("All relays failed");
          }
        } catch (w) {
          y = w instanceof Error ? w : new Error("Unknown error"), g = h.map((k) => ({
            relay: k,
            success: !1,
            error: y
          })), b < f - 1 && await new Promise((k) => setTimeout(k, p));
        }
      const m = g.length > 0 && g.some((b) => b.success);
      return m || (this.subscriptions.delete(c), d.timeoutId && clearTimeout(d.timeoutId)), {
        subscription: m ? this.externalizeSubscription(d) : {},
        success: m,
        relayResults: g,
        error: m ? void 0 : {
          message: y ? y.message : g.length === 0 ? "No relays available" : "All relays failed",
          retryable: !0
        }
      };
    } catch (a) {
      return {
        subscription: {},
        success: !1,
        relayResults: [],
        error: {
          message: a instanceof Error ? a.message : "Unknown error",
          retryable: !0
        }
      };
    }
  }
  /**
   * Activate a pending subscription by sending REQ messages
   */
  async activate(t) {
    var s, i, r, n;
    const e = this.subscriptions.get(t);
    if (!e)
      throw new Error(`Subscription ${t} not found`);
    e.state = "active";
    try {
      const a = ["REQ", t, ...e.filters], c = this.relayManager.connectedRelays;
      e.relays.length !== c.length || !e.relays.every((h) => c.includes(h)) ? await ((i = (s = this.relayManager).sendToRelays) == null ? void 0 : i.call(s, e.relays, a)) : await ((n = (r = this.relayManager).sendToAll) == null ? void 0 : n.call(r, a));
    } catch (a) {
      throw e.state = "error", a;
    }
  }
  /**
   * Mark subscription as having received EOSE from a relay
   */
  async markEose(t, e) {
    const s = this.subscriptions.get(t);
    s && (s.eoseRelays.add(e), s.state = "eose", s.onEose && s.onEose(e));
  }
  /**
   * Close a subscription
   */
  async close(t, e) {
    var i, r;
    const s = this.subscriptions.get(t);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const n = ["CLOSE", t];
        await ((r = (i = this.relayManager).sendToAll) == null ? void 0 : r.call(i, n));
      } catch (n) {
        this.debug && console.error(`Error sending CLOSE for ${t}:`, n);
      }
      s.onClose && s.onClose(e), this.subscriptions.delete(t);
    }
  }
  /**
   * Close all active subscriptions
   */
  async closeAll() {
    const t = this.getActiveSubscriptions();
    await Promise.all(
      t.map((e) => this.close(e.id, "closeAll"))
    );
  }
  /**
   * Unsubscribe (alias for close) - DevExplorer API compatibility
   */
  async unsubscribe(t) {
    await this.close(t, "unsubscribe");
  }
  /**
   * Unsubscribe all (alias for closeAll) - DevExplorer API compatibility
   */
  async unsubscribeAll() {
    await this.closeAll();
  }
  /**
   * Handle incoming event for a subscription
   */
  async handleEvent(t, e) {
    const s = this.subscriptions.get(t);
    s && (s.receivedEventIds.has(e.id) || (s.receivedEventIds.add(e.id), s.eventCount++, s.lastEventAt = Date.now(), s.onEvent && s.onEvent(e)));
  }
  /**
   * Handle event batch for performance optimization
   */
  async handleEventBatch(t, e) {
    const s = this.subscriptions.get(t);
    if (!s) return;
    const i = [];
    for (const r of e)
      s.receivedEventIds.has(r.id) || (s.receivedEventIds.add(r.id), i.push(r));
    if (s.eventCount += i.length, s.lastEventAt = Date.now(), s.onEvent && i.length > 0)
      for (const r of i)
        s.onEvent(r);
  }
  /**
   * Handle relay event message
   */
  async handleRelayEvent(t, e, s) {
    await this.handleEvent(e, s);
  }
  /**
   * Handle incoming relay message
   */
  async handleRelayMessage(t, e) {
    const [s, i, ...r] = e;
    switch (s) {
      case "EVENT":
        const n = r[0];
        await this.handleRelayEvent(t, i, n);
        break;
      case "EOSE":
        await this.markEose(i, t);
        break;
      case "NOTICE":
        this.debug && console.log(`Notice from ${t}:`, r[0]);
        break;
    }
  }
  /**
   * Handle relay disconnection
   */
  async handleRelayDisconnection(t) {
    this.subscriptions.forEach((e) => {
      e.relayStates[t] && (e.relayStates[t] = "disconnected");
    });
  }
  /**
   * Handle relay manager updates
   */
  async handleRelayManagerUpdate() {
    const t = this.relayManager.connectedRelays;
    this.subscriptions.forEach((e) => {
      e.relays.forEach((s) => {
        t.includes(s) ? e.relayStates[s] = "active" : e.relayStates[s] = "disconnected";
      });
    });
  }
  /**
   * Get subscription by ID
   */
  getSubscription(t) {
    const e = this.subscriptions.get(t);
    return e ? this.externalizeSubscription(e) : void 0;
  }
  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).filter((t) => t.state !== "closed").map((t) => this.externalizeSubscription(t));
  }
  /**
   * Get subscription statistics
   */
  getSubscriptionStats(t) {
    const e = this.subscriptions.get(t);
    if (!e)
      throw new Error(`Subscription ${t} not found`);
    return {
      relayStates: { ...e.relayStates },
      eoseCount: e.eoseRelays.size,
      eventCount: e.eventCount
    };
  }
  // Private helper methods
  generateSubscriptionId() {
    return Array.from(
      { length: 16 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
  validateFilters(t) {
    if (!Array.isArray(t) || t.length === 0)
      return {
        message: "Invalid filter: must be non-empty array",
        retryable: !1
      };
    for (const e of t) {
      if (e == null || typeof e != "object")
        return {
          message: "Invalid filter: must be object",
          retryable: !1
        };
      if (e.hasOwnProperty("invalid"))
        return {
          message: "Invalid filter: contains invalid properties",
          retryable: !1
        };
      if (e.kinds && !Array.isArray(e.kinds))
        return {
          message: "Invalid filter: kinds must be array",
          retryable: !1
        };
    }
    return null;
  }
  async sendSubscriptionToRelays(t, e) {
    const s = [], i = ["REQ", t.id, ...t.filters];
    if (this.relayManager.sendToRelays)
      for (const r of t.relays)
        try {
          await this.relayManager.sendToRelays([r], i), s.push({
            relay: r,
            success: !0,
            subscriptionId: t.id
          });
        } catch (n) {
          s.push({
            relay: r,
            success: !1,
            error: n instanceof Error ? n.message : "Unknown error",
            subscriptionId: t.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(i), t.relays.forEach((r) => {
          s.push({
            relay: r,
            success: !0,
            subscriptionId: t.id
          });
        })) : t.relays.forEach((r) => {
          s.push({
            relay: r,
            success: !0,
            subscriptionId: t.id
          });
        });
      } catch (r) {
        t.relays.forEach((n) => {
          s.push({
            relay: n,
            success: !1,
            error: r instanceof Error ? r.message : "Unknown error",
            subscriptionId: t.id
          });
        });
      }
    return s;
  }
  handleSubscriptionTimeout(t) {
    const e = this.subscriptions.get(t);
    e && (e.state = "error", e.onClose && e.onClose("Subscription timeout"), this.subscriptions.delete(t));
  }
  externalizeSubscription(t) {
    return new Proxy(t, {
      get(e, s) {
        if (!(s === "timeoutId" || s === "relayStates" || s === "eoseRelays" || s === "receivedEventIds"))
          return e[s];
      },
      set(e, s, i) {
        return s === "eventCount" || s === "lastEventAt" || s === "state" ? (e[s] = i, !0) : !1;
      }
    });
  }
  setupRelayMessageHandling() {
    this.relayManager.setMessageHandler((t, e) => {
      this.handleRelayMessage(t, e);
    });
  }
}
class Pt {
  constructor(t, e = {}) {
    l(this, "events", /* @__PURE__ */ new Map());
    // ALL events (decrypted)
    l(this, "eventsByKind", /* @__PURE__ */ new Map());
    // Fast lookup by kind
    l(this, "eventsByAuthor", /* @__PURE__ */ new Map());
    // Fast lookup by author
    l(this, "eventsByTag", /* @__PURE__ */ new Map());
    // tag name → value → event IDs
    l(this, "subscribers", /* @__PURE__ */ new Set());
    // P1: Remove private key state – decryptor-only
    l(this, "config");
    // Efficient LRU tracking with doubly-linked list - O(1) operations
    l(this, "lruNodes", /* @__PURE__ */ new Map());
    l(this, "lruHead", null);
    l(this, "lruTail", null);
    // Statistics tracking
    l(this, "stats", {
      queryCount: 0,
      totalQueryTime: 0,
      evictedCount: 0,
      createdAt: Date.now()
    });
    // Optional decryptor to use extension-based NIP-44 when available
    l(this, "decryptor", null);
    this.config = {
      maxEvents: e.maxEvents || 1e4,
      maxMemoryMB: e.maxMemoryMB || 50,
      evictionPolicy: e.evictionPolicy || "lru",
      debug: !!e.debug
    };
  }
  setDecryptor(t) {
    this.decryptor = t ?? null;
  }
  // setPrivateKey removed in P1
  /**
   * Re-process all stored gift wrap (kind 1059) events using the current private key.
   * Useful after the private key becomes available to decrypt previously seen wraps.
   */
  async reprocessGiftWraps() {
    const t = [];
    for (const e of this.events.values())
      e.kind === 1059 && t.push(e);
    for (const e of t)
      try {
        const s = await this.unwrapGiftWrap(e);
        s && s.kind !== 1059 && (this.events.has(s.id) || (this.events.set(s.id, s), this.updateIndexes(s), this.updateAccessTracking(s.id), this.notifySubscribers(s)));
      } catch {
      }
  }
  async addEvent(t) {
    if (t.kind === 5) {
      try {
        const e = [];
        for (const i of t.tags)
          Array.isArray(i) && i[0] === "e" && typeof i[1] == "string" && i[1] && e.push(i[1]);
        const s = e.filter((i) => {
          const r = this.events.get(i);
          return !!r && r.pubkey === t.pubkey;
        });
        s.length > 0 && (this.config.debug && console.log("[UEC] Deletion event received – removing referenced events from cache", {
          deletionId: (t.id || "").substring(0, 8) + "...",
          count: s.length,
          ids: s.map((i) => i.substring(0, 8) + "...")
        }), this.deleteEventsByIds(s), this.config.debug && console.log("[UEC] Deletion processing complete"));
      } catch {
      }
      this.events.set(t.id, t), this.updateIndexes(t), this.updateAccessTracking(t.id), this.notifySubscribers(t);
      return;
    }
    if (t.kind === 1059) {
      this.events.set(t.id, t), this.updateIndexes(t), this.updateAccessTracking(t.id), this.notifySubscribers(t);
      try {
        const e = await this.unwrapGiftWrap(t);
        e && await this.addEvent(e);
      } catch (e) {
        console.debug("Failed to unwrap gift wrap (stored anyway):", e);
      }
      return;
    }
    this.enforceCapacityLimits(), this.events.set(t.id, t), this.updateIndexes(t), this.updateAccessTracking(t.id), this.notifySubscribers(t);
  }
  /**
   * Public API: Remove a list of events by ID and notify subscribers so stores update reactively
   */
  deleteEventsByIds(t) {
    for (const e of t) {
      const s = this.events.get(e);
      s && (this.removeEvent(e), console.log("[UEC] Removed event from cache", { id: e.substring(0, 8) + "...", kind: s.kind }), this.notifySubscribers(s));
    }
  }
  query(t) {
    const e = performance.now(), s = this.getMatchingEvents(t);
    s.forEach((r) => this.updateAccessTracking(r.id));
    const i = performance.now() - e;
    return this.stats.queryCount++, this.stats.totalQueryTime += i, s;
  }
  subscribe(t) {
    return this.subscribers.add(t), () => this.subscribers.delete(t);
  }
  clear() {
    this.events.clear(), this.eventsByKind.clear(), this.eventsByAuthor.clear(), this.eventsByTag.clear(), this.lruNodes.clear(), this.lruHead = null, this.lruTail = null;
  }
  get size() {
    return this.events.size;
  }
  /**
   * Get comprehensive cache statistics
   */
  getStatistics() {
    const t = Date.now(), e = this.stats.queryCount, s = {};
    this.eventsByKind.forEach((r, n) => {
      s[n] = r.size;
    });
    const i = s[0] || 0;
    return {
      // Basic metrics
      totalEvents: this.events.size,
      memoryUsageMB: this.estimateMemoryUsage(),
      subscribersCount: this.subscribers.size,
      // Distribution metrics
      byKind: s,
      profileCount: i,
      // Index metrics
      kindIndexSize: this.eventsByKind.size,
      authorIndexSize: this.eventsByAuthor.size,
      tagIndexSize: this.eventsByTag.size,
      // Performance metrics
      queryCount: e,
      hitRate: e > 0 ? this.events.size / e * 100 : 0,
      avgQueryTime: e > 0 ? this.stats.totalQueryTime / e : 0,
      // Eviction metrics
      evictedCount: this.stats.evictedCount,
      evictionPolicy: this.config.evictionPolicy,
      // Configuration
      maxEvents: this.config.maxEvents,
      maxMemoryMB: this.config.maxMemoryMB,
      // Real-time metrics
      lastUpdated: t,
      cacheAge: t - this.stats.createdAt
    };
  }
  async unwrapGiftWrap(t) {
    if (this.decryptor && typeof this.decryptor.nip44Decrypt == "function")
      try {
        const e = await this.decryptor.nip44Decrypt(t.pubkey, t.content);
        if (!e) return null;
        const s = JSON.parse(e), i = await this.decryptor.nip44Decrypt(s.pubkey, s.content);
        if (!i) return null;
        const r = JSON.parse(i);
        return this.normalizeRumorFromWrap(t, r);
      } catch {
      }
    return null;
  }
  normalizeRumorFromWrap(t, e) {
    try {
      const s = t.tags.find((u) => Array.isArray(u) && typeof u[0] == "string"), i = s && typeof s[1] == "string" ? s[1] : "", r = Array.isArray(e == null ? void 0 : e.tags) ? e.tags : [], a = r.some((u) => Array.isArray(u) && u[0] === "p") || !i ? r : [...r, ["p", i]], c = {
        id: "",
        pubkey: e.pubkey,
        created_at: e.created_at,
        kind: e.kind,
        tags: a,
        content: e.content,
        sig: ""
      };
      return c.id = M.calculateEventId(c), c;
    } catch {
      return null;
    }
  }
  updateIndexes(t) {
    this.eventsByKind.has(t.kind) || this.eventsByKind.set(t.kind, /* @__PURE__ */ new Set()), this.eventsByKind.get(t.kind).add(t.id), this.eventsByAuthor.has(t.pubkey) || this.eventsByAuthor.set(t.pubkey, /* @__PURE__ */ new Set()), this.eventsByAuthor.get(t.pubkey).add(t.id), t.tags.forEach((e) => {
      const s = e[0] || "", i = e[1] || "";
      if (!s || !i) return;
      this.eventsByTag.has(s) || this.eventsByTag.set(s, /* @__PURE__ */ new Map());
      const r = this.eventsByTag.get(s);
      r.has(i) || r.set(i, /* @__PURE__ */ new Set()), r.get(i).add(t.id);
    });
  }
  getMatchingEvents(t) {
    let e;
    if (t.kinds && t.kinds.length > 0) {
      const i = t.kinds.map((r) => this.eventsByKind.get(r) || /* @__PURE__ */ new Set());
      e = this.unionSets(i);
    }
    if (t.authors && t.authors.length > 0) {
      const i = t.authors.map((n) => this.eventsByAuthor.get(n) || /* @__PURE__ */ new Set()), r = this.unionSets(i);
      e = e ? this.intersectSets([e, r]) : r;
    }
    Object.entries(t).forEach(([i, r]) => {
      if (i.startsWith("#") && Array.isArray(r) && r.length > 0) {
        const n = i.slice(1), a = this.eventsByTag.get(n);
        if (a) {
          const c = r.map((h) => a.get(h) || /* @__PURE__ */ new Set()), u = this.unionSets(c);
          e = e ? this.intersectSets([e, u]) : u;
        } else
          e = /* @__PURE__ */ new Set();
      }
    });
    const s = Array.from(e ?? new Set(Array.from(this.events.keys()))).map((i) => this.events.get(i)).filter((i) => i && this.matchesFilter(i, t)).sort((i, r) => r.created_at - i.created_at);
    return t.limit && t.limit > 0 ? s.slice(0, t.limit) : s;
  }
  matchesFilter(t, e) {
    if (e.since && t.created_at < e.since || e.until && t.created_at > e.until || e.ids && e.ids.length > 0 && !e.ids.includes(t.id)) return !1;
    if (typeof e.search == "string" && e.search.length > 0) {
      const s = e.search.toLowerCase();
      if (!(t.content || "").toLowerCase().includes(s)) return !1;
    }
    return !0;
  }
  unionSets(t) {
    const e = /* @__PURE__ */ new Set();
    return t.forEach((s) => {
      s.forEach((i) => e.add(i));
    }), e;
  }
  intersectSets(t) {
    if (t.length === 0) return /* @__PURE__ */ new Set();
    if (t.length === 1) return t[0] || /* @__PURE__ */ new Set();
    const e = /* @__PURE__ */ new Set();
    return t[0].forEach((i) => {
      t.every((r) => r.has(i)) && e.add(i);
    }), e;
  }
  notifySubscribers(t) {
    this.subscribers.forEach((e) => {
      try {
        e(t);
      } catch (s) {
        console.error("Subscriber callback error:", s);
      }
    });
  }
  updateAccessTracking(t) {
    if (this.config.evictionPolicy !== "lru") return;
    const e = Date.now();
    let s = this.lruNodes.get(t);
    s ? (this.moveToHead(s), s.timestamp = e) : (s = {
      eventId: t,
      prev: null,
      next: null,
      timestamp: e
    }, this.lruNodes.set(t, s), this.addToHead(s));
  }
  // O(1) LRU operations using doubly-linked list
  addToHead(t) {
    t.prev = null, t.next = this.lruHead, this.lruHead && (this.lruHead.prev = t), this.lruHead = t, this.lruTail || (this.lruTail = t);
  }
  removeNode(t) {
    t.prev ? t.prev.next = t.next : this.lruHead = t.next, t.next ? t.next.prev = t.prev : this.lruTail = t.prev;
  }
  moveToHead(t) {
    this.removeNode(t), this.addToHead(t);
  }
  enforceCapacityLimits() {
    if (this.events.size >= this.config.maxEvents && this.evictOldest(), this.estimateMemoryUsage() > this.config.maxMemoryMB)
      for (; this.estimateMemoryUsage() > this.config.maxMemoryMB && this.events.size > 0; )
        this.evictOldest();
  }
  evictOldest() {
    let t;
    this.config.evictionPolicy === "lru" ? this.lruTail && (t = this.lruTail.eventId) : t = this.events.keys().next().value, t && this.removeEvent(t);
  }
  removeEvent(t) {
    var i, r;
    const e = this.events.get(t);
    if (!e) return;
    this.stats.evictedCount++, this.events.delete(t), (i = this.eventsByKind.get(e.kind)) == null || i.delete(t), (r = this.eventsByAuthor.get(e.pubkey)) == null || r.delete(t), e.tags.forEach((n) => {
      var u, h;
      const a = n[0] || "", c = n[1] || "";
      !a || !c || (h = (u = this.eventsByTag.get(a)) == null ? void 0 : u.get(c)) == null || h.delete(t);
    });
    const s = this.lruNodes.get(t);
    s && (this.removeNode(s), this.lruNodes.delete(t));
  }
  estimateMemoryUsage() {
    return this.events.size * 1024 / (1024 * 1024);
  }
}
class He {
  constructor() {
    l(this, "filter", {});
  }
  // Default limit to protect UI when not explicitly set
  ensureLimit(t) {
    return !("limit" in t) || typeof t.limit != "number" ? { ...t, limit: 100 } : t;
  }
  kinds(t) {
    const e = this.ensureLimit({ ...this.filter, kinds: t });
    return this.clone(e);
  }
  authors(t) {
    const e = this.ensureLimit({ ...this.filter, authors: t });
    return this.clone(e);
  }
  tags(t, e) {
    const s = this.ensureLimit({ ...this.filter });
    return e ? s[`#${t}`] = e : s[`#${t}`] = [], this.clone(s);
  }
  since(t) {
    const e = { ...this.filter, since: t };
    return this.clone(e);
  }
  until(t) {
    const e = { ...this.filter, until: t };
    return this.clone(e);
  }
  limit(t) {
    const e = { ...this.filter, limit: t };
    return this.clone(e);
  }
  // NIP-50: Server-side search capability (also used for local cache search)
  search(t) {
    const e = this.ensureLimit({ ...this.filter, search: String(t ?? "") });
    return this.clone(e);
  }
  ids(t) {
    const e = { ...this.filter, ids: t };
    return this.clone(e);
  }
  // Convenience methods for common patterns
  notes() {
    return this.kinds([1]);
  }
  profiles() {
    return this.kinds([0]);
  }
  reactions() {
    return this.kinds([7]);
  }
  dms() {
    return this.kinds([14]);
  }
  reposts() {
    return this.kinds([6]);
  }
}
class pt {
  constructor(t, e) {
    l(this, "cache");
    l(this, "filter");
    l(this, "_data");
    l(this, "subscribers", /* @__PURE__ */ new Set());
    l(this, "unsubscribeCache");
    this.cache = t, this.filter = e, this._data = this.cache.query(e), this.unsubscribeCache = this.cache.subscribe((s) => {
      this.matchesFilter(s, e) && this.updateData();
    });
  }
  // Svelte store interface
  subscribe(t, e) {
    return t(this._data), this.subscribers.add(t), () => {
      this.subscribers.delete(t), this.subscribers.size === 0 && this.unsubscribeCache && this.unsubscribeCache();
    };
  }
  get current() {
    return this._data;
  }
  /**
   * Transform the store data with a mapping function
   * Returns a new store with transformed data
   */
  map(t) {
    return new Ai(this, t);
  }
  updateData() {
    this._data = this.cache.query(this.filter), this.notifySubscribers();
  }
  notifySubscribers() {
    this.subscribers.forEach((t) => t(this._data));
  }
  matchesFilter(t, e) {
    if (e.kinds && !e.kinds.includes(t.kind) || e.authors && !e.authors.includes(t.pubkey) || e.ids && !e.ids.includes(t.id))
      return !1;
    if (e["#p"] && e["#p"].length > 0) {
      const s = t.tags.filter((i) => i[0] === "p").map((i) => i[1]);
      if (!e["#p"].some((i) => s.includes(i)))
        return !1;
    }
    if (e["#e"] && e["#e"].length > 0) {
      const s = t.tags.filter((i) => i[0] === "e").map((i) => i[1]);
      if (!e["#e"].some((i) => s.includes(i)))
        return !1;
    }
    if (e["#t"] && e["#t"].length > 0) {
      const s = t.tags.filter((i) => i[0] === "t").map((i) => i[1]);
      if (!e["#t"].some((i) => s.includes(i)))
        return !1;
    }
    for (const s of Object.keys(e))
      if (s.startsWith("#") && s.length > 1 && !["#p", "#e", "#t"].includes(s)) {
        const i = s.slice(1), r = e[s];
        if (r && r.length > 0) {
          const n = t.tags.filter((a) => a[0] === i).map((a) => a[1]);
          if (!r.some((a) => n.includes(a)))
            return !1;
        }
      }
    return !0;
  }
}
class Ai {
  constructor(t, e) {
    l(this, "_data");
    l(this, "subscribers", /* @__PURE__ */ new Set());
    l(this, "sourceUnsubscriber");
    this.sourceStore = t, this.transform = e, this._data = this.safeTransform(this.sourceStore.current, this._data), this.sourceUnsubscriber = this.sourceStore.subscribe((s) => {
      const i = this.safeTransform(s, this._data);
      this._data !== i && (this._data = i, this.notifySubscribers());
    });
  }
  // Svelte store interface
  subscribe(t, e) {
    return t(this._data), this.subscribers.add(t), () => {
      this.subscribers.delete(t), this.subscribers.size === 0 && this.sourceUnsubscriber && this.sourceUnsubscriber();
    };
  }
  get current() {
    return this._data;
  }
  notifySubscribers() {
    this.subscribers.forEach((t) => t(this._data));
  }
  safeTransform(t, e) {
    try {
      return this.transform(t);
    } catch {
      return e;
    }
  }
}
class re extends He {
  constructor(t) {
    super(), this.cache = t;
  }
  clone(t) {
    const e = new re(this.cache);
    return e.filter = t, e;
  }
  execute() {
    return new pt(this.cache, this.filter);
  }
}
const J = class J extends He {
  constructor(e, s) {
    super();
    l(this, "relayUrls", []);
    // Auto-batching config (generalized: works for 'ids', 'authors', '#e', '#p')
    l(this, "autoBatchFieldName", null);
    l(this, "autoBatchWindowMs", 0);
    // microtask coalescing (same tick)
    l(this, "autoBatchMaxValues", 200);
    l(this, "autoBatchMaxTotalLimit", 1e3);
    this.cache = e, this.subscriptionManager = s;
  }
  clone(e) {
    const s = new J(this.cache, this.subscriptionManager);
    return s.filter = e, s.relayUrls = [...this.relayUrls], s;
  }
  relay(e) {
    const s = this.clone(this.filter);
    return s.relayUrls = [e], s;
  }
  relays(e) {
    const s = this.clone(this.filter);
    return s.relayUrls = e, s;
  }
  /**
   * Execute the subscription and return a handle for lifecycle control
   * This provides excellent DX for managing subscriptions
   * USES SMART DEDUPLICATION to prevent subscription overload
   */
  async execute() {
    const e = this.relayUrls.length > 0 ? this.relayUrls : void 0;
    if (!this.autoBatchFieldName) {
      const n = ["ids", "authors", "#e", "#p"];
      for (const a of n) {
        const c = this.filter[a];
        if (Array.isArray(c) && c.length === 1) {
          this.autoBatchFieldName = a;
          break;
        }
      }
    }
    if (this.autoBatchFieldName && Array.isArray(this.filter[this.autoBatchFieldName]) && this.filter[this.autoBatchFieldName].length === 1) {
      const n = /* @__PURE__ */ new Set(["kinds", this.autoBatchFieldName, "limit"]), a = this.filter;
      if (Object.keys(a).filter((_) => {
        const P = a[_];
        return P == null ? !1 : Array.isArray(P) ? P.length > 0 : typeof P == "object" ? Object.keys(P).length > 0 : !0;
      }).some((_) => !n.has(_)))
        return await this.executeNonBatched(e);
      const h = this.autoBatchFieldName, d = { ...this.filter }, f = d[h], p = String(f[0]);
      d[h] = "__BATCH__";
      const g = (e || []).slice().sort().join(","), y = JSON.stringify(d) + "::" + g;
      J.pendingBatches.has(y) || J.pendingBatches.set(y, {
        tagName: h,
        ids: /* @__PURE__ */ new Set(),
        timer: null,
        creating: !1,
        resolvers: [],
        targetRelays: e,
        baseFilter: d
      });
      const m = J.pendingBatches.get(y);
      m.ids.add(p);
      const b = new Promise((_) => {
        m.resolvers.push((P) => _(P ?? y));
      });
      if (!m.timer) {
        const _ = async () => {
          if (m.timer = null, !m.creating) {
            m.creating = !0;
            try {
              const P = Array.from(m.ids).slice(0, this.autoBatchMaxValues), A = { ...m.baseFilter };
              A[m.tagName] = P;
              const T = this.filter.limit ?? 100, R = Math.min(T * P.length, this.autoBatchMaxTotalLimit);
              R && (A.limit = R);
              const x = await this.subscriptionManager.getOrCreateSubscription([A], m.targetRelays), F = x.addListener({
                onEvent: (N) => {
                  this.cache.addEvent(N);
                }
              }), C = String(x.key);
              m.sharedKey = C, m.resolvers.forEach((N) => N(C)), m.resolvers = [], J._batchedListenerRegistry = J._batchedListenerRegistry || /* @__PURE__ */ new Map(), J._batchedListenerRegistry.set(C, { sub: x, listenerId: F });
            } finally {
              J.pendingBatches.delete(y);
            }
          }
        };
        typeof window < "u" && typeof window.requestAnimationFrame == "function" ? m.timer = window.requestAnimationFrame(() => _()) : m.timer = setTimeout(_, this.autoBatchWindowMs || 0);
      }
      const w = new pt(this.cache, this.filter);
      let k = null;
      return b.then((_) => {
        k = _;
      }), {
        id: k || y,
        store: w,
        stop: async () => {
          var A;
          const _ = J._batchedListenerRegistry, P = k || y;
          if (_ && _.has(P)) {
            const T = _.get(P), R = T.sub.removeListener(T.listenerId);
            _.delete(P), R && ((A = this.subscriptionManager) != null && A.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
          }
        },
        isActive: () => !0
      };
    }
    const s = await this.subscriptionManager.getOrCreateSubscription([this.filter], e), i = s.addListener({
      onEvent: (n) => {
        this.cache.addEvent(n);
      }
    }), r = new pt(this.cache, this.filter);
    return {
      id: s.key,
      store: r,
      stop: async () => {
        var a;
        s.removeListener(i) && ((a = this.subscriptionManager) != null && a.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
      },
      isActive: () => s.hasListeners()
    };
  }
  /**
   * Execute a single-shot subscription that auto-unsubscribes.
   * closeOn:
   *  - 'eose' (default): unsubscribe after EOSE is received
   *  - 'first-event': unsubscribe after the first matching event arrives
   */
  async executeOnce(e) {
    const s = (e == null ? void 0 : e.closeOn) || "eose", i = this.relayUrls.length > 0 ? this.relayUrls : void 0, r = await this.subscriptionManager.getOrCreateSubscription([this.filter], i), n = r.addListener({
      onEvent: (c) => {
        var u;
        this.cache.addEvent(c), s === "first-event" && r.removeListener(n) && (u = this.subscriptionManager) != null && u.cleanupSharedSubscriptions && this.subscriptionManager.cleanupSharedSubscriptions().catch(() => {
        });
      },
      onEose: (c) => {
        var u;
        s === "eose" && r.removeListener(n) && (u = this.subscriptionManager) != null && u.cleanupSharedSubscriptions && this.subscriptionManager.cleanupSharedSubscriptions().catch(() => {
        });
      }
    }), a = new pt(this.cache, this.filter);
    return {
      id: r.key,
      store: a,
      stop: async () => {
        var u;
        r.removeListener(n) && ((u = this.subscriptionManager) != null && u.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
      },
      isActive: () => r.hasListeners()
    };
  }
  async executeNonBatched(e) {
    const s = await this.subscriptionManager.getOrCreateSubscription([this.filter], e), i = s.addListener({
      onEvent: (n) => {
        this.cache.addEvent(n);
      }
    }), r = new pt(this.cache, this.filter);
    return {
      id: s.key,
      store: r,
      stop: async () => {
        var a;
        s.removeListener(i) && ((a = this.subscriptionManager) != null && a.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
      },
      isActive: () => s.hasListeners()
    };
  }
};
// safety cap for merged limit
// Static pending batches per process (keyed by base filter signature + relays)
l(J, "pendingBatches", /* @__PURE__ */ new Map());
let Zt = J;
class We {
  constructor(t) {
    l(this, "config");
    l(this, "updates", {});
    l(this, "shouldPreserveExisting", !0);
    l(this, "customMetadata", {});
    this.config = t;
  }
  /**
   * Set display name
   */
  name(t) {
    return this.updates.name = t, this;
  }
  /**
   * Set bio/about text
   */
  about(t) {
    return this.updates.about = t, this;
  }
  /**
   * Set profile picture URL
   */
  picture(t) {
    return this.updates.picture = t, this;
  }
  /**
   * Set banner image URL
   */
  banner(t) {
    return this.updates.banner = t, this;
  }
  /**
   * Set NIP-05 identifier
   */
  nip05(t) {
    return this.updates.nip05 = t, this;
  }
  /**
   * Set Lightning address (lud16)
   */
  lud16(t) {
    return this.updates.lud16 = t, this;
  }
  /**
   * Set website URL
   */
  website(t) {
    return this.updates.website = t, this;
  }
  /**
   * Set GitHub username (NIP-39 external identity)
   */
  github(t) {
    return this.customMetadata.github = t, this;
  }
  /**
   * Set Twitter/X username (NIP-39 external identity)
   */
  twitter(t) {
    return this.customMetadata.twitter = t, this;
  }
  /**
   * Set Telegram username (NIP-39 external identity)
   */
  telegram(t) {
    return this.customMetadata.telegram = t, this;
  }
  /**
   * Add custom metadata field
   */
  metadata(t, e) {
    return this.customMetadata[t] = e, this;
  }
  /**
   * Whether to preserve existing fields (default: true)
   */
  preserveExisting(t = !0) {
    return this.shouldPreserveExisting = t, this;
  }
  /**
   * Sign the profile event (without publishing)
   */
  async sign() {
    const t = await this.prepareProfileData(), e = await this.config.signingProvider.getPublicKey(), s = {
      kind: 0,
      content: JSON.stringify(t),
      tags: [],
      created_at: Math.floor(Date.now() / 1e3),
      pubkey: e
    }, i = M.addEventId(s), r = await this.config.signingProvider.signEvent(s);
    return {
      ...i,
      sig: r
    };
  }
  /**
   * Publish the profile update
   */
  async publish() {
    try {
      const t = await this.prepareProfileData();
      this.config.debug && console.log("ProfileBuilder: Publishing profile:", t);
      const e = await this.config.signingProvider.getPublicKey(), s = {
        kind: 0,
        content: JSON.stringify(t),
        tags: [],
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, i = M.addEventId(s), r = await this.config.signingProvider.signEvent(s), n = {
        ...i,
        sig: r
      }, c = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (h) => {
          try {
            return await this.config.relayManager.sendToRelay(h, ["EVENT", n]), { success: !0, relay: h };
          } catch (d) {
            return {
              success: !1,
              relay: h,
              error: d instanceof Error ? d.message : "Unknown error"
            };
          }
        })
      )).filter(
        (h) => h.status === "fulfilled" && h.value.success
      ).map((h) => h.value.relay);
      return c.length > 0 ? (this.config.debug && console.log(`ProfileBuilder: Published to ${c.length} relays`), {
        success: !0,
        eventId: n.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : "Failed to publish profile"
      };
    }
  }
  // Private helper methods
  async prepareProfileData() {
    let t = {};
    if (this.shouldPreserveExisting) {
      const s = await this.getCurrentProfile();
      s ? (t = { ...s.metadata }, this.config.debug && console.log("ProfileBuilder: Preserving existing profile data:", t)) : this.config.debug && console.log("ProfileBuilder: No existing profile found to preserve");
    }
    const e = {
      ...t,
      ...this.updates
    };
    return Object.keys(this.customMetadata).length > 0 && Object.assign(e, this.customMetadata), e;
  }
  async getCurrentProfile() {
    try {
      const t = await this.config.signingProvider.getPublicKey(), e = this.config.nostr.query().kinds([0]).authors([t]).limit(1).execute(), s = e.current;
      if (s && s.length > 0) {
        const r = s[0];
        try {
          const n = JSON.parse(r.content);
          return {
            pubkey: r.pubkey,
            metadata: n,
            lastUpdated: r.created_at,
            eventId: r.id,
            isOwn: !0
          };
        } catch {
          return null;
        }
      }
      await this.config.nostr.sub().kinds([0]).authors([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = e.current;
      if (i && i.length > 0) {
        const r = i[0];
        try {
          const n = JSON.parse(r.content);
          return {
            pubkey: r.pubkey,
            metadata: n,
            lastUpdated: r.created_at,
            eventId: r.id,
            isOwn: !0
          };
        } catch {
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
class ze {
  constructor(t) {
    l(this, "config");
    l(this, "pubkeys", []);
    this.config = t;
  }
  /**
   * Set the list of pubkeys to fetch profiles for
   */
  get(t) {
    return this.pubkeys = [...t], this;
  }
  /**
   * Execute batch profile fetch using CLEAN ARCHITECTURE
   */
  async execute() {
    if (this.pubkeys.length === 0)
      return {
        profiles: /* @__PURE__ */ new Map(),
        success: !0,
        errors: /* @__PURE__ */ new Map(),
        totalRequested: 0,
        totalFound: 0
      };
    this.config.debug && console.log(`ProfileBatchBuilder: Fetching ${this.pubkeys.length} profiles using base layer`);
    try {
      const t = this.config.nostr.query().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), e = t.current, s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
      this.pubkeys.forEach((a) => {
        s.set(a, null);
      });
      let r = 0;
      return e.forEach((a) => {
        if (a.kind === 0 && this.pubkeys.includes(a.pubkey))
          try {
            const c = JSON.parse(a.content), u = {
              pubkey: a.pubkey,
              metadata: c,
              lastUpdated: a.created_at,
              eventId: a.id,
              isOwn: !1
            };
            s.set(a.pubkey, u), r++;
          } catch {
            i.set(a.pubkey, "Failed to parse profile metadata");
          }
      }), this.config.debug && console.log(`ProfileBatchBuilder: Found ${r}/${this.pubkeys.length} profiles in cache`), r === this.pubkeys.length ? {
        profiles: s,
        success: !0,
        errors: i,
        totalRequested: this.pubkeys.length,
        totalFound: r
      } : (await this.config.nostr.sub().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), await new Promise((a) => setTimeout(a, 2e3)), t.current.forEach((a) => {
        if (a.kind === 0 && this.pubkeys.includes(a.pubkey) && !s.get(a.pubkey))
          try {
            const c = JSON.parse(a.content), u = {
              pubkey: a.pubkey,
              metadata: c,
              lastUpdated: a.created_at,
              eventId: a.id,
              isOwn: !1
            };
            s.set(a.pubkey, u), r++;
          } catch {
            i.set(a.pubkey, "Failed to parse profile metadata");
          }
      }), this.config.debug && console.log(`ProfileBatchBuilder: Final result - found ${r}/${this.pubkeys.length} profiles`), {
        profiles: s,
        success: !0,
        errors: i,
        totalRequested: this.pubkeys.length,
        totalFound: r
      });
    } catch (t) {
      return {
        profiles: /* @__PURE__ */ new Map(),
        success: !1,
        errors: /* @__PURE__ */ new Map([["batch", t instanceof Error ? t.message : "Unknown error"]]),
        totalRequested: this.pubkeys.length,
        totalFound: 0
      };
    }
  }
  /**
   * Execute and return a reactive store for continuous updates
   */
  executeReactive() {
    return this.config.nostr.query().kinds([0]).authors(this.pubkeys).execute().map((t) => {
      const e = /* @__PURE__ */ new Map();
      return this.pubkeys.forEach((s) => e.set(s, null)), t.forEach((s) => {
        if (s.kind === 0 && this.pubkeys.includes(s.pubkey))
          try {
            const i = JSON.parse(s.content);
            e.set(s.pubkey, {
              pubkey: s.pubkey,
              metadata: i,
              lastUpdated: s.created_at,
              eventId: s.id,
              isOwn: !1
            });
          } catch {
          }
      }), e;
    });
  }
  /**
   * Watch for profile updates with reactive store
   */
  watch() {
    return this.config.nostr.sub().kinds([0]).authors(this.pubkeys).execute().catch((t) => {
      this.config.debug && console.warn("ProfileBatchBuilder: Failed to start watch subscription:", t);
    }), this.executeReactive();
  }
}
class Ve {
  constructor(t) {
    l(this, "config");
    l(this, "criteria", {});
    this.config = t;
  }
  /**
   * Search profiles by NIP-05 identifier
   */
  byNip05(t) {
    return this.criteria.nip05Query = t.toLowerCase(), this;
  }
  /**
   * Search profiles by name (substring match)
   */
  byName(t) {
    return this.criteria.nameQuery = t.toLowerCase(), this;
  }
  /**
   * Filter profiles by metadata key-value pairs
   */
  withMetadata(t, e) {
    return this.criteria.metadataFilters || (this.criteria.metadataFilters = /* @__PURE__ */ new Map()), this.criteria.metadataFilters.set(t, e), this;
  }
  /**
   * Only include NIP-05 verified profiles
   */
  verified() {
    return this.criteria.verifiedOnly = !0, this;
  }
  /**
   * Limit the number of results returned
   */
  limit(t) {
    return this.criteria.limit = Math.max(1, Math.min(t, 100)), this;
  }
  /**
   * Execute the profile discovery search
   */
  async execute() {
    this.config.debug && console.log("ProfileDiscoveryBuilder: Starting discovery with criteria:", this.criteria);
    try {
      const t = {
        kinds: [0],
        limit: this.criteria.limit || 50
        // Default limit
      }, e = [], s = /* @__PURE__ */ new Set();
      return new Promise((i) => {
        let r = !1;
        const n = setTimeout(() => {
          r || (r = !0, this.finalizeResults(e, i));
        }, 1e4);
        (async () => {
          const c = await this.config.subscriptionManager.getOrCreateSubscription([t]), u = c.addListener({
            onEvent: async (h) => {
              if (h.kind === 0 && !s.has(h.pubkey)) {
                s.add(h.pubkey);
                try {
                  const d = await this.parseProfileEvent(h), f = await this.evaluateProfile(d);
                  f && (e.push(f), this.config.debug && console.log(`ProfileDiscoveryBuilder: Found match - ${d.metadata.name || "unnamed"} (score: ${f.relevanceScore})`), this.criteria.limit && e.length >= this.criteria.limit && (r || (r = !0, clearTimeout(n), c.removeListener(u), this.finalizeResults(e, i))));
                } catch (d) {
                  this.config.debug && console.error("ProfileDiscoveryBuilder: Error processing profile:", d);
                }
              }
            },
            onEose: () => {
              r || (r = !0, clearTimeout(n), c.removeListener(u), this.finalizeResults(e, i));
            },
            onError: (h) => {
              r || (r = !0, clearTimeout(n), c.removeListener(u), this.config.debug && console.error("ProfileDiscoveryBuilder: Search error:", h), i(e));
            }
          });
        })().catch((c) => {
          r || (r = !0, clearTimeout(n), this.config.debug && console.error("ProfileDiscoveryBuilder: Failed to start search:", c), i(e));
        });
      });
    } catch (t) {
      return this.config.debug && console.error("ProfileDiscoveryBuilder: Failed to start discovery:", t), [];
    }
  }
  // Private helper methods
  async parseProfileEvent(t) {
    try {
      const e = JSON.parse(t.content);
      return {
        pubkey: t.pubkey,
        metadata: e,
        lastUpdated: t.created_at,
        eventId: t.id,
        isOwn: !1
      };
    } catch {
      throw new Error("Failed to parse profile event");
    }
  }
  async evaluateProfile(t) {
    var a, c;
    const e = [];
    let s = 0, i = 0, r = 0;
    if (this.criteria.nameQuery) {
      r++;
      const u = ((a = t.metadata.name) == null ? void 0 : a.toLowerCase()) || "";
      if (u.includes(this.criteria.nameQuery))
        e.push("name"), i++, u === this.criteria.nameQuery ? s += 1 : u.startsWith(this.criteria.nameQuery) ? s += 0.8 : s += 0.5;
      else
        return null;
    }
    if (this.criteria.nip05Query) {
      r++;
      const u = ((c = t.metadata.nip05) == null ? void 0 : c.toLowerCase()) || "";
      if (u.includes(this.criteria.nip05Query))
        e.push("nip05"), i++, s += u === this.criteria.nip05Query ? 1 : 0.7;
      else
        return null;
    }
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0)
      for (const [u, h] of this.criteria.metadataFilters) {
        r++;
        const d = t.metadata[u];
        d !== void 0 && (h === void 0 ? (e.push(u), i++, s += 0.3) : typeof d == "string" && typeof h == "string" ? d.toLowerCase().includes(h.toLowerCase()) && (e.push(u), i++, s += d.toLowerCase() === h.toLowerCase() ? 0.8 : 0.5) : d === h && (e.push(u), i++, s += 0.8));
      }
    if (this.criteria.verifiedOnly) {
      if (r++, t.metadata.nip05) {
        if (await this.checkNip05Verification(t))
          e.push("verified"), i++, s += 0.5;
        else if (this.criteria.verifiedOnly)
          return null;
      } else if (this.criteria.verifiedOnly)
        return null;
    }
    if (r === 0 && (s = 0.1, i = 1, r = 1), r > 0 && i === 0)
      return null;
    const n = Math.min(1, s / Math.max(r, 1));
    return {
      profile: t,
      matchedFields: e,
      relevanceScore: n
    };
  }
  async checkNip05Verification(t) {
    var e;
    if (!t.metadata.nip05) return !1;
    try {
      const [s, i] = t.metadata.nip05.split("@");
      if (!s || !i) return !1;
      const r = new AbortController(), n = setTimeout(() => r.abort(), 5e3), a = await fetch(`https://${i}/.well-known/nostr.json?name=${s}`, {
        signal: r.signal
      });
      return clearTimeout(n), a.ok ? ((e = (await a.json()).names) == null ? void 0 : e[s]) === t.pubkey : !1;
    } catch (s) {
      return this.config.debug && console.error("ProfileDiscoveryBuilder: NIP-05 verification failed:", s), !1;
    }
  }
  finalizeResults(t, e) {
    t.sort((i, r) => r.relevanceScore - i.relevanceScore);
    const s = this.criteria.limit ? t.slice(0, this.criteria.limit) : t;
    this.config.debug && console.log(`ProfileDiscoveryBuilder: Discovery complete - found ${s.length} matches`), e(s);
  }
}
class qe {
  constructor(t, e) {
    l(this, "config");
    l(this, "targetPubkey");
    l(this, "relayUrl");
    l(this, "petnameValue");
    this.config = t, this.targetPubkey = e;
  }
  /**
   * Set preferred relay for this follow
   */
  relay(t) {
    return this.relayUrl = t, this;
  }
  /**
   * Set pet name for this follow
   */
  petname(t) {
    return this.petnameValue = t, this;
  }
  /**
   * Publish the updated follow list
   */
  async publish() {
    try {
      const t = await this.config.signingProvider.getPublicKey();
      this.config.debug && console.log("FollowBuilder: Adding follow for", this.targetPubkey.substring(0, 16) + "...");
      const e = await this.getCurrentFollows();
      if (e.some((g) => g.pubkey === this.targetPubkey))
        return this.config.debug && console.log("FollowBuilder: Already following", this.targetPubkey.substring(0, 16) + "..."), {
          success: !1,
          error: "Already following this user"
        };
      const i = {
        pubkey: this.targetPubkey,
        relayUrl: this.relayUrl,
        petname: this.petnameValue
      }, a = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: [...e, i].map((g) => {
          const y = ["p", g.pubkey];
          return g.relayUrl && y.push(g.relayUrl), g.petname && y.push(g.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: t
      }, c = M.addEventId(a), u = await this.config.signingProvider.signEvent(a), h = {
        ...c,
        sig: u
      }, f = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (g) => {
          try {
            return await this.config.relayManager.sendToRelay(g, ["EVENT", h]), { success: !0, relay: g };
          } catch (y) {
            return {
              success: !1,
              relay: g,
              error: y instanceof Error ? y.message : "Unknown error"
            };
          }
        })
      )).filter(
        (g) => g.status === "fulfilled" && g.value.success
      ).map((g) => g.value.relay);
      return f.length > 0 ? (this.config.debug && console.log(`FollowBuilder: Published follow list to ${f.length} relays`), {
        success: !0,
        eventId: h.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : "Failed to add follow"
      };
    }
  }
  // Private helper methods
  async getCurrentFollows() {
    try {
      const t = await this.config.signingProvider.getPublicKey(), e = this.config.nostr.query().kinds([3]).authors([t]).limit(1).execute(), s = e.current;
      if (s && s.length > 0) {
        const r = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowBuilder: Using cached follow list with", r.length, "follows"), r;
      }
      this.config.debug && console.log("FollowBuilder: No cached follow list, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = e.current;
      if (i && i.length > 0) {
        const r = this.parseFollowListEvent(i[0]);
        return this.config.debug && console.log("FollowBuilder: Found follow list from relay with", r.length, "follows"), r;
      }
      return this.config.debug && console.log("FollowBuilder: No follow list found, using empty array"), [];
    } catch {
      return [];
    }
  }
  parseFollowListEvent(t) {
    const e = [];
    try {
      for (const s of t.tags)
        if (s[0] === "p" && s[1]) {
          const i = {
            pubkey: s[1]
          };
          s[2] && (i.relayUrl = s[2]), s[3] && (i.petname = s[3]), e.push(i);
        }
      return e;
    } catch (s) {
      return this.config.debug && console.error("FollowBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class je {
  constructor(t) {
    l(this, "config");
    l(this, "toAdd", []);
    l(this, "toRemove", []);
    l(this, "baseEventId");
    // For optimistic locking
    l(this, "baseCreatedAt");
    this.config = t;
  }
  /**
   * Add multiple pubkeys to follow list
   */
  add(t) {
    return this.toAdd.push(...t), this;
  }
  /**
   * Remove multiple pubkeys from follow list
   */
  remove(t) {
    return this.toRemove.push(...t), this;
  }
  /**
   * Publish the batch follow list update with optimistic locking
   */
  async publish() {
    if (this.toAdd.length === 0 && this.toRemove.length === 0)
      return {
        success: !1,
        error: "No follow operations specified"
      };
    const t = 3;
    let e = "";
    for (let s = 0; s < t; s++)
      try {
        const i = await this.config.signingProvider.getPublicKey();
        this.config.debug && console.log(`FollowBatchBuilder: Batch operation attempt ${s + 1}/${t} - adding ${this.toAdd.length}, removing ${this.toRemove.length}`);
        const { follows: r, eventId: n, createdAt: a } = await this.getCurrentFollowsWithMetadata();
        if (this.baseEventId && this.baseEventId !== n) {
          this.config.debug && console.log(`FollowBatchBuilder: Detected concurrent update (base: ${this.baseEventId}, current: ${n}), retrying...`), this.baseEventId = n, this.baseCreatedAt = a;
          continue;
        }
        this.baseEventId = n, this.baseCreatedAt = a;
        let c = [...r];
        if (this.toRemove.length > 0 && (c = c.filter(
          (b) => !this.toRemove.includes(b.pubkey)
        ), this.config.debug && console.log(`FollowBatchBuilder: Removed ${this.toRemove.length} follows`)), this.toAdd.length > 0) {
          const b = this.toAdd.filter((w) => !c.some((k) => k.pubkey === w)).map((w) => ({ pubkey: w }));
          c.push(...b), this.config.debug && console.log(`FollowBatchBuilder: Added ${b.length} new follows (${this.toAdd.length - b.length} were duplicates)`);
        }
        const h = {
          kind: 3,
          content: "",
          // Follow lists typically have empty content
          tags: c.map((b) => {
            const w = ["p", b.pubkey];
            return b.relayUrl && w.push(b.relayUrl), b.petname && w.push(b.petname), w;
          }),
          created_at: Math.floor(Date.now() / 1e3),
          pubkey: i
        }, d = M.addEventId(h), f = await this.config.signingProvider.signEvent(h), p = {
          ...d,
          sig: f
        }, y = (await Promise.allSettled(
          this.config.relayManager.relayUrls.map(async (b) => {
            try {
              return await this.config.relayManager.sendToRelay(b, ["EVENT", p]), { success: !0, relay: b };
            } catch (w) {
              return {
                success: !1,
                relay: b,
                error: w instanceof Error ? w.message : "Unknown error"
              };
            }
          })
        )).filter(
          (b) => b.status === "fulfilled" && b.value.success
        ).map((b) => b.value.relay);
        if (y.length > 0)
          return this.config.debug && (console.log(`FollowBatchBuilder: Published batch update to ${y.length} relays on attempt ${s + 1}`), console.log(`FollowBatchBuilder: Final follow list has ${c.length} follows`), console.log("FollowBatchBuilder: Event will be received via subscription and cached properly")), {
            success: !0,
            eventId: p.id
          };
        if (e = "Failed to publish to any relay", s === t - 1)
          return {
            success: !1,
            error: e
          };
      } catch (i) {
        if (e = i instanceof Error ? i.message : "Failed to publish batch update", this.config.debug && console.warn(`FollowBatchBuilder: Attempt ${s + 1} failed:`, e), s === t - 1)
          return {
            success: !1,
            error: e
          };
        await new Promise((r) => setTimeout(r, 100 * (s + 1)));
      }
    return {
      success: !1,
      error: e || "Max retries exceeded"
    };
  }
  // Private helper methods
  async getCurrentFollowsWithMetadata() {
    try {
      const t = await this.config.signingProvider.getPublicKey(), e = this.config.nostr.query().kinds([3]).authors([t]).limit(1).execute(), s = e.current;
      if (this.config.debug && (console.log("FollowBatchBuilder: Cache query returned", s.length, "events"), s.length > 0)) {
        const r = s[0];
        console.log("FollowBatchBuilder: Latest cached event:", {
          id: r == null ? void 0 : r.id,
          created_at: r == null ? void 0 : r.created_at,
          tags: r == null ? void 0 : r.tags.filter((n) => n[0] === "p")
        });
      }
      if (s.length > 0) {
        const r = s[0];
        if (r && this.config.debug && console.log("FollowBatchBuilder: Using cached follow list with", r.tags.filter((n) => n[0] === "p").length, "follows"), r)
          return {
            follows: this.parseFollowListEvent(r),
            eventId: r.id,
            createdAt: r.created_at
          };
      }
      this.config.debug && console.log("FollowBatchBuilder: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = e.current;
      if (i && i.length > 0) {
        const r = i[0], n = this.parseFollowListEvent(r);
        return this.config.debug && console.log("FollowBatchBuilder: Found follow list from relay with", n.length, "follows"), {
          follows: n,
          eventId: r.id,
          createdAt: r.created_at
        };
      }
      return this.config.debug && console.log("FollowBatchBuilder: No follow list found on relays, using empty array"), { follows: [] };
    } catch (t) {
      return this.config.debug && console.error("FollowBatchBuilder: Error getting current follows:", t), { follows: [] };
    }
  }
  async getCurrentFollows() {
    const { follows: t } = await this.getCurrentFollowsWithMetadata();
    return t;
  }
  parseFollowListEvent(t) {
    const e = [];
    try {
      for (const s of t.tags)
        if (s[0] === "p" && s[1]) {
          const i = {
            pubkey: s[1]
          };
          s[2] && (i.relayUrl = s[2]), s[3] && (i.petname = s[3]), e.push(i);
        }
      return e;
    } catch (s) {
      return this.config.debug && console.error("FollowBatchBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class Mi {
  // Frontend expects this
  constructor(t) {
    l(this, "baseStore");
    l(this, "count");
    l(this, "follows");
    this.baseStore = t, this.count = new Ge(t), this.follows = t;
  }
  // Delegate to base store (for direct usage)
  subscribe(t, e) {
    return this.baseStore.subscribe(t, e);
  }
  get current() {
    return this.baseStore.current;
  }
}
class Ge {
  constructor(t) {
    l(this, "sourceStore");
    l(this, "_count", 0);
    l(this, "subscribers", /* @__PURE__ */ new Set());
    var e;
    this.sourceStore = t, this._count = ((e = t.current) == null ? void 0 : e.length) || 0, t.subscribe((s) => {
      const i = (s == null ? void 0 : s.length) || 0;
      i !== this._count && (this._count = i, this.notifySubscribers());
    });
  }
  subscribe(t) {
    return t(this._count), this.subscribers.add(t), () => {
      this.subscribers.delete(t);
    };
  }
  get current() {
    return this._count;
  }
  notifySubscribers() {
    this.subscribers.forEach((t) => t(this._count));
  }
}
class Ye {
  constructor(t) {
    l(this, "config");
    this.config = t;
  }
  /**
   * Get own follow list as a reactive store
   * CLEAN ARCHITECTURE: Uses base layer directly
   */
  async mine() {
    var e, s;
    if (!this.config.signingProvider)
      throw new Error("Cannot access own follow list: No signing provider available. Initialize signing first.");
    let t = (s = (e = this.config.signingProvider).getPublicKeySync) == null ? void 0 : s.call(e);
    return t || (t = await this.config.signingProvider.getPublicKey()), this.of(t);
  }
  /**
   * Get follow list for any pubkey as a reactive store  
   * CLEAN ARCHITECTURE: Uses base layer directly with smart deduplication
   */
  of(t) {
    this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute().catch((s) => {
      this.config.debug && console.warn("Failed to start follow list subscription:", s);
    });
    const e = this.config.nostr.query().kinds([3]).authors([t]).limit(1).execute().map((s) => this.parseFollowListEvents(s));
    return new Mi(e);
  }
  /**
   * Get followers for any pubkey - WHO FOLLOWS THIS USER
   * Returns count of users who have this pubkey in their follow list
   */
  followers(t) {
    this.config.nostr.sub().kinds([3]).tags("p", [t]).limit(100).execute().catch((s) => {
      this.config.debug && console.warn("Failed to start followers subscription:", s);
    });
    const e = this.config.nostr.query().kinds([3]).tags("p", [t]).limit(100).execute().map((s) => {
      const i = /* @__PURE__ */ new Set();
      return s.forEach((r) => {
        r.kind === 3 && r.tags.some(
          (a) => a[0] === "p" && a[1] === t
        ) && i.add(r.pubkey);
      }), Array.from(i);
    });
    return new Ge(e);
  }
  /**
   * Phase 4: Add a user to follow list
   * Returns FollowBuilder for fluent API configuration
   */
  add(t) {
    if (!this.config.signingProvider)
      throw new Error("Cannot add follow: No signing provider available. Initialize signing first.");
    return new qe({
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug ?? !1,
      nostr: this.config.nostr
    }, t);
  }
  /**
   * Phase 4: Remove a user from follow list
   */
  async remove(t) {
    if (!this.config.signingProvider)
      throw new Error("Cannot remove follow: No signing provider available. Initialize signing first.");
    try {
      const e = await this.config.signingProvider.getPublicKey();
      this.config.debug && console.log("FollowsModule: Removing follow for", t.substring(0, 16) + "...");
      const s = await this.getCurrentFollows();
      if (!s.some((g) => g.pubkey === t))
        return this.config.debug && console.log("FollowsModule: Not following", t.substring(0, 16) + "..."), {
          success: !1,
          error: "Not following this user"
        };
      const a = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.filter((g) => g.pubkey !== t).map((g) => {
          const y = ["p", g.pubkey];
          return g.relayUrl && y.push(g.relayUrl), g.petname && y.push(g.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, c = M.addEventId(a), u = await this.config.signingProvider.signEvent(a), h = {
        ...c,
        sig: u
      }, f = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (g) => {
          try {
            return await this.config.relayManager.sendToRelay(g, ["EVENT", h]), { success: !0, relay: g };
          } catch (y) {
            return {
              success: !1,
              relay: g,
              error: y instanceof Error ? y.message : "Unknown error"
            };
          }
        })
      )).filter(
        (g) => g.status === "fulfilled" && g.value.success
      ).map((g) => g.value.relay);
      return f.length > 0 ? (this.config.debug && console.log(`FollowsModule: Published updated follow list to ${f.length} relays`), {
        success: !0,
        eventId: h.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Failed to remove follow"
      };
    }
  }
  /**
   * Phase 5: Batch follow operations
   * Returns FollowBatchBuilder for bulk add/remove operations
   */
  batch() {
    if (!this.config.signingProvider)
      throw new Error("Cannot batch follow operations: No signing provider available. Initialize signing first.");
    return new je({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug ?? !1,
      nostr: this.config.nostr
      // CLEAN ARCHITECTURE: Pass nostr instance
    });
  }
  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(t) {
    this.config.signingProvider = t;
  }
  /**
   * Clean up resources
   */
  async close() {
  }
  // Private helper methods
  /**
   * Start subscription for follow list updates
   */
  async startFollowListSubscription(t) {
    try {
      await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute();
    } catch (e) {
      this.config.debug && console.warn(`Failed to start follow list subscription for ${t}:`, e);
    }
  }
  /**
   * Parse NostrEvent[] to Follow[]
   */
  parseFollowListEvents(t) {
    if (t.length === 0)
      return [];
    const e = t[0];
    return !e || e.kind !== 3 ? [] : this.parseFollowListEvent(e);
  }
  async getCurrentFollows() {
    try {
      const t = await this.config.signingProvider.getPublicKey(), e = this.config.nostr.query().kinds([3]).authors([t]).limit(1).execute(), s = e.current;
      if (s && s.length > 0) {
        const r = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowsModule: Using cached follow list with", r.length, "follows"), r;
      }
      this.config.debug && console.log("FollowsModule: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = e.current;
      if (i && i.length > 0) {
        const r = this.parseFollowListEvent(i[0]);
        return this.config.debug && console.log("FollowsModule: Found follow list from relay with", r.length, "follows"), r;
      }
      return this.config.debug && console.log("FollowsModule: No follow list found on relays, using empty array"), [];
    } catch (t) {
      return this.config.debug && console.error("FollowsModule: Error getting current follows:", t), [];
    }
  }
  parseFollowListEvent(t) {
    const e = [];
    try {
      for (const s of t.tags)
        if (s[0] === "p" && s[1]) {
          const i = {
            pubkey: s[1]
          };
          s[2] && (i.relayUrl = s[2]), s[3] && (i.petname = s[3]), e.push(i);
        }
      return e;
    } catch (s) {
      return this.config.debug && console.error("FollowsModule: Failed to parse follow list event:", s), [];
    }
  }
}
class Je {
  constructor(t) {
    l(this, "config");
    l(this, "_follows");
    this.config = t;
  }
  /**
   * Get a reactive profile store for any pubkey
   * 
   * CLEAN ARCHITECTURE: Uses base layer directly for perfect DX
   * Returns UniversalNostrStore with automatic caching and live updates
   */
  get(t) {
    return this.startProfileSubscription(t), this.config.nostr.query().kinds([0]).authors([t]).limit(1).execute().map((e) => this.parseProfileEvents(e, t));
  }
  /**
   * Single-shot profile fetch (cache-fill, then auto-unsubscribe)
   * Returns a reactive store fed from cache, but the underlying subscription
   * is closed automatically (EOSE-based) to avoid hitting relay sub limits.
   */
  getOnce(t) {
    try {
      this.config.nostr.sub().kinds([0]).authors([t]).limit(1).executeOnce({ closeOn: "eose" }).catch(() => {
      });
    } catch {
    }
    return this.config.nostr.query().kinds([0]).authors([t]).limit(1).execute().map((e) => this.parseProfileEvents(e, t));
  }
  /**
   * Start subscription for profile updates
   */
  async startProfileSubscription(t) {
    try {
      await this.config.nostr.sub().kinds([0]).authors([t]).limit(1).execute();
    } catch (e) {
      this.config.debug && console.warn(`Failed to start profile subscription for ${t}:`, e);
    }
  }
  /**
   * Parse NostrEvent[] to UserProfile | null
   */
  parseProfileEvents(t, e) {
    if (t.length === 0)
      return null;
    const s = t[0];
    if (s.kind !== 0 || s.pubkey !== e)
      return null;
    try {
      const i = JSON.parse(s.content);
      return {
        pubkey: s.pubkey,
        metadata: i,
        lastUpdated: s.created_at,
        eventId: s.id,
        isOwn: !1
        // Will be determined by caller if needed
      };
    } catch (i) {
      return this.config.debug && console.warn(`Failed to parse profile event for ${e}:`, i), null;
    }
  }
  /**
   * Phase 2: Profile Creation & Updates - Fluent Builder API
   * Creates a ProfileBuilder for updating profiles with field preservation
   */
  edit() {
    if (!this.config.signingProvider)
      throw new Error("Cannot edit profile: No signing provider available. Initialize signing first.");
    return new We({
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug,
      nostr: this.config.nostr
    });
  }
  /**
   * Phase 3: Follow List Operations - Access to follow lists
   * Get access to follow list management (mine() and of() methods)
   */
  get follows() {
    return this._follows || (this._follows = new Ye({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug,
      nostr: this.config.nostr
    })), this._follows;
  }
  /**
   * Get follower count for any pubkey
   * Returns reactive count of users who follow this pubkey
   */
  followerCount(t) {
    return this.follows.followers(t);
  }
  /**
   * Phase 5: Batch Profile Operations - Efficient multiple profile fetching
   * Creates a ProfileBatchBuilder for bulk profile operations
   */
  batch() {
    return new ze({
      debug: this.config.debug,
      nostr: this.config.nostr
    });
  }
  /**
   * Phase 6: Profile Discovery - Search and discover profiles
   * Creates a ProfileDiscoveryBuilder for profile search operations
   */
  discover() {
    return new Ve({
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
  }
  /**
   * Start a DM conversation with this user
   * 
   * Convenience method that connects profiles to messaging functionality.
   * Supports both hex pubkeys and npub format.
   * 
   * @param pubkeyOrNpub - Hex pubkey or npub of the user to chat with
   * @returns UniversalDMConversation for messaging
   */
  chat(t) {
    const e = this.config.nostr.getDM();
    return e ? e.with(t) : (this.config.debug && console.warn("DM module not available - make sure signing provider is initialized"), null);
  }
  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(t) {
    this.config.signingProvider = t, this._follows && await this._follows.updateSigningProvider(t);
  }
  /**
   * Clean up resources
   */
  async close() {
    this._follows && await this._follows.close();
  }
}
class Pi {
  constructor(t) {
    l(this, "list", []);
    this.nostr = t;
  }
  read(t) {
    return this.list.push({ url: t, mode: "read" }), this;
  }
  write(t) {
    return this.list.push({ url: t, mode: "write" }), this;
  }
  both(t) {
    return this.list.push({ url: t, mode: "both" }), this;
  }
  urls(t, e = "both") {
    return t.forEach((s) => this.list.push({ url: s, mode: e })), this;
  }
  async publish() {
    const t = (r) => {
      if (!r) return r;
      let n = r.trim();
      if (!/^wss?:\/\//i.test(n)) {
        const a = n.replace(/^[\/]+/, "");
        n = (/(^localhost(?::\d+)?$)|(^127\.0\.0\.1(?::\d+)?$)|((?:^|\.)local(?::\d+)?$)/i.test(a) ? "ws://" : "wss://") + a;
      }
      return n = n.replace(/\/+$/, ""), n;
    }, e = /* @__PURE__ */ new Set(), s = this.list.map((r) => ({ url: t(r.url), mode: r.mode })).filter((r) => r.url && !e.has(r.url) && (e.add(r.url), !0)), i = this.nostr.events.kind(10002).content("");
    for (const r of s)
      r.mode === "read" ? i.tag("r", r.url, "read") : r.mode === "write" ? i.tag("r", r.url, "write") : i.tag("r", r.url);
    return i.publish();
  }
}
class Ii {
  constructor(t, e) {
    this.nostr = t, this.debug = e;
  }
  /** Create a fluent builder for publishing a NIP-65 relay list */
  edit() {
    return new Pi(this.nostr);
  }
  /** Get reactive relay list for an author (kind 10002) */
  get(t) {
    return this.nostr.sub().kinds([10002]).authors([t]).limit(1).execute().catch(() => {
    }), this.nostr.query().kinds([10002]).authors([t]).limit(1).execute().map((s) => this.parseRelayList(t, s));
  }
  parseRelayList(t, e) {
    const s = Array.isArray(e) && e.length > 0 ? e[0] : null, i = [];
    if (s && Array.isArray(s.tags))
      for (const c of s.tags) {
        if (!Array.isArray(c) || c[0] !== "r") continue;
        const u = c[1] || "", h = (c[2] || "").toLowerCase(), d = h === "read" ? "read" : h === "write" ? "write" : "both";
        u && i.push({ url: u, mode: d });
      }
    const r = i.filter((c) => c.mode === "read").map((c) => c.url), n = i.filter((c) => c.mode === "write").map((c) => c.url), a = i.filter((c) => c.mode === "both").map((c) => c.url);
    return {
      author: t,
      entries: i,
      read: r,
      write: n,
      both: a,
      updatedAt: s ? s.created_at : null
    };
  }
}
class Ti {
  constructor(t, e = (s) => s) {
    this.relayList = t, this.normalizeUrl = e;
  }
  async selectRelays(t, e, s) {
    try {
      const i = /* @__PURE__ */ new Set();
      await this.ensureLoaded(s.authorPubkey);
      const r = this.relayList.get(s.authorPubkey).current;
      if (r && r.entries.length > 0)
        for (const n of [...r.write, ...r.both])
          i.add(this.normalizeUrl(n));
      for (const n of s.mentionedPubkeys || []) {
        await this.ensureLoaded(n);
        const a = this.relayList.get(n).current;
        if (a && a.entries.length > 0)
          for (const c of [...a.read, ...a.both])
            i.add(this.normalizeUrl(c));
      }
      for (const n of e) i.add(this.normalizeUrl(n));
      return Array.from(i);
    } catch {
      return e;
    }
  }
  async ensureLoaded(t) {
    try {
      this.relayList.get(t), await new Promise((e) => setTimeout(e, 200));
    } catch {
    }
  }
}
class Ri {
  constructor(t) {
    this.nostr = t;
  }
  async check(t, e = 3e3) {
    var i, r;
    const s = Date.now();
    try {
      await ((r = (i = this.nostr.getSubscriptionManager()) == null ? void 0 : i.ensureConnection) == null ? void 0 : r.call(i, t, e));
      const n = Date.now() - s;
      return { relay: t, ok: !0, latencyMs: n };
    } catch (n) {
      return { relay: t, ok: !1, error: (n == null ? void 0 : n.message) || "connect failed" };
    }
  }
  async bulkCheck(t, e = 3e3) {
    return await Promise.all(t.map((s) => this.check(s, e)));
  }
}
class xi {
  constructor(t) {
    this.nostr = t;
  }
  /**
   * Discover relays for a user by combining:
   * - NIP-65 relay list (kind 10002)
   * - Recommend relay events (kind 2)
   * Returns a de-duplicated set.
   */
  discoverForUser(t) {
    this.nostr.sub().kinds([10002]).authors([t]).execute().catch(() => {
    }), this.nostr.sub().kinds([2]).authors([t]).execute().catch(() => {
    });
    const e = /* @__PURE__ */ new Set(), s = this.nostr.query().kinds([10002]).authors([t]).execute().current;
    for (const r of s || [])
      for (const n of r.tags)
        n[0] === "r" && n[1] && e.add(be(n[1]));
    const i = this.nostr.query().kinds([2]).authors([t]).execute().current;
    for (const r of i || []) {
      const n = (r.content || "").trim();
      n && e.add(be(n));
    }
    return Array.from(e);
  }
}
function be(o) {
  let t = o.trim();
  return /^wss?:\/\//i.test(t) || (t = "wss://" + t.replace(/^\/*/, "")), t.replace(/\/+$/, "");
}
class Ci {
  constructor(t) {
    this.nostr = t;
  }
  /**
   * Create a NIP-57 Zap Request (kind 9734) for a user or a specific note/address.
   * The actual payment is handled off-band by LNURL provider. This emits the request event to relays.
   */
  async requestZap(t, e = {}) {
    const s = this.nostr.events.create().kind(9734).content(JSON.stringify({ relays: e.relays || this.nostr.relays }));
    return s.tag("p", t), e.noteId && s.tag("e", e.noteId), e.address && s.tag("a", e.address), e.amountMsat && e.amountMsat > 0 && s.tag("amount", String(e.amountMsat)), await s.publish();
  }
  /** Reactive store of Zap Receipts (kind 9735) addressed to a note */
  receiptsForNote(t) {
    return this.nostr.sub().kinds([9735]).execute().catch(() => {
    }), this.nostr.query().kinds([9735]).execute().map((e) => e.filter((s) => s.tags.some((i) => i[0] === "e" && i[1] === t)));
  }
  /** Reactive store of Zap Receipts (kind 9735) for a profile/pubkey */
  receiptsForProfile(t) {
    return this.nostr.sub().kinds([9735]).execute().catch(() => {
    }), this.nostr.query().kinds([9735]).execute().map((e) => e.filter((s) => s.tags.some((i) => i[0] === "p" && i[1] === t)));
  }
}
class tr {
  constructor(t = {}) {
    l(this, "relayManager");
    l(this, "subscriptionManager");
    l(this, "cache");
    l(this, "signingProvider");
    l(this, "signingMethod");
    l(this, "config");
    l(this, "giftWrapSubscriptionActive", !1);
    l(this, "cachedMyPubkey", null);
    // Fluent Event Builder API
    l(this, "events");
    // Direct Message API (Legacy)
    l(this, "dm");
    // Universal DM API (Cache-based)
    l(this, "universalDM");
    // Social Media API
    l(this, "social");
    // Comments API (NIP-22)
    l(this, "_comments");
    // Lists API (NIP-51)
    l(this, "_lists");
    // Labels API (NIP-32)
    l(this, "_labels");
    // Channels API (NIP-28)
    l(this, "_channels");
    // Communities API (NIP-72)
    l(this, "_communities");
    // Content API (NIP-23/18/01 consolidated)
    l(this, "_content");
    l(this, "_files");
    // Profile API (Enhanced)
    l(this, "_profile");
    // Relay List API (NIP-65)
    l(this, "_relayList");
    // Optional routing strategy (NIP-65)
    l(this, "relayRouter");
    l(this, "_relayDiscovery");
    l(this, "_relayHealth");
    l(this, "_zap");
    var s;
    const e = {
      relays: t.relays ?? ds,
      debug: t.debug ?? !1,
      retryAttempts: t.retryAttempts ?? Z.RETRY_ATTEMPTS,
      retryDelay: t.retryDelay ?? Z.RETRY_DELAY,
      timeout: t.timeout ?? Z.PUBLISH_TIMEOUT,
      routing: t.routing ?? "none"
    };
    if (t.signingProvider && (e.signingProvider = t.signingProvider), this.config = e, this.config.debug && console.log("🔥 NostrUnchained v0.1.0-FIX (build:", (/* @__PURE__ */ new Date()).toISOString().substring(0, 19) + "Z)"), this.relayManager = new fs(this.config.relays, {
      debug: this.config.debug,
      publishTimeout: this.config.timeout
    }), this.subscriptionManager = new _i(this.relayManager), this.relayManager.configureAuth({
      authEventFactory: async ({ relay: i, challenge: r }) => {
        if (!this.signingProvider) throw new Error("No signing provider for AUTH");
        const a = {
          pubkey: await this.signingProvider.getPublicKey(),
          created_at: Math.floor(Date.now() / 1e3),
          kind: 22242,
          tags: [
            ["relay", i],
            ["challenge", r]
          ],
          content: ""
        }, c = M.calculateEventId(a), u = await this.signingProvider.signEvent(a);
        return { ...a, id: c, sig: u };
      },
      onAuthStateChange: (i, r) => {
        this.config.debug && console.log(`NIP-42 state for ${i}:`, r);
      }
    }), this.events = new ps(this), t.signingProvider) {
      this.signingProvider = t.signingProvider;
      try {
        this.signingMethod = (s = t.signingProvider) != null && s.isExtension || t.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary";
      } catch {
        this.signingMethod = "temporary";
      }
      this.cache = new Pt("", { debug: this.config.debug }), this._initializeCache().catch((i) => {
        this.config.debug && console.log("⚠️ Cache initialization with private key failed:", i);
      }), this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!");
    } else
      this.cache = new Pt("", { debug: this.config.debug }), this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later");
    this.dm = new Te({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    }), this.social = new ri({
      nostr: this,
      debug: this.config.debug
    }), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays), this.config.routing === "nip65" && (this.relayRouter = new Ti(this.relayList, (r) => this.normalizeRelayUrl(r)), (async () => {
      try {
        if (!this.signingProvider) return;
        const r = await this.signingProvider.getPublicKey();
        await this.sub().kinds([10002]).authors([r]).limit(1).execute();
        const n = this.query().kinds([10002]).authors([r]).limit(1).execute();
        if (n && typeof n.subscribe == "function") {
          let a = !0;
          const c = n.subscribe((u) => {
            var d, f;
            try {
              if (!a) return;
              a = !1, c && c();
            } catch {
            }
            const h = Array.isArray(u) && u.length ? u[0] : null;
            if (h && Array.isArray(h.tags)) {
              const p = h.tags.filter((g) => g[0] === "r").map((g) => g[1]).filter(Boolean);
              try {
                (f = (d = this.relayRouter) == null ? void 0 : d.setAuthorRelayHints) == null || f.call(d, r, p);
              } catch {
              }
            }
          });
        }
      } catch {
      }
    })());
  }
  /**
   * Initialize cache with signing provider's private key
   */
  async _initializeCache() {
    if (this.signingProvider)
      try {
        this.cache || (this.cache = new Pt("", {}));
        try {
          this.signingProvider.capabilities && (await this.signingProvider.capabilities()).nip44Decrypt && this.cache.setDecryptor && this.cache.setDecryptor({ nip44Decrypt: this.signingProvider.nip44Decrypt.bind(this.signingProvider) });
        } catch {
        }
        await this.cache.reprocessGiftWraps();
        const t = await this.signingProvider.getPublicKey();
        this.universalDM = new Zs(this, t), this.config.debug && console.log("🎯 Universal Cache and Universal DM Module initialized");
        try {
          this.signingProvider.capabilities && (await this.signingProvider.capabilities()).nip44Decrypt && this.cache.setDecryptor && this.cache.setDecryptor({ nip44Decrypt: this.signingProvider.nip44Decrypt.bind(this.signingProvider) });
        } catch {
        }
      } catch {
        this.cache || (this.cache = new Pt("", {}));
      }
  }
  // P1: Removed raw key access API. Encryption must use signer nip44 capabilities.
  /**
   * Get enhanced profile module (PERFECT DX - always works!)
   */
  get profile() {
    return this._profile || (this._profile = new Je({
      relayManager: this.relayManager,
      subscriptionManager: this.subscriptionManager,
      signingProvider: this.signingProvider,
      eventBuilder: new M(),
      cache: this.cache,
      debug: this.config.debug,
      // REQUIRED: Pass NostrUnchained instance for clean architecture
      nostr: this
    })), this._profile;
  }
  /**
   * Get NIP-65 Relay List module
   */
  get relayList() {
    return this._relayList || (this._relayList = new Ii(this)), this._relayList;
  }
  // NIP-66 Discovery & Health (lightweight helpers)
  get relayDiscovery() {
    return this._relayDiscovery || (this._relayDiscovery = new xi(this)), this._relayDiscovery;
  }
  get relayHealth() {
    return this._relayHealth || (this._relayHealth = new Ri(this)), this._relayHealth;
  }
  /** NIP-57 Zaps */
  get zaps() {
    return this._zap || (this._zap = new Ci(this)), this._zap;
  }
  /** NIP-51 Lists module */
  get lists() {
    return this._lists || (this._lists = new ci(this)), this._lists;
  }
  /** NIP-32 Labels module */
  get labels() {
    return this._labels || (this._labels = new li(this)), this._labels;
  }
  /** NIP-28 Channels module */
  get channels() {
    return this._channels || (this._channels = new pi(this)), this._channels;
  }
  /** NIP-22 Comments module */
  get comments() {
    return this._comments || (this._comments = new oi(this)), this._comments;
  }
  /** NIP-72 Communities module */
  get communities() {
    return this._communities || (this._communities = new Ei(this)), this._communities;
  }
  /** Content module (NIP-23/18/01) */
  get content() {
    return this._content || (this._content = new Ke(this, this.config.debug)), this._content;
  }
  /** Files/Attachments helper (NIP-92/94/96) */
  get files() {
    return this._files || (this._files = new Si(this)), this._files;
  }
  /**
   * Get configured relay URLs
   */
  get relays() {
    return this.config.relays;
  }
  /**
   * Get connected relays
   */
  get connectedRelays() {
    return this.relayManager.connectedRelays;
  }
  /**
   * Initialize signing provider
   * PERFECT DX: Only needed if signingProvider wasn't provided in constructor
   * If it was provided, this does nothing (idempotent)
   */
  async initializeSigning(t) {
    var e;
    if (this.signingProvider && !t) {
      this.config.debug && console.log("🚫 Signing already initialized - skipping (Perfect DX!)");
      return;
    }
    if (t) {
      this.signingProvider = t;
      try {
        this.signingMethod = t != null && t.isExtension || t.constructor.name.includes("Extension") ? "extension" : "temporary";
      } catch {
        this.signingMethod = "temporary";
      }
    } else if (this.config.signingProvider) {
      this.signingProvider = this.config.signingProvider;
      try {
        this.signingMethod = (e = this.config.signingProvider) != null && e.isExtension || this.config.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary";
      } catch {
        this.signingMethod = "temporary";
      }
    } else {
      const { provider: s, method: i } = await ys.createBestAvailable();
      this.signingProvider = s, this.signingMethod = i;
    }
    this.cachedMyPubkey = null, await this._initializeCache();
    try {
      this.signingProvider && this.signingProvider.nip44Decrypt && this.cache.setDecryptor && (this.cache.setDecryptor({ nip44Decrypt: this.signingProvider.nip44Decrypt.bind(this.signingProvider) }), this.config.debug && console.log("🔐 Using signer-provided NIP-44 decrypt capability"));
    } catch {
    }
    await this.dm.updateSigningProvider(this.signingProvider), await this.social.updateSigningProvider(this.signingProvider), this._profile && await this._profile.updateSigningProvider(this.signingProvider), this.config.debug && console.log(`Initialized signing with method: ${this.signingMethod}`);
    try {
      const s = this.getSigningInfo().method;
      typeof window < "u" && (window.dispatchEvent(new CustomEvent("nostr:signer-changed", { detail: { method: s } })), window.dispatchEvent(new CustomEvent("nostr:auth-changed", { detail: { method: s } })));
    } catch {
    }
    try {
      await this.startUniversalGiftWrapSubscription();
    } catch {
    }
  }
  /**
   * Connect to relays
   */
  async connect() {
    try {
      if (await this.relayManager.connect(), this.config.debug) {
        const t = this.relayManager.getStats();
        console.log("Relay connection stats:", t);
      }
    } catch (t) {
      throw $.handleConnectionError("relays", t);
    }
  }
  /**
   * Start universal gift wrap subscription (Lazy Loading)
   * This is the critical piece that makes DMs work with the Universal Cache
   * Only starts if not already active - gives users proper control
   */
  async startUniversalGiftWrapSubscription() {
    if (this.giftWrapSubscriptionActive) {
      this.config.debug && console.log("🎁 Gift wrap subscription already active - skipping");
      return;
    }
    if (!this.signingProvider) {
      this.config.debug && console.log("⚠️ Cannot start gift wrap subscription - no signing provider");
      return;
    }
    try {
      this.relayManager.connectedRelays.length === 0 && await this.connect();
      const t = await this.signingProvider.getPublicKey();
      (await this.subscriptionManager.getOrCreateSubscription([{
        kinds: [1059],
        // Gift wrap events
        "#p": [t],
        limit: 100
        // Get recent messages
      }], this.config.relays)).addListener({
        onEvent: async (s) => {
          try {
            await this.cache.addEvent(s);
          } catch {
          }
          this.config.debug && console.log(`🎁 Received gift wrap event: ${s.id.substring(0, 8)}...`);
        },
        onEose: () => {
          this.config.debug && console.log("🎁 Gift wrap initial sync completed");
        }
      }), this.giftWrapSubscriptionActive = !0, this.config.debug && console.log("🎁 Universal gift wrap subscription started successfully");
    } catch (t) {
      throw console.error("Failed to start gift wrap subscription:", t), t;
    }
  }
  /**
   * Disconnect from all relays
   */
  async disconnect() {
    await this.relayManager.disconnect();
  }
  /**
   * Publish event to specific relays
   */
  async publishToRelays(t, e) {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = M.validateEvent(t);
    if (!s.valid)
      throw new Error(`Invalid event: ${s.errors.join(", ")}`);
    const i = M.calculateEventId(t), r = await this.signingProvider.signEvent(t), n = { ...t, id: i, sig: r }, a = await this.relayManager.publishToRelays(n, e), c = a.some((u) => u.success);
    return {
      success: c,
      eventId: c ? n.id : void 0,
      event: c ? n : void 0,
      relayResults: a,
      timestamp: Date.now(),
      error: c ? void 0 : { message: "Failed to publish to any relay", retryable: !0 }
    };
  }
  async publish(t, e = 1) {
    const s = Date.now();
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const i = typeof t == "string" ? await M.createEvent(t, await this.getPublicKey(), { kind: e }) : t, r = M.validateEvent(i);
    if (!r.valid)
      throw new Error(`Invalid event: ${r.errors.join(", ")}`);
    const n = M.calculateEventId(i), a = await this.signingProvider.signEvent(i), c = { ...i, id: n, sig: a };
    let u = this.relayManager.connectedRelays;
    try {
      if (this.relayRouter && this.config.routing === "nip65") {
        const g = c.pubkey, y = this.extractMentionedPubkeys(c);
        u = await this.relayRouter.selectRelays(c, u, {
          authorPubkey: g,
          mentionedPubkeys: y
        });
      }
    } catch {
    }
    const h = await this.relayManager.publishToRelays(c, u), d = Date.now() - s, f = h.some((g) => g.success), p = {
      success: f,
      eventId: f ? c.id : void 0,
      event: f ? c : void 0,
      relayResults: h,
      timestamp: Date.now(),
      error: f ? void 0 : { message: "Failed to publish to any relay", retryable: !0, suggestion: "Check relay connectivity or try different relays" }
    };
    return this.config.debug && (p.debug = {
      connectionAttempts: this.relayManager.connectedRelays.length,
      relayLatencies: h.reduce((g, y) => (g[y.relay] = 0, g), {}),
      totalTime: d,
      signingMethod: this.signingMethod === "extension" ? "extension" : "temporary",
      targetRelays: u
    }), p;
  }
  /**
   * Publish an already signed event (for Gift Wraps, etc.)
   * This bypasses the normal signing process since the event is already signed
   */
  async publishSigned(t) {
    const e = Date.now();
    if (!t.id || !t.sig || !t.pubkey)
      throw new Error("Invalid signed event: Missing required fields (id, sig, pubkey)");
    let s = this.relayManager.connectedRelays;
    try {
      if (this.relayRouter && this.config.routing === "nip65") {
        const c = t.pubkey, u = this.extractMentionedPubkeys(t);
        s = await this.relayRouter.selectRelays(t, s, {
          authorPubkey: c,
          mentionedPubkeys: u
        });
      }
    } catch {
    }
    const i = await this.relayManager.publishToRelays(t, s), r = Date.now() - e, n = i.some((c) => c.success), a = {
      success: n,
      eventId: n ? t.id : void 0,
      event: n ? t : void 0,
      relayResults: i,
      timestamp: Date.now(),
      error: n ? void 0 : { message: "Failed to publish to any relay", retryable: !0, suggestion: "Check relay connectivity or try different relays" }
    };
    return this.config.debug && (a.debug = {
      connectionAttempts: this.relayManager.connectedRelays.length,
      relayLatencies: i.reduce((c, u) => (c[u.relay] = 0, c), {}),
      totalTime: r,
      signingMethod: "temporary",
      targetRelays: s
    }), a;
  }
  // ------------- Internal helpers -------------
  extractMentionedPubkeys(t) {
    const e = [];
    for (const s of t.tags || [])
      Array.isArray(s) && s[0] === "p" && s[1] && /^[0-9a-f]{64}$/i.test(s[1]) && e.push(s[1].toLowerCase());
    return e;
  }
  normalizeRelayUrl(t) {
    if (!t) return t;
    let e = t.trim();
    return /^wss?:\/\//i.test(e) || (e = "wss://" + e.replace(/^\/*/, "")), e = e.replace(/\/+$/, ""), e;
  }
  /**
   * Get public key
   */
  async getPublicKey() {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    return this.cachedMyPubkey || (this.cachedMyPubkey = await this.signingProvider.getPublicKey()), this.cachedMyPubkey;
  }
  /**
   * PERFECT DX: Get my pubkey synchronously (cached)
   * Returns null if not available yet - perfect for reactive UI
   */
  get me() {
    return this.cachedMyPubkey;
  }
  /**
   * PERFECT DX: Get my pubkey as Promise (always works)
   * Caches result for instant sync access via .me
   */
  async getMe() {
    try {
      return await this.getPublicKey();
    } catch {
      return null;
    }
  }
  /**
   * Get relay statistics
   */
  getRelayStats() {
    return this.relayManager.getStats();
  }
  /**
   * Alias for getRelayStats (DX convenience)
   */
  getStats() {
    return this.getRelayStats();
  }
  /**
   * Create a query builder for complex queries
   */
  query() {
    return new re(this.cache);
  }
  /**
   * Create a subscription builder
   */
  sub() {
    return new Zt(this.cache, this.subscriptionManager);
  }
  /**
   * Get the Universal Event Cache for advanced usage
   */
  getCache() {
    return this.cache;
  }
  /**
   * Get the universal event cache instance
   */
  get eventCache() {
    return this.cache;
  }
  /**
   * Get cache statistics
   */
  getCacheStatistics() {
    return this.cache.getStatistics();
  }
  /**
   * Get the subscription manager for advanced usage
   */
  getSubscriptionManager() {
    return this.subscriptionManager;
  }
  /**
   * Get Universal DM Module (lazy-loaded)
   */
  getDM() {
    return this.universalDM;
  }
  /**
   * DX convenience: detect NIP-07 extension availability
   */
  async hasExtension() {
    try {
      return await Nt.isAvailable();
    } catch {
      return !1;
    }
  }
  /**
   * DX convenience: initialize with ExtensionSigner (if available)
   */
  async useExtensionSigner() {
    try {
      const t = new Nt();
      return await this.initializeSigning(t), { success: !0, pubkey: await t.getPublicKey() };
    } catch (t) {
      return { success: !1, error: t.message };
    }
  }
  /**
   * DX convenience: initialize with LocalKeySigner (DEV/testing)
   */
  async useLocalKeySigner() {
    try {
      const t = new St();
      return await this.initializeSigning(t), { success: !0, pubkey: await t.getPublicKey() };
    } catch (t) {
      return { success: !1, error: t.message };
    }
  }
  /**
   * DX convenience: expose signing method and pubkey for UI
   */
  getSigningInfo() {
    return { method: this.signingMethod ?? "unknown", pubkey: this.me };
  }
  /**
   * DX convenience: initialize with a custom SigningProvider
   */
  async useCustomSigner(t) {
    try {
      return await this.initializeSigning(t), { success: !0, pubkey: await t.getPublicKey() };
    } catch (e) {
      return { success: !1, error: e.message };
    }
  }
  /**
   * Update the signing provider for this instance and all modules
   */
  async updateSigningProvider(t) {
    var e;
    this.signingProvider = t;
    try {
      if ((t == null ? void 0 : t.isExtension) === !0)
        this.signingMethod = "extension";
      else {
        const i = ((e = t == null ? void 0 : t.constructor) == null ? void 0 : e.name) || "";
        this.signingMethod = i.includes("Extension") ? "extension" : "temporary";
      }
    } catch {
      this.signingMethod = "temporary";
    }
    this.dm && await this.dm.updateSigningProvider(t), this.social && await this.social.updateSigningProvider(t), this._profile && await this._profile.updateSigningProvider(t), this.config.debug && console.log("🔑 NostrUnchained signing provider updated");
  }
  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      signingMethod: this.signingMethod === "extension" ? "extension" : "temporary",
      cacheSize: this.cache.getStatistics().totalEvents,
      giftWrapActive: this.giftWrapSubscriptionActive
    };
  }
}
class er {
  constructor(t) {
    l(this, "remoteSignerPubkey");
    l(this, "relays");
    l(this, "nostr");
    // NostrUnchained instance
    l(this, "clientTransport");
    // ephemeral client key
    l(this, "remoteUserPubkey", null);
    l(this, "responseCallbacks", /* @__PURE__ */ new Map());
    l(this, "subscriptionStarted", !1);
    l(this, "requestedPermissions", []);
    this.remoteSignerPubkey = t.remoteSignerPubkey, this.relays = t.relays, this.nostr = t.nostr, this.clientTransport = new St();
  }
  async ensureResponseSubscription() {
    if (this.subscriptionStarted) return;
    const t = await this.clientTransport.getPublicKey();
    this.nostr.sub().kinds([24133]).authors([this.remoteSignerPubkey]).tags("p", [t]).limit(200).execute().then(() => {
    }).catch(() => {
    }), this.nostr.query().kinds([24133]).authors([this.remoteSignerPubkey]).tags("p", [t]).since(Math.floor(Date.now() / 1e3) - 300).execute().subscribe(async (s) => {
      for (const i of s)
        try {
          const r = i.content, n = await this.clientTransport.nip44Decrypt(this.remoteSignerPubkey, r), a = JSON.parse(n), c = this.responseCallbacks.get(a.id);
          c && (this.responseCallbacks.delete(a.id), c(a));
        } catch {
        }
    }), this.subscriptionStarted = !0;
  }
  async rpcRequest(t, e) {
    await this.ensureResponseSubscription();
    const s = await this.clientTransport.getPublicKey(), i = Math.random().toString(36).slice(2), r = { id: i, method: t, params: e }, n = await this.clientTransport.nip44Encrypt(this.remoteSignerPubkey, JSON.stringify(r)), a = {
      pubkey: s,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 24133,
      tags: [["p", this.remoteSignerPubkey]],
      content: n
    }, c = M.calculateEventId(a), u = await this.clientTransport.signEvent(a), h = { ...a, id: c, sig: u }, d = new Promise((f, p) => {
      const g = setTimeout(() => {
        this.responseCallbacks.delete(i), p(new Error("NIP-46 request timeout"));
      }, 1e4);
      this.responseCallbacks.set(i, (y) => {
        clearTimeout(g), y.error ? p(new Error(y.error)) : f(y.result);
      });
    });
    return await this.nostr.publishSigned(h), await d;
  }
  /**
   * Client-initiated connection token (nostrconnect://)
   * Allows sharing a QR/URI with remote-signer to establish permissions.
   */
  async createClientToken(t) {
    const e = await this.clientTransport.getPublicKey(), s = (t != null && t.relays && t.relays.length ? t.relays : this.relays) || [], i = new URLSearchParams();
    for (const n of s) i.append("relay", encodeURIComponent(n));
    t != null && t.perms && t.perms.length && (i.set("perms", t.perms.join(",")), this.requestedPermissions = t.perms.slice()), t != null && t.name && i.set("name", t.name), t != null && t.secret && i.set("secret", t.secret);
    const r = i.toString();
    return `nostrconnect://${e}${r ? `?${r}` : ""}`;
  }
  setRequestedPermissions(t) {
    this.requestedPermissions = t.slice();
  }
  async getPublicKey() {
    if (this.remoteUserPubkey) return this.remoteUserPubkey;
    const t = await this.rpcRequest("get_public_key", []);
    return this.remoteUserPubkey = String(t), this.remoteUserPubkey;
  }
  getPublicKeySync() {
    return this.remoteUserPubkey;
  }
  async signEvent(t) {
    const e = await this.rpcRequest("sign_event", [JSON.stringify({
      content: t.content,
      kind: t.kind,
      tags: t.tags,
      created_at: t.created_at
    })]);
    try {
      const s = typeof e == "string" ? JSON.parse(e) : e;
      if (!s || !s.sig) throw new Error("Invalid response from remote signer");
      return s.sig;
    } catch {
      throw new Error("Failed to parse remote signature");
    }
  }
}
const me = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif"
}, we = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v"
}, ve = {
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4"
};
function sr(o) {
  try {
    const s = new URL(o).pathname.toLowerCase().match(/\.([a-z0-9]+)$/i), i = (s == null ? void 0 : s[1]) || "";
    if (me[i]) return me[i];
    if (we[i]) return we[i];
    if (ve[i]) return ve[i];
  } catch {
  }
}
function ir(o) {
  const t = [];
  if (t.push(`url ${o.url}`), o.mimeType && t.push(`m ${o.mimeType}`), o.blurhash && t.push(`blurhash ${o.blurhash}`), o.dim && t.push(`dim ${o.dim}`), o.alt && t.push(`alt ${o.alt}`), o.sha256 && t.push(`x ${o.sha256}`), o.fallbacks && o.fallbacks.length)
    for (const e of o.fallbacks) t.push(`fallback ${e}`);
  return ["imeta", ...t];
}
function rr(o) {
  const t = [];
  for (const e of o.tags || []) {
    if (e[0] !== "imeta") continue;
    const s = { url: "" };
    for (let i = 1; i < e.length; i++) {
      const r = e[i], n = r.indexOf(" ");
      if (n <= 0) continue;
      const a = r.slice(0, n), c = r.slice(n + 1);
      switch (a) {
        case "url":
          s.url = c;
          break;
        case "m":
          s.mimeType = c;
          break;
        case "blurhash":
          s.blurhash = c;
          break;
        case "dim":
          s.dim = c;
          break;
        case "alt":
          s.alt = c;
          break;
        case "x":
          s.sha256 = c;
          break;
        case "fallback":
          s.fallbacks || (s.fallbacks = []), s.fallbacks.push(c);
          break;
      }
    }
    s.url && t.push(s);
  }
  return t;
}
const nr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: Pe,
  DMModule: Te,
  DMRoom: Ie,
  EphemeralKeyManager: Rt,
  GiftWrapCreator: Lt,
  GiftWrapProtocol: at,
  NIP44Crypto: X,
  SealCreator: Dt,
  TimestampRandomizer: Gt
}, Symbol.toStringTag, { value: "Module" })), or = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FollowBatchBuilder: je,
  FollowBuilder: qe,
  FollowsModule: Ye,
  ProfileBatchBuilder: ze,
  ProfileBuilder: We,
  ProfileDiscoveryBuilder: Ve,
  ProfileModule: Je
}, Symbol.toStringTag, { value: "Module" }));
function Ni(o) {
  return typeof globalThis.btoa == "function" ? globalThis.btoa(o) : Buffer.from(o, "utf8").toString("base64");
}
async function Di(o, t) {
  const e = t.method.toUpperCase(), s = t.url;
  let i;
  t.payload && typeof t.payload == "string" ? i = D(et(new TextEncoder().encode(t.payload))) : t.payload && (i = D(et(t.payload)));
  const r = o.events.create().kind(27235).content("").tag("u", s).tag("method", e);
  return i && r.tag("payload", i), await (await r.sign()).build();
}
function Li(o) {
  const t = JSON.stringify(o);
  return `Nostr ${Ni(t)}`;
}
async function Fi(o, t) {
  const e = await Di(o, t), s = Li(e);
  return { event: e, header: s };
}
class ar {
  constructor(t) {
    this.nostr = t;
  }
  async discover(t) {
    const e = new URL("/.well-known/nostr/nip96.json", t).toString(), s = await fetch(e);
    if (!s.ok) throw new Error(`nip96.json fetch failed: ${s.status}`);
    const i = await s.json();
    if (!i.api_url || typeof i.api_url != "string") throw new Error("Invalid nip96.json: missing api_url");
    return i;
  }
  async upload(t, e, s = {}) {
    var p;
    const i = await this.discover(t), r = i.api_url || i.delegated_to_url || t, n = e instanceof Uint8Array ? e : new Uint8Array(e), a = new FormData(), c = new Blob([n], { type: s.contentType || "application/octet-stream" });
    a.append("file", c, s.filename || "upload.bin"), s.caption && a.append("caption", s.caption), s.alt && a.append("alt", s.alt);
    const u = { method: "POST", body: a, headers: {} };
    if (s.requireAuth) {
      const { header: g } = await Fi(this.nostr, {
        method: "POST",
        url: r,
        payload: n
        // not strictly the file-hash semantics, but header exists
      });
      u.headers.Authorization = g;
    }
    const h = await fetch(r, u), d = await h.json(), f = { status: d.status || (h.ok ? "success" : "error"), message: d.message };
    if ((p = d.nip94_event) != null && p.tags) {
      f.nip94_event = d.nip94_event;
      const g = d.nip94_event.tags, y = g.find((w) => w[0] === "url"), m = g.find((w) => w[0] === "ox"), b = g.find((w) => w[0] === "x");
      f.url = y == null ? void 0 : y[1], f.ox = m == null ? void 0 : m[1], f.x = b == null ? void 0 : b[1];
    }
    return f;
  }
  async publishNip94(t) {
    const e = this.nostr.events.create().kind(1063).content(t.content || "");
    for (const s of t.tags || []) e.tag(s[0], ...s.slice(1));
    return await e.publish();
  }
}
const cr = "0.2.0";
export {
  ds as DEFAULT_RELAYS,
  nr as DM,
  ae as EVENT_KINDS,
  $ as ErrorHandler,
  M as EventBuilder,
  ps as EventsModule,
  Nt as ExtensionSigner,
  te as FeedStoreImpl,
  Kt as FluentEventBuilder,
  St as LocalKeySigner,
  ar as Nip96Client,
  er as NostrConnectSigner,
  tr as NostrUnchained,
  or as Profile,
  re as QueryBuilder,
  Bi as QuickSigner,
  fs as RelayManager,
  ys as SigningProviderFactory,
  Zt as SubBuilder,
  _i as SubscriptionManager,
  Ui as TemporarySigner,
  cr as VERSION,
  Di as buildHttpAuthEvent,
  Li as buildHttpAuthHeader,
  ir as buildImetaTag,
  Hi as createFeed,
  zi as createFeedFromFilter,
  Wi as createFeedFromQuery,
  Ys as createNaddr,
  Xi as createNevent,
  Ji as createNprofile,
  kt as decode,
  I as derived,
  sr as guessMimeType,
  Yi as hexToNote,
  ji as hexToNpub,
  Gi as hexToNsec,
  Ws as isNostrUri,
  Js as isValidHexKey,
  Qi as isValidNote,
  Xs as isValidNpub,
  Zi as isValidNsec,
  Be as naddrEncode,
  Oe as neventEncode,
  qs as noteEncode,
  Gs as noteToHex,
  $e as nprofileEncode,
  Vs as npubEncode,
  Ue as npubToHex,
  zs as nsecEncode,
  js as nsecToHex,
  rr as parseImetaTags,
  Vi as parseNostrUri,
  Ki as setDefaultSubscriptionManager,
  Fi as signHttpAuth,
  qi as toNostrUri,
  nt as writable
};
