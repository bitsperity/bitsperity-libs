var Xe = Object.defineProperty;
var Je = (a, e, t) => e in a ? Xe(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var h = (a, e, t) => Je(a, typeof e != "symbol" ? e + "" : e, t);
import * as se from "@noble/secp256k1";
import { getSharedSecret as Qe } from "@noble/secp256k1";
const ae = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function qe(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function Se(a) {
  if (!Number.isSafeInteger(a) || a < 0)
    throw new Error("positive integer expected, got " + a);
}
function fe(a, ...e) {
  if (!qe(a))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(a.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + a.length);
}
function Re(a) {
  if (typeof a != "function" || typeof a.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Se(a.outputLen), Se(a.blockLen);
}
function Me(a, e = !0) {
  if (a.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && a.finished)
    throw new Error("Hash#digest() has already been called");
}
function et(a, e) {
  fe(a);
  const t = e.outputLen;
  if (a.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function ue(...a) {
  for (let e = 0; e < a.length; e++)
    a[e].fill(0);
}
function Ie(a) {
  return new DataView(a.buffer, a.byteOffset, a.byteLength);
}
function X(a, e) {
  return a << 32 - e | a >>> e;
}
const tt = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", st = /* @__PURE__ */ Array.from({ length: 256 }, (a, e) => e.toString(16).padStart(2, "0"));
function be(a) {
  if (fe(a), tt)
    return a.toHex();
  let e = "";
  for (let t = 0; t < a.length; t++)
    e += st[a[t]];
  return e;
}
function it(a) {
  if (typeof a != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(a));
}
function he(a) {
  return typeof a == "string" && (a = it(a)), fe(a), a;
}
class We {
}
function nt(a) {
  const e = (s) => a().update(he(s)).digest(), t = a();
  return e.outputLen = t.outputLen, e.blockLen = t.blockLen, e.create = () => a(), e;
}
function oe(a = 32) {
  if (ae && typeof ae.getRandomValues == "function")
    return ae.getRandomValues(new Uint8Array(a));
  if (ae && typeof ae.randomBytes == "function")
    return Uint8Array.from(ae.randomBytes(a));
  throw new Error("crypto.getRandomValues must be defined");
}
function rt(a, e, t, s) {
  if (typeof a.setBigUint64 == "function")
    return a.setBigUint64(e, t, s);
  const i = BigInt(32), n = BigInt(4294967295), r = Number(t >> i & n), o = Number(t & n), c = s ? 4 : 0, l = s ? 0 : 4;
  a.setUint32(e + c, r, s), a.setUint32(e + l, o, s);
}
function at(a, e, t) {
  return a & e ^ ~a & t;
}
function ot(a, e, t) {
  return a & e ^ a & t ^ e & t;
}
class ct extends We {
  constructor(e, t, s, i) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = i, this.buffer = new Uint8Array(e), this.view = Ie(this.buffer);
  }
  update(e) {
    Me(this), e = he(e), fe(e);
    const { view: t, buffer: s, blockLen: i } = this, n = e.length;
    for (let r = 0; r < n; ) {
      const o = Math.min(i - this.pos, n - r);
      if (o === i) {
        const c = Ie(e);
        for (; i <= n - r; r += i)
          this.process(c, r);
        continue;
      }
      s.set(e.subarray(r, r + o), this.pos), this.pos += o, r += o, this.pos === i && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Me(this), et(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: i, isLE: n } = this;
    let { pos: r } = this;
    t[r++] = 128, ue(this.buffer.subarray(r)), this.padOffset > i - r && (this.process(s, 0), r = 0);
    for (let g = r; g < i; g++)
      t[g] = 0;
    rt(s, i - 8, BigInt(this.length * 8), n), this.process(s, 0);
    const o = Ie(e), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const l = c / 4, u = this.get();
    if (l > u.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let g = 0; g < l; g++)
      o.setUint32(4 * g, u[g], n);
  }
  digest() {
    const { buffer: e, outputLen: t } = this;
    this.digestInto(e);
    const s = e.slice(0, t);
    return this.destroy(), s;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: t, buffer: s, length: i, finished: n, destroyed: r, pos: o } = this;
    return e.destroyed = r, e.finished = n, e.length = i, e.pos = o, i % t && e.buffer.set(s), e;
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
]), lt = /* @__PURE__ */ Uint32Array.from([
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
]), q = /* @__PURE__ */ new Uint32Array(64);
class ut extends ct {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = Q[0] | 0, this.B = Q[1] | 0, this.C = Q[2] | 0, this.D = Q[3] | 0, this.E = Q[4] | 0, this.F = Q[5] | 0, this.G = Q[6] | 0, this.H = Q[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: i, E: n, F: r, G: o, H: c } = this;
    return [e, t, s, i, n, r, o, c];
  }
  // prettier-ignore
  set(e, t, s, i, n, r, o, c) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = i | 0, this.E = n | 0, this.F = r | 0, this.G = o | 0, this.H = c | 0;
  }
  process(e, t) {
    for (let g = 0; g < 16; g++, t += 4)
      q[g] = e.getUint32(t, !1);
    for (let g = 16; g < 64; g++) {
      const d = q[g - 15], p = q[g - 2], f = X(d, 7) ^ X(d, 18) ^ d >>> 3, w = X(p, 17) ^ X(p, 19) ^ p >>> 10;
      q[g] = w + q[g - 7] + f + q[g - 16] | 0;
    }
    let { A: s, B: i, C: n, D: r, E: o, F: c, G: l, H: u } = this;
    for (let g = 0; g < 64; g++) {
      const d = X(o, 6) ^ X(o, 11) ^ X(o, 25), p = u + d + at(o, c, l) + lt[g] + q[g] | 0, w = (X(s, 2) ^ X(s, 13) ^ X(s, 22)) + ot(s, i, n) | 0;
      u = l, l = c, c = o, o = r + p | 0, r = n, n = i, i = s, s = p + w | 0;
    }
    s = s + this.A | 0, i = i + this.B | 0, n = n + this.C | 0, r = r + this.D | 0, o = o + this.E | 0, c = c + this.F | 0, l = l + this.G | 0, u = u + this.H | 0, this.set(s, i, n, r, o, c, l, u);
  }
  roundClean() {
    ue(q);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), ue(this.buffer);
  }
}
const ht = /* @__PURE__ */ nt(() => new ut()), ie = ht, gt = [
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
}, N = {
  EMPTY_CONTENT: "Content cannot be empty",
  CONTENT_TOO_LONG: "Content too long",
  NO_RELAYS: "No relays configured",
  CONNECTION_FAILED: "Failed to connect to relay",
  SIGNING_FAILED: "Failed to sign event",
  PUBLISH_FAILED: "Failed to publish to any relay",
  NO_EXTENSION: "No browser extension available",
  INVALID_EVENT: "Invalid event structure"
}, le = {
  EMPTY_CONTENT: "Add some content to your message",
  CONTENT_TOO_LONG: `Keep your message under ${ee.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: "Check your internet connection and try again",
  NO_EXTENSION: "Install a Nostr browser extension or the library will use a temporary key",
  PUBLISH_FAILED: "Try again or check if your relays are accessible"
}, me = {
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
    ]), s = new TextEncoder().encode(t), i = ie(s);
    return be(i);
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
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !me.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !me.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !me.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && t.push(N.EMPTY_CONTENT), e.content && e.content.length > ee.MAX_CONTENT_LENGTH && t.push(N.CONTENT_TOO_LONG), e.created_at) {
      const s = Math.floor(Date.now() / 1e3), i = s - 3600, n = s + 3600;
      (e.created_at < i || e.created_at > n) && t.push("Timestamp is too far in the past or future");
    }
    return e.tags && (Array.isArray(e.tags) ? e.tags.forEach((s, i) => {
      Array.isArray(s) ? s.forEach((n, r) => {
        typeof n != "string" && t.push(`Tag ${i}[${r}] must be a string`);
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
    return e === "" && t.push(N.EMPTY_CONTENT), e.length > ee.MAX_CONTENT_LENGTH && t.push(N.CONTENT_TOO_LONG), {
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
    const i = Y.validateContent(e);
    if (!i.valid)
      throw new Error(`Invalid content: ${i.errors.join(", ")}`);
    const n = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? Oe.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, r = Y.validateEvent(n);
    if (!r.valid)
      throw new Error(`Invalid event: ${r.errors.join(", ")}`);
    return n;
  }
}
async function dt() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class ft {
  constructor(e, t = {}) {
    h(this, "connections", /* @__PURE__ */ new Map());
    h(this, "debug");
    h(this, "messageHandler");
    h(this, "pendingPublishes", /* @__PURE__ */ new Map());
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
        const n = await dt(), r = new n(e), o = setTimeout(() => {
          r.close(), t.state = "error", t.error = "Connection timeout", i(new Error(`Connection to ${e} timed out`));
        }, ee.CONNECTION_TIMEOUT);
        r.onopen = () => {
          clearTimeout(o), t.ws = r, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, r.onerror = (c) => {
          clearTimeout(o), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, c), i(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, r.onclose = () => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`);
        }, r.onmessage = (c) => {
          this.handleRelayMessage(e, c.data);
        };
      } catch (n) {
        t.state = "error", t.error = n instanceof Error ? n.message : "Unknown error", i(n);
      }
    }));
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(e) {
    const t = [], s = this.connectedRelays.map(async (i) => {
      const n = Date.now();
      try {
        const r = await this.publishToRelay(i, e), o = Date.now() - n;
        t.push({
          relay: i,
          success: r,
          latency: o
        });
      } catch (r) {
        const o = Date.now() - n;
        t.push({
          relay: i,
          success: !1,
          error: r instanceof Error ? r.message : "Unknown error",
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
    return new Promise((i, n) => {
      const r = s.ws, o = ["EVENT", t], c = setTimeout(() => {
        n(new Error("Publish timeout"));
      }, ee.PUBLISH_TIMEOUT), l = t.id;
      this.pendingPublishes.set(l, { resolve: i, reject: n, timeout: c });
      try {
        const u = JSON.stringify(o);
        r.send(u), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", u), console.log("📤 Added to pending:", l));
      } catch (u) {
        clearTimeout(c), this.pendingPublishes.delete(l), n(u);
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
        const [, i, n, r] = s, o = this.pendingPublishes.get(i);
        this.debug && (console.log(`OK for event ${i}, success: ${n}, pending: ${!!o}`), console.log("Pending publishes:", Array.from(this.pendingPublishes.keys()))), o ? (clearTimeout(o.timeout), this.pendingPublishes.delete(i), n ? o.resolve(!0) : o.reject(new Error(r || "Relay rejected event"))) : this.debug && console.warn(`No pending publish found for event ID: ${i}`);
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
      return me.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
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
      (i) => this.sendToRelay(i, t).catch((n) => {
        this.debug && console.warn(`Failed to send to ${i}:`, n);
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
class _e {
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(N.NO_EXTENSION);
    try {
      return await window.nostr.getPublicKey();
    } catch (e) {
      throw new Error(`Extension signing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  async signEvent(e) {
    if (!window.nostr)
      throw new Error(N.NO_EXTENSION);
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
class Ne {
  constructor() {
    h(this, "privateKey");
    h(this, "publicKey");
    const e = oe(32);
    this.privateKey = be(e), this.publicKey = be(se.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = Y.calculateEventId(e), s = await se.schnorr.sign(t, this.privateKey);
    return be(s);
  }
  /**
   * Get private key for NIP-44 encryption
   * WARNING: Only for testing/development. Production should use secure key derivation.
   */
  async getPrivateKeyForEncryption() {
    return this.privateKey;
  }
}
class Gt extends Ne {
}
class Ht extends Ne {
}
class pt {
  static async createBestAvailable() {
    if (await _e.isAvailable())
      try {
        const e = new _e();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new Ne(),
      method: "temporary"
    };
  }
}
class _ {
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
    return e === "" ? _.createError("validation", N.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: le.EMPTY_CONTENT
    }) : e.length > 8192 ? _.createError("validation", N.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: le.CONTENT_TOO_LONG
    }) : _.createError("validation", N.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(e) {
    const t = e.message.toLowerCase();
    return t.includes("user declined") || t.includes("denied") ? _.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : t.includes("no extension") ? _.createError("signing", N.NO_EXTENSION, {
      retryable: !1,
      suggestion: le.NO_EXTENSION
    }) : _.createError("signing", N.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(e, t) {
    const s = t.message.toLowerCase();
    return s.includes("timeout") ? _.createError("network", `Connection to ${e} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? _.createError("network", `Failed to connect to ${e}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : _.createError("network", N.CONNECTION_FAILED, {
      retryable: !0,
      suggestion: le.CONNECTION_FAILED
    });
  }
  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(e) {
    const t = e.length, s = e.filter((n) => n.success), i = e.filter((n) => !n.success);
    if (t === 0)
      return {
        success: !1,
        error: _.createError("config", N.NO_RELAYS, {
          retryable: !1,
          suggestion: "Configure at least one relay URL"
        })
      };
    if (s.length === 0) {
      const n = i.every(
        (o) => {
          var c;
          return (c = o.error) == null ? void 0 : c.toLowerCase().includes("timeout");
        }
      ), r = i.every(
        (o) => {
          var c, l;
          return ((c = o.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((l = o.error) == null ? void 0 : l.toLowerCase().includes("refused"));
        }
      );
      return n ? {
        success: !1,
        error: _.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : r ? {
        success: !1,
        error: _.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: _.createError("relay", N.PUBLISH_FAILED, {
          retryable: !0,
          suggestion: le.PUBLISH_FAILED
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
      const i = t.relayResults.filter((r) => r.success).length, n = t.relayResults.length;
      i > 0 ? s += ` (${i}/${n} relays succeeded)` : s += ` (0/${n} relays succeeded)`;
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
    h(this, "eventData");
    h(this, "nostrInstance");
    // NostrUnchained instance for publishing
    h(this, "signed", !1);
    h(this, "signedEvent");
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
class bt {
  constructor(e) {
    h(this, "nostrInstance");
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
function A(a) {
  const e = /* @__PURE__ */ new Set();
  let t = a;
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
function E(a, e) {
  const t = Array.isArray(a) ? a : [a], s = /* @__PURE__ */ new Set();
  let i, n = !1;
  const r = [], o = () => {
    if (t.length === 1) {
      const c = t[0].subscribe((l) => {
        const u = e(l);
        (!n || u !== i) && (i = u, n && s.forEach((g) => g(i)));
      });
      r.length === 0 && r.push(c);
    }
  };
  return {
    subscribe(c) {
      return n || (o(), n = !0), i !== void 0 && c(i), s.add(c), () => {
        s.delete(c), s.size === 0 && (r.forEach((l) => l()), r.length = 0, n = !1);
      };
    }
  };
}
function Ge(a) {
  return {
    subscribe: a.subscribe.bind(a),
    derive: (e) => E(a, e)
  };
}
class ge {
  constructor(e, t, s) {
    h(this, "_events");
    h(this, "_readIds", /* @__PURE__ */ new Set());
    h(this, "parent");
    this.parent = e, this._events = E(e.events, (i) => {
      let n = i;
      return t && (n = n.filter(t)), s && (n = [...n].sort(s)), n;
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
    return E(this._events, (e) => e.length);
  }
  get latest() {
    return E(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return E(this._events, (e) => e.length === 0);
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
    return Ge(E(this._events, e));
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
    return new ge(this, e);
  }
  sortBy(e) {
    return new ge(this, void 0, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((r) => {
      e = r;
    })();
    const s = e.filter((r) => this._readIds.has(r.id)).length, i = e.length, n = i - s;
    return { read: s, unread: n, total: i };
  }
}
class Ce {
  constructor(e, t, s = {}, i = {}) {
    h(this, "_events", A([]));
    h(this, "_status", A("connecting"));
    h(this, "_error", A(null));
    h(this, "_loading", A(!1));
    h(this, "_count", A(0));
    h(this, "_readIds", /* @__PURE__ */ new Set());
    h(this, "subscription");
    h(this, "subscriptionManager");
    h(this, "filters");
    h(this, "options");
    h(this, "maxEvents");
    h(this, "isLive");
    h(this, "eventPredicate");
    h(this, "eventComparator");
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
    return E(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return E(this._events, () => !0);
  }
  get isEmpty() {
    return E(this._events, (e) => e.length === 0);
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
    return Ge(E(this._events, e));
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
    return new ge(this, e, this.eventComparator);
  }
  sortBy(e) {
    return new ge(this, this.eventPredicate, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((r) => {
      e = r;
    })();
    const s = e.filter((r) => this._readIds.has(r.id)).length, i = e.length, n = i - s;
    return { read: s, unread: n, total: i };
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
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((i, n) => n.created_at - i.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
    }), this._count.update((t) => t + 1));
  }
}
class mt {
  constructor(e) {
    h(this, "filter", {});
    h(this, "options", {});
    h(this, "config", {});
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
    return new Ce(
      this.subscriptionManager,
      e,
      this.options,
      this.config
    );
  }
}
let ne;
function Bt(a) {
  ne = a;
}
function zt() {
  if (!ne)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new mt(ne);
}
function jt(a) {
  if (!ne)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = a.toFilter();
  return new Ce(ne, e);
}
function Yt(a) {
  if (!ne)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new Ce(ne, [a]);
}
class He extends We {
  constructor(e, t) {
    super(), this.finished = !1, this.destroyed = !1, Re(e);
    const s = he(t);
    if (this.iHash = e.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const i = this.blockLen, n = new Uint8Array(i);
    n.set(s.length > i ? e.create().update(s).digest() : s);
    for (let r = 0; r < n.length; r++)
      n[r] ^= 54;
    this.iHash.update(n), this.oHash = e.create();
    for (let r = 0; r < n.length; r++)
      n[r] ^= 106;
    this.oHash.update(n), ue(n);
  }
  update(e) {
    return Me(this), this.iHash.update(e), this;
  }
  digestInto(e) {
    Me(this), fe(e, this.outputLen), this.finished = !0, this.iHash.digestInto(e), this.oHash.update(e), this.oHash.digestInto(e), this.destroy();
  }
  digest() {
    const e = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(e), e;
  }
  _cloneInto(e) {
    e || (e = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: t, iHash: s, finished: i, destroyed: n, blockLen: r, outputLen: o } = this;
    return e = e, e.finished = i, e.destroyed = n, e.blockLen = r, e.outputLen = o, e.oHash = t._cloneInto(e.oHash), e.iHash = s._cloneInto(e.iHash), e;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const de = (a, e, t) => new He(a, e).update(t).digest();
de.create = (a, e) => new He(a, e);
function wt(a, e, t) {
  return Re(a), t === void 0 && (t = new Uint8Array(a.outputLen)), de(a, he(t), he(e));
}
const Ae = /* @__PURE__ */ Uint8Array.from([0]), xe = /* @__PURE__ */ Uint8Array.of();
function Et(a, e, t, s = 32) {
  Re(a), Se(s);
  const i = a.outputLen;
  if (s > 255 * i)
    throw new Error("Length should be <= 255*HashLen");
  const n = Math.ceil(s / i);
  t === void 0 && (t = xe);
  const r = new Uint8Array(n * i), o = de.create(a, e), c = o._cloneInto(), l = new Uint8Array(o.outputLen);
  for (let u = 0; u < n; u++)
    Ae[0] = u + 1, c.update(u === 0 ? xe : l).update(t).update(Ae).digestInto(l), r.set(l, i * u), o._cloneInto(c);
  return o.destroy(), c.destroy(), ue(l, Ae), r.slice(0, s);
}
const Fe = (a, e, t, s, i) => Et(a, wt(a, e, t), s, i);
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function vt(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function Ue(a) {
  if (typeof a != "boolean")
    throw new Error(`boolean expected, not ${a}`);
}
function Pe(a) {
  if (!Number.isSafeInteger(a) || a < 0)
    throw new Error("positive integer expected, got " + a);
}
function pe(a, ...e) {
  if (!vt(a))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(a.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + a.length);
}
function te(a) {
  return new Uint32Array(a.buffer, a.byteOffset, Math.floor(a.byteLength / 4));
}
function Mt(...a) {
  for (let e = 0; e < a.length; e++)
    a[e].fill(0);
}
function _t(a, e) {
  if (e == null || typeof e != "object")
    throw new Error("options must be defined");
  return Object.assign(a, e);
}
function Ke(a) {
  return Uint8Array.from(a);
}
const Be = (a) => Uint8Array.from(a.split("").map((e) => e.charCodeAt(0))), It = Be("expand 16-byte k"), At = Be("expand 32-byte k"), Pt = te(It), St = te(At);
function m(a, e) {
  return a << e | a >>> 32 - e;
}
function Te(a) {
  return a.byteOffset % 4 === 0;
}
const ye = 64, Tt = 16, ze = 2 ** 32 - 1, Ve = new Uint32Array();
function kt(a, e, t, s, i, n, r, o) {
  const c = i.length, l = new Uint8Array(ye), u = te(l), g = Te(i) && Te(n), d = g ? te(i) : Ve, p = g ? te(n) : Ve;
  for (let f = 0; f < c; r++) {
    if (a(e, t, s, u, r, o), r >= ze)
      throw new Error("arx: counter overflow");
    const w = Math.min(ye, c - f);
    if (g && w === ye) {
      const I = f / 4;
      if (f % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let v = 0, M; v < Tt; v++)
        M = I + v, p[M] = d[M] ^ u[v];
      f += ye;
      continue;
    }
    for (let I = 0, v; I < w; I++)
      v = f + I, n[v] = i[v] ^ l[I];
    f += w;
  }
}
function Rt(a, e) {
  const { allowShortKeys: t, extendNonceFn: s, counterLength: i, counterRight: n, rounds: r } = _t({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
  if (typeof a != "function")
    throw new Error("core must be a function");
  return Pe(i), Pe(r), Ue(n), Ue(t), (o, c, l, u, g = 0) => {
    pe(o), pe(c), pe(l);
    const d = l.length;
    if (u === void 0 && (u = new Uint8Array(d)), pe(u), Pe(g), g < 0 || g >= ze)
      throw new Error("arx: counter overflow");
    if (u.length < d)
      throw new Error(`arx: output (${u.length}) is shorter than data (${d})`);
    const p = [];
    let f = o.length, w, I;
    if (f === 32)
      p.push(w = Ke(o)), I = St;
    else if (f === 16 && t)
      w = new Uint8Array(32), w.set(o), w.set(o, 16), I = Pt, p.push(w);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${f}`);
    Te(c) || p.push(c = Ke(c));
    const v = te(w);
    if (s) {
      if (c.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(I, v, te(c.subarray(0, 16)), v), c = c.subarray(16);
    }
    const M = 16 - i;
    if (M !== c.length)
      throw new Error(`arx: nonce must be ${M} or 16 bytes`);
    if (M !== 12) {
      const J = new Uint8Array(12);
      J.set(c, n ? 0 : 12 - c.length), c = J, p.push(c);
    }
    const C = te(c);
    return kt(a, I, v, C, l, u, g, r), Mt(...p), u;
  };
}
function Nt(a, e, t, s, i, n = 20) {
  let r = a[0], o = a[1], c = a[2], l = a[3], u = e[0], g = e[1], d = e[2], p = e[3], f = e[4], w = e[5], I = e[6], v = e[7], M = i, C = t[0], J = t[1], re = t[2], S = r, D = o, L = c, O = l, x = u, F = g, U = d, K = p, V = f, $ = w, W = I, G = v, H = M, B = C, z = J, j = re;
  for (let Le = 0; Le < n; Le += 2)
    S = S + x | 0, H = m(H ^ S, 16), V = V + H | 0, x = m(x ^ V, 12), S = S + x | 0, H = m(H ^ S, 8), V = V + H | 0, x = m(x ^ V, 7), D = D + F | 0, B = m(B ^ D, 16), $ = $ + B | 0, F = m(F ^ $, 12), D = D + F | 0, B = m(B ^ D, 8), $ = $ + B | 0, F = m(F ^ $, 7), L = L + U | 0, z = m(z ^ L, 16), W = W + z | 0, U = m(U ^ W, 12), L = L + U | 0, z = m(z ^ L, 8), W = W + z | 0, U = m(U ^ W, 7), O = O + K | 0, j = m(j ^ O, 16), G = G + j | 0, K = m(K ^ G, 12), O = O + K | 0, j = m(j ^ O, 8), G = G + j | 0, K = m(K ^ G, 7), S = S + F | 0, j = m(j ^ S, 16), W = W + j | 0, F = m(F ^ W, 12), S = S + F | 0, j = m(j ^ S, 8), W = W + j | 0, F = m(F ^ W, 7), D = D + U | 0, H = m(H ^ D, 16), G = G + H | 0, U = m(U ^ G, 12), D = D + U | 0, H = m(H ^ D, 8), G = G + H | 0, U = m(U ^ G, 7), L = L + K | 0, B = m(B ^ L, 16), V = V + B | 0, K = m(K ^ V, 12), L = L + K | 0, B = m(B ^ L, 8), V = V + B | 0, K = m(K ^ V, 7), O = O + x | 0, z = m(z ^ O, 16), $ = $ + z | 0, x = m(x ^ $, 12), O = O + x | 0, z = m(z ^ O, 8), $ = $ + z | 0, x = m(x ^ $, 7);
  let T = 0;
  s[T++] = r + S | 0, s[T++] = o + D | 0, s[T++] = c + L | 0, s[T++] = l + O | 0, s[T++] = u + x | 0, s[T++] = g + F | 0, s[T++] = d + U | 0, s[T++] = p + K | 0, s[T++] = f + V | 0, s[T++] = w + $ | 0, s[T++] = I + W | 0, s[T++] = v + G | 0, s[T++] = M + H | 0, s[T++] = C + B | 0, s[T++] = J + z | 0, s[T++] = re + j | 0;
}
const $e = /* @__PURE__ */ Rt(Nt, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), Ct = {
  saltInfo: "nip44-v2"
};
class k extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP44Error";
  }
}
var R = /* @__PURE__ */ ((a) => (a.INVALID_KEY = "INVALID_KEY", a.INVALID_NONCE = "INVALID_NONCE", a.INVALID_PAYLOAD = "INVALID_PAYLOAD", a.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", a.DECRYPTION_FAILED = "DECRYPTION_FAILED", a.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", a.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", a.PADDING_ERROR = "PADDING_ERROR", a))(R || {});
class P {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(e, t) {
    try {
      const s = e.replace(/^0x/, "");
      let i = t.replace(/^0x/, "");
      if (s.length !== 64)
        throw new k(
          "Invalid private key length",
          R.INVALID_KEY
        );
      if (i.length === 64)
        i = "02" + i;
      else if (i.length !== 66 || !i.startsWith("02") && !i.startsWith("03"))
        throw new k(
          "Invalid public key format",
          R.INVALID_KEY
        );
      const r = Qe(s, i, !0).slice(1);
      return Fe(ie, r, this.SALT, new Uint8Array(0), 32);
    } catch (s) {
      throw s instanceof k ? s : new k(
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
        throw new k(
          "Invalid conversation key length",
          R.INVALID_KEY
        );
      if (t.length !== this.NONCE_SIZE)
        throw new k(
          "Invalid nonce length",
          R.INVALID_NONCE
        );
      const s = Fe(ie, e, new Uint8Array(0), t, 76);
      return {
        chachaKey: s.slice(0, 32),
        // bytes 0-31
        chachaNonce: s.slice(32, 44),
        // bytes 32-43 (12 bytes)
        hmacKey: s.slice(44, 76)
        // bytes 44-75
      };
    } catch (s) {
      throw new k(
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
      throw new k(
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
    const t = e.length, s = this.calculatePaddedLength(t + 2), i = new Uint8Array(s);
    return i[0] = t >>> 8 & 255, i[1] = t & 255, i.set(e, 2), i;
  }
  /**
   * Remove padding from decrypted data
   * Format: [plaintext_length: u16][plaintext][zero_bytes]
   */
  static removePadding(e) {
    if (e.length < 2)
      throw new k(
        "Invalid padded data length",
        R.PADDING_ERROR
      );
    const t = e[0] << 8 | e[1];
    if (t > e.length - 2)
      throw new k(
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
        throw new k(
          "Plaintext cannot be null or undefined",
          R.INVALID_PLAINTEXT_LENGTH
        );
      const i = new TextEncoder().encode(e), n = s || this.generateNonce(), r = this.deriveMessageKeys(t, n), o = this.applyPadding(i), c = $e(
        r.chachaKey,
        r.chachaNonce,
        o
      ), l = new Uint8Array(n.length + c.length);
      l.set(n, 0), l.set(c, n.length);
      const u = de(ie, r.hmacKey, l), g = new Uint8Array(
        this.VERSION_SIZE + n.length + c.length + this.MAC_SIZE
      );
      let d = 0;
      return g[d] = this.VERSION, d += this.VERSION_SIZE, g.set(n, d), d += n.length, g.set(c, d), d += c.length, g.set(u, d), {
        payload: btoa(String.fromCharCode(...g)),
        nonce: n
      };
    } catch (i) {
      throw i instanceof k ? i : new k(
        `Encryption failed: ${i.message}`,
        R.ENCRYPTION_FAILED,
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
      const n = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (i.length < n)
        throw new k(
          "Payload too short",
          R.INVALID_PAYLOAD
        );
      let r = 0;
      const o = i[r];
      if (r += this.VERSION_SIZE, o !== this.VERSION)
        throw new k(
          `Unsupported version: ${o}`,
          R.INVALID_PAYLOAD
        );
      const c = i.slice(r, r + this.NONCE_SIZE);
      r += this.NONCE_SIZE;
      const l = i.slice(r, -this.MAC_SIZE), u = i.slice(-this.MAC_SIZE), g = this.deriveMessageKeys(t, c), d = new Uint8Array(c.length + l.length);
      d.set(c, 0), d.set(l, c.length);
      const p = de(ie, g.hmacKey, d);
      let f = !0;
      for (let M = 0; M < this.MAC_SIZE; M++)
        u[M] !== p[M] && (f = !1);
      if (!f)
        return {
          plaintext: "",
          isValid: !1
        };
      const w = $e(
        g.chachaKey,
        g.chachaNonce,
        l
      ), I = this.removePadding(w);
      return {
        plaintext: new TextDecoder().decode(I),
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
      for (let n = 0; n < t.length; n++)
        s[n] = t.charCodeAt(n);
      const i = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      return !(s.length < i || s[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
h(P, "VERSION", 2), h(P, "SALT", new TextEncoder().encode(Ct.saltInfo)), h(P, "NONCE_SIZE", 32), h(P, "CHACHA_KEY_SIZE", 32), h(P, "CHACHA_NONCE_SIZE", 12), h(P, "HMAC_KEY_SIZE", 32), h(P, "MAC_SIZE", 32), h(P, "VERSION_SIZE", 1);
class y extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP59Error";
  }
}
var b = /* @__PURE__ */ ((a) => (a.INVALID_RUMOR = "INVALID_RUMOR", a.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", a.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", a.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", a.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", a.DECRYPTION_FAILED = "DECRYPTION_FAILED", a.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", a.INVALID_SEAL = "INVALID_SEAL", a.NO_RECIPIENTS = "NO_RECIPIENTS", a.INVALID_RECIPIENT = "INVALID_RECIPIENT", a))(b || {});
const Z = {
  SEAL_KIND: 13,
  GIFT_WRAP_KIND: 1059,
  MAX_TIMESTAMP_AGE_SECONDS: 2 * 24 * 60 * 60,
  // 2 days
  MIN_TIMESTAMP_AGE_SECONDS: 0
  // Can be current time
};
class we {
  /**
   * Create a kind 13 seal containing the encrypted rumor
   * The seal is signed by the sender's real private key
   */
  static async createSeal(e, t, s) {
    try {
      this.validateRumor(e), this.validatePrivateKey(t), this.validatePublicKey(s);
      const i = JSON.stringify(e), n = P.deriveConversationKey(
        t,
        s
      ), r = P.encrypt(i, n), o = this.getPublicKeyFromPrivate(t), c = {
        pubkey: o,
        created_at: Math.floor(Date.now() / 1e3),
        kind: Z.SEAL_KIND,
        tags: [],
        // Always empty for seals
        content: r.payload
      }, l = this.calculateEventId(c), u = await this.signEvent(c, l, t);
      return {
        id: l,
        pubkey: o,
        created_at: c.created_at,
        kind: Z.SEAL_KIND,
        tags: [],
        content: r.payload,
        sig: u
      };
    } catch (i) {
      throw i instanceof y ? i : new y(
        `Seal creation failed: ${i.message}`,
        b.SEAL_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt a seal to recover the original rumor
   */
  static decryptSeal(e, t) {
    try {
      if (e.kind !== Z.SEAL_KIND)
        return { rumor: null, isValid: !1 };
      if (e.tags.length !== 0)
        return { rumor: null, isValid: !1 };
      const s = P.deriveConversationKey(
        t,
        e.pubkey
      ), i = P.decrypt(e.content, s);
      if (!i.isValid)
        return { rumor: null, isValid: !1 };
      const n = JSON.parse(i.plaintext);
      return this.isValidRumor(n) ? { rumor: n, isValid: !0 } : { rumor: null, isValid: !1 };
    } catch {
      return { rumor: null, isValid: !1 };
    }
  }
  /**
   * Validate rumor structure
   */
  static validateRumor(e) {
    if (!e || typeof e != "object")
      throw new y(
        "Rumor must be a valid object",
        b.INVALID_RUMOR
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new y(
        "Rumor must have valid pubkey",
        b.INVALID_RUMOR
      );
    if (typeof e.created_at != "number" || e.created_at <= 0)
      throw new y(
        "Rumor must have valid created_at timestamp",
        b.INVALID_RUMOR
      );
    if (typeof e.kind != "number" || e.kind < 0 || e.kind > 65535)
      throw new y(
        "Rumor must have valid kind",
        b.INVALID_RUMOR
      );
    if (!Array.isArray(e.tags))
      throw new y(
        "Rumor must have valid tags array",
        b.INVALID_RUMOR
      );
    if (typeof e.content != "string")
      throw new y(
        "Rumor must have valid content string",
        b.INVALID_RUMOR
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
      throw new y(
        "Invalid private key format",
        b.SEAL_CREATION_FAILED
      );
  }
  /**
   * Validate public key format
   */
  static validatePublicKey(e) {
    if (typeof e != "string" || !/^[0-9a-f]{64}$/i.test(e))
      throw new y(
        "Invalid public key format",
        b.SEAL_CREATION_FAILED
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
        e.match(/.{1,2}/g).map((r) => parseInt(r, 16))
      );
      console.log("📊 privateKeyBytes:", {
        length: t.length,
        type: t.constructor.name,
        first4: Array.from(t.slice(0, 4))
      });
      const i = se.getPublicKey(t, !1).slice(1, 33), n = Array.from(i).map((r) => r.toString(16).padStart(2, "0")).join("");
      return console.log("✅ Successfully derived public key:", n.substring(0, 8) + "..."), n;
    } catch (t) {
      throw console.error("❌ SealCreator getPublicKeyFromPrivate error:", {
        error: t,
        message: t.message,
        stack: t.stack,
        privateKeyInfo: {
          type: typeof e,
          length: e == null ? void 0 : e.length
        }
      }), new y(
        "Failed to derive public key from private key",
        b.SEAL_CREATION_FAILED,
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
    ]), s = ie(new TextEncoder().encode(t));
    return Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const i = await se.schnorr.sign(t, s);
      return Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
    } catch (i) {
      throw new y(
        "Failed to sign seal event",
        b.SEAL_CREATION_FAILED,
        i
      );
    }
  }
}
class Ee {
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair() {
    try {
      const e = oe(32), t = Array.from(e).map((r) => r.toString(16).padStart(2, "0")).join(""), i = se.getPublicKey(t, !1).slice(1, 33), n = Array.from(i).map((r) => r.toString(16).padStart(2, "0")).join("");
      return {
        privateKey: t,
        publicKey: n
      };
    } catch (e) {
      throw new y(
        `Ephemeral key generation failed: ${e.message}`,
        b.EPHEMERAL_KEY_GENERATION_FAILED,
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
      throw new y(
        "Key pair count must be greater than 0",
        b.EPHEMERAL_KEY_GENERATION_FAILED
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
      const s = se.getPublicKey(e.privateKey, !1).slice(1, 33), i = Array.from(s).map((n) => n.toString(16).padStart(2, "0")).join("");
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
      const t = oe(32).reduce((s, i) => s + i.toString(16).padStart(2, "0"), "");
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
class ke {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(e = Z.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      if (e < 0)
        throw new y(
          "Max age seconds cannot be negative",
          b.TIMESTAMP_RANDOMIZATION_FAILED
        );
      const t = Math.floor(Date.now() / 1e3);
      if (e === 0)
        return t;
      const s = this.generateSecureRandomOffset(e);
      return t - s;
    } catch (t) {
      throw t instanceof y ? t : new y(
        `Timestamp randomization failed: ${t.message}`,
        b.TIMESTAMP_RANDOMIZATION_FAILED,
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
  static generateMultipleRandomizedTimestamps(e, t = Z.MAX_TIMESTAMP_AGE_SECONDS) {
    if (e <= 0)
      throw new y(
        "Timestamp count must be greater than 0",
        b.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let i = 0; i < e; i++)
      s.push(this.generateRandomizedTimestamp(t));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(e, t = Z.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      const s = Math.floor(Date.now() / 1e3), i = s - t, n = s + 60;
      return e >= i && e <= n;
    } catch {
      return !1;
    }
  }
  /**
   * Get the recommended timestamp randomization window for NIP-59
   */
  static getRecommendedMaxAge() {
    return Z.MAX_TIMESTAMP_AGE_SECONDS;
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
      throw new y(
        "Window start must be before window end",
        b.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = t - e, i = this.generateSecureRandomOffset(s);
    return e + i;
  }
}
class ve {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(e, t, s, i) {
    try {
      this.validateSeal(e), this.validateRecipient(t);
      const n = s || Ee.generateEphemeralKeyPair();
      if (!Ee.validateEphemeralKeyPair(n))
        throw new y(
          "Invalid ephemeral key pair",
          b.GIFT_WRAP_CREATION_FAILED
        );
      const r = i || ke.generateRandomizedTimestamp(), o = JSON.stringify(e), c = P.deriveConversationKey(
        n.privateKey,
        t.pubkey
      ), l = P.encrypt(o, c), u = t.relayHint ? ["p", t.pubkey, t.relayHint] : ["p", t.pubkey], g = {
        pubkey: n.publicKey,
        created_at: r,
        kind: Z.GIFT_WRAP_KIND,
        tags: [u],
        content: l.payload
      }, d = this.calculateEventId(g), p = await this.signEvent(g, d, n.privateKey);
      return {
        giftWrap: {
          id: d,
          pubkey: n.publicKey,
          created_at: r,
          kind: Z.GIFT_WRAP_KIND,
          tags: [u],
          content: l.payload,
          sig: p
        },
        ephemeralKeyPair: n,
        recipient: t.pubkey
      };
    } catch (n) {
      throw n instanceof y ? n : new y(
        `Gift wrap creation failed: ${n.message}`,
        b.GIFT_WRAP_CREATION_FAILED,
        n
      );
    }
  }
  /**
   * Create multiple gift wraps for multiple recipients
   * Each recipient gets their own gift wrap with unique ephemeral key
   */
  static async createMultipleGiftWraps(e, t) {
    if (!t || t.length === 0)
      throw new y(
        "At least one recipient is required",
        b.NO_RECIPIENTS
      );
    const s = [], i = Ee.generateMultipleEphemeralKeyPairs(
      t.length
    ), n = ke.generateMultipleRandomizedTimestamps(
      t.length
    );
    for (let r = 0; r < t.length; r++) {
      const o = await this.createGiftWrap(
        e,
        t[r],
        i[r],
        n[r]
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
      const s = P.deriveConversationKey(
        t,
        e.pubkey
      ), i = P.decrypt(e.content, s);
      if (!i.isValid)
        return { seal: null, isValid: !1 };
      const n = JSON.parse(i.plaintext);
      return this.isValidSeal(n) ? { seal: n, isValid: !0 } : { seal: null, isValid: !1 };
    } catch {
      return { seal: null, isValid: !1 };
    }
  }
  /**
   * Validate seal structure
   */
  static validateSeal(e) {
    if (!e || typeof e != "object")
      throw new y(
        "Seal must be a valid object",
        b.INVALID_SEAL
      );
    if (e.kind !== Z.SEAL_KIND)
      throw new y(
        "Seal must have kind 13",
        b.INVALID_SEAL
      );
    if (!Array.isArray(e.tags) || e.tags.length !== 0)
      throw new y(
        "Seal must have empty tags array",
        b.INVALID_SEAL
      );
    if (typeof e.content != "string")
      throw new y(
        "Seal must have valid content string",
        b.INVALID_SEAL
      );
  }
  /**
   * Validate recipient configuration
   */
  static validateRecipient(e) {
    if (!e || typeof e != "object")
      throw new y(
        "Recipient must be a valid object",
        b.INVALID_RECIPIENT
      );
    if (typeof e.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(e.pubkey))
      throw new y(
        "Recipient must have valid pubkey",
        b.INVALID_RECIPIENT
      );
    if (e.relayHint && typeof e.relayHint != "string")
      throw new y(
        "Recipient relay hint must be a string if provided",
        b.INVALID_RECIPIENT
      );
  }
  /**
   * Check if an object is a valid gift wrap (for decryption)
   */
  static isValidGiftWrap(e) {
    return e && typeof e == "object" && e.kind === Z.GIFT_WRAP_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length > 0 && Array.isArray(e.tags[0]) && e.tags[0][0] === "p" && typeof e.tags[0][1] == "string";
  }
  /**
   * Check if an object is a valid seal (for decryption)
   */
  static isValidSeal(e) {
    return e && typeof e == "object" && e.kind === Z.SEAL_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length === 0;
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
    ]), s = ie(new TextEncoder().encode(t));
    return Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const i = await se.schnorr.sign(t, s);
      return Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
    } catch (i) {
      throw new y(
        "Failed to sign gift wrap event",
        b.GIFT_WRAP_CREATION_FAILED,
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
class ce {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(e, t, s, i) {
    try {
      this.validateCreateDMInputs(e, t, s);
      const n = this.createRumor(e, t, i), r = [];
      for (const c of s.recipients) {
        const l = await we.createSeal(
          n,
          t,
          c.pubkey
        ), u = await ve.createGiftWrap(
          l,
          {
            pubkey: c.pubkey,
            relayHint: c.relayHint || s.relayHint
          }
        );
        r.push(u);
      }
      const o = await we.createSeal(
        n,
        t,
        s.recipients[0].pubkey
      );
      return {
        rumor: n,
        seal: o,
        giftWraps: r,
        senderPrivateKey: t
      };
    } catch (n) {
      throw n instanceof y ? n : new y(
        `Gift wrap protocol failed: ${n.message}`,
        b.GIFT_WRAP_CREATION_FAILED,
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
      const s = ve.decryptGiftWrap(
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
      const i = s.seal, n = we.decryptSeal(
        i,
        t
      );
      return n.isValid ? {
        rumor: n.rumor,
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
    const i = this.getPublicKeyFromPrivate(t), n = [];
    return s && n.push(["subject", s]), {
      pubkey: i,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 14,
      // Chat message kind (NIP-17, not 4)
      tags: n,
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
    return e.filter((s) => ve.getRecipientFromGiftWrap(s) === t);
  }
  /**
   * Decrypt multiple gift wraps for a recipient
   * Returns successful decryptions and filters out invalid ones
   */
  static async decryptMultipleGiftWraps(e, t) {
    const s = [];
    for (const i of e) {
      const n = await this.decryptGiftWrappedDM(i, t);
      n.isValid && s.push(n);
    }
    return s;
  }
  /**
   * Validate inputs for creating gift-wrapped DMs
   */
  static validateCreateDMInputs(e, t, s) {
    if (typeof e != "string")
      throw new y(
        "Message must be a string",
        b.INVALID_RUMOR
      );
    if (typeof t != "string" || !/^[0-9a-f]{64}$/i.test(t))
      throw new y(
        "Invalid sender private key format",
        b.SEAL_CREATION_FAILED
      );
    if (!s || !Array.isArray(s.recipients) || s.recipients.length === 0)
      throw new y(
        "At least one recipient is required",
        b.NO_RECIPIENTS
      );
    for (const i of s.recipients)
      if (!i || typeof i.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(i.pubkey))
        throw new y(
          "Invalid recipient public key format",
          b.INVALID_RECIPIENT
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
        e.match(/.{1,2}/g).map((r) => parseInt(r, 16))
      );
      console.log("📊 privateKeyBytes:", {
        length: t.length,
        type: t.constructor.name,
        first4: Array.from(t.slice(0, 4))
      });
      const i = se.getPublicKey(t, !1).slice(1, 33), n = Array.from(i).map((r) => r.toString(16).padStart(2, "0")).join("");
      return console.log("✅ Successfully derived public key:", n.substring(0, 8) + "..."), n;
    } catch (t) {
      throw console.error("❌ GiftWrapProtocol getPublicKeyFromPrivate error:", {
        error: t,
        message: t.message,
        stack: t.stack,
        privateKeyInfo: {
          type: typeof e,
          length: e == null ? void 0 : e.length
        }
      }), new y(
        "Failed to derive public key from private key",
        b.SEAL_CREATION_FAILED,
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
    const t = e.length, s = e.reduce((c, l) => c + l.giftWraps.length, 0), i = Math.floor(Date.now() / 1e3), n = e.flatMap(
      (c) => c.giftWraps.map((l) => i - l.giftWrap.created_at)
    ), r = n.length > 0 ? n.reduce((c, l) => c + l, 0) / n.length : 0, o = new Set(
      e.flatMap((c) => c.giftWraps.map((l) => l.recipient))
    );
    return {
      totalMessages: t,
      totalGiftWraps: s,
      averageTimestampAge: r,
      uniqueRecipients: o.size
    };
  }
}
class je {
  constructor(e) {
    h(this, "_state");
    h(this, "subscription");
    h(this, "config");
    // Reactive store properties
    h(this, "messages");
    h(this, "status");
    h(this, "latest");
    h(this, "error");
    h(this, "subject");
    this.config = e, this._state = A({
      messages: [],
      status: "connecting",
      latest: null,
      isTyping: !1,
      error: null,
      subject: e.subject
    }), this.messages = E(this._state, (t) => t.messages), this.status = E(this._state, (t) => t.status), this.latest = E(this._state, (t) => t.latest), this.error = E(this._state, (t) => t.error), this.subject = E(this._state, (t) => t.subject), this.initializeSubscription();
  }
  /**
   * Send an encrypted direct message
   */
  async send(e, t) {
    var s;
    try {
      this.updateStatus("active");
      const i = this.generateMessageId(), n = Math.floor(Date.now() / 1e3), r = {
        id: i,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp: n,
        isFromMe: !0,
        status: "sending",
        subject: t || this.getCurrentSubject()
      };
      this.addMessage(r);
      const o = ce.createSimpleConfig(
        this.config.recipientPubkey,
        (s = this.config.relayHints) == null ? void 0 : s[0]
      ), c = await ce.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        o,
        t
      );
      let l = !1, u;
      for (const g of c.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(g.giftWrap)).some((f) => f.success) && (l = !0, r.eventId = g.giftWrap.id);
        } catch (d) {
          u = d instanceof Error ? d.message : "Publishing failed";
        }
      if (l)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`DM sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const g = u || "Failed to publish to any relay";
        return this.setError(g), { success: !1, error: g, messageId: i };
      }
    } catch (i) {
      const n = i instanceof Error ? i.message : "Unknown error sending message";
      return this.setError(n), { success: !1, error: n };
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
      const t = await ce.decryptGiftWrappedDM(
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
        (r) => r.eventId === e.id || r.content === s.content && Math.abs(r.timestamp - s.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(s), this.config.debug && console.log(`Received DM from ${t.senderPubkey}: ${s.content}`));
    } catch (t) {
      this.config.debug && console.error("Error handling incoming DM event:", t);
    }
  }
  addMessage(e) {
    this._state.update((t) => {
      const s = [...t.messages, e];
      return s.sort((i, n) => i.timestamp - n.timestamp), {
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
class Ye {
  constructor(e) {
    h(this, "_state");
    h(this, "subscription");
    h(this, "config");
    h(this, "roomId");
    // Reactive store properties
    h(this, "messages");
    h(this, "status");
    h(this, "latest");
    h(this, "subject");
    h(this, "participants");
    h(this, "error");
    var t;
    this.config = e, this.roomId = this.generateRoomId(), this._state = A({
      messages: [],
      status: "connecting",
      latest: null,
      subject: ((t = e.options) == null ? void 0 : t.subject) || "Group Chat",
      participants: [...e.participants, e.senderPubkey],
      // Include sender
      isTyping: !1,
      error: null
    }), this.messages = E(this._state, (s) => s.messages), this.status = E(this._state, (s) => s.status), this.latest = E(this._state, (s) => s.latest), this.subject = E(this._state, (s) => s.subject), this.participants = E(this._state, (s) => s.participants), this.error = E(this._state, (s) => s.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted message to all room participants
   */
  async send(e) {
    var t, s;
    try {
      this.updateStatus("active");
      const i = this.generateMessageId(), n = Math.floor(Date.now() / 1e3), r = this.getCurrentSubject(), o = this.getCurrentParticipants(), c = {
        id: i,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: n,
        isFromMe: !0,
        status: "sending",
        subject: r,
        participants: o
      };
      this.addMessage(c);
      const u = {
        recipients: o.filter((f) => f !== this.config.senderPubkey).map((f) => ({ pubkey: f })),
        relayHint: (s = (t = this.config.options) == null ? void 0 : t.relayHints) == null ? void 0 : s[0]
      }, g = await ce.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        u
      );
      let d = !1, p;
      for (const f of g.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(f.giftWrap)).some((v) => v.success) && (d = !0, c.eventId = f.giftWrap.id);
        } catch (w) {
          p = w instanceof Error ? w.message : "Publishing failed";
        }
      if (d)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`Room message sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const f = p || "Failed to publish to any relay";
        return this.setError(f), { success: !1, error: f, messageId: i };
      }
    } catch (i) {
      const n = i instanceof Error ? i.message : "Unknown error sending message";
      return this.setError(n), { success: !1, error: n };
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
      const t = await ce.decryptGiftWrappedDM(
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
      const i = this.extractSubjectFromRumor(t.rumor), n = this.getCurrentSubject(), r = {
        id: this.generateMessageId(),
        content: t.rumor.content,
        senderPubkey: t.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: t.rumor.created_at,
        isFromMe: !1,
        eventId: e.id,
        status: "received",
        subject: i || n,
        participants: s
      };
      this.getCurrentMessages().some(
        (l) => l.eventId === e.id || l.content === r.content && Math.abs(l.timestamp - r.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(r), this.config.debug && console.log(`Received room message from ${t.senderPubkey}: ${r.content}`));
    } catch (t) {
      this.config.debug && console.error("Error handling incoming room event:", t);
    }
  }
  addMessage(e) {
    this._state.update((t) => {
      const s = [...t.messages, e];
      return s.sort((i, n) => i.timestamp - n.timestamp), {
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
class Ze {
  constructor(e) {
    h(this, "conversations", /* @__PURE__ */ new Map());
    h(this, "rooms", /* @__PURE__ */ new Map());
    h(this, "config");
    h(this, "_senderPubkey", null);
    h(this, "_senderPrivateKey", null);
    // Reactive stores
    h(this, "_conversationList", A([]));
    h(this, "conversations$");
    this.config = e, this.conversations$ = this._conversationList, this.config.signingProvider && this.initializeSender();
  }
  /**
   * Get or create a conversation with a specific user
   * This is the main entry point: nostr.dm.with('npub...')
   */
  async with(e) {
    const t = this.normalizePubkey(e);
    let s = this.conversations.get(t);
    return s || (s = await this.createConversation(t), this.conversations.set(t, s), this.updateConversationList(), this.config.debug && console.log(`Created new DM conversation with ${t}`)), s;
  }
  /**
   * Create or get a multi-participant room
   * This is the main entry point: nostr.dm.room(['pubkey1', 'pubkey2'], { subject: 'Meeting' })
   */
  async room(e, t) {
    const s = e.map((r) => this.normalizePubkey(r)), i = this.generateRoomId(s);
    let n = this.rooms.get(i);
    return n || (n = await this.createRoom(s, t), this.rooms.set(i, n), this.updateConversationList(), this.config.debug && console.log(`Created new DM room: ${i} with ${s.length} participants`)), n;
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
    }, i = new je(s);
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
    }, n = new Ye(i);
    return this.setupRoomReactivity(n), n;
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
      let i = null, n = "disconnected", r;
      const o = t.latest.subscribe((u) => {
        i = u;
      }), c = t.status.subscribe((u) => {
        n = u;
      }), l = t.subject.subscribe((u) => {
        r = u;
      });
      o(), c(), l(), e.push({
        pubkey: s,
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: n === "active" || n === "connecting",
        subject: r,
        type: "conversation"
      });
    }), this.rooms.forEach((t, s) => {
      let i = null, n = "disconnected", r = "", o = [];
      const c = t.latest.subscribe((d) => {
        i = d;
      }), l = t.status.subscribe((d) => {
        n = d;
      }), u = t.subject.subscribe((d) => {
        r = d;
      }), g = t.participants.subscribe((d) => {
        o = d;
      });
      c(), l(), u(), g(), e.push({
        pubkey: s,
        // Use roomId as the identifier
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: n === "active" || n === "connecting",
        subject: r,
        participants: o,
        type: "room"
      });
    }), e.sort((t, s) => s.lastActivity - t.lastActivity), this._conversationList.set(e);
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
}
class Dt {
  constructor(e) {
    h(this, "config");
    h(this, "profileCache", /* @__PURE__ */ new Map());
    h(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // pubkey -> subscriptionId
    // Reactive stores
    h(this, "_myProfile", A(null));
    h(this, "_profileUpdates", A(/* @__PURE__ */ new Map()));
    // Public reactive properties
    h(this, "mine");
    h(this, "updates");
    this.config = e, this.mine = this._myProfile, this.updates = this._profileUpdates, this.config.signingProvider && this.initializeOwnProfile();
  }
  /**
   * Create a new user profile
   */
  async create(e) {
    try {
      if (!this.config.signingProvider)
        return {
          success: !1,
          error: "No signing provider available"
        };
      const t = this.validateProfileData(e);
      if (!t.isValid)
        return {
          success: !1,
          error: `Invalid profile data: ${t.errors.join(", ")}`
        };
      const s = await this.config.signingProvider.getPublicKey(), i = await this.config.eventBuilder.kind(0).content(JSON.stringify(e)).build();
      if ((await this.config.relayManager.publishToAll(i)).some((o) => o.success)) {
        const o = {
          pubkey: s,
          metadata: e,
          lastUpdated: i.created_at,
          eventId: i.id,
          isOwn: !0
        };
        return this._myProfile.set(o), this._profileUpdates.update((c) => (c.set(s, o), new Map(c))), this.cacheProfile(o), this.config.debug && console.log("Profile created successfully:", o), {
          success: !0,
          eventId: i.id,
          profile: o
        };
      } else
        return {
          success: !1,
          error: "Failed to publish profile to any relay"
        };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error creating profile"
      };
    }
  }
  /**
   * Update existing user profile
   */
  async update(e) {
    try {
      if (!this.config.signingProvider)
        return {
          success: !1,
          error: "No signing provider available"
        };
      const t = await this.getMine();
      if (!t)
        return e.name ? this.create(e) : {
          success: !1,
          error: "Name is required for profile creation"
        };
      const s = {
        ...t.metadata,
        ...e
      }, i = this.validateProfileData(s);
      if (!i.isValid)
        return {
          success: !1,
          error: `Invalid profile data: ${i.errors.join(", ")}`
        };
      const n = await this.config.signingProvider.getPublicKey(), r = await this.config.eventBuilder.kind(0).content(JSON.stringify(s)).build();
      if ((await this.config.relayManager.publishToAll(r)).some((l) => l.success)) {
        const l = {
          pubkey: n,
          metadata: s,
          lastUpdated: r.created_at,
          eventId: r.id,
          isOwn: !0
        };
        return this._myProfile.set(l), this._profileUpdates.update((u) => (u.set(n, l), new Map(u))), this.cacheProfile(l), this.config.debug && console.log("Profile updated successfully:", l), {
          success: !0,
          eventId: r.id,
          profile: l
        };
      } else
        return {
          success: !1,
          error: "Failed to publish profile update to any relay"
        };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error updating profile"
      };
    }
  }
  /**
   * Get current user's profile
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
   * Get profile for any user by pubkey
   */
  async get(e, t = {}) {
    try {
      if (t.useCache !== !1) {
        const i = this.getCachedProfile(e);
        if (i)
          return i;
      }
      const s = {
        kinds: [0],
        authors: [e],
        limit: 1
      };
      return new Promise((i) => {
        let n = !1;
        const r = setTimeout(() => {
          n || (n = !0, i(null));
        }, t.timeout || 5e3);
        this.config.subscriptionManager.subscribe([s], {
          onEvent: (o) => {
            if (!n && o.kind === 0) {
              n = !0, clearTimeout(r);
              try {
                const c = this.parseProfileEvent(o);
                this.cacheProfile(c), this._profileUpdates.update((l) => (l.set(e, c), new Map(l))), i(c);
              } catch {
                i(null);
              }
            }
          },
          onEose: () => {
            n || (n = !0, clearTimeout(r), i(null));
          }
        });
      });
    } catch (s) {
      return this.config.debug && console.error("Error fetching profile:", s), null;
    }
  }
  /**
   * Update signing provider
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e, await this.initializeOwnProfile();
  }
  /**
   * Close all subscriptions and cleanup
   */
  async close() {
    const e = Array.from(this.activeSubscriptions.values()).map(
      (t) => this.config.subscriptionManager.close(t)
    );
    await Promise.allSettled(e), this.activeSubscriptions.clear(), this.profileCache.clear(), this.config.subscriptionManager.close && await this.config.subscriptionManager.close(), this.config.debug && console.log("ProfileManager: Closed all subscriptions and cleared cache");
  }
  // Private helper methods
  async initializeOwnProfile() {
    try {
      const e = await this.getMine();
      e && (this._myProfile.set(e), this.config.debug && console.log("Initialized own profile:", e));
    } catch (e) {
      this.config.debug && console.error("Failed to initialize own profile:", e);
    }
  }
  parseProfileEvent(e) {
    var s;
    const t = JSON.parse(e.content);
    return (s = this.config.signingProvider) != null && s.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve(""), {
      pubkey: e.pubkey,
      metadata: t,
      lastUpdated: e.created_at,
      eventId: e.id,
      isOwn: !1
      // Will be updated based on pubkey comparison
    };
  }
  validateProfileData(e) {
    const t = [], s = [];
    return e.picture && !this.isValidUrl(e.picture) && t.push("Invalid picture URL"), e.banner && !this.isValidUrl(e.banner) && t.push("Invalid banner URL"), e.website && !this.isValidUrl(e.website) && t.push("Invalid website URL"), e.nip05 && !this.isValidNip05(e.nip05) && s.push("Invalid NIP-05 identifier format"), e.about && e.about.length > 500 && s.push("About section is quite long"), {
      isValid: t.length === 0,
      errors: t,
      warnings: s
    };
  }
  isValidUrl(e) {
    try {
      return new URL(e), !0;
    } catch {
      return !1;
    }
  }
  isValidNip05(e) {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e);
  }
  cacheProfile(e) {
    const t = {
      profile: e,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 6e5
      // 10 minutes
    };
    this.profileCache.set(e.pubkey, t);
  }
  getCachedProfile(e) {
    const t = this.profileCache.get(e);
    return t && t.expiresAt > Date.now() ? t.profile : (t && this.profileCache.delete(e), null);
  }
}
class Lt {
  constructor(e) {
    h(this, "config");
    h(this, "contactCache", /* @__PURE__ */ new Map());
    h(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // pubkey -> subscriptionId
    // Reactive stores
    h(this, "_myContacts", A(null));
    h(this, "_contactUpdates", A(/* @__PURE__ */ new Map()));
    // Public reactive properties
    h(this, "mine");
    h(this, "updates");
    this.config = e, this.mine = E(this._myContacts, (t) => t), this.updates = E(this._contactUpdates, (t) => t), this.config.signingProvider && this.initializeOwnContacts();
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
      const t = await this.getMine(), s = t ? [...t.contacts] : [], i = s.findIndex((n) => n.pubkey === e.pubkey);
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
        let n = !1;
        const r = setTimeout(() => {
          n || (n = !0, i(null));
        }, t.timeout || 5e3);
        this.config.subscriptionManager.subscribe([s], {
          onEvent: (o) => {
            if (!n && o.kind === 3) {
              n = !0, clearTimeout(r);
              try {
                const c = this.parseContactEvent(o);
                this.cacheContactList(c), this._contactUpdates.update((l) => (l.set(e, c), new Map(l))), i(c);
              } catch {
                i(null);
              }
            }
          },
          onEose: () => {
            n || (n = !0, clearTimeout(r), i(null));
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
      const t = await this.config.signingProvider.getPublicKey(), s = e.map((l) => {
        const u = ["p", l.pubkey];
        return l.relayUrl && u.push(l.relayUrl), l.petname && u.push(l.petname), u;
      }), i = await this.config.eventBuilder.kind(3).content("").tags(s).build(), n = await this.config.signingProvider.signEvent(i);
      if ((await this.config.relayManager.publishToAll(n)).filter((l) => l.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const c = {
        contacts: e,
        ownerPubkey: t,
        lastUpdated: n.created_at,
        eventId: n.id,
        isOwn: !0
      };
      return this._myContacts.set(c), this._contactUpdates.update((l) => (l.set(t, c), new Map(l))), this.cacheContactList(c), this.config.debug && console.log("Published contact list:", c), {
        success: !0,
        contactList: c,
        eventId: n.id
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
        const n = {
          pubkey: i[1],
          relayUrl: i[2] || void 0,
          petname: i[3] || void 0
        };
        t.push(n);
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
class Ot {
  constructor(e) {
    h(this, "config");
    h(this, "threadCache", /* @__PURE__ */ new Map());
    h(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // threadId -> subscriptionId
    // Reactive stores
    h(this, "_watchedThreads", A(/* @__PURE__ */ new Map()));
    h(this, "_threadUpdates", A(/* @__PURE__ */ new Map()));
    // Public reactive properties
    h(this, "watchedThreads");
    h(this, "updates");
    this.config = e, this.watchedThreads = E(this._watchedThreads, (t) => t), this.updates = E(this._threadUpdates, (t) => t);
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
        for (const u of e.mentions)
          s.push(["p", u]);
      const i = await this.config.eventBuilder.kind(1).content(e.content).tags(s).build(), n = await this.config.signingProvider.signEvent(i);
      if ((await this.config.relayManager.publishToAll(n)).filter((u) => u.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const c = {
        eventId: n.id,
        authorPubkey: t,
        content: e.content,
        createdAt: n.created_at,
        replyToEventId: null,
        // Root message
        rootEventId: n.id,
        // Self-reference for root
        mentionedPubkeys: e.mentions || [],
        depth: 0,
        isOwn: !0
      }, l = {
        rootEventId: n.id,
        messages: [c],
        messageCount: 1,
        lastActivity: n.created_at,
        isWatched: !1
      };
      return this.cacheThread(l), this._threadUpdates.update((u) => (u.set(n.id, l), new Map(u))), this.config.debug && console.log("Created thread:", l), {
        success: !0,
        eventId: n.id,
        message: c
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
      const i = new Set(e.mentions || []), n = await this.get(e.rootEventId);
      if (n) {
        const g = n.messages.find((d) => d.eventId === e.replyToEventId);
        g && i.add(g.authorPubkey);
      }
      for (const g of i)
        g !== t && s.push(["p", g]);
      const r = await this.config.eventBuilder.kind(1).content(e.content).tags(s).build(), o = await this.config.signingProvider.signEvent(r);
      if ((await this.config.relayManager.publishToAll(o)).filter((g) => g.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const u = {
        eventId: o.id,
        authorPubkey: t,
        content: e.content,
        createdAt: o.created_at,
        replyToEventId: e.replyToEventId,
        rootEventId: e.rootEventId,
        mentionedPubkeys: Array.from(i),
        depth: this.calculateDepth(e.replyToEventId, n),
        isOwn: !0
      };
      return n && (n.messages.push(u), n.messageCount = n.messages.length, n.lastActivity = o.created_at, this.cacheThread(n), this._threadUpdates.update((g) => (g.set(e.rootEventId, n), new Map(g)))), this.config.debug && console.log("Created reply:", u), {
        success: !0,
        eventId: o.id,
        message: u
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
      let n = !1;
      const r = [], o = /* @__PURE__ */ new Set(), c = setTimeout(() => {
        if (!n)
          if (n = !0, r.length > 0) {
            const l = this.buildThread(e, r);
            this.cacheThread(l), i(l);
          } else
            i(null);
      }, t.timeout || 5e3);
      this.config.subscriptionManager.subscribe(s, {
        onEvent: (l) => {
          if (l.kind === 1 && !o.has(l.id)) {
            o.add(l.id);
            const u = this.parseTextNoteEvent(l, e);
            u && r.push(u);
          }
        },
        onEose: () => {
          if (!n)
            if (n = !0, clearTimeout(c), r.length > 0) {
              const l = this.buildThread(e, r);
              this.cacheThread(l), this._threadUpdates.update((u) => (u.set(e, l), new Map(u))), i(l);
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
    const s = [], i = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set([e]), r = /* @__PURE__ */ new Set();
    let o = 0;
    const c = 5;
    for (; n.size > 0 && o < c; ) {
      o++;
      const u = Array.from(n);
      n.clear(), this.config.debug && console.log(`Thread fetch phase ${o}: querying ${u.length} events`);
      const g = [];
      u.length > 0 && g.push({
        ids: u,
        kinds: [1],
        limit: u.length
      });
      for (const p of u)
        r.has(p) || (g.push({
          kinds: [1],
          "#e": [p],
          limit: Math.floor((t.limit || 100) / Math.max(1, o))
          // Reduce limit per phase
        }), r.add(p));
      if (g.length === 0)
        break;
      const d = await this.fetchEventsWithFilters(g, e, i);
      for (const p of d)
        i.has(p.eventId) || (s.push(p), i.add(p.eventId), p.replyToEventId && !i.has(p.replyToEventId) && n.add(p.replyToEventId));
      if (this.config.debug && console.log(`Phase ${o} complete: found ${d.length} new messages, ${n.size} more to query`), d.length === 0)
        break;
    }
    if (s.length === 0)
      return null;
    const l = this.buildThread(e, s);
    return this.cacheThread(l), this._threadUpdates.update((u) => (u.set(e, l), new Map(u))), this.config.debug && console.log(`Complete thread built: ${l.messageCount} messages across ${o} phases`), l;
  }
  /**
   * Fetch events using provided filters and parse them
   */
  async fetchEventsWithFilters(e, t, s) {
    return new Promise((i) => {
      const n = [];
      let r = !1;
      const o = setTimeout(() => {
        r || (r = !0, i(n));
      }, 3e3);
      this.config.subscriptionManager.subscribe(e, {
        onEvent: (c) => {
          if (c.kind === 1 && !s.has(c.id)) {
            const l = this.parseTextNoteEvent(c, t);
            l && n.push(l);
          }
        },
        onEose: () => {
          r || (r = !0, clearTimeout(o), i(n));
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
      t.isWatched = !0, this.cacheThread(t), this._watchedThreads.update((n) => (n.set(e, t), new Map(n)));
      const s = {
        kinds: [1],
        "#e": [e],
        since: Math.floor(Date.now() / 1e3)
        // Only new messages
      }, i = await this.config.subscriptionManager.subscribe([s], {
        onEvent: (n) => {
          if (n.kind === 1) {
            const r = this.parseTextNoteEvent(n, e);
            r && !t.messages.find((o) => o.eventId === r.eventId) && (t.messages.push(r), t.messageCount = t.messages.length, t.lastActivity = r.createdAt, this.cacheThread(t), this._watchedThreads.update((o) => (o.set(e, { ...t }), new Map(o))), this._threadUpdates.update((o) => (o.set(e, { ...t }), new Map(o))));
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
      const i = this.parseNIP10Tags(e.tags), n = i.find((f) => f.meaning === "root"), r = i.find((f) => f.meaning === "reply"), o = i.filter((f) => f.meaning === "mention"), c = i.filter((f) => f.tagType === "e");
      let l, u = null, g = !1;
      if (n)
        l = n.value, g = l === t;
      else if (r)
        r.value === t ? (l = t, g = !0) : (l = r.value, g = c.some((f) => f.value === t), g && (l = t));
      else if (e.id === t)
        l = e.id, g = !0;
      else if (c.find((w) => w.value === t))
        l = t, g = !0;
      else
        return null;
      if (!g)
        return null;
      if (r)
        u = r.value;
      else if (c.length > 0 && e.id !== l)
        if (c.length === 1)
          u = c[0].value;
        else {
          const f = c[c.length - 1];
          f.value !== l && (u = f.value);
        }
      const d = o.map((f) => f.value), p = (s = this.config.signingProvider) != null && s.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
      return {
        eventId: e.id,
        authorPubkey: e.pubkey,
        content: e.content,
        createdAt: e.created_at,
        replyToEventId: u,
        rootEventId: l,
        mentionedPubkeys: d,
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
      const [n, r, o, c] = i;
      if (n === "e") {
        let l = "mention";
        c === "reply" ? l = "reply" : c === "root" && (l = "root"), t.push({
          tagType: "e",
          value: r,
          relayUrl: o || void 0,
          marker: c || void 0,
          meaning: l
        });
      } else n === "p" && t.push({
        tagType: "p",
        value: r,
        relayUrl: o || void 0,
        marker: c || void 0,
        meaning: "mention"
      });
    }
    const s = t.filter((i) => i.tagType === "e");
    return s.length > 0 && !s.some((i) => i.marker) && (s.length === 1 ? s[0].meaning = "reply" : s.length >= 2 && (s[0].meaning = "root", s[s.length - 1].meaning = "reply")), t;
  }
  buildThread(e, t) {
    t.sort((n, r) => n.createdAt - r.createdAt);
    const s = /* @__PURE__ */ new Map();
    for (const n of t)
      s.set(n.eventId, n), n.depth = -1;
    for (const n of t)
      n.depth === -1 && (n.depth = this.calculateMessageDepth(n, s));
    const i = t.length > 0 ? Math.max(...t.map((n) => n.createdAt)) : 0;
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
class xt {
  constructor(e) {
    h(this, "config");
    h(this, "reactionCache", /* @__PURE__ */ new Map());
    h(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // eventId -> subscriptionId
    // Reactive stores
    h(this, "_reactionUpdates", A(/* @__PURE__ */ new Map()));
    h(this, "_watchedEvents", A(/* @__PURE__ */ new Map()));
    // Public reactive properties
    h(this, "updates");
    h(this, "watchedEvents");
    this.config = e, this.updates = E(this._reactionUpdates, (t) => t), this.watchedEvents = E(this._watchedEvents, (t) => t);
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
      if (s && s.reactions.find((d) => d.authorPubkey === t))
        return {
          success: !1,
          error: "User has already reacted to this event"
        };
      const i = [
        ["e", e.targetEventId],
        // Event being reacted to
        ["p", e.targetAuthorPubkey]
        // Author of the event
      ], n = await this.config.eventBuilder.kind(7).content(e.reactionType).tags(i).build(), r = await this.config.signingProvider.signEvent(n);
      if ((await this.config.relayManager.publishToAll(r)).filter((g) => g.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const l = {
        eventId: r.id,
        authorPubkey: t,
        targetEventId: e.targetEventId,
        targetAuthorPubkey: e.targetAuthorPubkey,
        reactionType: e.reactionType,
        createdAt: r.created_at,
        isOwn: !0
      }, u = this.getCachedReactions(e.targetEventId);
      return u && (u.reactions.push(l), u.summary = this.aggregateReactions(u.reactions, t), u.timestamp = Date.now(), this.reactionCache.set(e.targetEventId, u), this._reactionUpdates.update((g) => (g.set(e.targetEventId, u.summary), new Map(g)))), this.config.debug && console.log("Created reaction:", l), {
        success: !0,
        eventId: r.id,
        reaction: l
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
        this._watchedEvents.update((n) => (n.set(e, t.summary), new Map(n)));
      else {
        const n = this.config.signingProvider ? await this.config.signingProvider.getPublicKey() : "", r = {
          targetEventId: e,
          totalCount: 0,
          reactions: {},
          userReacted: !1
        };
        this._watchedEvents.update((o) => (o.set(e, r), new Map(o)));
      }
      const s = {
        kinds: [7],
        "#e": [e],
        since: Math.floor(Date.now() / 1e3)
        // Only new reactions
      }, i = await this.config.subscriptionManager.subscribe([s], {
        onEvent: (n) => {
          if (n.kind === 7) {
            const r = this.parseReactionEvent(n);
            r && r.targetEventId === e && this.handleNewReaction(r);
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
      let n = !1;
      const r = [], o = /* @__PURE__ */ new Set(), c = setTimeout(() => {
        if (!n)
          if (n = !0, r.length > 0) {
            const l = this.buildReactionCache(e, r);
            this.cacheReactions(e, l), i(l);
          } else
            i(null);
      }, t.timeout || 5e3);
      this.config.subscriptionManager.subscribe(s, {
        onEvent: (l) => {
          if (l.kind === 7 && !o.has(l.id)) {
            o.add(l.id);
            const u = this.parseReactionEvent(l);
            u && u.targetEventId === e && r.push(u);
          }
        },
        onEose: () => {
          if (!n)
            if (n = !0, clearTimeout(c), r.length > 0) {
              const l = this.buildReactionCache(e, r);
              this.cacheReactions(e, l), i(l);
            } else
              i(null);
        }
      });
    });
  }
  parseReactionEvent(e) {
    var t;
    try {
      const s = e.tags.find((r) => r[0] === "e");
      if (!s || s.length < 2)
        return null;
      const i = e.tags.find((r) => r[0] === "p");
      if (!i || i.length < 2)
        return null;
      const n = (t = this.config.signingProvider) != null && t.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
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
    var r;
    const s = {};
    let i = !1, n;
    for (const o of e)
      typeof t == "string" && (o.isOwn = o.authorPubkey === t, o.isOwn && (i = !0, n = o.reactionType)), s[o.reactionType] || (s[o.reactionType] = {
        type: o.reactionType,
        count: 0,
        authors: []
      }), s[o.reactionType].count++, s[o.reactionType].authors.includes(o.authorPubkey) || s[o.reactionType].authors.push(o.authorPubkey);
    return {
      targetEventId: ((r = e[0]) == null ? void 0 : r.targetEventId) || "",
      totalCount: e.length,
      reactions: s,
      userReacted: i,
      userReactionType: n
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
      const n = (t == null ? void 0 : t.summary) || this.aggregateReactions([e], "");
      return i.set(e.targetEventId, n), new Map(i);
    }), this._watchedEvents.update((i) => {
      const n = (t == null ? void 0 : t.summary) || this.aggregateReactions([e], "");
      return i.set(e.targetEventId, n), new Map(i);
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
class Ft {
  constructor(e) {
    h(this, "config");
    h(this, "feedCache", /* @__PURE__ */ new Map());
    h(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // Reactive stores
    h(this, "_globalFeed", A([]));
    h(this, "_followingFeed", A([]));
    // Public reactive properties
    h(this, "globalFeed");
    h(this, "followingFeed");
    this.config = e, this.globalFeed = E(this._globalFeed, (t) => t), this.followingFeed = E(this._followingFeed, (t) => t);
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
        this._globalFeed.update((n) => [i, ...n.slice(0, 99)]);
      }
    });
    if (this.activeSubscriptions.set("global-updates", t), this.config.signingProvider)
      try {
        const s = await this.config.signingProvider.getPublicKey(), i = await this.config.contactManager.getContacts(s);
        if (i && i.followingList.length > 0) {
          const n = {
            kinds: [1],
            authors: i.followingList,
            since: Math.floor(Date.now() / 1e3),
            limit: 20
          }, r = await this.config.subscriptionManager.subscribe([n], {
            onEvent: (o) => {
              const c = this.eventToFeedItem(o);
              this._followingFeed.update((l) => [c, ...l.slice(0, 99)]);
            }
          });
          this.activeSubscriptions.set("following-updates", r);
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
      const n = [], r = /* @__PURE__ */ new Set(), o = setTimeout(() => {
        i || (i = !0, this.updateFeedStore(e, n), s(n));
      }, 1e4);
      this.config.subscriptionManager.subscribe(t, {
        onEvent: (c) => {
          if (!r.has(c.id)) {
            r.add(c.id);
            const l = this.eventToFeedItem(c);
            n.push(l);
          }
        },
        onEose: () => {
          i || (i = !0, clearTimeout(o), n.sort((c, l) => l.createdAt - c.createdAt), this.updateFeedStore(e, n), s(n));
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
class Ut {
  constructor(e) {
    h(this, "config");
    h(this, "_profileManager");
    h(this, "_contactManager");
    h(this, "_threadManager");
    h(this, "_reactionManager");
    h(this, "_feedManager");
    // Public API interfaces
    h(this, "profiles");
    h(this, "contacts");
    h(this, "threads");
    h(this, "reactions");
    h(this, "feeds");
    this.config = e, this._profileManager = new Dt({
      subscriptionManager: e.subscriptionManager,
      relayManager: e.relayManager,
      signingProvider: e.signingProvider,
      eventBuilder: e.eventBuilder,
      debug: e.debug
    }), this.profiles = this._profileManager, this.contacts = this.getContactManager(), this.threads = this.getThreadManager(), this.reactions = this.getReactionManager(), this.feeds = this.getFeedManager(), this.config.debug && console.log("SocialModule initialized with all managers");
  }
  /**
   * Update signing provider when it becomes available
   */
  async updateSigningProvider(e) {
    this.config.signingProvider = e, await this._profileManager.updateSigningProvider(e), this._contactManager && await this._contactManager.updateSigningProvider(e), this._threadManager && await this._threadManager.updateSigningProvider(e), this._reactionManager && await this._reactionManager.updateSigningProvider(e), this._feedManager && await this._feedManager.updateSigningProvider(e), this.config.debug && console.log("SocialModule: Updated signing provider for all managers");
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
      this._profileManager.close(),
      (e = this._contactManager) == null ? void 0 : e.close(),
      (t = this._threadManager) == null ? void 0 : t.close(),
      (s = this._reactionManager) == null ? void 0 : s.close(),
      (i = this._feedManager) == null ? void 0 : i.close()
    ]), this.config.debug && console.log("SocialModule: All managers closed");
  }
  // Lazy initialization methods for better performance
  getContactManager() {
    return this._contactManager || (this._contactManager = new Lt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      profileManager: this._profileManager,
      debug: this.config.debug
    })), this._contactManager;
  }
  getThreadManager() {
    return this._threadManager || (this._threadManager = new Ot({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      profileManager: this._profileManager,
      debug: this.config.debug
    })), this._threadManager;
  }
  getReactionManager() {
    return this._reactionManager || (this._reactionManager = new xt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      debug: this.config.debug
    })), this._reactionManager;
  }
  getFeedManager() {
    return this._feedManager || (this._feedManager = new Ft({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      profileManager: this._profileManager,
      contactManager: this.getContactManager(),
      reactionManager: this.getReactionManager(),
      debug: this.config.debug
    })), this._feedManager;
  }
}
class Kt {
  constructor(e) {
    h(this, "subscriptions", /* @__PURE__ */ new Map());
    h(this, "eventCallbacks", /* @__PURE__ */ new Map());
    h(this, "debug");
    this.relayManager = e, this.debug = e.debug || !1, this.setupRelayMessageHandling();
  }
  /**
   * Create a new subscription with given filters
   * Performance requirement: <100ms subscription creation
   */
  async subscribe(e, t = {}) {
    var s, i, n, r;
    try {
      const o = this.validateFilters(e);
      if (o)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: o
        };
      const c = this.generateSubscriptionId(), l = Date.now(), u = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, g = {
        id: c,
        filters: e,
        relays: u,
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
      u.forEach((v) => {
        g.relayStates[v] = "active";
      }), t.timeout && (g.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, t.timeout)), this.subscriptions.set(c, g), this.debug && console.log(`Creating subscription ${c} with ${e.length} filters`);
      const d = t.retryAttempts || 1, p = t.retryDelay || 1e3;
      let f = [], w;
      for (let v = 0; v < d; v++)
        try {
          const M = ["REQ", c, ...e];
          try {
            await ((i = (s = this.relayManager).sendToAll) == null ? void 0 : i.call(s, M)), f = u.map((C) => ({
              relay: C,
              success: !0,
              error: void 0
            }));
            break;
          } catch (C) {
            f = [];
            let J = !1;
            for (const re of u)
              try {
                await ((r = (n = this.relayManager).sendToRelays) == null ? void 0 : r.call(n, [re], M)), f.push({
                  relay: re,
                  success: !0,
                  error: void 0
                }), J = !0;
              } catch (S) {
                f.push({
                  relay: re,
                  success: !1,
                  error: S instanceof Error ? S : new Error("Unknown error")
                });
              }
            if (J)
              break;
            w = C instanceof Error ? C : new Error("All relays failed");
          }
        } catch (M) {
          w = M instanceof Error ? M : new Error("Unknown error"), f = u.map((C) => ({
            relay: C,
            success: !1,
            error: w
          })), v < d - 1 && await new Promise((C) => setTimeout(C, p));
        }
      const I = f.length > 0 && f.some((v) => v.success);
      return I || (this.subscriptions.delete(c), g.timeoutId && clearTimeout(g.timeoutId)), {
        subscription: I ? this.externalizeSubscription(g) : {},
        success: I,
        relayResults: f,
        error: I ? void 0 : {
          message: w ? w.message : f.length === 0 ? "No relays available" : "All relays failed",
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
    var s, i, n, r;
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    t.state = "active";
    try {
      const o = ["REQ", e, ...t.filters], c = this.relayManager.connectedRelays;
      t.relays.length !== c.length || !t.relays.every((u) => c.includes(u)) ? await ((i = (s = this.relayManager).sendToRelays) == null ? void 0 : i.call(s, t.relays, o)) : await ((r = (n = this.relayManager).sendToAll) == null ? void 0 : r.call(n, o));
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
    var i, n;
    const s = this.subscriptions.get(e);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const r = ["CLOSE", e];
        await ((n = (i = this.relayManager).sendToAll) == null ? void 0 : n.call(i, r));
      } catch (r) {
        this.debug && console.error(`Error sending CLOSE for ${e}:`, r);
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
    const i = [];
    for (const n of t)
      s.receivedEventIds.has(n.id) || (s.receivedEventIds.add(n.id), i.push(n));
    if (s.eventCount += i.length, s.lastEventAt = Date.now(), s.onEvent && i.length > 0)
      for (const n of i)
        s.onEvent(n);
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
    const [s, i, ...n] = t;
    switch (s) {
      case "EVENT":
        const r = n[0];
        await this.handleRelayEvent(e, i, r);
        break;
      case "EOSE":
        await this.markEose(i, e);
        break;
      case "NOTICE":
        this.debug && console.log(`Notice from ${e}:`, n[0]);
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
      for (const n of e.relays)
        try {
          await this.relayManager.sendToRelays([n], i), s.push({
            relay: n,
            success: !0,
            subscriptionId: e.id
          });
        } catch (r) {
          s.push({
            relay: n,
            success: !1,
            error: r instanceof Error ? r.message : "Unknown error",
            subscriptionId: e.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(i), e.relays.forEach((n) => {
          s.push({
            relay: n,
            success: !0,
            subscriptionId: e.id
          });
        })) : e.relays.forEach((n) => {
          s.push({
            relay: n,
            success: !0,
            subscriptionId: e.id
          });
        });
      } catch (n) {
        e.relays.forEach((r) => {
          s.push({
            relay: r,
            success: !1,
            error: n instanceof Error ? n.message : "Unknown error",
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
class Zt {
  constructor(e = {}) {
    h(this, "relayManager");
    h(this, "subscriptionManager");
    h(this, "signingProvider");
    h(this, "signingMethod");
    h(this, "config");
    // Fluent Event Builder API
    h(this, "events");
    // Direct Message API
    h(this, "dm");
    // Social Media API
    h(this, "social");
    console.log("🔥 NostrUnchained v0.1.0-FIX (build:", (/* @__PURE__ */ new Date()).toISOString().substring(0, 19) + "Z)"), this.config = {
      relays: e.relays ?? gt,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? ee.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? ee.RETRY_DELAY,
      timeout: e.timeout ?? ee.PUBLISH_TIMEOUT,
      signingProvider: e.signingProvider
    }, this.relayManager = new ft(this.config.relays, {
      debug: this.config.debug
    }), this.subscriptionManager = new Kt(this.relayManager), this.events = new bt(this), this.dm = new Ze({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: void 0,
      // Will be set when initialized
      debug: this.config.debug
    }), this.social = new Ut({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: void 0,
      // Will be set when initialized
      eventBuilder: new Y(),
      // Create separate EventBuilder instance
      debug: this.config.debug
    }), this.config.signingProvider ? (this.signingProvider = this.config.signingProvider, this.signingMethod = "temporary", this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider (should be TemporarySigner)")) : this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later"), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays);
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
    if (this.signingProvider) {
      this.config.debug && console.log(`🚫 Signing already initialized with method: ${this.signingMethod} - KEEPING IT!`);
      return;
    } else {
      const { provider: e, method: t } = await pt.createBestAvailable();
      this.signingProvider = e, this.signingMethod = t, this.config.debug && console.log(`🔍 Auto-detected signing with method: ${this.signingMethod} (this should NOT happen for temp accounts!)`);
    }
    await this.dm.updateSigningProvider(this.signingProvider), await this.social.updateSigningProvider(this.signingProvider), this.config.debug && console.log(`Initialized signing with method: ${this.signingMethod}`);
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
      throw _.handleConnectionError("relays", e);
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
      const i = await this.signingProvider.getPublicKey(), n = await Y.createEvent(e, i), r = Y.addEventId(n), o = await this.signingProvider.signEvent(n), c = {
        ...r,
        sig: o
      };
      if (this.connectedRelays.length === 0) {
        const d = Date.now();
        await this.connect(), s.connectionAttempts = Date.now() - d;
      }
      const l = await this.relayManager.publishToAll(c);
      this.config.debug && (s.relayLatencies = {}, l.forEach((d) => {
        d.latency && (s.relayLatencies[d.relay] = d.latency);
      }));
      const u = _.analyzeRelayResults(l);
      s.totalTime = Date.now() - t;
      const g = {
        success: u.success,
        eventId: c.id,
        event: c,
        relayResults: l,
        timestamp: Date.now(),
        error: u.error,
        debug: this.config.debug ? s : void 0
      };
      return this.config.debug && console.log("Publish result:", g), g;
    } catch (i) {
      s.totalTime = Date.now() - t;
      let n;
      return i instanceof Error ? i.message.includes("Content") ? n = _.handleContentError(e) : i.message.includes("sign") || i.message.includes("extension") ? n = _.handleSigningError(i) : n = _.handleConnectionError("relay", i) : n = _.createError("network", "Unknown error occurred", {
        retryable: !0
      }), {
        success: !1,
        relayResults: [],
        timestamp: Date.now(),
        error: n,
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
    ), i = Y.addEventId(s), n = await this.signingProvider.signEvent(s);
    return {
      ...i,
      sig: n
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
    return await _e.isAvailable();
  }
  /**
   * Get public key from extension
   */
  async getExtensionPubkey() {
    if (!await this.hasExtension())
      throw new Error("No browser extension available");
    return await new _e().getPublicKey();
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
      const i = await this.relayManager.publishToAll(e);
      this.config.debug && (s.relayLatencies = {}, i.forEach((o) => {
        o.latency && (s.relayLatencies[o.relay] = o.latency);
      }));
      const n = _.analyzeRelayResults(i);
      s.totalTime = Date.now() - t;
      const r = {
        success: n.success,
        eventId: e.id,
        event: e,
        relayResults: i,
        timestamp: Date.now(),
        error: n.error,
        debug: this.config.debug ? s : void 0
      };
      return this.config.debug && console.log("PublishEvent result:", r), r;
    } catch (i) {
      s.totalTime = Date.now() - t;
      let n;
      return i instanceof Error ? n = _.handleConnectionError("relay", i) : n = _.createError("network", "Unknown error occurred", {
        retryable: !0
      }), {
        success: !1,
        relayResults: [],
        timestamp: Date.now(),
        error: n,
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
  /**
   * Get the subscription manager for advanced query operations
   */
  getSubscriptionManager() {
    return this.subscriptionManager;
  }
}
class De {
  constructor(e = {}, t) {
    h(this, "state");
    h(this, "subscriptionManager");
    this.state = { ...e }, this.subscriptionManager = t;
  }
  // Immutable helper to create new instance
  clone(e = {}) {
    return new De(
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
    const s = { ...this.state.tags }, i = e;
    return s[i] ? s[i] = Array.from(/* @__PURE__ */ new Set([...s[i], ...t])) : s[i] = Array.from(new Set(t)), this.clone({ tags: s });
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
    const t = e, s = { ...this.state }, i = t.state;
    if (i.kinds && (s.kinds ? s.kinds = Array.from(/* @__PURE__ */ new Set([...s.kinds, ...i.kinds])) : s.kinds = [...i.kinds]), i.authors && (s.authors ? s.authors = Array.from(/* @__PURE__ */ new Set([...s.authors, ...i.authors])) : s.authors = [...i.authors]), i.tags) {
      const n = { ...s.tags };
      for (const [r, o] of Object.entries(i.tags))
        n[r] ? n[r] = Array.from(/* @__PURE__ */ new Set([...n[r], ...o])) : n[r] = [...o];
      s.tags = n;
    }
    return i.since !== void 0 && (s.since = Math.max(s.since || 0, i.since)), i.until !== void 0 && (s.until !== void 0 ? s.until = Math.min(s.until, i.until) : s.until = i.until), i.limit !== void 0 && (s.limit !== void 0 ? s.limit = Math.min(s.limit, i.limit) : s.limit = i.limit), this.clone(s);
  }
  // Compilation
  toFilter() {
    const e = [];
    if (this.state.unionWith && this.state.unionWith.length > 0) {
      const t = this.compileStateToFilter(this.state);
      Object.keys(t).length > 0 && e.push(t);
      for (const s of this.state.unionWith) {
        const i = s.toFilter();
        e.push(...i);
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
      for (const [s, i] of Object.entries(e.tags))
        t[`#${s}`] = i;
    return e.search && (t.search = e.search), t;
  }
  // Execution
  async execute(e = {}) {
    var l;
    if (!this.subscriptionManager)
      throw new Error("SubscriptionManager is required for query execution");
    const t = this.toFilter(), s = [];
    let i = !1;
    const n = {
      ...e,
      onEvent: (u) => {
        s.push(u), e.onEvent && e.onEvent(u);
      },
      onEose: (u) => {
        i = !0, e.onEose && e.onEose(u);
      },
      autoClose: !0
      // Auto-close for execute
    }, r = await this.subscriptionManager.subscribe(t, n);
    if (!r.success)
      throw new Error(((l = r.error) == null ? void 0 : l.message) || "Query execution failed");
    const o = e.timeout || 1e4, c = Date.now();
    for (; !i && Date.now() - c < o; )
      await new Promise((u) => setTimeout(u, 100));
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
function Vt(a) {
  return new De({}, a);
}
function Xt(a) {
  return Vt(a);
}
const Jt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: je,
  DMModule: Ze,
  DMRoom: Ye,
  EphemeralKeyManager: Ee,
  GiftWrapCreator: ve,
  GiftWrapProtocol: ce,
  NIP44Crypto: P,
  SealCreator: we,
  TimestampRandomizer: ke
}, Symbol.toStringTag, { value: "Module" })), Qt = "0.1.0";
export {
  gt as DEFAULT_RELAYS,
  Jt as DM,
  Oe as EVENT_KINDS,
  _ as ErrorHandler,
  Y as EventBuilder,
  bt as EventsModule,
  _e as ExtensionSigner,
  Ce as FeedStoreImpl,
  yt as FluentEventBuilder,
  Ne as LocalKeySigner,
  Zt as NostrUnchained,
  De as QueryBuilder,
  Gt as QuickSigner,
  ft as RelayManager,
  pt as SigningProviderFactory,
  Kt as SubscriptionManager,
  Ht as TemporarySigner,
  Qt as VERSION,
  zt as createFeed,
  Yt as createFeedFromFilter,
  jt as createFeedFromQuery,
  Vt as createQueryBuilder,
  E as derived,
  Xt as query,
  Bt as setDefaultSubscriptionManager,
  A as writable
};
