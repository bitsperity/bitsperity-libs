var Xe = Object.defineProperty;
var Ze = (i, e, t) => e in i ? Xe(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var d = (i, e, t) => Ze(i, typeof e != "symbol" ? e + "" : e, t);
import * as ne from "@noble/secp256k1";
import { getSharedSecret as qe } from "@noble/secp256k1";
const ae = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function je(i) {
  return i instanceof Uint8Array || ArrayBuffer.isView(i) && i.constructor.name === "Uint8Array";
}
function Ne(i) {
  if (!Number.isSafeInteger(i) || i < 0)
    throw new Error("positive integer expected, got " + i);
}
function fe(i, ...e) {
  if (!je(i))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(i.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + i.length);
}
function De(i) {
  if (typeof i != "function" || typeof i.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Ne(i.outputLen), Ne(i.blockLen);
}
function Ie(i, e = !0) {
  if (i.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && i.finished)
    throw new Error("Hash#digest() has already been called");
}
function Je(i, e) {
  fe(i);
  const t = e.outputLen;
  if (i.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function le(...i) {
  for (let e = 0; e < i.length; e++)
    i[e].fill(0);
}
function _e(i) {
  return new DataView(i.buffer, i.byteOffset, i.byteLength);
}
function Z(i, e) {
  return i << 32 - e | i >>> e;
}
const Qe = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", et = /* @__PURE__ */ Array.from({ length: 256 }, (i, e) => e.toString(16).padStart(2, "0"));
function pe(i) {
  if (fe(i), Qe)
    return i.toHex();
  let e = "";
  for (let t = 0; t < i.length; t++)
    e += et[i[t]];
  return e;
}
function tt(i) {
  if (typeof i != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(i));
}
function ue(i) {
  return typeof i == "string" && (i = tt(i)), fe(i), i;
}
class Ge {
}
function st(i) {
  const e = (s) => i().update(ue(s)).digest(), t = i();
  return e.outputLen = t.outputLen, e.blockLen = t.blockLen, e.create = () => i(), e;
}
function oe(i = 32) {
  if (ae && typeof ae.getRandomValues == "function")
    return ae.getRandomValues(new Uint8Array(i));
  if (ae && typeof ae.randomBytes == "function")
    return Uint8Array.from(ae.randomBytes(i));
  throw new Error("crypto.getRandomValues must be defined");
}
function nt(i, e, t, s) {
  if (typeof i.setBigUint64 == "function")
    return i.setBigUint64(e, t, s);
  const n = BigInt(32), r = BigInt(4294967295), a = Number(t >> n & r), o = Number(t & r), c = s ? 4 : 0, u = s ? 0 : 4;
  i.setUint32(e + c, a, s), i.setUint32(e + u, o, s);
}
function rt(i, e, t) {
  return i & e ^ ~i & t;
}
function it(i, e, t) {
  return i & e ^ i & t ^ e & t;
}
class at extends Ge {
  constructor(e, t, s, n) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = n, this.buffer = new Uint8Array(e), this.view = _e(this.buffer);
  }
  update(e) {
    Ie(this), e = ue(e), fe(e);
    const { view: t, buffer: s, blockLen: n } = this, r = e.length;
    for (let a = 0; a < r; ) {
      const o = Math.min(n - this.pos, r - a);
      if (o === n) {
        const c = _e(e);
        for (; n <= r - a; a += n)
          this.process(c, a);
        continue;
      }
      s.set(e.subarray(a, a + o), this.pos), this.pos += o, a += o, this.pos === n && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Ie(this), Je(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: n, isLE: r } = this;
    let { pos: a } = this;
    t[a++] = 128, le(this.buffer.subarray(a)), this.padOffset > n - a && (this.process(s, 0), a = 0);
    for (let h = a; h < n; h++)
      t[h] = 0;
    nt(s, n - 8, BigInt(this.length * 8), r), this.process(s, 0);
    const o = _e(e), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const u = c / 4, l = this.get();
    if (u > l.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let h = 0; h < u; h++)
      o.setUint32(4 * h, l[h], r);
  }
  digest() {
    const { buffer: e, outputLen: t } = this;
    this.digestInto(e);
    const s = e.slice(0, t);
    return this.destroy(), s;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: t, buffer: s, length: n, finished: r, destroyed: a, pos: o } = this;
    return e.destroyed = a, e.finished = r, e.length = n, e.pos = o, n % t && e.buffer.set(s), e;
  }
  clone() {
    return this._cloneInto();
  }
}
const j = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), ot = /* @__PURE__ */ Uint32Array.from([
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
]), J = /* @__PURE__ */ new Uint32Array(64);
class ct extends at {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = j[0] | 0, this.B = j[1] | 0, this.C = j[2] | 0, this.D = j[3] | 0, this.E = j[4] | 0, this.F = j[5] | 0, this.G = j[6] | 0, this.H = j[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: n, E: r, F: a, G: o, H: c } = this;
    return [e, t, s, n, r, a, o, c];
  }
  // prettier-ignore
  set(e, t, s, n, r, a, o, c) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = n | 0, this.E = r | 0, this.F = a | 0, this.G = o | 0, this.H = c | 0;
  }
  process(e, t) {
    for (let h = 0; h < 16; h++, t += 4)
      J[h] = e.getUint32(t, !1);
    for (let h = 16; h < 64; h++) {
      const g = J[h - 15], w = J[h - 2], b = Z(g, 7) ^ Z(g, 18) ^ g >>> 3, m = Z(w, 17) ^ Z(w, 19) ^ w >>> 10;
      J[h] = m + J[h - 7] + b + J[h - 16] | 0;
    }
    let { A: s, B: n, C: r, D: a, E: o, F: c, G: u, H: l } = this;
    for (let h = 0; h < 64; h++) {
      const g = Z(o, 6) ^ Z(o, 11) ^ Z(o, 25), w = l + g + rt(o, c, u) + ot[h] + J[h] | 0, m = (Z(s, 2) ^ Z(s, 13) ^ Z(s, 22)) + it(s, n, r) | 0;
      l = u, u = c, c = o, o = a + w | 0, a = r, r = n, n = s, s = w + m | 0;
    }
    s = s + this.A | 0, n = n + this.B | 0, r = r + this.C | 0, a = a + this.D | 0, o = o + this.E | 0, c = c + this.F | 0, u = u + this.G | 0, l = l + this.H | 0, this.set(s, n, r, a, o, c, u, l);
  }
  roundClean() {
    le(J);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), le(this.buffer);
  }
}
const lt = /* @__PURE__ */ st(() => new ct()), se = lt, ut = [
  "ws://umbrel.local:4848",
  // Local testing relay (highest priority)
  "wss://relay.damus.io"
  // Single public relay fallback
], ee = {
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
}, Oe = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  ENCRYPTED_DM: 4,
  DELETE: 5
}, D = {
  EMPTY_CONTENT: "Content cannot be empty",
  CONTENT_TOO_LONG: "Content too long",
  NO_RELAYS: "No relays configured",
  CONNECTION_FAILED: "Failed to connect to relay",
  SIGNING_FAILED: "Failed to sign event",
  PUBLISH_FAILED: "Failed to publish to any relay",
  NO_EXTENSION: "No browser extension available",
  INVALID_EVENT: "Invalid event structure"
}, ce = {
  EMPTY_CONTENT: "Add some content to your message",
  CONTENT_TOO_LONG: `Keep your message under ${ee.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: "Check your internet connection and try again",
  NO_EXTENSION: "Install a Nostr browser extension or the library will use a temporary key",
  PUBLISH_FAILED: "Try again or check if your relays are accessible"
}, be = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class Y {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(e, t) {
    return {
      pubkey: t,
      created_at: Math.floor(Date.now() / 1e3),
      kind: Oe.TEXT_NOTE,
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
    ]), s = new TextEncoder().encode(t), n = se(s);
    return pe(n);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(e) {
    const t = Y.calculateEventId(e);
    return { ...e, id: t };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(e) {
    const t = [];
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !be.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !be.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !be.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && t.push(D.EMPTY_CONTENT), e.content && e.content.length > ee.MAX_CONTENT_LENGTH && t.push(D.CONTENT_TOO_LONG), e.created_at) {
      const s = Math.floor(Date.now() / 1e3), n = s - 3600, r = s + 3600;
      (e.created_at < n || e.created_at > r) && t.push("Timestamp is too far in the past or future");
    }
    return e.tags && (Array.isArray(e.tags) ? e.tags.forEach((s, n) => {
      Array.isArray(s) ? s.forEach((r, a) => {
        typeof r != "string" && t.push(`Tag ${n}[${a}] must be a string`);
      }) : t.push(`Tag ${n} must be an array`);
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
    return e === "" && t.push(D.EMPTY_CONTENT), e.length > ee.MAX_CONTENT_LENGTH && t.push(D.CONTENT_TOO_LONG), {
      valid: t.length === 0,
      errors: t
    };
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(e) {
    return Y.calculateEventId({
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
    const n = Y.validateContent(e);
    if (!n.valid)
      throw new Error(`Invalid content: ${n.errors.join(", ")}`);
    const r = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? Oe.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, a = Y.validateEvent(r);
    if (!a.valid)
      throw new Error(`Invalid event: ${a.errors.join(", ")}`);
    return r;
  }
}
async function ht() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class dt {
  constructor(e, t = {}) {
    d(this, "connections", /* @__PURE__ */ new Map());
    d(this, "debug");
    d(this, "pendingPublishes", /* @__PURE__ */ new Map());
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
    return t.state === "connected" ? !0 : (t.state = "connecting", new Promise(async (s, n) => {
      try {
        const r = await ht(), a = new r(e), o = setTimeout(() => {
          a.close(), t.state = "error", t.error = "Connection timeout", n(new Error(`Connection to ${e} timed out`));
        }, ee.CONNECTION_TIMEOUT);
        a.onopen = () => {
          clearTimeout(o), t.ws = a, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, a.onerror = (c) => {
          clearTimeout(o), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, c), n(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, a.onclose = () => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`);
        }, a.onmessage = (c) => {
          this.handleRelayMessage(e, c.data);
        };
      } catch (r) {
        t.state = "error", t.error = r instanceof Error ? r.message : "Unknown error", n(r);
      }
    }));
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(e) {
    const t = [], s = this.connectedRelays.map(async (n) => {
      const r = Date.now();
      try {
        const a = await this.publishToRelay(n, e), o = Date.now() - r;
        t.push({
          relay: n,
          success: a,
          latency: o
        });
      } catch (a) {
        const o = Date.now() - r;
        t.push({
          relay: n,
          success: !1,
          error: a instanceof Error ? a.message : "Unknown error",
          latency: o
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
    return new Promise((n, r) => {
      const a = s.ws, o = ["EVENT", t], c = setTimeout(() => {
        r(new Error("Publish timeout"));
      }, ee.PUBLISH_TIMEOUT), u = t.id;
      this.pendingPublishes.set(u, { resolve: n, reject: r, timeout: c });
      try {
        const l = JSON.stringify(o);
        a.send(l), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", l), console.log("📤 Added to pending:", u));
      } catch (l) {
        clearTimeout(c), this.pendingPublishes.delete(u), r(l);
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
        const [, n, r, a] = s, o = this.pendingPublishes.get(n);
        this.debug && (console.log(`OK for event ${n}, success: ${r}, pending: ${!!o}`), console.log("Pending publishes:", Array.from(this.pendingPublishes.keys()))), o ? (clearTimeout(o.timeout), this.pendingPublishes.delete(n), r ? o.resolve(!0) : o.reject(new Error(a || "Relay rejected event"))) : this.debug && console.warn(`No pending publish found for event ID: ${n}`);
      } else if (s[0] === "NOTICE") {
        const [, n] = s;
        this.debug && console.log(`Notice from ${e}:`, n);
      }
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
      return be.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
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
      (s) => this.sendToRelay(s, e).catch((n) => {
        this.debug && console.warn(`Failed to send to ${s}:`, n);
      })
    );
    await Promise.allSettled(t);
  }
  /**
   * Send message to specific relays
   */
  async sendToRelays(e, t) {
    const s = e.map(
      (n) => this.sendToRelay(n, t).catch((r) => {
        this.debug && console.warn(`Failed to send to ${n}:`, r);
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
    const n = JSON.stringify(t);
    s.ws.send(n), this.debug && console.log(`📤 Sent to ${e}:`, n);
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
class Ae {
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(D.NO_EXTENSION);
    try {
      return await window.nostr.getPublicKey();
    } catch (e) {
      throw new Error(`Extension signing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  async signEvent(e) {
    if (!window.nostr)
      throw new Error(D.NO_EXTENSION);
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
class ft {
  constructor() {
    d(this, "privateKey");
    d(this, "publicKey");
    const e = oe(32);
    this.privateKey = pe(e), this.publicKey = pe(ne.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = Y.calculateEventId(e), s = await ne.schnorr.sign(t, this.privateKey);
    return pe(s);
  }
}
class gt {
  static async createBestAvailable() {
    if (await Ae.isAvailable())
      try {
        const e = new Ae();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new ft(),
      method: "temporary"
    };
  }
}
class v {
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
    return e === "" ? v.createError("validation", D.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: ce.EMPTY_CONTENT
    }) : e.length > 8192 ? v.createError("validation", D.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: ce.CONTENT_TOO_LONG
    }) : v.createError("validation", D.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(e) {
    const t = e.message.toLowerCase();
    return t.includes("user declined") || t.includes("denied") ? v.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : t.includes("no extension") ? v.createError("signing", D.NO_EXTENSION, {
      retryable: !1,
      suggestion: ce.NO_EXTENSION
    }) : v.createError("signing", D.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(e, t) {
    const s = t.message.toLowerCase();
    return s.includes("timeout") ? v.createError("network", `Connection to ${e} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? v.createError("network", `Failed to connect to ${e}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : v.createError("network", D.CONNECTION_FAILED, {
      retryable: !0,
      suggestion: ce.CONNECTION_FAILED
    });
  }
  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(e) {
    const t = e.length, s = e.filter((r) => r.success), n = e.filter((r) => !r.success);
    if (t === 0)
      return {
        success: !1,
        error: v.createError("config", D.NO_RELAYS, {
          retryable: !1,
          suggestion: "Configure at least one relay URL"
        })
      };
    if (s.length === 0) {
      const r = n.every(
        (o) => {
          var c;
          return (c = o.error) == null ? void 0 : c.toLowerCase().includes("timeout");
        }
      ), a = n.every(
        (o) => {
          var c, u;
          return ((c = o.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((u = o.error) == null ? void 0 : u.toLowerCase().includes("refused"));
        }
      );
      return r ? {
        success: !1,
        error: v.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : a ? {
        success: !1,
        error: v.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: v.createError("relay", D.PUBLISH_FAILED, {
          retryable: !0,
          suggestion: ce.PUBLISH_FAILED
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
      const n = t.relayResults.filter((a) => a.success).length, r = t.relayResults.length;
      n > 0 ? s += ` (${n}/${r} relays succeeded)` : s += ` (0/${r} relays succeeded)`;
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
class yt {
  constructor(e) {
    d(this, "eventData");
    d(this, "nostrInstance");
    // NostrUnchained instance for publishing
    d(this, "signed", !1);
    d(this, "signedEvent");
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
    const n = [e, t, ...s];
    return this.eventData.tags.push(n), this;
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
class pt {
  constructor(e) {
    d(this, "nostrInstance");
    this.nostrInstance = e;
  }
  /**
   * Create a new fluent event builder
   */
  create() {
    return new yt(this.nostrInstance);
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
function Q(i) {
  const e = /* @__PURE__ */ new Set();
  let t = i;
  return {
    subscribe(s) {
      return s(t), e.add(s), () => e.delete(s);
    },
    set(s) {
      t = s, e.forEach((n) => n(t));
    },
    update(s) {
      t = s(t), e.forEach((n) => n(t));
    }
  };
}
function M(i, e) {
  const t = Array.isArray(i) ? i : [i], s = /* @__PURE__ */ new Set();
  let n, r = !1;
  const a = [], o = () => {
    if (t.length === 1) {
      const c = t[0].subscribe((u) => {
        const l = e(u);
        (!r || l !== n) && (n = l, r && s.forEach((h) => h(n)));
      });
      a.length === 0 && a.push(c);
    }
  };
  return {
    subscribe(c) {
      return r || (o(), r = !0), n !== void 0 && c(n), s.add(c), () => {
        s.delete(c), s.size === 0 && (a.forEach((u) => u()), a.length = 0, r = !1);
      };
    }
  };
}
function $e(i) {
  return {
    subscribe: i.subscribe.bind(i),
    derive: (e) => M(i, e)
  };
}
class he {
  constructor(e, t, s) {
    d(this, "_events");
    d(this, "_readIds", /* @__PURE__ */ new Set());
    d(this, "parent");
    this.parent = e, this._events = M(e.events, (n) => {
      let r = n;
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
    return M(this._events, (e) => e.length);
  }
  get latest() {
    return M(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return M(this._events, (e) => e.length === 0);
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
    return $e(M(this._events, e));
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
    return new he(this, e);
  }
  sortBy(e) {
    return new he(this, void 0, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((a) => {
      e = a;
    })();
    const s = e.filter((a) => this._readIds.has(a.id)).length, n = e.length, r = n - s;
    return { read: s, unread: r, total: n };
  }
}
class ke {
  constructor(e, t, s = {}, n = {}) {
    d(this, "_events", Q([]));
    d(this, "_status", Q("connecting"));
    d(this, "_error", Q(null));
    d(this, "_loading", Q(!1));
    d(this, "_count", Q(0));
    d(this, "_readIds", /* @__PURE__ */ new Set());
    d(this, "subscription");
    d(this, "subscriptionManager");
    d(this, "filters");
    d(this, "options");
    d(this, "maxEvents");
    d(this, "isLive");
    d(this, "eventPredicate");
    d(this, "eventComparator");
    this.subscriptionManager = e, this.filters = t, this.options = s, this.maxEvents = n.maxEvents, this.isLive = n.live || !1, this.eventPredicate = n.predicate, this.eventComparator = n.comparator, this.initializeSubscription();
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
    return M(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return M(this._events, () => !0);
  }
  get isEmpty() {
    return M(this._events, (e) => e.length === 0);
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
    return $e(M(this._events, e));
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
    return new he(this, e, this.eventComparator);
  }
  sortBy(e) {
    return new he(this, this.eventPredicate, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((a) => {
      e = a;
    })();
    const s = e.filter((a) => this._readIds.has(a.id)).length, n = e.length, r = n - s;
    return { read: s, unread: r, total: n };
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
      if (t.some((n) => n.id === e.id))
        return t;
      const s = [...t, e];
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((n, r) => r.created_at - n.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
    }), this._count.update((t) => t + 1));
  }
}
class bt {
  constructor(e) {
    d(this, "filter", {});
    d(this, "options", {});
    d(this, "config", {});
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
    return new ke(
      this.subscriptionManager,
      e,
      this.options,
      this.config
    );
  }
}
let re;
function Pt(i) {
  re = i;
}
function Ft() {
  if (!re)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new bt(re);
}
function Kt(i) {
  if (!re)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = i.toFilter();
  return new ke(re, e);
}
function Ut(i) {
  if (!re)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new ke(re, [i]);
}
class We extends Ge {
  constructor(e, t) {
    super(), this.finished = !1, this.destroyed = !1, De(e);
    const s = ue(t);
    if (this.iHash = e.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const n = this.blockLen, r = new Uint8Array(n);
    r.set(s.length > n ? e.create().update(s).digest() : s);
    for (let a = 0; a < r.length; a++)
      r[a] ^= 54;
    this.iHash.update(r), this.oHash = e.create();
    for (let a = 0; a < r.length; a++)
      r[a] ^= 106;
    this.oHash.update(r), le(r);
  }
  update(e) {
    return Ie(this), this.iHash.update(e), this;
  }
  digestInto(e) {
    Ie(this), fe(e, this.outputLen), this.finished = !0, this.iHash.digestInto(e), this.oHash.update(e), this.oHash.digestInto(e), this.destroy();
  }
  digest() {
    const e = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(e), e;
  }
  _cloneInto(e) {
    e || (e = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: t, iHash: s, finished: n, destroyed: r, blockLen: a, outputLen: o } = this;
    return e = e, e.finished = n, e.destroyed = r, e.blockLen = a, e.outputLen = o, e.oHash = t._cloneInto(e.oHash), e.iHash = s._cloneInto(e.iHash), e;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const de = (i, e, t) => new We(i, e).update(t).digest();
de.create = (i, e) => new We(i, e);
function Et(i, e, t) {
  return De(i), t === void 0 && (t = new Uint8Array(i.outputLen)), de(i, ue(t), ue(e));
}
const Te = /* @__PURE__ */ Uint8Array.from([0]), xe = /* @__PURE__ */ Uint8Array.of();
function wt(i, e, t, s = 32) {
  De(i), Ne(s);
  const n = i.outputLen;
  if (s > 255 * n)
    throw new Error("Length should be <= 255*HashLen");
  const r = Math.ceil(s / n);
  t === void 0 && (t = xe);
  const a = new Uint8Array(r * n), o = de.create(i, e), c = o._cloneInto(), u = new Uint8Array(o.outputLen);
  for (let l = 0; l < r; l++)
    Te[0] = l + 1, c.update(l === 0 ? xe : u).update(t).update(Te).digestInto(u), a.set(u, n * l), o._cloneInto(c);
  return o.destroy(), c.destroy(), le(u, Te), a.slice(0, s);
}
const Pe = (i, e, t, s, n) => wt(i, Et(i, e, t), s, n);
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function mt(i) {
  return i instanceof Uint8Array || ArrayBuffer.isView(i) && i.constructor.name === "Uint8Array";
}
function Fe(i) {
  if (typeof i != "boolean")
    throw new Error(`boolean expected, not ${i}`);
}
function Se(i) {
  if (!Number.isSafeInteger(i) || i < 0)
    throw new Error("positive integer expected, got " + i);
}
function ge(i, ...e) {
  if (!mt(i))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(i.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + i.length);
}
function te(i) {
  return new Uint32Array(i.buffer, i.byteOffset, Math.floor(i.byteLength / 4));
}
function vt(...i) {
  for (let e = 0; e < i.length; e++)
    i[e].fill(0);
}
function It(i, e) {
  if (e == null || typeof e != "object")
    throw new Error("options must be defined");
  return Object.assign(i, e);
}
function Ke(i) {
  return Uint8Array.from(i);
}
const He = (i) => Uint8Array.from(i.split("").map((e) => e.charCodeAt(0))), At = He("expand 16-byte k"), _t = He("expand 32-byte k"), Tt = te(At), St = te(_t);
function p(i, e) {
  return i << e | i >>> 32 - e;
}
function Me(i) {
  return i.byteOffset % 4 === 0;
}
const ye = 64, Nt = 16, Be = 2 ** 32 - 1, Ue = new Uint32Array();
function Mt(i, e, t, s, n, r, a, o) {
  const c = n.length, u = new Uint8Array(ye), l = te(u), h = Me(n) && Me(r), g = h ? te(n) : Ue, w = h ? te(r) : Ue;
  for (let b = 0; b < c; a++) {
    if (i(e, t, s, l, a, o), a >= Be)
      throw new Error("arx: counter overflow");
    const m = Math.min(ye, c - b);
    if (h && m === ye) {
      const I = b / 4;
      if (b % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let E = 0, _; E < Nt; E++)
        _ = I + E, w[_] = g[_] ^ l[E];
      b += ye;
      continue;
    }
    for (let I = 0, E; I < m; I++)
      E = b + I, r[E] = n[E] ^ u[I];
    b += m;
  }
}
function Rt(i, e) {
  const { allowShortKeys: t, extendNonceFn: s, counterLength: n, counterRight: r, rounds: a } = It({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
  if (typeof i != "function")
    throw new Error("core must be a function");
  return Se(n), Se(a), Fe(r), Fe(t), (o, c, u, l, h = 0) => {
    ge(o), ge(c), ge(u);
    const g = u.length;
    if (l === void 0 && (l = new Uint8Array(g)), ge(l), Se(h), h < 0 || h >= Be)
      throw new Error("arx: counter overflow");
    if (l.length < g)
      throw new Error(`arx: output (${l.length}) is shorter than data (${g})`);
    const w = [];
    let b = o.length, m, I;
    if (b === 32)
      w.push(m = Ke(o)), I = St;
    else if (b === 16 && t)
      m = new Uint8Array(32), m.set(o), m.set(o, 16), I = Tt, w.push(m);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${b}`);
    Me(c) || w.push(c = Ke(c));
    const E = te(m);
    if (s) {
      if (c.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(I, E, te(c.subarray(0, 16)), E), c = c.subarray(16);
    }
    const _ = 16 - n;
    if (_ !== c.length)
      throw new Error(`arx: nonce must be ${_} or 16 bytes`);
    if (_ !== 12) {
      const q = new Uint8Array(12);
      q.set(c, r ? 0 : 12 - c.length), c = q, w.push(c);
    }
    const k = te(c);
    return Mt(i, I, E, k, u, l, h, a), vt(...w), l;
  };
}
function Dt(i, e, t, s, n, r = 20) {
  let a = i[0], o = i[1], c = i[2], u = i[3], l = e[0], h = e[1], g = e[2], w = e[3], b = e[4], m = e[5], I = e[6], E = e[7], _ = n, k = t[0], q = t[1], ie = t[2], T = a, L = o, C = c, O = u, x = l, P = h, F = g, K = w, U = b, V = m, G = I, $ = E, W = _, H = k, B = q, z = ie;
  for (let Ce = 0; Ce < r; Ce += 2)
    T = T + x | 0, W = p(W ^ T, 16), U = U + W | 0, x = p(x ^ U, 12), T = T + x | 0, W = p(W ^ T, 8), U = U + W | 0, x = p(x ^ U, 7), L = L + P | 0, H = p(H ^ L, 16), V = V + H | 0, P = p(P ^ V, 12), L = L + P | 0, H = p(H ^ L, 8), V = V + H | 0, P = p(P ^ V, 7), C = C + F | 0, B = p(B ^ C, 16), G = G + B | 0, F = p(F ^ G, 12), C = C + F | 0, B = p(B ^ C, 8), G = G + B | 0, F = p(F ^ G, 7), O = O + K | 0, z = p(z ^ O, 16), $ = $ + z | 0, K = p(K ^ $, 12), O = O + K | 0, z = p(z ^ O, 8), $ = $ + z | 0, K = p(K ^ $, 7), T = T + P | 0, z = p(z ^ T, 16), G = G + z | 0, P = p(P ^ G, 12), T = T + P | 0, z = p(z ^ T, 8), G = G + z | 0, P = p(P ^ G, 7), L = L + F | 0, W = p(W ^ L, 16), $ = $ + W | 0, F = p(F ^ $, 12), L = L + F | 0, W = p(W ^ L, 8), $ = $ + W | 0, F = p(F ^ $, 7), C = C + K | 0, H = p(H ^ C, 16), U = U + H | 0, K = p(K ^ U, 12), C = C + K | 0, H = p(H ^ C, 8), U = U + H | 0, K = p(K ^ U, 7), O = O + x | 0, B = p(B ^ O, 16), V = V + B | 0, x = p(x ^ V, 12), O = O + x | 0, B = p(B ^ O, 8), V = V + B | 0, x = p(x ^ V, 7);
  let S = 0;
  s[S++] = a + T | 0, s[S++] = o + L | 0, s[S++] = c + C | 0, s[S++] = u + O | 0, s[S++] = l + x | 0, s[S++] = h + P | 0, s[S++] = g + F | 0, s[S++] = w + K | 0, s[S++] = b + U | 0, s[S++] = m + V | 0, s[S++] = I + G | 0, s[S++] = E + $ | 0, s[S++] = _ + W | 0, s[S++] = k + H | 0, s[S++] = q + B | 0, s[S++] = ie + z | 0;
}
const Ve = /* @__PURE__ */ Rt(Dt, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), kt = {
  saltInfo: "nip44-v2"
};
class N extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP44Error";
  }
}
var R = /* @__PURE__ */ ((i) => (i.INVALID_KEY = "INVALID_KEY", i.INVALID_NONCE = "INVALID_NONCE", i.INVALID_PAYLOAD = "INVALID_PAYLOAD", i.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", i.DECRYPTION_FAILED = "DECRYPTION_FAILED", i.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", i.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", i.PADDING_ERROR = "PADDING_ERROR", i))(R || {});
class A {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(e, t) {
    try {
      const s = e.replace(/^0x/, "");
      let n = t.replace(/^0x/, "");
      if (s.length !== 64)
        throw new N(
          "Invalid private key length",
          R.INVALID_KEY
        );
      if (n.length === 64)
        n = "02" + n;
      else if (n.length !== 66 || !n.startsWith("02") && !n.startsWith("03"))
        throw new N(
          "Invalid public key format",
          R.INVALID_KEY
        );
      const a = qe(s, n, !0).slice(1);
      return Pe(se, a, this.SALT, new Uint8Array(0), 32);
    } catch (s) {
      throw s instanceof N ? s : new N(
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
        throw new N(
          "Invalid conversation key length",
          R.INVALID_KEY
        );
      if (t.length !== this.NONCE_SIZE)
        throw new N(
          "Invalid nonce length",
          R.INVALID_NONCE
        );
      const s = Pe(se, e, new Uint8Array(0), t, 76);
      return {
        chachaKey: s.slice(0, 32),
        // bytes 0-31
        chachaNonce: s.slice(32, 44),
        // bytes 32-43 (12 bytes)
        hmacKey: s.slice(44, 76)
        // bytes 44-75
      };
    } catch (s) {
      throw new N(
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
      throw new N(
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
    const t = e.length, s = this.calculatePaddedLength(t + 2), n = new Uint8Array(s);
    return n[0] = t >>> 8 & 255, n[1] = t & 255, n.set(e, 2), n;
  }
  /**
   * Remove padding from decrypted data
   * Format: [plaintext_length: u16][plaintext][zero_bytes]
   */
  static removePadding(e) {
    if (e.length < 2)
      throw new N(
        "Invalid padded data length",
        R.PADDING_ERROR
      );
    const t = e[0] << 8 | e[1];
    if (t > e.length - 2)
      throw new N(
        "Invalid plaintext length in padding",
        R.PADDING_ERROR
      );
    return e.slice(2, 2 + t);
  }
  /**
   * Generate cryptographically secure random nonce
   */
  static generateNonce() {
    return oe(this.NONCE_SIZE);
  }
  /**
   * Encrypt plaintext using NIP-44 v2
   */
  static encrypt(e, t, s) {
    try {
      if (e == null)
        throw new N(
          "Plaintext cannot be null or undefined",
          R.INVALID_PLAINTEXT_LENGTH
        );
      const n = new TextEncoder().encode(e), r = s || this.generateNonce(), a = this.deriveMessageKeys(t, r), o = this.applyPadding(n), c = Ve(
        a.chachaKey,
        a.chachaNonce,
        o
      ), u = new Uint8Array(r.length + c.length);
      u.set(r, 0), u.set(c, r.length);
      const l = de(se, a.hmacKey, u), h = new Uint8Array(
        this.VERSION_SIZE + r.length + c.length + this.MAC_SIZE
      );
      let g = 0;
      return h[g] = this.VERSION, g += this.VERSION_SIZE, h.set(r, g), g += r.length, h.set(c, g), g += c.length, h.set(l, g), {
        payload: Buffer.from(h).toString("base64"),
        nonce: r
      };
    } catch (n) {
      throw n instanceof N ? n : new N(
        `Encryption failed: ${n.message}`,
        R.ENCRYPTION_FAILED,
        n
      );
    }
  }
  /**
   * Decrypt NIP-44 v2 payload
   */
  static decrypt(e, t) {
    try {
      const s = new Uint8Array(Buffer.from(e, "base64")), n = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (s.length < n)
        throw new N(
          "Payload too short",
          R.INVALID_PAYLOAD
        );
      let r = 0;
      const a = s[r];
      if (r += this.VERSION_SIZE, a !== this.VERSION)
        throw new N(
          `Unsupported version: ${a}`,
          R.INVALID_PAYLOAD
        );
      const o = s.slice(r, r + this.NONCE_SIZE);
      r += this.NONCE_SIZE;
      const c = s.slice(r, -this.MAC_SIZE), u = s.slice(-this.MAC_SIZE), l = this.deriveMessageKeys(t, o), h = new Uint8Array(o.length + c.length);
      h.set(o, 0), h.set(c, o.length);
      const g = de(se, l.hmacKey, h);
      let w = !0;
      for (let E = 0; E < this.MAC_SIZE; E++)
        u[E] !== g[E] && (w = !1);
      if (!w)
        return {
          plaintext: "",
          isValid: !1
        };
      const b = Ve(
        l.chachaKey,
        l.chachaNonce,
        c
      ), m = this.removePadding(b);
      return {
        plaintext: new TextDecoder().decode(m),
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
      const t = Buffer.from(e, "base64"), s = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      return !(t.length < s || t[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
d(A, "VERSION", 2), d(A, "SALT", new TextEncoder().encode(kt.saltInfo)), d(A, "NONCE_SIZE", 32), d(A, "CHACHA_KEY_SIZE", 32), d(A, "CHACHA_NONCE_SIZE", 12), d(A, "HMAC_KEY_SIZE", 32), d(A, "MAC_SIZE", 32), d(A, "VERSION_SIZE", 1);
class f extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP59Error";
  }
}
var y = /* @__PURE__ */ ((i) => (i.INVALID_RUMOR = "INVALID_RUMOR", i.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", i.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", i.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", i.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", i.DECRYPTION_FAILED = "DECRYPTION_FAILED", i.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", i.INVALID_SEAL = "INVALID_SEAL", i.NO_RECIPIENTS = "NO_RECIPIENTS", i.INVALID_RECIPIENT = "INVALID_RECIPIENT", i))(y || {});
const X = {
  SEAL_KIND: 13,
  GIFT_WRAP_KIND: 1059,
  MAX_TIMESTAMP_AGE_SECONDS: 2 * 24 * 60 * 60,
  // 2 days
  MIN_TIMESTAMP_AGE_SECONDS: 0
  // Can be current time
};
class Ee {
  /**
   * Create a kind 13 seal containing the encrypted rumor
   * The seal is signed by the sender's real private key
   */
  static async createSeal(e, t, s) {
    try {
      this.validateRumor(e), this.validatePrivateKey(t), this.validatePublicKey(s);
      const n = JSON.stringify(e), r = A.deriveConversationKey(
        t,
        s
      ), a = A.encrypt(n, r), o = this.getPublicKeyFromPrivate(t), c = {
        pubkey: o,
        created_at: Math.floor(Date.now() / 1e3),
        kind: X.SEAL_KIND,
        tags: [],
        // Always empty for seals
        content: a.payload
      }, u = this.calculateEventId(c), l = await this.signEvent(c, u, t);
      return {
        id: u,
        pubkey: o,
        created_at: c.created_at,
        kind: X.SEAL_KIND,
        tags: [],
        content: a.payload,
        sig: l
      };
    } catch (n) {
      throw n instanceof f ? n : new f(
        `Seal creation failed: ${n.message}`,
        y.SEAL_CREATION_FAILED,
        n
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
      const s = A.deriveConversationKey(
        t,
        e.pubkey
      ), n = A.decrypt(e.content, s);
      if (!n.isValid)
        return { rumor: null, isValid: !1 };
      const r = JSON.parse(n.plaintext);
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
      throw new f(
        "Rumor must be a valid object",
        y.INVALID_RUMOR
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new f(
        "Rumor must have valid pubkey",
        y.INVALID_RUMOR
      );
    if (typeof e.created_at != "number" || e.created_at <= 0)
      throw new f(
        "Rumor must have valid created_at timestamp",
        y.INVALID_RUMOR
      );
    if (typeof e.kind != "number" || e.kind < 0 || e.kind > 65535)
      throw new f(
        "Rumor must have valid kind",
        y.INVALID_RUMOR
      );
    if (!Array.isArray(e.tags))
      throw new f(
        "Rumor must have valid tags array",
        y.INVALID_RUMOR
      );
    if (typeof e.content != "string")
      throw new f(
        "Rumor must have valid content string",
        y.INVALID_RUMOR
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
      throw new f(
        "Invalid private key format",
        y.SEAL_CREATION_FAILED
      );
  }
  /**
   * Validate public key format
   */
  static validatePublicKey(e) {
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new f(
        "Invalid public key format",
        y.SEAL_CREATION_FAILED
      );
  }
  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivate(e) {
    try {
      const t = ne.getPublicKey(e, !1);
      return Buffer.from(t.slice(1, 33)).toString("hex");
    } catch (t) {
      throw new f(
        "Failed to derive public key from private key",
        y.SEAL_CREATION_FAILED,
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
    ]), s = se(new TextEncoder().encode(t));
    return Buffer.from(s).toString("hex");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const n = await ne.schnorr.sign(t, s);
      return Buffer.from(n).toString("hex");
    } catch (n) {
      throw new f(
        "Failed to sign seal event",
        y.SEAL_CREATION_FAILED,
        n
      );
    }
  }
}
class we {
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair() {
    try {
      const e = oe(32), t = Buffer.from(e).toString("hex"), s = ne.getPublicKey(t, !1), n = Buffer.from(s.slice(1, 33)).toString("hex");
      return {
        privateKey: t,
        publicKey: n
      };
    } catch (e) {
      throw new f(
        `Ephemeral key generation failed: ${e.message}`,
        y.EPHEMERAL_KEY_GENERATION_FAILED,
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
      throw new f(
        "Key pair count must be greater than 0",
        y.EPHEMERAL_KEY_GENERATION_FAILED
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
      const t = ne.getPublicKey(e.privateKey, !1), s = Buffer.from(t.slice(1, 33)).toString("hex");
      return e.publicKey.toLowerCase() === s.toLowerCase();
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
      const t = oe(32).reduce((s, n) => s + n.toString(16).padStart(2, "0"), "");
      e.privateKey = t, e.publicKey = t;
    } catch {
    }
  }
  /**
   * Generate a secure random nonce for gift wrap creation
   * This can be used for additional randomness in the encryption process
   */
  static generateGiftWrapNonce() {
    return oe(32);
  }
}
class Re {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(e = X.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      if (e < 0)
        throw new f(
          "Max age seconds cannot be negative",
          y.TIMESTAMP_RANDOMIZATION_FAILED
        );
      const t = Math.floor(Date.now() / 1e3);
      if (e === 0)
        return t;
      const s = this.generateSecureRandomOffset(e);
      return t - s;
    } catch (t) {
      throw t instanceof f ? t : new f(
        `Timestamp randomization failed: ${t.message}`,
        y.TIMESTAMP_RANDOMIZATION_FAILED,
        t
      );
    }
  }
  /**
   * Generate a cryptographically secure random offset within the specified range
   */
  static generateSecureRandomOffset(e) {
    const t = oe(4), s = new DataView(t.buffer).getUint32(0, !1);
    return Math.floor(s / 4294967295 * e);
  }
  /**
   * Generate multiple randomized timestamps for batch gift wrap creation
   * Each timestamp is independently randomized
   */
  static generateMultipleRandomizedTimestamps(e, t = X.MAX_TIMESTAMP_AGE_SECONDS) {
    if (e <= 0)
      throw new f(
        "Timestamp count must be greater than 0",
        y.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let n = 0; n < e; n++)
      s.push(this.generateRandomizedTimestamp(t));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(e, t = X.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      const s = Math.floor(Date.now() / 1e3), n = s - t, r = s + 60;
      return e >= n && e <= r;
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
      throw new f(
        "Window start must be before window end",
        y.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = t - e, n = this.generateSecureRandomOffset(s);
    return e + n;
  }
}
class me {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(e, t, s, n) {
    try {
      this.validateSeal(e), this.validateRecipient(t);
      const r = s || we.generateEphemeralKeyPair();
      if (!we.validateEphemeralKeyPair(r))
        throw new f(
          "Invalid ephemeral key pair",
          y.GIFT_WRAP_CREATION_FAILED
        );
      const a = n || Re.generateRandomizedTimestamp(), o = JSON.stringify(e), c = A.deriveConversationKey(
        r.privateKey,
        t.pubkey
      ), u = A.encrypt(o, c), l = t.relayHint ? ["p", t.pubkey, t.relayHint] : ["p", t.pubkey], h = {
        pubkey: r.publicKey,
        created_at: a,
        kind: X.GIFT_WRAP_KIND,
        tags: [l],
        content: u.payload
      }, g = this.calculateEventId(h), w = await this.signEvent(h, g, r.privateKey);
      return {
        giftWrap: {
          id: g,
          pubkey: r.publicKey,
          created_at: a,
          kind: X.GIFT_WRAP_KIND,
          tags: [l],
          content: u.payload,
          sig: w
        },
        ephemeralKeyPair: r,
        recipient: t.pubkey
      };
    } catch (r) {
      throw r instanceof f ? r : new f(
        `Gift wrap creation failed: ${r.message}`,
        y.GIFT_WRAP_CREATION_FAILED,
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
      throw new f(
        "At least one recipient is required",
        y.NO_RECIPIENTS
      );
    const s = [], n = we.generateMultipleEphemeralKeyPairs(
      t.length
    ), r = Re.generateMultipleRandomizedTimestamps(
      t.length
    );
    for (let a = 0; a < t.length; a++) {
      const o = await this.createGiftWrap(
        e,
        t[a],
        n[a],
        r[a]
      );
      s.push(o);
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
      const s = A.deriveConversationKey(
        t,
        e.pubkey
      ), n = A.decrypt(e.content, s);
      if (!n.isValid)
        return { seal: null, isValid: !1 };
      const r = JSON.parse(n.plaintext);
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
      throw new f(
        "Seal must be a valid object",
        y.INVALID_SEAL
      );
    if (e.kind !== X.SEAL_KIND)
      throw new f(
        "Seal must have kind 13",
        y.INVALID_SEAL
      );
    if (!Array.isArray(e.tags) || e.tags.length !== 0)
      throw new f(
        "Seal must have empty tags array",
        y.INVALID_SEAL
      );
    if (typeof e.content != "string")
      throw new f(
        "Seal must have valid content string",
        y.INVALID_SEAL
      );
  }
  /**
   * Validate recipient configuration
   */
  static validateRecipient(e) {
    if (!e || typeof e != "object")
      throw new f(
        "Recipient must be a valid object",
        y.INVALID_RECIPIENT
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new f(
        "Recipient must have valid pubkey",
        y.INVALID_RECIPIENT
      );
    if (e.relayHint && typeof e.relayHint != "string")
      throw new f(
        "Recipient relay hint must be a string if provided",
        y.INVALID_RECIPIENT
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
    ]), s = se(new TextEncoder().encode(t));
    return Buffer.from(s).toString("hex");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const n = await ne.schnorr.sign(t, s);
      return Buffer.from(n).toString("hex");
    } catch (n) {
      throw new f(
        "Failed to sign gift wrap event",
        y.GIFT_WRAP_CREATION_FAILED,
        n
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
class ve {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(e, t, s) {
    try {
      this.validateCreateDMInputs(e, t, s);
      const n = this.createRumor(e, t), r = [];
      for (const o of s.recipients) {
        const c = await Ee.createSeal(
          n,
          t,
          o.pubkey
        ), u = await me.createGiftWrap(
          c,
          {
            pubkey: o.pubkey,
            relayHint: o.relayHint || s.relayHint
          }
        );
        r.push(u);
      }
      const a = await Ee.createSeal(
        n,
        t,
        s.recipients[0].pubkey
      );
      return {
        rumor: n,
        seal: a,
        giftWraps: r,
        senderPrivateKey: t
      };
    } catch (n) {
      throw n instanceof f ? n : new f(
        `Gift wrap protocol failed: ${n.message}`,
        y.GIFT_WRAP_CREATION_FAILED,
        n
      );
    }
  }
  /**
   * Decrypt a gift-wrapped direct message
   * Returns the original rumor and verification status
   */
  static async decryptGiftWrappedDM(e, t) {
    try {
      const s = me.decryptGiftWrap(
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
      const n = s.seal, r = Ee.decryptSeal(
        n,
        t
      );
      return r.isValid ? {
        rumor: r.rumor,
        seal: n,
        isValid: !0,
        senderPubkey: n.pubkey
      } : {
        rumor: null,
        seal: n,
        isValid: !1,
        senderPubkey: n.pubkey
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
  static createRumor(e, t) {
    return {
      pubkey: this.getPublicKeyFromPrivate(t),
      created_at: Math.floor(Date.now() / 1e3),
      kind: 4,
      // Direct message kind
      tags: [],
      // Usually empty for DMs, can be customized
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
      const n = await this.createGiftWrappedDM(
        s.message,
        s.senderPrivateKey,
        s.config
      );
      t.push(n);
    }
    return t;
  }
  /**
   * Extract all gift wraps that are meant for a specific recipient
   * Useful for filtering gift wraps from a relay
   */
  static filterGiftWrapsForRecipient(e, t) {
    return e.filter((s) => me.getRecipientFromGiftWrap(s) === t);
  }
  /**
   * Decrypt multiple gift wraps for a recipient
   * Returns successful decryptions and filters out invalid ones
   */
  static async decryptMultipleGiftWraps(e, t) {
    const s = [];
    for (const n of e) {
      const r = await this.decryptGiftWrappedDM(n, t);
      r.isValid && s.push(r);
    }
    return s;
  }
  /**
   * Validate inputs for creating gift-wrapped DMs
   */
  static validateCreateDMInputs(e, t, s) {
    if (typeof e != "string")
      throw new f(
        "Message must be a string",
        y.INVALID_RUMOR
      );
    if (typeof t != "string" || !/^[0-9a-f]{64}$/i.test(t))
      throw new f(
        "Invalid sender private key format",
        y.SEAL_CREATION_FAILED
      );
    if (!s || !Array.isArray(s.recipients) || s.recipients.length === 0)
      throw new f(
        "At least one recipient is required",
        y.NO_RECIPIENTS
      );
    for (const n of s.recipients)
      if (!n || typeof n.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(n.pubkey))
        throw new f(
          "Invalid recipient public key format",
          y.INVALID_RECIPIENT
        );
  }
  /**
   * Get public key from private key
   */
  static getPublicKeyFromPrivate(e) {
    try {
      const s = require("@noble/secp256k1").getPublicKey(e, !1);
      return Buffer.from(s.slice(1, 33)).toString("hex");
    } catch (t) {
      throw new f(
        "Failed to derive public key from private key",
        y.SEAL_CREATION_FAILED,
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
    const t = e.length, s = e.reduce((c, u) => c + u.giftWraps.length, 0), n = Math.floor(Date.now() / 1e3), r = e.flatMap(
      (c) => c.giftWraps.map((u) => n - u.giftWrap.created_at)
    ), a = r.length > 0 ? r.reduce((c, u) => c + u, 0) / r.length : 0, o = new Set(
      e.flatMap((c) => c.giftWraps.map((u) => u.recipient))
    );
    return {
      totalMessages: t,
      totalGiftWraps: s,
      averageTimestampAge: a,
      uniqueRecipients: o.size
    };
  }
}
class ze {
  constructor(e) {
    d(this, "_state");
    d(this, "subscription");
    d(this, "config");
    // Reactive store properties
    d(this, "messages");
    d(this, "status");
    d(this, "latest");
    d(this, "unreadCount");
    d(this, "error");
    this.config = e, this._state = Q({
      messages: [],
      status: "connecting",
      latest: null,
      unreadCount: 0,
      isTyping: !1,
      error: null
    }), this.messages = M(this._state, (t) => t.messages), this.status = M(this._state, (t) => t.status), this.latest = M(this._state, (t) => t.latest), this.unreadCount = M(this._state, (t) => t.unreadCount), this.error = M(this._state, (t) => t.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted direct message
   */
  async send(e) {
    var t;
    try {
      this.updateStatus("active");
      const s = this.generateMessageId(), n = Math.floor(Date.now() / 1e3), r = {
        id: s,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp: n,
        isFromMe: !0,
        status: "sending"
      };
      this.addMessage(r);
      const a = ve.createSimpleConfig(
        this.config.recipientPubkey,
        (t = this.config.relayHints) == null ? void 0 : t[0]
      ), o = await ve.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        a
      );
      let c = !1, u;
      for (const l of o.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(l.giftWrap)).some((w) => w.success) && (c = !0, r.eventId = l.giftWrap.id);
        } catch (h) {
          u = h instanceof Error ? h.message : "Publishing failed";
        }
      if (c)
        return this.updateMessageStatus(s, "sent"), this.config.debug && console.log(`DM sent successfully: ${s}`), { success: !0, messageId: s };
      {
        this.updateMessageStatus(s, "failed");
        const l = u || "Failed to publish to any relay";
        return this.setError(l), { success: !1, error: l, messageId: s };
      }
    } catch (s) {
      const n = s instanceof Error ? s.message : "Unknown error sending message";
      return this.setError(n), { success: !1, error: n };
    }
  }
  /**
   * Mark all messages as read
   */
  markAllAsRead() {
    this._state.update((e) => ({
      ...e,
      unreadCount: 0
    }));
  }
  /**
   * Mark specific message as read
   */
  markAsRead(e) {
    this.markAllAsRead();
  }
  /**
   * Clear the conversation history
   */
  clearHistory() {
    this._state.update((e) => ({
      ...e,
      messages: [],
      latest: null,
      unreadCount: 0
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
        onEvent: (n) => this.handleIncomingEvent(n),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`DM conversation subscription active for ${this.config.recipientPubkey}`);
        },
        onClose: (n) => {
          this.updateStatus("disconnected"), n && this.setError(`Subscription closed: ${n}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([t], s), !this.subscription.success) {
        const n = ((e = this.subscription.error) == null ? void 0 : e.message) || "Failed to create subscription";
        this.setError(n), this.updateStatus("error");
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
      const t = await ve.decryptGiftWrappedDM(
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
        status: "received"
      };
      this.getCurrentMessages().some(
        (a) => a.eventId === e.id || a.content === s.content && Math.abs(a.timestamp - s.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(s), this.incrementUnreadCount(), this.config.debug && console.log(`Received DM from ${t.senderPubkey}: ${s.content}`));
    } catch (t) {
      this.config.debug && console.error("Error handling incoming DM event:", t);
    }
  }
  addMessage(e) {
    this._state.update((t) => {
      const s = [...t.messages, e];
      return s.sort((n, r) => n.timestamp - r.timestamp), {
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
        (n) => n.id === e ? { ...n, status: t } : n
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
  incrementUnreadCount() {
    this._state.update((e) => ({
      ...e,
      unreadCount: e.unreadCount + 1
    }));
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
class Ye {
  constructor(e) {
    d(this, "conversations", /* @__PURE__ */ new Map());
    d(this, "config");
    d(this, "_senderPubkey", null);
    d(this, "_senderPrivateKey", null);
    // Reactive stores
    d(this, "_conversationList", Q([]));
    d(this, "_totalUnreadCount", Q(0));
    d(this, "conversations$");
    d(this, "inboxCount");
    this.config = e, this.conversations$ = this._conversationList, this.inboxCount = this._totalUnreadCount, this.config.signingProvider && this.initializeSender();
  }
  /**
   * Get or create a conversation with a specific user
   * This is the main entry point: nostr.dm.with('npub...')
   */
  with(e) {
    const t = this.normalizePubkey(e);
    let s = this.conversations.get(t);
    return s || (s = this.createConversation(t), this.conversations.set(t, s), this.updateConversationList(), this.config.debug && console.log(`Created new DM conversation with ${t}`)), s;
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
   * Get total unread message count across all conversations
   */
  getTotalUnreadCount() {
    let e = 0;
    return this.inboxCount.subscribe((s) => {
      e = s;
    })(), e;
  }
  /**
   * Mark all conversations as read
   */
  markAllAsRead() {
    this.conversations.forEach((e) => {
      e.markAllAsRead();
    }), this.updateUnreadCount();
  }
  /**
   * Close a specific conversation
   */
  async closeConversation(e) {
    const t = this.normalizePubkey(e), s = this.conversations.get(t);
    s && (await s.close(), this.conversations.delete(t), this.updateConversationList(), this.config.debug && console.log(`Closed DM conversation with ${t}`));
  }
  /**
   * Close all conversations and clean up
   */
  async closeAll() {
    const e = Array.from(this.conversations.values()).map((t) => t.close());
    await Promise.all(e), this.conversations.clear(), this.updateConversationList(), this.config.debug && console.log("Closed all DM conversations");
  }
  /**
   * Update the signing provider and initialize sender credentials
   * Called by NostrUnchained when signing provider becomes available
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e, await this.initializeSender();
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
  createConversation(e) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const t = this.getPrivateKeySecurely(), s = {
      recipientPubkey: e,
      senderPrivateKey: t,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      debug: this.config.debug
    }, n = new ze(s);
    return this.setupConversationReactivity(n, e), n;
  }
  setupConversationReactivity(e, t) {
    e.latest.subscribe(() => {
      this.updateConversationList();
    }), e.unreadCount.subscribe(() => {
      this.updateUnreadCount();
    });
  }
  updateConversationList() {
    const e = [];
    this.conversations.forEach((t, s) => {
      let n = null, r = 0, a = "disconnected";
      const o = t.latest.subscribe((l) => {
        n = l;
      }), c = t.unreadCount.subscribe((l) => {
        r = l;
      }), u = t.status.subscribe((l) => {
        a = l;
      });
      o(), c(), u(), e.push({
        pubkey: s,
        latestMessage: n,
        unreadCount: r,
        lastActivity: (n == null ? void 0 : n.timestamp) || 0,
        isActive: a === "active" || a === "connecting"
      });
    }), e.sort((t, s) => s.lastActivity - t.lastActivity), this._conversationList.set(e);
  }
  updateUnreadCount() {
    let e = 0;
    this.conversations.forEach((t) => {
      t.unreadCount.subscribe((n) => {
        e += n;
      })();
    }), this._totalUnreadCount.set(e);
  }
  async handleGlobalInboxEvent(e) {
    this.config.debug && console.log("Global inbox received event:", e.id);
  }
  normalizePubkey(e) {
    if (e.startsWith("npub"))
      throw new Error("npub format not yet supported, please use hex pubkey");
    if (!/^[0-9a-f]{64}$/i.test(e))
      throw new Error("Invalid pubkey format. Expected 64-character hex string");
    return e.toLowerCase();
  }
  getPrivateKeySecurely() {
    if (process.env.NODE_ENV === "test" || this.config.debug)
      return console.warn("WARNING: Using mock private key for testing. Do not use in production!"), "test-private-key-64-char-string-abcdef1234567890abcdef1234567890";
    throw new Error("Private key access not yet implemented. This is required for NIP-44 encryption.");
  }
}
class Lt {
  constructor(e) {
    d(this, "subscriptions", /* @__PURE__ */ new Map());
    d(this, "eventCallbacks", /* @__PURE__ */ new Map());
    d(this, "debug");
    this.relayManager = e, this.debug = e.debug || !1, this.setupRelayMessageHandling();
  }
  /**
   * Create a new subscription with given filters
   * Performance requirement: <100ms subscription creation
   */
  async subscribe(e, t = {}) {
    var s, n, r, a;
    try {
      const o = this.validateFilters(e);
      if (o)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: o
        };
      const c = this.generateSubscriptionId(), u = Date.now(), l = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, h = {
        id: c,
        filters: e,
        relays: l,
        state: "pending",
        createdAt: u,
        eventCount: 0,
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      l.forEach((E) => {
        h.relayStates[E] = "active";
      }), t.timeout && (h.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, t.timeout)), this.subscriptions.set(c, h), this.debug && console.log(`Creating subscription ${c} with ${e.length} filters`);
      const g = t.retryAttempts || 1, w = t.retryDelay || 1e3;
      let b = [], m;
      for (let E = 0; E < g; E++)
        try {
          const _ = ["REQ", c, ...e];
          try {
            await ((n = (s = this.relayManager).sendToAll) == null ? void 0 : n.call(s, _)), b = l.map((k) => ({
              relay: k,
              success: !0,
              error: void 0
            }));
            break;
          } catch (k) {
            b = [];
            let q = !1;
            for (const ie of l)
              try {
                await ((a = (r = this.relayManager).sendToRelays) == null ? void 0 : a.call(r, [ie], _)), b.push({
                  relay: ie,
                  success: !0,
                  error: void 0
                }), q = !0;
              } catch (T) {
                b.push({
                  relay: ie,
                  success: !1,
                  error: T instanceof Error ? T : new Error("Unknown error")
                });
              }
            if (q)
              break;
            m = k instanceof Error ? k : new Error("All relays failed");
          }
        } catch (_) {
          m = _ instanceof Error ? _ : new Error("Unknown error"), b = l.map((k) => ({
            relay: k,
            success: !1,
            error: m
          })), E < g - 1 && await new Promise((k) => setTimeout(k, w));
        }
      const I = b.length > 0 && b.some((E) => E.success);
      return I || (this.subscriptions.delete(c), h.timeoutId && clearTimeout(h.timeoutId)), {
        subscription: I ? this.externalizeSubscription(h) : {},
        success: I,
        relayResults: b,
        error: I ? void 0 : {
          message: m ? m.message : b.length === 0 ? "No relays available" : "All relays failed",
          retryable: !0
        }
      };
    } catch (o) {
      return {
        subscription: {},
        success: !1,
        relayResults: [],
        error: {
          message: o instanceof Error ? o.message : "Unknown error",
          retryable: !0
        }
      };
    }
  }
  /**
   * Activate a pending subscription by sending REQ messages
   */
  async activate(e) {
    var s, n, r, a;
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    t.state = "active";
    try {
      const o = ["REQ", e, ...t.filters], c = this.relayManager.connectedRelays;
      t.relays.length !== c.length || !t.relays.every((l) => c.includes(l)) ? await ((n = (s = this.relayManager).sendToRelays) == null ? void 0 : n.call(s, t.relays, o)) : await ((a = (r = this.relayManager).sendToAll) == null ? void 0 : a.call(r, o));
    } catch (o) {
      throw t.state = "error", o;
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
    var n, r;
    const s = this.subscriptions.get(e);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const a = ["CLOSE", e];
        await ((r = (n = this.relayManager).sendToAll) == null ? void 0 : r.call(n, a));
      } catch (a) {
        this.debug && console.error(`Error sending CLOSE for ${e}:`, a);
      }
      s.onClose && s.onClose(t);
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
    const n = [];
    for (const r of t)
      s.receivedEventIds.has(r.id) || (s.receivedEventIds.add(r.id), n.push(r));
    if (s.eventCount += n.length, s.lastEventAt = Date.now(), s.onEvent && n.length > 0)
      for (const r of n)
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
    const [s, n, ...r] = t;
    switch (s) {
      case "EVENT":
        const a = r[0];
        await this.handleRelayEvent(e, n, a);
        break;
      case "EOSE":
        await this.markEose(n, e);
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
    const s = [], n = ["REQ", e.id, ...e.filters];
    if (this.relayManager.sendToRelays)
      for (const r of e.relays)
        try {
          await this.relayManager.sendToRelays([r], n), s.push({
            relay: r,
            success: !0,
            subscriptionId: e.id
          });
        } catch (a) {
          s.push({
            relay: r,
            success: !1,
            error: a instanceof Error ? a.message : "Unknown error",
            subscriptionId: e.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(n), e.relays.forEach((r) => {
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
        e.relays.forEach((a) => {
          s.push({
            relay: a,
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
      set(t, s, n) {
        return s === "eventCount" || s === "lastEventAt" || s === "state" ? (t[s] = n, !0) : !1;
      }
    });
  }
  setupRelayMessageHandling() {
  }
}
class Vt {
  constructor(e = {}) {
    d(this, "relayManager");
    d(this, "subscriptionManager");
    d(this, "signingProvider");
    d(this, "signingMethod");
    d(this, "config");
    // Fluent Event Builder API
    d(this, "events");
    // Direct Message API
    d(this, "dm");
    this.config = {
      relays: e.relays ?? ut,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? ee.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? ee.RETRY_DELAY,
      timeout: e.timeout ?? ee.PUBLISH_TIMEOUT
    }, this.relayManager = new dt(this.config.relays, {
      debug: this.config.debug
    }), this.subscriptionManager = new Lt(this.relayManager), this.events = new pt(this), this.dm = new Ye({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: void 0,
      // Will be set when initialized
      debug: this.config.debug
    }), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays);
  }
  /**
   * Get configured relay URLs
   */
  get relays() {
    return this.relayManager.relayUrls;
  }
  /**
   * Get currently connected relay URLs
   */
  get connectedRelays() {
    return this.relayManager.connectedRelays;
  }
  /**
   * Initialize signing provider
   */
  async initializeSigning() {
    if (this.signingProvider) return;
    const { provider: e, method: t } = await gt.createBestAvailable();
    this.signingProvider = e, this.signingMethod = t, await this.dm.updateSigningProvider(this.signingProvider), this.config.debug && console.log(`Initialized signing with method: ${t}`);
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
      throw v.handleConnectionError("relays", e);
    }
  }
  /**
   * Disconnect from all relays
   */
  async disconnect() {
    await this.relayManager.disconnect();
  }
  /**
   * Publish a simple text note
   */
  async publish(e) {
    const t = Date.now();
    let s = {};
    try {
      await this.initializeSigning(), s.signingMethod = this.signingMethod;
      const n = await this.signingProvider.getPublicKey(), r = await Y.createEvent(e, n), a = Y.addEventId(r), o = await this.signingProvider.signEvent(r), c = {
        ...a,
        sig: o
      };
      if (this.connectedRelays.length === 0) {
        const g = Date.now();
        await this.connect(), s.connectionAttempts = Date.now() - g;
      }
      const u = await this.relayManager.publishToAll(c);
      this.config.debug && (s.relayLatencies = {}, u.forEach((g) => {
        g.latency && (s.relayLatencies[g.relay] = g.latency);
      }));
      const l = v.analyzeRelayResults(u);
      s.totalTime = Date.now() - t;
      const h = {
        success: l.success,
        eventId: c.id,
        event: c,
        relayResults: u,
        timestamp: Date.now(),
        error: l.error,
        debug: this.config.debug ? s : void 0
      };
      return this.config.debug && console.log("Publish result:", h), h;
    } catch (n) {
      s.totalTime = Date.now() - t;
      let r;
      return n instanceof Error ? n.message.includes("Content") ? r = v.handleContentError(e) : n.message.includes("sign") || n.message.includes("extension") ? r = v.handleSigningError(n) : r = v.handleConnectionError("relay", n) : r = v.createError("network", "Unknown error occurred", {
        retryable: !0
      }), {
        success: !1,
        relayResults: [],
        timestamp: Date.now(),
        error: r,
        debug: this.config.debug ? s : void 0
      };
    }
  }
  /**
   * Create an event (for testing/advanced usage)
   */
  async createEvent(e) {
    await this.initializeSigning();
    const t = await this.signingProvider.getPublicKey(), s = await Y.createEvent(
      e.content,
      t,
      {
        kind: e.kind,
        tags: e.tags,
        created_at: e.created_at
      }
    ), n = Y.addEventId(s), r = await this.signingProvider.signEvent(s);
    return {
      ...n,
      sig: r
    };
  }
  /**
   * Calculate event ID (utility method for testing)
   */
  calculateEventId(e) {
    return Y.calculateEventId(e);
  }
  /**
   * Verify event signature (utility method)
   */
  async verifyEvent(e) {
    return Y.verifyEventId(e);
  }
  /**
   * Check if browser extension is available
   */
  async hasExtension() {
    return await Ae.isAvailable();
  }
  /**
   * Get public key from extension
   */
  async getExtensionPubkey() {
    if (!await this.hasExtension())
      throw new Error("No browser extension available");
    return await new Ae().getPublicKey();
  }
  /**
   * Get relay information (NIP-11)
   */
  async getRelayInfo(e) {
    return await this.relayManager.getRelayInfo(e);
  }
  /**
   * Test relay connectivity
   */
  async testRelay(e) {
    return await this.relayManager.testRelay(e);
  }
  /**
   * Publish a pre-built and signed event
   */
  async publishEvent(e) {
    const t = Date.now();
    let s = {};
    try {
      if (this.connectedRelays.length === 0) {
        const o = Date.now();
        await this.connect(), s.connectionAttempts = Date.now() - o;
      }
      const n = await this.relayManager.publishToAll(e);
      this.config.debug && (s.relayLatencies = {}, n.forEach((o) => {
        o.latency && (s.relayLatencies[o.relay] = o.latency);
      }));
      const r = v.analyzeRelayResults(n);
      s.totalTime = Date.now() - t;
      const a = {
        success: r.success,
        eventId: e.id,
        event: e,
        relayResults: n,
        timestamp: Date.now(),
        error: r.error,
        debug: this.config.debug ? s : void 0
      };
      return this.config.debug && console.log("PublishEvent result:", a), a;
    } catch (n) {
      s.totalTime = Date.now() - t;
      let r;
      return n instanceof Error ? r = v.handleConnectionError("relay", n) : r = v.createError("network", "Unknown error occurred", {
        retryable: !0
      }), {
        success: !1,
        relayResults: [],
        timestamp: Date.now(),
        error: r,
        debug: this.config.debug ? s : void 0
      };
    }
  }
  /**
   * Get connection statistics
   */
  getStats() {
    return this.relayManager.getStats();
  }
}
class Le {
  constructor(e = {}, t) {
    d(this, "state");
    d(this, "subscriptionManager");
    this.state = { ...e }, this.subscriptionManager = t;
  }
  // Immutable helper to create new instance
  clone(e = {}) {
    return new Le(
      { ...this.state, ...e },
      this.subscriptionManager
    );
  }
  // Basic filter methods with validation
  kinds(e) {
    if (!Array.isArray(e) || e.length === 0)
      throw new Error("kinds cannot be empty");
    for (const s of e) {
      if (typeof s != "number")
        throw new Error("kinds must be numbers");
      if (!Number.isInteger(s))
        throw new Error("kinds must be integers");
    }
    const t = Array.from(new Set(e));
    return this.clone({ kinds: t });
  }
  authors(e) {
    if (!Array.isArray(e) || e.length === 0)
      throw new Error("authors cannot be empty");
    for (const s of e)
      if (typeof s != "string")
        throw new Error("authors must be strings");
    const t = Array.from(new Set(e));
    return this.clone({ authors: t });
  }
  ids(e) {
    if (!Array.isArray(e) || e.length === 0)
      throw new Error("ids cannot be empty");
    for (const s of e)
      if (typeof s != "string")
        throw new Error("ids must be strings");
    const t = Array.from(new Set(e));
    return this.clone({ ids: t });
  }
  since(e) {
    if (typeof e != "number")
      throw new Error("since must be a number");
    if (e < 0)
      throw new Error("since must be positive");
    return this.clone({ since: e });
  }
  until(e) {
    if (typeof e != "number")
      throw new Error("until must be a number");
    if (e < 0)
      throw new Error("until must be positive");
    return this.clone({ until: e });
  }
  limit(e) {
    if (typeof e != "number")
      throw new Error("limit must be a number");
    if (e <= 0)
      throw new Error("limit must be positive");
    return this.clone({ limit: e });
  }
  // Advanced filter methods
  tags(e, t) {
    if (typeof e != "string" || e.length === 0)
      throw new Error("tag name must be a non-empty string");
    if (!Array.isArray(t) || t.length === 0)
      throw new Error("tag values cannot be empty");
    const s = { ...this.state.tags }, n = e;
    return s[n] ? s[n] = Array.from(/* @__PURE__ */ new Set([...s[n], ...t])) : s[n] = Array.from(new Set(t)), this.clone({ tags: s });
  }
  search(e) {
    if (typeof e != "string" || e.length === 0)
      throw new Error("search query must be a non-empty string");
    return this.clone({ search: e });
  }
  // Query composition
  union(e) {
    const t = e, s = this.state.unionWith || [];
    return this.clone({
      unionWith: [...s, t]
    });
  }
  intersect(e) {
    const t = e, s = { ...this.state }, n = t.state;
    if (n.kinds && (s.kinds ? s.kinds = Array.from(/* @__PURE__ */ new Set([...s.kinds, ...n.kinds])) : s.kinds = [...n.kinds]), n.authors && (s.authors ? s.authors = Array.from(/* @__PURE__ */ new Set([...s.authors, ...n.authors])) : s.authors = [...n.authors]), n.tags) {
      const r = { ...s.tags };
      for (const [a, o] of Object.entries(n.tags))
        r[a] ? r[a] = Array.from(/* @__PURE__ */ new Set([...r[a], ...o])) : r[a] = [...o];
      s.tags = r;
    }
    return n.since !== void 0 && (s.since = Math.max(s.since || 0, n.since)), n.until !== void 0 && (s.until !== void 0 ? s.until = Math.min(s.until, n.until) : s.until = n.until), n.limit !== void 0 && (s.limit !== void 0 ? s.limit = Math.min(s.limit, n.limit) : s.limit = n.limit), this.clone(s);
  }
  // Compilation
  toFilter() {
    const e = [];
    if (this.state.unionWith && this.state.unionWith.length > 0) {
      const t = this.compileStateToFilter(this.state);
      Object.keys(t).length > 0 && e.push(t);
      for (const s of this.state.unionWith) {
        const n = s.toFilter();
        e.push(...n);
      }
    } else {
      const t = this.compileStateToFilter(this.state);
      e.push(t);
    }
    return e;
  }
  compileStateToFilter(e) {
    const t = {};
    if (e.kinds && e.kinds.length > 0 && (t.kinds = e.kinds), e.authors && e.authors.length > 0 && (t.authors = e.authors), e.ids && e.ids.length > 0 && (t.ids = e.ids), e.since !== void 0 && (t.since = e.since), e.until !== void 0 && (t.until = e.until), e.limit !== void 0 && (t.limit = e.limit), e.tags)
      for (const [s, n] of Object.entries(e.tags))
        t[`#${s}`] = n;
    return e.search && (t.search = e.search), t;
  }
  // Execution
  async execute(e = {}) {
    var u;
    if (!this.subscriptionManager)
      throw new Error("SubscriptionManager is required for query execution");
    const t = this.toFilter(), s = [];
    let n = !1;
    const r = {
      ...e,
      onEvent: (l) => {
        s.push(l), e.onEvent && e.onEvent(l);
      },
      onEose: (l) => {
        n = !0, e.onEose && e.onEose(l);
      },
      autoClose: !0
      // Auto-close for execute
    }, a = await this.subscriptionManager.subscribe(t, r);
    if (!a.success)
      throw new Error(((u = a.error) == null ? void 0 : u.message) || "Query execution failed");
    const o = e.timeout || 1e4, c = Date.now();
    for (; !n && Date.now() - c < o; )
      await new Promise((l) => setTimeout(l, 100));
    return s;
  }
  async subscribe(e = {}) {
    if (!this.subscriptionManager)
      throw new Error("SubscriptionManager is required for query subscription");
    const t = this.toFilter(), s = {
      ...e,
      autoClose: !1
      // Don't auto-close for subscribe
    };
    return await this.subscriptionManager.subscribe(t, s);
  }
  // Validation
  validate() {
    const e = [];
    return this.state.since !== void 0 && this.state.until !== void 0 && this.state.until <= this.state.since && e.push("until must be after since"), !(this.state.kinds || this.state.authors || this.state.ids || this.state.since !== void 0 || this.state.until !== void 0 || this.state.limit !== void 0 || this.state.tags || this.state.search) && (!this.state.unionWith || this.state.unionWith.length), {
      valid: e.length === 0,
      errors: e
    };
  }
  // Getter for testing
  get _state() {
    return { ...this.state };
  }
}
function Ct(i) {
  return new Le({}, i);
}
function Gt(i) {
  return Ct(i);
}
const $t = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: ze,
  DMModule: Ye,
  EphemeralKeyManager: we,
  GiftWrapCreator: me,
  GiftWrapProtocol: ve,
  NIP44Crypto: A,
  SealCreator: Ee,
  TimestampRandomizer: Re
}, Symbol.toStringTag, { value: "Module" })), Wt = "0.1.0";
export {
  ut as DEFAULT_RELAYS,
  $t as DM,
  Oe as EVENT_KINDS,
  v as ErrorHandler,
  Y as EventBuilder,
  pt as EventsModule,
  Ae as ExtensionSigner,
  ke as FeedStoreImpl,
  yt as FluentEventBuilder,
  Vt as NostrUnchained,
  Le as QueryBuilder,
  dt as RelayManager,
  gt as SigningProviderFactory,
  Lt as SubscriptionManager,
  ft as TemporarySigner,
  Wt as VERSION,
  Ft as createFeed,
  Ut as createFeedFromFilter,
  Kt as createFeedFromQuery,
  Ct as createQueryBuilder,
  M as derived,
  Gt as query,
  Pt as setDefaultSubscriptionManager,
  Q as writable
};
