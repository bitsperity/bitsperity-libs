var Ot = Object.defineProperty;
var Ut = (n, e, t) => e in n ? Ot(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var u = (n, e, t) => Ut(n, typeof e != "symbol" ? e + "" : e, t);
import * as ne from "@noble/secp256k1";
import { getSharedSecret as $t } from "@noble/secp256k1";
const ue = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Bt(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function Be(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function de(n, ...e) {
  if (!Bt(n))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(n.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + n.length);
}
function Ge(n) {
  if (typeof n != "function" || typeof n.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Be(n.outputLen), Be(n.blockLen);
}
function Te(n, e = !0) {
  if (n.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && n.finished)
    throw new Error("Hash#digest() has already been called");
}
function Kt(n, e) {
  de(n);
  const t = e.outputLen;
  if (n.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function ye(...n) {
  for (let e = 0; e < n.length; e++)
    n[e].fill(0);
}
function Le(n) {
  return new DataView(n.buffer, n.byteOffset, n.byteLength);
}
function Z(n, e) {
  return n << 32 - e | n >>> e;
}
const ht = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", Vt = /* @__PURE__ */ Array.from({ length: 256 }, (n, e) => e.toString(16).padStart(2, "0"));
function Q(n) {
  if (de(n), ht)
    return n.toHex();
  let e = "";
  for (let t = 0; t < n.length; t++)
    e += Vt[n[t]];
  return e;
}
const J = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function qe(n) {
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
  if (ht)
    return Uint8Array.fromHex(n);
  const e = n.length, t = e / 2;
  if (e % 2)
    throw new Error("hex string expected, got unpadded hex of length " + e);
  const s = new Uint8Array(t);
  for (let i = 0, r = 0; i < t; i++, r += 2) {
    const o = qe(n.charCodeAt(r)), a = qe(n.charCodeAt(r + 1));
    if (o === void 0 || a === void 0) {
      const l = n[r] + n[r + 1];
      throw new Error('hex string expected, got non-hex character "' + l + '" at index ' + r);
    }
    s[i] = o * 16 + a;
  }
  return s;
}
function Wt(n) {
  if (typeof n != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(n));
}
function be(n) {
  return typeof n == "string" && (n = Wt(n)), de(n), n;
}
function Ht(...n) {
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
class dt {
}
function zt(n) {
  const e = (s) => n().update(be(s)).digest(), t = n();
  return e.outputLen = t.outputLen, e.blockLen = t.blockLen, e.create = () => n(), e;
}
function he(n = 32) {
  if (ue && typeof ue.getRandomValues == "function")
    return ue.getRandomValues(new Uint8Array(n));
  if (ue && typeof ue.randomBytes == "function")
    return Uint8Array.from(ue.randomBytes(n));
  throw new Error("crypto.getRandomValues must be defined");
}
function Gt(n, e, t, s) {
  if (typeof n.setBigUint64 == "function")
    return n.setBigUint64(e, t, s);
  const i = BigInt(32), r = BigInt(4294967295), o = Number(t >> i & r), a = Number(t & r), l = s ? 4 : 0, c = s ? 0 : 4;
  n.setUint32(e + l, o, s), n.setUint32(e + c, a, s);
}
function jt(n, e, t) {
  return n & e ^ ~n & t;
}
function Yt(n, e, t) {
  return n & e ^ n & t ^ e & t;
}
class Qt extends dt {
  constructor(e, t, s, i) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = i, this.buffer = new Uint8Array(e), this.view = Le(this.buffer);
  }
  update(e) {
    Te(this), e = be(e), de(e);
    const { view: t, buffer: s, blockLen: i } = this, r = e.length;
    for (let o = 0; o < r; ) {
      const a = Math.min(i - this.pos, r - o);
      if (a === i) {
        const l = Le(e);
        for (; i <= r - o; o += i)
          this.process(l, o);
        continue;
      }
      s.set(e.subarray(o, o + a), this.pos), this.pos += a, o += a, this.pos === i && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Te(this), Kt(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: i, isLE: r } = this;
    let { pos: o } = this;
    t[o++] = 128, ye(this.buffer.subarray(o)), this.padOffset > i - o && (this.process(s, 0), o = 0);
    for (let d = o; d < i; d++)
      t[d] = 0;
    Gt(s, i - 8, BigInt(this.length * 8), r), this.process(s, 0);
    const a = Le(e), l = this.outputLen;
    if (l % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const c = l / 4, h = this.get();
    if (c > h.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let d = 0; d < c; d++)
      a.setUint32(4 * d, h[d], r);
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
]), Xt = /* @__PURE__ */ Uint32Array.from([
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
class Zt extends Qt {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = ee[0] | 0, this.B = ee[1] | 0, this.C = ee[2] | 0, this.D = ee[3] | 0, this.E = ee[4] | 0, this.F = ee[5] | 0, this.G = ee[6] | 0, this.H = ee[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: i, E: r, F: o, G: a, H: l } = this;
    return [e, t, s, i, r, o, a, l];
  }
  // prettier-ignore
  set(e, t, s, i, r, o, a, l) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = i | 0, this.E = r | 0, this.F = o | 0, this.G = a | 0, this.H = l | 0;
  }
  process(e, t) {
    for (let d = 0; d < 16; d++, t += 4)
      te[d] = e.getUint32(t, !1);
    for (let d = 16; d < 64; d++) {
      const g = te[d - 15], p = te[d - 2], f = Z(g, 7) ^ Z(g, 18) ^ g >>> 3, y = Z(p, 17) ^ Z(p, 19) ^ p >>> 10;
      te[d] = y + te[d - 7] + f + te[d - 16] | 0;
    }
    let { A: s, B: i, C: r, D: o, E: a, F: l, G: c, H: h } = this;
    for (let d = 0; d < 64; d++) {
      const g = Z(a, 6) ^ Z(a, 11) ^ Z(a, 25), p = h + g + jt(a, l, c) + Xt[d] + te[d] | 0, y = (Z(s, 2) ^ Z(s, 13) ^ Z(s, 22)) + Yt(s, i, r) | 0;
      h = c, c = l, l = a, a = o + p | 0, o = r, r = i, i = s, s = p + y | 0;
    }
    s = s + this.A | 0, i = i + this.B | 0, r = r + this.C | 0, o = o + this.D | 0, a = a + this.E | 0, l = l + this.F | 0, c = c + this.G | 0, h = h + this.H | 0, this.set(s, i, r, o, a, l, c, h);
  }
  roundClean() {
    ye(te);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), ye(this.buffer);
  }
}
const Jt = /* @__PURE__ */ zt(() => new Zt()), oe = Jt, qt = [
  "ws://umbrel.local:4848",
  // Local testing relay (highest priority)
  "wss://relay.damus.io"
  // Single public relay fallback
], se = {
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
}, et = {
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
  CONTENT_TOO_LONG: `Keep your message under ${se.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: "Check your internet connection and try again",
  NO_EXTENSION: "Install a Nostr browser extension or the library will use a temporary key",
  PUBLISH_FAILED: "Try again or check if your relays are accessible"
}, Se = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class D {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(e, t) {
    return {
      pubkey: t,
      created_at: Math.floor(Date.now() / 1e3),
      kind: et.TEXT_NOTE,
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
    return Q(i);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(e) {
    const t = D.calculateEventId(e);
    return { ...e, id: t };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(e) {
    const t = [];
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !Se.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !Se.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !Se.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && t.push(R.EMPTY_CONTENT), e.content && e.content.length > se.MAX_CONTENT_LENGTH && t.push(R.CONTENT_TOO_LONG), e.created_at) {
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
  static validateContent(e) {
    const t = [];
    return e === "" && t.push(R.EMPTY_CONTENT), e.length > se.MAX_CONTENT_LENGTH && t.push(R.CONTENT_TOO_LONG), {
      valid: t.length === 0,
      errors: t
    };
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(e) {
    return D.calculateEventId({
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
    const i = D.validateContent(e);
    if (!i.valid)
      throw new Error(`Invalid content: ${i.errors.join(", ")}`);
    const r = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? et.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, o = D.validateEvent(r);
    if (!o.valid)
      throw new Error(`Invalid event: ${o.errors.join(", ")}`);
    return r;
  }
}
async function es() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class ts {
  constructor(e, t = {}) {
    u(this, "connections", /* @__PURE__ */ new Map());
    u(this, "debug");
    u(this, "messageHandler");
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
        const r = await es(), o = new r(e), a = setTimeout(() => {
          o.close(), t.state = "error", t.error = "Connection timeout", i(new Error(`Connection to ${e} timed out`));
        }, se.CONNECTION_TIMEOUT);
        o.onopen = () => {
          clearTimeout(a), t.ws = o, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, o.onerror = (l) => {
          clearTimeout(a), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, l), i(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, o.onclose = () => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`);
        }, o.onmessage = (l) => {
          this.handleRelayMessage(e, l.data);
        };
      } catch (r) {
        t.state = "error", t.error = r instanceof Error ? r.message : "Unknown error", i(r);
      }
    }));
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
      const o = s.ws, a = ["EVENT", t], l = setTimeout(() => {
        r(new Error("Publish timeout"));
      }, se.PUBLISH_TIMEOUT), c = t.id;
      this.pendingPublishes.set(c, { resolve: i, reject: r, timeout: l });
      try {
        const h = JSON.stringify(a);
        o.send(h), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", h), console.log("📤 Added to pending:", c));
      } catch (h) {
        clearTimeout(l), this.pendingPublishes.delete(c), r(h);
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
      return Se.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
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
}
class tt {
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(R.NO_EXTENSION);
    try {
      return await window.nostr.getPublicKey();
    } catch (e) {
      throw new Error(`Extension signing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
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
  static async isAvailable() {
    return typeof window < "u" && typeof window.nostr < "u" && typeof window.nostr.getPublicKey == "function" && typeof window.nostr.signEvent == "function";
  }
}
class je {
  constructor() {
    u(this, "privateKey");
    u(this, "publicKey");
    const e = he(32);
    this.privateKey = Q(e), this.publicKey = Q(ne.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = D.calculateEventId(e), s = await ne.schnorr.sign(t, this.privateKey);
    return Q(s);
  }
  /**
   * Get private key for NIP-44 encryption
   * WARNING: Only for testing/development. Production should use secure key derivation.
   */
  async getPrivateKeyForEncryption() {
    return this.privateKey;
  }
}
class Js extends je {
}
class qs extends je {
}
class ss {
  static async createBestAvailable() {
    if (await tt.isAvailable())
      try {
        const e = new tt();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new je(),
      method: "temporary"
    };
  }
}
class C {
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
    return e === "" ? C.createError("validation", R.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: ge.EMPTY_CONTENT
    }) : e.length > 8192 ? C.createError("validation", R.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: ge.CONTENT_TOO_LONG
    }) : C.createError("validation", R.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(e) {
    const t = e.message.toLowerCase();
    return t.includes("user declined") || t.includes("denied") ? C.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : t.includes("no extension") ? C.createError("signing", R.NO_EXTENSION, {
      retryable: !1,
      suggestion: ge.NO_EXTENSION
    }) : C.createError("signing", R.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(e, t) {
    const s = t.message.toLowerCase();
    return s.includes("timeout") ? C.createError("network", `Connection to ${e} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? C.createError("network", `Failed to connect to ${e}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : C.createError("network", R.CONNECTION_FAILED, {
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
        error: C.createError("config", R.NO_RELAYS, {
          retryable: !1,
          suggestion: "Configure at least one relay URL"
        })
      };
    if (s.length === 0) {
      const r = i.every(
        (a) => {
          var l;
          return (l = a.error) == null ? void 0 : l.toLowerCase().includes("timeout");
        }
      ), o = i.every(
        (a) => {
          var l, c;
          return ((l = a.error) == null ? void 0 : l.toLowerCase().includes("connect")) || ((c = a.error) == null ? void 0 : c.toLowerCase().includes("refused"));
        }
      );
      return r ? {
        success: !1,
        error: C.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : o ? {
        success: !1,
        error: C.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: C.createError("relay", R.PUBLISH_FAILED, {
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
class is {
  constructor(e) {
    u(this, "eventData");
    u(this, "nostrInstance");
    // NostrUnchained instance for publishing
    u(this, "signed", !1);
    u(this, "signedEvent");
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
   * Explicitly sign the event (optional - auto-signs on publish)
   */
  async sign() {
    if (!this.eventData.content)
      throw new Error("Content is required before signing");
    const e = await this.nostrInstance.createEvent({
      kind: this.eventData.kind,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at
    });
    return this.signedEvent = e, this.signed = !0, this;
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
    if (!this.eventData.content)
      throw new Error("Content is required before publishing");
    if (this.signed && this.signedEvent)
      return await this.nostrInstance.publishEvent(this.signedEvent);
    if (this.eventData.kind === 1 && this.eventData.tags.length === 0 && !this.eventData.created_at)
      return await this.nostrInstance.publish(this.eventData.content);
    const e = await this.nostrInstance.createEvent({
      kind: this.eventData.kind,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at
    });
    return await this.nostrInstance.publishEvent(e);
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
class rs {
  constructor(e) {
    u(this, "nostrInstance");
    this.nostrInstance = e;
  }
  /**
   * Create a new fluent event builder
   */
  create() {
    return new is(this.nostrInstance);
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
}
function I(n) {
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
function w(n, e) {
  const t = Array.isArray(n) ? n : [n], s = /* @__PURE__ */ new Set();
  let i, r = !1;
  const o = [], a = () => {
    if (t.length === 1) {
      const l = t[0].subscribe((c) => {
        const h = e(c);
        (!r || h !== i) && (i = h, r && s.forEach((d) => d(i)));
      });
      o.length === 0 && o.push(l);
    }
  };
  return {
    subscribe(l) {
      return r || (a(), r = !0), i !== void 0 && l(i), s.add(l), () => {
        s.delete(l), s.size === 0 && (o.forEach((c) => c()), o.length = 0, r = !1);
      };
    }
  };
}
function gt(n) {
  return {
    subscribe: n.subscribe.bind(n),
    derive: (e) => w(n, e)
  };
}
class we {
  constructor(e, t, s) {
    u(this, "_events");
    u(this, "_readIds", /* @__PURE__ */ new Set());
    u(this, "parent");
    this.parent = e, this._events = w(e.events, (i) => {
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
    return w(this._events, (e) => e.length);
  }
  get latest() {
    return w(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return w(this._events, (e) => e.length === 0);
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
    return gt(w(this._events, e));
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
    u(this, "_events", I([]));
    u(this, "_status", I("connecting"));
    u(this, "_error", I(null));
    u(this, "_loading", I(!1));
    u(this, "_count", I(0));
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
    return w(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return w(this._events, () => !0);
  }
  get isEmpty() {
    return w(this._events, (e) => e.length === 0);
  }
  // Lifecycle methods
  async close() {
    var e, t;
    (t = (e = this.subscription) == null ? void 0 : e.subscription) != null && t.id && await this.subscriptionManager.close(this.subscription.subscription.id), this._status.set("closed");
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
    return gt(w(this._events, e));
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
        onEvent: (t) => {
          this.handleEvent(t);
        },
        onEose: (t) => {
          this._status.set("active"), this._loading.set(!1);
        },
        onClose: (t) => {
          this._status.set("closed");
        }
      };
      this.subscription = await this.subscriptionManager.subscribe(
        this.filters,
        e
      ), this.subscription.success ? this._error.set(null) : (this._error.set(this.subscription.error || {
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
class ns {
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
function ei(n) {
  ce = n;
}
function ti() {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new ns(ce);
}
function si(n) {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = n.toFilter();
  return new Ye(ce, e);
}
function ii(n) {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new Ye(ce, [n]);
}
class ft extends dt {
  constructor(e, t) {
    super(), this.finished = !1, this.destroyed = !1, Ge(e);
    const s = be(t);
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
    this.oHash.update(r), ye(r);
  }
  update(e) {
    return Te(this), this.iHash.update(e), this;
  }
  digestInto(e) {
    Te(this), de(e, this.outputLen), this.finished = !0, this.iHash.digestInto(e), this.oHash.update(e), this.oHash.digestInto(e), this.destroy();
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
const me = (n, e, t) => new ft(n, e).update(t).digest();
me.create = (n, e) => new ft(n, e);
function os(n, e, t) {
  return Ge(n), t === void 0 && (t = new Uint8Array(n.outputLen)), me(n, be(t), be(e));
}
const Oe = /* @__PURE__ */ Uint8Array.from([0]), st = /* @__PURE__ */ Uint8Array.of();
function as(n, e, t, s = 32) {
  Ge(n), Be(s);
  const i = n.outputLen;
  if (s > 255 * i)
    throw new Error("Length should be <= 255*HashLen");
  const r = Math.ceil(s / i);
  t === void 0 && (t = st);
  const o = new Uint8Array(r * i), a = me.create(n, e), l = a._cloneInto(), c = new Uint8Array(a.outputLen);
  for (let h = 0; h < r; h++)
    Oe[0] = h + 1, l.update(h === 0 ? st : c).update(t).update(Oe).digestInto(c), o.set(c, i * h), a._cloneInto(l);
  return a.destroy(), l.destroy(), ye(c, Oe), o.slice(0, s);
}
const it = (n, e, t, s, i) => as(n, os(n, e, t), s, i);
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function cs(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function rt(n) {
  if (typeof n != "boolean")
    throw new Error(`boolean expected, not ${n}`);
}
function Ue(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function ve(n, ...e) {
  if (!cs(n))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(n.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + n.length);
}
function ie(n) {
  return new Uint32Array(n.buffer, n.byteOffset, Math.floor(n.byteLength / 4));
}
function ls(...n) {
  for (let e = 0; e < n.length; e++)
    n[e].fill(0);
}
function us(n, e) {
  if (e == null || typeof e != "object")
    throw new Error("options must be defined");
  return Object.assign(n, e);
}
function nt(n) {
  return Uint8Array.from(n);
}
const pt = (n) => Uint8Array.from(n.split("").map((e) => e.charCodeAt(0))), hs = pt("expand 16-byte k"), ds = pt("expand 32-byte k"), gs = ie(hs), fs = ie(ds);
function v(n, e) {
  return n << e | n >>> 32 - e;
}
function Ke(n) {
  return n.byteOffset % 4 === 0;
}
const Me = 64, ps = 16, yt = 2 ** 32 - 1, ot = new Uint32Array();
function ys(n, e, t, s, i, r, o, a) {
  const l = i.length, c = new Uint8Array(Me), h = ie(c), d = Ke(i) && Ke(r), g = d ? ie(i) : ot, p = d ? ie(r) : ot;
  for (let f = 0; f < l; o++) {
    if (n(e, t, s, h, o, a), o >= yt)
      throw new Error("arx: counter overflow");
    const y = Math.min(Me, l - f);
    if (d && y === Me) {
      const P = f / 4;
      if (f % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let E = 0, M; E < ps; E++)
        M = P + E, p[M] = g[M] ^ h[E];
      f += Me;
      continue;
    }
    for (let P = 0, E; P < y; P++)
      E = f + P, r[E] = i[E] ^ c[P];
    f += y;
  }
}
function bs(n, e) {
  const { allowShortKeys: t, extendNonceFn: s, counterLength: i, counterRight: r, rounds: o } = us({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
  if (typeof n != "function")
    throw new Error("core must be a function");
  return Ue(i), Ue(o), rt(r), rt(t), (a, l, c, h, d = 0) => {
    ve(a), ve(l), ve(c);
    const g = c.length;
    if (h === void 0 && (h = new Uint8Array(g)), ve(h), Ue(d), d < 0 || d >= yt)
      throw new Error("arx: counter overflow");
    if (h.length < g)
      throw new Error(`arx: output (${h.length}) is shorter than data (${g})`);
    const p = [];
    let f = a.length, y, P;
    if (f === 32)
      p.push(y = nt(a)), P = fs;
    else if (f === 16 && t)
      y = new Uint8Array(32), y.set(a), y.set(a, 16), P = gs, p.push(y);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${f}`);
    Ke(l) || p.push(l = nt(l));
    const E = ie(y);
    if (s) {
      if (l.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(P, E, ie(l.subarray(0, 16)), E), l = l.subarray(16);
    }
    const M = 16 - i;
    if (M !== l.length)
      throw new Error(`arx: nonce must be ${M} or 16 bytes`);
    if (M !== 12) {
      const q = new Uint8Array(12);
      q.set(l, r ? 0 : 12 - l.length), l = q, p.push(l);
    }
    const k = ie(l);
    return ys(n, P, E, k, c, h, d, o), ls(...p), h;
  };
}
function ws(n, e, t, s, i, r = 20) {
  let o = n[0], a = n[1], l = n[2], c = n[3], h = e[0], d = e[1], g = e[2], p = e[3], f = e[4], y = e[5], P = e[6], E = e[7], M = i, k = t[0], q = t[1], le = t[2], _ = o, F = a, x = l, L = c, O = h, U = d, $ = g, B = p, K = f, V = y, W = P, H = E, z = M, G = k, j = q, Y = le;
  for (let Je = 0; Je < r; Je += 2)
    _ = _ + O | 0, z = v(z ^ _, 16), K = K + z | 0, O = v(O ^ K, 12), _ = _ + O | 0, z = v(z ^ _, 8), K = K + z | 0, O = v(O ^ K, 7), F = F + U | 0, G = v(G ^ F, 16), V = V + G | 0, U = v(U ^ V, 12), F = F + U | 0, G = v(G ^ F, 8), V = V + G | 0, U = v(U ^ V, 7), x = x + $ | 0, j = v(j ^ x, 16), W = W + j | 0, $ = v($ ^ W, 12), x = x + $ | 0, j = v(j ^ x, 8), W = W + j | 0, $ = v($ ^ W, 7), L = L + B | 0, Y = v(Y ^ L, 16), H = H + Y | 0, B = v(B ^ H, 12), L = L + B | 0, Y = v(Y ^ L, 8), H = H + Y | 0, B = v(B ^ H, 7), _ = _ + U | 0, Y = v(Y ^ _, 16), W = W + Y | 0, U = v(U ^ W, 12), _ = _ + U | 0, Y = v(Y ^ _, 8), W = W + Y | 0, U = v(U ^ W, 7), F = F + $ | 0, z = v(z ^ F, 16), H = H + z | 0, $ = v($ ^ H, 12), F = F + $ | 0, z = v(z ^ F, 8), H = H + z | 0, $ = v($ ^ H, 7), x = x + B | 0, G = v(G ^ x, 16), K = K + G | 0, B = v(B ^ K, 12), x = x + B | 0, G = v(G ^ x, 8), K = K + G | 0, B = v(B ^ K, 7), L = L + O | 0, j = v(j ^ L, 16), V = V + j | 0, O = v(O ^ V, 12), L = L + O | 0, j = v(j ^ L, 8), V = V + j | 0, O = v(O ^ V, 7);
  let A = 0;
  s[A++] = o + _ | 0, s[A++] = a + F | 0, s[A++] = l + x | 0, s[A++] = c + L | 0, s[A++] = h + O | 0, s[A++] = d + U | 0, s[A++] = g + $ | 0, s[A++] = p + B | 0, s[A++] = f + K | 0, s[A++] = y + V | 0, s[A++] = P + W | 0, s[A++] = E + H | 0, s[A++] = M + z | 0, s[A++] = k + G | 0, s[A++] = q + j | 0, s[A++] = le + Y | 0;
}
const at = /* @__PURE__ */ bs(ws, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), ms = {
  saltInfo: "nip44-v2"
};
class T extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP44Error";
  }
}
var N = /* @__PURE__ */ ((n) => (n.INVALID_KEY = "INVALID_KEY", n.INVALID_NONCE = "INVALID_NONCE", n.INVALID_PAYLOAD = "INVALID_PAYLOAD", n.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", n.DECRYPTION_FAILED = "DECRYPTION_FAILED", n.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", n.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", n.PADDING_ERROR = "PADDING_ERROR", n))(N || {});
class S {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(e, t) {
    try {
      const s = e.replace(/^0x/, "");
      let i = t.replace(/^0x/, "");
      if (s.length !== 64)
        throw new T(
          "Invalid private key length",
          N.INVALID_KEY
        );
      if (i.length === 64)
        i = "02" + i;
      else if (i.length !== 66 || !i.startsWith("02") && !i.startsWith("03"))
        throw new T(
          "Invalid public key format",
          N.INVALID_KEY
        );
      const o = $t(s, i, !0).slice(1);
      return it(oe, o, this.SALT, new Uint8Array(0), 32);
    } catch (s) {
      throw s instanceof T ? s : new T(
        `Key derivation failed: ${s.message}`,
        N.INVALID_KEY,
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
        throw new T(
          "Invalid conversation key length",
          N.INVALID_KEY
        );
      if (t.length !== this.NONCE_SIZE)
        throw new T(
          "Invalid nonce length",
          N.INVALID_NONCE
        );
      const s = it(oe, e, new Uint8Array(0), t, 76);
      return {
        chachaKey: s.slice(0, 32),
        // bytes 0-31
        chachaNonce: s.slice(32, 44),
        // bytes 32-43 (12 bytes)
        hmacKey: s.slice(44, 76)
        // bytes 44-75
      };
    } catch (s) {
      throw new T(
        `Message key derivation failed: ${s.message}`,
        N.ENCRYPTION_FAILED,
        s
      );
    }
  }
  /**
   * Apply NIP-44 custom padding scheme
   * Based on the official algorithm from the specification
   */
  static calculatePaddedLength(e) {
    if (e < 0 || e > 65536)
      throw new T(
        "Invalid plaintext length",
        N.INVALID_PLAINTEXT_LENGTH
      );
    if (e === 0 || e <= 32)
      return 32;
    const t = 1 << Math.floor(Math.log2(e - 1)) + 1;
    let s;
    return t <= 256 ? s = 32 : s = t / 8, s * (Math.floor((e - 1) / s) + 1);
  }
  /**
   * Apply padding to plaintext with NIP-44 format:
   * [plaintext_length: u16][plaintext][zero_bytes]
   */
  static applyPadding(e) {
    const t = e.length, s = this.calculatePaddedLength(t + 2), i = new Uint8Array(s);
    return i[0] = t >>> 8 & 255, i[1] = t & 255, i.set(e, 2), i;
  }
  /**
   * Remove padding from decrypted data
   * Format: [plaintext_length: u16][plaintext][zero_bytes]
   */
  static removePadding(e) {
    if (e.length < 2)
      throw new T(
        "Invalid padded data length",
        N.PADDING_ERROR
      );
    const t = e[0] << 8 | e[1];
    if (t > e.length - 2)
      throw new T(
        "Invalid plaintext length in padding",
        N.PADDING_ERROR
      );
    return e.slice(2, 2 + t);
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
        throw new T(
          "Plaintext cannot be null or undefined",
          N.INVALID_PLAINTEXT_LENGTH
        );
      const i = new TextEncoder().encode(e), r = s || this.generateNonce(), o = this.deriveMessageKeys(t, r), a = this.applyPadding(i), l = at(
        o.chachaKey,
        o.chachaNonce,
        a
      ), c = new Uint8Array(r.length + l.length);
      c.set(r, 0), c.set(l, r.length);
      const h = me(oe, o.hmacKey, c), d = new Uint8Array(
        this.VERSION_SIZE + r.length + l.length + this.MAC_SIZE
      );
      let g = 0;
      return d[g] = this.VERSION, g += this.VERSION_SIZE, d.set(r, g), g += r.length, d.set(l, g), g += l.length, d.set(h, g), {
        payload: btoa(String.fromCharCode(...d)),
        nonce: r
      };
    } catch (i) {
      throw i instanceof T ? i : new T(
        `Encryption failed: ${i.message}`,
        N.ENCRYPTION_FAILED,
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
      for (let M = 0; M < s.length; M++)
        i[M] = s.charCodeAt(M);
      const r = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (i.length < r)
        throw new T(
          "Payload too short",
          N.INVALID_PAYLOAD
        );
      let o = 0;
      const a = i[o];
      if (o += this.VERSION_SIZE, a !== this.VERSION)
        throw new T(
          `Unsupported version: ${a}`,
          N.INVALID_PAYLOAD
        );
      const l = i.slice(o, o + this.NONCE_SIZE);
      o += this.NONCE_SIZE;
      const c = i.slice(o, -this.MAC_SIZE), h = i.slice(-this.MAC_SIZE), d = this.deriveMessageKeys(t, l), g = new Uint8Array(l.length + c.length);
      g.set(l, 0), g.set(c, l.length);
      const p = me(oe, d.hmacKey, g);
      let f = !0;
      for (let M = 0; M < this.MAC_SIZE; M++)
        h[M] !== p[M] && (f = !1);
      if (!f)
        return {
          plaintext: "",
          isValid: !1
        };
      const y = at(
        d.chachaKey,
        d.chachaNonce,
        c
      ), P = this.removePadding(y);
      return {
        plaintext: new TextDecoder().decode(P),
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
      const i = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      return !(s.length < i || s[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
u(S, "VERSION", 2), u(S, "SALT", new TextEncoder().encode(ms.saltInfo)), u(S, "NONCE_SIZE", 32), u(S, "CHACHA_KEY_SIZE", 32), u(S, "CHACHA_NONCE_SIZE", 12), u(S, "HMAC_KEY_SIZE", 32), u(S, "MAC_SIZE", 32), u(S, "VERSION_SIZE", 1);
const Es = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NIP44Crypto: S
}, Symbol.toStringTag, { value: "Module" }));
class b extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP59Error";
  }
}
var m = /* @__PURE__ */ ((n) => (n.INVALID_RUMOR = "INVALID_RUMOR", n.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", n.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", n.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", n.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", n.DECRYPTION_FAILED = "DECRYPTION_FAILED", n.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", n.INVALID_SEAL = "INVALID_SEAL", n.NO_RECIPIENTS = "NO_RECIPIENTS", n.INVALID_RECIPIENT = "INVALID_RECIPIENT", n.INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY", n))(m || {});
const X = {
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
      const i = JSON.stringify(e), r = S.deriveConversationKey(
        t,
        s
      ), o = S.encrypt(i, r), a = this.getPublicKeyFromPrivate(t), l = {
        pubkey: a,
        created_at: Math.floor(Date.now() / 1e3),
        kind: X.SEAL_KIND,
        tags: [],
        // Always empty for seals
        content: o.payload
      }, c = this.calculateEventId(l), h = await this.signEvent(l, c, t);
      return {
        id: c,
        pubkey: a,
        created_at: l.created_at,
        kind: X.SEAL_KIND,
        tags: [],
        content: o.payload,
        sig: h
      };
    } catch (i) {
      throw i instanceof b ? i : new b(
        `Seal creation failed: ${i.message}`,
        m.SEAL_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt a seal to recover the original rumor
   */
  static decryptSeal(e, t) {
    try {
      if (e.kind !== X.SEAL_KIND)
        return { rumor: null, isValid: !1 };
      if (e.tags.length !== 0)
        return { rumor: null, isValid: !1 };
      const s = S.deriveConversationKey(
        t,
        e.pubkey
      ), i = S.decrypt(e.content, s);
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
      throw new b(
        "Rumor must be a valid object",
        m.INVALID_RUMOR
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new b(
        "Rumor must have valid pubkey",
        m.INVALID_RUMOR
      );
    if (typeof e.created_at != "number" || e.created_at <= 0)
      throw new b(
        "Rumor must have valid created_at timestamp",
        m.INVALID_RUMOR
      );
    if (typeof e.kind != "number" || e.kind < 0 || e.kind > 65535)
      throw new b(
        "Rumor must have valid kind",
        m.INVALID_RUMOR
      );
    if (!Array.isArray(e.tags))
      throw new b(
        "Rumor must have valid tags array",
        m.INVALID_RUMOR
      );
    if (typeof e.content != "string")
      throw new b(
        "Rumor must have valid content string",
        m.INVALID_RUMOR
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
      throw new b(
        "Invalid private key format",
        m.SEAL_CREATION_FAILED
      );
  }
  /**
   * Validate public key format
   */
  static validatePublicKey(e) {
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new b(
        "Invalid public key format",
        m.SEAL_CREATION_FAILED
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
      }), new b(
        "Failed to derive public key from private key",
        m.SEAL_CREATION_FAILED,
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
      throw new b(
        "Failed to sign seal event",
        m.SEAL_CREATION_FAILED,
        i
      );
    }
  }
}
const vs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SealCreator: pe
}, Symbol.toStringTag, { value: "Module" }));
class ke {
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
      throw new b(
        `Ephemeral key generation failed: ${e.message}`,
        m.EPHEMERAL_KEY_GENERATION_FAILED,
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
      throw new b(
        "Key pair count must be greater than 0",
        m.EPHEMERAL_KEY_GENERATION_FAILED
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
class Ve {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(e = X.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      if (e < 0)
        throw new b(
          "Max age seconds cannot be negative",
          m.TIMESTAMP_RANDOMIZATION_FAILED
        );
      const t = Math.floor(Date.now() / 1e3);
      if (e === 0)
        return t;
      const s = this.generateSecureRandomOffset(e);
      return t - s;
    } catch (t) {
      throw t instanceof b ? t : new b(
        `Timestamp randomization failed: ${t.message}`,
        m.TIMESTAMP_RANDOMIZATION_FAILED,
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
  static generateMultipleRandomizedTimestamps(e, t = X.MAX_TIMESTAMP_AGE_SECONDS) {
    if (e <= 0)
      throw new b(
        "Timestamp count must be greater than 0",
        m.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let i = 0; i < e; i++)
      s.push(this.generateRandomizedTimestamp(t));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(e, t = X.MAX_TIMESTAMP_AGE_SECONDS) {
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
    return X.MAX_TIMESTAMP_AGE_SECONDS;
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
      throw new b(
        "Window start must be before window end",
        m.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = t - e, i = this.generateSecureRandomOffset(s);
    return e + i;
  }
}
class _e {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(e, t, s, i) {
    try {
      this.validateSeal(e), this.validateRecipient(t);
      const r = s || ke.generateEphemeralKeyPair();
      if (!ke.validateEphemeralKeyPair(r))
        throw new b(
          "Invalid ephemeral key pair",
          m.GIFT_WRAP_CREATION_FAILED
        );
      const o = i || Ve.generateRandomizedTimestamp(), a = JSON.stringify(e), l = S.deriveConversationKey(
        r.privateKey,
        t.pubkey
      ), c = S.encrypt(a, l), h = t.relayHint ? ["p", t.pubkey, t.relayHint] : ["p", t.pubkey], d = {
        pubkey: r.publicKey,
        created_at: o,
        kind: X.GIFT_WRAP_KIND,
        tags: [h],
        content: c.payload
      }, g = this.calculateEventId(d), p = await this.signEvent(d, g, r.privateKey);
      return {
        giftWrap: {
          id: g,
          pubkey: r.publicKey,
          created_at: o,
          kind: X.GIFT_WRAP_KIND,
          tags: [h],
          content: c.payload,
          sig: p
        },
        ephemeralKeyPair: r,
        recipient: t.pubkey
      };
    } catch (r) {
      throw r instanceof b ? r : new b(
        `Gift wrap creation failed: ${r.message}`,
        m.GIFT_WRAP_CREATION_FAILED,
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
      throw new b(
        "At least one recipient is required",
        m.NO_RECIPIENTS
      );
    const s = [], i = ke.generateMultipleEphemeralKeyPairs(
      t.length
    ), r = Ve.generateMultipleRandomizedTimestamps(
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
      const s = S.deriveConversationKey(
        t,
        e.pubkey
      ), i = S.decrypt(e.content, s);
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
      throw new b(
        "Seal must be a valid object",
        m.INVALID_SEAL
      );
    if (e.kind !== X.SEAL_KIND)
      throw new b(
        "Seal must have kind 13",
        m.INVALID_SEAL
      );
    if (!Array.isArray(e.tags) || e.tags.length !== 0)
      throw new b(
        "Seal must have empty tags array",
        m.INVALID_SEAL
      );
    if (typeof e.content != "string")
      throw new b(
        "Seal must have valid content string",
        m.INVALID_SEAL
      );
  }
  /**
   * Validate recipient configuration
   */
  static validateRecipient(e) {
    if (!e || typeof e != "object")
      throw new b(
        "Recipient must be a valid object",
        m.INVALID_RECIPIENT
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new b(
        "Recipient must have valid pubkey",
        m.INVALID_RECIPIENT
      );
    if (e.relayHint && typeof e.relayHint != "string")
      throw new b(
        "Recipient relay hint must be a string if provided",
        m.INVALID_RECIPIENT
      );
  }
  /**
   * Check if an object is a valid gift wrap (for decryption)
   */
  static isValidGiftWrap(e) {
    return e && typeof e == "object" && e.kind === X.GIFT_WRAP_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length > 0 && Array.isArray(e.tags[0]) && e.tags[0][0] === "p" && typeof e.tags[0][1] == "string";
  }
  /**
   * Check if an object is a valid seal (for decryption)
   */
  static isValidSeal(e) {
    return e && typeof e == "object" && e.kind === X.SEAL_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length === 0;
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
      throw new b(
        "Failed to sign gift wrap event",
        m.GIFT_WRAP_CREATION_FAILED,
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
class re {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(e, t, s, i) {
    try {
      this.validateCreateDMInputs(e, t, s);
      const r = this.createRumor(e, t, i), o = [];
      for (const l of s.recipients) {
        const c = await pe.createSeal(
          r,
          t,
          l.pubkey
        ), h = await _e.createGiftWrap(
          c,
          {
            pubkey: l.pubkey,
            relayHint: l.relayHint || s.relayHint
          }
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
      throw r instanceof b ? r : new b(
        `Gift wrap protocol failed: ${r.message}`,
        m.GIFT_WRAP_CREATION_FAILED,
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
      const s = _e.decryptGiftWrap(
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
    return e.filter((s) => _e.getRecipientFromGiftWrap(s) === t);
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
      throw new b(
        "Message must be a string",
        m.INVALID_RUMOR
      );
    if (typeof t != "string" || !/^[0-9a-f]{64}$/i.test(t))
      throw new b(
        "Invalid sender private key format",
        m.SEAL_CREATION_FAILED
      );
    if (!s || !Array.isArray(s.recipients) || s.recipients.length === 0)
      throw new b(
        "At least one recipient is required",
        m.NO_RECIPIENTS
      );
    for (const i of s.recipients)
      if (!i || typeof i.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(i.pubkey))
        throw new b(
          "Invalid recipient public key format",
          m.INVALID_RECIPIENT
        );
  }
  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivate(e) {
    try {
      console.log("🔍 GiftWrapProtocol.getPublicKeyFromPrivate called with:", {
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
      throw console.error("❌ GiftWrapProtocol getPublicKeyFromPrivate error:", {
        error: t,
        message: t.message,
        stack: t.stack,
        privateKeyInfo: {
          type: typeof e,
          length: e == null ? void 0 : e.length
        }
      }), new b(
        "Failed to derive public key from private key",
        m.SEAL_CREATION_FAILED,
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
    const t = e.length, s = e.reduce((l, c) => l + c.giftWraps.length, 0), i = Math.floor(Date.now() / 1e3), r = e.flatMap(
      (l) => l.giftWraps.map((c) => i - c.giftWrap.created_at)
    ), o = r.length > 0 ? r.reduce((l, c) => l + c, 0) / r.length : 0, a = new Set(
      e.flatMap((l) => l.giftWraps.map((c) => c.recipient))
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
      if (!/^[0-9a-f]{64}$/i.test(t))
        throw new b(
          "Invalid recipient private key format",
          m.INVALID_PRIVATE_KEY
        );
      const { SealCreator: s } = await Promise.resolve().then(() => vs), { NIP44Crypto: i } = await Promise.resolve().then(() => Es), r = await i.decrypt(
        e.content,
        t,
        e.pubkey
      );
      if (!r)
        return null;
      const o = JSON.parse(r);
      if (!o || o.kind !== 13)
        return null;
      const a = await i.decrypt(
        o.content,
        t,
        o.pubkey
      );
      if (!a)
        return null;
      const l = JSON.parse(a);
      return !l || typeof l.kind != "number" ? null : l;
    } catch (s) {
      return console.error("Failed to unwrap gift wrapped DM:", s), null;
    }
  }
}
const Ms = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapProtocol: re
}, Symbol.toStringTag, { value: "Module" }));
class bt {
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
    this.config = e, this._state = I({
      messages: [],
      status: "connecting",
      latest: null,
      isTyping: !1,
      error: null,
      subject: e.subject
    }), this.messages = w(this._state, (t) => t.messages), this.status = w(this._state, (t) => t.status), this.latest = w(this._state, (t) => t.latest), this.error = w(this._state, (t) => t.error), this.subject = w(this._state, (t) => t.subject), this.initializeSubscription();
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
      const l = re.createSimpleConfig(
        this.config.recipientPubkey,
        (i = this.config.relayHints) == null ? void 0 : i[0]
      );
      this.config.debug && console.log("🎁 Creating gift wrap with config:", l);
      const c = await re.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        l,
        t
      );
      this.config.debug && console.log("🎁 Gift wrap result:", {
        hasRumor: !!c.rumor,
        hasSeal: !!c.seal,
        giftWrapCount: c.giftWraps.length
      });
      let h = !1, d;
      for (const g of c.giftWraps)
        try {
          this.config.debug && console.log("📡 Publishing gift wrap:", {
            id: g.giftWrap.id,
            kind: g.giftWrap.kind,
            tags: g.giftWrap.tags
          });
          const p = await this.config.relayManager.publishToAll(g.giftWrap);
          this.config.debug && console.log("📡 Publish result:", p), p.some((y) => y.success) && (h = !0, a.eventId = g.giftWrap.id);
        } catch (p) {
          d = p instanceof Error ? p.message : "Publishing failed", this.config.debug && console.error("❌ Publish error:", p);
        }
      if (h)
        return this.updateMessageStatus(r, "sent"), this.config.debug && console.log(`✅ DM sent successfully: ${r}`), { success: !0, messageId: r };
      {
        this.updateMessageStatus(r, "failed");
        const g = d || "Failed to publish to any relay";
        return this.setError(g), this.config.debug && console.error(`❌ DM send failed: ${g}`), { success: !1, error: g, messageId: r };
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
  handleDecryptedEvent(e) {
    this.config.debug && console.log("📨 Processing decrypted event in conversation:", e.id), this.handleInboxEvent(e);
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
      const t = await re.decryptGiftWrappedDM(
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
class wt {
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
    this.config = e, this.roomId = this.generateRoomId(), this._state = I({
      messages: [],
      status: "connecting",
      latest: null,
      subject: ((t = e.options) == null ? void 0 : t.subject) || "Group Chat",
      participants: [...e.participants, e.senderPubkey],
      // Include sender
      isTyping: !1,
      error: null
    }), this.messages = w(this._state, (s) => s.messages), this.status = w(this._state, (s) => s.status), this.latest = w(this._state, (s) => s.latest), this.subject = w(this._state, (s) => s.subject), this.participants = w(this._state, (s) => s.participants), this.error = w(this._state, (s) => s.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted message to all room participants
   */
  async send(e) {
    var t, s;
    try {
      this.updateStatus("active");
      const i = this.generateMessageId(), r = Math.floor(Date.now() / 1e3), o = this.getCurrentSubject(), a = this.getCurrentParticipants(), l = {
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
      this.addMessage(l);
      const h = {
        recipients: a.filter((f) => f !== this.config.senderPubkey).map((f) => ({ pubkey: f })),
        relayHint: (s = (t = this.config.options) == null ? void 0 : t.relayHints) == null ? void 0 : s[0]
      }, d = await re.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        h
      );
      let g = !1, p;
      for (const f of d.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(f.giftWrap)).some((E) => E.success) && (g = !0, l.eventId = f.giftWrap.id);
        } catch (y) {
          p = y instanceof Error ? y.message : "Publishing failed";
        }
      if (g)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`Room message sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const f = p || "Failed to publish to any relay";
        return this.setError(f), { success: !1, error: f, messageId: i };
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
      const t = await re.decryptGiftWrappedDM(
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
        (c) => c.eventId === e.id || c.content === o.content && Math.abs(c.timestamp - o.timestamp) < 5
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
class mt {
  constructor(e) {
    u(this, "conversations", /* @__PURE__ */ new Map());
    u(this, "rooms", /* @__PURE__ */ new Map());
    u(this, "config");
    u(this, "_senderPubkey", null);
    u(this, "_senderPrivateKey", null);
    u(this, "parentNostr");
    // Reference to NostrUnchained instance
    // Reactive stores
    u(this, "_conversationList", I([]));
    u(this, "conversations$");
    this.config = e, this.parentNostr = e.parent, this.conversations$ = this._conversationList, this.config.signingProvider && this.initializeSender();
  }
  /**
   * Get or create a conversation with a specific user
   * This is the main entry point: nostr.dm.with('npub...')
   */
  async with(e) {
    if (this.shouldUseUniversalDM())
      return this.delegateToUniversalDM(e);
    const t = this.normalizePubkey(e);
    let s = this.conversations.get(t);
    return s || (s = await this.createConversation(t), this.conversations.set(t, s), this.updateConversationList(), this.config.debug && console.log(`Created new DM conversation with ${t}`)), s;
  }
  /**
   * Create or get a multi-participant room
   * This is the main entry point: nostr.dm.room(['pubkey1', 'pubkey2'], { subject: 'Meeting' })
   */
  async room(e, t) {
    const s = e.map((o) => this.normalizePubkey(o)), i = this.generateRoomId(s);
    let r = this.rooms.get(i);
    return r || (r = await this.createRoom(s, t), this.rooms.set(i, r), this.updateConversationList(), this.config.debug && console.log(`Created new DM room: ${i} with ${s.length} participants`)), r;
  }
  /**
   * Get all active conversations as summaries
   */
  getConversations() {
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
    }, i = new bt(s);
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
    }, r = new wt(i);
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
      const a = t.latest.subscribe((h) => {
        i = h;
      }), l = t.status.subscribe((h) => {
        r = h;
      }), c = t.subject.subscribe((h) => {
        o = h;
      });
      a(), l(), c(), e.push({
        pubkey: s,
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: o,
        type: "conversation"
      });
    }), this.rooms.forEach((t, s) => {
      let i = null, r = "disconnected", o = "", a = [];
      const l = t.latest.subscribe((g) => {
        i = g;
      }), c = t.status.subscribe((g) => {
        r = g;
      }), h = t.subject.subscribe((g) => {
        o = g;
      }), d = t.participants.subscribe((g) => {
        a = g;
      });
      l(), c(), h(), d(), e.push({
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
      const { GiftWrapProtocol: t } = await Promise.resolve().then(() => Ms), s = await this.getPrivateKeySecurely(), i = await t.unwrapGiftWrap(e, s);
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
    const t = this.getUniversalDMInstance();
    if (!t)
      throw new Error("Universal DM Module not available");
    return this.config.debug && console.log("🎯 Delegating to Universal DM Module (cache-based) for:", e.substring(0, 16) + "..."), t.with(e);
  }
}
class Ps {
  constructor(e, t, s) {
    u(this, "store");
    u(this, "myPubkey");
    u(this, "otherPubkey");
    u(this, "nostr");
    this.nostr = e, this.myPubkey = t, this.otherPubkey = s, this.store = this.nostr.query().kinds([14]).authors([this.myPubkey, this.otherPubkey]).tags("p", [this.myPubkey, this.otherPubkey]).execute();
  }
  // Svelte store interface - delegate to underlying store
  subscribe(e) {
    return this.store.subscribe((t) => {
      const s = this.convertEventsToMessages(t);
      e(s);
    });
  }
  get messages() {
    return this.convertEventsToMessages(this.store.current);
  }
  // Convenience method for sending
  async send(e, t) {
    try {
      const s = {
        kind: 14,
        content: e,
        tags: [
          ["p", this.otherPubkey],
          ...t ? [["subject", t]] : []
        ],
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: this.myPubkey,
        id: "",
        // Will be set during signing
        sig: ""
        // Will be set during signing
      }, i = await this.nostr.publishEncrypted(s, [this.otherPubkey]);
      return i.success ? { success: !0, messageId: s.id } : { success: !1, error: i.error };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Unknown error"
      };
    }
  }
  convertEventsToMessages(e) {
    return e.filter((t) => t.kind === 14).map((t) => ({
      id: t.id,
      content: t.content,
      senderPubkey: t.pubkey,
      recipientPubkey: this.getRecipientFromEvent(t),
      timestamp: t.created_at,
      isFromMe: t.pubkey === this.myPubkey,
      eventId: t.id,
      status: "received",
      subject: this.getSubjectFromEvent(t)
    })).sort((t, s) => t.timestamp - s.timestamp);
  }
  getRecipientFromEvent(e) {
    const t = e.tags.find((s) => s[0] === "p");
    return (t == null ? void 0 : t[1]) || "";
  }
  getSubjectFromEvent(e) {
    const t = e.tags.find((s) => s[0] === "subject");
    return t == null ? void 0 : t[1];
  }
}
class Is {
  constructor(e, t) {
    this.nostr = e, this.myPubkey = t;
  }
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  with(e) {
    return this.nostr.startUniversalGiftWrapSubscription().catch((t) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DMs:", t);
    }), new Ps(this.nostr, this.myPubkey, e);
  }
  // Room functionality - also just queries (with lazy gift wrap subscription)
  room(e, t) {
    return this.nostr.startUniversalGiftWrapSubscription().catch((s) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DM room:", s);
    }), new Ss(this.nostr, this.myPubkey, e, t);
  }
  // Get all conversations - query all kind 14 events I'm involved in
  get conversations() {
    return [];
  }
}
class Ss {
  // TODO: Implement room store
  constructor(e, t, s, i) {
    u(this, "store");
    this.nostr = e, this.myPubkey = t, this.participants = s, this.options = i, this.store = this.nostr.query().kinds([14]).tags("p", [this.myPubkey, ...this.participants]).execute();
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
    return [this.myPubkey, ...this.participants];
  }
  async addParticipant(e) {
    return { success: !0 };
  }
  async removeParticipant(e) {
    return { success: !0 };
  }
}
class ks {
  constructor(e) {
    u(this, "config");
    u(this, "contactCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // pubkey -> subscriptionId
    // Reactive stores
    u(this, "_myContacts", I(null));
    u(this, "_contactUpdates", I(/* @__PURE__ */ new Map()));
    // Public reactive properties
    u(this, "mine");
    u(this, "updates");
    this.config = e, this.mine = w(this._myContacts, (t) => t), this.updates = w(this._contactUpdates, (t) => t), this.config.signingProvider && this.initializeOwnContacts();
  }
  /**
   * Follow a new contact
   */
  async follow(e) {
    if (!this.config.signingProvider)
      return {
        success: !1,
        error: "No signing provider available"
      };
    try {
      const t = await this.getMine(), s = t ? [...t.contacts] : [], i = s.findIndex((r) => r.pubkey === e.pubkey);
      return i >= 0 ? s[i] = {
        pubkey: e.pubkey,
        relayUrl: e.relayUrl,
        petname: e.petname
      } : s.push({
        pubkey: e.pubkey,
        relayUrl: e.relayUrl,
        petname: e.petname
      }), this.publishContactList(s);
    } catch (t) {
      return this.config.debug && console.error("Error following contact:", t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  /**
   * Unfollow a contact
   */
  async unfollow(e) {
    if (!this.config.signingProvider)
      return {
        success: !1,
        error: "No signing provider available"
      };
    try {
      const t = await this.getMine();
      if (!t)
        return {
          success: !1,
          error: "No contact list found"
        };
      const s = t.contacts.filter((i) => i.pubkey !== e.pubkey);
      return s.length === t.contacts.length ? {
        success: !1,
        error: "Contact not found in list"
      } : this.publishContactList(s);
    } catch (t) {
      return this.config.debug && console.error("Error unfollowing contact:", t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  /**
   * Get own contact list
   */
  async getMine() {
    if (!this.config.signingProvider)
      return null;
    try {
      const e = await this.config.signingProvider.getPublicKey();
      return this.get(e);
    } catch {
      return null;
    }
  }
  /**
   * Get contact list for any user by pubkey
   */
  async get(e, t = {}) {
    try {
      if (t.useCache !== !1) {
        const i = this.getCachedContactList(e);
        if (i)
          return i;
      }
      const s = {
        kinds: [3],
        authors: [e],
        limit: 1
      };
      return new Promise((i) => {
        let r = !1;
        const o = setTimeout(() => {
          r || (r = !0, i(null));
        }, t.timeout || 5e3);
        this.config.subscriptionManager.subscribe([s], {
          onEvent: (a) => {
            if (!r && a.kind === 3) {
              r = !0, clearTimeout(o);
              try {
                const l = this.parseContactEvent(a);
                this.cacheContactList(l), this._contactUpdates.update((c) => (c.set(e, l), new Map(c))), i(l);
              } catch {
                i(null);
              }
            }
          },
          onEose: () => {
            r || (r = !0, clearTimeout(o), i(null));
          }
        });
      });
    } catch (s) {
      return this.config.debug && console.error("Error fetching contact list:", s), null;
    }
  }
  /**
   * Check if user is following a specific pubkey
   */
  async isFollowing(e) {
    const t = await this.getMine();
    return t ? t.contacts.some((s) => s.pubkey === e) : !1;
  }
  /**
   * Get list of pubkeys the user is following
   */
  async getFollowing() {
    const e = await this.getMine();
    return e ? e.contacts.map((t) => t.pubkey) : [];
  }
  /**
   * Update signing provider
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e, await this.initializeOwnContacts();
  }
  /**
   * Close all subscriptions and cleanup
   */
  async close() {
    const e = Array.from(this.activeSubscriptions.values()).map(
      (t) => this.config.subscriptionManager.close(t)
    );
    await Promise.allSettled(e), this.activeSubscriptions.clear(), this.contactCache.clear(), this.config.subscriptionManager.close && await this.config.subscriptionManager.close(), this.config.debug && console.log("ContactManager: Closed all subscriptions and cleared cache");
  }
  // Private helper methods
  async initializeOwnContacts() {
    try {
      const e = await this.getMine();
      e && (this._myContacts.set(e), this.config.debug && console.log("Initialized own contact list:", e));
    } catch (e) {
      this.config.debug && console.error("Failed to initialize own contact list:", e);
    }
  }
  async publishContactList(e) {
    try {
      const t = await this.config.signingProvider.getPublicKey(), s = e.map((c) => {
        const h = ["p", c.pubkey];
        return c.relayUrl && h.push(c.relayUrl), c.petname && h.push(c.petname), h;
      }), i = await this.config.eventBuilder.kind(3).content("").tags(s).build(), r = await this.config.signingProvider.signEvent(i);
      if ((await this.config.relayManager.publishToAll(r)).filter((c) => c.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const l = {
        contacts: e,
        ownerPubkey: t,
        lastUpdated: r.created_at,
        eventId: r.id,
        isOwn: !0
      };
      return this._myContacts.set(l), this._contactUpdates.update((c) => (c.set(t, l), new Map(c))), this.cacheContactList(l), this.config.debug && console.log("Published contact list:", l), {
        success: !0,
        contactList: l,
        eventId: r.id
      };
    } catch (t) {
      return this.config.debug && console.error("Error publishing contact list:", t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  parseContactEvent(e) {
    var s;
    const t = [];
    for (const i of e.tags)
      if (i[0] === "p" && i[1]) {
        const r = {
          pubkey: i[1],
          relayUrl: i[2] || void 0,
          petname: i[3] || void 0
        };
        t.push(r);
      }
    return (s = this.config.signingProvider) != null && s.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve(""), {
      contacts: t,
      ownerPubkey: e.pubkey,
      lastUpdated: e.created_at,
      eventId: e.id,
      isOwn: !1
      // Will be updated based on pubkey comparison
    };
  }
  getCachedContactList(e) {
    const t = this.contactCache.get(e);
    return t ? Date.now() - t.timestamp > t.ttl ? (this.contactCache.delete(e), null) : t.contactList : null;
  }
  cacheContactList(e) {
    const t = {
      contactList: e,
      timestamp: Date.now(),
      ttl: 3e5
      // 5 minutes
    };
    this.contactCache.set(e.ownerPubkey, t);
  }
}
class _s {
  constructor(e) {
    u(this, "config");
    u(this, "threadCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // threadId -> subscriptionId
    // Reactive stores
    u(this, "_watchedThreads", I(/* @__PURE__ */ new Map()));
    u(this, "_threadUpdates", I(/* @__PURE__ */ new Map()));
    // Public reactive properties
    u(this, "watchedThreads");
    u(this, "updates");
    this.config = e, this.watchedThreads = w(this._watchedThreads, (t) => t), this.updates = w(this._threadUpdates, (t) => t);
  }
  /**
   * Create a new thread (root message)
   */
  async createThread(e) {
    if (!this.config.signingProvider)
      return {
        success: !1,
        error: "No signing provider available"
      };
    try {
      const t = await this.config.signingProvider.getPublicKey(), s = [];
      if (e.mentions)
        for (const h of e.mentions)
          s.push(["p", h]);
      const i = await this.config.eventBuilder.kind(1).content(e.content).tags(s).build(), r = await this.config.signingProvider.signEvent(i);
      if ((await this.config.relayManager.publishToAll(r)).filter((h) => h.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const l = {
        eventId: r.id,
        authorPubkey: t,
        content: e.content,
        createdAt: r.created_at,
        replyToEventId: null,
        // Root message
        rootEventId: r.id,
        // Self-reference for root
        mentionedPubkeys: e.mentions || [],
        depth: 0,
        isOwn: !0
      }, c = {
        rootEventId: r.id,
        messages: [l],
        messageCount: 1,
        lastActivity: r.created_at,
        isWatched: !1
      };
      return this.cacheThread(c), this._threadUpdates.update((h) => (h.set(r.id, c), new Map(h))), this.config.debug && console.log("Created thread:", c), {
        success: !0,
        eventId: r.id,
        message: l
      };
    } catch (t) {
      return this.config.debug && console.error("Error creating thread:", t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  /**
   * Reply to a message in a thread
   */
  async reply(e) {
    if (!this.config.signingProvider)
      return {
        success: !1,
        error: "No signing provider available"
      };
    try {
      const t = await this.config.signingProvider.getPublicKey(), s = [];
      s.push(["e", e.replyToEventId, "", "reply"]), e.rootEventId !== e.replyToEventId && s.push(["e", e.rootEventId, "", "root"]);
      const i = new Set(e.mentions || []), r = await this.get(e.rootEventId);
      if (r) {
        const d = r.messages.find((g) => g.eventId === e.replyToEventId);
        d && i.add(d.authorPubkey);
      }
      for (const d of i)
        d !== t && s.push(["p", d]);
      const o = await this.config.eventBuilder.kind(1).content(e.content).tags(s).build(), a = await this.config.signingProvider.signEvent(o);
      if ((await this.config.relayManager.publishToAll(a)).filter((d) => d.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const h = {
        eventId: a.id,
        authorPubkey: t,
        content: e.content,
        createdAt: a.created_at,
        replyToEventId: e.replyToEventId,
        rootEventId: e.rootEventId,
        mentionedPubkeys: Array.from(i),
        depth: this.calculateDepth(e.replyToEventId, r),
        isOwn: !0
      };
      return r && (r.messages.push(h), r.messageCount = r.messages.length, r.lastActivity = a.created_at, this.cacheThread(r), this._threadUpdates.update((d) => (d.set(e.rootEventId, r), new Map(d)))), this.config.debug && console.log("Created reply:", h), {
        success: !0,
        eventId: a.id,
        message: h
      };
    } catch (t) {
      return this.config.debug && console.error("Error creating reply:", t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  /**
   * Get a complete thread by root event ID
   */
  async get(e, t = {}) {
    try {
      if (t.useCache !== !1) {
        const s = this.getCachedThread(e);
        if (s)
          return s;
      }
      return this.fetchSimpleThread(e, t);
    } catch (s) {
      return this.config.debug && console.error("Error fetching thread:", s), null;
    }
  }
  /**
   * Fetch thread using simple single-phase approach
   */
  async fetchSimpleThread(e, t) {
    const s = [
      // Get the root event itself
      {
        ids: [e],
        kinds: [1],
        limit: 1
      },
      // Get all replies to this thread
      {
        kinds: [1],
        "#e": [e],
        limit: t.limit || 100
      }
    ];
    return new Promise((i) => {
      let r = !1;
      const o = [], a = /* @__PURE__ */ new Set(), l = setTimeout(() => {
        if (!r)
          if (r = !0, o.length > 0) {
            const c = this.buildThread(e, o);
            this.cacheThread(c), i(c);
          } else
            i(null);
      }, t.timeout || 5e3);
      this.config.subscriptionManager.subscribe(s, {
        onEvent: (c) => {
          if (c.kind === 1 && !a.has(c.id)) {
            a.add(c.id);
            const h = this.parseTextNoteEvent(c, e);
            h && o.push(h);
          }
        },
        onEose: () => {
          if (!r)
            if (r = !0, clearTimeout(l), o.length > 0) {
              const c = this.buildThread(e, o);
              this.cacheThread(c), this._threadUpdates.update((h) => (h.set(e, c), new Map(h))), i(c);
            } else
              i(null);
        }
      });
    });
  }
  /**
   * Fetch complete thread using multi-phase recursive approach
   */
  async fetchCompleteThread(e, t) {
    const s = [], i = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set([e]), o = /* @__PURE__ */ new Set();
    let a = 0;
    const l = 5;
    for (; r.size > 0 && a < l; ) {
      a++;
      const h = Array.from(r);
      r.clear(), this.config.debug && console.log(`Thread fetch phase ${a}: querying ${h.length} events`);
      const d = [];
      h.length > 0 && d.push({
        ids: h,
        kinds: [1],
        limit: h.length
      });
      for (const p of h)
        o.has(p) || (d.push({
          kinds: [1],
          "#e": [p],
          limit: Math.floor((t.limit || 100) / Math.max(1, a))
          // Reduce limit per phase
        }), o.add(p));
      if (d.length === 0)
        break;
      const g = await this.fetchEventsWithFilters(d, e, i);
      for (const p of g)
        i.has(p.eventId) || (s.push(p), i.add(p.eventId), p.replyToEventId && !i.has(p.replyToEventId) && r.add(p.replyToEventId));
      if (this.config.debug && console.log(`Phase ${a} complete: found ${g.length} new messages, ${r.size} more to query`), g.length === 0)
        break;
    }
    if (s.length === 0)
      return null;
    const c = this.buildThread(e, s);
    return this.cacheThread(c), this._threadUpdates.update((h) => (h.set(e, c), new Map(h))), this.config.debug && console.log(`Complete thread built: ${c.messageCount} messages across ${a} phases`), c;
  }
  /**
   * Fetch events using provided filters and parse them
   */
  async fetchEventsWithFilters(e, t, s) {
    return new Promise((i) => {
      const r = [];
      let o = !1;
      const a = setTimeout(() => {
        o || (o = !0, i(r));
      }, 3e3);
      this.config.subscriptionManager.subscribe(e, {
        onEvent: (l) => {
          if (l.kind === 1 && !s.has(l.id)) {
            const c = this.parseTextNoteEvent(l, t);
            c && r.push(c);
          }
        },
        onEose: () => {
          o || (o = !0, clearTimeout(a), i(r));
        }
      });
    });
  }
  /**
   * Watch a thread for real-time updates
   */
  async watch(e) {
    try {
      const t = await this.get(e);
      if (!t)
        return !1;
      t.isWatched = !0, this.cacheThread(t), this._watchedThreads.update((r) => (r.set(e, t), new Map(r)));
      const s = {
        kinds: [1],
        "#e": [e],
        since: Math.floor(Date.now() / 1e3)
        // Only new messages
      }, i = await this.config.subscriptionManager.subscribe([s], {
        onEvent: (r) => {
          if (r.kind === 1) {
            const o = this.parseTextNoteEvent(r, e);
            o && !t.messages.find((a) => a.eventId === o.eventId) && (t.messages.push(o), t.messageCount = t.messages.length, t.lastActivity = o.createdAt, this.cacheThread(t), this._watchedThreads.update((a) => (a.set(e, { ...t }), new Map(a))), this._threadUpdates.update((a) => (a.set(e, { ...t }), new Map(a))));
          }
        }
      });
      return this.activeSubscriptions.set(e, i), this.config.debug && console.log(`Started watching thread: ${e}`), !0;
    } catch (t) {
      return this.config.debug && console.error("Error watching thread:", t), !1;
    }
  }
  /**
   * Stop watching a thread
   */
  async unwatch(e) {
    const t = this.activeSubscriptions.get(e);
    t && (await this.config.subscriptionManager.close(t), this.activeSubscriptions.delete(e)), this._watchedThreads.update((i) => (i.delete(e), new Map(i)));
    const s = this.getCachedThread(e);
    s && (s.isWatched = !1, this.cacheThread(s)), this.config.debug && console.log(`Stopped watching thread: ${e}`);
  }
  /**
   * Update signing provider
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e;
  }
  /**
   * Close all subscriptions and cleanup
   */
  async close() {
    const e = Array.from(this.activeSubscriptions.values()).map(
      (t) => this.config.subscriptionManager.close(t)
    );
    await Promise.allSettled(e), this.activeSubscriptions.clear(), this.threadCache.clear(), this.config.subscriptionManager.close && await this.config.subscriptionManager.close(), this.config.debug && console.log("ThreadManager: Closed all subscriptions and cleared cache");
  }
  // Private helper methods
  parseTextNoteEvent(e, t) {
    var s;
    try {
      const i = this.parseNIP10Tags(e.tags), r = i.find((f) => f.meaning === "root"), o = i.find((f) => f.meaning === "reply"), a = i.filter((f) => f.meaning === "mention"), l = i.filter((f) => f.tagType === "e");
      let c, h = null, d = !1;
      if (r)
        c = r.value, d = c === t;
      else if (o)
        o.value === t ? (c = t, d = !0) : (c = o.value, d = l.some((f) => f.value === t), d && (c = t));
      else if (e.id === t)
        c = e.id, d = !0;
      else if (l.find((y) => y.value === t))
        c = t, d = !0;
      else
        return null;
      if (!d)
        return null;
      if (o)
        h = o.value;
      else if (l.length > 0 && e.id !== c)
        if (l.length === 1)
          h = l[0].value;
        else {
          const f = l[l.length - 1];
          f.value !== c && (h = f.value);
        }
      const g = a.map((f) => f.value), p = (s = this.config.signingProvider) != null && s.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
      return {
        eventId: e.id,
        authorPubkey: e.pubkey,
        content: e.content,
        createdAt: e.created_at,
        replyToEventId: h,
        rootEventId: c,
        mentionedPubkeys: g,
        depth: 0,
        // Will be calculated when building thread
        isOwn: !1
        // Will be updated based on pubkey comparison
      };
    } catch (i) {
      return this.config.debug && console.error("Error parsing text note event:", i), null;
    }
  }
  parseNIP10Tags(e) {
    const t = [];
    for (const i of e) {
      if (i.length < 2) continue;
      const [r, o, a, l] = i;
      if (r === "e") {
        let c = "mention";
        l === "reply" ? c = "reply" : l === "root" && (c = "root"), t.push({
          tagType: "e",
          value: o,
          relayUrl: a || void 0,
          marker: l || void 0,
          meaning: c
        });
      } else r === "p" && t.push({
        tagType: "p",
        value: o,
        relayUrl: a || void 0,
        marker: l || void 0,
        meaning: "mention"
      });
    }
    const s = t.filter((i) => i.tagType === "e");
    return s.length > 0 && !s.some((i) => i.marker) && (s.length === 1 ? s[0].meaning = "reply" : s.length >= 2 && (s[0].meaning = "root", s[s.length - 1].meaning = "reply")), t;
  }
  buildThread(e, t) {
    t.sort((r, o) => r.createdAt - o.createdAt);
    const s = /* @__PURE__ */ new Map();
    for (const r of t)
      s.set(r.eventId, r), r.depth = -1;
    for (const r of t)
      r.depth === -1 && (r.depth = this.calculateMessageDepth(r, s));
    const i = t.length > 0 ? Math.max(...t.map((r) => r.createdAt)) : 0;
    return {
      rootEventId: e,
      messages: t,
      messageCount: t.length,
      lastActivity: i,
      isWatched: !1
    };
  }
  calculateMessageDepth(e, t) {
    if (!e.replyToEventId || e.eventId === e.rootEventId)
      return 0;
    const s = t.get(e.replyToEventId);
    return s ? ((s.depth === void 0 || s.depth < 0) && (s.depth = this.calculateMessageDepth(s, t)), s.depth + 1) : 1;
  }
  calculateDepth(e, t) {
    if (!t || !e)
      return 1;
    const s = t.messages.find((i) => i.eventId === e);
    return s ? s.depth + 1 : 1;
  }
  getCachedThread(e) {
    const t = this.threadCache.get(e);
    return t ? Date.now() - t.timestamp > t.ttl ? (this.threadCache.delete(e), null) : t.thread : null;
  }
  cacheThread(e) {
    const t = {
      thread: e,
      timestamp: Date.now(),
      ttl: 3e5
      // 5 minutes
    };
    this.threadCache.set(e.rootEventId, t);
  }
}
class As {
  constructor(e) {
    u(this, "config");
    u(this, "reactionCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // eventId -> subscriptionId
    // Reactive stores
    u(this, "_reactionUpdates", I(/* @__PURE__ */ new Map()));
    u(this, "_watchedEvents", I(/* @__PURE__ */ new Map()));
    // Public reactive properties
    u(this, "updates");
    u(this, "watchedEvents");
    this.config = e, this.updates = w(this._reactionUpdates, (t) => t), this.watchedEvents = w(this._watchedEvents, (t) => t);
  }
  /**
   * React to an event
   */
  async react(e) {
    if (!this.config.signingProvider)
      return {
        success: !1,
        error: "No signing provider available"
      };
    try {
      const t = await this.config.signingProvider.getPublicKey(), s = await this.getReactions(e.targetEventId, { useCache: !1 });
      if (s && s.reactions.find((g) => g.authorPubkey === t))
        return {
          success: !1,
          error: "User has already reacted to this event"
        };
      const i = [
        ["e", e.targetEventId],
        // Event being reacted to
        ["p", e.targetAuthorPubkey]
        // Author of the event
      ], r = await this.config.eventBuilder.kind(7).content(e.reactionType).tags(i).build(), o = await this.config.signingProvider.signEvent(r);
      if ((await this.config.relayManager.publishToAll(o)).filter((d) => d.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const c = {
        eventId: o.id,
        authorPubkey: t,
        targetEventId: e.targetEventId,
        targetAuthorPubkey: e.targetAuthorPubkey,
        reactionType: e.reactionType,
        createdAt: o.created_at,
        isOwn: !0
      }, h = this.getCachedReactions(e.targetEventId);
      return h && (h.reactions.push(c), h.summary = this.aggregateReactions(h.reactions, t), h.timestamp = Date.now(), this.reactionCache.set(e.targetEventId, h), this._reactionUpdates.update((d) => (d.set(e.targetEventId, h.summary), new Map(d)))), this.config.debug && console.log("Created reaction:", c), {
        success: !0,
        eventId: o.id,
        reaction: c
      };
    } catch (t) {
      return this.config.debug && console.error("Error creating reaction:", t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error"
      };
    }
  }
  /**
   * Get reactions for an event
   */
  async getReactions(e, t = {}) {
    try {
      if (t.useCache !== !1) {
        const s = this.getCachedReactions(e);
        if (s)
          return s;
      }
      return this.fetchReactions(e, t);
    } catch (s) {
      return this.config.debug && console.error("Error fetching reactions:", s), null;
    }
  }
  /**
   * Get reaction summary for an event
   */
  async getSummary(e, t = {}) {
    const s = await this.getReactions(e, t);
    return (s == null ? void 0 : s.summary) || null;
  }
  /**
   * Watch an event for real-time reaction updates
   */
  async watch(e) {
    try {
      const t = await this.getReactions(e);
      if (t)
        this._watchedEvents.update((r) => (r.set(e, t.summary), new Map(r)));
      else {
        const r = this.config.signingProvider ? await this.config.signingProvider.getPublicKey() : "", o = {
          targetEventId: e,
          totalCount: 0,
          reactions: {},
          userReacted: !1
        };
        this._watchedEvents.update((a) => (a.set(e, o), new Map(a)));
      }
      const s = {
        kinds: [7],
        "#e": [e],
        since: Math.floor(Date.now() / 1e3)
        // Only new reactions
      }, i = await this.config.subscriptionManager.subscribe([s], {
        onEvent: (r) => {
          if (r.kind === 7) {
            const o = this.parseReactionEvent(r);
            o && o.targetEventId === e && this.handleNewReaction(o);
          }
        }
      });
      return this.activeSubscriptions.set(e, i), this.config.debug && console.log(`Started watching reactions for event: ${e}`), !0;
    } catch (t) {
      return this.config.debug && console.error("Error watching reactions:", t), !1;
    }
  }
  /**
   * Stop watching an event for reactions
   */
  async unwatch(e) {
    const t = this.activeSubscriptions.get(e);
    t && (await this.config.subscriptionManager.close(t), this.activeSubscriptions.delete(e)), this._watchedEvents.update((s) => (s.delete(e), new Map(s))), this.config.debug && console.log(`Stopped watching reactions for event: ${e}`);
  }
  /**
   * Update signing provider
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e;
  }
  /**
   * Close all subscriptions and cleanup
   */
  async close() {
    const e = Array.from(this.activeSubscriptions.values()).map(
      (t) => this.config.subscriptionManager.close(t)
    );
    await Promise.allSettled(e), this.activeSubscriptions.clear(), this.reactionCache.clear(), this.config.debug && console.log("ReactionManager: Closed all subscriptions and cleared cache");
  }
  // Private helper methods
  async fetchReactions(e, t) {
    const s = [
      {
        kinds: [7],
        "#e": [e],
        limit: t.limit || 100
      }
    ];
    return new Promise((i) => {
      let r = !1;
      const o = [], a = /* @__PURE__ */ new Set(), l = setTimeout(() => {
        if (!r)
          if (r = !0, o.length > 0) {
            const c = this.buildReactionCache(e, o);
            this.cacheReactions(e, c), i(c);
          } else
            i(null);
      }, t.timeout || 5e3);
      this.config.subscriptionManager.subscribe(s, {
        onEvent: (c) => {
          if (c.kind === 7 && !a.has(c.id)) {
            a.add(c.id);
            const h = this.parseReactionEvent(c);
            h && h.targetEventId === e && o.push(h);
          }
        },
        onEose: () => {
          if (!r)
            if (r = !0, clearTimeout(l), o.length > 0) {
              const c = this.buildReactionCache(e, o);
              this.cacheReactions(e, c), i(c);
            } else
              i(null);
        }
      });
    });
  }
  parseReactionEvent(e) {
    var t;
    try {
      const s = e.tags.find((o) => o[0] === "e");
      if (!s || s.length < 2)
        return null;
      const i = e.tags.find((o) => o[0] === "p");
      if (!i || i.length < 2)
        return null;
      const r = (t = this.config.signingProvider) != null && t.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
      return {
        eventId: e.id,
        authorPubkey: e.pubkey,
        targetEventId: s[1],
        targetAuthorPubkey: i[1],
        reactionType: e.content,
        createdAt: e.created_at,
        isOwn: !1
        // Will be updated based on pubkey comparison
      };
    } catch (s) {
      return this.config.debug && console.error("Error parsing reaction event:", s), null;
    }
  }
  buildReactionCache(e, t) {
    var i;
    const s = (i = this.config.signingProvider) != null && i.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
    return {
      summary: this.aggregateReactions(t, s),
      reactions: t,
      timestamp: Date.now(),
      ttl: 3e5
      // 5 minutes
    };
  }
  aggregateReactions(e, t) {
    var o;
    const s = {};
    let i = !1, r;
    for (const a of e)
      typeof t == "string" && (a.isOwn = a.authorPubkey === t, a.isOwn && (i = !0, r = a.reactionType)), s[a.reactionType] || (s[a.reactionType] = {
        type: a.reactionType,
        count: 0,
        authors: []
      }), s[a.reactionType].count++, s[a.reactionType].authors.includes(a.authorPubkey) || s[a.reactionType].authors.push(a.authorPubkey);
    return {
      targetEventId: ((o = e[0]) == null ? void 0 : o.targetEventId) || "",
      totalCount: e.length,
      reactions: s,
      userReacted: i,
      userReactionType: r
    };
  }
  handleNewReaction(e) {
    var s;
    const t = this.getCachedReactions(e.targetEventId);
    if (t) {
      t.reactions.push(e);
      const i = (s = this.config.signingProvider) != null && s.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
      t.summary = this.aggregateReactions(t.reactions, i), t.timestamp = Date.now();
    }
    this._reactionUpdates.update((i) => {
      const r = (t == null ? void 0 : t.summary) || this.aggregateReactions([e], "");
      return i.set(e.targetEventId, r), new Map(i);
    }), this._watchedEvents.update((i) => {
      const r = (t == null ? void 0 : t.summary) || this.aggregateReactions([e], "");
      return i.set(e.targetEventId, r), new Map(i);
    });
  }
  getCachedReactions(e) {
    const t = this.reactionCache.get(e);
    return t ? Date.now() - t.timestamp > t.ttl ? (this.reactionCache.delete(e), null) : t : null;
  }
  cacheReactions(e, t) {
    this.reactionCache.set(e, t);
  }
}
class Ts {
  constructor(e) {
    u(this, "config");
    u(this, "feedCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // Reactive stores
    u(this, "_globalFeed", I([]));
    u(this, "_followingFeed", I([]));
    // Public reactive properties
    u(this, "globalFeed");
    u(this, "followingFeed");
    this.config = e, this.globalFeed = w(this._globalFeed, (t) => t), this.followingFeed = w(this._followingFeed, (t) => t);
  }
  /**
   * Get global feed (recent posts from all users)
   */
  async getGlobalFeed(e = {}) {
    const t = [{
      kinds: e.kinds || [1],
      // Text notes by default
      limit: e.limit || 50,
      since: e.since,
      until: e.until
    }];
    return this.fetchFeed("global", t);
  }
  /**
   * Get following feed (posts from followed users)
   */
  async getFollowingFeed(e = {}) {
    if (!this.config.signingProvider)
      return [];
    try {
      const t = await this.config.signingProvider.getPublicKey(), s = await this.config.contactManager.getContacts(t);
      if (!s || s.followingList.length === 0)
        return [];
      const i = [{
        kinds: e.kinds || [1],
        authors: s.followingList,
        limit: e.limit || 50,
        since: e.since,
        until: e.until
      }];
      return this.fetchFeed("following", i);
    } catch (t) {
      return this.config.debug && console.error("Error getting following feed:", t), [];
    }
  }
  /**
   * Start real-time feed updates
   */
  async startFeedUpdates() {
    const e = {
      kinds: [1],
      since: Math.floor(Date.now() / 1e3),
      limit: 20
    }, t = await this.config.subscriptionManager.subscribe([e], {
      onEvent: (s) => {
        const i = this.eventToFeedItem(s);
        this._globalFeed.update((r) => [i, ...r.slice(0, 99)]);
      }
    });
    if (this.activeSubscriptions.set("global-updates", t), this.config.signingProvider)
      try {
        const s = await this.config.signingProvider.getPublicKey(), i = await this.config.contactManager.getContacts(s);
        if (i && i.followingList.length > 0) {
          const r = {
            kinds: [1],
            authors: i.followingList,
            since: Math.floor(Date.now() / 1e3),
            limit: 20
          }, o = await this.config.subscriptionManager.subscribe([r], {
            onEvent: (a) => {
              const l = this.eventToFeedItem(a);
              this._followingFeed.update((c) => [l, ...c.slice(0, 99)]);
            }
          });
          this.activeSubscriptions.set("following-updates", o);
        }
      } catch (s) {
        this.config.debug && console.error("Error setting up following feed updates:", s);
      }
  }
  /**
   * Stop feed updates
   */
  async stopFeedUpdates() {
    for (const [e, t] of this.activeSubscriptions.entries())
      await this.config.subscriptionManager.close(t);
    this.activeSubscriptions.clear();
  }
  /**
   * Update signing provider
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e;
  }
  /**
   * Close all subscriptions and cleanup
   */
  async close() {
    await this.stopFeedUpdates(), this.feedCache.clear(), this.config.debug && console.log("FeedManager: Closed all subscriptions and cleared cache");
  }
  // Private helper methods
  async fetchFeed(e, t) {
    return new Promise((s) => {
      let i = !1;
      const r = [], o = /* @__PURE__ */ new Set(), a = setTimeout(() => {
        i || (i = !0, this.updateFeedStore(e, r), s(r));
      }, 1e4);
      this.config.subscriptionManager.subscribe(t, {
        onEvent: (l) => {
          if (!o.has(l.id)) {
            o.add(l.id);
            const c = this.eventToFeedItem(l);
            r.push(c);
          }
        },
        onEose: () => {
          i || (i = !0, clearTimeout(a), r.sort((l, c) => c.createdAt - l.createdAt), this.updateFeedStore(e, r), s(r));
        }
      });
    });
  }
  eventToFeedItem(e) {
    return {
      eventId: e.id,
      authorPubkey: e.pubkey,
      content: e.content,
      createdAt: e.created_at,
      kind: e.kind,
      tags: e.tags,
      // Social context will be populated by other managers
      authorProfile: void 0,
      reactionSummary: void 0,
      threadInfo: void 0
    };
  }
  updateFeedStore(e, t) {
    e === "global" ? this._globalFeed.set(t) : e === "following" && this._followingFeed.set(t), this.feedCache.set(e, t);
  }
}
class Cs {
  constructor(e) {
    u(this, "config");
    u(this, "_contactManager");
    u(this, "_threadManager");
    u(this, "_reactionManager");
    u(this, "_feedManager");
    // Public API interfaces
    // profiles: handled by enhanced ProfileModule in core
    u(this, "contacts");
    u(this, "threads");
    u(this, "reactions");
    u(this, "feeds");
    this.config = e, this.contacts = this.getContactManager(), this.threads = this.getThreadManager(), this.reactions = this.getReactionManager(), this.feeds = this.getFeedManager(), this.config.debug && console.log("SocialModule initialized with all managers");
  }
  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e, this._contactManager && await this._contactManager.updateSigningProvider(e), this._threadManager && await this._threadManager.updateSigningProvider(e), this._reactionManager && await this._reactionManager.updateSigningProvider(e), this._feedManager && await this._feedManager.updateSigningProvider(e), this.config.debug && console.log("SocialModule: Updated signing provider for all managers");
  }
  /**
   * Get a specific event by ID with social context
   */
  async getEvent(e) {
    throw new Error("getEvent not yet implemented");
  }
  /**
   * Close all social module subscriptions and cleanup
   */
  async close() {
    var e, t, s, i;
    await Promise.all([
      // this._profileManager.close(), // Removed
      (e = this._contactManager) == null ? void 0 : e.close(),
      (t = this._threadManager) == null ? void 0 : t.close(),
      (s = this._reactionManager) == null ? void 0 : s.close(),
      (i = this._feedManager) == null ? void 0 : i.close()
    ]), this.config.debug && console.log("SocialModule: All managers closed");
  }
  // Lazy initialization methods for better performance
  getContactManager() {
    return this._contactManager || (this._contactManager = new ks({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      // profileManager: removed,
      debug: this.config.debug
    })), this._contactManager;
  }
  getThreadManager() {
    return this._threadManager || (this._threadManager = new _s({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      // profileManager: removed,
      debug: this.config.debug
    })), this._threadManager;
  }
  getReactionManager() {
    return this._reactionManager || (this._reactionManager = new As({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      debug: this.config.debug
    })), this._reactionManager;
  }
  getFeedManager() {
    return this._feedManager || (this._feedManager = new Ts({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      // profileManager: removed,
      contactManager: this.getContactManager(),
      reactionManager: this.getReactionManager(),
      debug: this.config.debug
    })), this._feedManager;
  }
}
class Ns {
  constructor(e) {
    u(this, "subscriptions", /* @__PURE__ */ new Map());
    u(this, "eventCallbacks", /* @__PURE__ */ new Map());
    u(this, "debug");
    this.relayManager = e, this.debug = e.debug || !1, this.setupRelayMessageHandling();
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
      const l = this.generateSubscriptionId(), c = Date.now(), h = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, d = {
        id: l,
        filters: e,
        relays: h,
        state: "pending",
        createdAt: c,
        eventCount: 0,
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      h.forEach((E) => {
        d.relayStates[E] = "active";
      }), t.timeout && (d.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(l);
      }, t.timeout)), this.subscriptions.set(l, d), this.debug && console.log(`Creating subscription ${l} with ${e.length} filters`);
      const g = t.retryAttempts || 1, p = t.retryDelay || 1e3;
      let f = [], y;
      for (let E = 0; E < g; E++)
        try {
          const M = ["REQ", l, ...e];
          try {
            await ((i = (s = this.relayManager).sendToAll) == null ? void 0 : i.call(s, M)), f = h.map((k) => ({
              relay: k,
              success: !0,
              error: void 0
            }));
            break;
          } catch (k) {
            f = [];
            let q = !1;
            for (const le of h)
              try {
                await ((o = (r = this.relayManager).sendToRelays) == null ? void 0 : o.call(r, [le], M)), f.push({
                  relay: le,
                  success: !0,
                  error: void 0
                }), q = !0;
              } catch (_) {
                f.push({
                  relay: le,
                  success: !1,
                  error: _ instanceof Error ? _ : new Error("Unknown error")
                });
              }
            if (q)
              break;
            y = k instanceof Error ? k : new Error("All relays failed");
          }
        } catch (M) {
          y = M instanceof Error ? M : new Error("Unknown error"), f = h.map((k) => ({
            relay: k,
            success: !1,
            error: y
          })), E < g - 1 && await new Promise((k) => setTimeout(k, p));
        }
      const P = f.length > 0 && f.some((E) => E.success);
      return P || (this.subscriptions.delete(l), d.timeoutId && clearTimeout(d.timeoutId)), {
        subscription: P ? this.externalizeSubscription(d) : {},
        success: P,
        relayResults: f,
        error: P ? void 0 : {
          message: y ? y.message : f.length === 0 ? "No relays available" : "All relays failed",
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
      const a = ["REQ", e, ...t.filters], l = this.relayManager.connectedRelays;
      t.relays.length !== l.length || !t.relays.every((h) => l.includes(h)) ? await ((i = (s = this.relayManager).sendToRelays) == null ? void 0 : i.call(s, t.relays, a)) : await ((o = (r = this.relayManager).sendToAll) == null ? void 0 : o.call(r, a));
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
class Pe {
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
    // LRU tracking
    u(this, "accessOrder", []);
    u(this, "lastAccess", /* @__PURE__ */ new Map());
    // Statistics tracking
    u(this, "stats", {
      queryCount: 0,
      totalQueryTime: 0,
      evictedCount: 0,
      createdAt: Date.now()
    });
    this.privateKey = e, this.config = {
      maxEvents: t.maxEvents || 1e4,
      maxMemoryMB: t.maxMemoryMB || 50,
      evictionPolicy: t.evictionPolicy || "lru"
    };
  }
  async addEvent(e) {
    if (e.kind === 1059) {
      try {
        const t = await this.unwrapGiftWrap(e);
        t && await this.addEvent(t);
      } catch (t) {
        console.debug("Failed to unwrap gift wrap:", t);
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
    this.events.clear(), this.eventsByKind.clear(), this.eventsByAuthor.clear(), this.eventsByTag.clear(), this.accessOrder = [], this.lastAccess.clear();
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
    return await re.unwrapGiftWrap(e, this.privateKey);
  }
  updateIndexes(e) {
    this.eventsByKind.has(e.kind) || this.eventsByKind.set(e.kind, /* @__PURE__ */ new Set()), this.eventsByKind.get(e.kind).add(e.id), this.eventsByAuthor.has(e.pubkey) || this.eventsByAuthor.set(e.pubkey, /* @__PURE__ */ new Set()), this.eventsByAuthor.get(e.pubkey).add(e.id), e.tags.forEach((t) => {
      const [s, i] = t;
      if (!i) return;
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
          const l = r.map((h) => a.get(h) || /* @__PURE__ */ new Set()), c = this.unionSets(l);
          t = t ? this.intersectSets([t, c]) : c;
        } else
          t = /* @__PURE__ */ new Set();
      }
    });
    const s = Array.from(t || this.events.keys()).map((i) => this.events.get(i)).filter((i) => i && this.matchesFilter(i, e)).sort((i, r) => r.created_at - i.created_at);
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
    if (e.length === 1) return e[0];
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
    this.lastAccess.set(e, t);
    const s = this.accessOrder.indexOf(e);
    s > -1 && this.accessOrder.splice(s, 1), this.accessOrder.push(e);
  }
  enforceCapacityLimits() {
    if (this.events.size >= this.config.maxEvents && this.evictOldest(), this.estimateMemoryUsage() > this.config.maxMemoryMB)
      for (; this.estimateMemoryUsage() > this.config.maxMemoryMB && this.events.size > 0; )
        this.evictOldest();
  }
  evictOldest() {
    let e;
    this.config.evictionPolicy === "lru" ? e = this.accessOrder.shift() : e = this.events.keys().next().value, e && this.removeEvent(e);
  }
  removeEvent(e) {
    var s, i;
    const t = this.events.get(e);
    t && (this.stats.evictedCount++, this.events.delete(e), (s = this.eventsByKind.get(t.kind)) == null || s.delete(e), (i = this.eventsByAuthor.get(t.pubkey)) == null || i.delete(e), t.tags.forEach((r) => {
      var l, c;
      const [o, a] = r;
      a && ((c = (l = this.eventsByTag.get(o)) == null ? void 0 : l.get(a)) == null || c.delete(e));
    }), this.lastAccess.delete(e));
  }
  estimateMemoryUsage() {
    return this.events.size * 1024 / (1024 * 1024);
  }
}
class De {
  constructor() {
    u(this, "filter", {});
  }
  kinds(e) {
    return this.filter.kinds = e, this;
  }
  authors(e) {
    return this.filter.authors = e, this;
  }
  tags(e, t) {
    return this.filter[`#${e}`] = t, this;
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
  ids(e) {
    return this.filter.ids = e, this;
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
class Fe {
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
  updateData() {
    this._data = this.cache.query(this.filter), this.notifySubscribers();
  }
  notifySubscribers() {
    this.subscribers.forEach((e) => e(this._data));
  }
  matchesFilter(e, t) {
    return this.cache.query({ ...t, ids: [e.id] }).length > 0;
  }
}
let Rs = class extends De {
  constructor(e) {
    super(), this.cache = e;
  }
  execute() {
    return new Fe(this.cache, this.filter);
  }
}, Ds = class extends De {
  constructor(t, s) {
    super();
    u(this, "relayUrls", []);
    this.cache = t, this.subscriptionManager = s;
  }
  relay(t) {
    return this.relayUrls = [t], this;
  }
  relays(t) {
    return this.relayUrls = t, this;
  }
  /**
   * Execute the subscription and return a handle for lifecycle control
   * This provides excellent DX for managing subscriptions
   */
  async execute() {
    var o;
    const t = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {}, s = await this.subscriptionManager.subscribe([this.filter], {
      ...t,
      onEvent: (a) => {
        this.cache.addEvent(a);
      }
    });
    if (!s.success || !s.subscription)
      throw new Error(((o = s.error) == null ? void 0 : o.message) || "Subscription failed");
    const i = s.subscription, r = new Fe(this.cache, this.filter);
    return {
      id: i.id,
      store: r,
      stop: async () => {
        await this.subscriptionManager.close(i.id);
      },
      isActive: () => this.subscriptionManager.getActiveSubscriptions().some((l) => l.id === i.id)
    };
  }
};
class Et {
  constructor(e) {
    u(this, "cache");
    u(this, "stats", {
      profileHits: 0,
      profileMisses: 0,
      followListHits: 0,
      followListMisses: 0,
      totalQueries: 0,
      totalQueryTime: 0
    });
    this.cache = e;
  }
  /**
   * Get cached profile metadata (kind 0) for a single pubkey
   * Returns null if not in cache or stale
   */
  getCachedProfile(e) {
    const t = performance.now();
    this.stats.totalQueries++;
    try {
      const s = this.cache.query({
        kinds: [0],
        authors: [e],
        limit: 1
      }), i = performance.now() - t;
      if (this.stats.totalQueryTime += i, s.length > 0) {
        this.stats.profileHits++;
        const r = s[0];
        try {
          return JSON.parse(r.content);
        } catch {
          return null;
        }
      } else
        return this.stats.profileMisses++, null;
    } catch {
      return this.stats.profileMisses++, null;
    }
  }
  /**
   * Get cached profile metadata for multiple pubkeys
   * Returns Map with only the profiles found in cache
   */
  getCachedProfiles(e) {
    const t = performance.now();
    this.stats.totalQueries++;
    const s = /* @__PURE__ */ new Map();
    try {
      const i = this.cache.query({
        kinds: [0],
        authors: e,
        limit: e.length * 2
        // Allow for multiple profiles per author
      }), r = performance.now() - t;
      this.stats.totalQueryTime += r;
      const o = /* @__PURE__ */ new Map();
      i.forEach((l) => {
        const c = o.get(l.pubkey);
        (!c || l.created_at > c.created_at) && o.set(l.pubkey, l);
      }), o.forEach((l, c) => {
        try {
          const h = JSON.parse(l.content);
          s.set(c, h), this.stats.profileHits++;
        } catch {
          this.stats.profileMisses++;
        }
      });
      const a = new Set(s.keys());
      return e.forEach((l) => {
        a.has(l) || this.stats.profileMisses++;
      }), s;
    } catch {
      return this.stats.profileMisses += e.length, s;
    }
  }
  /**
   * Get cached follow list (kind 3) for a pubkey
   * Returns null if not in cache
   */
  getCachedFollowList(e) {
    const t = performance.now();
    this.stats.totalQueries++;
    try {
      const s = this.cache.query({
        kinds: [3],
        authors: [e],
        limit: 1
      }), i = performance.now() - t;
      if (this.stats.totalQueryTime += i, s.length > 0) {
        this.stats.followListHits++;
        const r = s[0];
        return this.parseFollowListEvent(r);
      } else
        return this.stats.followListMisses++, null;
    } catch {
      return this.stats.followListMisses++, null;
    }
  }
  /**
   * Check if we have recent profile data in cache
   * Useful for deciding whether to fetch from relay
   */
  hasRecentProfile(e, t = 30) {
    try {
      const s = this.cache.query({
        kinds: [0],
        authors: [e],
        limit: 1
      });
      if (s.length === 0) return !1;
      const i = s[0];
      return (Date.now() / 1e3 - i.created_at) / 60 <= t;
    } catch {
      return !1;
    }
  }
  /**
   * Check if we have recent follow list data in cache
   */
  hasRecentFollowList(e, t = 60) {
    try {
      const s = this.cache.query({
        kinds: [3],
        authors: [e],
        limit: 1
      });
      if (s.length === 0) return !1;
      const i = s[0];
      return (Date.now() / 1e3 - i.created_at) / 60 <= t;
    } catch {
      return !1;
    }
  }
  /**
   * Get comprehensive cache statistics
   */
  getProfileCacheStats() {
    const e = this.stats.profileHits + this.stats.followListHits, t = this.stats.profileMisses + this.stats.followListMisses, s = e + t;
    return {
      profileHits: this.stats.profileHits,
      profileMisses: this.stats.profileMisses,
      followListHits: this.stats.followListHits,
      followListMisses: this.stats.followListMisses,
      totalQueries: this.stats.totalQueries,
      hitRate: s > 0 ? e / s * 100 : 0,
      avgQueryTime: this.stats.totalQueries > 0 ? this.stats.totalQueryTime / this.stats.totalQueries : 0
    };
  }
  /**
   * Reset statistics (useful for testing)
   */
  resetStats() {
    this.stats = {
      profileHits: 0,
      profileMisses: 0,
      followListHits: 0,
      followListMisses: 0,
      totalQueries: 0,
      totalQueryTime: 0
    };
  }
  // Private helper methods
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
      return console.warn("Failed to parse follow list event:", s), [];
    }
  }
}
class vt {
  constructor(e) {
    u(this, "config");
    u(this, "store");
    u(this, "subscriptionId");
    u(this, "subscriptionResult");
    u(this, "cacheInterface");
    // Phase 8: Cache interface
    // Derived stores for easy access
    u(this, "profile");
    u(this, "loading");
    u(this, "error");
    this.config = e, e.cache && (this.cacheInterface = new Et(e.cache), e.debug && console.log("📦 ProfileStore: Cache interface initialized for", e.pubkey.substring(0, 16) + "...")), this.store = I({
      profile: null,
      loading: !0,
      error: null,
      verified: !1,
      lastUpdated: null
    }), this.profile = w(this.store, (t) => t.profile), this.loading = w(this.store, (t) => t.loading), this.error = w(this.store, (t) => t.error), this.initialize();
  }
  /**
   * Subscribe to store changes (Svelte store interface)
   */
  subscribe(e) {
    return this.store.subscribe(e);
  }
  /**
   * Refresh profile data - Phase 8: Cache-first strategy
   */
  async refresh() {
    if (this.cacheInterface) {
      const e = this.cacheInterface.getCachedProfile(this.config.pubkey), t = this.cacheInterface.hasRecentProfile(this.config.pubkey, 30);
      if (e && t) {
        const s = {
          pubkey: this.config.pubkey,
          metadata: e
        }, i = await this.checkNip05Verification(s);
        this.store.set({
          profile: s,
          loading: !1,
          error: null,
          verified: i,
          lastUpdated: /* @__PURE__ */ new Date()
        }), this.config.debug && console.log("📦 ProfileStore: Cache hit for", this.config.pubkey.substring(0, 16) + "...");
        return;
      } else this.config.debug && console.log("🔄 ProfileStore: Cache miss or stale for", this.config.pubkey.substring(0, 16) + "...");
    }
    this.store.update((e) => ({ ...e, loading: !0, error: null }));
    try {
      const e = {
        kinds: [0],
        authors: [this.config.pubkey],
        limit: 1
      };
      let t = !1, s = null;
      const i = await this.config.subscriptionManager.subscribe([e], {
        onEvent: async (r) => {
          if (r.kind === 0 && r.pubkey === this.config.pubkey && !t) {
            t = !0, s = await this.parseProfileEvent(r);
            const o = await this.checkNip05Verification(s);
            this.store.set({
              profile: s,
              loading: !1,
              error: null,
              verified: o,
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        },
        onEose: () => {
          t || this.store.set({
            profile: null,
            loading: !1,
            error: null,
            verified: !1,
            lastUpdated: /* @__PURE__ */ new Date()
          });
        },
        onError: (r) => {
          this.store.update((o) => ({
            ...o,
            loading: !1,
            error: r
          }));
        }
      });
      setTimeout(async () => {
        i.success && i.subscription && await this.config.subscriptionManager.close(i.subscription.id), t || this.store.set({
          profile: null,
          loading: !1,
          error: null,
          verified: !1,
          lastUpdated: /* @__PURE__ */ new Date()
        });
      }, 3e3);
    } catch (e) {
      this.store.update((t) => ({
        ...t,
        loading: !1,
        error: e instanceof Error ? e : new Error("Failed to fetch profile")
      }));
    }
  }
  /**
   * Subscribe to real-time profile updates
   */
  async startSubscription() {
    if (this.subscriptionId) return;
    const e = {
      kinds: [0],
      authors: [this.config.pubkey],
      limit: 1
    };
    try {
      const t = await this.config.subscriptionManager.subscribe([e], {
        onEvent: (s) => {
          s.kind === 0 && s.pubkey === this.config.pubkey && this.handleProfileUpdate(s);
        },
        onError: (s) => {
          this.store.update((i) => ({ ...i, error: s }));
        }
      });
      t.success && t.subscription && (this.subscriptionId = t.subscription.id, this.subscriptionResult = t, this.config.debug && console.log(`ProfileStore: Subscribed to profile updates for ${this.config.pubkey}`));
    } catch (t) {
      this.store.update((s) => ({
        ...s,
        error: t instanceof Error ? t : new Error("Failed to subscribe")
      }));
    }
  }
  /**
   * Unsubscribe from profile updates
   */
  async unsubscribe() {
    this.subscriptionId && (await this.config.subscriptionManager.close(this.subscriptionId), this.subscriptionId = void 0, this.subscriptionResult = void 0, this.config.debug && console.log(`ProfileStore: Unsubscribed from profile updates for ${this.config.pubkey}`));
  }
  /**
   * Clean up resources
   */
  async close() {
    await this.unsubscribe();
  }
  // Private helper methods
  async initialize() {
    if (this.cacheInterface) {
      const e = this.cacheInterface.getCachedProfile(this.config.pubkey);
      if (e) {
        const t = {
          pubkey: this.config.pubkey,
          metadata: e
        };
        this.store.set({
          profile: t,
          loading: !1,
          // No loading spinner for cached data
          error: null,
          verified: !1,
          // Will be updated async
          lastUpdated: /* @__PURE__ */ new Date()
        }), this.checkNip05Verification(t).then((s) => {
          this.store.update((i) => ({ ...i, verified: s }));
        }).catch(() => {
        }), this.config.debug && console.log("⚡ ProfileStore: Instant load from cache for", this.config.pubkey.substring(0, 16) + "...");
      }
    }
    await this.refresh(), this.startSubscription();
  }
  async parseProfileEvent(e) {
    try {
      const t = JSON.parse(e.content);
      return {
        pubkey: e.pubkey,
        metadata: t,
        lastUpdated: e.created_at,
        eventId: e.id,
        isOwn: !1
        // Will be determined by caller if needed
      };
    } catch {
      throw new Error("Failed to parse profile event");
    }
  }
  async handleProfileUpdate(e) {
    try {
      const t = await this.parseProfileEvent(e), s = await this.checkNip05Verification(t);
      this.store.set({
        profile: t,
        loading: !1,
        error: null,
        verified: s,
        lastUpdated: /* @__PURE__ */ new Date()
      }), this.config.debug && console.log(`ProfileStore: Profile updated for ${this.config.pubkey}`);
    } catch (t) {
      this.store.update((s) => ({
        ...s,
        error: t instanceof Error ? t : new Error("Failed to parse profile update")
      }));
    }
  }
  async checkNip05Verification(e) {
    var t;
    if (!e.metadata.nip05) return !1;
    try {
      const [s, i] = e.metadata.nip05.split("@");
      if (!s || !i) return !1;
      const r = await fetch(`https://${i}/.well-known/nostr.json?name=${s}`);
      return r.ok ? ((t = (await r.json()).names) == null ? void 0 : t[s]) === e.pubkey : !1;
    } catch (s) {
      return this.config.debug && console.error("NIP-05 verification failed:", s), !1;
    }
  }
}
class Mt {
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
    }, i = D.addEventId(s), r = await this.config.signingProvider.signEvent(s);
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
      }, i = D.addEventId(s), r = await this.config.signingProvider.signEvent(s), o = {
        ...i,
        sig: r
      }, l = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (h) => {
          try {
            return await this.config.relayManager.sendToRelay(h, ["EVENT", o]), { success: !0, relay: h };
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
      return l.length > 0 ? (this.config.debug && console.log(`ProfileBuilder: Published to ${l.length} relays`), {
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
      const e = await this.config.signingProvider.getPublicKey(), t = {
        kinds: [0],
        authors: [e],
        limit: 1
      };
      return new Promise((s) => {
        let i = !1;
        const r = setTimeout(() => {
          i || s(null);
        }, 3e3);
        this.config.subscriptionManager.subscribe([t], {
          onEvent: (o) => {
            if (o.kind === 0 && o.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              try {
                const a = JSON.parse(o.content), l = {
                  pubkey: o.pubkey,
                  metadata: a,
                  lastUpdated: o.created_at,
                  eventId: o.id,
                  isOwn: !0
                };
                s(l);
              } catch {
                s(null);
              }
            }
          },
          onEose: () => {
            i || (clearTimeout(r), s(null));
          }
        });
      });
    } catch {
      return null;
    }
  }
}
class Pt {
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
   * Execute batch profile fetch
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
    this.config.debug && console.log(`ProfileBatchBuilder: Fetching ${this.pubkeys.length} profiles`);
    try {
      const e = {
        kinds: [0],
        authors: this.pubkeys,
        limit: this.pubkeys.length
      }, t = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
      let i = 0;
      return this.pubkeys.forEach((r) => {
        t.set(r, null);
      }), new Promise((r) => {
        let o = !1;
        const a = setTimeout(() => {
          o || (o = !0, r({
            profiles: t,
            success: !0,
            errors: s,
            totalRequested: this.pubkeys.length,
            totalFound: i
          }));
        }, 5e3);
        this.config.subscriptionManager.subscribe([e], {
          onEvent: (l) => {
            if (l.kind === 0 && this.pubkeys.includes(l.pubkey))
              try {
                const c = JSON.parse(l.content), h = {
                  pubkey: l.pubkey,
                  metadata: c,
                  lastUpdated: l.created_at,
                  eventId: l.id,
                  isOwn: !1
                  // Batch operations are typically for other users
                };
                t.set(l.pubkey, h), i++, this.config.debug && console.log(`ProfileBatchBuilder: Found profile for ${l.pubkey.substring(0, 16)}...`);
              } catch (c) {
                s.set(l.pubkey, "Failed to parse profile data"), this.config.debug && console.error(`ProfileBatchBuilder: Parse error for ${l.pubkey}:`, c);
              }
          },
          onEose: () => {
            o || (o = !0, clearTimeout(a), this.config.debug && console.log(`ProfileBatchBuilder: Batch complete - found ${i}/${this.pubkeys.length} profiles`), r({
              profiles: t,
              success: !0,
              errors: s,
              totalRequested: this.pubkeys.length,
              totalFound: i
            }));
          },
          onError: (l) => {
            o || (o = !0, clearTimeout(a), this.pubkeys.forEach((c) => {
              s.set(c, l.message);
            }), r({
              profiles: t,
              success: !1,
              errors: s,
              totalRequested: this.pubkeys.length,
              totalFound: i
            }));
          }
        });
      });
    } catch (e) {
      const t = /* @__PURE__ */ new Map();
      return this.pubkeys.forEach((s) => {
        t.set(s, e instanceof Error ? e.message : "Unknown error");
      }), {
        profiles: /* @__PURE__ */ new Map(),
        success: !1,
        errors: t,
        totalRequested: this.pubkeys.length,
        totalFound: 0
      };
    }
  }
  /**
   * Create a reactive store for batch profile operations
   */
  asStore() {
    if (this.pubkeys.length === 0)
      return I({
        profiles: /* @__PURE__ */ new Map(),
        loading: !1,
        loadingStates: /* @__PURE__ */ new Map(),
        errors: /* @__PURE__ */ new Map(),
        lastUpdated: /* @__PURE__ */ new Date()
      });
    const e = I({
      profiles: /* @__PURE__ */ new Map(),
      loading: !0,
      loadingStates: /* @__PURE__ */ new Map(),
      errors: /* @__PURE__ */ new Map(),
      lastUpdated: null
    }), t = /* @__PURE__ */ new Map();
    return this.pubkeys.forEach((s) => {
      t.set(s, !0);
    }), e.update((s) => ({
      ...s,
      loadingStates: t
    })), this.executeBatchForStore(e), e;
  }
  // Private helper methods
  async executeBatchForStore(e) {
    this.config.debug && console.log(`ProfileBatchBuilder: Creating reactive store for ${this.pubkeys.length} profiles`);
    try {
      const t = {
        kinds: [0],
        authors: this.pubkeys,
        limit: this.pubkeys.length
      }, s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
      this.pubkeys.forEach((c) => {
        s.set(c, null), i.set(c, !0);
      }), e.set({
        profiles: s,
        loading: !0,
        loadingStates: i,
        errors: r,
        lastUpdated: null
      });
      let o = !1;
      const a = setTimeout(() => {
        o || (o = !0, this.pubkeys.forEach((c) => {
          i.set(c, !1);
        }), e.update((c) => ({
          ...c,
          loading: !1,
          loadingStates: i,
          lastUpdated: /* @__PURE__ */ new Date()
        })));
      }, 5e3), l = await this.config.subscriptionManager.subscribe([t], {
        onEvent: (c) => {
          if (c.kind === 0 && this.pubkeys.includes(c.pubkey))
            try {
              const h = JSON.parse(c.content), d = {
                pubkey: c.pubkey,
                metadata: h,
                lastUpdated: c.created_at,
                eventId: c.id,
                isOwn: !1
              };
              s.set(c.pubkey, d), i.set(c.pubkey, !1), e.update((g) => ({
                ...g,
                profiles: new Map(s),
                loadingStates: new Map(i)
              })), this.config.debug && console.log(`ProfileBatchBuilder Store: Updated profile for ${c.pubkey.substring(0, 16)}...`);
            } catch (h) {
              r.set(c.pubkey, h instanceof Error ? h : new Error("Parse error")), i.set(c.pubkey, !1), e.update((d) => ({
                ...d,
                loadingStates: new Map(i),
                errors: new Map(r)
              }));
            }
        },
        onEose: () => {
          if (!o && (o = !0, clearTimeout(a), this.pubkeys.forEach((c) => {
            i.set(c, !1);
          }), e.update((c) => ({
            ...c,
            loading: !1,
            loadingStates: new Map(i),
            lastUpdated: /* @__PURE__ */ new Date()
          })), this.config.debug)) {
            const c = Array.from(s.values()).filter((h) => h !== null).length;
            console.log(`ProfileBatchBuilder Store: Batch complete - ${c}/${this.pubkeys.length} profiles`);
          }
        },
        onError: (c) => {
          o || (o = !0, clearTimeout(a), this.pubkeys.forEach((h) => {
            r.set(h, c), i.set(h, !1);
          }), e.update((h) => ({
            ...h,
            loading: !1,
            loadingStates: new Map(i),
            errors: new Map(r),
            lastUpdated: /* @__PURE__ */ new Date()
          })));
        }
      });
      setTimeout(async () => {
        l.success && l.subscription && await this.config.subscriptionManager.close(l.subscription.id);
      }, 1e4);
    } catch (t) {
      const s = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
      this.pubkeys.forEach((r) => {
        s.set(r, !1), i.set(r, t instanceof Error ? t : new Error("Subscription error"));
      }), e.update((r) => ({
        ...r,
        loading: !1,
        loadingStates: s,
        errors: i,
        lastUpdated: /* @__PURE__ */ new Date()
      }));
    }
  }
}
class It {
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
        this.config.subscriptionManager.subscribe([e], {
          onEvent: async (a) => {
            if (a.kind === 0 && !s.has(a.pubkey)) {
              s.add(a.pubkey);
              try {
                const l = await this.parseProfileEvent(a), c = await this.evaluateProfile(l);
                c && (t.push(c), this.config.debug && console.log(`ProfileDiscoveryBuilder: Found match - ${l.metadata.name || "unnamed"} (score: ${c.relevanceScore})`), this.criteria.limit && t.length >= this.criteria.limit && (r || (r = !0, clearTimeout(o), this.finalizeResults(t, i))));
              } catch (l) {
                this.config.debug && console.error("ProfileDiscoveryBuilder: Error processing profile:", l);
              }
            }
          },
          onEose: () => {
            r || (r = !0, clearTimeout(o), this.finalizeResults(t, i));
          },
          onError: (a) => {
            r || (r = !0, clearTimeout(o), this.config.debug && console.error("ProfileDiscoveryBuilder: Search error:", a), i(t));
          }
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
    var a, l;
    const t = [];
    let s = 0, i = 0, r = 0;
    if (this.criteria.nameQuery) {
      r++;
      const c = ((a = e.metadata.name) == null ? void 0 : a.toLowerCase()) || "";
      if (c.includes(this.criteria.nameQuery))
        t.push("name"), i++, c === this.criteria.nameQuery ? s += 1 : c.startsWith(this.criteria.nameQuery) ? s += 0.8 : s += 0.5;
      else
        return null;
    }
    if (this.criteria.nip05Query) {
      r++;
      const c = ((l = e.metadata.nip05) == null ? void 0 : l.toLowerCase()) || "";
      if (c.includes(this.criteria.nip05Query))
        t.push("nip05"), i++, s += c === this.criteria.nip05Query ? 1 : 0.7;
      else
        return null;
    }
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0)
      for (const [c, h] of this.criteria.metadataFilters) {
        r++;
        const d = e.metadata[c];
        d !== void 0 && (h === void 0 ? (t.push(c), i++, s += 0.3) : typeof d == "string" && typeof h == "string" ? d.toLowerCase().includes(h.toLowerCase()) && (t.push(c), i++, s += d.toLowerCase() === h.toLowerCase() ? 0.8 : 0.5) : d === h && (t.push(c), i++, s += 0.8));
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
class St {
  constructor(e) {
    u(this, "config");
    u(this, "store");
    u(this, "subscriptionId");
    // Derived stores for easy access
    u(this, "follows");
    u(this, "count");
    u(this, "loading");
    u(this, "error");
    this.config = e, this.store = I({
      follows: [],
      loading: !0,
      error: null,
      lastUpdated: null
    }), this.follows = w(this.store, (t) => t.follows), this.count = w(this.store, (t) => t.follows.length), this.loading = w(this.store, (t) => t.loading), this.error = w(this.store, (t) => t.error), this.initialize();
  }
  /**
   * Subscribe to store changes (Svelte store interface)
   */
  subscribe(e) {
    return this.store.subscribe(e);
  }
  /**
   * Check if a pubkey is being followed
   */
  isFollowing(e) {
    return w(
      this.store,
      (t) => t.follows.some((s) => s.pubkey === e)
    );
  }
  /**
   * Refresh follow list data by querying relays directly
   */
  async refresh() {
    this.store.update((e) => ({ ...e, loading: !0, error: null }));
    try {
      const e = {
        kinds: [3],
        authors: [this.config.pubkey],
        limit: 1
      };
      let t = !1, s = [];
      const i = await this.config.subscriptionManager.subscribe([e], {
        onEvent: async (r) => {
          r.kind === 3 && r.pubkey === this.config.pubkey && !t && (t = !0, s = this.parseFollowListEvent(r), this.store.set({
            follows: s,
            loading: !1,
            error: null,
            lastUpdated: /* @__PURE__ */ new Date(),
            eventId: r.id
          }), this.config.debug && console.log(`FollowListStore: Found ${s.length} follows for ${this.config.pubkey}`));
        },
        onEose: () => {
          t || (this.store.set({
            follows: [],
            loading: !1,
            error: null,
            lastUpdated: /* @__PURE__ */ new Date()
          }), this.config.debug && console.log(`FollowListStore: No follow list found for ${this.config.pubkey}`));
        },
        onError: (r) => {
          this.store.update((o) => ({
            ...o,
            loading: !1,
            error: r
          }));
        }
      });
      setTimeout(async () => {
        i.success && i.subscription && await this.config.subscriptionManager.close(i.subscription.id), t || this.store.set({
          follows: [],
          loading: !1,
          error: null,
          lastUpdated: /* @__PURE__ */ new Date()
        });
      }, 3e3);
    } catch (e) {
      this.store.update((t) => ({
        ...t,
        loading: !1,
        error: e instanceof Error ? e : new Error("Failed to fetch follow list")
      }));
    }
  }
  /**
   * Subscribe to real-time follow list updates
   */
  async startSubscription() {
    if (this.subscriptionId) return;
    const e = {
      kinds: [3],
      authors: [this.config.pubkey],
      limit: 1
    };
    try {
      const t = await this.config.subscriptionManager.subscribe([e], {
        onEvent: (s) => {
          s.kind === 3 && s.pubkey === this.config.pubkey && this.handleFollowListUpdate(s);
        },
        onError: (s) => {
          this.store.update((i) => ({ ...i, error: s }));
        }
      });
      t.success && t.subscription && (this.subscriptionId = t.subscription.id, this.config.debug && console.log(`FollowListStore: Subscribed to follow list updates for ${this.config.pubkey}`));
    } catch (t) {
      this.store.update((s) => ({
        ...s,
        error: t instanceof Error ? t : new Error("Failed to subscribe")
      }));
    }
  }
  /**
   * Unsubscribe from follow list updates
   */
  async unsubscribe() {
    this.subscriptionId && (await this.config.subscriptionManager.close(this.subscriptionId), this.subscriptionId = void 0, this.config.debug && console.log(`FollowListStore: Unsubscribed from follow list updates for ${this.config.pubkey}`));
  }
  /**
   * Clean up resources
   */
  async close() {
    await this.unsubscribe();
  }
  // Private helper methods
  async initialize() {
    await this.refresh(), this.startSubscription();
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
      return this.config.debug && console.log(`FollowListStore: Parsed ${t.length} follows from event ${e.id}`), t;
    } catch (s) {
      return this.config.debug && console.error("FollowListStore: Failed to parse follow list event:", s), [];
    }
  }
  handleFollowListUpdate(e) {
    try {
      const t = this.parseFollowListEvent(e);
      this.store.set({
        follows: t,
        loading: !1,
        error: null,
        lastUpdated: /* @__PURE__ */ new Date(),
        eventId: e.id
      }), this.config.debug && console.log(`FollowListStore: Follow list updated for ${this.config.pubkey} (${t.length} follows)`);
    } catch (t) {
      this.store.update((s) => ({
        ...s,
        error: t instanceof Error ? t : new Error("Failed to parse follow list update")
      }));
    }
  }
}
class kt {
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
      if (t.some((f) => f.pubkey === this.targetPubkey))
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
        tags: [...t, i].map((f) => {
          const y = ["p", f.pubkey];
          return f.relayUrl && y.push(f.relayUrl), f.petname && y.push(f.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, l = D.addEventId(a), c = await this.config.signingProvider.signEvent(a), h = {
        ...l,
        sig: c
      }, g = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (f) => {
          try {
            return await this.config.relayManager.sendToRelay(f, ["EVENT", h]), { success: !0, relay: f };
          } catch (y) {
            return {
              success: !1,
              relay: f,
              error: y instanceof Error ? y.message : "Unknown error"
            };
          }
        })
      )).filter(
        (f) => f.status === "fulfilled" && f.value.success
      ).map((f) => f.value.relay);
      return g.length > 0 ? (this.config.debug && console.log(`FollowBuilder: Published follow list to ${g.length} relays`), {
        success: !0,
        eventId: h.id
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
      const e = await this.config.signingProvider.getPublicKey(), t = {
        kinds: [3],
        authors: [e],
        limit: 1
      };
      return new Promise((s) => {
        let i = !1;
        const r = setTimeout(() => {
          i || s([]);
        }, 3e3);
        this.config.subscriptionManager.subscribe([t], {
          onEvent: (o) => {
            if (o.kind === 3 && o.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              const a = this.parseFollowListEvent(o);
              s(a);
            }
          },
          onEose: () => {
            i || (clearTimeout(r), s([]));
          }
        });
      });
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
class _t {
  constructor(e) {
    u(this, "config");
    u(this, "toAdd", []);
    u(this, "toRemove", []);
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
   * Publish the batch follow list update
   */
  async publish() {
    if (this.toAdd.length === 0 && this.toRemove.length === 0)
      return {
        success: !1,
        error: "No follow operations specified"
      };
    try {
      const e = await this.config.signingProvider.getPublicKey();
      this.config.debug && console.log(`FollowBatchBuilder: Batch operation - adding ${this.toAdd.length}, removing ${this.toRemove.length}`);
      let s = [...await this.getCurrentFollows()];
      if (this.toRemove.length > 0 && (s = s.filter(
        (g) => !this.toRemove.includes(g.pubkey)
      ), this.config.debug && console.log(`FollowBatchBuilder: Removed ${this.toRemove.length} follows`)), this.toAdd.length > 0) {
        const g = this.toAdd.filter((p) => !s.some((f) => f.pubkey === p)).map((p) => ({ pubkey: p }));
        s.push(...g), this.config.debug && console.log(`FollowBatchBuilder: Added ${g.length} new follows (${this.toAdd.length - g.length} were duplicates)`);
      }
      const r = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.map((g) => {
          const p = ["p", g.pubkey];
          return g.relayUrl && p.push(g.relayUrl), g.petname && p.push(g.petname), p;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, o = D.addEventId(r), a = await this.config.signingProvider.signEvent(r), l = {
        ...o,
        sig: a
      }, h = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (g) => {
          try {
            return await this.config.relayManager.sendToRelay(g, ["EVENT", l]), { success: !0, relay: g };
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
      return h.length > 0 ? (this.config.debug && (console.log(`FollowBatchBuilder: Published batch update to ${h.length} relays`), console.log(`FollowBatchBuilder: Final follow list has ${s.length} follows`)), {
        success: !0,
        eventId: l.id
      }) : {
        success: !1,
        error: "Failed to publish to any relay"
      };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Failed to publish batch update"
      };
    }
  }
  // Private helper methods
  async getCurrentFollows() {
    try {
      const e = await this.config.signingProvider.getPublicKey(), t = {
        kinds: [3],
        authors: [e],
        limit: 1
      };
      return new Promise((s) => {
        let i = !1;
        const r = setTimeout(() => {
          i || s([]);
        }, 3e3);
        this.config.subscriptionManager.subscribe([t], {
          onEvent: (o) => {
            if (o.kind === 3 && o.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              const a = this.parseFollowListEvent(o);
              s(a);
            }
          },
          onEose: () => {
            i || (clearTimeout(r), s([]));
          }
        });
      });
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
      return this.config.debug && console.error("FollowBatchBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class At {
  constructor(e) {
    u(this, "config");
    u(this, "followStores", /* @__PURE__ */ new Map());
    this.config = e;
  }
  /**
   * Get own follow list as a reactive store
   */
  async mine() {
    if (!this.config.signingProvider)
      throw new Error("Cannot access own follow list: No signing provider available. Initialize signing first.");
    const e = await this.config.signingProvider.getPublicKey();
    return this.of(e);
  }
  /**
   * Get follow list for any pubkey as a reactive store
   */
  of(e) {
    if (this.followStores.has(e))
      return this.followStores.get(e);
    const t = new St({
      pubkey: e,
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
    return this.followStores.set(e, t), t;
  }
  /**
   * Phase 4: Add a user to follow list
   * Returns FollowBuilder for fluent API configuration
   */
  add(e) {
    if (!this.config.signingProvider)
      throw new Error("Cannot add follow: No signing provider available. Initialize signing first.");
    return new kt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
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
      if (!s.some((f) => f.pubkey === e))
        return this.config.debug && console.log("FollowsModule: Not following", e.substring(0, 16) + "..."), {
          success: !1,
          error: "Not following this user"
        };
      const a = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.filter((f) => f.pubkey !== e).map((f) => {
          const y = ["p", f.pubkey];
          return f.relayUrl && y.push(f.relayUrl), f.petname && y.push(f.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: t
      }, l = D.addEventId(a), c = await this.config.signingProvider.signEvent(a), h = {
        ...l,
        sig: c
      }, g = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (f) => {
          try {
            return await this.config.relayManager.sendToRelay(f, ["EVENT", h]), { success: !0, relay: f };
          } catch (y) {
            return {
              success: !1,
              relay: f,
              error: y instanceof Error ? y.message : "Unknown error"
            };
          }
        })
      )).filter(
        (f) => f.status === "fulfilled" && f.value.success
      ).map((f) => f.value.relay);
      return g.length > 0 ? (this.config.debug && console.log(`FollowsModule: Published updated follow list to ${g.length} relays`), {
        success: !0,
        eventId: h.id
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
    return new _t({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
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
    for (const e of this.followStores.values())
      await e.close();
    this.followStores.clear();
  }
  // Private helper methods
  async getCurrentFollows() {
    try {
      const e = await this.config.signingProvider.getPublicKey(), t = {
        kinds: [3],
        authors: [e],
        limit: 1
      };
      return new Promise((s) => {
        let i = !1;
        const r = setTimeout(() => {
          i || s([]);
        }, 3e3);
        this.config.subscriptionManager.subscribe([t], {
          onEvent: (o) => {
            if (o.kind === 3 && o.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              const a = this.parseFollowListEvent(o);
              s(a);
            }
          },
          onEose: () => {
            i || (clearTimeout(r), s([]));
          }
        });
      });
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
      return this.config.debug && console.error("FollowsModule: Failed to parse follow list event:", s), [];
    }
  }
}
class Tt {
  constructor(e) {
    u(this, "config");
    u(this, "profileStores", /* @__PURE__ */ new Map());
    u(this, "_follows");
    this.config = e;
  }
  /**
   * Get a reactive profile store for any pubkey
   * This is the main entry point for profile subscriptions
   */
  get(e) {
    if (this.profileStores.has(e))
      return this.profileStores.get(e);
    const t = new vt({
      pubkey: e,
      subscriptionManager: this.config.subscriptionManager,
      cache: this.config.cache,
      // Phase 8: Pass cache to ProfileStore
      debug: this.config.debug
    });
    return t.refresh().catch((s) => {
      this.config.debug && console.error("Failed to start profile loading:", s);
    }), this.profileStores.set(e, t), t;
  }
  /**
   * Phase 2: Profile Creation & Updates - Fluent Builder API
   * Creates a ProfileBuilder for updating profiles with field preservation
   */
  edit() {
    if (!this.config.signingProvider)
      throw new Error("Cannot edit profile: No signing provider available. Initialize signing first.");
    return new Mt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
    });
  }
  /**
   * Phase 3: Follow List Operations - Access to follow lists
   * Get access to follow list management (mine() and of() methods)
   */
  get follows() {
    return this._follows || (this._follows = new At({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      debug: this.config.debug
    })), this._follows;
  }
  /**
   * Phase 5: Batch Profile Operations - Efficient multiple profile fetching
   * Creates a ProfileBatchBuilder for bulk profile operations
   */
  batch() {
    return new Pt({
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
  }
  /**
   * Phase 6: Profile Discovery - Search and discover profiles
   * Creates a ProfileDiscoveryBuilder for profile search operations
   */
  discover() {
    return new It({
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
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
    for (const e of this.profileStores.values())
      await e.close();
    this.profileStores.clear(), this._follows && await this._follows.close();
  }
}
class oi {
  constructor(e = {}) {
    u(this, "relayManager");
    u(this, "subscriptionManager");
    u(this, "cache");
    u(this, "signingProvider");
    u(this, "signingMethod");
    u(this, "config");
    u(this, "giftWrapSubscriptionActive", !1);
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
    console.log("🔥 NostrUnchained v0.1.0-FIX (build:", (/* @__PURE__ */ new Date()).toISOString().substring(0, 19) + "Z)"), this.config = {
      relays: e.relays ?? qt,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? se.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? se.RETRY_DELAY,
      timeout: e.timeout ?? se.PUBLISH_TIMEOUT,
      signingProvider: e.signingProvider
    }, this.relayManager = new ts(this.config.relays, {
      debug: this.config.debug
    }), this.subscriptionManager = new Ns(this.relayManager), this.events = new rs(this), e.signingProvider ? (this.signingProvider = e.signingProvider, this.signingMethod = e.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary", this.cache = new Pe("", {}), this._initializeCache().catch((t) => {
      this.config.debug && console.log("⚠️ Cache initialization with private key failed:", t);
    }), this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!")) : (this.cache = new Pe("", {}), this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later")), this.dm = new mt({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    }), this.social = new Cs({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      eventBuilder: new D(),
      debug: this.config.debug
    }), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays);
  }
  /**
   * Initialize cache with signing provider's private key
   */
  async _initializeCache() {
    if (this.signingProvider)
      try {
        const e = await this.signingProvider.getPrivateKeyForEncryption();
        this.cache = new Pe(e, {});
        const t = await this.signingProvider.getPublicKey();
        this.universalDM = new Is(this, t), this.config.debug && console.log("🎯 Universal Cache and Universal DM Module initialized");
      } catch {
        this.cache = new Pe("", {}), this.config.debug && console.log("⚠️ Could not get private key for cache, using empty key (no gift wrap decryption)");
      }
  }
  /**
   * Get enhanced profile module (PERFECT DX - always works!)
   */
  get profile() {
    return this._profile || (this._profile = new Tt({
      relayManager: this.relayManager,
      subscriptionManager: this.subscriptionManager,
      signingProvider: this.signingProvider,
      eventBuilder: new D(),
      cache: this.cache,
      debug: this.config.debug
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
      const { provider: t, method: s } = await ss.createBestAvailable();
      this.signingProvider = t, this.signingMethod = s;
    }
    await this._initializeCache(), await this.dm.updateSigningProvider(this.signingProvider), await this.social.updateSigningProvider(this.signingProvider), this._profile && await this._profile.updateSigningProvider(this.signingProvider), this.config.debug && console.log(`Initialized signing with method: ${this.signingMethod}`);
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
      throw C.handleConnectionError("relays", e);
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
      const e = await this.signingProvider.getPublicKey(), t = await this.subscriptionManager.subscribe({
        filters: [{
          kinds: [1059],
          // Gift wrap events
          "#p": [e],
          limit: 100
          // Get recent messages
        }],
        relays: this.config.relays,
        onEvent: async (s) => {
          this.config.debug && console.log(`🎁 Received gift wrap event: ${s.id.substring(0, 8)}...`);
        },
        onEose: () => {
          this.config.debug && console.log("🎁 Gift wrap initial sync completed");
        }
      });
      this.giftWrapSubscriptionActive = !0, this.config.debug && console.log("🎁 Universal gift wrap subscription started successfully");
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
   * Publish an event
   */
  async publish(e) {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = await new D(this.signingProvider).buildAndSign(e);
    return this.relayManager.publish(s);
  }
  /**
   * Get public key
   */
  async getPublicKey() {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    return this.signingProvider.getPublicKey();
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
    return new Rs(this.cache);
  }
  /**
   * Create a subscription builder
   */
  sub() {
    return new Ds(this.cache, this.subscriptionManager);
  }
  /**
   * Get the Universal Event Cache for advanced usage
   */
  getCache() {
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
   * Get debug info
   */
  getDebugInfo() {
    return {
      signingMethod: this.signingMethod || "none",
      connectedRelays: this.connectedRelays.length,
      cacheSize: this.cache.getStatistics().totalEvents,
      subscriptions: 0,
      // TODO: Get from subscription manager
      giftWrapActive: this.giftWrapSubscriptionActive
    };
  }
}
class ai extends De {
  constructor(e) {
    super(), this.cache = e;
  }
  execute() {
    return new Fe(this.cache, this.filter);
  }
}
class ci extends De {
  constructor(t, s) {
    super();
    u(this, "relayUrls", []);
    this.cache = t, this.subscriptionManager = s;
  }
  relay(t) {
    return this.relayUrls = [t], this;
  }
  relays(t) {
    return this.relayUrls = t, this;
  }
  /**
   * Execute the subscription and return a handle for lifecycle control
   * This provides excellent DX for managing subscriptions
   */
  async execute() {
    var o;
    const t = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {}, s = await this.subscriptionManager.subscribe([this.filter], {
      ...t,
      onEvent: (a) => {
        this.cache.addEvent(a);
      }
    });
    if (!s.success || !s.subscription)
      throw new Error(((o = s.error) == null ? void 0 : o.message) || "Subscription failed");
    const i = s.subscription, r = new Fe(this.cache, this.filter);
    return {
      id: i.id,
      store: r,
      stop: async () => {
        await this.subscriptionManager.close(i.id);
      },
      isActive: () => this.subscriptionManager.getActiveSubscriptions().some((l) => l.id === i.id)
    };
  }
}
const li = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: bt,
  DMModule: mt,
  DMRoom: wt,
  EphemeralKeyManager: ke,
  GiftWrapCreator: _e,
  GiftWrapProtocol: re,
  NIP44Crypto: S,
  SealCreator: pe,
  TimestampRandomizer: Ve
}, Symbol.toStringTag, { value: "Module" })), ui = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FollowBatchBuilder: _t,
  FollowBuilder: kt,
  FollowListStore: St,
  FollowsModule: At,
  ProfileBatchBuilder: Pt,
  ProfileBuilder: Mt,
  ProfileCacheInterface: Et,
  ProfileDiscoveryBuilder: It,
  ProfileModule: Tt,
  ProfileStore: vt
}, Symbol.toStringTag, { value: "Module" }));
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Ct(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function Nt(n, e) {
  return Array.isArray(e) ? e.length === 0 ? !0 : n ? e.every((t) => typeof t == "string") : e.every((t) => Number.isSafeInteger(t)) : !1;
}
function Fs(n) {
  if (typeof n != "function")
    throw new Error("function expected");
  return !0;
}
function Ee(n, e) {
  if (typeof e != "string")
    throw new Error(`${n}: string expected`);
  return !0;
}
function Rt(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function We(n) {
  if (!Array.isArray(n))
    throw new Error("array expected");
}
function Dt(n, e) {
  if (!Nt(!0, e))
    throw new Error(`${n}: array of strings expected`);
}
function Ft(n, e) {
  if (!Nt(!1, e))
    throw new Error(`${n}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function xs(...n) {
  const e = (r) => r, t = (r, o) => (a) => r(o(a)), s = n.map((r) => r.encode).reduceRight(t, e), i = n.map((r) => r.decode).reduce(t, e);
  return { encode: s, decode: i };
}
// @__NO_SIDE_EFFECTS__
function Ls(n) {
  const e = typeof n == "string" ? n.split("") : n, t = e.length;
  Dt("alphabet", e);
  const s = new Map(e.map((i, r) => [i, r]));
  return {
    encode: (i) => (We(i), i.map((r) => {
      if (!Number.isSafeInteger(r) || r < 0 || r >= t)
        throw new Error(`alphabet.encode: digit index outside alphabet "${r}". Allowed: ${n}`);
      return e[r];
    })),
    decode: (i) => (We(i), i.map((r) => {
      Ee("alphabet.decode", r);
      const o = s.get(r);
      if (o === void 0)
        throw new Error(`Unknown letter: "${r}". Allowed: ${n}`);
      return o;
    }))
  };
}
// @__NO_SIDE_EFFECTS__
function Os(n = "") {
  return Ee("join", n), {
    encode: (e) => (Dt("join.decode", e), e.join(n)),
    decode: (e) => (Ee("join.decode", e), e.split(n))
  };
}
const xt = (n, e) => e === 0 ? n : xt(e, n % e), Ce = /* @__NO_SIDE_EFFECTS__ */ (n, e) => n + (e - xt(n, e)), Ae = /* @__PURE__ */ (() => {
  let n = [];
  for (let e = 0; e < 40; e++)
    n.push(2 ** e);
  return n;
})();
function He(n, e, t, s) {
  if (We(n), e <= 0 || e > 32)
    throw new Error(`convertRadix2: wrong from=${e}`);
  if (t <= 0 || t > 32)
    throw new Error(`convertRadix2: wrong to=${t}`);
  if (/* @__PURE__ */ Ce(e, t) > 32)
    throw new Error(`convertRadix2: carry overflow from=${e} to=${t} carryBits=${/* @__PURE__ */ Ce(e, t)}`);
  let i = 0, r = 0;
  const o = Ae[e], a = Ae[t] - 1, l = [];
  for (const c of n) {
    if (Rt(c), c >= o)
      throw new Error(`convertRadix2: invalid data word=${c} from=${e}`);
    if (i = i << e | c, r + e > 32)
      throw new Error(`convertRadix2: carry overflow pos=${r} from=${e}`);
    for (r += e; r >= t; r -= t)
      l.push((i >> r - t & a) >>> 0);
    const h = Ae[r];
    if (h === void 0)
      throw new Error("invalid carry");
    i &= h - 1;
  }
  if (i = i << t - r & a, !s && r >= e)
    throw new Error("Excess padding");
  if (!s && i > 0)
    throw new Error(`Non-zero padding: ${i}`);
  return s && r > 0 && l.push(i >>> 0), l;
}
// @__NO_SIDE_EFFECTS__
function Us(n, e = !1) {
  if (Rt(n), n <= 0 || n > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ Ce(8, n) > 32 || /* @__PURE__ */ Ce(n, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (t) => {
      if (!Ct(t))
        throw new Error("radix2.encode input should be Uint8Array");
      return He(Array.from(t), 8, n, !e);
    },
    decode: (t) => (Ft("radix2.decode", t), Uint8Array.from(He(t, n, 8, e)))
  };
}
function ct(n) {
  return Fs(n), function(...e) {
    try {
      return n.apply(null, e);
    } catch {
    }
  };
}
const ze = /* @__PURE__ */ xs(/* @__PURE__ */ Ls("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ Os("")), lt = [996825010, 642813549, 513874426, 1027748829, 705979059];
function fe(n) {
  const e = n >> 25;
  let t = (n & 33554431) << 5;
  for (let s = 0; s < lt.length; s++)
    (e >> s & 1) === 1 && (t ^= lt[s]);
  return t;
}
function ut(n, e, t = 1) {
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
  return i ^= t, ze.encode(He([i % Ae[30]], 30, 5, !1));
}
// @__NO_SIDE_EFFECTS__
function $s(n) {
  const e = n === "bech32" ? 1 : 734539939, t = /* @__PURE__ */ Us(5), s = t.decode, i = t.encode, r = ct(s);
  function o(d, g, p = 90) {
    Ee("bech32.encode prefix", d), Ct(g) && (g = Array.from(g)), Ft("bech32.encode", g);
    const f = d.length;
    if (f === 0)
      throw new TypeError(`Invalid prefix length ${f}`);
    const y = f + 7 + g.length;
    if (p !== !1 && y > p)
      throw new TypeError(`Length ${y} exceeds limit ${p}`);
    const P = d.toLowerCase(), E = ut(P, g, e);
    return `${P}1${ze.encode(g)}${E}`;
  }
  function a(d, g = 90) {
    Ee("bech32.decode input", d);
    const p = d.length;
    if (p < 8 || g !== !1 && p > g)
      throw new TypeError(`invalid string length: ${p} (${d}). Expected (8..${g})`);
    const f = d.toLowerCase();
    if (d !== f && d !== d.toUpperCase())
      throw new Error("String must be lowercase or uppercase");
    const y = f.lastIndexOf("1");
    if (y === 0 || y === -1)
      throw new Error('Letter "1" must be present between prefix and data only');
    const P = f.slice(0, y), E = f.slice(y + 1);
    if (E.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const M = ze.decode(E).slice(0, -6), k = ut(P, M, e);
    if (!E.endsWith(k))
      throw new Error(`Invalid checksum in ${d}: expected "${k}"`);
    return { prefix: P, words: M };
  }
  const l = ct(a);
  function c(d) {
    const { prefix: g, words: p } = a(d, !1);
    return { prefix: g, words: p, bytes: s(p) };
  }
  function h(d, g) {
    return o(d, i(g));
  }
  return {
    encode: o,
    decode: a,
    encodeFromBytes: h,
    decodeToBytes: c,
    decodeUnsafe: l,
    fromWords: s,
    fromWordsUnsafe: r,
    toWords: i
  };
}
const Ne = /* @__PURE__ */ $s("bech32"), Lt = 5e3, Re = new TextEncoder(), Ie = new TextDecoder();
function Bs(n) {
  const e = new Uint8Array(4);
  return e[0] = n >> 24 & 255, e[1] = n >> 16 & 255, e[2] = n >> 8 & 255, e[3] = n & 255, e;
}
function $e(n) {
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
function Qe(n) {
  const e = [];
  return Object.entries(n).reverse().forEach(([t, s]) => {
    s.forEach((i) => {
      const r = new Uint8Array(i.length + 2);
      r.set([parseInt(t)], 0), r.set([i.length], 1), r.set(i, 2), e.push(r);
    });
  }), Ht(...e);
}
function xe(n, e) {
  const t = Ne.toWords(e);
  return Ne.encode(n, t, Lt);
}
function Xe(n, e) {
  return xe(n, e);
}
function Ze(n) {
  var i, r, o, a, l, c, h;
  const { prefix: e, words: t } = Ne.decode(n, Lt), s = new Uint8Array(Ne.fromWords(t));
  switch (e) {
    case "nprofile": {
      const d = $e(s);
      if (!((i = d[0]) != null && i[0])) throw new Error("missing TLV 0 for nprofile");
      if (d[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      return {
        type: "nprofile",
        data: {
          pubkey: Q(d[0][0]),
          relays: d[1] ? d[1].map((g) => Ie.decode(g)) : []
        }
      };
    }
    case "nevent": {
      const d = $e(s);
      if (!((r = d[0]) != null && r[0])) throw new Error("missing TLV 0 for nevent");
      if (d[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      if (d[2] && d[2][0] && d[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (d[3] && d[3][0] && d[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "nevent",
        data: {
          id: Q(d[0][0]),
          relays: d[1] ? d[1].map((g) => Ie.decode(g)) : [],
          author: (o = d[2]) != null && o[0] ? Q(d[2][0]) : void 0,
          kind: (a = d[3]) != null && a[0] ? parseInt(Q(d[3][0]), 16) : void 0
        }
      };
    }
    case "naddr": {
      const d = $e(s);
      if (!((l = d[0]) != null && l[0])) throw new Error("missing TLV 0 for naddr");
      if (!((c = d[2]) != null && c[0])) throw new Error("missing TLV 2 for naddr");
      if (d[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (!((h = d[3]) != null && h[0])) throw new Error("missing TLV 3 for naddr");
      if (d[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "naddr",
        data: {
          identifier: Ie.decode(d[0][0]),
          pubkey: Q(d[2][0]),
          kind: parseInt(Q(d[3][0]), 16),
          relays: d[1] ? d[1].map((g) => Ie.decode(g)) : []
        }
      };
    }
    case "nsec":
      return { type: e, data: s };
    case "npub":
    case "note":
      return { type: e, data: Q(s) };
    default:
      throw new Error(`Unknown prefix ${e}`);
  }
}
function Ks(n) {
  return Xe("nsec", n);
}
function Vs(n) {
  return Xe("npub", ae(n));
}
function Ws(n) {
  return Xe("note", ae(n));
}
function Hs(n) {
  const e = Qe({
    0: [ae(n.pubkey)],
    1: (n.relays || []).map((t) => Re.encode(t))
  });
  return xe("nprofile", e);
}
function zs(n) {
  let e;
  n.kind !== void 0 && (e = Bs(n.kind));
  const t = Qe({
    0: [ae(n.id)],
    1: (n.relays || []).map((s) => Re.encode(s)),
    2: n.author ? [ae(n.author)] : [],
    3: e ? [new Uint8Array(e)] : []
  });
  return xe("nevent", t);
}
function Gs(n) {
  const e = new ArrayBuffer(4);
  new DataView(e).setUint32(0, n.kind, !1);
  const t = Qe({
    0: [Re.encode(n.identifier)],
    1: (n.relays || []).map((s) => Re.encode(s)),
    2: [ae(n.pubkey)],
    3: [new Uint8Array(e)]
  });
  return xe("naddr", t);
}
function hi(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Vs(e);
}
function di(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex privkey: must be 64 hex characters");
  return Ks(ae(e));
}
function gi(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  return Ws(e);
}
function js(n) {
  if (!n.startsWith("npub1"))
    throw new Error('Invalid npub: must start with "npub1"');
  const e = Ze(n);
  if (e.type !== "npub")
    throw new Error('Invalid npub: decoded type is not "npub"');
  return e.data;
}
function Ys(n) {
  if (!n.startsWith("nsec1"))
    throw new Error('Invalid nsec: must start with "nsec1"');
  const e = Ze(n);
  if (e.type !== "nsec")
    throw new Error('Invalid nsec: decoded type is not "nsec"');
  return Q(e.data);
}
function Qs(n) {
  if (!n.startsWith("note1"))
    throw new Error('Invalid note: must start with "note1"');
  const e = Ze(n);
  if (e.type !== "note")
    throw new Error('Invalid note: decoded type is not "note"');
  return e.data;
}
function fi(n, e) {
  const t = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Hs({ pubkey: t, relays: e });
}
function pi(n, e, t, s) {
  const i = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(i))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  let r;
  if (t && (r = t.startsWith("0x") ? t.slice(2) : t, !/^[0-9a-fA-F]{64}$/.test(r)))
    throw new Error("Invalid hex author pubkey: must be 64 hex characters");
  return zs({
    id: i,
    relays: e,
    author: r,
    kind: s
  });
}
function yi(n, e, t, s) {
  const i = e.startsWith("0x") ? e.slice(2) : e;
  if (!/^[0-9a-fA-F]{64}$/.test(i))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Gs({
    identifier: n,
    pubkey: i,
    kind: t,
    relays: s
  });
}
function bi(n) {
  if (!n || typeof n != "string")
    return !1;
  const e = n.startsWith("0x") ? n.slice(2) : n;
  return /^[0-9a-fA-F]{64}$/.test(e);
}
function wi(n) {
  if (!n || typeof n != "string" || !n.startsWith("npub1"))
    return !1;
  try {
    return js(n), !0;
  } catch {
    return !1;
  }
}
function mi(n) {
  if (!n || typeof n != "string" || !n.startsWith("nsec1"))
    return !1;
  try {
    return Ys(n), !0;
  } catch {
    return !1;
  }
}
function Ei(n) {
  if (!n || typeof n != "string" || !n.startsWith("note1"))
    return !1;
  try {
    return Qs(n), !0;
  } catch {
    return !1;
  }
}
const vi = "0.1.0";
export {
  qt as DEFAULT_RELAYS,
  li as DM,
  et as EVENT_KINDS,
  C as ErrorHandler,
  D as EventBuilder,
  rs as EventsModule,
  tt as ExtensionSigner,
  Ye as FeedStoreImpl,
  is as FluentEventBuilder,
  je as LocalKeySigner,
  oi as NostrUnchained,
  ui as Profile,
  ai as QueryBuilder,
  Js as QuickSigner,
  ts as RelayManager,
  ss as SigningProviderFactory,
  ci as SubBuilder,
  Ns as SubscriptionManager,
  qs as TemporarySigner,
  vi as VERSION,
  ti as createFeed,
  ii as createFeedFromFilter,
  si as createFeedFromQuery,
  yi as createNaddr,
  pi as createNevent,
  fi as createNprofile,
  Ze as decode,
  w as derived,
  gi as hexToNote,
  hi as hexToNpub,
  di as hexToNsec,
  bi as isValidHexKey,
  Ei as isValidNote,
  wi as isValidNpub,
  mi as isValidNsec,
  Gs as naddrEncode,
  zs as neventEncode,
  Ws as noteEncode,
  Qs as noteToHex,
  Hs as nprofileEncode,
  Vs as npubEncode,
  js as npubToHex,
  Ks as nsecEncode,
  Ys as nsecToHex,
  ei as setDefaultSubscriptionManager,
  I as writable
};
