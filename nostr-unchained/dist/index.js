var Ft = Object.defineProperty;
var Ot = (n, e, t) => e in n ? Ft(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var l = (n, e, t) => Ot(n, typeof e != "symbol" ? e + "" : e, t);
import * as ne from "@noble/secp256k1";
import { getSharedSecret as $t } from "@noble/secp256k1";
const ue = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Ut(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function Ue(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function de(n, ...e) {
  if (!Ut(n))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(n.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + n.length);
}
function Ge(n) {
  if (typeof n != "function" || typeof n.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Ue(n.outputLen), Ue(n.blockLen);
}
function Te(n, e = !0) {
  if (n.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && n.finished)
    throw new Error("Hash#digest() has already been called");
}
function Bt(n, e) {
  de(n);
  const t = e.outputLen;
  if (n.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function ye(...n) {
  for (let e = 0; e < n.length; e++)
    n[e].fill(0);
}
function xe(n) {
  return new DataView(n.buffer, n.byteOffset, n.byteLength);
}
function X(n, e) {
  return n << 32 - e | n >>> e;
}
const ut = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", Kt = /* @__PURE__ */ Array.from({ length: 256 }, (n, e) => e.toString(16).padStart(2, "0"));
function Y(n) {
  if (de(n), ut)
    return n.toHex();
  let e = "";
  for (let t = 0; t < n.length; t++)
    e += Kt[n[t]];
  return e;
}
const Z = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function Je(n) {
  if (n >= Z._0 && n <= Z._9)
    return n - Z._0;
  if (n >= Z.A && n <= Z.F)
    return n - (Z.A - 10);
  if (n >= Z.a && n <= Z.f)
    return n - (Z.a - 10);
}
function ae(n) {
  if (typeof n != "string")
    throw new Error("hex string expected, got " + typeof n);
  if (ut)
    return Uint8Array.fromHex(n);
  const e = n.length, t = e / 2;
  if (e % 2)
    throw new Error("hex string expected, got unpadded hex of length " + e);
  const s = new Uint8Array(t);
  for (let r = 0, i = 0; r < t; r++, i += 2) {
    const o = Je(n.charCodeAt(i)), a = Je(n.charCodeAt(i + 1));
    if (o === void 0 || a === void 0) {
      const c = n[i] + n[i + 1];
      throw new Error('hex string expected, got non-hex character "' + c + '" at index ' + i);
    }
    s[r] = o * 16 + a;
  }
  return s;
}
function Vt(n) {
  if (typeof n != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(n));
}
function be(n) {
  return typeof n == "string" && (n = Vt(n)), de(n), n;
}
function Wt(...n) {
  let e = 0;
  for (let s = 0; s < n.length; s++) {
    const r = n[s];
    de(r), e += r.length;
  }
  const t = new Uint8Array(e);
  for (let s = 0, r = 0; s < n.length; s++) {
    const i = n[s];
    t.set(i, r), r += i.length;
  }
  return t;
}
class ht {
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
  const r = BigInt(32), i = BigInt(4294967295), o = Number(t >> r & i), a = Number(t & i), c = s ? 4 : 0, h = s ? 0 : 4;
  n.setUint32(e + c, o, s), n.setUint32(e + h, a, s);
}
function Ht(n, e, t) {
  return n & e ^ ~n & t;
}
function jt(n, e, t) {
  return n & e ^ n & t ^ e & t;
}
class Yt extends ht {
  constructor(e, t, s, r) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = r, this.buffer = new Uint8Array(e), this.view = xe(this.buffer);
  }
  update(e) {
    Te(this), e = be(e), de(e);
    const { view: t, buffer: s, blockLen: r } = this, i = e.length;
    for (let o = 0; o < i; ) {
      const a = Math.min(r - this.pos, i - o);
      if (a === r) {
        const c = xe(e);
        for (; r <= i - o; o += r)
          this.process(c, o);
        continue;
      }
      s.set(e.subarray(o, o + a), this.pos), this.pos += a, o += a, this.pos === r && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Te(this), Bt(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: r, isLE: i } = this;
    let { pos: o } = this;
    t[o++] = 128, ye(this.buffer.subarray(o)), this.padOffset > r - o && (this.process(s, 0), o = 0);
    for (let u = o; u < r; u++)
      t[u] = 0;
    Gt(s, r - 8, BigInt(this.length * 8), i), this.process(s, 0);
    const a = xe(e), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const h = c / 4, d = this.get();
    if (h > d.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let u = 0; u < h; u++)
      a.setUint32(4 * u, d[u], i);
  }
  digest() {
    const { buffer: e, outputLen: t } = this;
    this.digestInto(e);
    const s = e.slice(0, t);
    return this.destroy(), s;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: t, buffer: s, length: r, finished: i, destroyed: o, pos: a } = this;
    return e.destroyed = o, e.finished = i, e.length = r, e.pos = a, r % t && e.buffer.set(s), e;
  }
  clone() {
    return this._cloneInto();
  }
}
const Q = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), qt = /* @__PURE__ */ Uint32Array.from([
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
]), ee = /* @__PURE__ */ new Uint32Array(64);
class Xt extends Yt {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = Q[0] | 0, this.B = Q[1] | 0, this.C = Q[2] | 0, this.D = Q[3] | 0, this.E = Q[4] | 0, this.F = Q[5] | 0, this.G = Q[6] | 0, this.H = Q[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: r, E: i, F: o, G: a, H: c } = this;
    return [e, t, s, r, i, o, a, c];
  }
  // prettier-ignore
  set(e, t, s, r, i, o, a, c) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = r | 0, this.E = i | 0, this.F = o | 0, this.G = a | 0, this.H = c | 0;
  }
  process(e, t) {
    for (let u = 0; u < 16; u++, t += 4)
      ee[u] = e.getUint32(t, !1);
    for (let u = 16; u < 64; u++) {
      const g = ee[u - 15], p = ee[u - 2], f = X(g, 7) ^ X(g, 18) ^ g >>> 3, y = X(p, 17) ^ X(p, 19) ^ p >>> 10;
      ee[u] = y + ee[u - 7] + f + ee[u - 16] | 0;
    }
    let { A: s, B: r, C: i, D: o, E: a, F: c, G: h, H: d } = this;
    for (let u = 0; u < 64; u++) {
      const g = X(a, 6) ^ X(a, 11) ^ X(a, 25), p = d + g + Ht(a, c, h) + qt[u] + ee[u] | 0, y = (X(s, 2) ^ X(s, 13) ^ X(s, 22)) + jt(s, r, i) | 0;
      d = h, h = c, c = a, a = o + p | 0, o = i, i = r, r = s, s = p + y | 0;
    }
    s = s + this.A | 0, r = r + this.B | 0, i = i + this.C | 0, o = o + this.D | 0, a = a + this.E | 0, c = c + this.F | 0, h = h + this.G | 0, d = d + this.H | 0, this.set(s, r, i, o, a, c, h, d);
  }
  roundClean() {
    ye(ee);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), ye(this.buffer);
  }
}
const Zt = /* @__PURE__ */ zt(() => new Xt()), oe = Zt, Jt = [
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
}, Qe = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  ENCRYPTED_DM: 4,
  DELETE: 5
}, C = {
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
}, Ae = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class A {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(e, t) {
    return {
      pubkey: t,
      created_at: Math.floor(Date.now() / 1e3),
      kind: Qe.TEXT_NOTE,
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
    ]), s = new TextEncoder().encode(t), r = oe(s);
    return Y(r);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(e) {
    const t = A.calculateEventId(e);
    return { ...e, id: t };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(e) {
    const t = [];
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !Ae.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !Ae.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !Ae.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && t.push(C.EMPTY_CONTENT), e.content && e.content.length > se.MAX_CONTENT_LENGTH && t.push(C.CONTENT_TOO_LONG), e.created_at) {
      const s = Math.floor(Date.now() / 1e3), r = s - 3600, i = s + 3600;
      (e.created_at < r || e.created_at > i) && t.push("Timestamp is too far in the past or future");
    }
    return e.tags && (Array.isArray(e.tags) ? e.tags.forEach((s, r) => {
      Array.isArray(s) ? s.forEach((i, o) => {
        typeof i != "string" && t.push(`Tag ${r}[${o}] must be a string`);
      }) : t.push(`Tag ${r} must be an array`);
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
    return e === "" && t.push(C.EMPTY_CONTENT), e.length > se.MAX_CONTENT_LENGTH && t.push(C.CONTENT_TOO_LONG), {
      valid: t.length === 0,
      errors: t
    };
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(e) {
    return A.calculateEventId({
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
    const r = A.validateContent(e);
    if (!r.valid)
      throw new Error(`Invalid content: ${r.errors.join(", ")}`);
    const i = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? Qe.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, o = A.validateEvent(i);
    if (!o.valid)
      throw new Error(`Invalid event: ${o.errors.join(", ")}`);
    return i;
  }
}
async function Qt() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class es {
  constructor(e, t = {}) {
    l(this, "connections", /* @__PURE__ */ new Map());
    l(this, "debug");
    l(this, "messageHandler");
    l(this, "pendingPublishes", /* @__PURE__ */ new Map());
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
    return t.state === "connected" ? !0 : (t.state = "connecting", new Promise(async (s, r) => {
      try {
        const i = await Qt(), o = new i(e), a = setTimeout(() => {
          o.close(), t.state = "error", t.error = "Connection timeout", r(new Error(`Connection to ${e} timed out`));
        }, se.CONNECTION_TIMEOUT);
        o.onopen = () => {
          clearTimeout(a), t.ws = o, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, o.onerror = (c) => {
          clearTimeout(a), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, c), r(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, o.onclose = () => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`);
        }, o.onmessage = (c) => {
          this.handleRelayMessage(e, c.data);
        };
      } catch (i) {
        t.state = "error", t.error = i instanceof Error ? i.message : "Unknown error", r(i);
      }
    }));
  }
  /**
   * Publish event to specific relays
   */
  async publishToRelays(e, t) {
    const s = [], r = t.map(async (i) => {
      const o = Date.now();
      try {
        const a = await this.publishToRelay(i, e), c = Date.now() - o;
        s.push({
          relay: i,
          success: a,
          latency: c
        });
      } catch (a) {
        const c = Date.now() - o;
        s.push({
          relay: i,
          success: !1,
          error: a instanceof Error ? a.message : "Unknown error",
          latency: c
        });
      }
    });
    return await Promise.allSettled(r), s;
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(e) {
    const t = [], s = this.connectedRelays.map(async (r) => {
      const i = Date.now();
      try {
        const o = await this.publishToRelay(r, e), a = Date.now() - i;
        t.push({
          relay: r,
          success: o,
          latency: a
        });
      } catch (o) {
        const a = Date.now() - i;
        t.push({
          relay: r,
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
    return new Promise((r, i) => {
      const o = s.ws, a = ["EVENT", t], c = setTimeout(() => {
        i(new Error("Publish timeout"));
      }, se.PUBLISH_TIMEOUT), h = t.id;
      this.pendingPublishes.set(h, { resolve: r, reject: i, timeout: c });
      try {
        const d = JSON.stringify(a);
        o.send(d), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", d), console.log("📤 Added to pending:", h));
      } catch (d) {
        clearTimeout(c), this.pendingPublishes.delete(h), i(d);
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
        const [, r, i, o] = s, a = this.pendingPublishes.get(r);
        this.debug && (console.log(`OK for event ${r}, success: ${i}, pending: ${!!a}`), console.log("Pending publishes:", Array.from(this.pendingPublishes.keys()))), a ? (clearTimeout(a.timeout), this.pendingPublishes.delete(r), i ? a.resolve(!0) : a.reject(new Error(o || "Relay rejected event"))) : this.debug && console.warn(`No pending publish found for event ID: ${r}`);
      } else if (s[0] === "NOTICE") {
        const [, r] = s;
        this.debug && console.log(`Notice from ${e}:`, r);
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
      return Ae.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
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
      (s) => this.sendToRelay(s, e).catch((r) => {
        this.debug && console.warn(`Failed to send to ${s}:`, r);
      })
    );
    await Promise.allSettled(t);
  }
  /**
   * Send message to specific relays
   */
  async sendToRelays(e, t) {
    const s = e.map(
      (r) => this.sendToRelay(r, t).catch((i) => {
        this.debug && console.warn(`Failed to send to ${r}:`, i);
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
    const r = JSON.stringify(t);
    s.ws.send(r), this.debug && console.log(`📤 Sent to ${e}:`, r);
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
class et {
  constructor() {
    l(this, "cachedPublicKey");
  }
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(C.NO_EXTENSION);
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
      throw new Error(C.NO_EXTENSION);
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
class He {
  constructor() {
    l(this, "privateKey");
    l(this, "publicKey");
    const e = he(32);
    this.privateKey = Y(e), this.publicKey = Y(ne.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  getPublicKeySync() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = A.calculateEventId(e), s = await ne.schnorr.sign(t, this.privateKey);
    return Y(s);
  }
  /**
   * Get private key for NIP-44 encryption
   * WARNING: Only for testing/development. Production should use secure key derivation.
   */
  async getPrivateKeyForEncryption() {
    return this.privateKey;
  }
}
class qs extends He {
}
class Xs extends He {
}
class ts {
  static async createBestAvailable() {
    if (await et.isAvailable())
      try {
        const e = new et();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new He(),
      method: "temporary"
    };
  }
}
class N {
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
    return e === "" ? N.createError("validation", C.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: ge.EMPTY_CONTENT
    }) : e.length > 8192 ? N.createError("validation", C.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: ge.CONTENT_TOO_LONG
    }) : N.createError("validation", C.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(e) {
    const t = e.message.toLowerCase();
    return t.includes("user declined") || t.includes("denied") ? N.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : t.includes("no extension") ? N.createError("signing", C.NO_EXTENSION, {
      retryable: !1,
      suggestion: ge.NO_EXTENSION
    }) : N.createError("signing", C.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(e, t) {
    const s = t.message.toLowerCase();
    return s.includes("timeout") ? N.createError("network", `Connection to ${e} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? N.createError("network", `Failed to connect to ${e}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : N.createError("network", C.CONNECTION_FAILED, {
      retryable: !0,
      suggestion: ge.CONNECTION_FAILED
    });
  }
  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(e) {
    const t = e.length, s = e.filter((i) => i.success), r = e.filter((i) => !i.success);
    if (t === 0)
      return {
        success: !1,
        error: N.createError("config", C.NO_RELAYS, {
          retryable: !1,
          suggestion: "Configure at least one relay URL"
        })
      };
    if (s.length === 0) {
      const i = r.every(
        (a) => {
          var c;
          return (c = a.error) == null ? void 0 : c.toLowerCase().includes("timeout");
        }
      ), o = r.every(
        (a) => {
          var c, h;
          return ((c = a.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((h = a.error) == null ? void 0 : h.toLowerCase().includes("refused"));
        }
      );
      return i ? {
        success: !1,
        error: N.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : o ? {
        success: !1,
        error: N.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: N.createError("relay", C.PUBLISH_FAILED, {
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
      const r = t.relayResults.filter((o) => o.success).length, i = t.relayResults.length;
      r > 0 ? s += ` (${r}/${i} relays succeeded)` : s += ` (0/${i} relays succeeded)`;
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
    l(this, "eventData");
    l(this, "nostrInstance");
    // NostrUnchained instance for publishing
    l(this, "signed", !1);
    l(this, "signedEvent");
    l(this, "targetRelays");
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
    const r = [e, t, ...s];
    return this.eventData.tags.push(r), this;
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
    if (!this.eventData.content)
      throw new Error("Content is required before signing");
    const e = this.nostrInstance.signingProvider;
    if (!e)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const t = {
      pubkey: await e.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    }, s = A.validateEvent(t);
    if (!s.valid)
      throw new Error(`Invalid event: ${s.errors.join(", ")}`);
    const r = A.calculateEventId(t), i = {
      ...t,
      id: r,
      sig: await e.signEvent({ ...t, id: r })
    };
    return this.signedEvent = i, this.signed = !0, this;
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
    if (this.signed && this.signedEvent) {
      const r = this.targetRelays ? await this.nostrInstance.relayManager.publishToRelays(this.signedEvent, this.targetRelays) : await this.nostrInstance.relayManager.publishToAll(this.signedEvent), i = r.some((o) => o.success);
      return {
        success: i,
        eventId: i ? this.signedEvent.id : void 0,
        event: i ? this.signedEvent : void 0,
        relayResults: r,
        timestamp: Date.now(),
        error: i ? void 0 : {
          message: "Failed to publish to any relay",
          code: "PUBLISH_FAILED",
          retryable: !0
        }
      };
    }
    const e = this.nostrInstance.signingProvider;
    if (!e)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = {
      pubkey: await e.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    };
    return this.targetRelays ? await this.nostrInstance.publishToRelays(s, this.targetRelays) : await this.nostrInstance.publish(s);
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
class ss {
  constructor(e) {
    l(this, "nostrInstance");
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
   * Direct publish from JSON data (bypasses fluent building)
   */
  async publish(e) {
    return await this.nostrInstance.publish(e);
  }
}
function te(n) {
  const e = /* @__PURE__ */ new Set();
  let t = n;
  return {
    subscribe(s) {
      return s(t), e.add(s), () => e.delete(s);
    },
    set(s) {
      t = s, e.forEach((r) => r(t));
    },
    update(s) {
      t = s(t), e.forEach((r) => r(t));
    }
  };
}
function I(n, e) {
  const t = Array.isArray(n) ? n : [n], s = /* @__PURE__ */ new Set();
  let r, i = !1;
  const o = [], a = () => {
    if (t.length === 1) {
      const c = t[0].subscribe((h) => {
        const d = e(h);
        (!i || d !== r) && (r = d, i && s.forEach((u) => u(r)));
      });
      o.length === 0 && o.push(c);
    }
  };
  return {
    subscribe(c) {
      return i || (a(), i = !0), r !== void 0 && c(r), s.add(c), () => {
        s.delete(c), s.size === 0 && (o.forEach((h) => h()), o.length = 0, i = !1);
      };
    }
  };
}
function dt(n) {
  return {
    subscribe: n.subscribe.bind(n),
    derive: (e) => I(n, e)
  };
}
class we {
  constructor(e, t, s) {
    l(this, "_events");
    l(this, "_readIds", /* @__PURE__ */ new Set());
    l(this, "parent");
    this.parent = e, this._events = I(e.events, (r) => {
      let i = r;
      return t && (i = i.filter(t)), s && (i = [...i].sort(s)), i;
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
    return I(this._events, (e) => e.length);
  }
  get latest() {
    return I(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return I(this._events, (e) => e.length === 0);
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
    return dt(I(this._events, e));
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
    const s = e.filter((o) => this._readIds.has(o.id)).length, r = e.length, i = r - s;
    return { read: s, unread: i, total: r };
  }
}
class je {
  constructor(e, t, s = {}, r = {}) {
    l(this, "_events", te([]));
    l(this, "_status", te("connecting"));
    l(this, "_error", te(null));
    l(this, "_loading", te(!1));
    l(this, "_count", te(0));
    l(this, "_readIds", /* @__PURE__ */ new Set());
    l(this, "subscription");
    l(this, "subscriptionManager");
    l(this, "filters");
    l(this, "options");
    l(this, "maxEvents");
    l(this, "isLive");
    l(this, "eventPredicate");
    l(this, "eventComparator");
    this.subscriptionManager = e, this.filters = t, this.options = s, this.maxEvents = r.maxEvents, this.isLive = r.live || !1, this.eventPredicate = r.predicate, this.eventComparator = r.comparator, this.initializeSubscription();
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
    return I(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return I(this._events, () => !0);
  }
  get isEmpty() {
    return I(this._events, (e) => e.length === 0);
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
    return dt(I(this._events, e));
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
    const s = e.filter((o) => this._readIds.has(o.id)).length, r = e.length, i = r - s;
    return { read: s, unread: i, total: r };
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
        onEvent: (r) => {
          this.handleEvent(r);
        },
        onEose: (r) => {
          this._status.set("active"), this._loading.set(!1);
        },
        onClose: (r) => {
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
      if (t.some((r) => r.id === e.id))
        return t;
      const s = [...t, e];
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((r, i) => i.created_at - r.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
    }), this._count.update((t) => t + 1));
  }
}
class rs {
  constructor(e) {
    l(this, "filter", {});
    l(this, "options", {});
    l(this, "config", {});
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
    return new je(
      this.subscriptionManager,
      e,
      this.options,
      this.config
    );
  }
}
let ce;
function Zs(n) {
  ce = n;
}
function Js() {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new rs(ce);
}
function Qs(n) {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = n.toFilter();
  return new je(ce, e);
}
function er(n) {
  if (!ce)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new je(ce, [n]);
}
class gt extends ht {
  constructor(e, t) {
    super(), this.finished = !1, this.destroyed = !1, Ge(e);
    const s = be(t);
    if (this.iHash = e.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const r = this.blockLen, i = new Uint8Array(r);
    i.set(s.length > r ? e.create().update(s).digest() : s);
    for (let o = 0; o < i.length; o++)
      i[o] ^= 54;
    this.iHash.update(i), this.oHash = e.create();
    for (let o = 0; o < i.length; o++)
      i[o] ^= 106;
    this.oHash.update(i), ye(i);
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
    const { oHash: t, iHash: s, finished: r, destroyed: i, blockLen: o, outputLen: a } = this;
    return e = e, e.finished = r, e.destroyed = i, e.blockLen = o, e.outputLen = a, e.oHash = t._cloneInto(e.oHash), e.iHash = s._cloneInto(e.iHash), e;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const me = (n, e, t) => new gt(n, e).update(t).digest();
me.create = (n, e) => new gt(n, e);
function is(n, e, t) {
  return Ge(n), t === void 0 && (t = new Uint8Array(n.outputLen)), me(n, be(t), be(e));
}
const Fe = /* @__PURE__ */ Uint8Array.from([0]), tt = /* @__PURE__ */ Uint8Array.of();
function ns(n, e, t, s = 32) {
  Ge(n), Ue(s);
  const r = n.outputLen;
  if (s > 255 * r)
    throw new Error("Length should be <= 255*HashLen");
  const i = Math.ceil(s / r);
  t === void 0 && (t = tt);
  const o = new Uint8Array(i * r), a = me.create(n, e), c = a._cloneInto(), h = new Uint8Array(a.outputLen);
  for (let d = 0; d < i; d++)
    Fe[0] = d + 1, c.update(d === 0 ? tt : h).update(t).update(Fe).digestInto(h), o.set(h, r * d), a._cloneInto(c);
  return a.destroy(), c.destroy(), ye(h, Fe), o.slice(0, s);
}
const st = (n, e, t, s, r) => ns(n, is(n, e, t), s, r);
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function os(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function rt(n) {
  if (typeof n != "boolean")
    throw new Error(`boolean expected, not ${n}`);
}
function Oe(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function ve(n, ...e) {
  if (!os(n))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(n.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + n.length);
}
function re(n) {
  return new Uint32Array(n.buffer, n.byteOffset, Math.floor(n.byteLength / 4));
}
function as(...n) {
  for (let e = 0; e < n.length; e++)
    n[e].fill(0);
}
function cs(n, e) {
  if (e == null || typeof e != "object")
    throw new Error("options must be defined");
  return Object.assign(n, e);
}
function it(n) {
  return Uint8Array.from(n);
}
const ft = (n) => Uint8Array.from(n.split("").map((e) => e.charCodeAt(0))), ls = ft("expand 16-byte k"), us = ft("expand 32-byte k"), hs = re(ls), ds = re(us);
function E(n, e) {
  return n << e | n >>> 32 - e;
}
function Be(n) {
  return n.byteOffset % 4 === 0;
}
const Se = 64, gs = 16, pt = 2 ** 32 - 1, nt = new Uint32Array();
function fs(n, e, t, s, r, i, o, a) {
  const c = r.length, h = new Uint8Array(Se), d = re(h), u = Be(r) && Be(i), g = u ? re(r) : nt, p = u ? re(i) : nt;
  for (let f = 0; f < c; o++) {
    if (n(e, t, s, d, o, a), o >= pt)
      throw new Error("arx: counter overflow");
    const y = Math.min(Se, c - f);
    if (u && y === Se) {
      const S = f / 4;
      if (f % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let m = 0, v; m < gs; m++)
        v = S + m, p[v] = g[v] ^ d[m];
      f += Se;
      continue;
    }
    for (let S = 0, m; S < y; S++)
      m = f + S, i[m] = r[m] ^ h[S];
    f += y;
  }
}
function ps(n, e) {
  const { allowShortKeys: t, extendNonceFn: s, counterLength: r, counterRight: i, rounds: o } = cs({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
  if (typeof n != "function")
    throw new Error("core must be a function");
  return Oe(r), Oe(o), rt(i), rt(t), (a, c, h, d, u = 0) => {
    ve(a), ve(c), ve(h);
    const g = h.length;
    if (d === void 0 && (d = new Uint8Array(g)), ve(d), Oe(u), u < 0 || u >= pt)
      throw new Error("arx: counter overflow");
    if (d.length < g)
      throw new Error(`arx: output (${d.length}) is shorter than data (${g})`);
    const p = [];
    let f = a.length, y, S;
    if (f === 32)
      p.push(y = it(a)), S = ds;
    else if (f === 16 && t)
      y = new Uint8Array(32), y.set(a), y.set(a, 16), S = hs, p.push(y);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${f}`);
    Be(c) || p.push(c = it(c));
    const m = re(y);
    if (s) {
      if (c.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(S, m, re(c.subarray(0, 16)), m), c = c.subarray(16);
    }
    const v = 16 - r;
    if (v !== c.length)
      throw new Error(`arx: nonce must be ${v} or 16 bytes`);
    if (v !== 12) {
      const J = new Uint8Array(12);
      J.set(c, i ? 0 : 12 - c.length), c = J, p.push(c);
    }
    const P = re(c);
    return fs(n, S, m, P, h, d, u, o), as(...p), d;
  };
}
function ys(n, e, t, s, r, i = 20) {
  let o = n[0], a = n[1], c = n[2], h = n[3], d = e[0], u = e[1], g = e[2], p = e[3], f = e[4], y = e[5], S = e[6], m = e[7], v = r, P = t[0], J = t[1], le = t[2], M = o, D = a, x = c, L = h, F = d, O = u, $ = g, U = p, B = f, K = y, V = S, W = m, z = v, G = P, H = J, j = le;
  for (let Ze = 0; Ze < i; Ze += 2)
    M = M + F | 0, z = E(z ^ M, 16), B = B + z | 0, F = E(F ^ B, 12), M = M + F | 0, z = E(z ^ M, 8), B = B + z | 0, F = E(F ^ B, 7), D = D + O | 0, G = E(G ^ D, 16), K = K + G | 0, O = E(O ^ K, 12), D = D + O | 0, G = E(G ^ D, 8), K = K + G | 0, O = E(O ^ K, 7), x = x + $ | 0, H = E(H ^ x, 16), V = V + H | 0, $ = E($ ^ V, 12), x = x + $ | 0, H = E(H ^ x, 8), V = V + H | 0, $ = E($ ^ V, 7), L = L + U | 0, j = E(j ^ L, 16), W = W + j | 0, U = E(U ^ W, 12), L = L + U | 0, j = E(j ^ L, 8), W = W + j | 0, U = E(U ^ W, 7), M = M + O | 0, j = E(j ^ M, 16), V = V + j | 0, O = E(O ^ V, 12), M = M + O | 0, j = E(j ^ M, 8), V = V + j | 0, O = E(O ^ V, 7), D = D + $ | 0, z = E(z ^ D, 16), W = W + z | 0, $ = E($ ^ W, 12), D = D + $ | 0, z = E(z ^ D, 8), W = W + z | 0, $ = E($ ^ W, 7), x = x + U | 0, G = E(G ^ x, 16), B = B + G | 0, U = E(U ^ B, 12), x = x + U | 0, G = E(G ^ x, 8), B = B + G | 0, U = E(U ^ B, 7), L = L + F | 0, H = E(H ^ L, 16), K = K + H | 0, F = E(F ^ K, 12), L = L + F | 0, H = E(H ^ L, 8), K = K + H | 0, F = E(F ^ K, 7);
  let k = 0;
  s[k++] = o + M | 0, s[k++] = a + D | 0, s[k++] = c + x | 0, s[k++] = h + L | 0, s[k++] = d + F | 0, s[k++] = u + O | 0, s[k++] = g + $ | 0, s[k++] = p + U | 0, s[k++] = f + B | 0, s[k++] = y + K | 0, s[k++] = S + V | 0, s[k++] = m + W | 0, s[k++] = v + z | 0, s[k++] = P + G | 0, s[k++] = J + H | 0, s[k++] = le + j | 0;
}
const ot = /* @__PURE__ */ ps(ys, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), bs = {
  saltInfo: "nip44-v2"
};
class T extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP44Error";
  }
}
var R = /* @__PURE__ */ ((n) => (n.INVALID_KEY = "INVALID_KEY", n.INVALID_NONCE = "INVALID_NONCE", n.INVALID_PAYLOAD = "INVALID_PAYLOAD", n.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", n.DECRYPTION_FAILED = "DECRYPTION_FAILED", n.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", n.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", n.PADDING_ERROR = "PADDING_ERROR", n))(R || {});
class _ {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(e, t) {
    try {
      const s = e.replace(/^0x/, "");
      let r = t.replace(/^0x/, "");
      if (s.length !== 64)
        throw new T(
          "Invalid private key length",
          R.INVALID_KEY
        );
      if (r.length === 64)
        r = "02" + r;
      else if (r.length !== 66 || !r.startsWith("02") && !r.startsWith("03"))
        throw new T(
          "Invalid public key format",
          R.INVALID_KEY
        );
      const o = $t(s, r, !0).slice(1);
      return st(oe, o, this.SALT, new Uint8Array(0), 32);
    } catch (s) {
      throw s instanceof T ? s : new T(
        `Key derivation failed: ${s.message}`,
        R.INVALID_KEY,
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
          R.INVALID_KEY
        );
      if (t.length !== this.NONCE_SIZE)
        throw new T(
          "Invalid nonce length",
          R.INVALID_NONCE
        );
      const s = st(oe, e, new Uint8Array(0), t, 76);
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
        R.ENCRYPTION_FAILED,
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
        R.INVALID_PLAINTEXT_LENGTH
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
    const t = e.length, s = this.calculatePaddedLength(t + 2), r = new Uint8Array(s);
    return r[0] = t >>> 8 & 255, r[1] = t & 255, r.set(e, 2), r;
  }
  /**
   * Remove padding from decrypted data
   * Format: [plaintext_length: u16][plaintext][zero_bytes]
   */
  static removePadding(e) {
    if (e.length < 2)
      throw new T(
        "Invalid padded data length",
        R.PADDING_ERROR
      );
    const t = e[0] << 8 | e[1];
    if (t > e.length - 2)
      throw new T(
        "Invalid plaintext length in padding",
        R.PADDING_ERROR
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
          R.INVALID_PLAINTEXT_LENGTH
        );
      const r = new TextEncoder().encode(e), i = s || this.generateNonce(), o = this.deriveMessageKeys(t, i), a = this.applyPadding(r), c = ot(
        o.chachaKey,
        o.chachaNonce,
        a
      ), h = new Uint8Array(i.length + c.length);
      h.set(i, 0), h.set(c, i.length);
      const d = me(oe, o.hmacKey, h), u = new Uint8Array(
        this.VERSION_SIZE + i.length + c.length + this.MAC_SIZE
      );
      let g = 0;
      return u[g] = this.VERSION, g += this.VERSION_SIZE, u.set(i, g), g += i.length, u.set(c, g), g += c.length, u.set(d, g), {
        payload: btoa(String.fromCharCode(...u)),
        nonce: i
      };
    } catch (r) {
      throw r instanceof T ? r : new T(
        `Encryption failed: ${r.message}`,
        R.ENCRYPTION_FAILED,
        r
      );
    }
  }
  /**
   * Decrypt NIP-44 v2 payload
   */
  static decrypt(e, t) {
    try {
      const s = atob(e), r = new Uint8Array(s.length);
      for (let v = 0; v < s.length; v++)
        r[v] = s.charCodeAt(v);
      const i = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (r.length < i)
        throw new T(
          "Payload too short",
          R.INVALID_PAYLOAD
        );
      let o = 0;
      const a = r[o];
      if (o += this.VERSION_SIZE, a !== this.VERSION)
        throw new T(
          `Unsupported version: ${a}`,
          R.INVALID_PAYLOAD
        );
      const c = r.slice(o, o + this.NONCE_SIZE);
      o += this.NONCE_SIZE;
      const h = r.slice(o, -this.MAC_SIZE), d = r.slice(-this.MAC_SIZE), u = this.deriveMessageKeys(t, c), g = new Uint8Array(c.length + h.length);
      g.set(c, 0), g.set(h, c.length);
      const p = me(oe, u.hmacKey, g);
      let f = !0;
      for (let v = 0; v < this.MAC_SIZE; v++)
        d[v] !== p[v] && (f = !1);
      if (!f)
        return {
          plaintext: "",
          isValid: !1
        };
      const y = ot(
        u.chachaKey,
        u.chachaNonce,
        h
      ), S = this.removePadding(y);
      return {
        plaintext: new TextDecoder().decode(S),
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
      for (let i = 0; i < t.length; i++)
        s[i] = t.charCodeAt(i);
      const r = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      return !(s.length < r || s[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
l(_, "VERSION", 2), l(_, "SALT", new TextEncoder().encode(bs.saltInfo)), l(_, "NONCE_SIZE", 32), l(_, "CHACHA_KEY_SIZE", 32), l(_, "CHACHA_NONCE_SIZE", 12), l(_, "HMAC_KEY_SIZE", 32), l(_, "MAC_SIZE", 32), l(_, "VERSION_SIZE", 1);
const ws = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NIP44Crypto: _
}, Symbol.toStringTag, { value: "Module" }));
class b extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP59Error";
  }
}
var w = /* @__PURE__ */ ((n) => (n.INVALID_RUMOR = "INVALID_RUMOR", n.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", n.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", n.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", n.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", n.DECRYPTION_FAILED = "DECRYPTION_FAILED", n.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", n.INVALID_SEAL = "INVALID_SEAL", n.NO_RECIPIENTS = "NO_RECIPIENTS", n.INVALID_RECIPIENT = "INVALID_RECIPIENT", n.INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY", n))(w || {});
const q = {
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
      const r = JSON.stringify(e), i = _.deriveConversationKey(
        t,
        s
      ), o = _.encrypt(r, i), a = this.getPublicKeyFromPrivate(t), c = {
        pubkey: a,
        created_at: Math.floor(Date.now() / 1e3),
        kind: q.SEAL_KIND,
        tags: [],
        // Always empty for seals
        content: o.payload
      }, h = this.calculateEventId(c), d = await this.signEvent(c, h, t);
      return {
        id: h,
        pubkey: a,
        created_at: c.created_at,
        kind: q.SEAL_KIND,
        tags: [],
        content: o.payload,
        sig: d
      };
    } catch (r) {
      throw r instanceof b ? r : new b(
        `Seal creation failed: ${r.message}`,
        w.SEAL_CREATION_FAILED,
        r
      );
    }
  }
  /**
   * Decrypt a seal to recover the original rumor
   */
  static decryptSeal(e, t) {
    try {
      if (e.kind !== q.SEAL_KIND)
        return { rumor: null, isValid: !1 };
      if (e.tags.length !== 0)
        return { rumor: null, isValid: !1 };
      const s = _.deriveConversationKey(
        t,
        e.pubkey
      ), r = _.decrypt(e.content, s);
      if (!r.isValid)
        return { rumor: null, isValid: !1 };
      const i = JSON.parse(r.plaintext);
      return this.isValidRumor(i) ? { rumor: i, isValid: !0 } : { rumor: null, isValid: !1 };
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
        w.INVALID_RUMOR
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new b(
        "Rumor must have valid pubkey",
        w.INVALID_RUMOR
      );
    if (typeof e.created_at != "number" || e.created_at <= 0)
      throw new b(
        "Rumor must have valid created_at timestamp",
        w.INVALID_RUMOR
      );
    if (typeof e.kind != "number" || e.kind < 0 || e.kind > 65535)
      throw new b(
        "Rumor must have valid kind",
        w.INVALID_RUMOR
      );
    if (!Array.isArray(e.tags))
      throw new b(
        "Rumor must have valid tags array",
        w.INVALID_RUMOR
      );
    if (typeof e.content != "string")
      throw new b(
        "Rumor must have valid content string",
        w.INVALID_RUMOR
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
        w.SEAL_CREATION_FAILED
      );
  }
  /**
   * Validate public key format
   */
  static validatePublicKey(e) {
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new b(
        "Invalid public key format",
        w.SEAL_CREATION_FAILED
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
      const r = ne.getPublicKey(t, !1).slice(1, 33), i = Array.from(r).map((o) => o.toString(16).padStart(2, "0")).join("");
      return console.log("✅ Successfully derived public key:", i.substring(0, 8) + "..."), i;
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
        w.SEAL_CREATION_FAILED,
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
    return Array.from(s).map((r) => r.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const r = await ne.schnorr.sign(t, s);
      return Array.from(r).map((i) => i.toString(16).padStart(2, "0")).join("");
    } catch (r) {
      throw new b(
        "Failed to sign seal event",
        w.SEAL_CREATION_FAILED,
        r
      );
    }
  }
}
const ms = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SealCreator: pe
}, Symbol.toStringTag, { value: "Module" }));
class Pe {
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair() {
    try {
      const e = he(32), t = Array.from(e).map((o) => o.toString(16).padStart(2, "0")).join(""), r = ne.getPublicKey(t, !1).slice(1, 33), i = Array.from(r).map((o) => o.toString(16).padStart(2, "0")).join("");
      return {
        privateKey: t,
        publicKey: i
      };
    } catch (e) {
      throw new b(
        `Ephemeral key generation failed: ${e.message}`,
        w.EPHEMERAL_KEY_GENERATION_FAILED,
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
        w.EPHEMERAL_KEY_GENERATION_FAILED
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
      const s = ne.getPublicKey(e.privateKey, !1).slice(1, 33), r = Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
      return e.publicKey.toLowerCase() === r.toLowerCase();
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
      const t = he(32).reduce((s, r) => s + r.toString(16).padStart(2, "0"), "");
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
class Ke {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(e = q.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      if (e < 0)
        throw new b(
          "Max age seconds cannot be negative",
          w.TIMESTAMP_RANDOMIZATION_FAILED
        );
      const t = Math.floor(Date.now() / 1e3);
      if (e === 0)
        return t;
      const s = this.generateSecureRandomOffset(e);
      return t - s;
    } catch (t) {
      throw t instanceof b ? t : new b(
        `Timestamp randomization failed: ${t.message}`,
        w.TIMESTAMP_RANDOMIZATION_FAILED,
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
  static generateMultipleRandomizedTimestamps(e, t = q.MAX_TIMESTAMP_AGE_SECONDS) {
    if (e <= 0)
      throw new b(
        "Timestamp count must be greater than 0",
        w.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let r = 0; r < e; r++)
      s.push(this.generateRandomizedTimestamp(t));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(e, t = q.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      const s = Math.floor(Date.now() / 1e3), r = s - t, i = s + 60;
      return e >= r && e <= i;
    } catch {
      return !1;
    }
  }
  /**
   * Get the recommended timestamp randomization window for NIP-59
   */
  static getRecommendedMaxAge() {
    return q.MAX_TIMESTAMP_AGE_SECONDS;
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
        w.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = t - e, r = this.generateSecureRandomOffset(s);
    return e + r;
  }
}
class Me {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(e, t, s, r) {
    try {
      this.validateSeal(e), this.validateRecipient(t);
      const i = s || Pe.generateEphemeralKeyPair();
      if (!Pe.validateEphemeralKeyPair(i))
        throw new b(
          "Invalid ephemeral key pair",
          w.GIFT_WRAP_CREATION_FAILED
        );
      const o = r || Ke.generateRandomizedTimestamp(), a = JSON.stringify(e), c = _.deriveConversationKey(
        i.privateKey,
        t.pubkey
      ), h = _.encrypt(a, c), d = t.relayHint ? ["p", t.pubkey, t.relayHint] : ["p", t.pubkey], u = {
        pubkey: i.publicKey,
        created_at: o,
        kind: q.GIFT_WRAP_KIND,
        tags: [d],
        content: h.payload
      }, g = this.calculateEventId(u), p = await this.signEvent(u, g, i.privateKey);
      return {
        giftWrap: {
          id: g,
          pubkey: i.publicKey,
          created_at: o,
          kind: q.GIFT_WRAP_KIND,
          tags: [d],
          content: h.payload,
          sig: p
        },
        ephemeralKeyPair: i,
        recipient: t.pubkey
      };
    } catch (i) {
      throw i instanceof b ? i : new b(
        `Gift wrap creation failed: ${i.message}`,
        w.GIFT_WRAP_CREATION_FAILED,
        i
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
        w.NO_RECIPIENTS
      );
    const s = [], r = Pe.generateMultipleEphemeralKeyPairs(
      t.length
    ), i = Ke.generateMultipleRandomizedTimestamps(
      t.length
    );
    for (let o = 0; o < t.length; o++) {
      const a = await this.createGiftWrap(
        e,
        t[o],
        r[o],
        i[o]
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
      ), r = _.decrypt(e.content, s);
      if (!r.isValid)
        return { seal: null, isValid: !1 };
      const i = JSON.parse(r.plaintext);
      return this.isValidSeal(i) ? { seal: i, isValid: !0 } : { seal: null, isValid: !1 };
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
        w.INVALID_SEAL
      );
    if (e.kind !== q.SEAL_KIND)
      throw new b(
        "Seal must have kind 13",
        w.INVALID_SEAL
      );
    if (!Array.isArray(e.tags) || e.tags.length !== 0)
      throw new b(
        "Seal must have empty tags array",
        w.INVALID_SEAL
      );
    if (typeof e.content != "string")
      throw new b(
        "Seal must have valid content string",
        w.INVALID_SEAL
      );
  }
  /**
   * Validate recipient configuration
   */
  static validateRecipient(e) {
    if (!e || typeof e != "object")
      throw new b(
        "Recipient must be a valid object",
        w.INVALID_RECIPIENT
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new b(
        "Recipient must have valid pubkey",
        w.INVALID_RECIPIENT
      );
    if (e.relayHint && typeof e.relayHint != "string")
      throw new b(
        "Recipient relay hint must be a string if provided",
        w.INVALID_RECIPIENT
      );
  }
  /**
   * Check if an object is a valid gift wrap (for decryption)
   */
  static isValidGiftWrap(e) {
    return e && typeof e == "object" && e.kind === q.GIFT_WRAP_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length > 0 && Array.isArray(e.tags[0]) && e.tags[0][0] === "p" && typeof e.tags[0][1] == "string";
  }
  /**
   * Check if an object is a valid seal (for decryption)
   */
  static isValidSeal(e) {
    return e && typeof e == "object" && e.kind === q.SEAL_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length === 0;
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
    return Array.from(s).map((r) => r.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const r = await ne.schnorr.sign(t, s);
      return Array.from(r).map((i) => i.toString(16).padStart(2, "0")).join("");
    } catch (r) {
      throw new b(
        "Failed to sign gift wrap event",
        w.GIFT_WRAP_CREATION_FAILED,
        r
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
class ie {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(e, t, s, r) {
    try {
      this.validateCreateDMInputs(e, t, s);
      const i = this.createRumor(e, t, r), o = [];
      for (const c of s.recipients) {
        const h = await pe.createSeal(
          i,
          t,
          c.pubkey
        ), d = await Me.createGiftWrap(
          h,
          {
            pubkey: c.pubkey,
            relayHint: c.relayHint || s.relayHint
          }
        );
        o.push(d);
      }
      const a = await pe.createSeal(
        i,
        t,
        s.recipients[0].pubkey
      );
      return {
        rumor: i,
        seal: a,
        giftWraps: o,
        senderPrivateKey: t
      };
    } catch (i) {
      throw i instanceof b ? i : new b(
        `Gift wrap protocol failed: ${i.message}`,
        w.GIFT_WRAP_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt a gift-wrapped direct message
   * Returns the original rumor and verification status
   */
  static async decryptGiftWrappedDM(e, t) {
    try {
      const s = Me.decryptGiftWrap(
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
      const r = s.seal, i = pe.decryptSeal(
        r,
        t
      );
      return i.isValid ? {
        rumor: i.rumor,
        seal: r,
        isValid: !0,
        senderPubkey: r.pubkey
      } : {
        rumor: null,
        seal: r,
        isValid: !1,
        senderPubkey: r.pubkey
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
    const r = this.getPublicKeyFromPrivate(t), i = [];
    return s && i.push(["subject", s]), {
      pubkey: r,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 14,
      // Chat message kind (NIP-17, not 4)
      tags: i,
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
      const r = await this.createGiftWrappedDM(
        s.message,
        s.senderPrivateKey,
        s.config
      );
      t.push(r);
    }
    return t;
  }
  /**
   * Extract all gift wraps that are meant for a specific recipient
   * Useful for filtering gift wraps from a relay
   */
  static filterGiftWrapsForRecipient(e, t) {
    return e.filter((s) => Me.getRecipientFromGiftWrap(s) === t);
  }
  /**
   * Decrypt multiple gift wraps for a recipient
   * Returns successful decryptions and filters out invalid ones
   */
  static async decryptMultipleGiftWraps(e, t) {
    const s = [];
    for (const r of e) {
      const i = await this.decryptGiftWrappedDM(r, t);
      i.isValid && s.push(i);
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
        w.INVALID_RUMOR
      );
    if (typeof t != "string" || !/^[0-9a-f]{64}$/i.test(t))
      throw new b(
        "Invalid sender private key format",
        w.SEAL_CREATION_FAILED
      );
    if (!s || !Array.isArray(s.recipients) || s.recipients.length === 0)
      throw new b(
        "At least one recipient is required",
        w.NO_RECIPIENTS
      );
    for (const r of s.recipients)
      if (!r || typeof r.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(r.pubkey))
        throw new b(
          "Invalid recipient public key format",
          w.INVALID_RECIPIENT
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
      const r = ne.getPublicKey(t, !1).slice(1, 33), i = Array.from(r).map((o) => o.toString(16).padStart(2, "0")).join("");
      return console.log("✅ Successfully derived public key:", i.substring(0, 8) + "..."), i;
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
        w.SEAL_CREATION_FAILED,
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
    const t = e.length, s = e.reduce((c, h) => c + h.giftWraps.length, 0), r = Math.floor(Date.now() / 1e3), i = e.flatMap(
      (c) => c.giftWraps.map((h) => r - h.giftWrap.created_at)
    ), o = i.length > 0 ? i.reduce((c, h) => c + h, 0) / i.length : 0, a = new Set(
      e.flatMap((c) => c.giftWraps.map((h) => h.recipient))
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
          w.INVALID_PRIVATE_KEY
        );
      const { SealCreator: s } = await Promise.resolve().then(() => ms), { NIP44Crypto: r } = await Promise.resolve().then(() => ws), i = await r.decrypt(
        e.content,
        t,
        e.pubkey
      );
      if (!i)
        return null;
      const o = JSON.parse(i);
      if (!o || o.kind !== 13)
        return null;
      const a = await r.decrypt(
        o.content,
        t,
        o.pubkey
      );
      if (!a)
        return null;
      const c = JSON.parse(a);
      return !c || typeof c.kind != "number" ? null : c;
    } catch (s) {
      return console.error("Failed to unwrap gift wrapped DM:", s), null;
    }
  }
}
const Es = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapProtocol: ie
}, Symbol.toStringTag, { value: "Module" }));
class yt {
  constructor(e) {
    l(this, "_state");
    l(this, "subscription");
    l(this, "config");
    // Reactive store properties
    l(this, "messages");
    l(this, "status");
    l(this, "latest");
    l(this, "error");
    l(this, "subject");
    this.config = e, this._state = te({
      messages: [],
      status: "connecting",
      latest: null,
      isTyping: !1,
      error: null,
      subject: e.subject
    }), this.messages = I(this._state, (t) => t.messages), this.status = I(this._state, (t) => t.status), this.latest = I(this._state, (t) => t.latest), this.error = I(this._state, (t) => t.error), this.subject = I(this._state, (t) => t.subject), this.initializeSubscription();
  }
  /**
   * Send an encrypted direct message
   */
  async send(e, t) {
    var s, r;
    try {
      this.config.debug && console.log("📤 DMConversation.send called:", {
        content: e.substring(0, 20) + "...",
        subject: t,
        recipientPubkey: this.config.recipientPubkey.substring(0, 8) + "...",
        hasSenderPrivateKey: !!this.config.senderPrivateKey,
        senderPrivateKeyLength: (s = this.config.senderPrivateKey) == null ? void 0 : s.length
      }), this.updateStatus("active");
      const i = this.generateMessageId(), o = Math.floor(Date.now() / 1e3), a = {
        id: i,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp: o,
        isFromMe: !0,
        status: "sending",
        subject: t || this.getCurrentSubject()
      };
      this.addMessage(a);
      const c = ie.createSimpleConfig(
        this.config.recipientPubkey,
        (r = this.config.relayHints) == null ? void 0 : r[0]
      );
      this.config.debug && console.log("🎁 Creating gift wrap with config:", c);
      const h = await ie.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        c,
        t
      );
      this.config.debug && console.log("🎁 Gift wrap result:", {
        hasRumor: !!h.rumor,
        hasSeal: !!h.seal,
        giftWrapCount: h.giftWraps.length
      });
      let d = !1, u;
      for (const g of h.giftWraps)
        try {
          this.config.debug && console.log("📡 Publishing gift wrap:", {
            id: g.giftWrap.id,
            kind: g.giftWrap.kind,
            tags: g.giftWrap.tags
          });
          const p = await this.config.relayManager.publishToAll(g.giftWrap);
          this.config.debug && console.log("📡 Publish result:", p), p.some((y) => y.success) && (d = !0, a.eventId = g.giftWrap.id);
        } catch (p) {
          u = p instanceof Error ? p.message : "Publishing failed", this.config.debug && console.error("❌ Publish error:", p);
        }
      if (d)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`✅ DM sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const g = u || "Failed to publish to any relay";
        return this.setError(g), this.config.debug && console.error(`❌ DM send failed: ${g}`), { success: !1, error: g, messageId: i };
      }
    } catch (i) {
      const o = i instanceof Error ? i.message : "Unknown error sending message";
      return this.setError(o), this.config.debug && console.error("❌ Exception in send:", i), { success: !1, error: o };
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
        onEvent: (r) => this.handleIncomingEvent(r),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`DM conversation subscription active for ${this.config.recipientPubkey}`);
        },
        onClose: (r) => {
          this.updateStatus("disconnected"), r && this.setError(`Subscription closed: ${r}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([t], s), !this.subscription.success) {
        const r = ((e = this.subscription.error) == null ? void 0 : e.message) || "Failed to create subscription";
        this.setError(r), this.updateStatus("error");
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
      const t = await ie.decryptGiftWrappedDM(
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
      return s.sort((r, i) => r.timestamp - i.timestamp), {
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
        (r) => r.id === e ? { ...r, status: t } : r
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
    const t = (s = e.tags) == null ? void 0 : s.find((r) => r[0] === "subject");
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
class bt {
  constructor(e) {
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
    var t;
    this.config = e, this.roomId = this.generateRoomId(), this._state = te({
      messages: [],
      status: "connecting",
      latest: null,
      subject: ((t = e.options) == null ? void 0 : t.subject) || "Group Chat",
      participants: [...e.participants, e.senderPubkey],
      // Include sender
      isTyping: !1,
      error: null
    }), this.messages = I(this._state, (s) => s.messages), this.status = I(this._state, (s) => s.status), this.latest = I(this._state, (s) => s.latest), this.subject = I(this._state, (s) => s.subject), this.participants = I(this._state, (s) => s.participants), this.error = I(this._state, (s) => s.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted message to all room participants
   */
  async send(e) {
    var t, s;
    try {
      this.updateStatus("active");
      const r = this.generateMessageId(), i = Math.floor(Date.now() / 1e3), o = this.getCurrentSubject(), a = this.getCurrentParticipants(), c = {
        id: r,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: i,
        isFromMe: !0,
        status: "sending",
        subject: o,
        participants: a
      };
      this.addMessage(c);
      const d = {
        recipients: a.filter((f) => f !== this.config.senderPubkey).map((f) => ({ pubkey: f })),
        relayHint: (s = (t = this.config.options) == null ? void 0 : t.relayHints) == null ? void 0 : s[0]
      }, u = await ie.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        d
      );
      let g = !1, p;
      for (const f of u.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(f.giftWrap)).some((m) => m.success) && (g = !0, c.eventId = f.giftWrap.id);
        } catch (y) {
          p = y instanceof Error ? y.message : "Publishing failed";
        }
      if (g)
        return this.updateMessageStatus(r, "sent"), this.config.debug && console.log(`Room message sent successfully: ${r}`), { success: !0, messageId: r };
      {
        this.updateMessageStatus(r, "failed");
        const f = p || "Failed to publish to any relay";
        return this.setError(f), { success: !1, error: f, messageId: r };
      }
    } catch (r) {
      const i = r instanceof Error ? r.message : "Unknown error sending message";
      return this.setError(i), { success: !1, error: i };
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
        participants: s.participants.filter((r) => r !== e)
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
        onEvent: (r) => this.handleIncomingEvent(r),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`Room subscription active: ${this.roomId}`);
        },
        onClose: (r) => {
          this.updateStatus("disconnected"), r && this.setError(`Subscription closed: ${r}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([t], s), !this.subscription.success) {
        const r = ((e = this.subscription.error) == null ? void 0 : e.message) || "Failed to create subscription";
        this.setError(r), this.updateStatus("error");
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
      const t = await ie.decryptGiftWrappedDM(
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
      const r = this.extractSubjectFromRumor(t.rumor), i = this.getCurrentSubject(), o = {
        id: this.generateMessageId(),
        content: t.rumor.content,
        senderPubkey: t.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: t.rumor.created_at,
        isFromMe: !1,
        eventId: e.id,
        status: "received",
        subject: r || i,
        participants: s
      };
      this.getCurrentMessages().some(
        (h) => h.eventId === e.id || h.content === o.content && Math.abs(h.timestamp - o.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(o), this.config.debug && console.log(`Received room message from ${t.senderPubkey}: ${o.content}`));
    } catch (t) {
      this.config.debug && console.error("Error handling incoming room event:", t);
    }
  }
  addMessage(e) {
    this._state.update((t) => {
      const s = [...t.messages, e];
      return s.sort((r, i) => r.timestamp - i.timestamp), {
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
        (r) => r.id === e ? { ...r, status: t } : r
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
    const t = (s = e.tags) == null ? void 0 : s.find((r) => r[0] === "subject");
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
class wt {
  constructor(e) {
    l(this, "conversations", /* @__PURE__ */ new Map());
    l(this, "rooms", /* @__PURE__ */ new Map());
    l(this, "config");
    l(this, "_senderPubkey", null);
    l(this, "_senderPrivateKey", null);
    l(this, "parentNostr");
    // Reference to NostrUnchained instance
    // Reactive stores
    l(this, "_conversationList", te([]));
    l(this, "conversations$");
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
    const s = e.map((o) => this.normalizePubkey(o)), r = this.generateRoomId(s);
    let i = this.rooms.get(r);
    return i || (i = await this.createRoom(s, t), this.rooms.set(r, i), this.updateConversationList(), this.config.debug && console.log(`Created new DM room: ${r} with ${s.length} participants`)), i;
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
    }, r = new yt(s);
    return this.setupConversationReactivity(r), r;
  }
  async createRoom(e, t) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const s = await this.getPrivateKeySecurely(), r = {
      participants: e,
      senderPrivateKey: s,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      options: t,
      debug: this.config.debug
    }, i = new bt(r);
    return this.setupRoomReactivity(i), i;
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
      let r = null, i = "disconnected", o;
      const a = t.latest.subscribe((d) => {
        r = d;
      }), c = t.status.subscribe((d) => {
        i = d;
      }), h = t.subject.subscribe((d) => {
        o = d;
      });
      a(), c(), h(), e.push({
        pubkey: s,
        latestMessage: r,
        lastActivity: (r == null ? void 0 : r.timestamp) || 0,
        isActive: i === "active" || i === "connecting",
        subject: o,
        type: "conversation"
      });
    }), this.rooms.forEach((t, s) => {
      let r = null, i = "disconnected", o = "", a = [];
      const c = t.latest.subscribe((g) => {
        r = g;
      }), h = t.status.subscribe((g) => {
        i = g;
      }), d = t.subject.subscribe((g) => {
        o = g;
      }), u = t.participants.subscribe((g) => {
        a = g;
      });
      c(), h(), d(), u(), e.push({
        pubkey: s,
        // Use roomId as the identifier
        latestMessage: r,
        lastActivity: (r == null ? void 0 : r.timestamp) || 0,
        isActive: i === "active" || i === "connecting",
        subject: o,
        participants: a,
        type: "room"
      });
    }), e.sort((t, s) => s.lastActivity - t.lastActivity), this._conversationList.set(e);
  }
  async handleGlobalInboxEvent(e) {
    this.config.debug && console.log("🎁 Processing gift wrap event:", e.id);
    try {
      const { GiftWrapProtocol: t } = await Promise.resolve().then(() => Es), s = await this.getPrivateKeySecurely(), r = await t.unwrapGiftWrap(e, s);
      if (r) {
        const i = r.pubkey;
        if (this.config.debug && console.log("✅ Decrypted event (kind " + r.kind + ") from:", i.substring(0, 8) + "..."), r.kind === 4 || r.kind === 14) {
          let o = this.conversations.get(i);
          o || (this.config.debug && console.log("🆕 Auto-creating conversation with:", i.substring(0, 8) + "..."), o = await this.with(i)), o && typeof o.handleDecryptedEvent == "function" && o.handleDecryptedEvent(r), this.updateConversationList(), this.config.debug && console.log("🔄 Updated conversations, total:", this.conversations.size);
        } else
          this.config.debug && console.log("🔮 Received encrypted event kind " + r.kind + " - not a DM, caching for future use");
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
class vs {
  constructor(e, t, s) {
    l(this, "store");
    l(this, "myPubkey");
    l(this, "otherPubkey");
    l(this, "nostr");
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
      }, r = await this.nostr.publishEncrypted(s, [this.otherPubkey]);
      return r.success ? { success: !0, messageId: s.id } : { success: !1, error: r.error };
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
class Ss {
  constructor(e, t) {
    this.nostr = e, this.myPubkey = t;
  }
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  with(e) {
    return this.nostr.startUniversalGiftWrapSubscription().catch((t) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DMs:", t);
    }), new vs(this.nostr, this.myPubkey, e);
  }
  // Room functionality - also just queries (with lazy gift wrap subscription)
  room(e, t) {
    return this.nostr.startUniversalGiftWrapSubscription().catch((s) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DM room:", s);
    }), new Is(this.nostr, this.myPubkey, e, t);
  }
  // Get all conversations - query all kind 14 events I'm involved in
  get conversations() {
    return [];
  }
}
class Is {
  // TODO: Implement room store
  constructor(e, t, s, r) {
    l(this, "store");
    this.nostr = e, this.myPubkey = t, this.participants = s, this.options = r, this.store = this.nostr.query().kinds([14]).tags("p", [this.myPubkey, ...this.participants]).execute();
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
class _s {
  // ListModule;
  constructor(e) {
    l(this, "config");
    // Lazy-loaded modules
    l(this, "_content");
    // ContentModule;
    l(this, "_reactions");
    // ReactionModule;
    l(this, "_threads");
    // ThreadModule;
    l(this, "_feeds");
    // FeedModule;
    l(this, "_communities");
    // CommunityModule;
    l(this, "_lists");
    this.config = e, this.config.debug && console.log("🔥 SocialModule initialized with Clean Architecture");
  }
  /**
   * Content operations (NIP-01, NIP-18, NIP-23)
   * Text notes, articles, reposts
   */
  get content() {
    if (!this._content)
      throw new Error("ContentModule not yet implemented - Coming in Phase 1");
    return this._content;
  }
  /**
   * Reaction operations (NIP-25)
   * Likes, dislikes, emoji reactions
   */
  get reactions() {
    if (!this._reactions)
      throw new Error("ReactionModule not yet implemented - Coming in Phase 1");
    return this._reactions;
  }
  /**
   * Thread operations (NIP-10, NIP-22)
   * Threading, conversations, comments
   */
  get threads() {
    if (!this._threads)
      throw new Error("ThreadModule not yet implemented - Coming in Phase 1");
    return this._threads;
  }
  /**
   * Feed operations
   * Timeline aggregation, social feeds
   */
  get feeds() {
    if (!this._feeds)
      throw new Error("FeedModule not yet implemented - Coming in Phase 1");
    return this._feeds;
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
   * Clean up resources
   */
  async close() {
    var e, t, s, r, i, o;
    (e = this._content) != null && e.close && await this._content.close(), (t = this._reactions) != null && t.close && await this._reactions.close(), (s = this._threads) != null && s.close && await this._threads.close(), (r = this._feeds) != null && r.close && await this._feeds.close(), (i = this._communities) != null && i.close && await this._communities.close(), (o = this._lists) != null && o.close && await this._lists.close();
  }
}
class As {
  constructor(e, t, s, r = {}) {
    l(this, "listeners", /* @__PURE__ */ new Map());
    l(this, "subscriptionResult");
    l(this, "eventCount", 0);
    l(this, "createdAt", Date.now());
    l(this, "lastEventAt");
    l(this, "debug");
    this.key = e, this.filters = t, this.relays = s, this.debug = r.debug || !1;
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
        Promise.resolve(s.onEvent(e)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEvent error:`, r), s.onError && s.onError(r instanceof Error ? r : new Error(String(r)));
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
        Promise.resolve(s.onEose(e)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEose error:`, r), s.onError && s.onError(r instanceof Error ? r : new Error(String(r)));
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
        Promise.resolve(s.onClose(e)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onClose error:`, r);
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
        Promise.resolve(s.onError(e)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onError handler error:`, r);
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
    return ((e = this.subscriptionResult) == null ? void 0 : e.success) === !0 && this.hasListeners();
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
class Ps {
  constructor(e) {
    l(this, "subscriptions", /* @__PURE__ */ new Map());
    l(this, "eventCallbacks", /* @__PURE__ */ new Map());
    l(this, "sharedSubscriptions", /* @__PURE__ */ new Map());
    l(this, "debug");
    this.relayManager = e, this.debug = e.debug || !1, this.setupRelayMessageHandling();
  }
  /**
   * Get or create a shared subscription with smart deduplication
   * This is the new preferred method for subscription management
   */
  async getOrCreateSubscription(e, t) {
    const s = t || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, r = this.generateFilterHash(e, s);
    if (this.sharedSubscriptions.has(r)) {
      const a = this.sharedSubscriptions.get(r);
      if (this.debug) {
        const c = a.getStats(), h = this.summarizeFilters(e);
        console.log(`SubscriptionManager: Reusing shared subscription ${r} (${c.listenerCount} listeners) - Filters: ${h}`);
      }
      return a;
    }
    const i = new As(r, e, s, { debug: this.debug }), o = await this.subscribe(e, {
      relays: s,
      onEvent: (a) => i.broadcast(a),
      onEose: (a) => i.notifyEose(a),
      onClose: (a) => i.notifyClose(a),
      onError: (a) => i.notifyError(a)
    });
    if (i.setSubscriptionResult(o), o.success && (this.sharedSubscriptions.set(r, i), this.debug)) {
      const a = this.summarizeFilters(e);
      console.log(`SubscriptionManager: Created new shared subscription ${r} - Filters: ${a}`);
    }
    return i;
  }
  /**
   * Create a human-readable summary of filters for debugging
   */
  summarizeFilters(e) {
    return e.map((t) => {
      const s = [];
      if (t.kinds && s.push(`kinds:[${t.kinds.join(",")}]`), t.authors) {
        const r = t.authors.length > 1 ? `${t.authors.length} authors` : `author:${t.authors[0].substring(0, 8)}...`;
        s.push(r);
      }
      if (t.ids) {
        const r = t.ids.length > 1 ? `${t.ids.length} ids` : `id:${t.ids[0].substring(0, 8)}...`;
        s.push(r);
      }
      return t["#p"] && s.push(`#p:${t["#p"].length} mentions`), t["#e"] && s.push(`#e:${t["#e"].length} events`), t["#t"] && s.push(`#t:${t["#t"].join(",")}`), t.since && s.push(`since:${new Date(t.since * 1e3).toISOString().substring(11, 19)}`), t.until && s.push(`until:${new Date(t.until * 1e3).toISOString().substring(11, 19)}`), t.limit && s.push(`limit:${t.limit}`), `{${s.join(", ")}}`;
    }).join(" + ");
  }
  /**
   * Generate a hash key for filter deduplication
   */
  generateFilterHash(e, t) {
    const s = JSON.stringify(e.map((a) => {
      const c = {};
      return Object.keys(a).sort().forEach((h) => {
        c[h] = a[h];
      }), c;
    })), r = t.slice().sort().join(","), i = `${s}:${r}`;
    let o = 0;
    for (let a = 0; a < i.length; a++) {
      const c = i.charCodeAt(a);
      o = (o << 5) - o + c, o = o & o;
    }
    return Math.abs(o).toString(16).padStart(16, "0").substring(0, 16);
  }
  /**
   * Clean up shared subscriptions with no listeners
   */
  async cleanupSharedSubscriptions() {
    const e = [];
    for (const [t, s] of this.sharedSubscriptions.entries())
      if (!s.hasListeners()) {
        e.push(t);
        const r = s.getSubscriptionId();
        r && await this.close(r, "No more listeners");
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
      const r = s.getStats();
      e += r.listenerCount, r.listenerCount > 1 && (t += r.listenerCount - 1);
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
    var s, r, i, o;
    try {
      const a = this.validateFilters(e);
      if (a)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: a
        };
      const c = this.generateSubscriptionId(), h = Date.now(), d = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, u = {
        id: c,
        filters: e,
        relays: d,
        state: "pending",
        createdAt: h,
        eventCount: 0,
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      if (d.forEach((m) => {
        u.relayStates[m] = "active";
      }), t.timeout && (u.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, t.timeout)), this.subscriptions.set(c, u), this.debug) {
        const m = this.summarizeFilters(e);
        console.log(`Creating subscription ${c} with ${e.length} filters: ${m}`);
      }
      const g = t.retryAttempts || 1, p = t.retryDelay || 1e3;
      let f = [], y;
      for (let m = 0; m < g; m++)
        try {
          const v = ["REQ", c, ...e];
          try {
            await ((r = (s = this.relayManager).sendToAll) == null ? void 0 : r.call(s, v)), f = d.map((P) => ({
              relay: P,
              success: !0,
              error: void 0
            }));
            break;
          } catch (P) {
            f = [];
            let J = !1;
            for (const le of d)
              try {
                await ((o = (i = this.relayManager).sendToRelays) == null ? void 0 : o.call(i, [le], v)), f.push({
                  relay: le,
                  success: !0,
                  error: void 0
                }), J = !0;
              } catch (M) {
                f.push({
                  relay: le,
                  success: !1,
                  error: M instanceof Error ? M : new Error("Unknown error")
                });
              }
            if (J)
              break;
            y = P instanceof Error ? P : new Error("All relays failed");
          }
        } catch (v) {
          y = v instanceof Error ? v : new Error("Unknown error"), f = d.map((P) => ({
            relay: P,
            success: !1,
            error: y
          })), m < g - 1 && await new Promise((P) => setTimeout(P, p));
        }
      const S = f.length > 0 && f.some((m) => m.success);
      return S || (this.subscriptions.delete(c), u.timeoutId && clearTimeout(u.timeoutId)), {
        subscription: S ? this.externalizeSubscription(u) : {},
        success: S,
        relayResults: f,
        error: S ? void 0 : {
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
    var s, r, i, o;
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    t.state = "active";
    try {
      const a = ["REQ", e, ...t.filters], c = this.relayManager.connectedRelays;
      t.relays.length !== c.length || !t.relays.every((d) => c.includes(d)) ? await ((r = (s = this.relayManager).sendToRelays) == null ? void 0 : r.call(s, t.relays, a)) : await ((o = (i = this.relayManager).sendToAll) == null ? void 0 : o.call(i, a));
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
    var r, i;
    const s = this.subscriptions.get(e);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const o = ["CLOSE", e];
        await ((i = (r = this.relayManager).sendToAll) == null ? void 0 : i.call(r, o));
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
    const r = [];
    for (const i of t)
      s.receivedEventIds.has(i.id) || (s.receivedEventIds.add(i.id), r.push(i));
    if (s.eventCount += r.length, s.lastEventAt = Date.now(), s.onEvent && r.length > 0)
      for (const i of r)
        s.onEvent(i);
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
    const [s, r, ...i] = t;
    switch (s) {
      case "EVENT":
        const o = i[0];
        await this.handleRelayEvent(e, r, o);
        break;
      case "EOSE":
        await this.markEose(r, e);
        break;
      case "NOTICE":
        this.debug && console.log(`Notice from ${e}:`, i[0]);
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
    const s = [], r = ["REQ", e.id, ...e.filters];
    if (this.relayManager.sendToRelays)
      for (const i of e.relays)
        try {
          await this.relayManager.sendToRelays([i], r), s.push({
            relay: i,
            success: !0,
            subscriptionId: e.id
          });
        } catch (o) {
          s.push({
            relay: i,
            success: !1,
            error: o instanceof Error ? o.message : "Unknown error",
            subscriptionId: e.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(r), e.relays.forEach((i) => {
          s.push({
            relay: i,
            success: !0,
            subscriptionId: e.id
          });
        })) : e.relays.forEach((i) => {
          s.push({
            relay: i,
            success: !0,
            subscriptionId: e.id
          });
        });
      } catch (i) {
        e.relays.forEach((o) => {
          s.push({
            relay: o,
            success: !1,
            error: i instanceof Error ? i.message : "Unknown error",
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
      set(t, s, r) {
        return s === "eventCount" || s === "lastEventAt" || s === "state" ? (t[s] = r, !0) : !1;
      }
    });
  }
  setupRelayMessageHandling() {
    this.relayManager.setMessageHandler((e, t) => {
      this.handleRelayMessage(e, t);
    });
  }
}
class Ie {
  constructor(e, t = {}) {
    l(this, "events", /* @__PURE__ */ new Map());
    // ALL events (decrypted)
    l(this, "eventsByKind", /* @__PURE__ */ new Map());
    // Fast lookup by kind
    l(this, "eventsByAuthor", /* @__PURE__ */ new Map());
    // Fast lookup by author
    l(this, "eventsByTag", /* @__PURE__ */ new Map());
    // tag name → value → event IDs
    l(this, "subscribers", /* @__PURE__ */ new Set());
    l(this, "privateKey");
    l(this, "config");
    // LRU tracking
    l(this, "accessOrder", []);
    l(this, "lastAccess", /* @__PURE__ */ new Map());
    // Statistics tracking
    l(this, "stats", {
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
    s.forEach((i) => this.updateAccessTracking(i.id));
    const r = performance.now() - t;
    return this.stats.queryCount++, this.stats.totalQueryTime += r, s;
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
    return await ie.unwrapGiftWrap(e, this.privateKey);
  }
  updateIndexes(e) {
    this.eventsByKind.has(e.kind) || this.eventsByKind.set(e.kind, /* @__PURE__ */ new Set()), this.eventsByKind.get(e.kind).add(e.id), this.eventsByAuthor.has(e.pubkey) || this.eventsByAuthor.set(e.pubkey, /* @__PURE__ */ new Set()), this.eventsByAuthor.get(e.pubkey).add(e.id), e.tags.forEach((t) => {
      const [s, r] = t;
      if (!r) return;
      this.eventsByTag.has(s) || this.eventsByTag.set(s, /* @__PURE__ */ new Map());
      const i = this.eventsByTag.get(s);
      i.has(r) || i.set(r, /* @__PURE__ */ new Set()), i.get(r).add(e.id);
    });
  }
  getMatchingEvents(e) {
    let t;
    if (e.kinds && e.kinds.length > 0) {
      const r = e.kinds.map((i) => this.eventsByKind.get(i) || /* @__PURE__ */ new Set());
      t = this.unionSets(r);
    }
    if (e.authors && e.authors.length > 0) {
      const r = e.authors.map((o) => this.eventsByAuthor.get(o) || /* @__PURE__ */ new Set()), i = this.unionSets(r);
      t = t ? this.intersectSets([t, i]) : i;
    }
    Object.entries(e).forEach(([r, i]) => {
      if (r.startsWith("#") && Array.isArray(i) && i.length > 0) {
        const o = r.slice(1), a = this.eventsByTag.get(o);
        if (a) {
          const c = i.map((d) => a.get(d) || /* @__PURE__ */ new Set()), h = this.unionSets(c);
          t = t ? this.intersectSets([t, h]) : h;
        } else
          t = /* @__PURE__ */ new Set();
      }
    });
    const s = Array.from(t || this.events.keys()).map((r) => this.events.get(r)).filter((r) => r && this.matchesFilter(r, e)).sort((r, i) => i.created_at - r.created_at);
    return e.limit && e.limit > 0 ? s.slice(0, e.limit) : s;
  }
  matchesFilter(e, t) {
    return !(t.since && e.created_at < t.since || t.until && e.created_at > t.until || t.ids && t.ids.length > 0 && !t.ids.includes(e.id));
  }
  unionSets(e) {
    const t = /* @__PURE__ */ new Set();
    return e.forEach((s) => {
      s.forEach((r) => t.add(r));
    }), t;
  }
  intersectSets(e) {
    if (e.length === 0) return /* @__PURE__ */ new Set();
    if (e.length === 1) return e[0];
    const t = /* @__PURE__ */ new Set();
    return e[0].forEach((r) => {
      e.every((i) => i.has(r)) && t.add(r);
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
    var s, r;
    const t = this.events.get(e);
    t && (this.stats.evictedCount++, this.events.delete(e), (s = this.eventsByKind.get(t.kind)) == null || s.delete(e), (r = this.eventsByAuthor.get(t.pubkey)) == null || r.delete(e), t.tags.forEach((i) => {
      var c, h;
      const [o, a] = i;
      a && ((h = (c = this.eventsByTag.get(o)) == null ? void 0 : c.get(a)) == null || h.delete(e));
    }), this.lastAccess.delete(e));
  }
  estimateMemoryUsage() {
    return this.events.size * 1024 / (1024 * 1024);
  }
}
class mt {
  constructor() {
    l(this, "filter", {});
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
class Et {
  constructor(e, t) {
    l(this, "cache");
    l(this, "filter");
    l(this, "_data");
    l(this, "subscribers", /* @__PURE__ */ new Set());
    l(this, "unsubscribeCache");
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
    return new Ms(this, e);
  }
  updateData() {
    this._data = this.cache.query(this.filter), this.notifySubscribers();
  }
  notifySubscribers() {
    this.subscribers.forEach((e) => e(this._data));
  }
  matchesFilter(e, t) {
    return !(t.kinds && !t.kinds.includes(e.kind) || t.authors && !t.authors.includes(e.pubkey) || t.ids && !t.ids.includes(e.id));
  }
}
class Ms {
  constructor(e, t) {
    l(this, "_data");
    l(this, "subscribers", /* @__PURE__ */ new Set());
    l(this, "sourceUnsubscriber");
    this.sourceStore = e, this.transform = t, this._data = this.transform(this.sourceStore.current), this.sourceUnsubscriber = this.sourceStore.subscribe((s) => {
      const r = this.transform(s);
      this._data !== r && (this._data = r, this.notifySubscribers());
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
class ks extends mt {
  constructor(e) {
    super(), this.cache = e;
  }
  execute() {
    return new Et(this.cache, this.filter);
  }
}
class Ts extends mt {
  constructor(t, s) {
    super();
    l(this, "relayUrls", []);
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
   * USES SMART DEDUPLICATION to prevent subscription overload
   */
  async execute() {
    const t = this.relayUrls.length > 0 ? this.relayUrls : void 0, s = await this.subscriptionManager.getOrCreateSubscription([this.filter], t), r = s.addListener({
      onEvent: (o) => {
        this.cache.addEvent(o);
      }
    }), i = new Et(this.cache, this.filter);
    return {
      id: s.key,
      store: i,
      stop: async () => {
        s.removeListener(r);
      },
      isActive: () => s.isActive()
    };
  }
}
class vt {
  constructor(e) {
    l(this, "config");
    l(this, "updates", {});
    l(this, "shouldPreserveExisting", !0);
    l(this, "customMetadata", {});
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
    }, r = A.addEventId(s), i = await this.config.signingProvider.signEvent(s);
    return {
      ...r,
      sig: i
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
      }, r = A.addEventId(s), i = await this.config.signingProvider.signEvent(s), o = {
        ...r,
        sig: i
      }, c = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (d) => {
          try {
            return await this.config.relayManager.sendToRelay(d, ["EVENT", o]), { success: !0, relay: d };
          } catch (u) {
            return {
              success: !1,
              relay: d,
              error: u instanceof Error ? u.message : "Unknown error"
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
        const i = s[0];
        try {
          const o = JSON.parse(i.content);
          return {
            pubkey: i.pubkey,
            metadata: o,
            lastUpdated: i.created_at,
            eventId: i.id,
            isOwn: !0
          };
        } catch {
          return null;
        }
      }
      await this.config.nostr.sub().kinds([0]).authors([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = t.current;
      if (r && r.length > 0) {
        const i = r[0];
        try {
          const o = JSON.parse(i.content);
          return {
            pubkey: i.pubkey,
            metadata: o,
            lastUpdated: i.created_at,
            eventId: i.id,
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
class St {
  constructor(e) {
    l(this, "config");
    l(this, "pubkeys", []);
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
      const e = this.config.nostr.query().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), t = e.current, s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
      this.pubkeys.forEach((a) => {
        s.set(a, null);
      });
      let i = 0;
      return t.forEach((a) => {
        if (a.kind === 0 && this.pubkeys.includes(a.pubkey))
          try {
            const c = JSON.parse(a.content), h = {
              pubkey: a.pubkey,
              metadata: c,
              lastUpdated: a.created_at,
              eventId: a.id,
              isOwn: !1
            };
            s.set(a.pubkey, h), i++;
          } catch {
            r.set(a.pubkey, "Failed to parse profile metadata");
          }
      }), this.config.debug && console.log(`ProfileBatchBuilder: Found ${i}/${this.pubkeys.length} profiles in cache`), i === this.pubkeys.length ? {
        profiles: s,
        success: !0,
        errors: r,
        totalRequested: this.pubkeys.length,
        totalFound: i
      } : (await this.config.nostr.sub().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), await new Promise((a) => setTimeout(a, 2e3)), e.current.forEach((a) => {
        if (a.kind === 0 && this.pubkeys.includes(a.pubkey) && !s.get(a.pubkey))
          try {
            const c = JSON.parse(a.content), h = {
              pubkey: a.pubkey,
              metadata: c,
              lastUpdated: a.created_at,
              eventId: a.id,
              isOwn: !1
            };
            s.set(a.pubkey, h), i++;
          } catch {
            r.set(a.pubkey, "Failed to parse profile metadata");
          }
      }), this.config.debug && console.log(`ProfileBatchBuilder: Final result - found ${i}/${this.pubkeys.length} profiles`), {
        profiles: s,
        success: !0,
        errors: r,
        totalRequested: this.pubkeys.length,
        totalFound: i
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
            const r = JSON.parse(s.content);
            t.set(s.pubkey, {
              pubkey: s.pubkey,
              metadata: r,
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
class It {
  constructor(e) {
    l(this, "config");
    l(this, "criteria", {});
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
      return new Promise((r) => {
        let i = !1;
        const o = setTimeout(() => {
          i || (i = !0, this.finalizeResults(t, r));
        }, 1e4);
        (async () => {
          const c = await this.config.subscriptionManager.getOrCreateSubscription([e]), h = c.addListener({
            onEvent: async (d) => {
              if (d.kind === 0 && !s.has(d.pubkey)) {
                s.add(d.pubkey);
                try {
                  const u = await this.parseProfileEvent(d), g = await this.evaluateProfile(u);
                  g && (t.push(g), this.config.debug && console.log(`ProfileDiscoveryBuilder: Found match - ${u.metadata.name || "unnamed"} (score: ${g.relevanceScore})`), this.criteria.limit && t.length >= this.criteria.limit && (i || (i = !0, clearTimeout(o), c.removeListener(h), this.finalizeResults(t, r))));
                } catch (u) {
                  this.config.debug && console.error("ProfileDiscoveryBuilder: Error processing profile:", u);
                }
              }
            },
            onEose: () => {
              i || (i = !0, clearTimeout(o), c.removeListener(h), this.finalizeResults(t, r));
            },
            onError: (d) => {
              i || (i = !0, clearTimeout(o), c.removeListener(h), this.config.debug && console.error("ProfileDiscoveryBuilder: Search error:", d), r(t));
            }
          });
        })().catch((c) => {
          i || (i = !0, clearTimeout(o), this.config.debug && console.error("ProfileDiscoveryBuilder: Failed to start search:", c), r(t));
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
    let s = 0, r = 0, i = 0;
    if (this.criteria.nameQuery) {
      i++;
      const h = ((a = e.metadata.name) == null ? void 0 : a.toLowerCase()) || "";
      if (h.includes(this.criteria.nameQuery))
        t.push("name"), r++, h === this.criteria.nameQuery ? s += 1 : h.startsWith(this.criteria.nameQuery) ? s += 0.8 : s += 0.5;
      else
        return null;
    }
    if (this.criteria.nip05Query) {
      i++;
      const h = ((c = e.metadata.nip05) == null ? void 0 : c.toLowerCase()) || "";
      if (h.includes(this.criteria.nip05Query))
        t.push("nip05"), r++, s += h === this.criteria.nip05Query ? 1 : 0.7;
      else
        return null;
    }
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0)
      for (const [h, d] of this.criteria.metadataFilters) {
        i++;
        const u = e.metadata[h];
        u !== void 0 && (d === void 0 ? (t.push(h), r++, s += 0.3) : typeof u == "string" && typeof d == "string" ? u.toLowerCase().includes(d.toLowerCase()) && (t.push(h), r++, s += u.toLowerCase() === d.toLowerCase() ? 0.8 : 0.5) : u === d && (t.push(h), r++, s += 0.8));
      }
    if (this.criteria.verifiedOnly) {
      if (i++, e.metadata.nip05) {
        if (await this.checkNip05Verification(e))
          t.push("verified"), r++, s += 0.5;
        else if (this.criteria.verifiedOnly)
          return null;
      } else if (this.criteria.verifiedOnly)
        return null;
    }
    if (i === 0 && (s = 0.1, r = 1, i = 1), i > 0 && r === 0)
      return null;
    const o = Math.min(1, s / Math.max(i, 1));
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
      const [s, r] = e.metadata.nip05.split("@");
      if (!s || !r) return !1;
      const i = new AbortController(), o = setTimeout(() => i.abort(), 5e3), a = await fetch(`https://${r}/.well-known/nostr.json?name=${s}`, {
        signal: i.signal
      });
      return clearTimeout(o), a.ok ? ((t = (await a.json()).names) == null ? void 0 : t[s]) === e.pubkey : !1;
    } catch (s) {
      return this.config.debug && console.error("ProfileDiscoveryBuilder: NIP-05 verification failed:", s), !1;
    }
  }
  finalizeResults(e, t) {
    e.sort((r, i) => i.relevanceScore - r.relevanceScore);
    const s = this.criteria.limit ? e.slice(0, this.criteria.limit) : e;
    this.config.debug && console.log(`ProfileDiscoveryBuilder: Discovery complete - found ${s.length} matches`), t(s);
  }
}
class _t {
  constructor(e, t) {
    l(this, "config");
    l(this, "targetPubkey");
    l(this, "relayUrl");
    l(this, "petnameValue");
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
      const r = {
        pubkey: this.targetPubkey,
        relayUrl: this.relayUrl,
        petname: this.petnameValue
      }, a = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: [...t, r].map((f) => {
          const y = ["p", f.pubkey];
          return f.relayUrl && y.push(f.relayUrl), f.petname && y.push(f.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, c = A.addEventId(a), h = await this.config.signingProvider.signEvent(a), d = {
        ...c,
        sig: h
      }, g = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (f) => {
          try {
            return await this.config.relayManager.sendToRelay(f, ["EVENT", d]), { success: !0, relay: f };
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
        const i = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowBuilder: Using cached follow list with", i.length, "follows"), i;
      }
      this.config.debug && console.log("FollowBuilder: No cached follow list, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = t.current;
      if (r && r.length > 0) {
        const i = this.parseFollowListEvent(r[0]);
        return this.config.debug && console.log("FollowBuilder: Found follow list from relay with", i.length, "follows"), i;
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
          const r = {
            pubkey: s[1]
          };
          s[2] && (r.relayUrl = s[2]), s[3] && (r.petname = s[3]), t.push(r);
        }
      return t;
    } catch (s) {
      return this.config.debug && console.error("FollowBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class At {
  constructor(e) {
    l(this, "config");
    l(this, "toAdd", []);
    l(this, "toRemove", []);
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
      const i = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.map((g) => {
          const p = ["p", g.pubkey];
          return g.relayUrl && p.push(g.relayUrl), g.petname && p.push(g.petname), p;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, o = A.addEventId(i), a = await this.config.signingProvider.signEvent(i), c = {
        ...o,
        sig: a
      }, d = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (g) => {
          try {
            return await this.config.relayManager.sendToRelay(g, ["EVENT", c]), { success: !0, relay: g };
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
      return d.length > 0 ? (this.config.debug && (console.log(`FollowBatchBuilder: Published batch update to ${d.length} relays`), console.log(`FollowBatchBuilder: Final follow list has ${s.length} follows`), console.log("FollowBatchBuilder: Event will be received via subscription and cached properly")), {
        success: !0,
        eventId: c.id
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
      const e = await this.config.signingProvider.getPublicKey(), t = this.config.nostr.query().kinds([3]).authors([e]).limit(1).execute(), s = t.current;
      if (this.config.debug && (console.log("FollowBatchBuilder: Cache query returned", s.length, "events"), s.length > 0)) {
        const i = s[0];
        console.log("FollowBatchBuilder: Latest cached event:", {
          id: i == null ? void 0 : i.id,
          created_at: i == null ? void 0 : i.created_at,
          tags: i == null ? void 0 : i.tags.filter((o) => o[0] === "p")
        });
      }
      if (s.length > 0) {
        const i = s[0];
        if (i && this.config.debug && console.log("FollowBatchBuilder: Using cached follow list with", i.tags.filter((o) => o[0] === "p").length, "follows"), i)
          return this.parseFollowListEvent(i);
      }
      this.config.debug && console.log("FollowBatchBuilder: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = t.current;
      if (r && r.length > 0) {
        const i = this.parseFollowListEvent(r[0]);
        return this.config.debug && console.log("FollowBatchBuilder: Found follow list from relay with", i.length, "follows"), i;
      }
      return this.config.debug && console.log("FollowBatchBuilder: No follow list found on relays, using empty array"), [];
    } catch (e) {
      return this.config.debug && console.error("FollowBatchBuilder: Error getting current follows:", e), [];
    }
  }
  parseFollowListEvent(e) {
    const t = [];
    try {
      for (const s of e.tags)
        if (s[0] === "p" && s[1]) {
          const r = {
            pubkey: s[1]
          };
          s[2] && (r.relayUrl = s[2]), s[3] && (r.petname = s[3]), t.push(r);
        }
      return t;
    } catch (s) {
      return this.config.debug && console.error("FollowBatchBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class Ns {
  // Frontend expects this
  constructor(e) {
    l(this, "baseStore");
    l(this, "count");
    l(this, "follows");
    this.baseStore = e, this.count = new Pt(e), this.follows = e;
  }
  // Delegate to base store (for direct usage)
  subscribe(e, t) {
    return this.baseStore.subscribe(e, t);
  }
  get current() {
    return this.baseStore.current;
  }
}
class Pt {
  constructor(e) {
    l(this, "sourceStore");
    l(this, "_count", 0);
    l(this, "subscribers", /* @__PURE__ */ new Set());
    var t;
    this.sourceStore = e, this._count = ((t = e.current) == null ? void 0 : t.length) || 0, e.subscribe((s) => {
      const r = (s == null ? void 0 : s.length) || 0;
      r !== this._count && (this._count = r, this.notifySubscribers());
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
class Mt {
  constructor(e) {
    l(this, "config");
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
    return new Ns(t);
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
      const r = /* @__PURE__ */ new Set();
      return s.forEach((i) => {
        i.kind === 3 && i.tags.some(
          (a) => a[0] === "p" && a[1] === e
        ) && r.add(i.pubkey);
      }), Array.from(r);
    });
    return new Pt(t);
  }
  /**
   * Phase 4: Add a user to follow list
   * Returns FollowBuilder for fluent API configuration
   */
  add(e) {
    if (!this.config.signingProvider)
      throw new Error("Cannot add follow: No signing provider available. Initialize signing first.");
    return new _t({
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
      }, c = A.addEventId(a), h = await this.config.signingProvider.signEvent(a), d = {
        ...c,
        sig: h
      }, g = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (f) => {
          try {
            return await this.config.relayManager.sendToRelay(f, ["EVENT", d]), { success: !0, relay: f };
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
    return new At({
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
        const i = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowsModule: Using cached follow list with", i.length, "follows"), i;
      }
      this.config.debug && console.log("FollowsModule: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([e]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = t.current;
      if (r && r.length > 0) {
        const i = this.parseFollowListEvent(r[0]);
        return this.config.debug && console.log("FollowsModule: Found follow list from relay with", i.length, "follows"), i;
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
          const r = {
            pubkey: s[1]
          };
          s[2] && (r.relayUrl = s[2]), s[3] && (r.petname = s[3]), t.push(r);
        }
      return t;
    } catch (s) {
      return this.config.debug && console.error("FollowsModule: Failed to parse follow list event:", s), [];
    }
  }
}
class kt {
  constructor(e) {
    l(this, "config");
    l(this, "_follows");
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
      const r = JSON.parse(s.content);
      return {
        pubkey: s.pubkey,
        metadata: r,
        lastUpdated: s.created_at,
        eventId: s.id,
        isOwn: !1
        // Will be determined by caller if needed
      };
    } catch (r) {
      return this.config.debug && console.warn(`Failed to parse profile event for ${t}:`, r), null;
    }
  }
  /**
   * Phase 2: Profile Creation & Updates - Fluent Builder API
   * Creates a ProfileBuilder for updating profiles with field preservation
   */
  edit() {
    if (!this.config.signingProvider)
      throw new Error("Cannot edit profile: No signing provider available. Initialize signing first.");
    return new vt({
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
    return this._follows || (this._follows = new Mt({
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
    return new St({
      debug: this.config.debug,
      nostr: this.config.nostr
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
    this._follows && await this._follows.close();
  }
}
class tr {
  constructor(e = {}) {
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
    // Profile API (Enhanced)
    l(this, "_profile");
    console.log("🔥 NostrUnchained v0.1.0-FIX (build:", (/* @__PURE__ */ new Date()).toISOString().substring(0, 19) + "Z)"), this.config = {
      relays: e.relays ?? Jt,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? se.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? se.RETRY_DELAY,
      timeout: e.timeout ?? se.PUBLISH_TIMEOUT,
      signingProvider: e.signingProvider
    }, this.relayManager = new es(this.config.relays, {
      debug: this.config.debug
    }), this.subscriptionManager = new Ps(this.relayManager), this.events = new ss(this), e.signingProvider ? (this.signingProvider = e.signingProvider, this.signingMethod = e.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary", this.cache = new Ie("", {}), this._initializeCache().catch((t) => {
      this.config.debug && console.log("⚠️ Cache initialization with private key failed:", t);
    }), this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!")) : (this.cache = new Ie("", {}), this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later")), this.dm = new wt({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    }), this.social = new _s({
      nostr: this,
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
        this.cache = new Ie(e, {});
        const t = await this.signingProvider.getPublicKey();
        this.universalDM = new Ss(this, t), this.config.debug && console.log("🎯 Universal Cache and Universal DM Module initialized");
      } catch {
        this.cache = new Ie("", {}), this.config.debug && console.log("⚠️ Could not get private key for cache, using empty key (no gift wrap decryption)");
      }
  }
  /**
   * Get enhanced profile module (PERFECT DX - always works!)
   */
  get profile() {
    return this._profile || (this._profile = new kt({
      relayManager: this.relayManager,
      subscriptionManager: this.subscriptionManager,
      signingProvider: this.signingProvider,
      eventBuilder: new A(),
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
      const { provider: t, method: s } = await ts.createBestAvailable();
      this.signingProvider = t, this.signingMethod = s;
    }
    this.cachedMyPubkey = null, await this._initializeCache(), await this.dm.updateSigningProvider(this.signingProvider), await this.social.updateSigningProvider(this.signingProvider), this._profile && await this._profile.updateSigningProvider(this.signingProvider), this.config.debug && console.log(`Initialized signing with method: ${this.signingMethod}`);
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
      throw N.handleConnectionError("relays", e);
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
      const e = await this.signingProvider.getPublicKey(), s = (await this.subscriptionManager.getOrCreateSubscription([{
        kinds: [1059],
        // Gift wrap events
        "#p": [e],
        limit: 100
        // Get recent messages
      }], this.config.relays)).addListener({
        onEvent: async (r) => {
          this.config.debug && console.log(`🎁 Received gift wrap event: ${r.id.substring(0, 8)}...`);
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
   * Publish event to specific relays
   */
  async publishToRelays(e, t) {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const s = A.validateEvent(e);
    if (!s.valid)
      throw new Error(`Invalid event: ${s.errors.join(", ")}`);
    const r = A.calculateEventId(e), i = {
      ...e,
      id: r,
      sig: await this.signingProvider.signEvent({ ...e, id: r })
    }, o = await this.relayManager.publishToRelays(i, t), a = o.some((c) => c.success);
    return {
      success: a,
      eventId: a ? i.id : void 0,
      event: a ? i : void 0,
      relayResults: o,
      timestamp: Date.now(),
      error: a ? void 0 : {
        message: "Failed to publish to any relay",
        code: "PUBLISH_FAILED",
        retryable: !0
      }
    };
  }
  /**
   * Publish an event
   */
  async publish(e) {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const t = A.validateEvent(e);
    if (!t.valid)
      throw new Error(`Invalid event: ${t.errors.join(", ")}`);
    const s = A.calculateEventId(e), r = {
      ...e,
      id: s,
      sig: await this.signingProvider.signEvent({ ...e, id: s })
    }, i = await this.relayManager.publishToAll(r), o = i.some((a) => a.success);
    return {
      success: o,
      eventId: o ? r.id : void 0,
      event: o ? r : void 0,
      relayResults: i,
      timestamp: Date.now(),
      error: o ? void 0 : {
        message: "Failed to publish to any relay",
        code: "PUBLISH_FAILED",
        retryable: !0
      }
    };
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
    return new ks(this.cache);
  }
  /**
   * Create a subscription builder
   */
  sub() {
    return new Ts(this.cache, this.subscriptionManager);
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
const sr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: yt,
  DMModule: wt,
  DMRoom: bt,
  EphemeralKeyManager: Pe,
  GiftWrapCreator: Me,
  GiftWrapProtocol: ie,
  NIP44Crypto: _,
  SealCreator: pe,
  TimestampRandomizer: Ke
}, Symbol.toStringTag, { value: "Module" })), rr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FollowBatchBuilder: At,
  FollowBuilder: _t,
  FollowsModule: Mt,
  ProfileBatchBuilder: St,
  ProfileBuilder: vt,
  ProfileDiscoveryBuilder: It,
  ProfileModule: kt
}, Symbol.toStringTag, { value: "Module" }));
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function Tt(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function Nt(n, e) {
  return Array.isArray(e) ? e.length === 0 ? !0 : n ? e.every((t) => typeof t == "string") : e.every((t) => Number.isSafeInteger(t)) : !1;
}
function Rs(n) {
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
function Ve(n) {
  if (!Array.isArray(n))
    throw new Error("array expected");
}
function Ct(n, e) {
  if (!Nt(!0, e))
    throw new Error(`${n}: array of strings expected`);
}
function Dt(n, e) {
  if (!Nt(!1, e))
    throw new Error(`${n}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function Cs(...n) {
  const e = (i) => i, t = (i, o) => (a) => i(o(a)), s = n.map((i) => i.encode).reduceRight(t, e), r = n.map((i) => i.decode).reduce(t, e);
  return { encode: s, decode: r };
}
// @__NO_SIDE_EFFECTS__
function Ds(n) {
  const e = typeof n == "string" ? n.split("") : n, t = e.length;
  Ct("alphabet", e);
  const s = new Map(e.map((r, i) => [r, i]));
  return {
    encode: (r) => (Ve(r), r.map((i) => {
      if (!Number.isSafeInteger(i) || i < 0 || i >= t)
        throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${n}`);
      return e[i];
    })),
    decode: (r) => (Ve(r), r.map((i) => {
      Ee("alphabet.decode", i);
      const o = s.get(i);
      if (o === void 0)
        throw new Error(`Unknown letter: "${i}". Allowed: ${n}`);
      return o;
    }))
  };
}
// @__NO_SIDE_EFFECTS__
function xs(n = "") {
  return Ee("join", n), {
    encode: (e) => (Ct("join.decode", e), e.join(n)),
    decode: (e) => (Ee("join.decode", e), e.split(n))
  };
}
const xt = (n, e) => e === 0 ? n : xt(e, n % e), Ne = /* @__NO_SIDE_EFFECTS__ */ (n, e) => n + (e - xt(n, e)), ke = /* @__PURE__ */ (() => {
  let n = [];
  for (let e = 0; e < 40; e++)
    n.push(2 ** e);
  return n;
})();
function We(n, e, t, s) {
  if (Ve(n), e <= 0 || e > 32)
    throw new Error(`convertRadix2: wrong from=${e}`);
  if (t <= 0 || t > 32)
    throw new Error(`convertRadix2: wrong to=${t}`);
  if (/* @__PURE__ */ Ne(e, t) > 32)
    throw new Error(`convertRadix2: carry overflow from=${e} to=${t} carryBits=${/* @__PURE__ */ Ne(e, t)}`);
  let r = 0, i = 0;
  const o = ke[e], a = ke[t] - 1, c = [];
  for (const h of n) {
    if (Rt(h), h >= o)
      throw new Error(`convertRadix2: invalid data word=${h} from=${e}`);
    if (r = r << e | h, i + e > 32)
      throw new Error(`convertRadix2: carry overflow pos=${i} from=${e}`);
    for (i += e; i >= t; i -= t)
      c.push((r >> i - t & a) >>> 0);
    const d = ke[i];
    if (d === void 0)
      throw new Error("invalid carry");
    r &= d - 1;
  }
  if (r = r << t - i & a, !s && i >= e)
    throw new Error("Excess padding");
  if (!s && r > 0)
    throw new Error(`Non-zero padding: ${r}`);
  return s && i > 0 && c.push(r >>> 0), c;
}
// @__NO_SIDE_EFFECTS__
function Ls(n, e = !1) {
  if (Rt(n), n <= 0 || n > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ Ne(8, n) > 32 || /* @__PURE__ */ Ne(n, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (t) => {
      if (!Tt(t))
        throw new Error("radix2.encode input should be Uint8Array");
      return We(Array.from(t), 8, n, !e);
    },
    decode: (t) => (Dt("radix2.decode", t), Uint8Array.from(We(t, n, 8, e)))
  };
}
function at(n) {
  return Rs(n), function(...e) {
    try {
      return n.apply(null, e);
    } catch {
    }
  };
}
const ze = /* @__PURE__ */ Cs(/* @__PURE__ */ Ds("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ xs("")), ct = [996825010, 642813549, 513874426, 1027748829, 705979059];
function fe(n) {
  const e = n >> 25;
  let t = (n & 33554431) << 5;
  for (let s = 0; s < ct.length; s++)
    (e >> s & 1) === 1 && (t ^= ct[s]);
  return t;
}
function lt(n, e, t = 1) {
  const s = n.length;
  let r = 1;
  for (let i = 0; i < s; i++) {
    const o = n.charCodeAt(i);
    if (o < 33 || o > 126)
      throw new Error(`Invalid prefix (${n})`);
    r = fe(r) ^ o >> 5;
  }
  r = fe(r);
  for (let i = 0; i < s; i++)
    r = fe(r) ^ n.charCodeAt(i) & 31;
  for (let i of e)
    r = fe(r) ^ i;
  for (let i = 0; i < 6; i++)
    r = fe(r);
  return r ^= t, ze.encode(We([r % ke[30]], 30, 5, !1));
}
// @__NO_SIDE_EFFECTS__
function Fs(n) {
  const e = n === "bech32" ? 1 : 734539939, t = /* @__PURE__ */ Ls(5), s = t.decode, r = t.encode, i = at(s);
  function o(u, g, p = 90) {
    Ee("bech32.encode prefix", u), Tt(g) && (g = Array.from(g)), Dt("bech32.encode", g);
    const f = u.length;
    if (f === 0)
      throw new TypeError(`Invalid prefix length ${f}`);
    const y = f + 7 + g.length;
    if (p !== !1 && y > p)
      throw new TypeError(`Length ${y} exceeds limit ${p}`);
    const S = u.toLowerCase(), m = lt(S, g, e);
    return `${S}1${ze.encode(g)}${m}`;
  }
  function a(u, g = 90) {
    Ee("bech32.decode input", u);
    const p = u.length;
    if (p < 8 || g !== !1 && p > g)
      throw new TypeError(`invalid string length: ${p} (${u}). Expected (8..${g})`);
    const f = u.toLowerCase();
    if (u !== f && u !== u.toUpperCase())
      throw new Error("String must be lowercase or uppercase");
    const y = f.lastIndexOf("1");
    if (y === 0 || y === -1)
      throw new Error('Letter "1" must be present between prefix and data only');
    const S = f.slice(0, y), m = f.slice(y + 1);
    if (m.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const v = ze.decode(m).slice(0, -6), P = lt(S, v, e);
    if (!m.endsWith(P))
      throw new Error(`Invalid checksum in ${u}: expected "${P}"`);
    return { prefix: S, words: v };
  }
  const c = at(a);
  function h(u) {
    const { prefix: g, words: p } = a(u, !1);
    return { prefix: g, words: p, bytes: s(p) };
  }
  function d(u, g) {
    return o(u, r(g));
  }
  return {
    encode: o,
    decode: a,
    encodeFromBytes: d,
    decodeToBytes: h,
    decodeUnsafe: c,
    fromWords: s,
    fromWordsUnsafe: i,
    toWords: r
  };
}
const Re = /* @__PURE__ */ Fs("bech32"), Lt = 5e3, Ce = new TextEncoder(), _e = new TextDecoder();
function Os(n) {
  const e = new Uint8Array(4);
  return e[0] = n >> 24 & 255, e[1] = n >> 16 & 255, e[2] = n >> 8 & 255, e[3] = n & 255, e;
}
function $e(n) {
  const e = {};
  let t = n;
  for (; t.length > 0 && !(t.length < 2); ) {
    const s = t[0], r = t[1];
    if (t.length < 2 + r) break;
    const i = t.slice(2, 2 + r);
    t = t.slice(2 + r), e[s] = e[s] || [], e[s].push(i);
  }
  return e;
}
function Ye(n) {
  const e = [];
  return Object.entries(n).reverse().forEach(([t, s]) => {
    s.forEach((r) => {
      const i = new Uint8Array(r.length + 2);
      i.set([parseInt(t)], 0), i.set([r.length], 1), i.set(r, 2), e.push(i);
    });
  }), Wt(...e);
}
function De(n, e) {
  const t = Re.toWords(e);
  return Re.encode(n, t, Lt);
}
function qe(n, e) {
  return De(n, e);
}
function Xe(n) {
  var r, i, o, a, c, h, d;
  const { prefix: e, words: t } = Re.decode(n, Lt), s = new Uint8Array(Re.fromWords(t));
  switch (e) {
    case "nprofile": {
      const u = $e(s);
      if (!((r = u[0]) != null && r[0])) throw new Error("missing TLV 0 for nprofile");
      if (u[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      return {
        type: "nprofile",
        data: {
          pubkey: Y(u[0][0]),
          relays: u[1] ? u[1].map((g) => _e.decode(g)) : []
        }
      };
    }
    case "nevent": {
      const u = $e(s);
      if (!((i = u[0]) != null && i[0])) throw new Error("missing TLV 0 for nevent");
      if (u[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      if (u[2] && u[2][0] && u[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (u[3] && u[3][0] && u[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "nevent",
        data: {
          id: Y(u[0][0]),
          relays: u[1] ? u[1].map((g) => _e.decode(g)) : [],
          author: (o = u[2]) != null && o[0] ? Y(u[2][0]) : void 0,
          kind: (a = u[3]) != null && a[0] ? parseInt(Y(u[3][0]), 16) : void 0
        }
      };
    }
    case "naddr": {
      const u = $e(s);
      if (!((c = u[0]) != null && c[0])) throw new Error("missing TLV 0 for naddr");
      if (!((h = u[2]) != null && h[0])) throw new Error("missing TLV 2 for naddr");
      if (u[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (!((d = u[3]) != null && d[0])) throw new Error("missing TLV 3 for naddr");
      if (u[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "naddr",
        data: {
          identifier: _e.decode(u[0][0]),
          pubkey: Y(u[2][0]),
          kind: parseInt(Y(u[3][0]), 16),
          relays: u[1] ? u[1].map((g) => _e.decode(g)) : []
        }
      };
    }
    case "nsec":
      return { type: e, data: s };
    case "npub":
    case "note":
      return { type: e, data: Y(s) };
    default:
      throw new Error(`Unknown prefix ${e}`);
  }
}
function $s(n) {
  return qe("nsec", n);
}
function Us(n) {
  return qe("npub", ae(n));
}
function Bs(n) {
  return qe("note", ae(n));
}
function Ks(n) {
  const e = Ye({
    0: [ae(n.pubkey)],
    1: (n.relays || []).map((t) => Ce.encode(t))
  });
  return De("nprofile", e);
}
function Vs(n) {
  let e;
  n.kind !== void 0 && (e = Os(n.kind));
  const t = Ye({
    0: [ae(n.id)],
    1: (n.relays || []).map((s) => Ce.encode(s)),
    2: n.author ? [ae(n.author)] : [],
    3: e ? [new Uint8Array(e)] : []
  });
  return De("nevent", t);
}
function Ws(n) {
  const e = new ArrayBuffer(4);
  new DataView(e).setUint32(0, n.kind, !1);
  const t = Ye({
    0: [Ce.encode(n.identifier)],
    1: (n.relays || []).map((s) => Ce.encode(s)),
    2: [ae(n.pubkey)],
    3: [new Uint8Array(e)]
  });
  return De("naddr", t);
}
function ir(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Us(e);
}
function nr(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex privkey: must be 64 hex characters");
  return $s(ae(e));
}
function or(n) {
  const e = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  return Bs(e);
}
function zs(n) {
  if (!n.startsWith("npub1"))
    throw new Error('Invalid npub: must start with "npub1"');
  const e = Xe(n);
  if (e.type !== "npub")
    throw new Error('Invalid npub: decoded type is not "npub"');
  return e.data;
}
function Gs(n) {
  if (!n.startsWith("nsec1"))
    throw new Error('Invalid nsec: must start with "nsec1"');
  const e = Xe(n);
  if (e.type !== "nsec")
    throw new Error('Invalid nsec: decoded type is not "nsec"');
  return Y(e.data);
}
function Hs(n) {
  if (!n.startsWith("note1"))
    throw new Error('Invalid note: must start with "note1"');
  const e = Xe(n);
  if (e.type !== "note")
    throw new Error('Invalid note: decoded type is not "note"');
  return e.data;
}
function ar(n, e) {
  const t = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Ks({ pubkey: t, relays: e });
}
function cr(n, e, t, s) {
  const r = n.startsWith("0x") ? n.slice(2) : n;
  if (!/^[0-9a-fA-F]{64}$/.test(r))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  let i;
  if (t && (i = t.startsWith("0x") ? t.slice(2) : t, !/^[0-9a-fA-F]{64}$/.test(i)))
    throw new Error("Invalid hex author pubkey: must be 64 hex characters");
  return Vs({
    id: r,
    relays: e,
    author: i,
    kind: s
  });
}
function lr(n, e, t, s) {
  const r = e.startsWith("0x") ? e.slice(2) : e;
  if (!/^[0-9a-fA-F]{64}$/.test(r))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Ws({
    identifier: n,
    pubkey: r,
    kind: t,
    relays: s
  });
}
function ur(n) {
  if (!n || typeof n != "string")
    return !1;
  const e = n.startsWith("0x") ? n.slice(2) : n;
  return /^[0-9a-fA-F]{64}$/.test(e);
}
function hr(n) {
  if (!n || typeof n != "string" || !n.startsWith("npub1"))
    return !1;
  try {
    return zs(n), !0;
  } catch {
    return !1;
  }
}
function dr(n) {
  if (!n || typeof n != "string" || !n.startsWith("nsec1"))
    return !1;
  try {
    return Gs(n), !0;
  } catch {
    return !1;
  }
}
function gr(n) {
  if (!n || typeof n != "string" || !n.startsWith("note1"))
    return !1;
  try {
    return Hs(n), !0;
  } catch {
    return !1;
  }
}
const fr = "0.1.0";
export {
  Jt as DEFAULT_RELAYS,
  sr as DM,
  Qe as EVENT_KINDS,
  N as ErrorHandler,
  A as EventBuilder,
  ss as EventsModule,
  et as ExtensionSigner,
  je as FeedStoreImpl,
  Le as FluentEventBuilder,
  He as LocalKeySigner,
  tr as NostrUnchained,
  rr as Profile,
  ks as QueryBuilder,
  qs as QuickSigner,
  es as RelayManager,
  ts as SigningProviderFactory,
  Ts as SubBuilder,
  Ps as SubscriptionManager,
  Xs as TemporarySigner,
  fr as VERSION,
  Js as createFeed,
  er as createFeedFromFilter,
  Qs as createFeedFromQuery,
  lr as createNaddr,
  cr as createNevent,
  ar as createNprofile,
  Xe as decode,
  I as derived,
  or as hexToNote,
  ir as hexToNpub,
  nr as hexToNsec,
  ur as isValidHexKey,
  gr as isValidNote,
  hr as isValidNpub,
  dr as isValidNsec,
  Ws as naddrEncode,
  Vs as neventEncode,
  Bs as noteEncode,
  Hs as noteToHex,
  Ks as nprofileEncode,
  Us as npubEncode,
  zs as npubToHex,
  $s as nsecEncode,
  Gs as nsecToHex,
  Zs as setDefaultSubscriptionManager,
  te as writable
};
