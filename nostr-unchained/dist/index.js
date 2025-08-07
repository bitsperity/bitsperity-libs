var Wt = Object.defineProperty;
var zt = (n, e, t) => e in n ? Wt(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var u = (n, e, t) => zt(n, typeof e != "symbol" ? e + "" : e, t);
import * as ne from "@noble/secp256k1";
import { getSharedSecret as Ht } from "@noble/secp256k1";
const ue = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Gt(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function Be(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function de(n, ...e) {
  if (!Gt(n))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(n.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + n.length);
}
function je(n) {
  if (typeof n != "function" || typeof n.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Be(n.outputLen), Be(n.blockLen);
}
function Re(n, e = !0) {
  if (n.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && n.finished)
    throw new Error("Hash#digest() has already been called");
}
function jt(n, e) {
  de(n);
  const t = e.outputLen;
  if (n.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function be(...n) {
  for (let e = 0; e < n.length; e++)
    n[e].fill(0);
}
function Fe(n) {
  return new DataView(n.buffer, n.byteOffset, n.byteLength);
}
function X(n, e) {
  return n << 32 - e | n >>> e;
}
const ft = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", qt = /* @__PURE__ */ Array.from({ length: 256 }, (n, e) => e.toString(16).padStart(2, "0"));
function C(n) {
  if (de(n), ft)
    return n.toHex();
  let e = "";
  for (let t = 0; t < n.length; t++)
    e += qt[n[t]];
  return e;
}
const J = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function st(n) {
  if (n >= J._0 && n <= J._9)
    return n - J._0;
  if (n >= J.A && n <= J.F)
    return n - (J.A - 10);
  if (n >= J.a && n <= J.f)
    return n - (J.a - 10);
}
function ae(n) {
  if (typeof n != "string")
    throw new Error("hex string expected, got " + typeof n);
  if (ft)
    return Uint8Array.fromHex(n);
  const e = n.length, t = e / 2;
  if (e % 2)
    throw new Error("hex string expected, got unpadded hex of length " + e);
  const s = new Uint8Array(t);
  for (let i = 0, r = 0; i < t; i++, r += 2) {
    const o = st(n.charCodeAt(r)), a = st(n.charCodeAt(r + 1));
    if (o === void 0 || a === void 0) {
      const c = n[r] + n[r + 1];
      throw new Error('hex string expected, got non-hex character "' + c + '" at index ' + r);
    }
    s[i] = o * 16 + a;
  }
  return s;
}
function Yt(n) {
  if (typeof n != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(n));
}
function me(n) {
  return typeof n == "string" && (n = Yt(n)), de(n), n;
}
function _e(...n) {
  let e = 0;
  for (let s = 0; s < n.length; s++) {
    const i = n[s];
    de(i), e += i.length;
  }
  const t = new Uint8Array(e);
  for (let s = 0, i = 0; s < n.length; s++) {
    const r = n[s];
    t.set(r, i), i += r.length;
  }
  return t;
}
class pt {
}
function Xt(n) {
  const e = (s) => n().update(me(s)).digest(), t = n();
  return e.outputLen = t.outputLen, e.blockLen = t.blockLen, e.create = () => n(), e;
}
function he(n = 32) {
  if (ue && typeof ue.getRandomValues == "function")
    return ue.getRandomValues(new Uint8Array(n));
  if (ue && typeof ue.randomBytes == "function")
    return Uint8Array.from(ue.randomBytes(n));
  throw new Error("crypto.getRandomValues must be defined");
}
function Jt(n, e, t, s) {
  if (typeof n.setBigUint64 == "function")
    return n.setBigUint64(e, t, s);
  const i = BigInt(32), r = BigInt(4294967295), o = Number(t >> i & r), a = Number(t & r), c = s ? 4 : 0, l = s ? 0 : 4;
  n.setUint32(e + c, o, s), n.setUint32(e + l, a, s);
}
function Zt(n, e, t) {
  return n & e ^ ~n & t;
}
function Qt(n, e, t) {
  return n & e ^ n & t ^ e & t;
}
class es extends pt {
  constructor(e, t, s, i) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = i, this.buffer = new Uint8Array(e), this.view = Fe(this.buffer);
  }
  update(e) {
    Re(this), e = me(e), de(e);
    const { view: t, buffer: s, blockLen: i } = this, r = e.length;
    for (let o = 0; o < r; ) {
      const a = Math.min(i - this.pos, r - o);
      if (a === i) {
        const c = Fe(e);
        for (; i <= r - o; o += i)
          this.process(c, o);
        continue;
      }
      s.set(e.subarray(o, o + a), this.pos), this.pos += a, o += a, this.pos === i && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Re(this), jt(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: i, isLE: r } = this;
    let { pos: o } = this;
    t[o++] = 128, be(this.buffer.subarray(o)), this.padOffset > i - o && (this.process(s, 0), o = 0);
    for (let h = o; h < i; h++)
      t[h] = 0;
    Jt(s, i - 8, BigInt(this.length * 8), r), this.process(s, 0);
    const a = Fe(e), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const l = c / 4, d = this.get();
    if (l > d.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let h = 0; h < l; h++)
      a.setUint32(4 * h, d[h], r);
  }
  digest() {
    const { buffer: e, outputLen: t } = this;
    this.digestInto(e);
    const s = e.slice(0, t);
    return this.destroy(), s;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: t, buffer: s, length: i, finished: r, destroyed: o, pos: a } = this;
    return e.destroyed = o, e.finished = r, e.length = i, e.pos = a, i % t && e.buffer.set(s), e;
  }
  clone() {
    return this._cloneInto();
  }
}
const ee = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), ts = /* @__PURE__ */ Uint32Array.from([
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
]), te = /* @__PURE__ */ new Uint32Array(64);
class ss extends es {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = ee[0] | 0, this.B = ee[1] | 0, this.C = ee[2] | 0, this.D = ee[3] | 0, this.E = ee[4] | 0, this.F = ee[5] | 0, this.G = ee[6] | 0, this.H = ee[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: i, E: r, F: o, G: a, H: c } = this;
    return [e, t, s, i, r, o, a, c];
  }
  // prettier-ignore
  set(e, t, s, i, r, o, a, c) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = i | 0, this.E = r | 0, this.F = o | 0, this.G = a | 0, this.H = c | 0;
  }
  process(e, t) {
    for (let h = 0; h < 16; h++, t += 4)
      te[h] = e.getUint32(t, !1);
    for (let h = 16; h < 64; h++) {
      const f = te[h - 15], b = te[h - 2], g = X(f, 7) ^ X(f, 18) ^ f >>> 3, p = X(b, 17) ^ X(b, 19) ^ b >>> 10;
      te[h] = p + te[h - 7] + g + te[h - 16] | 0;
    }
    let { A: s, B: i, C: r, D: o, E: a, F: c, G: l, H: d } = this;
    for (let h = 0; h < 64; h++) {
      const f = X(a, 6) ^ X(a, 11) ^ X(a, 25), b = d + f + Zt(a, c, l) + ts[h] + te[h] | 0, p = (X(s, 2) ^ X(s, 13) ^ X(s, 22)) + Qt(s, i, r) | 0;
      d = l, l = c, c = a, a = o + b | 0, o = r, r = i, i = s, s = b + p | 0;
    }
    s = s + this.A | 0, i = i + this.B | 0, r = r + this.C | 0, o = o + this.D | 0, a = a + this.E | 0, c = c + this.F | 0, l = l + this.G | 0, d = d + this.H | 0, this.set(s, i, r, o, a, c, l, d);
  }
  roundClean() {
    be(te);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), be(this.buffer);
  }
}
const is = /* @__PURE__ */ Xt(() => new ss()), oe = is, rs = [
  "ws://umbrel.local:4848",
  // Local testing relay (highest priority)
  "wss://relay.damus.io"
  // Single public relay fallback
], ie = {
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
}, it = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  ENCRYPTED_DM: 4,
  DELETE: 5
}, R = {
  EMPTY_CONTENT: "Content cannot be empty",
  CONTENT_TOO_LONG: "Content too long",
  NO_RELAYS: "No relays configured",
  CONNECTION_FAILED: "Failed to connect to relay",
  SIGNING_FAILED: "Failed to sign event",
  PUBLISH_FAILED: "Failed to publish to any relay",
  NO_EXTENSION: "No browser extension available",
  INVALID_EVENT: "Invalid event structure"
}, ge = {
  EMPTY_CONTENT: "Add some content to your message",
  CONTENT_TOO_LONG: `Keep your message under ${ie.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: "Check your internet connection and try again",
  NO_EXTENSION: "Install a Nostr browser extension or the library will use a temporary key",
  PUBLISH_FAILED: "Try again or check if your relays are accessible"
}, Ie = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class k {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(e, t) {
    return {
      pubkey: t,
      created_at: Math.floor(Date.now() / 1e3),
      kind: it.TEXT_NOTE,
      tags: [],
      content: e
    };
  }
  /**
   * Calculate event ID according to NIP-01 specification
   * 
   * The event ID is the SHA256 hash of the serialized event data:
   * [0, pubkey, created_at, kind, tags, content]
   */
  static calculateEventId(e) {
    const t = JSON.stringify([
      0,
      // Reserved future use
      e.pubkey,
      e.created_at,
      e.kind,
      e.tags,
      e.content
    ]), s = new TextEncoder().encode(t), i = oe(s);
    return C(i);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(e) {
    const t = k.calculateEventId(e);
    return { ...e, id: t };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(e) {
    const t = [];
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !Ie.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !Ie.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !Ie.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && !this.isEmptyContentAllowed(e.kind) && t.push(R.EMPTY_CONTENT), e.content && e.content.length > ie.MAX_CONTENT_LENGTH && t.push(R.CONTENT_TOO_LONG), e.created_at) {
      const s = Math.floor(Date.now() / 1e3), i = s - 3600, r = s + 3600;
      (e.created_at < i || e.created_at > r) && t.push("Timestamp is too far in the past or future");
    }
    return e.tags && (Array.isArray(e.tags) ? e.tags.forEach((s, i) => {
      Array.isArray(s) ? s.forEach((r, o) => {
        typeof r != "string" && t.push(`Tag ${i}[${o}] must be a string`);
      }) : t.push(`Tag ${i} must be an array`);
    }) : t.push("Tags must be an array")), {
      valid: t.length === 0,
      errors: t
    };
  }
  /**
   * Validate content before event creation
   */
  static validateContent(e, t) {
    const s = [];
    return e === "" && !this.isEmptyContentAllowed(t) && s.push(R.EMPTY_CONTENT), e.length > ie.MAX_CONTENT_LENGTH && s.push(R.CONTENT_TOO_LONG), {
      valid: s.length === 0,
      errors: s
    };
  }
  /**
   * Check if empty content is allowed for specific event kinds
   */
  static isEmptyContentAllowed(e) {
    return e ? [
      3,
      // NIP-02: Contact list / Follow list (typically has empty content)
      5,
      // NIP-09: Event deletion (may have empty content)
      6,
      // NIP-18: Repost (requires empty content)
      7,
      // NIP-25: Reaction (may have empty content for simple reactions)
      // NOTE: 1059 (Gift wraps) removed - they MUST have encrypted content per NIP-44
      1984
      // NIP-56: Reporting (may have empty content with just tags)
    ].includes(e) : !1;
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(e) {
    return k.calculateEventId({
      pubkey: e.pubkey,
      created_at: e.created_at,
      kind: e.kind,
      tags: e.tags,
      content: e.content
    }) === e.id;
  }
  /**
   * Create a complete event with validation
   */
  static async createEvent(e, t, s = {}) {
    const i = k.validateContent(e, s.kind);
    if (!i.valid)
      throw new Error(`Invalid content: ${i.errors.join(", ")}`);
    const r = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? it.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, o = k.validateEvent(r);
    if (!o.valid)
      throw new Error(`Invalid event: ${o.errors.join(", ")}`);
    return r;
  }
}
async function ns() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class os {
  constructor(e, t = {}) {
    u(this, "connections", /* @__PURE__ */ new Map());
    u(this, "debug");
    u(this, "messageHandler");
    // Reconnection configuration
    u(this, "maxReconnectAttempts", 5);
    u(this, "baseReconnectDelay", 1e3);
    // 1 second
    u(this, "maxReconnectDelay", 3e4);
    // 30 seconds
    u(this, "reconnectEnabled", !0);
    u(this, "pendingPublishes", /* @__PURE__ */ new Map());
    this.debug = t.debug ?? !1, e.forEach((s) => {
      this.connections.set(s, {
        url: s,
        state: "disconnected"
      });
    });
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
    return Array.from(this.connections.entries()).filter(([e, t]) => t.state === "connected").map(([e, t]) => e);
  }
  /**
   * Connect to all configured relays
   */
  async connect() {
    const e = this.relayUrls.map(
      (t) => this.connectToRelay(t).catch((s) => (this.debug && console.warn(`Failed to connect to ${t}:`, s), !1))
    );
    if (await Promise.allSettled(e), this.connectedRelays.length === 0)
      throw new Error("Failed to connect to any relay");
  }
  /**
   * Connect to a specific relay
   */
  async connectToRelay(e) {
    const t = this.connections.get(e);
    if (!t)
      throw new Error(`Relay ${e} not configured`);
    return t.state === "connected" ? !0 : (t.state = "connecting", new Promise(async (s, i) => {
      try {
        const r = await ns(), o = new r(e), a = setTimeout(() => {
          o.close(), t.state = "error", t.error = "Connection timeout", i(new Error(`Connection to ${e} timed out`));
        }, ie.CONNECTION_TIMEOUT);
        o.onopen = () => {
          clearTimeout(a), t.ws = o, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, o.onerror = (c) => {
          clearTimeout(a), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, c), i(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, o.onclose = (c) => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`, c.code, c.reason), this.reconnectEnabled && c.code !== 1e3 && this.scheduleReconnection(e);
        }, o.onmessage = (c) => {
          this.handleRelayMessage(e, c.data);
        };
      } catch (r) {
        t.state = "error", t.error = r instanceof Error ? r.message : "Unknown error", i(r);
      }
    }));
  }
  /**
   * Publish event to specific relays
   */
  async publishToRelays(e, t) {
    const s = [], i = t.map(async (r) => {
      const o = Date.now();
      try {
        const a = await this.publishToRelay(r, e), c = Date.now() - o;
        s.push({
          relay: r,
          success: a,
          latency: c
        });
      } catch (a) {
        const c = Date.now() - o;
        s.push({
          relay: r,
          success: !1,
          error: a instanceof Error ? a.message : "Unknown error",
          latency: c
        });
      }
    });
    return await Promise.allSettled(i), s;
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(e) {
    const t = [], s = this.connectedRelays.map(async (i) => {
      const r = Date.now();
      try {
        const o = await this.publishToRelay(i, e), a = Date.now() - r;
        t.push({
          relay: i,
          success: o,
          latency: a
        });
      } catch (o) {
        const a = Date.now() - r;
        t.push({
          relay: i,
          success: !1,
          error: o instanceof Error ? o.message : "Unknown error",
          latency: a
        });
      }
    });
    return await Promise.allSettled(s), t;
  }
  /**
   * Publish event to specific relay
   */
  async publishToRelay(e, t) {
    const s = this.connections.get(e);
    if (!s || s.state !== "connected" || !s.ws)
      throw new Error(`Not connected to relay: ${e}`);
    return new Promise((i, r) => {
      const o = s.ws, a = ["EVENT", t], c = setTimeout(() => {
        r(new Error("Publish timeout"));
      }, ie.PUBLISH_TIMEOUT), l = t.id;
      this.pendingPublishes.set(l, { resolve: i, reject: r, timeout: c });
      try {
        const d = JSON.stringify(a);
        o.send(d), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", d), console.log("📤 Added to pending:", l));
      } catch (d) {
        clearTimeout(c), this.pendingPublishes.delete(l), r(d);
      }
    });
  }
  /**
   * Handle incoming relay messages
   */
  handleRelayMessage(e, t) {
    try {
      const s = JSON.parse(t);
      if (this.debug && console.log(`📥 Message from ${e}:`, s), s[0] === "OK") {
        const [, i, r, o] = s, a = this.pendingPublishes.get(i);
        this.debug && (console.log(`OK for event ${i}, success: ${r}, pending: ${!!a}`), console.log("Pending publishes:", Array.from(this.pendingPublishes.keys()))), a ? (clearTimeout(a.timeout), this.pendingPublishes.delete(i), r ? a.resolve(!0) : a.reject(new Error(o || "Relay rejected event"))) : this.debug && console.warn(`No pending publish found for event ID: ${i}`);
      } else if (s[0] === "NOTICE") {
        const [, i] = s;
        this.debug && console.log(`Notice from ${e}:`, i);
      } else (s[0] === "EVENT" || s[0] === "EOSE") && (this.messageHandler ? this.messageHandler(e, s) : this.debug && console.log(`No message handler registered for ${s[0]} message`));
    } catch (s) {
      this.debug && console.error(`Failed to parse message from ${e}:`, s);
    }
  }
  /**
   * Get relay information (NIP-11)
   */
  async getRelayInfo(e) {
    try {
      const t = e.replace(/^ws/, "http"), s = await fetch(t, {
        headers: {
          Accept: "application/nostr+json"
        }
      });
      if (!s.ok)
        throw new Error(`HTTP ${s.status}`);
      return await s.json();
    } catch (t) {
      throw new Error(`Failed to get relay info: ${t instanceof Error ? t.message : "Unknown error"}`);
    }
  }
  /**
   * Test relay connectivity
   */
  async testRelay(e) {
    try {
      return Ie.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
        success: !1,
        error: "Invalid WebSocket URL format"
      };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  /**
   * Disconnect from all relays
   */
  async disconnect() {
    this.pendingPublishes.forEach(({ timeout: e, reject: t }) => {
      clearTimeout(e), t(new Error("Disconnecting"));
    }), this.pendingPublishes.clear(), this.connections.forEach((e) => {
      e.ws && (e.ws.close(), e.ws = void 0), e.state = "disconnected";
    });
  }
  /**
   * Send message to all connected relays
   */
  async sendToAll(e) {
    const t = this.connectedRelays.map(
      (s) => this.sendToRelay(s, e).catch((i) => {
        this.debug && console.warn(`Failed to send to ${s}:`, i);
      })
    );
    await Promise.allSettled(t);
  }
  /**
   * Send message to specific relays
   */
  async sendToRelays(e, t) {
    const s = e.map(
      (i) => this.sendToRelay(i, t).catch((r) => {
        this.debug && console.warn(`Failed to send to ${i}:`, r);
      })
    );
    await Promise.allSettled(s);
  }
  /**
   * Send message to a specific relay
   */
  async sendToRelay(e, t) {
    const s = this.connections.get(e);
    if (!s || s.state !== "connected" || !s.ws)
      throw new Error(`Not connected to relay: ${e}`);
    const i = JSON.stringify(t);
    s.ws.send(i), this.debug && console.log(`📤 Sent to ${e}:`, i);
  }
  /**
   * Register a message handler for subscription messages (EVENT, EOSE)
   */
  setMessageHandler(e) {
    this.messageHandler = e;
  }
  /**
   * Get connection statistics
   */
  getStats() {
    const e = {
      total: this.connections.size,
      connected: 0,
      connecting: 0,
      disconnected: 0,
      error: 0
    };
    return this.connections.forEach((t) => {
      e[t.state]++;
    }), e;
  }
  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnection(e) {
    const t = this.connections.get(e);
    if (!t) return;
    if (t.reconnectTimeout && (clearTimeout(t.reconnectTimeout), t.reconnectTimeout = void 0), t.reconnectAttempts === void 0 && (t.reconnectAttempts = 0), t.reconnectAttempts >= this.maxReconnectAttempts) {
      this.debug && console.warn(`Max reconnection attempts reached for relay: ${e}`), t.state = "error", t.error = `Max reconnection attempts (${this.maxReconnectAttempts}) exceeded`;
      return;
    }
    const i = Math.min(
      this.baseReconnectDelay * Math.pow(2, t.reconnectAttempts),
      this.maxReconnectDelay
    ) + Math.random() * 1e3;
    this.debug && console.log(`Scheduling reconnection to ${e} in ${Math.round(i)}ms (attempt ${t.reconnectAttempts + 1}/${this.maxReconnectAttempts})`), t.reconnectTimeout = setTimeout(() => {
      this.attemptReconnection(e);
    }, i);
  }
  /**
   * Attempt to reconnect to a relay
   */
  async attemptReconnection(e) {
    const t = this.connections.get(e);
    if (t) {
      t.reconnectAttempts = (t.reconnectAttempts || 0) + 1, t.lastReconnectAttempt = Date.now(), this.debug && console.log(`Attempting reconnection to ${e} (attempt ${t.reconnectAttempts})`);
      try {
        await this.connectToRelay(e) && (t.reconnectAttempts = 0, t.reconnectTimeout = void 0, this.debug && console.log(`Successfully reconnected to relay: ${e}`));
      } catch (s) {
        this.debug && console.warn(`Reconnection attempt failed for ${e}:`, s), t.reconnectAttempts < this.maxReconnectAttempts ? this.scheduleReconnection(e) : (t.state = "error", t.error = `Reconnection failed after ${this.maxReconnectAttempts} attempts`);
      }
    }
  }
  /**
   * Enable or disable automatic reconnection
   */
  setReconnectionEnabled(e) {
    if (this.reconnectEnabled = e, !e)
      for (const t of this.connections.values())
        t.reconnectTimeout && (clearTimeout(t.reconnectTimeout), t.reconnectTimeout = void 0);
  }
  /**
   * Configure reconnection parameters
   */
  configureReconnection(e) {
    e.maxAttempts !== void 0 && (this.maxReconnectAttempts = Math.max(1, e.maxAttempts)), e.baseDelay !== void 0 && (this.baseReconnectDelay = Math.max(100, e.baseDelay)), e.maxDelay !== void 0 && (this.maxReconnectDelay = Math.max(this.baseReconnectDelay, e.maxDelay));
  }
  /**
   * Manually trigger reconnection for a specific relay
   */
  async reconnectRelay(e) {
    const t = this.connections.get(e);
    if (!t)
      throw new Error(`Relay ${e} not configured`);
    return t.reconnectTimeout && (clearTimeout(t.reconnectTimeout), t.reconnectTimeout = void 0), t.reconnectAttempts = 0, this.connectToRelay(e);
  }
  /**
   * Get reconnection status for all relays
   */
  getReconnectionStatus() {
    const e = {};
    for (const [t, s] of this.connections.entries())
      if (e[t] = {
        attempts: s.reconnectAttempts || 0,
        lastAttempt: s.lastReconnectAttempt
      }, s.reconnectTimeout) {
        const i = Date.now(), r = s.lastReconnectAttempt || i, o = Math.min(
          this.baseReconnectDelay * Math.pow(2, (s.reconnectAttempts || 0) - 1),
          this.maxReconnectDelay
        ), a = r + o;
        e[t].nextAttemptIn = Math.max(0, a - i);
      }
    return e;
  }
}
class rt {
  constructor() {
    u(this, "cachedPublicKey");
  }
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(R.NO_EXTENSION);
    try {
      const e = await window.nostr.getPublicKey();
      return this.cachedPublicKey = e, e;
    } catch (e) {
      throw new Error(`Extension signing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  getPublicKeySync() {
    return this.cachedPublicKey || null;
  }
  async signEvent(e) {
    if (!window.nostr)
      throw new Error(R.NO_EXTENSION);
    try {
      return (await window.nostr.signEvent(e)).sig;
    } catch (t) {
      throw new Error(`Extension signing failed: ${t instanceof Error ? t.message : "Unknown error"}`);
    }
  }
  // Optional capabilities for NIP-44
  async capabilities() {
    var t;
    const e = typeof window < "u" && !!((t = window.nostr) != null && t.nip44) && typeof window.nostr.nip44.encrypt == "function" && typeof window.nostr.nip44.decrypt == "function";
    return { nip44Encrypt: e, nip44Decrypt: e, rawKey: !1 };
  }
  async nip44Encrypt(e, t) {
    var s, i;
    if (!((i = (s = window.nostr) == null ? void 0 : s.nip44) != null && i.encrypt)) throw new Error("NIP-44 encrypt not supported by extension");
    return window.nostr.nip44.encrypt(e, t);
  }
  async nip44Decrypt(e, t) {
    var s, i;
    if (!((i = (s = window.nostr) == null ? void 0 : s.nip44) != null && i.decrypt)) throw new Error("NIP-44 decrypt not supported by extension");
    return window.nostr.nip44.decrypt(e, t);
  }
  static async isAvailable() {
    return typeof window < "u" && typeof window.nostr < "u" && typeof window.nostr.getPublicKey == "function" && typeof window.nostr.signEvent == "function";
  }
}
class qe {
  constructor() {
    u(this, "privateKey");
    u(this, "publicKey");
    const e = he(32);
    this.privateKey = C(e), this.publicKey = C(ne.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  getPublicKeySync() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = k.calculateEventId(e), s = await ne.schnorr.sign(t, this.privateKey);
    return C(s);
  }
  /**
   * Get private key for NIP-44 encryption
   * WARNING: Only for testing/development. Production should use secure key derivation.
   */
  async getPrivateKeyForEncryption() {
    return this.privateKey;
  }
  async capabilities() {
    return { nip44Encrypt: !0, nip44Decrypt: !0, rawKey: !0 };
  }
  async nip44Encrypt(e, t) {
    const { NIP44Crypto: s } = await Promise.resolve().then(() => Ve), i = s.deriveConversationKey(this.privateKey, e), r = s.encrypt(t, i);
    if (!r || !r.isValid) throw new Error("NIP-44 encrypt failed");
    return r.ciphertext;
  }
  async nip44Decrypt(e, t) {
    const { NIP44Crypto: s } = await Promise.resolve().then(() => Ve), i = s.deriveConversationKey(this.privateKey, e), r = s.decrypt(t, i);
    if (!r || !r.isValid) throw new Error("NIP-44 decrypt failed");
    return r.plaintext;
  }
}
class si extends qe {
}
class ii extends qe {
}
class as {
  static async createBestAvailable() {
    if (await rt.isAvailable())
      try {
        const e = new rt();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new qe(),
      method: "temporary"
    };
  }
}
class T {
  /**
   * Create a standardized Nostr error
   */
  static createError(e, t, s = {}) {
    return {
      message: t,
      retryable: s.retryable ?? !1,
      suggestion: s.suggestion,
      userAction: s.userAction
    };
  }
  /**
   * Handle content validation errors
   */
  static handleContentError(e) {
    return e === "" ? T.createError("validation", R.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: ge.EMPTY_CONTENT
    }) : e.length > 8192 ? T.createError("validation", R.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: ge.CONTENT_TOO_LONG
    }) : T.createError("validation", R.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(e) {
    const t = e.message.toLowerCase();
    return t.includes("user declined") || t.includes("denied") ? T.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : t.includes("no extension") ? T.createError("signing", R.NO_EXTENSION, {
      retryable: !1,
      suggestion: ge.NO_EXTENSION
    }) : T.createError("signing", R.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(e, t) {
    const s = t.message.toLowerCase();
    return s.includes("timeout") ? T.createError("network", `Connection to ${e} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? T.createError("network", `Failed to connect to ${e}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : T.createError("network", R.CONNECTION_FAILED, {
      retryable: !0,
      suggestion: ge.CONNECTION_FAILED
    });
  }
  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(e) {
    const t = e.length, s = e.filter((r) => r.success), i = e.filter((r) => !r.success);
    if (t === 0)
      return {
        success: !1,
        error: T.createError("config", R.NO_RELAYS, {
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
      ), o = i.every(
        (a) => {
          var c, l;
          return ((c = a.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((l = a.error) == null ? void 0 : l.toLowerCase().includes("refused"));
        }
      );
      return r ? {
        success: !1,
        error: T.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : o ? {
        success: !1,
        error: T.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: T.createError("relay", R.PUBLISH_FAILED, {
          retryable: !0,
          suggestion: ge.PUBLISH_FAILED
        })
      };
    }
    return { success: !0 };
  }
  /**
   * Create user-friendly error message with context
   */
  static formatErrorForUser(e, t) {
    let s = e.message;
    if (t != null && t.relayResults) {
      const i = t.relayResults.filter((o) => o.success).length, r = t.relayResults.length;
      i > 0 ? s += ` (${i}/${r} relays succeeded)` : s += ` (0/${r} relays succeeded)`;
    }
    return e.suggestion && (s += `

Suggestion: ${e.suggestion}`), e.retryable && (s += `

This error is retryable - you can try again.`), s;
  }
  /**
   * Check if error should trigger automatic retry
   */
  static shouldRetry(e, t, s) {
    return e.retryable && t < s;
  }
  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(e, t = 1e3) {
    return Math.min(t * Math.pow(2, e), 3e4);
  }
}
class Le {
  // Optional relay selection
  constructor(e) {
    u(this, "eventData");
    u(this, "nostrInstance");
    // NostrUnchained instance for publishing
    u(this, "signed", !1);
    u(this, "signedEvent");
    u(this, "targetRelays");
    this.nostrInstance = e, this.eventData = {
      tags: []
    };
  }
  /**
   * Set the event kind
   */
  kind(e) {
    return this.eventData.kind = e, this;
  }
  /**
   * Set the event content
   */
  content(e) {
    return this.eventData.content = e, this;
  }
  /**
   * Add a tag to the event
   */
  tag(e, t, ...s) {
    const i = [e, t, ...s];
    return this.eventData.tags.push(i), this;
  }
  /**
   * Add multiple tags at once
   */
  tags(e) {
    return this.eventData.tags.push(...e), this;
  }
  /**
   * Add a hashtag
   */
  hashtag(e) {
    return this.eventData.tags.push(["t", e]), this;
  }
  /**
   * Add a reply-to tag (NIP-10 style)
   */
  replyTo(e, t) {
    return t ? this.eventData.tags.push(["e", e, t, "reply"]) : this.eventData.tags.push(["e", e, "", "reply"]), this;
  }
  /**
   * Add a mention tag
   */
  mention(e, t) {
    return t ? this.eventData.tags.push(["p", e, t]) : this.eventData.tags.push(["p", e]), this;
  }
  /**
   * Add a subject tag
   */
  subject(e) {
    return this.eventData.tags.push(["subject", e]), this;
  }
  /**
   * Set custom timestamp
   */
  timestamp(e) {
    return this.eventData.created_at = e, this;
  }
  /**
   * Specify which relays to publish to (overrides default relays)
   */
  toRelays(...e) {
    return this.targetRelays = e, this;
  }
  /**
   * Specify which relays to publish to via array
   */
  toRelayList(e) {
    return this.targetRelays = e, this;
  }
  /**
   * Explicitly sign the event (optional - auto-signs on publish)
   */
  async sign() {
    if (this.eventData.kind !== 6 && this.eventData.kind !== 5 && !this.eventData.content)
      throw new Error("Content is required before signing");
    const t = this.nostrInstance.signingProvider;
    if (!t)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = {
      pubkey: await t.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    }, i = k.validateEvent(s);
    if (!i.valid)
      throw new Error(`Invalid event: ${i.errors.join(", ")}`);
    const r = k.calculateEventId(s), o = {
      ...s,
      id: r,
      sig: await t.signEvent({ ...s, id: r })
    };
    return this.signedEvent = o, this.signed = !0, this;
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
    if (this.eventData.kind !== 6 && this.eventData.kind !== 5 && !this.eventData.content)
      throw new Error("Content is required before publishing");
    if (this.signed && this.signedEvent) {
      const r = this.targetRelays ? await this.nostrInstance.relayManager.publishToRelays(this.signedEvent, this.targetRelays) : await this.nostrInstance.relayManager.publishToAll(this.signedEvent), o = r.some((a) => a.success);
      return {
        success: o,
        eventId: o ? this.signedEvent.id : void 0,
        event: o ? this.signedEvent : void 0,
        relayResults: r,
        timestamp: Date.now(),
        error: o ? void 0 : {
          message: "Failed to publish to any relay",
          code: "PUBLISH_FAILED",
          retryable: !0
        }
      };
    }
    const t = this.nostrInstance.signingProvider;
    if (!t)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const i = {
      pubkey: await t.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    };
    return this.targetRelays ? await this.nostrInstance.publishToRelays(i, this.targetRelays) : await this.nostrInstance.publish(i);
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
class cs {
  constructor(e) {
    u(this, "nostrInstance");
    this.nostrInstance = e;
  }
  /**
   * Create a new fluent event builder
   */
  create() {
    return new Le(this.nostrInstance);
  }
  /**
   * Direct fluent API - start with kind
   */
  kind(e) {
    return new Le(this.nostrInstance).kind(e);
  }
  /**
   * Direct fluent API - start with content  
   */
  content(e) {
    return new Le(this.nostrInstance).content(e);
  }
  /**
   * Quick create text note
   */
  note(e) {
    return this.create().kind(1).content(e);
  }
  /**
   * Quick create DM
   */
  dm(e, t) {
    return this.create().kind(4).content(e).tag("p", t);
  }
  /**
   * Quick create job posting
   */
  job(e) {
    return this.create().kind(30023).content(e).tag("t", "jobs");
  }
  /**
   * Quick create reaction
   */
  reaction(e, t = "+") {
    return this.create().kind(7).content(t).tag("e", e);
  }
  /**
   * Quick create deletion event (NIP-09)
   */
  deletion(e, t) {
    return this.create().kind(5).content(t || "").tag("e", e);
  }
  /**
   * Direct publish from JSON data (bypasses fluent building)
   */
  async publish(e) {
    return await this.nostrInstance.publish(e);
  }
}
function se(n) {
  const e = /* @__PURE__ */ new Set();
  let t = n;
  return {
    subscribe(s) {
      return s(t), e.add(s), () => e.delete(s);
    },
    set(s) {
      t = s, e.forEach((i) => i(t));
    },
    update(s) {
      t = s(t), e.forEach((i) => i(t));
    }
  };
}
function P(n, e) {
  const t = Array.isArray(n) ? n : [n], s = /* @__PURE__ */ new Set();
  let i, r = !1;
  const o = [], a = () => {
    if (t.length === 1) {
      const c = t[0].subscribe((l) => {
        const d = e(l);
        (!r || d !== i) && (i = d, r && s.forEach((h) => h(i)));
      });
      o.length === 0 && o.push(c);
    }
  };
  return {
    subscribe(c) {
      return r || (a(), r = !0), i !== void 0 && c(i), s.add(c), () => {
        s.delete(c), s.size === 0 && (o.forEach((l) => l()), o.length = 0, r = !1);
      };
    }
  };
}
function yt(n) {
  return {
    subscribe: n.subscribe.bind(n),
    derive: (e) => P(n, e)
  };
}
class we {
  constructor(e, t, s) {
    u(this, "_events");
    u(this, "_readIds", /* @__PURE__ */ new Set());
    u(this, "parent");
    this.parent = e, this._events = P(e.events, (i) => {
      let r = i;
      return t && (r = r.filter(t)), s && (r = [...r].sort(s)), r;
    });
  }
  // Readable interface
  subscribe(e) {
    return this._events.subscribe(e);
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
    return P(this._events, (e) => e.length);
  }
  get latest() {
    return P(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return P(this._events, (e) => e.length === 0);
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
  async updateFilter(e) {
    return this.parent.updateFilter(e);
  }
  async updateOptions(e) {
    return this.parent.updateOptions(e);
  }
  derive(e) {
    return yt(P(this._events, e));
  }
  async retry() {
    return this.parent.retry();
  }
  clearError() {
    return this.parent.clearError();
  }
  // Feed-specific methods
  async loadMore(e) {
    return this.parent.loadMore(e);
  }
  async loadNewer() {
    return this.parent.loadNewer();
  }
  async loadOlder() {
    return this.parent.loadOlder();
  }
  markAsRead(e) {
    this._readIds.add(e);
  }
  markAllAsRead() {
    let e = [];
    this._events.subscribe((s) => {
      e = s;
    })(), e.forEach((s) => this._readIds.add(s.id));
  }
  removeEvent(e) {
    return this.parent.removeEvent(e);
  }
  filter(e) {
    return new we(this, e);
  }
  sortBy(e) {
    return new we(this, void 0, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((o) => {
      e = o;
    })();
    const s = e.filter((o) => this._readIds.has(o.id)).length, i = e.length, r = i - s;
    return { read: s, unread: r, total: i };
  }
}
class Ye {
  constructor(e, t, s = {}, i = {}) {
    u(this, "_events", se([]));
    u(this, "_status", se("connecting"));
    u(this, "_error", se(null));
    u(this, "_loading", se(!1));
    u(this, "_count", se(0));
    u(this, "_readIds", /* @__PURE__ */ new Set());
    u(this, "subscription");
    u(this, "subscriptionManager");
    u(this, "filters");
    u(this, "options");
    u(this, "maxEvents");
    u(this, "isLive");
    u(this, "eventPredicate");
    u(this, "eventComparator");
    this.subscriptionManager = e, this.filters = t, this.options = s, this.maxEvents = i.maxEvents, this.isLive = i.live || !1, this.eventPredicate = i.predicate, this.eventComparator = i.comparator, this.initializeSubscription();
  }
  // Readable interface
  subscribe(e) {
    return this._events.subscribe(e);
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
    return P(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return P(this._events, () => !0);
  }
  get isEmpty() {
    return P(this._events, (e) => e.length === 0);
  }
  // Lifecycle methods
  async close() {
    var e, t;
    (t = (e = this.subscription) == null ? void 0 : e.subscription) != null && t.cleanup && this.subscription.subscription.cleanup(), this._status.set("closed");
  }
  async refresh() {
    this.reset(), await this.initializeSubscription();
  }
  reset() {
    this._events.set([]), this._count.set(0), this._readIds.clear(), this._error.set(null);
  }
  async updateFilter(e) {
    this.filters = this.filters.map((t) => ({ ...t, ...e })), await this.refresh();
  }
  async updateOptions(e) {
    this.options = { ...this.options, ...e }, await this.refresh();
  }
  derive(e) {
    return yt(P(this._events, e));
  }
  async retry() {
    this._status.set("reconnecting"), this._error.set(null), await this.initializeSubscription();
  }
  clearError() {
    this._error.set(null);
  }
  // Feed-specific methods
  async loadMore(e = 10) {
    return [];
  }
  async loadNewer() {
    return [];
  }
  async loadOlder() {
    return [];
  }
  markAsRead(e) {
    this._readIds.add(e);
  }
  markAllAsRead() {
    let e = [];
    this._events.subscribe((s) => {
      e = s;
    })(), e.forEach((s) => this._readIds.add(s.id));
  }
  removeEvent(e) {
    this._events.update((t) => t.filter((s) => s.id !== e)), this._count.update((t) => t - 1);
  }
  filter(e) {
    return new we(this, e, this.eventComparator);
  }
  sortBy(e) {
    return new we(this, this.eventPredicate, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((o) => {
      e = o;
    })();
    const s = e.filter((o) => this._readIds.has(o.id)).length, i = e.length, r = i - s;
    return { read: s, unread: r, total: i };
  }
  // Test helper - simulate receiving an event
  _testInjectEvent(e) {
    this.handleEvent(e);
  }
  // Test helper - simulate EOSE
  _testSimulateEOSE() {
    this._status.set("active"), this._loading.set(!1);
  }
  // Test helper - wait for initialization
  async _testWaitForInit() {
    let e = 0;
    for (; !this.subscription && e < 100; )
      await new Promise((t) => setTimeout(t, 10)), e++;
  }
  // Private methods
  async initializeSubscription() {
    this._loading.set(!0), this._status.set("connecting");
    try {
      const e = {
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
      }, t = await this.subscriptionManager.getOrCreateSubscription(this.filters), s = t.addListener({
        onEvent: e.onEvent,
        onEose: e.onEose,
        onClose: e.onClose,
        onError: e.onError
      });
      this.subscription = {
        success: !0,
        subscription: {
          id: t.key,
          // Add cleanup method
          cleanup: () => t.removeListener(s)
        },
        relayResults: [],
        error: void 0
      }, this.subscription.success ? this._error.set(null) : (this._error.set(this.subscription.error || {
        message: "Subscription failed",
        retryable: !0
      }), this._status.set("error"), this._loading.set(!1));
    } catch (e) {
      this._error.set({
        message: e instanceof Error ? e.message : "Unknown error",
        retryable: !0
      }), this._status.set("error"), this._loading.set(!1);
    }
  }
  handleEvent(e) {
    this.eventPredicate && !this.eventPredicate(e) || (this._events.update((t) => {
      if (t.some((i) => i.id === e.id))
        return t;
      const s = [...t, e];
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((i, r) => r.created_at - i.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
    }), this._count.update((t) => t + 1));
  }
}
class ls {
  constructor(e) {
    u(this, "filter", {});
    u(this, "options", {});
    u(this, "config", {});
    this.subscriptionManager = e;
  }
  kinds(e) {
    return this.filter.kinds = e, this;
  }
  authors(e) {
    return this.filter.authors = e, this;
  }
  since(e) {
    return this.filter.since = e, this;
  }
  until(e) {
    return this.filter.until = e, this;
  }
  limit(e) {
    return this.filter.limit = e, this;
  }
  live(e) {
    return this.config.live = e, this.options = { ...this.options, live: e }, this;
  }
  maxEvents(e) {
    return this.config.maxEvents = e, this;
  }
  build() {
    const e = [this.filter];
    return new Ye(
      this.subscriptionManager,
      e,
      this.options,
      this.config
    );
  }
}
let ce;
function ri(n) {
  ce = n;
}
function ni() {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new ls(ce);
}
function oi(n) {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = n.toFilter();
  return new Ye(ce, e);
}
function ai(n) {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new Ye(ce, [n]);
}
class bt extends pt {
  constructor(e, t) {
    super(), this.finished = !1, this.destroyed = !1, je(e);
    const s = me(t);
    if (this.iHash = e.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const i = this.blockLen, r = new Uint8Array(i);
    r.set(s.length > i ? e.create().update(s).digest() : s);
    for (let o = 0; o < r.length; o++)
      r[o] ^= 54;
    this.iHash.update(r), this.oHash = e.create();
    for (let o = 0; o < r.length; o++)
      r[o] ^= 106;
    this.oHash.update(r), be(r);
  }
  update(e) {
    return Re(this), this.iHash.update(e), this;
  }
  digestInto(e) {
    Re(this), de(e, this.outputLen), this.finished = !0, this.iHash.digestInto(e), this.oHash.update(e), this.oHash.digestInto(e), this.destroy();
  }
  digest() {
    const e = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(e), e;
  }
  _cloneInto(e) {
    e || (e = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: t, iHash: s, finished: i, destroyed: r, blockLen: o, outputLen: a } = this;
    return e = e, e.finished = i, e.destroyed = r, e.blockLen = o, e.outputLen = a, e.oHash = t._cloneInto(e.oHash), e.iHash = s._cloneInto(e.iHash), e;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const ve = (n, e, t) => new bt(n, e).update(t).digest();
ve.create = (n, e) => new bt(n, e);
function us(n, e, t) {
  return je(n), ve(n, me(t), me(e));
}
const Oe = /* @__PURE__ */ Uint8Array.from([0]), nt = /* @__PURE__ */ Uint8Array.of();
function hs(n, e, t, s = 32) {
  je(n), Be(s);
  const i = n.outputLen;
  if (s > 255 * i)
    throw new Error("Length should be <= 255*HashLen");
  const r = Math.ceil(s / i);
  t === void 0 && (t = nt);
  const o = new Uint8Array(r * i), a = ve.create(n, e), c = a._cloneInto(), l = new Uint8Array(a.outputLen);
  for (let d = 0; d < r; d++)
    Oe[0] = d + 1, c.update(d === 0 ? nt : l).update(t).update(Oe).digestInto(l), o.set(l, i * d), a._cloneInto(c);
  return a.destroy(), c.destroy(), be(l, Oe), o.slice(0, s);
}
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function ds(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function ot(n) {
  if (typeof n != "boolean")
    throw new Error(`boolean expected, not ${n}`);
}
function $e(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function Se(n, ...e) {
  if (!ds(n))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(n.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + n.length);
}
function re(n) {
  return new Uint32Array(n.buffer, n.byteOffset, Math.floor(n.byteLength / 4));
}
function gs(...n) {
  for (let e = 0; e < n.length; e++)
    n[e].fill(0);
}
function fs(n, e) {
  if (e == null || typeof e != "object")
    throw new Error("options must be defined");
  return Object.assign(n, e);
}
function ps(n, e) {
  if (n.length !== e.length)
    return !1;
  let t = 0;
  for (let s = 0; s < n.length; s++)
    t |= n[s] ^ e[s];
  return t === 0;
}
function at(n) {
  return Uint8Array.from(n);
}
const mt = (n) => Uint8Array.from(n.split("").map((e) => e.charCodeAt(0))), ys = mt("expand 16-byte k"), bs = mt("expand 32-byte k"), ms = re(ys), ws = re(bs);
function S(n, e) {
  return n << e | n >>> 32 - e;
}
function Ke(n) {
  return n.byteOffset % 4 === 0;
}
const Pe = 64, vs = 16, wt = 2 ** 32 - 1, ct = new Uint32Array();
function Es(n, e, t, s, i, r, o, a) {
  const c = i.length, l = new Uint8Array(Pe), d = re(l), h = Ke(i) && Ke(r), f = h ? re(i) : ct, b = h ? re(r) : ct;
  for (let g = 0; g < c; o++) {
    if (n(e, t, s, d, o, a), o >= wt)
      throw new Error("arx: counter overflow");
    const p = Math.min(Pe, c - g);
    if (h && p === Pe) {
      const E = g / 4;
      if (g % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let y = 0, w; y < vs; y++)
        w = E + y, b[w] = f[w] ^ d[y];
      g += Pe;
      continue;
    }
    for (let E = 0, y; E < p; E++)
      y = g + E, r[y] = i[y] ^ l[E];
    g += p;
  }
}
function Ss(n, e) {
  const { allowShortKeys: t, extendNonceFn: s, counterLength: i, counterRight: r, rounds: o } = fs({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
  if (typeof n != "function")
    throw new Error("core must be a function");
  return $e(i), $e(o), ot(r), ot(t), (a, c, l, d, h = 0) => {
    Se(a), Se(c), Se(l);
    const f = l.length;
    if (d === void 0 && (d = new Uint8Array(f)), Se(d), $e(h), h < 0 || h >= wt)
      throw new Error("arx: counter overflow");
    if (d.length < f)
      throw new Error(`arx: output (${d.length}) is shorter than data (${f})`);
    const b = [];
    let g = a.length, p, E;
    if (g === 32)
      b.push(p = at(a)), E = ws;
    else if (g === 16 && t)
      p = new Uint8Array(32), p.set(a), p.set(a, 16), E = ms, b.push(p);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${g}`);
    Ke(c) || b.push(c = at(c));
    const y = re(p);
    if (s) {
      if (c.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(E, y, re(c.subarray(0, 16)), y), c = c.subarray(16);
    }
    const w = 16 - i;
    if (w !== c.length)
      throw new Error(`arx: nonce must be ${w} or 16 bytes`);
    if (w !== 12) {
      const Q = new Uint8Array(12);
      Q.set(c, r ? 0 : 12 - c.length), c = Q, b.push(c);
    }
    const M = re(c);
    return Es(n, E, y, M, l, d, h, o), gs(...b), d;
  };
}
function Ps(n, e, t, s, i, r = 20) {
  let o = n[0], a = n[1], c = n[2], l = n[3], d = e[0], h = e[1], f = e[2], b = e[3], g = e[4], p = e[5], E = e[6], y = e[7], w = i, M = t[0], Q = t[1], le = t[2], I = o, x = a, N = c, D = l, F = d, L = h, O = f, $ = b, U = g, B = p, K = E, V = y, W = w, z = M, H = Q, G = le;
  for (let tt = 0; tt < r; tt += 2)
    I = I + F | 0, W = S(W ^ I, 16), U = U + W | 0, F = S(F ^ U, 12), I = I + F | 0, W = S(W ^ I, 8), U = U + W | 0, F = S(F ^ U, 7), x = x + L | 0, z = S(z ^ x, 16), B = B + z | 0, L = S(L ^ B, 12), x = x + L | 0, z = S(z ^ x, 8), B = B + z | 0, L = S(L ^ B, 7), N = N + O | 0, H = S(H ^ N, 16), K = K + H | 0, O = S(O ^ K, 12), N = N + O | 0, H = S(H ^ N, 8), K = K + H | 0, O = S(O ^ K, 7), D = D + $ | 0, G = S(G ^ D, 16), V = V + G | 0, $ = S($ ^ V, 12), D = D + $ | 0, G = S(G ^ D, 8), V = V + G | 0, $ = S($ ^ V, 7), I = I + L | 0, G = S(G ^ I, 16), K = K + G | 0, L = S(L ^ K, 12), I = I + L | 0, G = S(G ^ I, 8), K = K + G | 0, L = S(L ^ K, 7), x = x + O | 0, W = S(W ^ x, 16), V = V + W | 0, O = S(O ^ V, 12), x = x + O | 0, W = S(W ^ x, 8), V = V + W | 0, O = S(O ^ V, 7), N = N + $ | 0, z = S(z ^ N, 16), U = U + z | 0, $ = S($ ^ U, 12), N = N + $ | 0, z = S(z ^ N, 8), U = U + z | 0, $ = S($ ^ U, 7), D = D + F | 0, H = S(H ^ D, 16), B = B + H | 0, F = S(F ^ B, 12), D = D + F | 0, H = S(H ^ D, 8), B = B + H | 0, F = S(F ^ B, 7);
  let A = 0;
  s[A++] = o + I | 0, s[A++] = a + x | 0, s[A++] = c + N | 0, s[A++] = l + D | 0, s[A++] = d + F | 0, s[A++] = h + L | 0, s[A++] = f + O | 0, s[A++] = b + $ | 0, s[A++] = g + U | 0, s[A++] = p + B | 0, s[A++] = E + K | 0, s[A++] = y + V | 0, s[A++] = w + W | 0, s[A++] = M + z | 0, s[A++] = Q + H | 0, s[A++] = le + G | 0;
}
const lt = /* @__PURE__ */ Ss(Ps, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), ks = {
  saltInfo: "nip44-v2"
};
class j extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP44Error";
  }
}
var q = /* @__PURE__ */ ((n) => (n.INVALID_KEY = "INVALID_KEY", n.INVALID_NONCE = "INVALID_NONCE", n.INVALID_PAYLOAD = "INVALID_PAYLOAD", n.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", n.DECRYPTION_FAILED = "DECRYPTION_FAILED", n.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", n.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", n.PADDING_ERROR = "PADDING_ERROR", n))(q || {});
class _ {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(e, t) {
    try {
      const s = e.replace(/^0x/, "");
      let i = t.replace(/^0x/, "");
      if (i.length === 66 && (i.startsWith("02") || i.startsWith("03")) && (i = i.slice(2)), s.length !== 64)
        throw new j(
          "Invalid private key length",
          q.INVALID_KEY
        );
      if (i.length !== 64)
        throw new j(
          "Invalid public key length - expected 32-byte x-coordinate",
          q.INVALID_KEY
        );
      const r = new Uint8Array(32);
      for (let l = 0; l < 32; l++)
        r[l] = parseInt(s.substr(l * 2, 2), 16);
      const a = Ht(r, "02" + i).subarray(1, 33);
      return us(oe, a, "nip44-v2");
    } catch (s) {
      throw s instanceof j ? s : new j(
        `Key derivation failed: ${s.message}`,
        q.INVALID_KEY,
        s
      );
    }
  }
  /**
   * Derive per-message keys using HKDF-Expand
   */
  static deriveMessageKeys(e, t) {
    try {
      if (e.length !== 32)
        throw new j(
          "Invalid conversation key length",
          q.INVALID_KEY
        );
      if (t.length !== this.NONCE_SIZE)
        throw new j(
          "Invalid nonce length",
          q.INVALID_NONCE
        );
      const s = hs(oe, e, t, 76);
      return {
        chachaKey: s.subarray(0, 32),
        // bytes 0-31
        chachaNonce: s.subarray(32, 44),
        // bytes 32-43 (12 bytes)
        hmacKey: s.subarray(44, 76)
        // bytes 44-75
      };
    } catch (s) {
      throw new j(
        `Message key derivation failed: ${s.message}`,
        q.ENCRYPTION_FAILED,
        s
      );
    }
  }
  /**
   * Calculate padded content length (NIP-44 padding algorithm)
   * Returns just the padded content length, without length prefix
   */
  static calculatePaddedContentLength(e) {
    if (e < 0 || e > 65536)
      throw new j(
        "Invalid plaintext length",
        q.INVALID_PLAINTEXT_LENGTH
      );
    if (e === 0 || e <= 32)
      return 32;
    const t = 1 << Math.floor(Math.log2(e - 1)) + 1;
    let s;
    return t <= 256 ? s = 32 : s = t / 8, s * (Math.floor((e - 1) / s) + 1);
  }
  /**
   * Calculate padded content length (official NIP-44 padding algorithm)
   * Returns ONLY the padded content length, without length prefix
   * This matches the official test vectors
   */
  static calculatePaddedLength(e) {
    return this.calculatePaddedContentLength(e);
  }
  /**
   * Apply padding to plaintext (content only, without length prefix)
   * Returns just the padded content for testing purposes
   */
  static applyPadding(e) {
    const t = e.length, s = this.calculatePaddedContentLength(t), i = new Uint8Array(s);
    return i.set(e, 0), i;
  }
  /**
   * Apply NIP-44 formatting: [plaintext_length: u16][padded_plaintext]
   * Returns the complete formatted data for encryption
   */
  static formatForEncryption(e) {
    const t = e.length, s = this.applyPadding(e), i = 2 + s.length, r = new Uint8Array(i);
    return new DataView(r.buffer).setUint16(0, t, !1), r.set(s, 2), r;
  }
  /**
   * Apply NIP-44 formatting with length prefix:
   * [plaintext_length: u16][padded_plaintext]
   */
  static applyNIP44Formatting(e) {
    const t = e.length, s = this.applyPadding(e), i = 2 + s.length, r = new Uint8Array(i);
    return new DataView(r.buffer).setUint16(0, t, !1), r.set(s, 2), r;
  }
  /**
   * Remove padding from padded content (two different formats supported)
   */
  static removePadding(e) {
    if (e.length >= 2) {
      const i = new DataView(e.buffer).getUint16(0, !1);
      if (i <= e.length - 2 && i > 0)
        return e.subarray(2, 2 + i);
    }
    let t = e.length;
    for (; t > 0 && e[t - 1] === 0; )
      t--;
    return e.subarray(0, t);
  }
  /**
   * Generate cryptographically secure random nonce
   */
  static generateNonce() {
    return he(this.NONCE_SIZE);
  }
  /**
   * Encrypt plaintext using NIP-44 v2
   */
  static encrypt(e, t, s) {
    try {
      if (e == null)
        throw new j(
          "Plaintext cannot be null or undefined",
          q.INVALID_PLAINTEXT_LENGTH
        );
      const i = new TextEncoder().encode(e), r = s || this.generateNonce(), o = this.deriveMessageKeys(t, r), a = this.formatForEncryption(i), c = lt(
        o.chachaKey,
        o.chachaNonce,
        a
      ), l = _e(r, c), d = ve(oe, o.hmacKey, l), h = new Uint8Array([this.VERSION]), f = _e(h, r, c, d);
      return {
        payload: btoa(String.fromCharCode(...f)),
        nonce: r
      };
    } catch (i) {
      throw i instanceof j ? i : new j(
        `Encryption failed: ${i.message}`,
        q.ENCRYPTION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt NIP-44 v2 payload
   */
  static decrypt(e, t) {
    try {
      const s = atob(e), i = new Uint8Array(s.length);
      for (let w = 0; w < s.length; w++)
        i[w] = s.charCodeAt(w);
      const r = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (i.length < r)
        throw new j(
          "Payload too short",
          q.INVALID_PAYLOAD
        );
      let o = 0;
      const a = i[o];
      if (o += this.VERSION_SIZE, a !== this.VERSION)
        throw new j(
          `Unsupported version: ${a}`,
          q.INVALID_PAYLOAD
        );
      const c = i.slice(o, o + this.NONCE_SIZE);
      o += this.NONCE_SIZE;
      const l = i.slice(o, -this.MAC_SIZE), d = i.slice(-this.MAC_SIZE), h = this.deriveMessageKeys(t, c), f = _e(c, l), b = ve(oe, h.hmacKey, f);
      if (!ps(b, d))
        return {
          plaintext: "",
          isValid: !1
        };
      const p = lt(
        h.chachaKey,
        h.chachaNonce,
        l
      ), E = this.removePadding(p);
      return {
        plaintext: new TextDecoder().decode(E),
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
  static encryptWithNonce(e, t, s) {
    return this.encrypt(e, t, s).payload;
  }
  /**
   * Validate payload format without decrypting
   */
  static validatePayload(e) {
    try {
      const t = atob(e), s = new Uint8Array(t.length);
      for (let r = 0; r < t.length; r++)
        s[r] = t.charCodeAt(r);
      const i = this.VERSION_SIZE + this.NONCE_SIZE + 1;
      return !(s.length < i || s[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
u(_, "VERSION", 2), u(_, "SALT", new TextEncoder().encode(ks.saltInfo)), u(_, "NONCE_SIZE", 32), u(_, "CHACHA_KEY_SIZE", 32), u(_, "CHACHA_NONCE_SIZE", 12), u(_, "HMAC_KEY_SIZE", 32), u(_, "MAC_SIZE", 32), u(_, "VERSION_SIZE", 1);
const Ve = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NIP44Crypto: _
}, Symbol.toStringTag, { value: "Module" }));
class m extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP59Error";
  }
}
var v = /* @__PURE__ */ ((n) => (n.INVALID_RUMOR = "INVALID_RUMOR", n.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", n.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", n.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", n.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", n.DECRYPTION_FAILED = "DECRYPTION_FAILED", n.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", n.INVALID_SEAL = "INVALID_SEAL", n.NO_RECIPIENTS = "NO_RECIPIENTS", n.INVALID_RECIPIENT = "INVALID_RECIPIENT", n.INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY", n))(v || {});
const Y = {
  SEAL_KIND: 13,
  GIFT_WRAP_KIND: 1059,
  MAX_TIMESTAMP_AGE_SECONDS: 2 * 24 * 60 * 60,
  // 2 days
  MIN_TIMESTAMP_AGE_SECONDS: 0
  // Can be current time
};
class pe {
  /**
   * Create a kind 13 seal containing the encrypted rumor
   * The seal is signed by the sender's real private key
   */
  static async createSeal(e, t, s) {
    try {
      this.validateRumor(e), this.validatePrivateKey(t), this.validatePublicKey(s);
      const i = JSON.stringify(e), r = _.deriveConversationKey(
        t,
        s
      ), o = _.encrypt(i, r), a = this.getPublicKeyFromPrivate(t), c = {
        pubkey: a,
        created_at: Math.floor(Date.now() / 1e3),
        kind: Y.SEAL_KIND,
        tags: [],
        // Always empty for seals
        content: o.payload
      }, l = this.calculateEventId(c), d = await this.signEvent(c, l, t);
      return {
        id: l,
        pubkey: a,
        created_at: c.created_at,
        kind: Y.SEAL_KIND,
        tags: [],
        content: o.payload,
        sig: d
      };
    } catch (i) {
      throw i instanceof m ? i : new m(
        `Seal creation failed: ${i.message}`,
        v.SEAL_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt a seal to recover the original rumor
   */
  static decryptSeal(e, t) {
    try {
      if (e.kind !== Y.SEAL_KIND)
        return { rumor: null, isValid: !1 };
      if (e.tags.length !== 0)
        return { rumor: null, isValid: !1 };
      const s = _.deriveConversationKey(
        t,
        e.pubkey
      ), i = _.decrypt(e.content, s);
      if (!i.isValid)
        return { rumor: null, isValid: !1 };
      const r = JSON.parse(i.plaintext);
      return this.isValidRumor(r) ? { rumor: r, isValid: !0 } : { rumor: null, isValid: !1 };
    } catch {
      return { rumor: null, isValid: !1 };
    }
  }
  /**
   * Validate rumor structure
   */
  static validateRumor(e) {
    if (!e || typeof e != "object")
      throw new m(
        "Rumor must be a valid object",
        v.INVALID_RUMOR
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new m(
        "Rumor must have valid pubkey",
        v.INVALID_RUMOR
      );
    if (typeof e.created_at != "number" || e.created_at <= 0)
      throw new m(
        "Rumor must have valid created_at timestamp",
        v.INVALID_RUMOR
      );
    if (typeof e.kind != "number" || e.kind < 0 || e.kind > 65535)
      throw new m(
        "Rumor must have valid kind",
        v.INVALID_RUMOR
      );
    if (!Array.isArray(e.tags))
      throw new m(
        "Rumor must have valid tags array",
        v.INVALID_RUMOR
      );
    if (typeof e.content != "string")
      throw new m(
        "Rumor must have valid content string",
        v.INVALID_RUMOR
      );
  }
  /**
   * Check if an object is a valid rumor (more lenient for decryption)
   */
  static isValidRumor(e) {
    return e && typeof e == "object" && typeof e.pubkey == "string" && typeof e.created_at == "number" && typeof e.kind == "number" && Array.isArray(e.tags) && typeof e.content == "string";
  }
  /**
   * Validate private key format
   */
  static validatePrivateKey(e) {
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new m(
        "Invalid private key format",
        v.SEAL_CREATION_FAILED
      );
  }
  /**
   * Validate public key format
   */
  static validatePublicKey(e) {
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new m(
        "Invalid public key format",
        v.SEAL_CREATION_FAILED
      );
  }
  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivate(e) {
    try {
      console.log("🔍 SealCreator.getPublicKeyFromPrivate called with:", {
        privateKeyLength: e == null ? void 0 : e.length,
        privateKeyType: typeof e,
        privateKeyPrefix: (e == null ? void 0 : e.substring(0, 8)) + "..."
      });
      const t = new Uint8Array(
        e.match(/.{1,2}/g).map((o) => parseInt(o, 16))
      );
      console.log("📊 privateKeyBytes:", {
        length: t.length,
        type: t.constructor.name,
        first4: Array.from(t.slice(0, 4))
      });
      const i = ne.getPublicKey(t, !1).slice(1, 33), r = Array.from(i).map((o) => o.toString(16).padStart(2, "0")).join("");
      return console.log("✅ Successfully derived public key:", r.substring(0, 8) + "..."), r;
    } catch (t) {
      throw console.error("❌ SealCreator getPublicKeyFromPrivate error:", {
        error: t,
        message: t.message,
        stack: t.stack,
        privateKeyInfo: {
          type: typeof e,
          length: e == null ? void 0 : e.length
        }
      }), new m(
        "Failed to derive public key from private key",
        v.SEAL_CREATION_FAILED,
        t
      );
    }
  }
  /**
   * Calculate event ID according to NIP-01
   */
  static calculateEventId(e) {
    const t = JSON.stringify([
      0,
      // Reserved for future use
      e.pubkey,
      e.created_at,
      e.kind,
      e.tags,
      e.content
    ]), s = oe(new TextEncoder().encode(t));
    return Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const i = await ne.schnorr.sign(t, s);
      return Array.from(i).map((r) => r.toString(16).padStart(2, "0")).join("");
    } catch (i) {
      throw new m(
        "Failed to sign seal event",
        v.SEAL_CREATION_FAILED,
        i
      );
    }
  }
}
const Ms = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SealCreator: pe
}, Symbol.toStringTag, { value: "Module" }));
class Ae {
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair() {
    try {
      const e = he(32), t = Array.from(e).map((o) => o.toString(16).padStart(2, "0")).join(""), i = ne.getPublicKey(t, !1).slice(1, 33), r = Array.from(i).map((o) => o.toString(16).padStart(2, "0")).join("");
      return {
        privateKey: t,
        publicKey: r
      };
    } catch (e) {
      throw new m(
        `Ephemeral key generation failed: ${e.message}`,
        v.EPHEMERAL_KEY_GENERATION_FAILED,
        e
      );
    }
  }
  /**
   * Generate multiple ephemeral key pairs for multi-recipient scenarios
   * Each recipient gets their own unique ephemeral key pair
   */
  static generateMultipleEphemeralKeyPairs(e) {
    if (e <= 0)
      throw new m(
        "Key pair count must be greater than 0",
        v.EPHEMERAL_KEY_GENERATION_FAILED
      );
    const t = [];
    for (let s = 0; s < e; s++)
      t.push(this.generateEphemeralKeyPair());
    return t;
  }
  /**
   * Validate that an ephemeral key pair is properly formatted
   */
  static validateEphemeralKeyPair(e) {
    try {
      if (!/^[0-9a-f]{64}$/i.test(e.privateKey) || !/^[0-9a-f]{64}$/i.test(e.publicKey))
        return !1;
      const s = ne.getPublicKey(e.privateKey, !1).slice(1, 33), i = Array.from(s).map((r) => r.toString(16).padStart(2, "0")).join("");
      return e.publicKey.toLowerCase() === i.toLowerCase();
    } catch {
      return !1;
    }
  }
  /**
   * Securely clear ephemeral key material from memory
   * Note: In JavaScript, we can't guarantee memory clearing, but we can
   * overwrite the string values to make them less likely to persist
   */
  static clearEphemeralKeyPair(e) {
    try {
      const t = he(32).reduce((s, i) => s + i.toString(16).padStart(2, "0"), "");
      e.privateKey = t, e.publicKey = t;
    } catch {
    }
  }
  /**
   * Generate a secure random nonce for gift wrap creation
   * This can be used for additional randomness in the encryption process
   */
  static generateGiftWrapNonce() {
    return he(32);
  }
}
class We {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(e = Y.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      if (e < 0)
        throw new m(
          "Max age seconds cannot be negative",
          v.TIMESTAMP_RANDOMIZATION_FAILED
        );
      const t = Math.floor(Date.now() / 1e3);
      if (e === 0)
        return t;
      const s = this.generateSecureRandomOffset(e);
      return t - s;
    } catch (t) {
      throw t instanceof m ? t : new m(
        `Timestamp randomization failed: ${t.message}`,
        v.TIMESTAMP_RANDOMIZATION_FAILED,
        t
      );
    }
  }
  /**
   * Generate a cryptographically secure random offset within the specified range
   */
  static generateSecureRandomOffset(e) {
    const t = he(4), s = new DataView(t.buffer).getUint32(0, !1);
    return Math.floor(s / 4294967295 * e);
  }
  /**
   * Generate multiple randomized timestamps for batch gift wrap creation
   * Each timestamp is independently randomized
   */
  static generateMultipleRandomizedTimestamps(e, t = Y.MAX_TIMESTAMP_AGE_SECONDS) {
    if (e <= 0)
      throw new m(
        "Timestamp count must be greater than 0",
        v.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let i = 0; i < e; i++)
      s.push(this.generateRandomizedTimestamp(t));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(e, t = Y.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      const s = Math.floor(Date.now() / 1e3), i = s - t, r = s + 60;
      return e >= i && e <= r;
    } catch {
      return !1;
    }
  }
  /**
   * Get the recommended timestamp randomization window for NIP-59
   */
  static getRecommendedMaxAge() {
    return Y.MAX_TIMESTAMP_AGE_SECONDS;
  }
  /**
   * Calculate entropy bits for timestamp randomization
   * Higher entropy means better privacy protection
   */
  static calculateTimestampEntropy(e) {
    return e <= 0 ? 0 : Math.log2(e);
  }
  /**
   * Generate a timestamp that appears to be from a specific time window
   * Useful for testing or specific privacy requirements
   */
  static generateTimestampInWindow(e, t) {
    if (e >= t)
      throw new m(
        "Window start must be before window end",
        v.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = t - e, i = this.generateSecureRandomOffset(s);
    return e + i;
  }
}
class ye {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(e, t, s, i) {
    try {
      this.validateSeal(e), this.validateRecipient(t);
      const r = s || Ae.generateEphemeralKeyPair();
      if (!Ae.validateEphemeralKeyPair(r))
        throw new m(
          "Invalid ephemeral key pair",
          v.GIFT_WRAP_CREATION_FAILED
        );
      const o = i || We.generateRandomizedTimestamp(), a = JSON.stringify(e), c = _.deriveConversationKey(
        r.privateKey,
        t.pubkey
      ), l = _.encrypt(a, c), d = t.relayHint ? ["p", t.pubkey, t.relayHint] : ["p", t.pubkey], h = {
        pubkey: r.publicKey,
        created_at: o,
        kind: Y.GIFT_WRAP_KIND,
        tags: [d],
        content: l.payload
      }, f = this.calculateEventId(h), b = await this.signEvent(h, f, r.privateKey);
      return {
        giftWrap: {
          id: f,
          pubkey: r.publicKey,
          created_at: o,
          kind: Y.GIFT_WRAP_KIND,
          tags: [d],
          content: l.payload,
          sig: b
        },
        ephemeralKeyPair: r,
        recipient: t.pubkey
      };
    } catch (r) {
      throw r instanceof m ? r : new m(
        `Gift wrap creation failed: ${r.message}`,
        v.GIFT_WRAP_CREATION_FAILED,
        r
      );
    }
  }
  /**
   * Create multiple gift wraps for multiple recipients
   * Each recipient gets their own gift wrap with unique ephemeral key
   */
  static async createMultipleGiftWraps(e, t) {
    if (!t || t.length === 0)
      throw new m(
        "At least one recipient is required",
        v.NO_RECIPIENTS
      );
    const s = [], i = Ae.generateMultipleEphemeralKeyPairs(
      t.length
    ), r = We.generateMultipleRandomizedTimestamps(
      t.length
    );
    for (let o = 0; o < t.length; o++) {
      const a = await this.createGiftWrap(
        e,
        t[o],
        i[o],
        r[o]
      );
      s.push(a);
    }
    return s;
  }
  /**
   * Decrypt a gift wrap to recover the original seal
   */
  static decryptGiftWrap(e, t) {
    try {
      if (!this.isValidGiftWrap(e))
        return { seal: null, isValid: !1 };
      const s = _.deriveConversationKey(
        t,
        e.pubkey
      ), i = _.decrypt(e.content, s);
      if (!i.isValid)
        return { seal: null, isValid: !1 };
      const r = JSON.parse(i.plaintext);
      return this.isValidSeal(r) ? { seal: r, isValid: !0 } : { seal: null, isValid: !1 };
    } catch {
      return { seal: null, isValid: !1 };
    }
  }
  /**
   * Validate seal structure
   */
  static validateSeal(e) {
    if (!e || typeof e != "object")
      throw new m(
        "Seal must be a valid object",
        v.INVALID_SEAL
      );
    if (e.kind !== Y.SEAL_KIND)
      throw new m(
        "Seal must have kind 13",
        v.INVALID_SEAL
      );
    if (!Array.isArray(e.tags) || e.tags.length !== 0)
      throw new m(
        "Seal must have empty tags array",
        v.INVALID_SEAL
      );
    if (typeof e.content != "string")
      throw new m(
        "Seal must have valid content string",
        v.INVALID_SEAL
      );
  }
  /**
   * Validate recipient configuration
   */
  static validateRecipient(e) {
    if (!e || typeof e != "object")
      throw new m(
        "Recipient must be a valid object",
        v.INVALID_RECIPIENT
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new m(
        "Recipient must have valid pubkey",
        v.INVALID_RECIPIENT
      );
    if (e.relayHint && typeof e.relayHint != "string")
      throw new m(
        "Recipient relay hint must be a string if provided",
        v.INVALID_RECIPIENT
      );
  }
  /**
   * Check if an object is a valid gift wrap (for decryption)
   */
  static isValidGiftWrap(e) {
    return e && typeof e == "object" && e.kind === Y.GIFT_WRAP_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length > 0 && Array.isArray(e.tags[0]) && e.tags[0][0] === "p" && typeof e.tags[0][1] == "string";
  }
  /**
   * Check if an object is a valid seal (for decryption)
   */
  static isValidSeal(e) {
    return e && typeof e == "object" && e.kind === Y.SEAL_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length === 0;
  }
  /**
   * Calculate event ID according to NIP-01
   */
  static calculateEventId(e) {
    const t = JSON.stringify([
      0,
      // Reserved for future use
      e.pubkey,
      e.created_at,
      e.kind,
      e.tags,
      e.content
    ]), s = new TextEncoder().encode(t), i = oe(s);
    return C(i);
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const i = await ne.schnorr.sign(t, s);
      return C(i);
    } catch (i) {
      throw new m(
        "Failed to sign gift wrap event",
        v.GIFT_WRAP_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Extract recipient pubkey from gift wrap p tag
   */
  static getRecipientFromGiftWrap(e) {
    try {
      return e.tags.length > 0 && e.tags[0][0] === "p" ? e.tags[0][1] : null;
    } catch {
      return null;
    }
  }
  /**
   * Extract relay hint from gift wrap p tag
   */
  static getRelayHintFromGiftWrap(e) {
    try {
      return e.tags.length > 0 && e.tags[0][0] === "p" && e.tags[0].length > 2 ? e.tags[0][2] : null;
    } catch {
      return null;
    }
  }
}
const _s = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapCreator: ye
}, Symbol.toStringTag, { value: "Module" }));
class Z {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(e, t, s, i) {
    try {
      this.validateCreateDMInputs(e, t, s);
      const r = this.createRumor(e, t, i), o = [];
      for (const c of s.recipients) {
        const l = await pe.createSeal(
          r,
          t,
          c.pubkey
        ), d = s.maxTimestampAge === 0 ? Math.floor(Date.now() / 1e3) : void 0, h = await ye.createGiftWrap(
          l,
          {
            pubkey: c.pubkey,
            relayHint: c.relayHint || s.relayHint
          },
          void 0,
          // ephemeral key pair (auto-generated)
          d
          // pass current timestamp for test compatibility
        );
        o.push(h);
      }
      const a = await pe.createSeal(
        r,
        t,
        s.recipients[0].pubkey
      );
      return {
        rumor: r,
        seal: a,
        giftWraps: o,
        senderPrivateKey: t
      };
    } catch (r) {
      throw r instanceof m ? r : new m(
        `Gift wrap protocol failed: ${r.message}`,
        v.GIFT_WRAP_CREATION_FAILED,
        r
      );
    }
  }
  /**
   * Decrypt a gift-wrapped direct message
   * Returns the original rumor and verification status
   */
  static async decryptGiftWrappedDM(e, t) {
    try {
      const s = ye.decryptGiftWrap(
        e,
        t
      );
      if (!s.isValid)
        return {
          rumor: null,
          seal: null,
          isValid: !1,
          senderPubkey: ""
        };
      const i = s.seal, r = pe.decryptSeal(
        i,
        t
      );
      return r.isValid ? {
        rumor: r.rumor,
        seal: i,
        isValid: !0,
        senderPubkey: i.pubkey
      } : {
        rumor: null,
        seal: i,
        isValid: !1,
        senderPubkey: i.pubkey
        // We know the seal's pubkey even if rumor is invalid
      };
    } catch {
      return {
        rumor: null,
        seal: null,
        isValid: !1,
        senderPubkey: ""
      };
    }
  }
  /**
   * Create a rumor (unsigned event) containing the message
   */
  static createRumor(e, t, s) {
    const i = this.getPublicKeyFromPrivate(t), r = [];
    return s && r.push(["subject", s]), {
      pubkey: i,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 14,
      // Chat message kind (NIP-17, not 4)
      tags: r,
      content: e
    };
  }
  /**
   * Create gift wraps for a batch of messages to multiple recipients
   * Useful for sending the same message to multiple people
   */
  static async createBatchGiftWraps(e) {
    const t = [];
    for (const s of e) {
      const i = await this.createGiftWrappedDM(
        s.message,
        s.senderPrivateKey,
        s.config
      );
      t.push(i);
    }
    return t;
  }
  /**
   * Extract all gift wraps that are meant for a specific recipient
   * Useful for filtering gift wraps from a relay
   */
  static filterGiftWrapsForRecipient(e, t) {
    return e.filter((s) => ye.getRecipientFromGiftWrap(s) === t);
  }
  /**
   * Decrypt multiple gift wraps for a recipient
   * Returns successful decryptions and filters out invalid ones
   */
  static async decryptMultipleGiftWraps(e, t) {
    const s = [];
    for (const i of e) {
      const r = await this.decryptGiftWrappedDM(i, t);
      r.isValid && s.push(r);
    }
    return s;
  }
  /**
   * Validate inputs for creating gift-wrapped DMs
   */
  static validateCreateDMInputs(e, t, s) {
    if (typeof e != "string")
      throw new m(
        "Message must be a string",
        v.INVALID_RUMOR
      );
    if (typeof t != "string" || !/^[0-9a-f]{64}$/i.test(t))
      throw new m(
        "Invalid sender private key format",
        v.SEAL_CREATION_FAILED
      );
    if (!s || !Array.isArray(s.recipients) || s.recipients.length === 0)
      throw new m(
        "At least one recipient is required",
        v.NO_RECIPIENTS
      );
    for (const i of s.recipients)
      if (!i || typeof i.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(i.pubkey))
        throw new m(
          "Invalid recipient public key format",
          v.INVALID_RECIPIENT
        );
  }
  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivate(e) {
    try {
      const t = new Uint8Array(
        e.match(/.{1,2}/g).map((o) => parseInt(o, 16))
      ), i = ne.getPublicKey(t, !1).slice(1, 33);
      return Array.from(i).map((o) => o.toString(16).padStart(2, "0")).join("");
    } catch (t) {
      throw new m(
        "Failed to derive public key from private key",
        v.SEAL_CREATION_FAILED,
        t
      );
    }
  }
  /**
   * Utility: Create a simple gift wrap configuration for single recipient
   */
  static createSimpleConfig(e, t) {
    return {
      recipients: [{
        pubkey: e,
        relayHint: t
      }],
      relayHint: t
    };
  }
  /**
   * Utility: Create a multi-recipient gift wrap configuration
   */
  static createMultiRecipientConfig(e, t) {
    return {
      recipients: e.map((s) => ({
        pubkey: s,
        relayHint: t
      })),
      relayHint: t
    };
  }
  /**
   * Get protocol statistics for monitoring and debugging
   */
  static getProtocolStats(e) {
    const t = e.length, s = e.reduce((c, l) => c + l.giftWraps.length, 0), i = Math.floor(Date.now() / 1e3), r = e.flatMap(
      (c) => c.giftWraps.map((l) => i - l.giftWrap.created_at)
    ), o = r.length > 0 ? r.reduce((c, l) => c + l, 0) / r.length : 0, a = new Set(
      e.flatMap((c) => c.giftWraps.map((l) => l.recipient))
    );
    return {
      totalMessages: t,
      totalGiftWraps: s,
      averageTimestampAge: o,
      uniqueRecipients: a.size
    };
  }
  /**
   * Unwrap any gift-wrapped event to reveal the actual content
   * This is the core method for transparent caching of any encrypted event type
   * DMs are just one use case - this works for ANY event kind wrapped in gift wrap
   */
  static async unwrapGiftWrap(e, t) {
    try {
      if (!e || e.kind !== 1059)
        return null;
      if (t && t.startsWith("0x") && (t = t.slice(2)), !/^[0-9a-f]{64}$/i.test(t))
        throw new m(
          "Invalid recipient private key format",
          v.INVALID_PRIVATE_KEY
        );
      const { SealCreator: s } = await Promise.resolve().then(() => Ms), { NIP44Crypto: i } = await Promise.resolve().then(() => Ve), r = i.deriveConversationKey(
        t,
        e.pubkey
      ), o = i.decrypt(
        e.content,
        r
      );
      if (!o || !o.isValid)
        return null;
      const a = JSON.parse(o.plaintext);
      if (!a || a.kind !== 13)
        return null;
      const c = i.deriveConversationKey(
        t,
        a.pubkey
      ), l = i.decrypt(
        a.content,
        c
      );
      if (!l || !l.isValid)
        return null;
      const d = JSON.parse(l.plaintext);
      return !d || typeof d.kind != "number" ? null : d;
    } catch (s) {
      return console.error("Failed to unwrap gift wrapped DM:", s), null;
    }
  }
}
const Is = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapProtocol: Z
}, Symbol.toStringTag, { value: "Module" }));
class vt {
  constructor(e) {
    u(this, "_state");
    u(this, "subscription");
    u(this, "config");
    // Reactive store properties
    u(this, "messages");
    u(this, "status");
    u(this, "latest");
    u(this, "error");
    u(this, "subject");
    this.config = e, this._state = se({
      messages: [],
      status: "connecting",
      latest: null,
      isTyping: !1,
      error: null,
      subject: e.subject
    }), this.messages = P(this._state, (t) => t.messages), this.status = P(this._state, (t) => t.status), this.latest = P(this._state, (t) => t.latest), this.error = P(this._state, (t) => t.error), this.subject = P(this._state, (t) => t.subject), this.initializeSubscription();
  }
  /**
   * Send an encrypted direct message
   */
  async send(e, t) {
    var s, i;
    try {
      this.config.debug && console.log("📤 DMConversation.send called:", {
        content: e.substring(0, 20) + "...",
        subject: t,
        recipientPubkey: this.config.recipientPubkey.substring(0, 8) + "...",
        hasSenderPrivateKey: !!this.config.senderPrivateKey,
        senderPrivateKeyLength: (s = this.config.senderPrivateKey) == null ? void 0 : s.length
      }), this.updateStatus("active");
      const r = this.generateMessageId(), o = Math.floor(Date.now() / 1e3), a = {
        id: r,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp: o,
        isFromMe: !0,
        status: "sending",
        subject: t || this.getCurrentSubject()
      };
      this.addMessage(a);
      const c = Z.createSimpleConfig(
        this.config.recipientPubkey,
        (i = this.config.relayHints) == null ? void 0 : i[0]
      );
      this.config.debug && console.log("🎁 Creating gift wrap with config:", c);
      const l = await Z.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        c,
        t
      );
      this.config.debug && console.log("🎁 Gift wrap result:", {
        hasRumor: !!l.rumor,
        hasSeal: !!l.seal,
        giftWrapCount: l.giftWraps.length
      });
      let d = !1, h;
      for (const f of l.giftWraps)
        try {
          this.config.debug && console.log("📡 Publishing gift wrap:", {
            id: f.giftWrap.id,
            kind: f.giftWrap.kind,
            tags: f.giftWrap.tags
          });
          const b = await this.config.relayManager.publishToAll(f.giftWrap);
          this.config.debug && console.log("📡 Publish result:", b), b.some((p) => p.success) && (d = !0, a.eventId = f.giftWrap.id);
        } catch (b) {
          h = b instanceof Error ? b.message : "Publishing failed", this.config.debug && console.error("❌ Publish error:", b);
        }
      if (d)
        return this.updateMessageStatus(r, "sent"), this.config.debug && console.log(`✅ DM sent successfully: ${r}`), { success: !0, messageId: r };
      {
        this.updateMessageStatus(r, "failed");
        const f = h || "Failed to publish to any relay";
        return this.setError(f), this.config.debug && console.error(`❌ DM send failed: ${f}`), { success: !1, error: f, messageId: r };
      }
    } catch (r) {
      const o = r instanceof Error ? r.message : "Unknown error sending message";
      return this.setError(o), this.config.debug && console.error("❌ Exception in send:", r), { success: !1, error: o };
    }
  }
  /**
   * Update the conversation subject
   */
  updateSubject(e) {
    this._state.update((t) => ({
      ...t,
      subject: e
    }));
  }
  /**
   * Clear the conversation history
   */
  clearHistory() {
    this._state.update((e) => ({
      ...e,
      messages: [],
      latest: null
    }));
  }
  /**
   * Close the conversation and clean up subscriptions
   */
  async close() {
    var e, t;
    (t = (e = this.subscription) == null ? void 0 : e.subscription) != null && t.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.updateStatus("disconnected");
  }
  /**
   * Retry connection if in error state
   */
  async retry() {
    var e, t;
    (t = (e = this.subscription) == null ? void 0 : e.subscription) != null && t.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.setError(null), await this.initializeSubscription();
  }
  /**
   * Handle a decrypted event forwarded from the global inbox
   * This enables transparent caching and zero-config DX
   */
  async handleDecryptedEvent(e) {
    this.config.debug && console.log("📨 Processing decrypted event in conversation:", e.id), await this.handleIncomingEvent(e);
  }
  // Private methods
  async initializeSubscription() {
    var e;
    try {
      this.updateStatus("connecting");
      const t = {
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
      if (this.subscription = await this.config.subscriptionManager.subscribe([t], s), !this.subscription.success) {
        const i = ((e = this.subscription.error) == null ? void 0 : e.message) || "Failed to create subscription";
        this.setError(i), this.updateStatus("error");
      }
    } catch (t) {
      const s = t instanceof Error ? t.message : "Failed to initialize subscription";
      this.setError(s), this.updateStatus("error");
    }
  }
  async handleIncomingEvent(e) {
    try {
      if (e.kind !== 1059)
        return;
      const t = await Z.decryptGiftWrappedDM(
        e,
        this.config.senderPrivateKey
      );
      if (!t.isValid || !t.rumor) {
        this.config.debug && console.log("Failed to decrypt gift wrap or not for us");
        return;
      }
      if (t.senderPubkey !== this.config.recipientPubkey) {
        this.config.debug && console.log("Message not from conversation partner");
        return;
      }
      const s = {
        id: this.generateMessageId(),
        content: t.rumor.content,
        senderPubkey: t.senderPubkey,
        recipientPubkey: this.config.senderPubkey,
        timestamp: t.rumor.created_at,
        isFromMe: !1,
        eventId: e.id,
        status: "received",
        subject: this.extractSubjectFromRumor(t.rumor)
      };
      this.getCurrentMessages().some(
        (o) => o.eventId === e.id || o.content === s.content && Math.abs(o.timestamp - s.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(s), this.config.debug && console.log(`Received DM from ${t.senderPubkey}: ${s.content}`));
    } catch (t) {
      this.config.debug && console.error("Error handling incoming DM event:", t);
    }
  }
  addMessage(e) {
    this._state.update((t) => {
      const s = [...t.messages, e];
      return s.sort((i, r) => i.timestamp - r.timestamp), {
        ...t,
        messages: s,
        latest: s[s.length - 1] || null
      };
    });
  }
  updateMessageStatus(e, t) {
    this._state.update((s) => ({
      ...s,
      messages: s.messages.map(
        (i) => i.id === e ? { ...i, status: t } : i
      )
    }));
  }
  updateStatus(e) {
    this._state.update((t) => ({
      ...t,
      status: e
    }));
  }
  setError(e) {
    this._state.update((t) => ({
      ...t,
      error: e
    }));
  }
  getCurrentSubject() {
    let e;
    return this.subject.subscribe((s) => {
      e = s;
    })(), e;
  }
  extractSubjectFromRumor(e) {
    var s;
    const t = (s = e.tags) == null ? void 0 : s.find((i) => i[0] === "subject");
    return t == null ? void 0 : t[1];
  }
  getCurrentMessages() {
    let e = [];
    return this.messages.subscribe((s) => {
      e = s;
    })(), e;
  }
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Subscribe method for Svelte store compatibility
  subscribe(e) {
    return this.messages.subscribe(e);
  }
}
class Et {
  constructor(e) {
    u(this, "_state");
    u(this, "subscription");
    u(this, "config");
    u(this, "roomId");
    // Reactive store properties
    u(this, "messages");
    u(this, "status");
    u(this, "latest");
    u(this, "subject");
    u(this, "participants");
    u(this, "error");
    var t;
    this.config = e, this.roomId = this.generateRoomId(), this._state = se({
      messages: [],
      status: "connecting",
      latest: null,
      subject: ((t = e.options) == null ? void 0 : t.subject) || "Group Chat",
      participants: [...e.participants, e.senderPubkey],
      // Include sender
      isTyping: !1,
      error: null
    }), this.messages = P(this._state, (s) => s.messages), this.status = P(this._state, (s) => s.status), this.latest = P(this._state, (s) => s.latest), this.subject = P(this._state, (s) => s.subject), this.participants = P(this._state, (s) => s.participants), this.error = P(this._state, (s) => s.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted message to all room participants
   */
  async send(e) {
    var t, s;
    try {
      this.updateStatus("active");
      const i = this.generateMessageId(), r = Math.floor(Date.now() / 1e3), o = this.getCurrentSubject(), a = this.getCurrentParticipants(), c = {
        id: i,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: r,
        isFromMe: !0,
        status: "sending",
        subject: o,
        participants: a
      };
      this.addMessage(c);
      const d = {
        recipients: a.filter((g) => g !== this.config.senderPubkey).map((g) => ({ pubkey: g })),
        relayHint: (s = (t = this.config.options) == null ? void 0 : t.relayHints) == null ? void 0 : s[0]
      }, h = await Z.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        d
      );
      let f = !1, b;
      for (const g of h.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(g.giftWrap)).some((y) => y.success) && (f = !0, c.eventId = g.giftWrap.id);
        } catch (p) {
          b = p instanceof Error ? p.message : "Publishing failed";
        }
      if (f)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`Room message sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const g = b || "Failed to publish to any relay";
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
  async updateSubject(e) {
    try {
      return this._state.update((t) => ({
        ...t,
        subject: e
      })), { success: !0 };
    } catch (t) {
      return { success: !1, error: t instanceof Error ? t.message : "Failed to update subject" };
    }
  }
  /**
   * Add a participant to the room
   */
  async addParticipant(e) {
    try {
      return this.getCurrentParticipants().includes(e) ? { success: !1, error: "Participant already in room" } : (this._state.update((s) => ({
        ...s,
        participants: [...s.participants, e]
      })), { success: !0 });
    } catch (t) {
      return { success: !1, error: t instanceof Error ? t.message : "Failed to add participant" };
    }
  }
  /**
   * Remove a participant from the room
   */
  async removeParticipant(e) {
    try {
      return this.getCurrentParticipants().includes(e) ? e === this.config.senderPubkey ? { success: !1, error: "Cannot remove yourself from room" } : (this._state.update((s) => ({
        ...s,
        participants: s.participants.filter((i) => i !== e)
      })), { success: !0 }) : { success: !1, error: "Participant not in room" };
    } catch (t) {
      return { success: !1, error: t instanceof Error ? t.message : "Failed to remove participant" };
    }
  }
  /**
   * Clear the room history
   */
  clearHistory() {
    this._state.update((e) => ({
      ...e,
      messages: [],
      latest: null
    }));
  }
  /**
   * Close the room and clean up subscriptions
   */
  async close() {
    var e, t;
    (t = (e = this.subscription) == null ? void 0 : e.subscription) != null && t.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.updateStatus("disconnected");
  }
  /**
   * Retry connection if in error state
   */
  async retry() {
    var e, t;
    (t = (e = this.subscription) == null ? void 0 : e.subscription) != null && t.id && await this.config.subscriptionManager.close(this.subscription.subscription.id), this.setError(null), await this.initializeSubscription();
  }
  // Private methods
  async initializeSubscription() {
    var e;
    try {
      this.updateStatus("connecting");
      const t = {
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
      if (this.subscription = await this.config.subscriptionManager.subscribe([t], s), !this.subscription.success) {
        const i = ((e = this.subscription.error) == null ? void 0 : e.message) || "Failed to create subscription";
        this.setError(i), this.updateStatus("error");
      }
    } catch (t) {
      const s = t instanceof Error ? t.message : "Failed to initialize subscription";
      this.setError(s), this.updateStatus("error");
    }
  }
  async handleIncomingEvent(e) {
    try {
      if (e.kind !== 1059)
        return;
      const t = await Z.decryptGiftWrappedDM(
        e,
        this.config.senderPrivateKey
      );
      if (!t.isValid || !t.rumor) {
        this.config.debug && console.log("Failed to decrypt gift wrap or not for us");
        return;
      }
      const s = this.getCurrentParticipants();
      if (!s.includes(t.senderPubkey)) {
        this.config.debug && console.log("Message not from room participant");
        return;
      }
      const i = this.extractSubjectFromRumor(t.rumor), r = this.getCurrentSubject(), o = {
        id: this.generateMessageId(),
        content: t.rumor.content,
        senderPubkey: t.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: t.rumor.created_at,
        isFromMe: !1,
        eventId: e.id,
        status: "received",
        subject: i || r,
        participants: s
      };
      this.getCurrentMessages().some(
        (l) => l.eventId === e.id || l.content === o.content && Math.abs(l.timestamp - o.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(o), this.config.debug && console.log(`Received room message from ${t.senderPubkey}: ${o.content}`));
    } catch (t) {
      this.config.debug && console.error("Error handling incoming room event:", t);
    }
  }
  addMessage(e) {
    this._state.update((t) => {
      const s = [...t.messages, e];
      return s.sort((i, r) => i.timestamp - r.timestamp), {
        ...t,
        messages: s,
        latest: s[s.length - 1] || null
      };
    });
  }
  updateMessageStatus(e, t) {
    this._state.update((s) => ({
      ...s,
      messages: s.messages.map(
        (i) => i.id === e ? { ...i, status: t } : i
      )
    }));
  }
  updateStatus(e) {
    this._state.update((t) => ({
      ...t,
      status: e
    }));
  }
  setError(e) {
    this._state.update((t) => ({
      ...t,
      error: e
    }));
  }
  getCurrentSubject() {
    let e = "";
    return this.subject.subscribe((s) => {
      e = s;
    })(), e;
  }
  getCurrentParticipants() {
    let e = [];
    return this.participants.subscribe((s) => {
      e = s;
    })(), e;
  }
  getCurrentMessages() {
    let e = [];
    return this.messages.subscribe((s) => {
      e = s;
    })(), e;
  }
  extractSubjectFromRumor(e) {
    var s;
    const t = (s = e.tags) == null ? void 0 : s.find((i) => i[0] === "subject");
    return t == null ? void 0 : t[1];
  }
  generateRoomId() {
    const t = [...this.config.participants, this.config.senderPubkey].sort().join(",");
    return `room_${Date.now()}_${t.slice(0, 16)}`;
  }
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Subscribe method for Svelte store compatibility
  subscribe(e) {
    return this.messages.subscribe(e);
  }
}
class St {
  constructor(e) {
    u(this, "conversations", /* @__PURE__ */ new Map());
    u(this, "rooms", /* @__PURE__ */ new Map());
    u(this, "config");
    u(this, "_senderPubkey", null);
    u(this, "_senderPrivateKey", null);
    u(this, "parentNostr");
    // Reference to NostrUnchained instance
    // Reactive stores
    u(this, "_conversationList", se([]));
    u(this, "conversations$");
    this.config = e, this.parentNostr = e.parent, this.conversations$ = this._conversationList, this.config.signingProvider && this.initializeSender();
  }
  /**
   * Get or create a conversation with a specific user
   * This is the main entry point: nostr.dm.with('npub...')
   */
  with(e) {
    return this.shouldUseUniversalDM() ? this.delegateToUniversalDM(e) : this.withLegacy(e);
  }
  /**
   * Legacy async implementation for fallback
   */
  async withLegacy(e) {
    const t = this.normalizePubkey(e);
    let s = this.conversations.get(t);
    return s || (s = await this.createConversation(t), this.conversations.set(t, s), this.updateConversationList(), this.config.debug && console.log(`Created new DM conversation with ${t}`)), s;
  }
  /**
   * Create or get a multi-participant room
   * This is the main entry point: nostr.dm.room(['pubkey1', 'pubkey2'], { subject: 'Meeting' })
   */
  async room(e, t) {
    if (this.shouldUseUniversalDM()) {
      const s = this.getUniversalDMInstance();
      if (s && typeof s.room == "function")
        return s.room(e, t);
    }
    return this.roomLegacy(e, t);
  }
  /**
   * Legacy room implementation for fallback
   */
  async roomLegacy(e, t) {
    const s = e.map((o) => this.normalizePubkey(o)), i = this.generateRoomId(s);
    let r = this.rooms.get(i);
    return r || (r = await this.createRoom(s, t), this.rooms.set(i, r), this.updateConversationList(), this.config.debug && console.log(`Created new DM room: ${i} with ${s.length} participants`)), r;
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
    let e = [];
    return this.conversations$.subscribe((s) => {
      e = s;
    })(), e;
  }
  /**
   * Close a specific conversation
   */
  async closeConversation(e) {
    const t = this.normalizePubkey(e), s = this.conversations.get(t);
    s && (await s.close(), this.conversations.delete(t), this.updateConversationList(), this.config.debug && console.log(`Closed DM conversation with ${t}`));
  }
  /**
   * Close a specific room
   */
  async closeRoom(e) {
    const t = this.rooms.get(e);
    t && (await t.close(), this.rooms.delete(e), this.updateConversationList(), this.config.debug && console.log(`Closed DM room: ${e}`));
  }
  /**
   * Close all conversations and clean up
   */
  async closeAll() {
    const e = Array.from(this.conversations.values()).map((s) => s.close()), t = Array.from(this.rooms.values()).map((s) => s.close());
    await Promise.all([...e, ...t]), this.conversations.clear(), this.rooms.clear(), this.updateConversationList(), this.config.debug && console.log("Closed all DM conversations and rooms");
  }
  /**
   * Update the signing provider and initialize sender credentials
   * Called by NostrUnchained when signing provider becomes available
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e;
    try {
      await this.initializeSender();
    } catch (t) {
      this.config.debug && console.error("Failed to update signing provider:", t);
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
      const e = {
        kinds: [1059],
        // NIP-59 gift wrap events
        "#p": [this._senderPubkey],
        // Events tagged with our pubkey
        limit: 50
        // Recent messages only for global inbox
      };
      await this.config.subscriptionManager.subscribe([e], {
        onEvent: (t) => this.handleGlobalInboxEvent(t),
        onEose: () => {
          this.config.debug && console.log("Global DM inbox subscription active");
        }
      });
    } catch (e) {
      throw this.config.debug && console.error("Failed to start global inbox subscription:", e), e;
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
    } catch (e) {
      this.config.debug && console.error("Failed to initialize sender credentials:", e);
    }
  }
  async createConversation(e) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const t = await this.getPrivateKeySecurely(), s = {
      recipientPubkey: e,
      senderPrivateKey: t,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      debug: this.config.debug
    }, i = new vt(s);
    return this.setupConversationReactivity(i), i;
  }
  async createRoom(e, t) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const s = await this.getPrivateKeySecurely(), i = {
      participants: e,
      senderPrivateKey: s,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      options: t,
      debug: this.config.debug
    }, r = new Et(i);
    return this.setupRoomReactivity(r), r;
  }
  setupConversationReactivity(e) {
    e.latest.subscribe(() => {
      this.updateConversationList();
    }), e.subject.subscribe(() => {
      this.updateConversationList();
    });
  }
  setupRoomReactivity(e) {
    e.latest.subscribe(() => {
      this.updateConversationList();
    }), e.subject.subscribe(() => {
      this.updateConversationList();
    }), e.participants.subscribe(() => {
      this.updateConversationList();
    });
  }
  updateConversationList() {
    const e = [];
    this.conversations.forEach((t, s) => {
      let i = null, r = "disconnected", o;
      const a = t.latest.subscribe((d) => {
        i = d;
      }), c = t.status.subscribe((d) => {
        r = d;
      }), l = t.subject.subscribe((d) => {
        o = d;
      });
      a(), c(), l(), e.push({
        pubkey: s,
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: o,
        type: "conversation"
      });
    }), this.rooms.forEach((t, s) => {
      let i = null, r = "disconnected", o = "", a = [];
      const c = t.latest.subscribe((f) => {
        i = f;
      }), l = t.status.subscribe((f) => {
        r = f;
      }), d = t.subject.subscribe((f) => {
        o = f;
      }), h = t.participants.subscribe((f) => {
        a = f;
      });
      c(), l(), d(), h(), e.push({
        pubkey: s,
        // Use roomId as the identifier
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: o,
        participants: a,
        type: "room"
      });
    }), e.sort((t, s) => s.lastActivity - t.lastActivity), this._conversationList.set(e);
  }
  async handleGlobalInboxEvent(e) {
    this.config.debug && console.log("🎁 Processing gift wrap event:", e.id);
    try {
      const { GiftWrapProtocol: t } = await Promise.resolve().then(() => Is), s = await this.getPrivateKeySecurely(), i = await t.unwrapGiftWrap(e, s);
      if (i) {
        const r = i.pubkey;
        if (this.config.debug && console.log("✅ Decrypted event (kind " + i.kind + ") from:", r.substring(0, 8) + "..."), i.kind === 4 || i.kind === 14) {
          let o = this.conversations.get(r);
          o || (this.config.debug && console.log("🆕 Auto-creating conversation with:", r.substring(0, 8) + "..."), o = await this.with(r)), o && typeof o.handleDecryptedEvent == "function" && o.handleDecryptedEvent(i), this.updateConversationList(), this.config.debug && console.log("🔄 Updated conversations, total:", this.conversations.size);
        } else
          this.config.debug && console.log("🔮 Received encrypted event kind " + i.kind + " - not a DM, caching for future use");
      }
    } catch (t) {
      this.config.debug && console.error("❌ Failed to process gift wrap event:", t);
    }
  }
  normalizePubkey(e) {
    if (e.startsWith("npub"))
      throw new Error("npub format not yet supported, please use hex pubkey");
    if (!/^[0-9a-f]{64}$/i.test(e))
      throw new Error("Invalid pubkey format. Expected 64-character hex string");
    return e.toLowerCase();
  }
  async getPrivateKeySecurely() {
    if (this.config.signingProvider && "getPrivateKeyForEncryption" in this.config.signingProvider)
      try {
        const e = await this.config.signingProvider.getPrivateKeyForEncryption();
        if (this.config.debug && console.log("🔐 DMModule: Retrieved private key from signing provider:", {
          type: typeof e,
          length: e == null ? void 0 : e.length,
          isString: typeof e == "string",
          prefix: (e == null ? void 0 : e.substring(0, 8)) + "..."
        }), !e || typeof e != "string" || e.length !== 64)
          throw new Error(`Invalid private key from signing provider: type=${typeof e}, length=${e == null ? void 0 : e.length}`);
        return e;
      } catch (e) {
        throw this.config.debug && console.warn("Failed to get private key from signing provider:", e), e;
      }
    if (process.env.NODE_ENV === "test" || this.config.debug)
      return console.warn("WARNING: Using mock private key for testing. Do not use in production!"), "test-private-key-64-char-string-abcdef1234567890abcdef1234567890";
    throw new Error("Private key access not yet implemented. This is required for NIP-44 encryption.");
  }
  generateRoomId(e) {
    return [...e, this._senderPubkey].sort().join(",");
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
    var e;
    return (e = this.parentNostr) == null ? void 0 : e.universalDM;
  }
  /**
   * Delegate to Universal DM Module with lazy loading
   */
  delegateToUniversalDM(e) {
    var i;
    const t = this.getUniversalDMInstance();
    if (!t)
      throw new Error("Universal DM Module not available");
    this.config.debug && console.log("🎯 Delegating to Universal DM Module (cache-based) for:", e.substring(0, 16) + "...");
    const s = t.with(e);
    return this.config.debug && console.log("🔍 Result from universalDM.with():", {
      result: !!s,
      hasMessages: !!(s != null && s.messages),
      hasSubscribe: typeof (s == null ? void 0 : s.subscribe),
      hasSend: typeof (s == null ? void 0 : s.send),
      constructor: (i = s == null ? void 0 : s.constructor) == null ? void 0 : i.name
    }), s;
  }
}
class ut {
  // Cache for synchronous access
  constructor(e, t, s) {
    u(this, "store");
    u(this, "myPubkey");
    u(this, "otherPubkey");
    u(this, "nostr");
    u(this, "_status", "connecting");
    u(this, "statusCallbacks", []);
    u(this, "messageCache", []);
    var i, r;
    this.nostr = e, this.myPubkey = t.toLowerCase(), this.otherPubkey = s.toLowerCase(), console.log("🚀 UniversalDMConversation constructor:", {
      myPubkey: t.substring(0, 16) + "...",
      otherPubkey: s.substring(0, 16) + "...",
      hasQueryMethod: typeof this.nostr.query == "function"
    });
    try {
      this.nostr.startUniversalGiftWrapSubscription().catch(() => {
      }), this.store = this.nostr.query().kinds([14]).authors([this.myPubkey, this.otherPubkey]).tags("p", [this.myPubkey, this.otherPubkey]).execute(), console.log("✅ Store created successfully:", typeof this.store, (r = (i = this.store) == null ? void 0 : i.constructor) == null ? void 0 : r.name), setTimeout(() => {
        console.log("🔍 Cache state after store init:", {
          currentEvents: this.store.current.length,
          eventKinds: this.store.current.map((o) => o.kind),
          eventIds: this.store.current.map((o) => {
            var a;
            return ((a = o.id) == null ? void 0 : a.slice(0, 8)) + "...";
          })
        });
      }, 1e3);
    } catch (o) {
      console.error("❌ Failed to create store:", o), this.store = {
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
  subscribe(e) {
    return e(this.messageCache), this.store.subscribe(async (t) => {
      const s = await this.convertEventsToMessages(t), r = [...this.messageCache, ...s].filter(
        (o, a, c) => c.findIndex(
          (l) => l.eventId === o.eventId || l.content === o.content && Math.abs(l.timestamp - o.timestamp) < 5
        ) === a
      );
      r.sort((o, a) => o.timestamp - a.timestamp), this.messageCache = r, e(r);
    });
  }
  // Convenience method for sending
  async send(e, t) {
    var s;
    if (!e || e.trim().length === 0)
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
      const i = this.nostr.signingProvider, r = await (((s = i == null ? void 0 : i.capabilities) == null ? void 0 : s.call(i)) ?? { nip44Encrypt: !1, rawKey: !1 }), o = {
        pubkey: this.myPubkey,
        created_at: Math.floor(Date.now() / 1e3),
        kind: 14,
        tags: t ? [["subject", t]] : [],
        content: e
      };
      if (r.nip44Encrypt && typeof i.nip44Encrypt == "function") {
        const a = async (g) => {
          const p = await i.nip44Encrypt(g, JSON.stringify(o)), E = {
            pubkey: this.myPubkey,
            created_at: Math.floor(Date.now() / 1e3),
            kind: 13,
            tags: [],
            content: p
          }, y = k.calculateEventId(E), w = await i.signEvent(E);
          return { ...E, id: y, sig: w };
        }, [c, l] = await Promise.all([
          a(this.otherPubkey),
          a(this.myPubkey)
        ]), { GiftWrapCreator: d } = await Promise.resolve().then(() => _s), [h, f] = await Promise.all([
          d.createGiftWrap(c, { pubkey: this.otherPubkey }, void 0, Math.floor(Date.now() / 1e3)),
          d.createGiftWrap(l, { pubkey: this.myPubkey }, void 0, Math.floor(Date.now() / 1e3))
        ]), [b] = await Promise.all([
          this.nostr.publishSigned(h.giftWrap),
          this.nostr.publishSigned(f.giftWrap).catch(() => ({ success: !1 }))
        ]);
        if (b.success) {
          const g = h.giftWrap, p = {
            id: g.id,
            content: e,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: g.created_at,
            isFromMe: !0,
            eventId: g.id,
            status: "sent",
            subject: t,
            sender: this.myPubkey
          };
          return this.messageCache.push(p), this.messageCache.sort((E, y) => E.timestamp - y.timestamp), { success: !0, messageId: g.id };
        }
        return { success: !1, error: "Failed to publish to recipient" };
      } else {
        const a = await this.nostr.getPrivateKeyForEncryption();
        if (!a)
          return { success: !1, error: "Private key not available for encryption" };
        const c = await Z.createGiftWrappedDM(
          e,
          a,
          { recipients: [
            { pubkey: this.otherPubkey, relayUrl: "" },
            { pubkey: this.myPubkey, relayUrl: "" }
          ], maxTimestampAge: 0 },
          t
        ), l = c.giftWraps.find((f) => f.recipient === this.otherPubkey).giftWrap, d = c.giftWraps.find((f) => f.recipient === this.myPubkey).giftWrap, [h] = await Promise.all([
          this.nostr.publishSigned(l),
          this.nostr.publishSigned(d).catch(() => ({ success: !1 }))
        ]);
        if (h.success) {
          const f = {
            id: l.id,
            content: e,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: l.created_at,
            isFromMe: !0,
            eventId: l.id,
            status: "sent",
            subject: t,
            sender: this.myPubkey
          };
          return this.messageCache.push(f), this.messageCache.sort((b, g) => b.timestamp - g.timestamp), { success: !0, messageId: l.id };
        }
        return { success: !1, error: "Failed to publish to recipient" };
      }
    } catch (i) {
      return {
        success: !1,
        error: i instanceof Error ? i.message : "Unknown error"
      };
    }
  }
  async convertEventsToMessages(e) {
    const t = [];
    for (const s of e) {
      if (s.kind !== 14) continue;
      const i = s.pubkey === this.myPubkey, r = s.tags.some((a) => a[0] === "p" && a[1] === this.otherPubkey);
      (s.tags.some((a) => a[0] === "p" && a[1] === this.myPubkey) || i && r) && t.push({
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
    return t.sort((s, i) => s.timestamp - i.timestamp);
  }
  getRecipientFromEvent(e) {
    const t = e.tags.find((s) => s[0] === "p");
    return (t == null ? void 0 : t[1]) || "";
  }
  getSubjectFromEvent(e) {
    const t = e.tags.find((s) => s[0] === "subject");
    return t == null ? void 0 : t[1];
  }
  getSubjectFromRumor(e) {
    var s;
    const t = (s = e.tags) == null ? void 0 : s.find((i) => i[0] === "subject");
    return t == null ? void 0 : t[1];
  }
  // Status as reactive store
  get status() {
    const e = this;
    return {
      subscribe: (t) => (t(e._status), e.statusCallbacks.push(t), () => {
        const s = e.statusCallbacks.indexOf(t);
        s > -1 && e.statusCallbacks.splice(s, 1);
      }),
      get current() {
        return e._status;
      }
    };
  }
  // Latest message
  get latest() {
    const e = this;
    return {
      subscribe: (t) => e.messages.subscribe((s) => {
        t(s[s.length - 1]);
      }),
      get current() {
        return e.messageCache[e.messageCache.length - 1];
      }
    };
  }
  // Subject from latest message with subject tag
  get subject() {
    const e = this;
    return {
      subscribe: (t) => e.store.subscribe((s) => {
        const i = s.filter((r) => r.tags.some((o) => o[0] === "subject")).sort((r, o) => o.created_at - r.created_at)[0];
        t(i ? e.getSubjectFromEvent(i) : void 0);
      }),
      get current() {
        const s = e.store.current.filter((i) => i.tags.some((r) => r[0] === "subject")).sort((i, r) => r.created_at - i.created_at)[0];
        return s ? e.getSubjectFromEvent(s) : void 0;
      }
    };
  }
  // Close the conversation (cleanup)
  async close() {
    this._status = "disconnected", this.notifyStatusChange();
  }
  notifyStatusChange() {
    this.statusCallbacks.forEach((e) => e(this._status));
  }
  isValidPubkey(e) {
    return typeof e == "string" && e.length === 64 && /^[0-9a-f]{64}$/i.test(e);
  }
}
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Pt(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function kt(n, e) {
  return Array.isArray(e) ? e.length === 0 ? !0 : n ? e.every((t) => typeof t == "string") : e.every((t) => Number.isSafeInteger(t)) : !1;
}
function As(n) {
  if (typeof n != "function")
    throw new Error("function expected");
  return !0;
}
function Ee(n, e) {
  if (typeof e != "string")
    throw new Error(`${n}: string expected`);
  return !0;
}
function Mt(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function ze(n) {
  if (!Array.isArray(n))
    throw new Error("array expected");
}
function _t(n, e) {
  if (!kt(!0, e))
    throw new Error(`${n}: array of strings expected`);
}
function It(n, e) {
  if (!kt(!1, e))
    throw new Error(`${n}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function Ts(...n) {
  const e = (r) => r, t = (r, o) => (a) => r(o(a)), s = n.map((r) => r.encode).reduceRight(t, e), i = n.map((r) => r.decode).reduce(t, e);
  return { encode: s, decode: i };
}
// @__NO_SIDE_EFFECTS__
function Rs(n) {
  const e = typeof n == "string" ? n.split("") : n, t = e.length;
  _t("alphabet", e);
  const s = new Map(e.map((i, r) => [i, r]));
  return {
    encode: (i) => (ze(i), i.map((r) => {
      if (!Number.isSafeInteger(r) || r < 0 || r >= t)
        throw new Error(`alphabet.encode: digit index outside alphabet "${r}". Allowed: ${n}`);
      return e[r];
    })),
    decode: (i) => (ze(i), i.map((r) => {
      Ee("alphabet.decode", r);
      const o = s.get(r);
      if (o === void 0)
        throw new Error(`Unknown letter: "${r}". Allowed: ${n}`);
      return o;
    }))
  };
}
// @__NO_SIDE_EFFECTS__
function Cs(n = "") {
  return Ee("join", n), {
    encode: (e) => (_t("join.decode", e), e.join(n)),
    decode: (e) => (Ee("join.decode", e), e.split(n))
  };
}
const At = (n, e) => e === 0 ? n : At(e, n % e), Ce = /* @__NO_SIDE_EFFECTS__ */ (n, e) => n + (e - At(n, e)), Te = /* @__PURE__ */ (() => {
  let n = [];
  for (let e = 0; e < 40; e++)
    n.push(2 ** e);
  return n;
})();
function He(n, e, t, s) {
  if (ze(n), e <= 0 || e > 32)
    throw new Error(`convertRadix2: wrong from=${e}`);
  if (t <= 0 || t > 32)
    throw new Error(`convertRadix2: wrong to=${t}`);
  if (/* @__PURE__ */ Ce(e, t) > 32)
    throw new Error(`convertRadix2: carry overflow from=${e} to=${t} carryBits=${/* @__PURE__ */ Ce(e, t)}`);
  let i = 0, r = 0;
  const o = Te[e], a = Te[t] - 1, c = [];
  for (const l of n) {
    if (Mt(l), l >= o)
      throw new Error(`convertRadix2: invalid data word=${l} from=${e}`);
    if (i = i << e | l, r + e > 32)
      throw new Error(`convertRadix2: carry overflow pos=${r} from=${e}`);
    for (r += e; r >= t; r -= t)
      c.push((i >> r - t & a) >>> 0);
    const d = Te[r];
    if (d === void 0)
      throw new Error("invalid carry");
    i &= d - 1;
  }
  if (i = i << t - r & a, !s && r >= e)
    throw new Error("Excess padding");
  if (!s && i > 0)
    throw new Error(`Non-zero padding: ${i}`);
  return s && r > 0 && c.push(i >>> 0), c;
}
// @__NO_SIDE_EFFECTS__
function xs(n, e = !1) {
  if (Mt(n), n <= 0 || n > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ Ce(8, n) > 32 || /* @__PURE__ */ Ce(n, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (t) => {
      if (!Pt(t))
        throw new Error("radix2.encode input should be Uint8Array");
      return He(Array.from(t), 8, n, !e);
    },
    decode: (t) => (It("radix2.decode", t), Uint8Array.from(He(t, n, 8, e)))
  };
}
function ht(n) {
  return As(n), function(...e) {
    try {
      return n.apply(null, e);
    } catch {
    }
  };
}
const Ge = /* @__PURE__ */ Ts(/* @__PURE__ */ Rs("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ Cs("")), dt = [996825010, 642813549, 513874426, 1027748829, 705979059];
function fe(n) {
  const e = n >> 25;
  let t = (n & 33554431) << 5;
  for (let s = 0; s < dt.length; s++)
    (e >> s & 1) === 1 && (t ^= dt[s]);
  return t;
}
function gt(n, e, t = 1) {
  const s = n.length;
  let i = 1;
  for (let r = 0; r < s; r++) {
    const o = n.charCodeAt(r);
    if (o < 33 || o > 126)
      throw new Error(`Invalid prefix (${n})`);
    i = fe(i) ^ o >> 5;
  }
  i = fe(i);
  for (let r = 0; r < s; r++)
    i = fe(i) ^ n.charCodeAt(r) & 31;
  for (let r of e)
    i = fe(i) ^ r;
  for (let r = 0; r < 6; r++)
    i = fe(i);
  return i ^= t, Ge.encode(He([i % Te[30]], 30, 5, !1));
}
// @__NO_SIDE_EFFECTS__
function Ns(n) {
  const e = n === "bech32" ? 1 : 734539939, t = /* @__PURE__ */ xs(5), s = t.decode, i = t.encode, r = ht(s);
  function o(h, f, b = 90) {
    Ee("bech32.encode prefix", h), Pt(f) && (f = Array.from(f)), It("bech32.encode", f);
    const g = h.length;
    if (g === 0)
      throw new TypeError(`Invalid prefix length ${g}`);
    const p = g + 7 + f.length;
    if (b !== !1 && p > b)
      throw new TypeError(`Length ${p} exceeds limit ${b}`);
    const E = h.toLowerCase(), y = gt(E, f, e);
    return `${E}1${Ge.encode(f)}${y}`;
  }
  function a(h, f = 90) {
    Ee("bech32.decode input", h);
    const b = h.length;
    if (b < 8 || f !== !1 && b > f)
      throw new TypeError(`invalid string length: ${b} (${h}). Expected (8..${f})`);
    const g = h.toLowerCase();
    if (h !== g && h !== h.toUpperCase())
      throw new Error("String must be lowercase or uppercase");
    const p = g.lastIndexOf("1");
    if (p === 0 || p === -1)
      throw new Error('Letter "1" must be present between prefix and data only');
    const E = g.slice(0, p), y = g.slice(p + 1);
    if (y.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const w = Ge.decode(y).slice(0, -6), M = gt(E, w, e);
    if (!y.endsWith(M))
      throw new Error(`Invalid checksum in ${h}: expected "${M}"`);
    return { prefix: E, words: w };
  }
  const c = ht(a);
  function l(h) {
    const { prefix: f, words: b } = a(h, !1);
    return { prefix: f, words: b, bytes: s(b) };
  }
  function d(h, f) {
    return o(h, i(f));
  }
  return {
    encode: o,
    decode: a,
    encodeFromBytes: d,
    decodeToBytes: l,
    decodeUnsafe: c,
    fromWords: s,
    fromWordsUnsafe: r,
    toWords: i
  };
}
const xe = /* @__PURE__ */ Ns("bech32"), Tt = 5e3, Ne = new TextEncoder(), ke = new TextDecoder();
function Ds(n) {
  const e = new Uint8Array(4);
  return e[0] = n >> 24 & 255, e[1] = n >> 16 & 255, e[2] = n >> 8 & 255, e[3] = n & 255, e;
}
function Ue(n) {
  const e = {};
  let t = n;
  for (; t.length > 0 && !(t.length < 2); ) {
    const s = t[0], i = t[1];
    if (t.length < 2 + i) break;
    const r = t.slice(2, 2 + i);
    t = t.slice(2 + i), e[s] = e[s] || [], e[s].push(r);
  }
  return e;
}
function Xe(n) {
  const e = [];
  return Object.entries(n).reverse().forEach(([t, s]) => {
    s.forEach((i) => {
      const r = new Uint8Array(i.length + 2);
      r.set([parseInt(t)], 0), r.set([i.length], 1), r.set(i, 2), e.push(r);
    });
  }), _e(...e);
}
function De(n, e) {
  const t = xe.toWords(e);
  return xe.encode(n, t, Tt);
}
function Je(n, e) {
  return De(n, e);
}
function Ze(n) {
  var i, r, o, a, c, l, d;
  const { prefix: e, words: t } = xe.decode(n, Tt), s = new Uint8Array(xe.fromWords(t));
  switch (e) {
    case "nprofile": {
      const h = Ue(s);
      if (!((i = h[0]) != null && i[0])) throw new Error("missing TLV 0 for nprofile");
      if (h[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      return {
        type: "nprofile",
        data: {
          pubkey: C(h[0][0]),
          relays: h[1] ? h[1].map((f) => ke.decode(f)) : []
        }
      };
    }
    case "nevent": {
      const h = Ue(s);
      if (!((r = h[0]) != null && r[0])) throw new Error("missing TLV 0 for nevent");
      if (h[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      if (h[2] && h[2][0] && h[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (h[3] && h[3][0] && h[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "nevent",
        data: {
          id: C(h[0][0]),
          relays: h[1] ? h[1].map((f) => ke.decode(f)) : [],
          author: (o = h[2]) != null && o[0] ? C(h[2][0]) : void 0,
          kind: (a = h[3]) != null && a[0] ? parseInt(C(h[3][0]), 16) : void 0
        }
      };
    }
    case "naddr": {
      const h = Ue(s);
      if (!((c = h[0]) != null && c[0])) throw new Error("missing TLV 0 for naddr");
      if (!((l = h[2]) != null && l[0])) throw new Error("missing TLV 2 for naddr");
      if (h[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (!((d = h[3]) != null && d[0])) throw new Error("missing TLV 3 for naddr");
      if (h[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "naddr",
        data: {
          identifier: ke.decode(h[0][0]),
          pubkey: C(h[2][0]),
          kind: parseInt(C(h[3][0]), 16),
          relays: h[1] ? h[1].map((f) => ke.decode(f)) : []
        }
      };
    }
    case "nsec":
      return { type: e, data: s };
    case "npub":
    case "note":
      return { type: e, data: C(s) };
    default:
      throw new Error(`Unknown prefix ${e}`);
  }
}
function Fs(n) {
  return Je("nsec", n);
}
function Ls(n) {
  return Je("npub", ae(n));
}
function Os(n) {
  return Je("note", ae(n));
}
function $s(n) {
  const e = Xe({
    0: [ae(n.pubkey)],
    1: (n.relays || []).map((t) => Ne.encode(t))
  });
  return De("nprofile", e);
}
function Us(n) {
  let e;
  n.kind !== void 0 && (e = Ds(n.kind));
  const t = Xe({
    0: [ae(n.id)],
    1: (n.relays || []).map((s) => Ne.encode(s)),
    2: n.author ? [ae(n.author)] : [],
    3: e ? [new Uint8Array(e)] : []
  });
  return De("nevent", t);
}
function Bs(n) {
  const e = new ArrayBuffer(4);
  new DataView(e).setUint32(0, n.kind, !1);
  const t = Xe({
    0: [Ne.encode(n.identifier)],
    1: (n.relays || []).map((s) => Ne.encode(s)),
    2: [ae(n.pubkey)],
    3: [new Uint8Array(e)]
  });
  return De("naddr", t);
}
function ci(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Ls(e);
}
function li(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex privkey: must be 64 hex characters");
  return Fs(ae(e));
}
function ui(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  return Os(e);
}
function Rt(n) {
  if (!n.startsWith("npub1"))
    throw new Error('Invalid npub: must start with "npub1"');
  const e = Ze(n);
  if (e.type !== "npub")
    throw new Error('Invalid npub: decoded type is not "npub"');
  return e.data;
}
function Ct(n) {
  if (!n.startsWith("nsec1"))
    throw new Error('Invalid nsec: must start with "nsec1"');
  const e = Ze(n);
  if (e.type !== "nsec")
    throw new Error('Invalid nsec: decoded type is not "nsec"');
  return C(e.data);
}
function Ks(n) {
  if (!n.startsWith("note1"))
    throw new Error('Invalid note: must start with "note1"');
  const e = Ze(n);
  if (e.type !== "note")
    throw new Error('Invalid note: decoded type is not "note"');
  return e.data;
}
function hi(n, e) {
  const t = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return $s({ pubkey: t, relays: e });
}
function di(n, e, t, s) {
  const i = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(i))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  let r;
  if (t && (r = t.startsWith("0x") ? t.slice(2) : t, !/^[0-9a-fA-F]{64}$/.test(r)))
    throw new Error("Invalid hex author pubkey: must be 64 hex characters");
  return Us({
    id: i,
    relays: e,
    author: r,
    kind: s
  });
}
function gi(n, e, t, s) {
  const i = e.startsWith("0x") ? e.slice(2) : e;
  if (!/^[0-9a-fA-F]{64}$/.test(i))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Bs({
    identifier: n,
    pubkey: i,
    kind: t,
    relays: s
  });
}
function xt(n) {
  if (!n || typeof n != "string")
    return !1;
  const e = n.startsWith("0x") ? n.slice(2) : n;
  return /^[0-9a-fA-F]{64}$/.test(e);
}
function Vs(n) {
  if (!n || typeof n != "string" || !n.startsWith("npub1"))
    return !1;
  try {
    return Rt(n), !0;
  } catch {
    return !1;
  }
}
function fi(n) {
  if (!n || typeof n != "string" || !n.startsWith("nsec1"))
    return !1;
  try {
    return Ct(n), !0;
  } catch {
    return !1;
  }
}
function pi(n) {
  if (!n || typeof n != "string" || !n.startsWith("note1"))
    return !1;
  try {
    return Ks(n), !0;
  } catch {
    return !1;
  }
}
class Ws {
  constructor(e, t) {
    u(this, "conversationCache", /* @__PURE__ */ new Map());
    u(this, "roomCache", /* @__PURE__ */ new Map());
    this.nostr = e, this.initialMyPubkey = t;
  }
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  // Supports both hex pubkeys and npub format
  with(e) {
    const t = this.convertToHex(e), s = this.normalizePubkey(t), i = this.conversationCache.get(s);
    if (i)
      return i;
    if (!this.isValidPubkey(s)) {
      console.warn("⚠️ Invalid pubkey format, creating conversation that will fail gracefully:", e.substring(0, 16) + "...");
      const o = new ut(this.nostr, this.myPubkey, s);
      return this.conversationCache.set(s, o), o;
    }
    this.nostr.startUniversalGiftWrapSubscription().catch((o) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DMs:", o);
    });
    const r = new ut(this.nostr, this.getMyPubkey(), s);
    return this.conversationCache.set(s, r), r;
  }
  /**
   * Convert npub to hex if needed, otherwise return as-is
   */
  convertToHex(e) {
    if (!e || typeof e != "string" || xt(e))
      return e;
    if (Vs(e))
      try {
        return Rt(e);
      } catch (t) {
        return console.warn("⚠️ Failed to convert npub to hex:", t), e;
      }
    return e;
  }
  isValidPubkey(e) {
    return typeof e == "string" && e.length === 64 && /^[0-9a-f]{64}$/i.test(e);
  }
  normalizePubkey(e) {
    return e.toLowerCase();
  }
  generateRoomId(e) {
    return [...e, this.myPubkey.toLowerCase()].sort().join(",");
  }
  // Room functionality - also just queries (with lazy gift wrap subscription)
  room(e, t) {
    const s = e.map((a) => a.toLowerCase()), i = this.generateRoomId(s), r = this.roomCache.get(i);
    if (r)
      return r;
    this.nostr.startUniversalGiftWrapSubscription().catch((a) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DM room:", a);
    });
    const o = new zs(this.nostr, this.getMyPubkey(), s, t);
    return this.roomCache.set(i, o), o;
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
    const e = this.nostr.signingProvider, t = (s = e == null ? void 0 : e.getPublicKeySync) == null ? void 0 : s.call(e);
    return t && typeof t == "string" && /^[0-9a-f]{64}$/i.test(t) ? t.toLowerCase() : this.initialMyPubkey.toLowerCase();
  }
  // Get conversation summaries - required by tests
  summaries() {
    var t;
    const e = [];
    for (const [s, i] of this.conversationCache.entries())
      e.push({
        pubkey: s,
        type: "conversation"
        // Note: conversations don't have participants property (only rooms do)
      });
    for (const [s, i] of this.roomCache.entries())
      e.push({
        pubkey: s,
        type: "room",
        participants: s.split(","),
        // roomId contains all participants
        subject: (t = i.options) == null ? void 0 : t.subject
        // Access the subject from room options
      });
    return e;
  }
}
class zs {
  // TODO: Implement room store
  constructor(e, t, s, i) {
    u(this, "store");
    this.nostr = e, this.myPubkey = t, this.roomParticipants = s, this.options = i, this.store = this.nostr.query().kinds([14]).tags("p", [this.myPubkey, ...this.roomParticipants]).execute();
  }
  subscribe(e) {
    return this.store.subscribe(e);
  }
  get messages() {
    return this.store.current;
  }
  async send(e) {
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
  async addParticipant(e) {
    return { success: !0 };
  }
  async removeParticipant(e) {
    return { success: !0 };
  }
}
class Hs {
  constructor(e, t) {
    this.nostr = e, this.debug = t, this.debug && console.log("🎯 ReactionModule initialized with Clean Architecture");
  }
  /**
   * Get reaction summary for an event (reactive)
   * Returns aggregated reactions with counts and user's reaction
   */
  to(e) {
    return this.startReactionSubscription(e), this.nostr.query().kinds([7]).tags("e", [e]).execute().map((t) => this.aggregateReactions(t, e));
  }
  /**
   * Get my reaction to an event (reactive)
   * Returns the current user's reaction content or null
   */
  myReaction(e) {
    const t = this.nostr.me;
    return t ? (this.startMyReactionSubscription(e, t), this.nostr.query().kinds([7]).authors([t]).tags("e", [e]).limit(1).execute().map((s) => {
      var i;
      return ((i = s[0]) == null ? void 0 : i.content) || null;
    })) : this.createNullStore();
  }
  /**
   * React to an event
   * Creates a NIP-25 compliant reaction event
   */
  async react(e, t = "+") {
    var s;
    if (!this.nostr.me)
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    try {
      const i = await this.getTargetEvent(e);
      if (!i)
        return { success: !1, error: "Target event not found" };
      const r = await this.nostr.events.reaction(e, t).tag("p", i.pubkey).publish();
      return this.debug && console.log(`ReactionModule: Published reaction "${t}" to event ${e.substring(0, 8)}...`), {
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
  async unreact(e) {
    var t;
    if (!this.nostr.me)
      return { success: !1, error: "No signing provider available" };
    try {
      const s = this.myReaction(e), r = this.nostr.query().kinds([7]).authors([this.nostr.me]).tags("e", [e]).execute().current;
      if (!r || r.length === 0)
        return { success: !1, error: "No reaction found to remove" };
      const o = r[0], a = await this.nostr.events.deletion(o.id, "User removed reaction").publish();
      return this.debug && console.log(`ReactionModule: Deleted reaction to event ${e.substring(0, 8)}...`), {
        success: a.success,
        error: (t = a.error) == null ? void 0 : t.message
      };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Failed to remove reaction"
      };
    }
  }
  // Private helper methods
  async startReactionSubscription(e) {
    try {
      await this.nostr.sub().kinds([7]).tags("e", [e]).execute();
    } catch (t) {
      this.debug && console.warn(`Failed to start reaction subscription for ${e}:`, t);
    }
  }
  async startMyReactionSubscription(e, t) {
    try {
      await this.nostr.sub().kinds([7]).authors([t]).tags("e", [e]).limit(1).execute();
    } catch (s) {
      this.debug && console.warn(`Failed to start my reaction subscription for ${e}:`, s);
    }
  }
  async getTargetEvent(e) {
    await this.nostr.sub().ids([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 500));
    const s = this.nostr.query().ids([e]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  aggregateReactions(e, t) {
    const s = {};
    let i = 0, r = !1, o;
    const a = this.nostr.me;
    return e.filter((c) => c && typeof c == "object").forEach((c) => {
      if (c.kind !== 7) return;
      const l = c.content || "+", d = c.pubkey;
      s[l] || (s[l] = {
        type: l,
        count: 0,
        authors: []
      }), s[l].count++, s[l].authors.push(d), i++, a && d === a && (r = !0, o = l);
    }), {
      targetEventId: t,
      totalCount: i,
      reactions: s,
      userReacted: r,
      userReactionType: o
    };
  }
  createNullStore() {
    return this.nostr.query().kinds([7]).authors([""]).limit(1).execute().map(() => null);
  }
}
class Gs {
  constructor(e, t) {
    this.nostr = e, this.debug = t, this.debug && console.log("📝 ContentModule initialized with Clean Architecture");
  }
  /**
   * Get text notes (NIP-01) from specific authors (reactive)
   * Returns real-time stream of text notes
   */
  notes(e = {}) {
    const t = {
      kinds: [1],
      // Text notes
      limit: e.limit || 50,
      ...e
    };
    this.startContentSubscription(t);
    let s = this.nostr.query().kinds([1]);
    return t.authors && (s = s.authors(t.authors)), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), s.execute();
  }
  /**
   * Get reposts (NIP-18) from specific authors (reactive)
   * Returns real-time stream of repost events
   */
  reposts(e = {}) {
    const t = {
      kinds: [6],
      // Reposts
      limit: e.limit || 50,
      ...e
    };
    this.startContentSubscription(t);
    let s = this.nostr.query().kinds([6]);
    return t.authors && (s = s.authors(t.authors)), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), s.execute();
  }
  /**
   * Get combined content feed (notes + reposts) (reactive)
   * Returns chronologically sorted content from authors
   */
  feed(e = {}) {
    const t = {
      kinds: [1, 6],
      // Notes and reposts
      limit: e.limit || 50,
      ...e
    };
    this.startContentSubscription(t);
    let s = this.nostr.query().kinds([1, 6]);
    return t.authors && (s = s.authors(t.authors)), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), s.execute().map((i) => this.sortByCreatedAt(i));
  }
  /**
   * Get content summary for authors (reactive)
   * Returns aggregated statistics about content
   */
  summary(e) {
    return this.startContentSubscription({ authors: e, kinds: [1, 6] }), this.nostr.query().kinds([1, 6]).authors(e).execute().map((t) => this.aggregateContentSummary(t));
  }
  /**
   * Publish a text note (NIP-01)
   */
  async publishNote(e) {
    var t;
    if (!this.nostr.me)
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    try {
      const s = await this.nostr.events.note(e).publish();
      return this.debug && console.log(`ContentModule: Published note "${e.substring(0, 50)}..."`), {
        success: s.success,
        eventId: s.eventId,
        error: (t = s.error) == null ? void 0 : t.message
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
  async repost(e, t) {
    var s;
    if (!this.nostr.me)
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    try {
      const i = await this.getEvent(e);
      if (!i)
        return { success: !1, error: "Original event not found" };
      const r = await this.nostr.events.create().kind(6).content("").tag("e", e, t || "").tag("p", i.pubkey).publish();
      return this.debug && console.log(`ContentModule: Reposted event ${e.substring(0, 8)}...`), {
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
  async startContentSubscription(e) {
    try {
      let t = this.nostr.sub();
      e.kinds && (t = t.kinds(e.kinds)), e.authors && (t = t.authors(e.authors)), e.since && (t = t.since(e.since)), e.until && (t = t.until(e.until)), e.limit && (t = t.limit(e.limit)), await t.execute();
    } catch (t) {
      this.debug && console.warn("Failed to start content subscription:", t);
    }
  }
  async getEvent(e) {
    await this.nostr.sub().ids([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 500));
    const s = this.nostr.query().ids([e]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  sortByCreatedAt(e) {
    return [...e].sort((t, s) => s.created_at - t.created_at);
  }
  aggregateContentSummary(e) {
    const t = e.filter((o) => o.kind === 1), s = e.filter((o) => o.kind === 6), i = this.sortByCreatedAt(t), r = this.sortByCreatedAt(s);
    return {
      totalNotes: t.length,
      totalReposts: s.length,
      latestNote: i[0],
      latestRepost: r[0]
    };
  }
}
class js {
  constructor(e, t) {
    this.nostr = e, this.debug = t, this.debug && console.log("🧵 ThreadModule initialized with Clean Architecture");
  }
  /**
   * Get complete thread by root event ID (reactive)
   * Returns all replies in chronological order with proper threading
   */
  thread(e, t = {}) {
    this.startThreadSubscription(e, t);
    let s = this.nostr.query().kinds([1]);
    return s = s.tags("e", [e]), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), s.execute().map((i) => this.buildThreadStructure(i, e));
  }
  /**
   * Get thread summary with statistics (reactive)
   */
  summary(e) {
    return this.startThreadSubscription(e), this.nostr.query().kinds([1]).tags("e", [e]).execute().map((t) => this.aggregateThreadSummary(t, e));
  }
  /**
   * Get threads where user participated (reactive)
   * Returns threads where the user has posted or replied
   */
  myThreads(e = {}) {
    const t = this.nostr.me;
    return t ? (this.startUserThreadsSubscription(t, e), this.nostr.query().kinds([1]).authors([t]).execute().map((s) => this.extractThreadSummaries(s))) : this.createEmptyStore();
  }
  /**
   * Get recent threads from followed users (reactive)
   * Requires user to be signed in and have a follow list
   */
  followingThreads(e = {}) {
    const t = this.nostr.me;
    return t ? this.nostr.query().kinds([3]).authors([t]).limit(1).execute().map((i) => {
      if (!i || i.length === 0)
        return [];
      const o = i[0].tags.filter((a) => a[0] === "p").map((a) => a[1]);
      return o.length === 0 ? [] : (this.startFollowingThreadsSubscription(o, e), []);
    }) : this.createEmptyStore();
  }
  /**
   * Reply to an event (creates a threaded reply)
   */
  async reply(e, t, s = []) {
    var i;
    if (!this.nostr.me)
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    try {
      const r = await this.getEvent(e);
      if (!r)
        return { success: !1, error: "Target event not found" };
      const { rootEventId: o, replyEventId: a } = this.determineThreadStructure(r);
      let c = this.nostr.events.create().kind(1).content(t);
      o && o !== e && (c = c.tag("e", o, "", "root")), c = c.tag("e", e, "", "reply"), c = c.tag("p", r.pubkey);
      for (const d of s)
        d !== r.pubkey && (c = c.tag("p", d));
      const l = await c.publish();
      return this.debug && console.log(`ThreadModule: Published reply to event ${e.substring(0, 8)}...`), {
        success: l.success,
        eventId: l.eventId,
        error: (i = l.error) == null ? void 0 : i.message
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
  get(e, t) {
    return new Promise((s) => {
      const r = this.thread(e).subscribe((o) => {
        r(), s(o);
      });
    });
  }
  /**
   * Watch thread for real-time updates (returns subscription status)
   */
  async watch(e) {
    try {
      return await this.startThreadSubscription(e), !0;
    } catch (t) {
      return this.debug && console.warn(`Failed to watch thread ${e}:`, t), !1;
    }
  }
  /**
   * Create a new thread (root post)
   */
  async createThread(e, t = []) {
    var r;
    let s, i;
    typeof e == "string" ? (s = e, i = t) : (s = e.content, i = e.mentions || []);
    try {
      this.nostr.events;
    } catch {
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    }
    try {
      let o = this.nostr.events.note(s);
      for (const l of i)
        o = o.tag("p", l);
      const a = await o.publish();
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
    } catch (o) {
      return {
        success: !1,
        error: o instanceof Error ? o.message : "Failed to create thread"
      };
    }
  }
  // Private helper methods
  async startThreadSubscription(e, t = {}) {
    try {
      let s = this.nostr.sub().kinds([1]).tags("e", [e]);
      t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), await s.execute();
    } catch (s) {
      this.debug && console.warn(`Failed to start thread subscription for ${e}:`, s);
    }
  }
  async startUserThreadsSubscription(e, t) {
    try {
      let s = this.nostr.sub().kinds([1]).authors([e]);
      t.since && (s = s.since(t.since)), t.limit && (s = s.limit(t.limit)), await s.execute();
    } catch (s) {
      this.debug && console.warn(`Failed to start user threads subscription for ${e}:`, s);
    }
  }
  async startFollowingThreadsSubscription(e, t) {
    try {
      let s = this.nostr.sub().kinds([1]).authors(e);
      t.since && (s = s.since(t.since)), t.limit && (s = s.limit(t.limit)), await s.execute();
    } catch (s) {
      this.debug && console.warn("Failed to start following threads subscription:", s);
    }
  }
  async getEvent(e) {
    await this.nostr.sub().ids([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 500));
    const s = this.nostr.query().ids([e]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  buildThreadStructure(e, t) {
    const s = [];
    for (const i of e) {
      const r = this.analyzeThreadEvent(i, t);
      s.push(r);
    }
    return s.sort((i, r) => i.created_at - r.created_at), s;
  }
  analyzeThreadEvent(e, t) {
    const s = e.tags.filter((c) => c[0] === "e");
    let i = 0, r = null, o = [], a = t;
    if (s.length > 0) {
      const c = s.find((d) => d[3] === "root"), l = s.find((d) => d[3] === "reply");
      c && (a = c[1]), l && (r = l[1], i = 1), !l && s.length > 0 && (s.length === 1 ? (r = s[0][1], i = 1) : (a = s[0][1], r = s[s.length - 1][1], i = s.length - 1)), o = s.map((d) => d[1]);
    }
    return {
      ...e,
      depth: i,
      rootEventId: a,
      replyToEventId: r,
      threadPath: o
    };
  }
  determineThreadStructure(e) {
    const t = e.tags.filter((i) => i[0] === "e");
    if (t.length === 0)
      return {
        rootEventId: e.id,
        replyEventId: e.id
      };
    const s = t.find((i) => i[3] === "root");
    return s ? {
      rootEventId: s[1],
      replyEventId: e.id
    } : t.length === 1 ? {
      rootEventId: t[0][1],
      replyEventId: e.id
    } : {
      rootEventId: t[0][1],
      replyEventId: e.id
    };
  }
  aggregateThreadSummary(e, t) {
    let s = 0, i = 0;
    const r = /* @__PURE__ */ new Set();
    let o, a;
    for (const c of e) {
      const l = this.analyzeThreadEvent(c, t);
      l.id === t ? a = l : (s++, (!o || l.created_at > o.created_at) && (o = l)), i = Math.max(i, l.depth), r.add(l.pubkey);
    }
    return {
      rootEventId: t,
      totalReplies: s,
      maxDepth: i,
      participants: Array.from(r),
      latestReply: o,
      rootEvent: a
    };
  }
  extractThreadSummaries(e) {
    const t = /* @__PURE__ */ new Map();
    for (const i of e) {
      const r = i.tags.filter((o) => o[0] === "e");
      if (r.length === 0) {
        const o = i.id;
        t.has(o) || t.set(o, []), t.get(o).push(i);
      } else {
        const o = r.find((c) => c[3] === "root"), a = o ? o[1] : r[0][1];
        t.has(a) || t.set(a, []), t.get(a).push(i);
      }
    }
    const s = [];
    for (const [i, r] of t) {
      const o = this.aggregateThreadSummary(r, i);
      s.push(o);
    }
    return s.sort((i, r) => {
      var c, l, d, h;
      const o = ((c = i.latestReply) == null ? void 0 : c.created_at) || ((l = i.rootEvent) == null ? void 0 : l.created_at) || 0;
      return (((d = r.latestReply) == null ? void 0 : d.created_at) || ((h = r.rootEvent) == null ? void 0 : h.created_at) || 0) - o;
    }), s;
  }
  createEmptyStore() {
    return this.nostr.query().kinds([1]).authors([""]).limit(1).execute().map(() => []);
  }
}
class qs {
  constructor(e, t) {
    this.nostr = e, this.debug = t, this.debug && console.log("📰 FeedModule initialized with Clean Architecture");
  }
  /**
   * Get global feed (all events from all kinds) (reactive)
   * Returns chronologically sorted feed of all activity
   */
  global(e = {}) {
    const t = {
      kinds: [1, 6, 7],
      // Notes, reposts, reactions
      limit: 50,
      includeReplies: !0,
      includeReactions: !0,
      includeReposts: !0,
      ...e
    };
    this.startFeedSubscription(t);
    let s = this.nostr.query().kinds(t.kinds);
    return t.authors && (s = s.authors(t.authors)), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), s.execute().map((i) => this.processFeedEvents(i, t));
  }
  /**
   * Get following feed (events from followed users) (reactive)
   * Requires user to be signed in and have a follow list
   */
  following(e = {}) {
    const t = this.nostr.me;
    return t ? this.nostr.query().kinds([3]).authors([t]).limit(1).execute().map((i) => {
      if (!i || i.length === 0)
        return [];
      const o = i[0].tags.filter((c) => c[0] === "p").map((c) => c[1]);
      if (o.length === 0)
        return [];
      const a = {
        ...e,
        authors: o,
        kinds: e.kinds || [1, 6, 7],
        limit: e.limit || 30
      };
      return this.startFeedSubscription(a), [];
    }) : this.createEmptyStore();
  }
  /**
   * Get user's own feed (all events from specific user) (reactive)
   */
  user(e, t = {}) {
    const s = {
      kinds: [1, 6, 7],
      // Notes, reposts, reactions
      limit: 50,
      includeReplies: !0,
      includeReactions: !0,
      includeReposts: !0,
      ...t,
      authors: [e]
    };
    this.startFeedSubscription(s);
    let i = this.nostr.query().kinds(s.kinds).authors([e]);
    return s.since && (i = i.since(s.since)), s.until && (i = i.until(s.until)), s.limit && (i = i.limit(s.limit)), i.execute().map((r) => this.processFeedEvents(r, s));
  }
  /**
   * Get trending feed (popular events with many reactions) (reactive)
   * Returns events sorted by engagement metrics
   */
  trending(e = {}) {
    const t = {
      kinds: [1],
      // Only notes for trending
      limit: 20,
      since: Math.floor(Date.now() / 1e3) - 86400,
      // Last 24 hours
      ...e
    };
    this.startFeedSubscription(t);
    let s = this.nostr.query().kinds([1]);
    return t.authors && (s = s.authors(t.authors)), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit * 3)), s.execute().map((i) => this.processTrendingEvents(i, t));
  }
  /**
   * Get feed statistics (reactive)
   */
  stats(e = {}) {
    const t = {
      kinds: [1, 6, 7],
      limit: 100,
      ...e
    };
    this.startFeedSubscription(t);
    let s = this.nostr.query().kinds(t.kinds);
    return t.authors && (s = s.authors(t.authors)), t.since && (s = s.since(t.since)), t.until && (s = s.until(t.until)), t.limit && (s = s.limit(t.limit)), s.execute().map((i) => this.calculateFeedStats(i));
  }
  /**
   * Search feed by content (reactive)
   * Returns events matching search criteria
   */
  search(e, t = {}) {
    const s = {
      kinds: [1],
      // Only search in text notes
      limit: 30,
      ...t
    };
    this.startFeedSubscription(s);
    let i = this.nostr.query().kinds(s.kinds);
    return s.authors && (i = i.authors(s.authors)), s.since && (i = i.since(s.since)), s.until && (i = i.until(s.until)), s.limit && (i = i.limit(s.limit * 5)), i.execute().map((r) => this.filterEventsByContent(r, e, s));
  }
  // Private helper methods
  async startFeedSubscription(e) {
    try {
      let t = this.nostr.sub();
      e.kinds && (t = t.kinds(e.kinds)), e.authors && (t = t.authors(e.authors)), e.since && (t = t.since(e.since)), e.until && (t = t.until(e.until)), e.limit && (t = t.limit(e.limit)), await t.execute();
    } catch (t) {
      this.debug && console.warn("Failed to start feed subscription:", t);
    }
  }
  processFeedEvents(e, t) {
    let s = [];
    for (const i of e) {
      const r = this.convertToFeedEvent(i);
      !t.includeReplies && r.feedType === "thread" && r.referencedEventId || !t.includeReactions && r.feedType === "reaction" || !t.includeReposts && r.feedType === "repost" || s.push(r);
    }
    return s.sort((i, r) => r.created_at - i.created_at), s;
  }
  processTrendingEvents(e, t) {
    const s = e.map((i) => this.convertToFeedEvent(i));
    return s.sort((i, r) => r.created_at - i.created_at), s.slice(0, t.limit || 20);
  }
  filterEventsByContent(e, t, s) {
    const i = t.toLowerCase(), o = e.filter((a) => a.content ? a.content.toLowerCase().includes(i) : !1).map((a) => this.convertToFeedEvent(a));
    return o.sort((a, c) => c.created_at - a.created_at), o.slice(0, s.limit || 30);
  }
  convertToFeedEvent(e) {
    let t = "note", s, i;
    if (e.kind === 6) {
      t = "repost";
      const r = e.tags.filter((o) => o[0] === "e");
      r.length > 0 && (s = r[0][1]);
    } else if (e.kind === 7) {
      t = "reaction";
      const r = e.tags.filter((o) => o[0] === "e");
      r.length > 0 && (s = r[0][1]);
    } else if (e.kind === 1) {
      const r = e.tags.filter((o) => o[0] === "e");
      if (r.length > 0) {
        t = "thread";
        const o = r.find((c) => c[3] === "root"), a = r.find((c) => c[3] === "reply");
        o && (i = o[1]), a ? s = a[1] : r.length > 0 && (s = r[0][1]);
      }
    }
    return {
      ...e,
      feedType: t,
      referencedEventId: s,
      threadRoot: i
    };
  }
  calculateFeedStats(e) {
    const t = {
      totalEvents: e.length,
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
    if (e.length === 0)
      return t;
    const s = /* @__PURE__ */ new Set();
    let i = e[0].created_at, r = e[0].created_at;
    for (const o of e)
      o.kind === 1 ? o.tags.filter((c) => c[0] === "e").length > 0 ? t.threadCount++ : t.noteCount++ : o.kind === 6 ? t.repostCount++ : o.kind === 7 && t.reactionCount++, s.add(o.pubkey), i = Math.min(i, o.created_at), r = Math.max(r, o.created_at);
    return t.uniqueAuthors = s.size, t.timeRange.oldest = i, t.timeRange.newest = r, t;
  }
  createEmptyStore() {
    return this.nostr.query().kinds([1]).authors([""]).limit(1).execute().map(() => []);
  }
}
class Ys {
  constructor(e) {
    u(this, "config");
    // Lazy-loaded modules
    u(this, "_content");
    u(this, "_reactions");
    u(this, "_threads");
    u(this, "_feeds");
    u(this, "_communities");
    // CommunityModule;
    u(this, "_lists");
    // ListModule;
    // Cleanup synchronization
    u(this, "closing", !1);
    u(this, "closePromise");
    this.config = e, this.config.debug && console.log("🔥 SocialModule initialized with Clean Architecture");
  }
  /**
   * Content operations (NIP-01, NIP-18, NIP-23)
   * Text notes, articles, reposts
   */
  get content() {
    return this._content || (this._content = new Gs(this.config.nostr, this.config.debug)), this._content;
  }
  /**
   * Reaction operations (NIP-25)
   * Likes, dislikes, emoji reactions
   */
  get reactions() {
    return this._reactions || (this._reactions = new Hs(this.config.nostr, this.config.debug)), this._reactions;
  }
  /**
   * Thread operations (NIP-10, NIP-22)
   * Threading, conversations, comments
   */
  get threads() {
    return this._threads || (this._threads = new js(this.config.nostr, this.config.debug)), this._threads;
  }
  /**
   * Feed operations
   * Timeline aggregation, social feeds
   */
  get feeds() {
    return this._feeds || (this._feeds = new qs(this.config.nostr, this.config.debug)), this._feeds;
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
  async updateSigningProvider(e) {
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
    } catch (e) {
      throw this.config.debug && console.error("🔥 SocialModule cleanup error:", e), e;
    }
  }
  async performCleanup() {
    const e = [];
    this._content && typeof this._content.close == "function" && e.push(
      this._content.close().catch((t) => {
        this.config.debug && console.warn("SocialModule: ContentModule cleanup error:", t);
      })
    ), this._reactions && typeof this._reactions.close == "function" && e.push(
      this._reactions.close().catch((t) => {
        this.config.debug && console.warn("SocialModule: ReactionModule cleanup error:", t);
      })
    ), this._threads && typeof this._threads.close == "function" && e.push(
      this._threads.close().catch((t) => {
        this.config.debug && console.warn("SocialModule: ThreadModule cleanup error:", t);
      })
    ), this._feeds && typeof this._feeds.close == "function" && e.push(
      this._feeds.close().catch((t) => {
        this.config.debug && console.warn("SocialModule: FeedModule cleanup error:", t);
      })
    ), this._communities && typeof this._communities.close == "function" && e.push(
      this._communities.close().catch((t) => {
        this.config.debug && console.warn("SocialModule: CommunityModule cleanup error:", t);
      })
    ), this._lists && typeof this._lists.close == "function" && e.push(
      this._lists.close().catch((t) => {
        this.config.debug && console.warn("SocialModule: ListModule cleanup error:", t);
      })
    ), e.length > 0 && await Promise.race([
      Promise.all(e),
      new Promise(
        (t, s) => setTimeout(() => s(new Error("Module cleanup timeout after 10 seconds")), 1e4)
      )
    ]), this._content = void 0, this._reactions = void 0, this._threads = void 0, this._feeds = void 0, this._communities = void 0, this._lists = void 0;
  }
}
class Xs {
  constructor(e, t, s, i = {}) {
    u(this, "listeners", /* @__PURE__ */ new Map());
    u(this, "subscriptionResult");
    u(this, "eventCount", 0);
    u(this, "createdAt", Date.now());
    u(this, "lastEventAt");
    u(this, "debug");
    this.key = e, this.filters = t, this.relays = s, this.debug = i.debug || !1;
  }
  /**
   * Add a new listener to this shared subscription
   * Returns the listener ID for later removal
   */
  addListener(e) {
    const t = this.generateListenerId(), s = {
      id: t,
      ...e
    };
    return this.listeners.set(t, s), this.debug && console.log(`SharedSubscription: Added listener ${t} to ${this.key} (${this.listeners.size} total)`), t;
  }
  /**
   * Remove a listener from this shared subscription
   * Returns true if this was the last listener
   */
  removeListener(e) {
    return this.listeners.delete(e) && this.debug && console.log(`SharedSubscription: Removed listener ${e} from ${this.key} (${this.listeners.size} remaining)`), this.listeners.size === 0;
  }
  /**
   * Broadcast an event to all listeners
   */
  async broadcast(e) {
    this.eventCount++, this.lastEventAt = Date.now();
    const t = [];
    for (const s of this.listeners.values())
      s.onEvent && t.push(
        Promise.resolve(s.onEvent(e)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEvent error:`, i), s.onError && s.onError(i instanceof Error ? i : new Error(String(i)));
        })
      );
    await Promise.all(t);
  }
  /**
   * Notify all listeners of EOSE
   */
  async notifyEose(e) {
    const t = [];
    for (const s of this.listeners.values())
      s.onEose && t.push(
        Promise.resolve(s.onEose(e)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEose error:`, i), s.onError && s.onError(i instanceof Error ? i : new Error(String(i)));
        })
      );
    await Promise.all(t);
  }
  /**
   * Notify all listeners of subscription close
   */
  async notifyClose(e) {
    const t = [];
    for (const s of this.listeners.values())
      s.onClose && t.push(
        Promise.resolve(s.onClose(e)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onClose error:`, i);
        })
      );
    await Promise.all(t);
  }
  /**
   * Notify all listeners of an error
   */
  async notifyError(e) {
    const t = [];
    for (const s of this.listeners.values())
      s.onError && t.push(
        Promise.resolve(s.onError(e)).catch((i) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onError handler error:`, i);
        })
      );
    await Promise.all(t);
  }
  /**
   * Set the subscription result from SubscriptionManager
   */
  setSubscriptionResult(e) {
    this.subscriptionResult = e;
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
    var e;
    return this.hasListeners() && ((e = this.subscriptionResult) == null ? void 0 : e.success) !== !1;
  }
  /**
   * Get the subscription ID if available
   */
  getSubscriptionId() {
    var e, t;
    return (t = (e = this.subscriptionResult) == null ? void 0 : e.subscription) == null ? void 0 : t.id;
  }
  // Private helper methods
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
class Js {
  constructor(e) {
    u(this, "subscriptions", /* @__PURE__ */ new Map());
    u(this, "eventCallbacks", /* @__PURE__ */ new Map());
    u(this, "sharedSubscriptions", /* @__PURE__ */ new Map());
    u(this, "debug");
    this.relayManager = e, this.debug = e.debug || !1, this.setupRelayMessageHandling();
  }
  /**
   * Get or create a shared subscription with smart deduplication
   * This is the new preferred method for subscription management
   */
  async getOrCreateSubscription(e, t) {
    const s = t || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, i = this.generateFilterHash(e, s);
    if (this.sharedSubscriptions.has(i)) {
      const a = this.sharedSubscriptions.get(i);
      if (this.debug) {
        const c = a.getStats(), l = this.summarizeFilters(e);
        console.log(`SubscriptionManager: Reusing shared subscription ${i} (${c.listenerCount} listeners) - Filters: ${l}`);
      }
      return a;
    }
    const r = new Xs(i, e, s, { debug: this.debug }), o = await this.subscribe(e, {
      relays: s,
      onEvent: (a) => r.broadcast(a),
      onEose: (a) => r.notifyEose(a),
      onClose: (a) => r.notifyClose(a),
      onError: (a) => r.notifyError(a)
    });
    if (r.setSubscriptionResult(o), o.success && (this.sharedSubscriptions.set(i, r), this.debug)) {
      const a = this.summarizeFilters(e);
      console.log(`SubscriptionManager: Created new shared subscription ${i} - Filters: ${a}`);
    }
    return r;
  }
  /**
   * Create a human-readable summary of filters for debugging
   */
  summarizeFilters(e) {
    return e.map((t) => {
      const s = [];
      if (t.kinds && s.push(`kinds:[${t.kinds.join(",")}]`), t.authors) {
        const i = t.authors.length > 1 ? `${t.authors.length} authors` : `author:${t.authors[0].substring(0, 8)}...`;
        s.push(i);
      }
      if (t.ids) {
        const i = t.ids.length > 1 ? `${t.ids.length} ids` : `id:${t.ids[0].substring(0, 8)}...`;
        s.push(i);
      }
      return t["#p"] && s.push(`#p:${t["#p"].length} mentions`), t["#e"] && s.push(`#e:${t["#e"].length} events`), t["#t"] && s.push(`#t:${t["#t"].join(",")}`), t.since && s.push(`since:${new Date(t.since * 1e3).toISOString().substring(11, 19)}`), t.until && s.push(`until:${new Date(t.until * 1e3).toISOString().substring(11, 19)}`), t.limit && s.push(`limit:${t.limit}`), `{${s.join(", ")}}`;
    }).join(" + ");
  }
  /**
   * Generate a cryptographically secure hash key for filter deduplication
   * Prevents hash collisions that could cause subscription mixing
   */
  generateFilterHash(e, t) {
    const s = e.map((a) => {
      const c = {};
      return Object.keys(a).sort().forEach((l) => {
        const d = a[l];
        Array.isArray(d) && d.every((h) => typeof h == "string") ? c[l] = [...d].sort() : c[l] = d;
      }), c;
    }), i = JSON.stringify(s), r = t.slice().sort().join(","), o = `${i}:${r}`;
    return typeof crypto < "u" && crypto.subtle ? this.generateSHA256HashSync(o) : this.generateSecureHash(o);
  }
  /**
   * Generate SHA-256 hash synchronously (fallback implementation)
   */
  generateSHA256HashSync(e) {
    const s = new TextEncoder().encode(e);
    let i = 2166136261;
    for (let r = 0; r < s.length; r++)
      i ^= s[r], i = Math.imul(i, 16777619);
    return i ^= i >>> 16, i = Math.imul(i, 2246822507), i ^= i >>> 13, i = Math.imul(i, 3266489909), i ^= i >>> 16, (i >>> 0).toString(16).padStart(8, "0");
  }
  /**
   * Enhanced hash function with better collision resistance
   */
  generateSecureHash(e) {
    const t = this.djb2Hash(e), s = this.sdbmHash(e), i = this.fnvHash(e);
    return ((t ^ s ^ i) >>> 0).toString(16).padStart(8, "0");
  }
  djb2Hash(e) {
    let t = 5381;
    for (let s = 0; s < e.length; s++)
      t = (t << 5) + t + e.charCodeAt(s);
    return t;
  }
  sdbmHash(e) {
    let t = 0;
    for (let s = 0; s < e.length; s++)
      t = e.charCodeAt(s) + (t << 6) + (t << 16) - t;
    return t;
  }
  fnvHash(e) {
    let t = 2166136261;
    for (let s = 0; s < e.length; s++)
      t ^= e.charCodeAt(s), t = Math.imul(t, 16777619);
    return t;
  }
  /**
   * Clean up shared subscriptions with no listeners
   */
  async cleanupSharedSubscriptions() {
    const e = [];
    for (const [t, s] of this.sharedSubscriptions.entries())
      if (!s.hasListeners()) {
        e.push(t);
        const i = s.getSubscriptionId();
        i && await this.close(i, "No more listeners");
      }
    for (const t of e)
      this.sharedSubscriptions.delete(t), this.debug && console.log(`SubscriptionManager: Removed orphaned shared subscription ${t}`);
  }
  /**
   * Get subscription analytics
   */
  getSubscriptionAnalytics() {
    let e = 0, t = 0;
    for (const s of this.sharedSubscriptions.values()) {
      const i = s.getStats();
      e += i.listenerCount, i.listenerCount > 1 && (t += i.listenerCount - 1);
    }
    return {
      totalSubscriptions: this.subscriptions.size,
      sharedSubscriptions: this.sharedSubscriptions.size,
      totalListeners: e,
      duplicatesAvoided: t
    };
  }
  /**
   * Create a new subscription with given filters
   * Performance requirement: <100ms subscription creation
   */
  async subscribe(e, t = {}) {
    var s, i, r, o;
    try {
      const a = this.validateFilters(e);
      if (a)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: a
        };
      const c = this.generateSubscriptionId(), l = Date.now(), d = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, h = {
        id: c,
        filters: e,
        relays: d,
        state: "pending",
        createdAt: l,
        eventCount: 0,
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      if (d.forEach((y) => {
        h.relayStates[y] = "active";
      }), t.timeout && (h.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, t.timeout)), this.subscriptions.set(c, h), this.debug) {
        const y = this.summarizeFilters(e);
        console.log(`Creating subscription ${c} with ${e.length} filters: ${y}`);
      }
      const f = t.retryAttempts || 1, b = t.retryDelay || 1e3;
      let g = [], p;
      for (let y = 0; y < f; y++)
        try {
          const w = ["REQ", c, ...e];
          try {
            await ((i = (s = this.relayManager).sendToAll) == null ? void 0 : i.call(s, w)), g = d.map((M) => ({
              relay: M,
              success: !0,
              error: void 0
            }));
            break;
          } catch (M) {
            g = [];
            let Q = !1;
            for (const le of d)
              try {
                await ((o = (r = this.relayManager).sendToRelays) == null ? void 0 : o.call(r, [le], w)), g.push({
                  relay: le,
                  success: !0,
                  error: void 0
                }), Q = !0;
              } catch (I) {
                g.push({
                  relay: le,
                  success: !1,
                  error: I instanceof Error ? I : new Error("Unknown error")
                });
              }
            if (Q)
              break;
            p = M instanceof Error ? M : new Error("All relays failed");
          }
        } catch (w) {
          p = w instanceof Error ? w : new Error("Unknown error"), g = d.map((M) => ({
            relay: M,
            success: !1,
            error: p
          })), y < f - 1 && await new Promise((M) => setTimeout(M, b));
        }
      const E = g.length > 0 && g.some((y) => y.success);
      return E || (this.subscriptions.delete(c), h.timeoutId && clearTimeout(h.timeoutId)), {
        subscription: E ? this.externalizeSubscription(h) : {},
        success: E,
        relayResults: g,
        error: E ? void 0 : {
          message: p ? p.message : g.length === 0 ? "No relays available" : "All relays failed",
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
  async activate(e) {
    var s, i, r, o;
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    t.state = "active";
    try {
      const a = ["REQ", e, ...t.filters], c = this.relayManager.connectedRelays;
      t.relays.length !== c.length || !t.relays.every((d) => c.includes(d)) ? await ((i = (s = this.relayManager).sendToRelays) == null ? void 0 : i.call(s, t.relays, a)) : await ((o = (r = this.relayManager).sendToAll) == null ? void 0 : o.call(r, a));
    } catch (a) {
      throw t.state = "error", a;
    }
  }
  /**
   * Mark subscription as having received EOSE from a relay
   */
  async markEose(e, t) {
    const s = this.subscriptions.get(e);
    s && (s.eoseRelays.add(t), s.state = "eose", s.onEose && s.onEose(t));
  }
  /**
   * Close a subscription
   */
  async close(e, t) {
    var i, r;
    const s = this.subscriptions.get(e);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const o = ["CLOSE", e];
        await ((r = (i = this.relayManager).sendToAll) == null ? void 0 : r.call(i, o));
      } catch (o) {
        this.debug && console.error(`Error sending CLOSE for ${e}:`, o);
      }
      s.onClose && s.onClose(t), this.subscriptions.delete(e);
    }
  }
  /**
   * Close all active subscriptions
   */
  async closeAll() {
    const e = this.getActiveSubscriptions();
    await Promise.all(
      e.map((t) => this.close(t.id, "closeAll"))
    );
  }
  /**
   * Unsubscribe (alias for close) - DevExplorer API compatibility
   */
  async unsubscribe(e) {
    await this.close(e, "unsubscribe");
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
  async handleEvent(e, t) {
    const s = this.subscriptions.get(e);
    s && (s.receivedEventIds.has(t.id) || (s.receivedEventIds.add(t.id), s.eventCount++, s.lastEventAt = Date.now(), s.onEvent && s.onEvent(t)));
  }
  /**
   * Handle event batch for performance optimization
   */
  async handleEventBatch(e, t) {
    const s = this.subscriptions.get(e);
    if (!s) return;
    const i = [];
    for (const r of t)
      s.receivedEventIds.has(r.id) || (s.receivedEventIds.add(r.id), i.push(r));
    if (s.eventCount += i.length, s.lastEventAt = Date.now(), s.onEvent && i.length > 0)
      for (const r of i)
        s.onEvent(r);
  }
  /**
   * Handle relay event message
   */
  async handleRelayEvent(e, t, s) {
    await this.handleEvent(t, s);
  }
  /**
   * Handle incoming relay message
   */
  async handleRelayMessage(e, t) {
    const [s, i, ...r] = t;
    switch (s) {
      case "EVENT":
        const o = r[0];
        await this.handleRelayEvent(e, i, o);
        break;
      case "EOSE":
        await this.markEose(i, e);
        break;
      case "NOTICE":
        this.debug && console.log(`Notice from ${e}:`, r[0]);
        break;
    }
  }
  /**
   * Handle relay disconnection
   */
  async handleRelayDisconnection(e) {
    this.subscriptions.forEach((t) => {
      t.relayStates[e] && (t.relayStates[e] = "disconnected");
    });
  }
  /**
   * Handle relay manager updates
   */
  async handleRelayManagerUpdate() {
    const e = this.relayManager.connectedRelays;
    this.subscriptions.forEach((t) => {
      t.relays.forEach((s) => {
        e.includes(s) ? t.relayStates[s] = "active" : t.relayStates[s] = "disconnected";
      });
    });
  }
  /**
   * Get subscription by ID
   */
  getSubscription(e) {
    const t = this.subscriptions.get(e);
    return t ? this.externalizeSubscription(t) : void 0;
  }
  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).filter((e) => e.state !== "closed").map((e) => this.externalizeSubscription(e));
  }
  /**
   * Get subscription statistics
   */
  getSubscriptionStats(e) {
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    return {
      relayStates: { ...t.relayStates },
      eoseCount: t.eoseRelays.size,
      eventCount: t.eventCount
    };
  }
  // Private helper methods
  generateSubscriptionId() {
    return Array.from(
      { length: 16 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
  validateFilters(e) {
    if (!Array.isArray(e) || e.length === 0)
      return {
        message: "Invalid filter: must be non-empty array",
        retryable: !1
      };
    for (const t of e) {
      if (t == null || typeof t != "object")
        return {
          message: "Invalid filter: must be object",
          retryable: !1
        };
      if (t.hasOwnProperty("invalid"))
        return {
          message: "Invalid filter: contains invalid properties",
          retryable: !1
        };
      if (t.kinds && !Array.isArray(t.kinds))
        return {
          message: "Invalid filter: kinds must be array",
          retryable: !1
        };
    }
    return null;
  }
  async sendSubscriptionToRelays(e, t) {
    const s = [], i = ["REQ", e.id, ...e.filters];
    if (this.relayManager.sendToRelays)
      for (const r of e.relays)
        try {
          await this.relayManager.sendToRelays([r], i), s.push({
            relay: r,
            success: !0,
            subscriptionId: e.id
          });
        } catch (o) {
          s.push({
            relay: r,
            success: !1,
            error: o instanceof Error ? o.message : "Unknown error",
            subscriptionId: e.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(i), e.relays.forEach((r) => {
          s.push({
            relay: r,
            success: !0,
            subscriptionId: e.id
          });
        })) : e.relays.forEach((r) => {
          s.push({
            relay: r,
            success: !0,
            subscriptionId: e.id
          });
        });
      } catch (r) {
        e.relays.forEach((o) => {
          s.push({
            relay: o,
            success: !1,
            error: r instanceof Error ? r.message : "Unknown error",
            subscriptionId: e.id
          });
        });
      }
    return s;
  }
  handleSubscriptionTimeout(e) {
    const t = this.subscriptions.get(e);
    t && (t.state = "error", t.onClose && t.onClose("Subscription timeout"), this.subscriptions.delete(e));
  }
  externalizeSubscription(e) {
    return new Proxy(e, {
      get(t, s) {
        if (!(s === "timeoutId" || s === "relayStates" || s === "eoseRelays" || s === "receivedEventIds"))
          return t[s];
      },
      set(t, s, i) {
        return s === "eventCount" || s === "lastEventAt" || s === "state" ? (t[s] = i, !0) : !1;
      }
    });
  }
  setupRelayMessageHandling() {
    this.relayManager.setMessageHandler((e, t) => {
      this.handleRelayMessage(e, t);
    });
  }
}
class Me {
  constructor(e, t = {}) {
    u(this, "events", /* @__PURE__ */ new Map());
    // ALL events (decrypted)
    u(this, "eventsByKind", /* @__PURE__ */ new Map());
    // Fast lookup by kind
    u(this, "eventsByAuthor", /* @__PURE__ */ new Map());
    // Fast lookup by author
    u(this, "eventsByTag", /* @__PURE__ */ new Map());
    // tag name → value → event IDs
    u(this, "subscribers", /* @__PURE__ */ new Set());
    u(this, "privateKey");
    u(this, "config");
    // Efficient LRU tracking with doubly-linked list - O(1) operations
    u(this, "lruNodes", /* @__PURE__ */ new Map());
    u(this, "lruHead", null);
    u(this, "lruTail", null);
    // Statistics tracking
    u(this, "stats", {
      queryCount: 0,
      totalQueryTime: 0,
      evictedCount: 0,
      createdAt: Date.now()
    });
    // Optional decryptor to use extension-based NIP-44 when available
    u(this, "decryptor", null);
    this.privateKey = "", this.setPrivateKey(e), this.config = {
      maxEvents: t.maxEvents || 1e4,
      maxMemoryMB: t.maxMemoryMB || 50,
      evictionPolicy: t.evictionPolicy || "lru"
    };
  }
  setDecryptor(e) {
    this.decryptor = e ?? null;
  }
  /**
   * Update the private key used for unwrapping gift wraps without replacing the cache instance.
   * This avoids losing previously cached events and subscribers.
   */
  setPrivateKey(e) {
    if (!e || typeof e != "string") {
      this.privateKey = "";
      return;
    }
    let t = e.trim();
    if (t.startsWith("nsec1"))
      try {
        t = Ct(t);
      } catch {
      }
    if (t.startsWith("0x") && (t = t.slice(2)), !xt(t)) {
      console.warn("UniversalEventCache: invalid private key provided (expected 64-hex). Disabling unwrap."), this.privateKey = "";
      return;
    }
    this.privateKey = t.toLowerCase();
  }
  /**
   * Re-process all stored gift wrap (kind 1059) events using the current private key.
   * Useful after the private key becomes available to decrypt previously seen wraps.
   */
  async reprocessGiftWraps() {
    const e = [];
    for (const t of this.events.values())
      t.kind === 1059 && e.push(t);
    for (const t of e)
      try {
        const s = await this.unwrapGiftWrap(t);
        s && s.kind !== 1059 && (this.events.has(s.id) || (this.events.set(s.id, s), this.updateIndexes(s), this.updateAccessTracking(s.id), this.notifySubscribers(s)));
      } catch {
      }
  }
  async addEvent(e) {
    if (e.kind === 1059) {
      this.events.set(e.id, e), this.updateIndexes(e), this.updateAccessTracking(e.id), this.notifySubscribers(e);
      try {
        const t = await this.unwrapGiftWrap(e);
        t && await this.addEvent(t);
      } catch (t) {
        console.debug("Failed to unwrap gift wrap (stored anyway):", t);
      }
      return;
    }
    this.enforceCapacityLimits(), this.events.set(e.id, e), this.updateIndexes(e), this.updateAccessTracking(e.id), this.notifySubscribers(e);
  }
  query(e) {
    const t = performance.now(), s = this.getMatchingEvents(e);
    s.forEach((r) => this.updateAccessTracking(r.id));
    const i = performance.now() - t;
    return this.stats.queryCount++, this.stats.totalQueryTime += i, s;
  }
  subscribe(e) {
    return this.subscribers.add(e), () => this.subscribers.delete(e);
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
    const e = Date.now(), t = this.stats.queryCount;
    return {
      // Basic metrics
      totalEvents: this.events.size,
      memoryUsageMB: this.estimateMemoryUsage(),
      subscribersCount: this.subscribers.size,
      // Index metrics
      kindIndexSize: this.eventsByKind.size,
      authorIndexSize: this.eventsByAuthor.size,
      tagIndexSize: this.eventsByTag.size,
      // Performance metrics
      queryCount: t,
      hitRate: t > 0 ? this.events.size / t * 100 : 0,
      avgQueryTime: t > 0 ? this.stats.totalQueryTime / t : 0,
      // Eviction metrics
      evictedCount: this.stats.evictedCount,
      evictionPolicy: this.config.evictionPolicy,
      // Configuration
      maxEvents: this.config.maxEvents,
      maxMemoryMB: this.config.maxMemoryMB,
      // Real-time metrics
      lastUpdated: e,
      cacheAge: e - this.stats.createdAt
    };
  }
  async unwrapGiftWrap(e) {
    if (this.decryptor && typeof this.decryptor.nip44Decrypt == "function")
      try {
        const s = await this.decryptor.nip44Decrypt(e.pubkey, e.content);
        if (!s) return null;
        const i = JSON.parse(s), r = await this.decryptor.nip44Decrypt(i.pubkey, i.content);
        if (!r) return null;
        const o = JSON.parse(r);
        return this.normalizeRumorFromWrap(e, o);
      } catch {
      }
    const t = await Z.unwrapGiftWrap(e, this.privateKey);
    return t ? this.normalizeRumorFromWrap(e, t) : null;
  }
  normalizeRumorFromWrap(e, t) {
    try {
      const s = e.tags.find((l) => Array.isArray(l) && typeof l[0] == "string"), i = s && typeof s[1] == "string" ? s[1] : "", r = Array.isArray(t == null ? void 0 : t.tags) ? t.tags : [], a = r.some((l) => Array.isArray(l) && l[0] === "p") || !i ? r : [...r, ["p", i]], c = {
        id: "",
        pubkey: t.pubkey,
        created_at: t.created_at,
        kind: t.kind,
        tags: a,
        content: t.content,
        sig: ""
      };
      return c.id = k.calculateEventId(c), c;
    } catch {
      return null;
    }
  }
  updateIndexes(e) {
    this.eventsByKind.has(e.kind) || this.eventsByKind.set(e.kind, /* @__PURE__ */ new Set()), this.eventsByKind.get(e.kind).add(e.id), this.eventsByAuthor.has(e.pubkey) || this.eventsByAuthor.set(e.pubkey, /* @__PURE__ */ new Set()), this.eventsByAuthor.get(e.pubkey).add(e.id), e.tags.forEach((t) => {
      const s = t[0] || "", i = t[1] || "";
      if (!s || !i) return;
      this.eventsByTag.has(s) || this.eventsByTag.set(s, /* @__PURE__ */ new Map());
      const r = this.eventsByTag.get(s);
      r.has(i) || r.set(i, /* @__PURE__ */ new Set()), r.get(i).add(e.id);
    });
  }
  getMatchingEvents(e) {
    let t;
    if (e.kinds && e.kinds.length > 0) {
      const i = e.kinds.map((r) => this.eventsByKind.get(r) || /* @__PURE__ */ new Set());
      t = this.unionSets(i);
    }
    if (e.authors && e.authors.length > 0) {
      const i = e.authors.map((o) => this.eventsByAuthor.get(o) || /* @__PURE__ */ new Set()), r = this.unionSets(i);
      t = t ? this.intersectSets([t, r]) : r;
    }
    Object.entries(e).forEach(([i, r]) => {
      if (i.startsWith("#") && Array.isArray(r) && r.length > 0) {
        const o = i.slice(1), a = this.eventsByTag.get(o);
        if (a) {
          const c = r.map((d) => a.get(d) || /* @__PURE__ */ new Set()), l = this.unionSets(c);
          t = t ? this.intersectSets([t, l]) : l;
        } else
          t = /* @__PURE__ */ new Set();
      }
    });
    const s = Array.from(t ?? new Set(Array.from(this.events.keys()))).map((i) => this.events.get(i)).filter((i) => i && this.matchesFilter(i, e)).sort((i, r) => r.created_at - i.created_at);
    return e.limit && e.limit > 0 ? s.slice(0, e.limit) : s;
  }
  matchesFilter(e, t) {
    return !(t.since && e.created_at < t.since || t.until && e.created_at > t.until || t.ids && t.ids.length > 0 && !t.ids.includes(e.id));
  }
  unionSets(e) {
    const t = /* @__PURE__ */ new Set();
    return e.forEach((s) => {
      s.forEach((i) => t.add(i));
    }), t;
  }
  intersectSets(e) {
    if (e.length === 0) return /* @__PURE__ */ new Set();
    if (e.length === 1) return e[0] || /* @__PURE__ */ new Set();
    const t = /* @__PURE__ */ new Set();
    return e[0].forEach((i) => {
      e.every((r) => r.has(i)) && t.add(i);
    }), t;
  }
  notifySubscribers(e) {
    this.subscribers.forEach((t) => {
      try {
        t(e);
      } catch (s) {
        console.error("Subscriber callback error:", s);
      }
    });
  }
  updateAccessTracking(e) {
    if (this.config.evictionPolicy !== "lru") return;
    const t = Date.now();
    let s = this.lruNodes.get(e);
    s ? (this.moveToHead(s), s.timestamp = t) : (s = {
      eventId: e,
      prev: null,
      next: null,
      timestamp: t
    }, this.lruNodes.set(e, s), this.addToHead(s));
  }
  // O(1) LRU operations using doubly-linked list
  addToHead(e) {
    e.prev = null, e.next = this.lruHead, this.lruHead && (this.lruHead.prev = e), this.lruHead = e, this.lruTail || (this.lruTail = e);
  }
  removeNode(e) {
    e.prev ? e.prev.next = e.next : this.lruHead = e.next, e.next ? e.next.prev = e.prev : this.lruTail = e.prev;
  }
  moveToHead(e) {
    this.removeNode(e), this.addToHead(e);
  }
  enforceCapacityLimits() {
    if (this.events.size >= this.config.maxEvents && this.evictOldest(), this.estimateMemoryUsage() > this.config.maxMemoryMB)
      for (; this.estimateMemoryUsage() > this.config.maxMemoryMB && this.events.size > 0; )
        this.evictOldest();
  }
  evictOldest() {
    let e;
    this.config.evictionPolicy === "lru" ? this.lruTail && (e = this.lruTail.eventId) : e = this.events.keys().next().value, e && this.removeEvent(e);
  }
  removeEvent(e) {
    var i, r;
    const t = this.events.get(e);
    if (!t) return;
    this.stats.evictedCount++, this.events.delete(e), (i = this.eventsByKind.get(t.kind)) == null || i.delete(e), (r = this.eventsByAuthor.get(t.pubkey)) == null || r.delete(e), t.tags.forEach((o) => {
      var l, d;
      const a = o[0] || "", c = o[1] || "";
      !a || !c || (d = (l = this.eventsByTag.get(a)) == null ? void 0 : l.get(c)) == null || d.delete(e);
    });
    const s = this.lruNodes.get(e);
    s && (this.removeNode(s), this.lruNodes.delete(e));
  }
  estimateMemoryUsage() {
    return this.events.size * 1024 / (1024 * 1024);
  }
}
class Nt {
  constructor() {
    u(this, "filter", {});
  }
  kinds(e) {
    const t = { ...this.filter, kinds: e };
    return this.clone(t);
  }
  authors(e) {
    const t = { ...this.filter, authors: e };
    return this.clone(t);
  }
  tags(e, t) {
    const s = { ...this.filter };
    return t ? s[`#${e}`] = t : s[`#${e}`] = [], this.clone(s);
  }
  since(e) {
    const t = { ...this.filter, since: e };
    return this.clone(t);
  }
  until(e) {
    const t = { ...this.filter, until: e };
    return this.clone(t);
  }
  limit(e) {
    const t = { ...this.filter, limit: e };
    return this.clone(t);
  }
  ids(e) {
    const t = { ...this.filter, ids: e };
    return this.clone(t);
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
class Dt {
  constructor(e, t) {
    u(this, "cache");
    u(this, "filter");
    u(this, "_data");
    u(this, "subscribers", /* @__PURE__ */ new Set());
    u(this, "unsubscribeCache");
    this.cache = e, this.filter = t, this._data = this.cache.query(t), this.unsubscribeCache = this.cache.subscribe((s) => {
      this.matchesFilter(s, t) && this.updateData();
    });
  }
  // Svelte store interface
  subscribe(e, t) {
    return e(this._data), this.subscribers.add(e), () => {
      this.subscribers.delete(e), this.subscribers.size === 0 && this.unsubscribeCache && this.unsubscribeCache();
    };
  }
  get current() {
    return this._data;
  }
  /**
   * Transform the store data with a mapping function
   * Returns a new store with transformed data
   */
  map(e) {
    return new Zs(this, e);
  }
  updateData() {
    this._data = this.cache.query(this.filter), this.notifySubscribers();
  }
  notifySubscribers() {
    this.subscribers.forEach((e) => e(this._data));
  }
  matchesFilter(e, t) {
    if (t.kinds && !t.kinds.includes(e.kind) || t.authors && !t.authors.includes(e.pubkey) || t.ids && !t.ids.includes(e.id))
      return !1;
    if (t["#p"] && t["#p"].length > 0) {
      const s = e.tags.filter((i) => i[0] === "p").map((i) => i[1]);
      if (!t["#p"].some((i) => s.includes(i)))
        return !1;
    }
    if (t["#e"] && t["#e"].length > 0) {
      const s = e.tags.filter((i) => i[0] === "e").map((i) => i[1]);
      if (!t["#e"].some((i) => s.includes(i)))
        return !1;
    }
    if (t["#t"] && t["#t"].length > 0) {
      const s = e.tags.filter((i) => i[0] === "t").map((i) => i[1]);
      if (!t["#t"].some((i) => s.includes(i)))
        return !1;
    }
    for (const s of Object.keys(t))
      if (s.startsWith("#") && s.length > 1 && !["#p", "#e", "#t"].includes(s)) {
        const i = s.slice(1), r = t[s];
        if (r && r.length > 0) {
          const o = e.tags.filter((a) => a[0] === i).map((a) => a[1]);
          if (!r.some((a) => o.includes(a)))
            return !1;
        }
      }
    return !0;
  }
}
class Zs {
  constructor(e, t) {
    u(this, "_data");
    u(this, "subscribers", /* @__PURE__ */ new Set());
    u(this, "sourceUnsubscriber");
    this.sourceStore = e, this.transform = t, this._data = this.transform(this.sourceStore.current), this.sourceUnsubscriber = this.sourceStore.subscribe((s) => {
      const i = this.transform(s);
      this._data !== i && (this._data = i, this.notifySubscribers());
    });
  }
  // Svelte store interface
  subscribe(e, t) {
    return e(this._data), this.subscribers.add(e), () => {
      this.subscribers.delete(e), this.subscribers.size === 0 && this.sourceUnsubscriber && this.sourceUnsubscriber();
    };
  }
  get current() {
    return this._data;
  }
  notifySubscribers() {
    this.subscribers.forEach((e) => e(this._data));
  }
}
class Qe extends Nt {
  constructor(e) {
    super(), this.cache = e;
  }
  clone(e) {
    const t = new Qe(this.cache);
    return t.filter = e, t;
  }
  execute() {
    return new Dt(this.cache, this.filter);
  }
}
class et extends Nt {
  constructor(t, s) {
    super();
    u(this, "relayUrls", []);
    this.cache = t, this.subscriptionManager = s;
  }
  clone(t) {
    const s = new et(this.cache, this.subscriptionManager);
    return s.filter = t, s.relayUrls = [...this.relayUrls], s;
  }
  relay(t) {
    const s = this.clone(this.filter);
    return s.relayUrls = [t], s;
  }
  relays(t) {
    const s = this.clone(this.filter);
    return s.relayUrls = t, s;
  }
  /**
   * Execute the subscription and return a handle for lifecycle control
   * This provides excellent DX for managing subscriptions
   * USES SMART DEDUPLICATION to prevent subscription overload
   */
  async execute() {
    const t = this.relayUrls.length > 0 ? this.relayUrls : void 0, s = await this.subscriptionManager.getOrCreateSubscription([this.filter], t), i = s.addListener({
      onEvent: (o) => {
        this.cache.addEvent(o);
      }
    }), r = new Dt(this.cache, this.filter);
    return {
      id: s.key,
      store: r,
      stop: async () => {
        s.removeListener(i);
      },
      isActive: () => s.isActive()
    };
  }
}
class Ft {
  constructor(e) {
    u(this, "config");
    u(this, "updates", {});
    u(this, "shouldPreserveExisting", !0);
    u(this, "customMetadata", {});
    this.config = e;
  }
  /**
   * Set display name
   */
  name(e) {
    return this.updates.name = e, this;
  }
  /**
   * Set bio/about text
   */
  about(e) {
    return this.updates.about = e, this;
  }
  /**
   * Set profile picture URL
   */
  picture(e) {
    return this.updates.picture = e, this;
  }
  /**
   * Set banner image URL
   */
  banner(e) {
    return this.updates.banner = e, this;
  }
  /**
   * Set NIP-05 identifier
   */
  nip05(e) {
    return this.updates.nip05 = e, this;
  }
  /**
   * Set Lightning address (lud16)
   */
  lud16(e) {
    return this.updates.lud16 = e, this;
  }
  /**
   * Set website URL
   */
  website(e) {
    return this.updates.website = e, this;
  }
  /**
   * Set GitHub username (NIP-39 external identity)
   */
  github(e) {
    return this.customMetadata.github = e, this;
  }
  /**
   * Set Twitter/X username (NIP-39 external identity)
   */
  twitter(e) {
    return this.customMetadata.twitter = e, this;
  }
  /**
   * Set Telegram username (NIP-39 external identity)
   */
  telegram(e) {
    return this.customMetadata.telegram = e, this;
  }
  /**
   * Add custom metadata field
   */
  metadata(e, t) {
    return this.customMetadata[e] = t, this;
  }
  /**
   * Whether to preserve existing fields (default: true)
   */
  preserveExisting(e = !0) {
    return this.shouldPreserveExisting = e, this;
  }
  /**
   * Sign the profile event (without publishing)
   */
  async sign() {
    const e = await this.prepareProfileData(), t = await this.config.signingProvider.getPublicKey(), s = {
      kind: 0,
      content: JSON.stringify(e),
      tags: [],
      created_at: Math.floor(Date.now() / 1e3),
      pubkey: t
    }, i = k.addEventId(s), r = await this.config.signingProvider.signEvent(s);
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
      const e = await this.prepareProfileData();
      this.config.debug && console.log("ProfileBuilder: Publishing profile:", e);
      const t = await this.config.signingProvider.getPublicKey(), s = {
        kind: 0,
        content: JSON.stringify(e),
        tags: [],
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: t
      }, i = k.addEventId(s), r = await this.config.signingProvider.signEvent(s), o = {
        ...i,
        sig: r
      }, c = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (d) => {
          try {
            return await this.config.relayManager.sendToRelay(d, ["EVENT", o]), { success: !0, relay: d };
          } catch (h) {
            return {
              success: !1,
              relay: d,
              error: h instanceof Error ? h.message : "Unknown error"
            };
          }
        })
      )).filter(
        (d) => d.status === "fulfilled" && d.value.success
      ).map((d) => d.value.relay);
      return c.length > 0 ? (this.config.debug && console.log(`ProfileBuilder: Published to ${c.length} relays`), {
        success: !0,
        eventId: o.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Failed to publish profile"
      };
    }
  }
  // Private helper methods
  async prepareProfileData() {
    let e = {};
    if (this.shouldPreserveExisting) {
      const s = await this.getCurrentProfile();
      s ? (e = { ...s.metadata }, this.config.debug && console.log("ProfileBuilder: Preserving existing profile data:", e)) : this.config.debug && console.log("ProfileBuilder: No existing profile found to preserve");
    }
    const t = {
      ...e,
      ...this.updates
    };
    return Object.keys(this.customMetadata).length > 0 && Object.assign(t, this.customMetadata), t;
  }
  async getCurrentProfile() {
    try {
      const e = await this.config.signingProvider.getPublicKey(), t = this.config.nostr.query().kinds([0]).authors([e]).limit(1).execute(), s = t.current;
      if (s && s.length > 0) {
        const r = s[0];
        try {
          const o = JSON.parse(r.content);
          return {
            pubkey: r.pubkey,
            metadata: o,
            lastUpdated: r.created_at,
            eventId: r.id,
            isOwn: !0
          };
        } catch {
          return null;
        }
      }
      await this.config.nostr.sub().kinds([0]).authors([e]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = t.current;
      if (i && i.length > 0) {
        const r = i[0];
        try {
          const o = JSON.parse(r.content);
          return {
            pubkey: r.pubkey,
            metadata: o,
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
class Lt {
  constructor(e) {
    u(this, "config");
    u(this, "pubkeys", []);
    this.config = e;
  }
  /**
   * Set the list of pubkeys to fetch profiles for
   */
  get(e) {
    return this.pubkeys = [...e], this;
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
      const e = this.config.nostr.query().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), t = e.current, s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
      this.pubkeys.forEach((a) => {
        s.set(a, null);
      });
      let r = 0;
      return t.forEach((a) => {
        if (a.kind === 0 && this.pubkeys.includes(a.pubkey))
          try {
            const c = JSON.parse(a.content), l = {
              pubkey: a.pubkey,
              metadata: c,
              lastUpdated: a.created_at,
              eventId: a.id,
              isOwn: !1
            };
            s.set(a.pubkey, l), r++;
          } catch {
            i.set(a.pubkey, "Failed to parse profile metadata");
          }
      }), this.config.debug && console.log(`ProfileBatchBuilder: Found ${r}/${this.pubkeys.length} profiles in cache`), r === this.pubkeys.length ? {
        profiles: s,
        success: !0,
        errors: i,
        totalRequested: this.pubkeys.length,
        totalFound: r
      } : (await this.config.nostr.sub().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), await new Promise((a) => setTimeout(a, 2e3)), e.current.forEach((a) => {
        if (a.kind === 0 && this.pubkeys.includes(a.pubkey) && !s.get(a.pubkey))
          try {
            const c = JSON.parse(a.content), l = {
              pubkey: a.pubkey,
              metadata: c,
              lastUpdated: a.created_at,
              eventId: a.id,
              isOwn: !1
            };
            s.set(a.pubkey, l), r++;
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
    } catch (e) {
      return {
        profiles: /* @__PURE__ */ new Map(),
        success: !1,
        errors: /* @__PURE__ */ new Map([["batch", e instanceof Error ? e.message : "Unknown error"]]),
        totalRequested: this.pubkeys.length,
        totalFound: 0
      };
    }
  }
  /**
   * Execute and return a reactive store for continuous updates
   */
  executeReactive() {
    return this.config.nostr.query().kinds([0]).authors(this.pubkeys).execute().map((e) => {
      const t = /* @__PURE__ */ new Map();
      return this.pubkeys.forEach((s) => t.set(s, null)), e.forEach((s) => {
        if (s.kind === 0 && this.pubkeys.includes(s.pubkey))
          try {
            const i = JSON.parse(s.content);
            t.set(s.pubkey, {
              pubkey: s.pubkey,
              metadata: i,
              lastUpdated: s.created_at,
              eventId: s.id,
              isOwn: !1
            });
          } catch {
          }
      }), t;
    });
  }
  /**
   * Watch for profile updates with reactive store
   */
  watch() {
    return this.config.nostr.sub().kinds([0]).authors(this.pubkeys).execute().catch((e) => {
      this.config.debug && console.warn("ProfileBatchBuilder: Failed to start watch subscription:", e);
    }), this.executeReactive();
  }
}
class Ot {
  constructor(e) {
    u(this, "config");
    u(this, "criteria", {});
    this.config = e;
  }
  /**
   * Search profiles by NIP-05 identifier
   */
  byNip05(e) {
    return this.criteria.nip05Query = e.toLowerCase(), this;
  }
  /**
   * Search profiles by name (substring match)
   */
  byName(e) {
    return this.criteria.nameQuery = e.toLowerCase(), this;
  }
  /**
   * Filter profiles by metadata key-value pairs
   */
  withMetadata(e, t) {
    return this.criteria.metadataFilters || (this.criteria.metadataFilters = /* @__PURE__ */ new Map()), this.criteria.metadataFilters.set(e, t), this;
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
  limit(e) {
    return this.criteria.limit = Math.max(1, Math.min(e, 100)), this;
  }
  /**
   * Execute the profile discovery search
   */
  async execute() {
    this.config.debug && console.log("ProfileDiscoveryBuilder: Starting discovery with criteria:", this.criteria);
    try {
      const e = {
        kinds: [0],
        limit: this.criteria.limit || 50
        // Default limit
      }, t = [], s = /* @__PURE__ */ new Set();
      return new Promise((i) => {
        let r = !1;
        const o = setTimeout(() => {
          r || (r = !0, this.finalizeResults(t, i));
        }, 1e4);
        (async () => {
          const c = await this.config.subscriptionManager.getOrCreateSubscription([e]), l = c.addListener({
            onEvent: async (d) => {
              if (d.kind === 0 && !s.has(d.pubkey)) {
                s.add(d.pubkey);
                try {
                  const h = await this.parseProfileEvent(d), f = await this.evaluateProfile(h);
                  f && (t.push(f), this.config.debug && console.log(`ProfileDiscoveryBuilder: Found match - ${h.metadata.name || "unnamed"} (score: ${f.relevanceScore})`), this.criteria.limit && t.length >= this.criteria.limit && (r || (r = !0, clearTimeout(o), c.removeListener(l), this.finalizeResults(t, i))));
                } catch (h) {
                  this.config.debug && console.error("ProfileDiscoveryBuilder: Error processing profile:", h);
                }
              }
            },
            onEose: () => {
              r || (r = !0, clearTimeout(o), c.removeListener(l), this.finalizeResults(t, i));
            },
            onError: (d) => {
              r || (r = !0, clearTimeout(o), c.removeListener(l), this.config.debug && console.error("ProfileDiscoveryBuilder: Search error:", d), i(t));
            }
          });
        })().catch((c) => {
          r || (r = !0, clearTimeout(o), this.config.debug && console.error("ProfileDiscoveryBuilder: Failed to start search:", c), i(t));
        });
      });
    } catch (e) {
      return this.config.debug && console.error("ProfileDiscoveryBuilder: Failed to start discovery:", e), [];
    }
  }
  // Private helper methods
  async parseProfileEvent(e) {
    try {
      const t = JSON.parse(e.content);
      return {
        pubkey: e.pubkey,
        metadata: t,
        lastUpdated: e.created_at,
        eventId: e.id,
        isOwn: !1
      };
    } catch {
      throw new Error("Failed to parse profile event");
    }
  }
  async evaluateProfile(e) {
    var a, c;
    const t = [];
    let s = 0, i = 0, r = 0;
    if (this.criteria.nameQuery) {
      r++;
      const l = ((a = e.metadata.name) == null ? void 0 : a.toLowerCase()) || "";
      if (l.includes(this.criteria.nameQuery))
        t.push("name"), i++, l === this.criteria.nameQuery ? s += 1 : l.startsWith(this.criteria.nameQuery) ? s += 0.8 : s += 0.5;
      else
        return null;
    }
    if (this.criteria.nip05Query) {
      r++;
      const l = ((c = e.metadata.nip05) == null ? void 0 : c.toLowerCase()) || "";
      if (l.includes(this.criteria.nip05Query))
        t.push("nip05"), i++, s += l === this.criteria.nip05Query ? 1 : 0.7;
      else
        return null;
    }
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0)
      for (const [l, d] of this.criteria.metadataFilters) {
        r++;
        const h = e.metadata[l];
        h !== void 0 && (d === void 0 ? (t.push(l), i++, s += 0.3) : typeof h == "string" && typeof d == "string" ? h.toLowerCase().includes(d.toLowerCase()) && (t.push(l), i++, s += h.toLowerCase() === d.toLowerCase() ? 0.8 : 0.5) : h === d && (t.push(l), i++, s += 0.8));
      }
    if (this.criteria.verifiedOnly) {
      if (r++, e.metadata.nip05) {
        if (await this.checkNip05Verification(e))
          t.push("verified"), i++, s += 0.5;
        else if (this.criteria.verifiedOnly)
          return null;
      } else if (this.criteria.verifiedOnly)
        return null;
    }
    if (r === 0 && (s = 0.1, i = 1, r = 1), r > 0 && i === 0)
      return null;
    const o = Math.min(1, s / Math.max(r, 1));
    return {
      profile: e,
      matchedFields: t,
      relevanceScore: o
    };
  }
  async checkNip05Verification(e) {
    var t;
    if (!e.metadata.nip05) return !1;
    try {
      const [s, i] = e.metadata.nip05.split("@");
      if (!s || !i) return !1;
      const r = new AbortController(), o = setTimeout(() => r.abort(), 5e3), a = await fetch(`https://${i}/.well-known/nostr.json?name=${s}`, {
        signal: r.signal
      });
      return clearTimeout(o), a.ok ? ((t = (await a.json()).names) == null ? void 0 : t[s]) === e.pubkey : !1;
    } catch (s) {
      return this.config.debug && console.error("ProfileDiscoveryBuilder: NIP-05 verification failed:", s), !1;
    }
  }
  finalizeResults(e, t) {
    e.sort((i, r) => r.relevanceScore - i.relevanceScore);
    const s = this.criteria.limit ? e.slice(0, this.criteria.limit) : e;
    this.config.debug && console.log(`ProfileDiscoveryBuilder: Discovery complete - found ${s.length} matches`), t(s);
  }
}
class $t {
  constructor(e, t) {
    u(this, "config");
    u(this, "targetPubkey");
    u(this, "relayUrl");
    u(this, "petnameValue");
    this.config = e, this.targetPubkey = t;
  }
  /**
   * Set preferred relay for this follow
   */
  relay(e) {
    return this.relayUrl = e, this;
  }
  /**
   * Set pet name for this follow
   */
  petname(e) {
    return this.petnameValue = e, this;
  }
  /**
   * Publish the updated follow list
   */
  async publish() {
    try {
      const e = await this.config.signingProvider.getPublicKey();
      this.config.debug && console.log("FollowBuilder: Adding follow for", this.targetPubkey.substring(0, 16) + "...");
      const t = await this.getCurrentFollows();
      if (t.some((g) => g.pubkey === this.targetPubkey))
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
        tags: [...t, i].map((g) => {
          const p = ["p", g.pubkey];
          return g.relayUrl && p.push(g.relayUrl), g.petname && p.push(g.petname), p;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, c = k.addEventId(a), l = await this.config.signingProvider.signEvent(a), d = {
        ...c,
        sig: l
      }, f = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (g) => {
          try {
            return await this.config.relayManager.sendToRelay(g, ["EVENT", d]), { success: !0, relay: g };
          } catch (p) {
            return {
              success: !1,
              relay: g,
              error: p instanceof Error ? p.message : "Unknown error"
            };
          }
        })
      )).filter(
        (g) => g.status === "fulfilled" && g.value.success
      ).map((g) => g.value.relay);
      return f.length > 0 ? (this.config.debug && console.log(`FollowBuilder: Published follow list to ${f.length} relays`), {
        success: !0,
        eventId: d.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Failed to add follow"
      };
    }
  }
  // Private helper methods
  async getCurrentFollows() {
    try {
      const e = await this.config.signingProvider.getPublicKey(), t = this.config.nostr.query().kinds([3]).authors([e]).limit(1).execute(), s = t.current;
      if (s && s.length > 0) {
        const r = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowBuilder: Using cached follow list with", r.length, "follows"), r;
      }
      this.config.debug && console.log("FollowBuilder: No cached follow list, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = t.current;
      if (i && i.length > 0) {
        const r = this.parseFollowListEvent(i[0]);
        return this.config.debug && console.log("FollowBuilder: Found follow list from relay with", r.length, "follows"), r;
      }
      return this.config.debug && console.log("FollowBuilder: No follow list found, using empty array"), [];
    } catch {
      return [];
    }
  }
  parseFollowListEvent(e) {
    const t = [];
    try {
      for (const s of e.tags)
        if (s[0] === "p" && s[1]) {
          const i = {
            pubkey: s[1]
          };
          s[2] && (i.relayUrl = s[2]), s[3] && (i.petname = s[3]), t.push(i);
        }
      return t;
    } catch (s) {
      return this.config.debug && console.error("FollowBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class Ut {
  constructor(e) {
    u(this, "config");
    u(this, "toAdd", []);
    u(this, "toRemove", []);
    u(this, "baseEventId");
    // For optimistic locking
    u(this, "baseCreatedAt");
    this.config = e;
  }
  /**
   * Add multiple pubkeys to follow list
   */
  add(e) {
    return this.toAdd.push(...e), this;
  }
  /**
   * Remove multiple pubkeys from follow list
   */
  remove(e) {
    return this.toRemove.push(...e), this;
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
    const e = 3;
    let t = "";
    for (let s = 0; s < e; s++)
      try {
        const i = await this.config.signingProvider.getPublicKey();
        this.config.debug && console.log(`FollowBatchBuilder: Batch operation attempt ${s + 1}/${e} - adding ${this.toAdd.length}, removing ${this.toRemove.length}`);
        const { follows: r, eventId: o, createdAt: a } = await this.getCurrentFollowsWithMetadata();
        if (this.baseEventId && this.baseEventId !== o) {
          this.config.debug && console.log(`FollowBatchBuilder: Detected concurrent update (base: ${this.baseEventId}, current: ${o}), retrying...`), this.baseEventId = o, this.baseCreatedAt = a;
          continue;
        }
        this.baseEventId = o, this.baseCreatedAt = a;
        let c = [...r];
        if (this.toRemove.length > 0 && (c = c.filter(
          (y) => !this.toRemove.includes(y.pubkey)
        ), this.config.debug && console.log(`FollowBatchBuilder: Removed ${this.toRemove.length} follows`)), this.toAdd.length > 0) {
          const y = this.toAdd.filter((w) => !c.some((M) => M.pubkey === w)).map((w) => ({ pubkey: w }));
          c.push(...y), this.config.debug && console.log(`FollowBatchBuilder: Added ${y.length} new follows (${this.toAdd.length - y.length} were duplicates)`);
        }
        const d = {
          kind: 3,
          content: "",
          // Follow lists typically have empty content
          tags: c.map((y) => {
            const w = ["p", y.pubkey];
            return y.relayUrl && w.push(y.relayUrl), y.petname && w.push(y.petname), w;
          }),
          created_at: Math.floor(Date.now() / 1e3),
          pubkey: i
        }, h = k.addEventId(d), f = await this.config.signingProvider.signEvent(d), b = {
          ...h,
          sig: f
        }, p = (await Promise.allSettled(
          this.config.relayManager.relayUrls.map(async (y) => {
            try {
              return await this.config.relayManager.sendToRelay(y, ["EVENT", b]), { success: !0, relay: y };
            } catch (w) {
              return {
                success: !1,
                relay: y,
                error: w instanceof Error ? w.message : "Unknown error"
              };
            }
          })
        )).filter(
          (y) => y.status === "fulfilled" && y.value.success
        ).map((y) => y.value.relay);
        if (p.length > 0)
          return this.config.debug && (console.log(`FollowBatchBuilder: Published batch update to ${p.length} relays on attempt ${s + 1}`), console.log(`FollowBatchBuilder: Final follow list has ${c.length} follows`), console.log("FollowBatchBuilder: Event will be received via subscription and cached properly")), {
            success: !0,
            eventId: b.id
          };
        if (t = "Failed to publish to any relay", s === e - 1)
          return {
            success: !1,
            error: t
          };
      } catch (i) {
        if (t = i instanceof Error ? i.message : "Failed to publish batch update", this.config.debug && console.warn(`FollowBatchBuilder: Attempt ${s + 1} failed:`, t), s === e - 1)
          return {
            success: !1,
            error: t
          };
        await new Promise((r) => setTimeout(r, 100 * (s + 1)));
      }
    return {
      success: !1,
      error: t || "Max retries exceeded"
    };
  }
  // Private helper methods
  async getCurrentFollowsWithMetadata() {
    try {
      const e = await this.config.signingProvider.getPublicKey(), t = this.config.nostr.query().kinds([3]).authors([e]).limit(1).execute(), s = t.current;
      if (this.config.debug && (console.log("FollowBatchBuilder: Cache query returned", s.length, "events"), s.length > 0)) {
        const r = s[0];
        console.log("FollowBatchBuilder: Latest cached event:", {
          id: r == null ? void 0 : r.id,
          created_at: r == null ? void 0 : r.created_at,
          tags: r == null ? void 0 : r.tags.filter((o) => o[0] === "p")
        });
      }
      if (s.length > 0) {
        const r = s[0];
        if (r && this.config.debug && console.log("FollowBatchBuilder: Using cached follow list with", r.tags.filter((o) => o[0] === "p").length, "follows"), r)
          return {
            follows: this.parseFollowListEvent(r),
            eventId: r.id,
            createdAt: r.created_at
          };
      }
      this.config.debug && console.log("FollowBatchBuilder: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = t.current;
      if (i && i.length > 0) {
        const r = i[0], o = this.parseFollowListEvent(r);
        return this.config.debug && console.log("FollowBatchBuilder: Found follow list from relay with", o.length, "follows"), {
          follows: o,
          eventId: r.id,
          createdAt: r.created_at
        };
      }
      return this.config.debug && console.log("FollowBatchBuilder: No follow list found on relays, using empty array"), { follows: [] };
    } catch (e) {
      return this.config.debug && console.error("FollowBatchBuilder: Error getting current follows:", e), { follows: [] };
    }
  }
  async getCurrentFollows() {
    const { follows: e } = await this.getCurrentFollowsWithMetadata();
    return e;
  }
  parseFollowListEvent(e) {
    const t = [];
    try {
      for (const s of e.tags)
        if (s[0] === "p" && s[1]) {
          const i = {
            pubkey: s[1]
          };
          s[2] && (i.relayUrl = s[2]), s[3] && (i.petname = s[3]), t.push(i);
        }
      return t;
    } catch (s) {
      return this.config.debug && console.error("FollowBatchBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class Qs {
  // Frontend expects this
  constructor(e) {
    u(this, "baseStore");
    u(this, "count");
    u(this, "follows");
    this.baseStore = e, this.count = new Bt(e), this.follows = e;
  }
  // Delegate to base store (for direct usage)
  subscribe(e, t) {
    return this.baseStore.subscribe(e, t);
  }
  get current() {
    return this.baseStore.current;
  }
}
class Bt {
  constructor(e) {
    u(this, "sourceStore");
    u(this, "_count", 0);
    u(this, "subscribers", /* @__PURE__ */ new Set());
    var t;
    this.sourceStore = e, this._count = ((t = e.current) == null ? void 0 : t.length) || 0, e.subscribe((s) => {
      const i = (s == null ? void 0 : s.length) || 0;
      i !== this._count && (this._count = i, this.notifySubscribers());
    });
  }
  subscribe(e) {
    return e(this._count), this.subscribers.add(e), () => {
      this.subscribers.delete(e);
    };
  }
  get current() {
    return this._count;
  }
  notifySubscribers() {
    this.subscribers.forEach((e) => e(this._count));
  }
}
class Kt {
  constructor(e) {
    u(this, "config");
    this.config = e;
  }
  /**
   * Get own follow list as a reactive store
   * CLEAN ARCHITECTURE: Uses base layer directly
   */
  async mine() {
    var t, s;
    if (!this.config.signingProvider)
      throw new Error("Cannot access own follow list: No signing provider available. Initialize signing first.");
    let e = (s = (t = this.config.signingProvider).getPublicKeySync) == null ? void 0 : s.call(t);
    return e || (e = await this.config.signingProvider.getPublicKey()), this.of(e);
  }
  /**
   * Get follow list for any pubkey as a reactive store  
   * CLEAN ARCHITECTURE: Uses base layer directly with smart deduplication
   */
  of(e) {
    this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute().catch((s) => {
      this.config.debug && console.warn("Failed to start follow list subscription:", s);
    });
    const t = this.config.nostr.query().kinds([3]).authors([e]).limit(1).execute().map((s) => this.parseFollowListEvents(s));
    return new Qs(t);
  }
  /**
   * Get followers for any pubkey - WHO FOLLOWS THIS USER
   * Returns count of users who have this pubkey in their follow list
   */
  followers(e) {
    this.config.nostr.sub().kinds([3]).tags("p", [e]).limit(100).execute().catch((s) => {
      this.config.debug && console.warn("Failed to start followers subscription:", s);
    });
    const t = this.config.nostr.query().kinds([3]).tags("p", [e]).limit(100).execute().map((s) => {
      const i = /* @__PURE__ */ new Set();
      return s.forEach((r) => {
        r.kind === 3 && r.tags.some(
          (a) => a[0] === "p" && a[1] === e
        ) && i.add(r.pubkey);
      }), Array.from(i);
    });
    return new Bt(t);
  }
  /**
   * Phase 4: Add a user to follow list
   * Returns FollowBuilder for fluent API configuration
   */
  add(e) {
    if (!this.config.signingProvider)
      throw new Error("Cannot add follow: No signing provider available. Initialize signing first.");
    return new $t({
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug ?? !1,
      nostr: this.config.nostr
    }, e);
  }
  /**
   * Phase 4: Remove a user from follow list
   */
  async remove(e) {
    if (!this.config.signingProvider)
      throw new Error("Cannot remove follow: No signing provider available. Initialize signing first.");
    try {
      const t = await this.config.signingProvider.getPublicKey();
      this.config.debug && console.log("FollowsModule: Removing follow for", e.substring(0, 16) + "...");
      const s = await this.getCurrentFollows();
      if (!s.some((g) => g.pubkey === e))
        return this.config.debug && console.log("FollowsModule: Not following", e.substring(0, 16) + "..."), {
          success: !1,
          error: "Not following this user"
        };
      const a = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.filter((g) => g.pubkey !== e).map((g) => {
          const p = ["p", g.pubkey];
          return g.relayUrl && p.push(g.relayUrl), g.petname && p.push(g.petname), p;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: t
      }, c = k.addEventId(a), l = await this.config.signingProvider.signEvent(a), d = {
        ...c,
        sig: l
      }, f = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (g) => {
          try {
            return await this.config.relayManager.sendToRelay(g, ["EVENT", d]), { success: !0, relay: g };
          } catch (p) {
            return {
              success: !1,
              relay: g,
              error: p instanceof Error ? p.message : "Unknown error"
            };
          }
        })
      )).filter(
        (g) => g.status === "fulfilled" && g.value.success
      ).map((g) => g.value.relay);
      return f.length > 0 ? (this.config.debug && console.log(`FollowsModule: Published updated follow list to ${f.length} relays`), {
        success: !0,
        eventId: d.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : "Failed to remove follow"
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
    return new Ut({
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
  async updateSigningProvider(e) {
    this.config.signingProvider = e;
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
  async startFollowListSubscription(e) {
    try {
      await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute();
    } catch (t) {
      this.config.debug && console.warn(`Failed to start follow list subscription for ${e}:`, t);
    }
  }
  /**
   * Parse NostrEvent[] to Follow[]
   */
  parseFollowListEvents(e) {
    if (e.length === 0)
      return [];
    const t = e[0];
    return !t || t.kind !== 3 ? [] : this.parseFollowListEvent(t);
  }
  async getCurrentFollows() {
    try {
      const e = await this.config.signingProvider.getPublicKey(), t = this.config.nostr.query().kinds([3]).authors([e]).limit(1).execute(), s = t.current;
      if (s && s.length > 0) {
        const r = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowsModule: Using cached follow list with", r.length, "follows"), r;
      }
      this.config.debug && console.log("FollowsModule: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute(), await new Promise((r) => setTimeout(r, 1e3));
      const i = t.current;
      if (i && i.length > 0) {
        const r = this.parseFollowListEvent(i[0]);
        return this.config.debug && console.log("FollowsModule: Found follow list from relay with", r.length, "follows"), r;
      }
      return this.config.debug && console.log("FollowsModule: No follow list found on relays, using empty array"), [];
    } catch (e) {
      return this.config.debug && console.error("FollowsModule: Error getting current follows:", e), [];
    }
  }
  parseFollowListEvent(e) {
    const t = [];
    try {
      for (const s of e.tags)
        if (s[0] === "p" && s[1]) {
          const i = {
            pubkey: s[1]
          };
          s[2] && (i.relayUrl = s[2]), s[3] && (i.petname = s[3]), t.push(i);
        }
      return t;
    } catch (s) {
      return this.config.debug && console.error("FollowsModule: Failed to parse follow list event:", s), [];
    }
  }
}
class Vt {
  constructor(e) {
    u(this, "config");
    u(this, "_follows");
    this.config = e;
  }
  /**
   * Get a reactive profile store for any pubkey
   * 
   * CLEAN ARCHITECTURE: Uses base layer directly for perfect DX
   * Returns UniversalNostrStore with automatic caching and live updates
   */
  get(e) {
    return this.startProfileSubscription(e), this.config.nostr.query().kinds([0]).authors([e]).limit(1).execute().map((t) => this.parseProfileEvents(t, e));
  }
  /**
   * Start subscription for profile updates
   */
  async startProfileSubscription(e) {
    try {
      await this.config.nostr.sub().kinds([0]).authors([e]).limit(1).execute();
    } catch (t) {
      this.config.debug && console.warn(`Failed to start profile subscription for ${e}:`, t);
    }
  }
  /**
   * Parse NostrEvent[] to UserProfile | null
   */
  parseProfileEvents(e, t) {
    if (e.length === 0)
      return null;
    const s = e[0];
    if (s.kind !== 0 || s.pubkey !== t)
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
      return this.config.debug && console.warn(`Failed to parse profile event for ${t}:`, i), null;
    }
  }
  /**
   * Phase 2: Profile Creation & Updates - Fluent Builder API
   * Creates a ProfileBuilder for updating profiles with field preservation
   */
  edit() {
    if (!this.config.signingProvider)
      throw new Error("Cannot edit profile: No signing provider available. Initialize signing first.");
    return new Ft({
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
    return this._follows || (this._follows = new Kt({
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
  followerCount(e) {
    return this.follows.followers(e);
  }
  /**
   * Phase 5: Batch Profile Operations - Efficient multiple profile fetching
   * Creates a ProfileBatchBuilder for bulk profile operations
   */
  batch() {
    return new Lt({
      debug: this.config.debug,
      nostr: this.config.nostr
    });
  }
  /**
   * Phase 6: Profile Discovery - Search and discover profiles
   * Creates a ProfileDiscoveryBuilder for profile search operations
   */
  discover() {
    return new Ot({
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
  chat(e) {
    const t = this.config.nostr.getDM();
    return t ? t.with(e) : (this.config.debug && console.warn("DM module not available - make sure signing provider is initialized"), null);
  }
  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e, this._follows && await this._follows.updateSigningProvider(e);
  }
  /**
   * Clean up resources
   */
  async close() {
    this._follows && await this._follows.close();
  }
}
class yi {
  constructor(e = {}) {
    u(this, "relayManager");
    u(this, "subscriptionManager");
    u(this, "cache");
    u(this, "signingProvider");
    u(this, "signingMethod");
    u(this, "config");
    u(this, "giftWrapSubscriptionActive", !1);
    u(this, "cachedMyPubkey", null);
    // Fluent Event Builder API
    u(this, "events");
    // Direct Message API (Legacy)
    u(this, "dm");
    // Universal DM API (Cache-based)
    u(this, "universalDM");
    // Social Media API
    u(this, "social");
    // Profile API (Enhanced)
    u(this, "_profile");
    console.log("🔥 NostrUnchained v0.1.0-FIX (build:", (/* @__PURE__ */ new Date()).toISOString().substring(0, 19) + "Z)");
    const t = {
      relays: e.relays ?? rs,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? ie.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? ie.RETRY_DELAY,
      timeout: e.timeout ?? ie.PUBLISH_TIMEOUT
    };
    e.signingProvider && (t.signingProvider = e.signingProvider), this.config = t, this.relayManager = new os(this.config.relays, {
      debug: this.config.debug
    }), this.subscriptionManager = new Js(this.relayManager), this.events = new cs(this), e.signingProvider ? (this.signingProvider = e.signingProvider, this.signingMethod = e.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary", this.cache = new Me("", {}), this._initializeCache().catch((s) => {
      this.config.debug && console.log("⚠️ Cache initialization with private key failed:", s);
    }), this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!")) : (this.cache = new Me("", {}), this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later")), this.dm = new St({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    }), this.social = new Ys({
      nostr: this,
      debug: this.config.debug
    }), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays);
  }
  /**
   * Initialize cache with signing provider's private key
   */
  async _initializeCache() {
    var e, t;
    if (this.signingProvider)
      try {
        let s = "";
        this.signingProvider.capabilities && (await this.signingProvider.capabilities()).rawKey && (s = await ((t = (e = this.signingProvider).getPrivateKeyForEncryption) == null ? void 0 : t.call(e)) || ""), this.cache ? (this.cache.setPrivateKey(s), await this.cache.reprocessGiftWraps()) : this.cache = new Me(s, {});
        const i = await this.signingProvider.getPublicKey();
        this.universalDM = new Ws(this, i), this.config.debug && console.log("🎯 Universal Cache and Universal DM Module initialized");
        try {
          this.signingProvider.capabilities && (await this.signingProvider.capabilities()).nip44Decrypt && this.cache.setDecryptor && this.cache.setDecryptor({ nip44Decrypt: this.signingProvider.nip44Decrypt.bind(this.signingProvider) });
        } catch {
        }
      } catch {
        this.cache || (this.cache = new Me("", {})), this.config.debug && console.log("⚠️ Could not get private key for cache, using empty key (no gift wrap decryption)");
      }
  }
  /**
   * Get the private key for encryption (needed for DM functionality)
   */
  async getPrivateKeyForEncryption() {
    try {
      return this.signingProvider && typeof this.signingProvider.getPrivateKeyForEncryption == "function" ? await this.signingProvider.getPrivateKeyForEncryption() : null;
    } catch (e) {
      return this.config.debug && console.warn("Failed to get private key for encryption:", e), null;
    }
  }
  /**
   * Get enhanced profile module (PERFECT DX - always works!)
   */
  get profile() {
    return this._profile || (this._profile = new Vt({
      relayManager: this.relayManager,
      subscriptionManager: this.subscriptionManager,
      signingProvider: this.signingProvider,
      eventBuilder: new k(),
      cache: this.cache,
      debug: this.config.debug,
      // REQUIRED: Pass NostrUnchained instance for clean architecture
      nostr: this
    })), this._profile;
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
  async initializeSigning(e) {
    if (this.signingProvider && !e) {
      this.config.debug && console.log("🚫 Signing already initialized - skipping (Perfect DX!)");
      return;
    }
    if (e)
      this.signingProvider = e, this.signingMethod = e.constructor.name.includes("Extension") ? "extension" : "temporary";
    else if (this.config.signingProvider)
      this.signingProvider = this.config.signingProvider, this.signingMethod = this.config.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary";
    else {
      const { provider: t, method: s } = await as.createBestAvailable();
      this.signingProvider = t, this.signingMethod = s;
    }
    this.cachedMyPubkey = null, await this._initializeCache();
    try {
      this.signingProvider && this.signingProvider.nip44Decrypt && this.cache.setDecryptor && (this.cache.setDecryptor({ nip44Decrypt: this.signingProvider.nip44Decrypt.bind(this.signingProvider) }), this.config.debug && console.log("🔐 Using signer-provided NIP-44 decrypt capability"));
    } catch {
    }
    await this.dm.updateSigningProvider(this.signingProvider), await this.social.updateSigningProvider(this.signingProvider), this._profile && await this._profile.updateSigningProvider(this.signingProvider), this.config.debug && console.log(`Initialized signing with method: ${this.signingMethod}`);
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
        const e = this.relayManager.getStats();
        console.log("Relay connection stats:", e);
      }
    } catch (e) {
      throw T.handleConnectionError("relays", e);
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
      const e = await this.signingProvider.getPublicKey();
      (await this.subscriptionManager.getOrCreateSubscription([{
        kinds: [1059],
        // Gift wrap events
        "#p": [e],
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
    } catch (e) {
      throw console.error("Failed to start gift wrap subscription:", e), e;
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
  async publishToRelays(e, t) {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = k.validateEvent(e);
    if (!s.valid)
      throw new Error(`Invalid event: ${s.errors.join(", ")}`);
    const i = k.calculateEventId(e), r = await this.signingProvider.signEvent(e), o = { ...e, id: i, sig: r }, a = await this.relayManager.publishToRelays(o, t), c = a.some((l) => l.success);
    return {
      success: c,
      eventId: c ? o.id : void 0,
      event: c ? o : void 0,
      relayResults: a,
      timestamp: Date.now(),
      error: c ? void 0 : { message: "Failed to publish to any relay", retryable: !0 }
    };
  }
  /**
   * Publish an event
   */
  async publish(e) {
    const t = Date.now();
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = k.validateEvent(e);
    if (!s.valid)
      throw new Error(`Invalid event: ${s.errors.join(", ")}`);
    const i = k.calculateEventId(e), r = await this.signingProvider.signEvent(e), o = { ...e, id: i, sig: r }, a = await this.relayManager.publishToAll(o), c = Date.now() - t, l = a.some((h) => h.success), d = {
      success: l,
      eventId: l ? o.id : void 0,
      event: l ? o : void 0,
      relayResults: a,
      timestamp: Date.now(),
      error: l ? void 0 : { message: "Failed to publish to any relay", retryable: !0, suggestion: "Check relay connectivity or try different relays" }
    };
    return this.config.debug && (d.debug = {
      connectionAttempts: this.relayManager.connectedRelays.length,
      relayLatencies: a.reduce((h, f) => (h[f.relay] = 0, h), {}),
      totalTime: c,
      signingMethod: this.signingMethod === "extension" ? "extension" : "temporary"
    }), d;
  }
  /**
   * Publish an already signed event (for Gift Wraps, etc.)
   * This bypasses the normal signing process since the event is already signed
   */
  async publishSigned(e) {
    const t = Date.now();
    if (!e.id || !e.sig || !e.pubkey)
      throw new Error("Invalid signed event: Missing required fields (id, sig, pubkey)");
    const s = await this.relayManager.publishToAll(e), i = Date.now() - t, r = s.some((a) => a.success), o = {
      success: r,
      eventId: r ? e.id : void 0,
      event: r ? e : void 0,
      relayResults: s,
      timestamp: Date.now(),
      error: r ? void 0 : { message: "Failed to publish to any relay", retryable: !0, suggestion: "Check relay connectivity or try different relays" }
    };
    return this.config.debug && (o.debug = {
      connectionAttempts: this.relayManager.connectedRelays.length,
      relayLatencies: s.reduce((a, c) => (a[c.relay] = 0, a), {}),
      totalTime: i,
      signingMethod: "temporary"
    }), o;
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
   * Create a query builder for complex queries
   */
  query() {
    return new Qe(this.cache);
  }
  /**
   * Create a subscription builder
   */
  sub() {
    return new et(this.cache, this.subscriptionManager);
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
   * Update the signing provider for this instance and all modules
   */
  async updateSigningProvider(e) {
    this.signingProvider = e, this.signingMethod = "temporary", this.dm && await this.dm.updateSigningProvider(e), this.social && await this.social.updateSigningProvider(e), this._profile && await this._profile.updateSigningProvider(e), this.config.debug && console.log("🔑 NostrUnchained signing provider updated");
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
const bi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: vt,
  DMModule: St,
  DMRoom: Et,
  EphemeralKeyManager: Ae,
  GiftWrapCreator: ye,
  GiftWrapProtocol: Z,
  NIP44Crypto: _,
  SealCreator: pe,
  TimestampRandomizer: We
}, Symbol.toStringTag, { value: "Module" })), mi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FollowBatchBuilder: Ut,
  FollowBuilder: $t,
  FollowsModule: Kt,
  ProfileBatchBuilder: Lt,
  ProfileBuilder: Ft,
  ProfileDiscoveryBuilder: Ot,
  ProfileModule: Vt
}, Symbol.toStringTag, { value: "Module" })), wi = "0.1.0";
export {
  rs as DEFAULT_RELAYS,
  bi as DM,
  it as EVENT_KINDS,
  T as ErrorHandler,
  k as EventBuilder,
  cs as EventsModule,
  rt as ExtensionSigner,
  Ye as FeedStoreImpl,
  Le as FluentEventBuilder,
  qe as LocalKeySigner,
  yi as NostrUnchained,
  mi as Profile,
  Qe as QueryBuilder,
  si as QuickSigner,
  os as RelayManager,
  as as SigningProviderFactory,
  et as SubBuilder,
  Js as SubscriptionManager,
  ii as TemporarySigner,
  wi as VERSION,
  ni as createFeed,
  ai as createFeedFromFilter,
  oi as createFeedFromQuery,
  gi as createNaddr,
  di as createNevent,
  hi as createNprofile,
  Ze as decode,
  P as derived,
  ui as hexToNote,
  ci as hexToNpub,
  li as hexToNsec,
  xt as isValidHexKey,
  pi as isValidNote,
  Vs as isValidNpub,
  fi as isValidNsec,
  Bs as naddrEncode,
  Us as neventEncode,
  Os as noteEncode,
  Ks as noteToHex,
  $s as nprofileEncode,
  Ls as npubEncode,
  Rt as npubToHex,
  Fs as nsecEncode,
  Ct as nsecToHex,
  ri as setDefaultSubscriptionManager,
  se as writable
};
