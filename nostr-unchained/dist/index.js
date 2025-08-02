var ct = Object.defineProperty;
var lt = (a, e, t) => e in a ? ct(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var u = (a, e, t) => lt(a, typeof e != "symbol" ? e + "" : e, t);
import * as ie from "@noble/secp256k1";
import { getSharedSecret as ut } from "@noble/secp256k1";
const oe = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function ht(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function Te(a) {
  if (!Number.isSafeInteger(a) || a < 0)
    throw new Error("positive integer expected, got " + a);
}
function pe(a, ...e) {
  if (!ht(a))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(a.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + a.length);
}
function Ne(a) {
  if (typeof a != "function" || typeof a.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  Te(a.outputLen), Te(a.blockLen);
}
function Pe(a, e = !0) {
  if (a.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && a.finished)
    throw new Error("Hash#digest() has already been called");
}
function gt(a, e) {
  pe(a);
  const t = e.outputLen;
  if (a.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function he(...a) {
  for (let e = 0; e < a.length; e++)
    a[e].fill(0);
}
function _e(a) {
  return new DataView(a.buffer, a.byteOffset, a.byteLength);
}
function X(a, e) {
  return a << 32 - e | a >>> e;
}
const dt = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", ft = /* @__PURE__ */ Array.from({ length: 256 }, (a, e) => e.toString(16).padStart(2, "0"));
function we(a) {
  if (pe(a), dt)
    return a.toHex();
  let e = "";
  for (let t = 0; t < a.length; t++)
    e += ft[a[t]];
  return e;
}
function pt(a) {
  if (typeof a != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(a));
}
function ge(a) {
  return typeof a == "string" && (a = pt(a)), pe(a), a;
}
class ze {
}
function yt(a) {
  const e = (s) => a().update(ge(s)).digest(), t = a();
  return e.outputLen = t.outputLen, e.blockLen = t.blockLen, e.create = () => a(), e;
}
function ce(a = 32) {
  if (oe && typeof oe.getRandomValues == "function")
    return oe.getRandomValues(new Uint8Array(a));
  if (oe && typeof oe.randomBytes == "function")
    return Uint8Array.from(oe.randomBytes(a));
  throw new Error("crypto.getRandomValues must be defined");
}
function bt(a, e, t, s) {
  if (typeof a.setBigUint64 == "function")
    return a.setBigUint64(e, t, s);
  const i = BigInt(32), r = BigInt(4294967295), n = Number(t >> i & r), c = Number(t & r), l = s ? 4 : 0, o = s ? 0 : 4;
  a.setUint32(e + l, n, s), a.setUint32(e + o, c, s);
}
function mt(a, e, t) {
  return a & e ^ ~a & t;
}
function wt(a, e, t) {
  return a & e ^ a & t ^ e & t;
}
class vt extends ze {
  constructor(e, t, s, i) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = i, this.buffer = new Uint8Array(e), this.view = _e(this.buffer);
  }
  update(e) {
    Pe(this), e = ge(e), pe(e);
    const { view: t, buffer: s, blockLen: i } = this, r = e.length;
    for (let n = 0; n < r; ) {
      const c = Math.min(i - this.pos, r - n);
      if (c === i) {
        const l = _e(e);
        for (; i <= r - n; n += i)
          this.process(l, n);
        continue;
      }
      s.set(e.subarray(n, n + c), this.pos), this.pos += c, n += c, this.pos === i && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Pe(this), gt(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: i, isLE: r } = this;
    let { pos: n } = this;
    t[n++] = 128, he(this.buffer.subarray(n)), this.padOffset > i - n && (this.process(s, 0), n = 0);
    for (let g = n; g < i; g++)
      t[g] = 0;
    bt(s, i - 8, BigInt(this.length * 8), r), this.process(s, 0);
    const c = _e(e), l = this.outputLen;
    if (l % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const o = l / 4, h = this.get();
    if (o > h.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let g = 0; g < o; g++)
      c.setUint32(4 * g, h[g], r);
  }
  digest() {
    const { buffer: e, outputLen: t } = this;
    this.digestInto(e);
    const s = e.slice(0, t);
    return this.destroy(), s;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: t, buffer: s, length: i, finished: r, destroyed: n, pos: c } = this;
    return e.destroyed = n, e.finished = r, e.length = i, e.pos = c, i % t && e.buffer.set(s), e;
  }
  clone() {
    return this._cloneInto();
  }
}
const J = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), Et = /* @__PURE__ */ Uint32Array.from([
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
class Mt extends vt {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = J[0] | 0, this.B = J[1] | 0, this.C = J[2] | 0, this.D = J[3] | 0, this.E = J[4] | 0, this.F = J[5] | 0, this.G = J[6] | 0, this.H = J[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: i, E: r, F: n, G: c, H: l } = this;
    return [e, t, s, i, r, n, c, l];
  }
  // prettier-ignore
  set(e, t, s, i, r, n, c, l) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = i | 0, this.E = r | 0, this.F = n | 0, this.G = c | 0, this.H = l | 0;
  }
  process(e, t) {
    for (let g = 0; g < 16; g++, t += 4)
      q[g] = e.getUint32(t, !1);
    for (let g = 16; g < 64; g++) {
      const f = q[g - 15], p = q[g - 2], d = X(f, 7) ^ X(f, 18) ^ f >>> 3, y = X(p, 17) ^ X(p, 19) ^ p >>> 10;
      q[g] = y + q[g - 7] + d + q[g - 16] | 0;
    }
    let { A: s, B: i, C: r, D: n, E: c, F: l, G: o, H: h } = this;
    for (let g = 0; g < 64; g++) {
      const f = X(c, 6) ^ X(c, 11) ^ X(c, 25), p = h + f + mt(c, l, o) + Et[g] + q[g] | 0, y = (X(s, 2) ^ X(s, 13) ^ X(s, 22)) + wt(s, i, r) | 0;
      h = o, o = l, l = c, c = n + p | 0, n = r, r = i, i = s, s = p + y | 0;
    }
    s = s + this.A | 0, i = i + this.B | 0, r = r + this.C | 0, n = n + this.D | 0, c = c + this.E | 0, l = l + this.F | 0, o = o + this.G | 0, h = h + this.H | 0, this.set(s, i, r, n, c, l, o, h);
  }
  roundClean() {
    he(q);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), he(this.buffer);
  }
}
const Pt = /* @__PURE__ */ yt(() => new Mt()), re = Pt, St = [
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
}, R = {
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
}, ve = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class N {
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
    ]), s = new TextEncoder().encode(t), i = re(s);
    return we(i);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(e) {
    const t = N.calculateEventId(e);
    return { ...e, id: t };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(e) {
    const t = [];
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !ve.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !ve.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !ve.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && t.push(R.EMPTY_CONTENT), e.content && e.content.length > ee.MAX_CONTENT_LENGTH && t.push(R.CONTENT_TOO_LONG), e.created_at) {
      const s = Math.floor(Date.now() / 1e3), i = s - 3600, r = s + 3600;
      (e.created_at < i || e.created_at > r) && t.push("Timestamp is too far in the past or future");
    }
    return e.tags && (Array.isArray(e.tags) ? e.tags.forEach((s, i) => {
      Array.isArray(s) ? s.forEach((r, n) => {
        typeof r != "string" && t.push(`Tag ${i}[${n}] must be a string`);
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
    return e === "" && t.push(R.EMPTY_CONTENT), e.length > ee.MAX_CONTENT_LENGTH && t.push(R.CONTENT_TOO_LONG), {
      valid: t.length === 0,
      errors: t
    };
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(e) {
    return N.calculateEventId({
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
    const i = N.validateContent(e);
    if (!i.valid)
      throw new Error(`Invalid content: ${i.errors.join(", ")}`);
    const r = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? Oe.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, n = N.validateEvent(r);
    if (!n.valid)
      throw new Error(`Invalid event: ${n.errors.join(", ")}`);
    return r;
  }
}
async function It() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class _t {
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
        const r = await It(), n = new r(e), c = setTimeout(() => {
          n.close(), t.state = "error", t.error = "Connection timeout", i(new Error(`Connection to ${e} timed out`));
        }, ee.CONNECTION_TIMEOUT);
        n.onopen = () => {
          clearTimeout(c), t.ws = n, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, n.onerror = (l) => {
          clearTimeout(c), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, l), i(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, n.onclose = () => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`);
        }, n.onmessage = (l) => {
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
        const n = await this.publishToRelay(i, e), c = Date.now() - r;
        t.push({
          relay: i,
          success: n,
          latency: c
        });
      } catch (n) {
        const c = Date.now() - r;
        t.push({
          relay: i,
          success: !1,
          error: n instanceof Error ? n.message : "Unknown error",
          latency: c
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
      const n = s.ws, c = ["EVENT", t], l = setTimeout(() => {
        r(new Error("Publish timeout"));
      }, ee.PUBLISH_TIMEOUT), o = t.id;
      this.pendingPublishes.set(o, { resolve: i, reject: r, timeout: l });
      try {
        const h = JSON.stringify(c);
        n.send(h), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", h), console.log("📤 Added to pending:", o));
      } catch (h) {
        clearTimeout(l), this.pendingPublishes.delete(o), r(h);
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
        const [, i, r, n] = s, c = this.pendingPublishes.get(i);
        this.debug && (console.log(`OK for event ${i}, success: ${r}, pending: ${!!c}`), console.log("Pending publishes:", Array.from(this.pendingPublishes.keys()))), c ? (clearTimeout(c.timeout), this.pendingPublishes.delete(i), r ? c.resolve(!0) : c.reject(new Error(n || "Relay rejected event"))) : this.debug && console.warn(`No pending publish found for event ID: ${i}`);
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
      return ve.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
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
class xe {
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
class De {
  constructor() {
    u(this, "privateKey");
    u(this, "publicKey");
    const e = ce(32);
    this.privateKey = we(e), this.publicKey = we(ie.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = N.calculateEventId(e), s = await ie.schnorr.sign(t, this.privateKey);
    return we(s);
  }
  /**
   * Get private key for NIP-44 encryption
   * WARNING: Only for testing/development. Production should use secure key derivation.
   */
  async getPrivateKeyForEncryption() {
    return this.privateKey;
  }
}
class os extends De {
}
class cs extends De {
}
class kt {
  static async createBestAvailable() {
    if (await xe.isAvailable())
      try {
        const e = new xe();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new De(),
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
      suggestion: le.EMPTY_CONTENT
    }) : e.length > 8192 ? T.createError("validation", R.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: le.CONTENT_TOO_LONG
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
      suggestion: le.NO_EXTENSION
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
      suggestion: le.CONNECTION_FAILED
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
        (c) => {
          var l;
          return (l = c.error) == null ? void 0 : l.toLowerCase().includes("timeout");
        }
      ), n = i.every(
        (c) => {
          var l, o;
          return ((l = c.error) == null ? void 0 : l.toLowerCase().includes("connect")) || ((o = c.error) == null ? void 0 : o.toLowerCase().includes("refused"));
        }
      );
      return r ? {
        success: !1,
        error: T.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : n ? {
        success: !1,
        error: T.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: T.createError("relay", R.PUBLISH_FAILED, {
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
      const i = t.relayResults.filter((n) => n.success).length, r = t.relayResults.length;
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
class At {
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
class Tt {
  constructor(e) {
    u(this, "nostrInstance");
    this.nostrInstance = e;
  }
  /**
   * Create a new fluent event builder
   */
  create() {
    return new At(this.nostrInstance);
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
function S(a) {
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
function m(a, e) {
  const t = Array.isArray(a) ? a : [a], s = /* @__PURE__ */ new Set();
  let i, r = !1;
  const n = [], c = () => {
    if (t.length === 1) {
      const l = t[0].subscribe((o) => {
        const h = e(o);
        (!r || h !== i) && (i = h, r && s.forEach((g) => g(i)));
      });
      n.length === 0 && n.push(l);
    }
  };
  return {
    subscribe(l) {
      return r || (c(), r = !0), i !== void 0 && l(i), s.add(l), () => {
        s.delete(l), s.size === 0 && (n.forEach((o) => o()), n.length = 0, r = !1);
      };
    }
  };
}
function Ge(a) {
  return {
    subscribe: a.subscribe.bind(a),
    derive: (e) => m(a, e)
  };
}
class de {
  constructor(e, t, s) {
    u(this, "_events");
    u(this, "_readIds", /* @__PURE__ */ new Set());
    u(this, "parent");
    this.parent = e, this._events = m(e.events, (i) => {
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
    return m(this._events, (e) => e.length);
  }
  get latest() {
    return m(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return m(this._events, (e) => e.length === 0);
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
    return Ge(m(this._events, e));
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
    return new de(this, e);
  }
  sortBy(e) {
    return new de(this, void 0, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((n) => {
      e = n;
    })();
    const s = e.filter((n) => this._readIds.has(n.id)).length, i = e.length, r = i - s;
    return { read: s, unread: r, total: i };
  }
}
class Fe {
  constructor(e, t, s = {}, i = {}) {
    u(this, "_events", S([]));
    u(this, "_status", S("connecting"));
    u(this, "_error", S(null));
    u(this, "_loading", S(!1));
    u(this, "_count", S(0));
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
    return m(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return m(this._events, () => !0);
  }
  get isEmpty() {
    return m(this._events, (e) => e.length === 0);
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
    return Ge(m(this._events, e));
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
    return new de(this, e, this.eventComparator);
  }
  sortBy(e) {
    return new de(this, this.eventPredicate, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((n) => {
      e = n;
    })();
    const s = e.filter((n) => this._readIds.has(n.id)).length, i = e.length, r = i - s;
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
class Ct {
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
    return new Fe(
      this.subscriptionManager,
      e,
      this.options,
      this.config
    );
  }
}
let ne;
function ls(a) {
  ne = a;
}
function us() {
  if (!ne)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new Ct(ne);
}
function hs(a) {
  if (!ne)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = a.toFilter();
  return new Fe(ne, e);
}
function gs(a) {
  if (!ne)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new Fe(ne, [a]);
}
class He extends ze {
  constructor(e, t) {
    super(), this.finished = !1, this.destroyed = !1, Ne(e);
    const s = ge(t);
    if (this.iHash = e.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const i = this.blockLen, r = new Uint8Array(i);
    r.set(s.length > i ? e.create().update(s).digest() : s);
    for (let n = 0; n < r.length; n++)
      r[n] ^= 54;
    this.iHash.update(r), this.oHash = e.create();
    for (let n = 0; n < r.length; n++)
      r[n] ^= 106;
    this.oHash.update(r), he(r);
  }
  update(e) {
    return Pe(this), this.iHash.update(e), this;
  }
  digestInto(e) {
    Pe(this), pe(e, this.outputLen), this.finished = !0, this.iHash.digestInto(e), this.oHash.update(e), this.oHash.digestInto(e), this.destroy();
  }
  digest() {
    const e = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(e), e;
  }
  _cloneInto(e) {
    e || (e = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: t, iHash: s, finished: i, destroyed: r, blockLen: n, outputLen: c } = this;
    return e = e, e.finished = i, e.destroyed = r, e.blockLen = n, e.outputLen = c, e.oHash = t._cloneInto(e.oHash), e.iHash = s._cloneInto(e.iHash), e;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = !0, this.oHash.destroy(), this.iHash.destroy();
  }
}
const fe = (a, e, t) => new He(a, e).update(t).digest();
fe.create = (a, e) => new He(a, e);
function Rt(a, e, t) {
  return Ne(a), t === void 0 && (t = new Uint8Array(a.outputLen)), fe(a, ge(t), ge(e));
}
const ke = /* @__PURE__ */ Uint8Array.from([0]), Ue = /* @__PURE__ */ Uint8Array.of();
function Nt(a, e, t, s = 32) {
  Ne(a), Te(s);
  const i = a.outputLen;
  if (s > 255 * i)
    throw new Error("Length should be <= 255*HashLen");
  const r = Math.ceil(s / i);
  t === void 0 && (t = Ue);
  const n = new Uint8Array(r * i), c = fe.create(a, e), l = c._cloneInto(), o = new Uint8Array(c.outputLen);
  for (let h = 0; h < r; h++)
    ke[0] = h + 1, l.update(h === 0 ? Ue : o).update(t).update(ke).digestInto(o), n.set(o, i * h), c._cloneInto(l);
  return c.destroy(), l.destroy(), he(o, ke), n.slice(0, s);
}
const Be = (a, e, t, s, i) => Nt(a, Rt(a, e, t), s, i);
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function Dt(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function Ke(a) {
  if (typeof a != "boolean")
    throw new Error(`boolean expected, not ${a}`);
}
function Ae(a) {
  if (!Number.isSafeInteger(a) || a < 0)
    throw new Error("positive integer expected, got " + a);
}
function ye(a, ...e) {
  if (!Dt(a))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(a.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + a.length);
}
function te(a) {
  return new Uint32Array(a.buffer, a.byteOffset, Math.floor(a.byteLength / 4));
}
function Ft(...a) {
  for (let e = 0; e < a.length; e++)
    a[e].fill(0);
}
function Lt(a, e) {
  if (e == null || typeof e != "object")
    throw new Error("options must be defined");
  return Object.assign(a, e);
}
function $e(a) {
  return Uint8Array.from(a);
}
const je = (a) => Uint8Array.from(a.split("").map((e) => e.charCodeAt(0))), Ot = je("expand 16-byte k"), xt = je("expand 32-byte k"), Ut = te(Ot), Bt = te(xt);
function v(a, e) {
  return a << e | a >>> 32 - e;
}
function Ce(a) {
  return a.byteOffset % 4 === 0;
}
const be = 64, Kt = 16, Ye = 2 ** 32 - 1, Ve = new Uint32Array();
function $t(a, e, t, s, i, r, n, c) {
  const l = i.length, o = new Uint8Array(be), h = te(o), g = Ce(i) && Ce(r), f = g ? te(i) : Ve, p = g ? te(r) : Ve;
  for (let d = 0; d < l; n++) {
    if (a(e, t, s, h, n, c), n >= Ye)
      throw new Error("arx: counter overflow");
    const y = Math.min(be, l - d);
    if (g && y === be) {
      const P = d / 4;
      if (d % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let E = 0, M; E < Kt; E++)
        M = P + E, p[M] = f[M] ^ h[E];
      d += be;
      continue;
    }
    for (let P = 0, E; P < y; P++)
      E = d + P, r[E] = i[E] ^ o[P];
    d += y;
  }
}
function Vt(a, e) {
  const { allowShortKeys: t, extendNonceFn: s, counterLength: i, counterRight: r, rounds: n } = Lt({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, e);
  if (typeof a != "function")
    throw new Error("core must be a function");
  return Ae(i), Ae(n), Ke(r), Ke(t), (c, l, o, h, g = 0) => {
    ye(c), ye(l), ye(o);
    const f = o.length;
    if (h === void 0 && (h = new Uint8Array(f)), ye(h), Ae(g), g < 0 || g >= Ye)
      throw new Error("arx: counter overflow");
    if (h.length < f)
      throw new Error(`arx: output (${h.length}) is shorter than data (${f})`);
    const p = [];
    let d = c.length, y, P;
    if (d === 32)
      p.push(y = $e(c)), P = Bt;
    else if (d === 16 && t)
      y = new Uint8Array(32), y.set(c), y.set(c, 16), P = Ut, p.push(y);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${d}`);
    Ce(l) || p.push(l = $e(l));
    const E = te(y);
    if (s) {
      if (l.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(P, E, te(l.subarray(0, 16)), E), l = l.subarray(16);
    }
    const M = 16 - i;
    if (M !== l.length)
      throw new Error(`arx: nonce must be ${M} or 16 bytes`);
    if (M !== 12) {
      const Z = new Uint8Array(12);
      Z.set(l, r ? 0 : 12 - l.length), l = Z, p.push(l);
    }
    const D = te(l);
    return $t(a, P, E, D, o, h, g, n), Ft(...p), h;
  };
}
function Wt(a, e, t, s, i, r = 20) {
  let n = a[0], c = a[1], l = a[2], o = a[3], h = e[0], g = e[1], f = e[2], p = e[3], d = e[4], y = e[5], P = e[6], E = e[7], M = i, D = t[0], Z = t[1], ae = t[2], _ = n, F = c, L = l, O = o, x = h, U = g, B = f, K = p, $ = d, V = y, W = P, z = E, G = M, H = D, j = Z, Y = ae;
  for (let Le = 0; Le < r; Le += 2)
    _ = _ + x | 0, G = v(G ^ _, 16), $ = $ + G | 0, x = v(x ^ $, 12), _ = _ + x | 0, G = v(G ^ _, 8), $ = $ + G | 0, x = v(x ^ $, 7), F = F + U | 0, H = v(H ^ F, 16), V = V + H | 0, U = v(U ^ V, 12), F = F + U | 0, H = v(H ^ F, 8), V = V + H | 0, U = v(U ^ V, 7), L = L + B | 0, j = v(j ^ L, 16), W = W + j | 0, B = v(B ^ W, 12), L = L + B | 0, j = v(j ^ L, 8), W = W + j | 0, B = v(B ^ W, 7), O = O + K | 0, Y = v(Y ^ O, 16), z = z + Y | 0, K = v(K ^ z, 12), O = O + K | 0, Y = v(Y ^ O, 8), z = z + Y | 0, K = v(K ^ z, 7), _ = _ + U | 0, Y = v(Y ^ _, 16), W = W + Y | 0, U = v(U ^ W, 12), _ = _ + U | 0, Y = v(Y ^ _, 8), W = W + Y | 0, U = v(U ^ W, 7), F = F + B | 0, G = v(G ^ F, 16), z = z + G | 0, B = v(B ^ z, 12), F = F + B | 0, G = v(G ^ F, 8), z = z + G | 0, B = v(B ^ z, 7), L = L + K | 0, H = v(H ^ L, 16), $ = $ + H | 0, K = v(K ^ $, 12), L = L + K | 0, H = v(H ^ L, 8), $ = $ + H | 0, K = v(K ^ $, 7), O = O + x | 0, j = v(j ^ O, 16), V = V + j | 0, x = v(x ^ V, 12), O = O + x | 0, j = v(j ^ O, 8), V = V + j | 0, x = v(x ^ V, 7);
  let k = 0;
  s[k++] = n + _ | 0, s[k++] = c + F | 0, s[k++] = l + L | 0, s[k++] = o + O | 0, s[k++] = h + x | 0, s[k++] = g + U | 0, s[k++] = f + B | 0, s[k++] = p + K | 0, s[k++] = d + $ | 0, s[k++] = y + V | 0, s[k++] = P + W | 0, s[k++] = E + z | 0, s[k++] = M + G | 0, s[k++] = D + H | 0, s[k++] = Z + j | 0, s[k++] = ae + Y | 0;
}
const We = /* @__PURE__ */ Vt(Wt, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), zt = {
  saltInfo: "nip44-v2"
};
class A extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP44Error";
  }
}
var C = /* @__PURE__ */ ((a) => (a.INVALID_KEY = "INVALID_KEY", a.INVALID_NONCE = "INVALID_NONCE", a.INVALID_PAYLOAD = "INVALID_PAYLOAD", a.ENCRYPTION_FAILED = "ENCRYPTION_FAILED", a.DECRYPTION_FAILED = "DECRYPTION_FAILED", a.MAC_VERIFICATION_FAILED = "MAC_VERIFICATION_FAILED", a.INVALID_PLAINTEXT_LENGTH = "INVALID_PLAINTEXT_LENGTH", a.PADDING_ERROR = "PADDING_ERROR", a))(C || {});
class I {
  /**
   * Derive conversation key using secp256k1 ECDH + HKDF
   */
  static deriveConversationKey(e, t) {
    try {
      const s = e.replace(/^0x/, "");
      let i = t.replace(/^0x/, "");
      if (s.length !== 64)
        throw new A(
          "Invalid private key length",
          C.INVALID_KEY
        );
      if (i.length === 64)
        i = "02" + i;
      else if (i.length !== 66 || !i.startsWith("02") && !i.startsWith("03"))
        throw new A(
          "Invalid public key format",
          C.INVALID_KEY
        );
      const n = ut(s, i, !0).slice(1);
      return Be(re, n, this.SALT, new Uint8Array(0), 32);
    } catch (s) {
      throw s instanceof A ? s : new A(
        `Key derivation failed: ${s.message}`,
        C.INVALID_KEY,
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
        throw new A(
          "Invalid conversation key length",
          C.INVALID_KEY
        );
      if (t.length !== this.NONCE_SIZE)
        throw new A(
          "Invalid nonce length",
          C.INVALID_NONCE
        );
      const s = Be(re, e, new Uint8Array(0), t, 76);
      return {
        chachaKey: s.slice(0, 32),
        // bytes 0-31
        chachaNonce: s.slice(32, 44),
        // bytes 32-43 (12 bytes)
        hmacKey: s.slice(44, 76)
        // bytes 44-75
      };
    } catch (s) {
      throw new A(
        `Message key derivation failed: ${s.message}`,
        C.ENCRYPTION_FAILED,
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
      throw new A(
        "Invalid plaintext length",
        C.INVALID_PLAINTEXT_LENGTH
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
      throw new A(
        "Invalid padded data length",
        C.PADDING_ERROR
      );
    const t = e[0] << 8 | e[1];
    if (t > e.length - 2)
      throw new A(
        "Invalid plaintext length in padding",
        C.PADDING_ERROR
      );
    return e.slice(2, 2 + t);
  }
  /**
   * Generate cryptographically secure random nonce
   */
  static generateNonce() {
    return ce(this.NONCE_SIZE);
  }
  /**
   * Encrypt plaintext using NIP-44 v2
   */
  static encrypt(e, t, s) {
    try {
      if (e == null)
        throw new A(
          "Plaintext cannot be null or undefined",
          C.INVALID_PLAINTEXT_LENGTH
        );
      const i = new TextEncoder().encode(e), r = s || this.generateNonce(), n = this.deriveMessageKeys(t, r), c = this.applyPadding(i), l = We(
        n.chachaKey,
        n.chachaNonce,
        c
      ), o = new Uint8Array(r.length + l.length);
      o.set(r, 0), o.set(l, r.length);
      const h = fe(re, n.hmacKey, o), g = new Uint8Array(
        this.VERSION_SIZE + r.length + l.length + this.MAC_SIZE
      );
      let f = 0;
      return g[f] = this.VERSION, f += this.VERSION_SIZE, g.set(r, f), f += r.length, g.set(l, f), f += l.length, g.set(h, f), {
        payload: btoa(String.fromCharCode(...g)),
        nonce: r
      };
    } catch (i) {
      throw i instanceof A ? i : new A(
        `Encryption failed: ${i.message}`,
        C.ENCRYPTION_FAILED,
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
        throw new A(
          "Payload too short",
          C.INVALID_PAYLOAD
        );
      let n = 0;
      const c = i[n];
      if (n += this.VERSION_SIZE, c !== this.VERSION)
        throw new A(
          `Unsupported version: ${c}`,
          C.INVALID_PAYLOAD
        );
      const l = i.slice(n, n + this.NONCE_SIZE);
      n += this.NONCE_SIZE;
      const o = i.slice(n, -this.MAC_SIZE), h = i.slice(-this.MAC_SIZE), g = this.deriveMessageKeys(t, l), f = new Uint8Array(l.length + o.length);
      f.set(l, 0), f.set(o, l.length);
      const p = fe(re, g.hmacKey, f);
      let d = !0;
      for (let M = 0; M < this.MAC_SIZE; M++)
        h[M] !== p[M] && (d = !1);
      if (!d)
        return {
          plaintext: "",
          isValid: !1
        };
      const y = We(
        g.chachaKey,
        g.chachaNonce,
        o
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
u(I, "VERSION", 2), u(I, "SALT", new TextEncoder().encode(zt.saltInfo)), u(I, "NONCE_SIZE", 32), u(I, "CHACHA_KEY_SIZE", 32), u(I, "CHACHA_NONCE_SIZE", 12), u(I, "HMAC_KEY_SIZE", 32), u(I, "MAC_SIZE", 32), u(I, "VERSION_SIZE", 1);
const Gt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NIP44Crypto: I
}, Symbol.toStringTag, { value: "Module" }));
class b extends Error {
  constructor(e, t, s) {
    super(e), this.code = t, this.details = s, this.name = "NIP59Error";
  }
}
var w = /* @__PURE__ */ ((a) => (a.INVALID_RUMOR = "INVALID_RUMOR", a.SEAL_CREATION_FAILED = "SEAL_CREATION_FAILED", a.GIFT_WRAP_CREATION_FAILED = "GIFT_WRAP_CREATION_FAILED", a.EPHEMERAL_KEY_GENERATION_FAILED = "EPHEMERAL_KEY_GENERATION_FAILED", a.TIMESTAMP_RANDOMIZATION_FAILED = "TIMESTAMP_RANDOMIZATION_FAILED", a.DECRYPTION_FAILED = "DECRYPTION_FAILED", a.INVALID_GIFT_WRAP = "INVALID_GIFT_WRAP", a.INVALID_SEAL = "INVALID_SEAL", a.NO_RECIPIENTS = "NO_RECIPIENTS", a.INVALID_RECIPIENT = "INVALID_RECIPIENT", a.INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY", a))(w || {});
const Q = {
  SEAL_KIND: 13,
  GIFT_WRAP_KIND: 1059,
  MAX_TIMESTAMP_AGE_SECONDS: 2 * 24 * 60 * 60,
  // 2 days
  MIN_TIMESTAMP_AGE_SECONDS: 0
  // Can be current time
};
class ue {
  /**
   * Create a kind 13 seal containing the encrypted rumor
   * The seal is signed by the sender's real private key
   */
  static async createSeal(e, t, s) {
    try {
      this.validateRumor(e), this.validatePrivateKey(t), this.validatePublicKey(s);
      const i = JSON.stringify(e), r = I.deriveConversationKey(
        t,
        s
      ), n = I.encrypt(i, r), c = this.getPublicKeyFromPrivate(t), l = {
        pubkey: c,
        created_at: Math.floor(Date.now() / 1e3),
        kind: Q.SEAL_KIND,
        tags: [],
        // Always empty for seals
        content: n.payload
      }, o = this.calculateEventId(l), h = await this.signEvent(l, o, t);
      return {
        id: o,
        pubkey: c,
        created_at: l.created_at,
        kind: Q.SEAL_KIND,
        tags: [],
        content: n.payload,
        sig: h
      };
    } catch (i) {
      throw i instanceof b ? i : new b(
        `Seal creation failed: ${i.message}`,
        w.SEAL_CREATION_FAILED,
        i
      );
    }
  }
  /**
   * Decrypt a seal to recover the original rumor
   */
  static decryptSeal(e, t) {
    try {
      if (e.kind !== Q.SEAL_KIND)
        return { rumor: null, isValid: !1 };
      if (e.tags.length !== 0)
        return { rumor: null, isValid: !1 };
      const s = I.deriveConversationKey(
        t,
        e.pubkey
      ), i = I.decrypt(e.content, s);
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
        e.match(/.{1,2}/g).map((n) => parseInt(n, 16))
      );
      console.log("📊 privateKeyBytes:", {
        length: t.length,
        type: t.constructor.name,
        first4: Array.from(t.slice(0, 4))
      });
      const i = ie.getPublicKey(t, !1).slice(1, 33), r = Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
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
    ]), s = re(new TextEncoder().encode(t));
    return Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const i = await ie.schnorr.sign(t, s);
      return Array.from(i).map((r) => r.toString(16).padStart(2, "0")).join("");
    } catch (i) {
      throw new b(
        "Failed to sign seal event",
        w.SEAL_CREATION_FAILED,
        i
      );
    }
  }
}
const Ht = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SealCreator: ue
}, Symbol.toStringTag, { value: "Module" }));
class Ee {
  /**
   * Generate a new ephemeral key pair for gift wrap creation
   * Each key pair is cryptographically random and should never be reused
   */
  static generateEphemeralKeyPair() {
    try {
      const e = ce(32), t = Array.from(e).map((n) => n.toString(16).padStart(2, "0")).join(""), i = ie.getPublicKey(t, !1).slice(1, 33), r = Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
      return {
        privateKey: t,
        publicKey: r
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
      const s = ie.getPublicKey(e.privateKey, !1).slice(1, 33), i = Array.from(s).map((r) => r.toString(16).padStart(2, "0")).join("");
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
      const t = ce(32).reduce((s, i) => s + i.toString(16).padStart(2, "0"), "");
      e.privateKey = t, e.publicKey = t;
    } catch {
    }
  }
  /**
   * Generate a secure random nonce for gift wrap creation
   * This can be used for additional randomness in the encryption process
   */
  static generateGiftWrapNonce() {
    return ce(32);
  }
}
class Re {
  /**
   * Generate a randomized timestamp for gift wrap creation
   * The timestamp will be between current time and maxAgeSeconds in the past
   */
  static generateRandomizedTimestamp(e = Q.MAX_TIMESTAMP_AGE_SECONDS) {
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
    const t = ce(4), s = new DataView(t.buffer).getUint32(0, !1);
    return Math.floor(s / 4294967295 * e);
  }
  /**
   * Generate multiple randomized timestamps for batch gift wrap creation
   * Each timestamp is independently randomized
   */
  static generateMultipleRandomizedTimestamps(e, t = Q.MAX_TIMESTAMP_AGE_SECONDS) {
    if (e <= 0)
      throw new b(
        "Timestamp count must be greater than 0",
        w.TIMESTAMP_RANDOMIZATION_FAILED
      );
    const s = [];
    for (let i = 0; i < e; i++)
      s.push(this.generateRandomizedTimestamp(t));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(e, t = Q.MAX_TIMESTAMP_AGE_SECONDS) {
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
    return Q.MAX_TIMESTAMP_AGE_SECONDS;
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
    const s = t - e, i = this.generateSecureRandomOffset(s);
    return e + i;
  }
}
class Me {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(e, t, s, i) {
    try {
      this.validateSeal(e), this.validateRecipient(t);
      const r = s || Ee.generateEphemeralKeyPair();
      if (!Ee.validateEphemeralKeyPair(r))
        throw new b(
          "Invalid ephemeral key pair",
          w.GIFT_WRAP_CREATION_FAILED
        );
      const n = i || Re.generateRandomizedTimestamp(), c = JSON.stringify(e), l = I.deriveConversationKey(
        r.privateKey,
        t.pubkey
      ), o = I.encrypt(c, l), h = t.relayHint ? ["p", t.pubkey, t.relayHint] : ["p", t.pubkey], g = {
        pubkey: r.publicKey,
        created_at: n,
        kind: Q.GIFT_WRAP_KIND,
        tags: [h],
        content: o.payload
      }, f = this.calculateEventId(g), p = await this.signEvent(g, f, r.privateKey);
      return {
        giftWrap: {
          id: f,
          pubkey: r.publicKey,
          created_at: n,
          kind: Q.GIFT_WRAP_KIND,
          tags: [h],
          content: o.payload,
          sig: p
        },
        ephemeralKeyPair: r,
        recipient: t.pubkey
      };
    } catch (r) {
      throw r instanceof b ? r : new b(
        `Gift wrap creation failed: ${r.message}`,
        w.GIFT_WRAP_CREATION_FAILED,
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
        w.NO_RECIPIENTS
      );
    const s = [], i = Ee.generateMultipleEphemeralKeyPairs(
      t.length
    ), r = Re.generateMultipleRandomizedTimestamps(
      t.length
    );
    for (let n = 0; n < t.length; n++) {
      const c = await this.createGiftWrap(
        e,
        t[n],
        i[n],
        r[n]
      );
      s.push(c);
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
      const s = I.deriveConversationKey(
        t,
        e.pubkey
      ), i = I.decrypt(e.content, s);
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
        w.INVALID_SEAL
      );
    if (e.kind !== Q.SEAL_KIND)
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
    return e && typeof e == "object" && e.kind === Q.GIFT_WRAP_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length > 0 && Array.isArray(e.tags[0]) && e.tags[0][0] === "p" && typeof e.tags[0][1] == "string";
  }
  /**
   * Check if an object is a valid seal (for decryption)
   */
  static isValidSeal(e) {
    return e && typeof e == "object" && e.kind === Q.SEAL_KIND && typeof e.pubkey == "string" && typeof e.content == "string" && Array.isArray(e.tags) && e.tags.length === 0;
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
    ]), s = re(new TextEncoder().encode(t));
    return Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(e, t, s) {
    try {
      const i = await ie.schnorr.sign(t, s);
      return Array.from(i).map((r) => r.toString(16).padStart(2, "0")).join("");
    } catch (i) {
      throw new b(
        "Failed to sign gift wrap event",
        w.GIFT_WRAP_CREATION_FAILED,
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
class se {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(e, t, s, i) {
    try {
      this.validateCreateDMInputs(e, t, s);
      const r = this.createRumor(e, t, i), n = [];
      for (const l of s.recipients) {
        const o = await ue.createSeal(
          r,
          t,
          l.pubkey
        ), h = await Me.createGiftWrap(
          o,
          {
            pubkey: l.pubkey,
            relayHint: l.relayHint || s.relayHint
          }
        );
        n.push(h);
      }
      const c = await ue.createSeal(
        r,
        t,
        s.recipients[0].pubkey
      );
      return {
        rumor: r,
        seal: c,
        giftWraps: n,
        senderPrivateKey: t
      };
    } catch (r) {
      throw r instanceof b ? r : new b(
        `Gift wrap protocol failed: ${r.message}`,
        w.GIFT_WRAP_CREATION_FAILED,
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
      const i = s.seal, r = ue.decryptSeal(
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
    return e.filter((s) => Me.getRecipientFromGiftWrap(s) === t);
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
    for (const i of s.recipients)
      if (!i || typeof i.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(i.pubkey))
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
        e.match(/.{1,2}/g).map((n) => parseInt(n, 16))
      );
      console.log("📊 privateKeyBytes:", {
        length: t.length,
        type: t.constructor.name,
        first4: Array.from(t.slice(0, 4))
      });
      const i = ie.getPublicKey(t, !1).slice(1, 33), r = Array.from(i).map((n) => n.toString(16).padStart(2, "0")).join("");
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
    const t = e.length, s = e.reduce((l, o) => l + o.giftWraps.length, 0), i = Math.floor(Date.now() / 1e3), r = e.flatMap(
      (l) => l.giftWraps.map((o) => i - o.giftWrap.created_at)
    ), n = r.length > 0 ? r.reduce((l, o) => l + o, 0) / r.length : 0, c = new Set(
      e.flatMap((l) => l.giftWraps.map((o) => o.recipient))
    );
    return {
      totalMessages: t,
      totalGiftWraps: s,
      averageTimestampAge: n,
      uniqueRecipients: c.size
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
      const { SealCreator: s } = await Promise.resolve().then(() => Ht), { NIP44Crypto: i } = await Promise.resolve().then(() => Gt), r = await i.decrypt(
        e.content,
        t,
        e.pubkey
      );
      if (!r)
        return null;
      const n = JSON.parse(r);
      if (!n || n.kind !== 13)
        return null;
      const c = await i.decrypt(
        n.content,
        t,
        n.pubkey
      );
      if (!c)
        return null;
      const l = JSON.parse(c);
      return !l || typeof l.kind != "number" ? null : l;
    } catch (s) {
      return console.error("Failed to unwrap gift wrapped DM:", s), null;
    }
  }
}
const jt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapProtocol: se
}, Symbol.toStringTag, { value: "Module" }));
class Qe {
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
    this.config = e, this._state = S({
      messages: [],
      status: "connecting",
      latest: null,
      isTyping: !1,
      error: null,
      subject: e.subject
    }), this.messages = m(this._state, (t) => t.messages), this.status = m(this._state, (t) => t.status), this.latest = m(this._state, (t) => t.latest), this.error = m(this._state, (t) => t.error), this.subject = m(this._state, (t) => t.subject), this.initializeSubscription();
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
      const r = this.generateMessageId(), n = Math.floor(Date.now() / 1e3), c = {
        id: r,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: this.config.recipientPubkey,
        timestamp: n,
        isFromMe: !0,
        status: "sending",
        subject: t || this.getCurrentSubject()
      };
      this.addMessage(c);
      const l = se.createSimpleConfig(
        this.config.recipientPubkey,
        (i = this.config.relayHints) == null ? void 0 : i[0]
      );
      this.config.debug && console.log("🎁 Creating gift wrap with config:", l);
      const o = await se.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        l,
        t
      );
      this.config.debug && console.log("🎁 Gift wrap result:", {
        hasRumor: !!o.rumor,
        hasSeal: !!o.seal,
        giftWrapCount: o.giftWraps.length
      });
      let h = !1, g;
      for (const f of o.giftWraps)
        try {
          this.config.debug && console.log("📡 Publishing gift wrap:", {
            id: f.giftWrap.id,
            kind: f.giftWrap.kind,
            tags: f.giftWrap.tags
          });
          const p = await this.config.relayManager.publishToAll(f.giftWrap);
          this.config.debug && console.log("📡 Publish result:", p), p.some((y) => y.success) && (h = !0, c.eventId = f.giftWrap.id);
        } catch (p) {
          g = p instanceof Error ? p.message : "Publishing failed", this.config.debug && console.error("❌ Publish error:", p);
        }
      if (h)
        return this.updateMessageStatus(r, "sent"), this.config.debug && console.log(`✅ DM sent successfully: ${r}`), { success: !0, messageId: r };
      {
        this.updateMessageStatus(r, "failed");
        const f = g || "Failed to publish to any relay";
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
      const t = await se.decryptGiftWrappedDM(
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
        (n) => n.eventId === e.id || n.content === s.content && Math.abs(n.timestamp - s.timestamp) < 5
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
class Xe {
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
    this.config = e, this.roomId = this.generateRoomId(), this._state = S({
      messages: [],
      status: "connecting",
      latest: null,
      subject: ((t = e.options) == null ? void 0 : t.subject) || "Group Chat",
      participants: [...e.participants, e.senderPubkey],
      // Include sender
      isTyping: !1,
      error: null
    }), this.messages = m(this._state, (s) => s.messages), this.status = m(this._state, (s) => s.status), this.latest = m(this._state, (s) => s.latest), this.subject = m(this._state, (s) => s.subject), this.participants = m(this._state, (s) => s.participants), this.error = m(this._state, (s) => s.error), this.initializeSubscription();
  }
  /**
   * Send an encrypted message to all room participants
   */
  async send(e) {
    var t, s;
    try {
      this.updateStatus("active");
      const i = this.generateMessageId(), r = Math.floor(Date.now() / 1e3), n = this.getCurrentSubject(), c = this.getCurrentParticipants(), l = {
        id: i,
        content: e,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: r,
        isFromMe: !0,
        status: "sending",
        subject: n,
        participants: c
      };
      this.addMessage(l);
      const h = {
        recipients: c.filter((d) => d !== this.config.senderPubkey).map((d) => ({ pubkey: d })),
        relayHint: (s = (t = this.config.options) == null ? void 0 : t.relayHints) == null ? void 0 : s[0]
      }, g = await se.createGiftWrappedDM(
        e,
        this.config.senderPrivateKey,
        h
      );
      let f = !1, p;
      for (const d of g.giftWraps)
        try {
          (await this.config.relayManager.publishToAll(d.giftWrap)).some((E) => E.success) && (f = !0, l.eventId = d.giftWrap.id);
        } catch (y) {
          p = y instanceof Error ? y.message : "Publishing failed";
        }
      if (f)
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`Room message sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const d = p || "Failed to publish to any relay";
        return this.setError(d), { success: !1, error: d, messageId: i };
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
      const t = await se.decryptGiftWrappedDM(
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
      const i = this.extractSubjectFromRumor(t.rumor), r = this.getCurrentSubject(), n = {
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
        (o) => o.eventId === e.id || o.content === n.content && Math.abs(o.timestamp - n.timestamp) < 5
        // Within 5 seconds
      ) || (this.addMessage(n), this.config.debug && console.log(`Received room message from ${t.senderPubkey}: ${n.content}`));
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
class Ze {
  constructor(e) {
    u(this, "conversations", /* @__PURE__ */ new Map());
    u(this, "rooms", /* @__PURE__ */ new Map());
    u(this, "config");
    u(this, "_senderPubkey", null);
    u(this, "_senderPrivateKey", null);
    u(this, "parentNostr");
    // Reference to NostrUnchained instance
    // Reactive stores
    u(this, "_conversationList", S([]));
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
    const s = e.map((n) => this.normalizePubkey(n)), i = this.generateRoomId(s);
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
    }, i = new Qe(s);
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
    }, r = new Xe(i);
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
      let i = null, r = "disconnected", n;
      const c = t.latest.subscribe((h) => {
        i = h;
      }), l = t.status.subscribe((h) => {
        r = h;
      }), o = t.subject.subscribe((h) => {
        n = h;
      });
      c(), l(), o(), e.push({
        pubkey: s,
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: n,
        type: "conversation"
      });
    }), this.rooms.forEach((t, s) => {
      let i = null, r = "disconnected", n = "", c = [];
      const l = t.latest.subscribe((f) => {
        i = f;
      }), o = t.status.subscribe((f) => {
        r = f;
      }), h = t.subject.subscribe((f) => {
        n = f;
      }), g = t.participants.subscribe((f) => {
        c = f;
      });
      l(), o(), h(), g(), e.push({
        pubkey: s,
        // Use roomId as the identifier
        latestMessage: i,
        lastActivity: (i == null ? void 0 : i.timestamp) || 0,
        isActive: r === "active" || r === "connecting",
        subject: n,
        participants: c,
        type: "room"
      });
    }), e.sort((t, s) => s.lastActivity - t.lastActivity), this._conversationList.set(e);
  }
  async handleGlobalInboxEvent(e) {
    this.config.debug && console.log("🎁 Processing gift wrap event:", e.id);
    try {
      const { GiftWrapProtocol: t } = await Promise.resolve().then(() => jt), s = await this.getPrivateKeySecurely(), i = await t.unwrapGiftWrap(e, s);
      if (i) {
        const r = i.pubkey;
        if (this.config.debug && console.log("✅ Decrypted event (kind " + i.kind + ") from:", r.substring(0, 8) + "..."), i.kind === 4 || i.kind === 14) {
          let n = this.conversations.get(r);
          n || (this.config.debug && console.log("🆕 Auto-creating conversation with:", r.substring(0, 8) + "..."), n = await this.with(r)), n && typeof n.handleDecryptedEvent == "function" && n.handleDecryptedEvent(i), this.updateConversationList(), this.config.debug && console.log("🔄 Updated conversations, total:", this.conversations.size);
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
class Yt {
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
class Qt {
  constructor(e, t) {
    this.nostr = e, this.myPubkey = t;
  }
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  with(e) {
    return this.nostr.startUniversalGiftWrapSubscription().catch((t) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DMs:", t);
    }), new Yt(this.nostr, this.myPubkey, e);
  }
  // Room functionality - also just queries (with lazy gift wrap subscription)
  room(e, t) {
    return this.nostr.startUniversalGiftWrapSubscription().catch((s) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DM room:", s);
    }), new Xt(this.nostr, this.myPubkey, e, t);
  }
  // Get all conversations - query all kind 14 events I'm involved in
  get conversations() {
    return [];
  }
}
class Xt {
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
class Zt {
  constructor(e) {
    u(this, "config");
    u(this, "contactCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // pubkey -> subscriptionId
    // Reactive stores
    u(this, "_myContacts", S(null));
    u(this, "_contactUpdates", S(/* @__PURE__ */ new Map()));
    // Public reactive properties
    u(this, "mine");
    u(this, "updates");
    this.config = e, this.mine = m(this._myContacts, (t) => t), this.updates = m(this._contactUpdates, (t) => t), this.config.signingProvider && this.initializeOwnContacts();
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
        const n = setTimeout(() => {
          r || (r = !0, i(null));
        }, t.timeout || 5e3);
        this.config.subscriptionManager.subscribe([s], {
          onEvent: (c) => {
            if (!r && c.kind === 3) {
              r = !0, clearTimeout(n);
              try {
                const l = this.parseContactEvent(c);
                this.cacheContactList(l), this._contactUpdates.update((o) => (o.set(e, l), new Map(o))), i(l);
              } catch {
                i(null);
              }
            }
          },
          onEose: () => {
            r || (r = !0, clearTimeout(n), i(null));
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
      const t = await this.config.signingProvider.getPublicKey(), s = e.map((o) => {
        const h = ["p", o.pubkey];
        return o.relayUrl && h.push(o.relayUrl), o.petname && h.push(o.petname), h;
      }), i = await this.config.eventBuilder.kind(3).content("").tags(s).build(), r = await this.config.signingProvider.signEvent(i);
      if ((await this.config.relayManager.publishToAll(r)).filter((o) => o.success).length === 0)
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
      return this._myContacts.set(l), this._contactUpdates.update((o) => (o.set(t, l), new Map(o))), this.cacheContactList(l), this.config.debug && console.log("Published contact list:", l), {
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
class Jt {
  constructor(e) {
    u(this, "config");
    u(this, "threadCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // threadId -> subscriptionId
    // Reactive stores
    u(this, "_watchedThreads", S(/* @__PURE__ */ new Map()));
    u(this, "_threadUpdates", S(/* @__PURE__ */ new Map()));
    // Public reactive properties
    u(this, "watchedThreads");
    u(this, "updates");
    this.config = e, this.watchedThreads = m(this._watchedThreads, (t) => t), this.updates = m(this._threadUpdates, (t) => t);
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
      }, o = {
        rootEventId: r.id,
        messages: [l],
        messageCount: 1,
        lastActivity: r.created_at,
        isWatched: !1
      };
      return this.cacheThread(o), this._threadUpdates.update((h) => (h.set(r.id, o), new Map(h))), this.config.debug && console.log("Created thread:", o), {
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
        const g = r.messages.find((f) => f.eventId === e.replyToEventId);
        g && i.add(g.authorPubkey);
      }
      for (const g of i)
        g !== t && s.push(["p", g]);
      const n = await this.config.eventBuilder.kind(1).content(e.content).tags(s).build(), c = await this.config.signingProvider.signEvent(n);
      if ((await this.config.relayManager.publishToAll(c)).filter((g) => g.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const h = {
        eventId: c.id,
        authorPubkey: t,
        content: e.content,
        createdAt: c.created_at,
        replyToEventId: e.replyToEventId,
        rootEventId: e.rootEventId,
        mentionedPubkeys: Array.from(i),
        depth: this.calculateDepth(e.replyToEventId, r),
        isOwn: !0
      };
      return r && (r.messages.push(h), r.messageCount = r.messages.length, r.lastActivity = c.created_at, this.cacheThread(r), this._threadUpdates.update((g) => (g.set(e.rootEventId, r), new Map(g)))), this.config.debug && console.log("Created reply:", h), {
        success: !0,
        eventId: c.id,
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
      const n = [], c = /* @__PURE__ */ new Set(), l = setTimeout(() => {
        if (!r)
          if (r = !0, n.length > 0) {
            const o = this.buildThread(e, n);
            this.cacheThread(o), i(o);
          } else
            i(null);
      }, t.timeout || 5e3);
      this.config.subscriptionManager.subscribe(s, {
        onEvent: (o) => {
          if (o.kind === 1 && !c.has(o.id)) {
            c.add(o.id);
            const h = this.parseTextNoteEvent(o, e);
            h && n.push(h);
          }
        },
        onEose: () => {
          if (!r)
            if (r = !0, clearTimeout(l), n.length > 0) {
              const o = this.buildThread(e, n);
              this.cacheThread(o), this._threadUpdates.update((h) => (h.set(e, o), new Map(h))), i(o);
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
    const s = [], i = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set([e]), n = /* @__PURE__ */ new Set();
    let c = 0;
    const l = 5;
    for (; r.size > 0 && c < l; ) {
      c++;
      const h = Array.from(r);
      r.clear(), this.config.debug && console.log(`Thread fetch phase ${c}: querying ${h.length} events`);
      const g = [];
      h.length > 0 && g.push({
        ids: h,
        kinds: [1],
        limit: h.length
      });
      for (const p of h)
        n.has(p) || (g.push({
          kinds: [1],
          "#e": [p],
          limit: Math.floor((t.limit || 100) / Math.max(1, c))
          // Reduce limit per phase
        }), n.add(p));
      if (g.length === 0)
        break;
      const f = await this.fetchEventsWithFilters(g, e, i);
      for (const p of f)
        i.has(p.eventId) || (s.push(p), i.add(p.eventId), p.replyToEventId && !i.has(p.replyToEventId) && r.add(p.replyToEventId));
      if (this.config.debug && console.log(`Phase ${c} complete: found ${f.length} new messages, ${r.size} more to query`), f.length === 0)
        break;
    }
    if (s.length === 0)
      return null;
    const o = this.buildThread(e, s);
    return this.cacheThread(o), this._threadUpdates.update((h) => (h.set(e, o), new Map(h))), this.config.debug && console.log(`Complete thread built: ${o.messageCount} messages across ${c} phases`), o;
  }
  /**
   * Fetch events using provided filters and parse them
   */
  async fetchEventsWithFilters(e, t, s) {
    return new Promise((i) => {
      const r = [];
      let n = !1;
      const c = setTimeout(() => {
        n || (n = !0, i(r));
      }, 3e3);
      this.config.subscriptionManager.subscribe(e, {
        onEvent: (l) => {
          if (l.kind === 1 && !s.has(l.id)) {
            const o = this.parseTextNoteEvent(l, t);
            o && r.push(o);
          }
        },
        onEose: () => {
          n || (n = !0, clearTimeout(c), i(r));
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
            const n = this.parseTextNoteEvent(r, e);
            n && !t.messages.find((c) => c.eventId === n.eventId) && (t.messages.push(n), t.messageCount = t.messages.length, t.lastActivity = n.createdAt, this.cacheThread(t), this._watchedThreads.update((c) => (c.set(e, { ...t }), new Map(c))), this._threadUpdates.update((c) => (c.set(e, { ...t }), new Map(c))));
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
      const i = this.parseNIP10Tags(e.tags), r = i.find((d) => d.meaning === "root"), n = i.find((d) => d.meaning === "reply"), c = i.filter((d) => d.meaning === "mention"), l = i.filter((d) => d.tagType === "e");
      let o, h = null, g = !1;
      if (r)
        o = r.value, g = o === t;
      else if (n)
        n.value === t ? (o = t, g = !0) : (o = n.value, g = l.some((d) => d.value === t), g && (o = t));
      else if (e.id === t)
        o = e.id, g = !0;
      else if (l.find((y) => y.value === t))
        o = t, g = !0;
      else
        return null;
      if (!g)
        return null;
      if (n)
        h = n.value;
      else if (l.length > 0 && e.id !== o)
        if (l.length === 1)
          h = l[0].value;
        else {
          const d = l[l.length - 1];
          d.value !== o && (h = d.value);
        }
      const f = c.map((d) => d.value), p = (s = this.config.signingProvider) != null && s.getPublicKey ? this.config.signingProvider.getPublicKey() : Promise.resolve("");
      return {
        eventId: e.id,
        authorPubkey: e.pubkey,
        content: e.content,
        createdAt: e.created_at,
        replyToEventId: h,
        rootEventId: o,
        mentionedPubkeys: f,
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
      const [r, n, c, l] = i;
      if (r === "e") {
        let o = "mention";
        l === "reply" ? o = "reply" : l === "root" && (o = "root"), t.push({
          tagType: "e",
          value: n,
          relayUrl: c || void 0,
          marker: l || void 0,
          meaning: o
        });
      } else r === "p" && t.push({
        tagType: "p",
        value: n,
        relayUrl: c || void 0,
        marker: l || void 0,
        meaning: "mention"
      });
    }
    const s = t.filter((i) => i.tagType === "e");
    return s.length > 0 && !s.some((i) => i.marker) && (s.length === 1 ? s[0].meaning = "reply" : s.length >= 2 && (s[0].meaning = "root", s[s.length - 1].meaning = "reply")), t;
  }
  buildThread(e, t) {
    t.sort((r, n) => r.createdAt - n.createdAt);
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
class qt {
  constructor(e) {
    u(this, "config");
    u(this, "reactionCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // eventId -> subscriptionId
    // Reactive stores
    u(this, "_reactionUpdates", S(/* @__PURE__ */ new Map()));
    u(this, "_watchedEvents", S(/* @__PURE__ */ new Map()));
    // Public reactive properties
    u(this, "updates");
    u(this, "watchedEvents");
    this.config = e, this.updates = m(this._reactionUpdates, (t) => t), this.watchedEvents = m(this._watchedEvents, (t) => t);
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
      if (s && s.reactions.find((f) => f.authorPubkey === t))
        return {
          success: !1,
          error: "User has already reacted to this event"
        };
      const i = [
        ["e", e.targetEventId],
        // Event being reacted to
        ["p", e.targetAuthorPubkey]
        // Author of the event
      ], r = await this.config.eventBuilder.kind(7).content(e.reactionType).tags(i).build(), n = await this.config.signingProvider.signEvent(r);
      if ((await this.config.relayManager.publishToAll(n)).filter((g) => g.success).length === 0)
        return {
          success: !1,
          error: "Failed to publish to any relay"
        };
      const o = {
        eventId: n.id,
        authorPubkey: t,
        targetEventId: e.targetEventId,
        targetAuthorPubkey: e.targetAuthorPubkey,
        reactionType: e.reactionType,
        createdAt: n.created_at,
        isOwn: !0
      }, h = this.getCachedReactions(e.targetEventId);
      return h && (h.reactions.push(o), h.summary = this.aggregateReactions(h.reactions, t), h.timestamp = Date.now(), this.reactionCache.set(e.targetEventId, h), this._reactionUpdates.update((g) => (g.set(e.targetEventId, h.summary), new Map(g)))), this.config.debug && console.log("Created reaction:", o), {
        success: !0,
        eventId: n.id,
        reaction: o
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
        const r = this.config.signingProvider ? await this.config.signingProvider.getPublicKey() : "", n = {
          targetEventId: e,
          totalCount: 0,
          reactions: {},
          userReacted: !1
        };
        this._watchedEvents.update((c) => (c.set(e, n), new Map(c)));
      }
      const s = {
        kinds: [7],
        "#e": [e],
        since: Math.floor(Date.now() / 1e3)
        // Only new reactions
      }, i = await this.config.subscriptionManager.subscribe([s], {
        onEvent: (r) => {
          if (r.kind === 7) {
            const n = this.parseReactionEvent(r);
            n && n.targetEventId === e && this.handleNewReaction(n);
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
      const n = [], c = /* @__PURE__ */ new Set(), l = setTimeout(() => {
        if (!r)
          if (r = !0, n.length > 0) {
            const o = this.buildReactionCache(e, n);
            this.cacheReactions(e, o), i(o);
          } else
            i(null);
      }, t.timeout || 5e3);
      this.config.subscriptionManager.subscribe(s, {
        onEvent: (o) => {
          if (o.kind === 7 && !c.has(o.id)) {
            c.add(o.id);
            const h = this.parseReactionEvent(o);
            h && h.targetEventId === e && n.push(h);
          }
        },
        onEose: () => {
          if (!r)
            if (r = !0, clearTimeout(l), n.length > 0) {
              const o = this.buildReactionCache(e, n);
              this.cacheReactions(e, o), i(o);
            } else
              i(null);
        }
      });
    });
  }
  parseReactionEvent(e) {
    var t;
    try {
      const s = e.tags.find((n) => n[0] === "e");
      if (!s || s.length < 2)
        return null;
      const i = e.tags.find((n) => n[0] === "p");
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
    var n;
    const s = {};
    let i = !1, r;
    for (const c of e)
      typeof t == "string" && (c.isOwn = c.authorPubkey === t, c.isOwn && (i = !0, r = c.reactionType)), s[c.reactionType] || (s[c.reactionType] = {
        type: c.reactionType,
        count: 0,
        authors: []
      }), s[c.reactionType].count++, s[c.reactionType].authors.includes(c.authorPubkey) || s[c.reactionType].authors.push(c.authorPubkey);
    return {
      targetEventId: ((n = e[0]) == null ? void 0 : n.targetEventId) || "",
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
class es {
  constructor(e) {
    u(this, "config");
    u(this, "feedCache", /* @__PURE__ */ new Map());
    u(this, "activeSubscriptions", /* @__PURE__ */ new Map());
    // Reactive stores
    u(this, "_globalFeed", S([]));
    u(this, "_followingFeed", S([]));
    // Public reactive properties
    u(this, "globalFeed");
    u(this, "followingFeed");
    this.config = e, this.globalFeed = m(this._globalFeed, (t) => t), this.followingFeed = m(this._followingFeed, (t) => t);
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
          }, n = await this.config.subscriptionManager.subscribe([r], {
            onEvent: (c) => {
              const l = this.eventToFeedItem(c);
              this._followingFeed.update((o) => [l, ...o.slice(0, 99)]);
            }
          });
          this.activeSubscriptions.set("following-updates", n);
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
      const r = [], n = /* @__PURE__ */ new Set(), c = setTimeout(() => {
        i || (i = !0, this.updateFeedStore(e, r), s(r));
      }, 1e4);
      this.config.subscriptionManager.subscribe(t, {
        onEvent: (l) => {
          if (!n.has(l.id)) {
            n.add(l.id);
            const o = this.eventToFeedItem(l);
            r.push(o);
          }
        },
        onEose: () => {
          i || (i = !0, clearTimeout(c), r.sort((l, o) => o.createdAt - l.createdAt), this.updateFeedStore(e, r), s(r));
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
class ts {
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
    return this._contactManager || (this._contactManager = new Zt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      // profileManager: removed,
      debug: this.config.debug
    })), this._contactManager;
  }
  getThreadManager() {
    return this._threadManager || (this._threadManager = new Jt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      // profileManager: removed,
      debug: this.config.debug
    })), this._threadManager;
  }
  getReactionManager() {
    return this._reactionManager || (this._reactionManager = new qt({
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      signingProvider: this.config.signingProvider,
      eventBuilder: this.config.eventBuilder,
      debug: this.config.debug
    })), this._reactionManager;
  }
  getFeedManager() {
    return this._feedManager || (this._feedManager = new es({
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
class ss {
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
    var s, i, r, n;
    try {
      const c = this.validateFilters(e);
      if (c)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: c
        };
      const l = this.generateSubscriptionId(), o = Date.now(), h = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, g = {
        id: l,
        filters: e,
        relays: h,
        state: "pending",
        createdAt: o,
        eventCount: 0,
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      h.forEach((E) => {
        g.relayStates[E] = "active";
      }), t.timeout && (g.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(l);
      }, t.timeout)), this.subscriptions.set(l, g), this.debug && console.log(`Creating subscription ${l} with ${e.length} filters`);
      const f = t.retryAttempts || 1, p = t.retryDelay || 1e3;
      let d = [], y;
      for (let E = 0; E < f; E++)
        try {
          const M = ["REQ", l, ...e];
          try {
            await ((i = (s = this.relayManager).sendToAll) == null ? void 0 : i.call(s, M)), d = h.map((D) => ({
              relay: D,
              success: !0,
              error: void 0
            }));
            break;
          } catch (D) {
            d = [];
            let Z = !1;
            for (const ae of h)
              try {
                await ((n = (r = this.relayManager).sendToRelays) == null ? void 0 : n.call(r, [ae], M)), d.push({
                  relay: ae,
                  success: !0,
                  error: void 0
                }), Z = !0;
              } catch (_) {
                d.push({
                  relay: ae,
                  success: !1,
                  error: _ instanceof Error ? _ : new Error("Unknown error")
                });
              }
            if (Z)
              break;
            y = D instanceof Error ? D : new Error("All relays failed");
          }
        } catch (M) {
          y = M instanceof Error ? M : new Error("Unknown error"), d = h.map((D) => ({
            relay: D,
            success: !1,
            error: y
          })), E < f - 1 && await new Promise((D) => setTimeout(D, p));
        }
      const P = d.length > 0 && d.some((E) => E.success);
      return P || (this.subscriptions.delete(l), g.timeoutId && clearTimeout(g.timeoutId)), {
        subscription: P ? this.externalizeSubscription(g) : {},
        success: P,
        relayResults: d,
        error: P ? void 0 : {
          message: y ? y.message : d.length === 0 ? "No relays available" : "All relays failed",
          retryable: !0
        }
      };
    } catch (c) {
      return {
        subscription: {},
        success: !1,
        relayResults: [],
        error: {
          message: c instanceof Error ? c.message : "Unknown error",
          retryable: !0
        }
      };
    }
  }
  /**
   * Activate a pending subscription by sending REQ messages
   */
  async activate(e) {
    var s, i, r, n;
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    t.state = "active";
    try {
      const c = ["REQ", e, ...t.filters], l = this.relayManager.connectedRelays;
      t.relays.length !== l.length || !t.relays.every((h) => l.includes(h)) ? await ((i = (s = this.relayManager).sendToRelays) == null ? void 0 : i.call(s, t.relays, c)) : await ((n = (r = this.relayManager).sendToAll) == null ? void 0 : n.call(r, c));
    } catch (c) {
      throw t.state = "error", c;
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
        const n = ["CLOSE", e];
        await ((r = (i = this.relayManager).sendToAll) == null ? void 0 : r.call(i, n));
      } catch (n) {
        this.debug && console.error(`Error sending CLOSE for ${e}:`, n);
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
        const n = r[0];
        await this.handleRelayEvent(e, i, n);
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
        } catch (n) {
          s.push({
            relay: r,
            success: !1,
            error: n instanceof Error ? n.message : "Unknown error",
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
        e.relays.forEach((n) => {
          s.push({
            relay: n,
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
class me {
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
    return await se.unwrapGiftWrap(e, this.privateKey);
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
      const i = e.authors.map((n) => this.eventsByAuthor.get(n) || /* @__PURE__ */ new Set()), r = this.unionSets(i);
      t = t ? this.intersectSets([t, r]) : r;
    }
    Object.entries(e).forEach(([i, r]) => {
      if (i.startsWith("#") && Array.isArray(r) && r.length > 0) {
        const n = i.slice(1), c = this.eventsByTag.get(n);
        if (c) {
          const l = r.map((h) => c.get(h) || /* @__PURE__ */ new Set()), o = this.unionSets(l);
          t = t ? this.intersectSets([t, o]) : o;
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
      var l, o;
      const [n, c] = r;
      c && ((o = (l = this.eventsByTag.get(n)) == null ? void 0 : l.get(c)) == null || o.delete(e));
    }), this.lastAccess.delete(e));
  }
  estimateMemoryUsage() {
    return this.events.size * 1024 / (1024 * 1024);
  }
}
class Se {
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
class Ie {
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
let is = class extends Se {
  constructor(e) {
    super(), this.cache = e;
  }
  execute() {
    return new Ie(this.cache, this.filter);
  }
}, rs = class extends Se {
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
    var n;
    const t = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {}, s = await this.subscriptionManager.subscribe([this.filter], {
      ...t,
      onEvent: (c) => {
        this.cache.addEvent(c);
      }
    });
    if (!s.success || !s.subscription)
      throw new Error(((n = s.error) == null ? void 0 : n.message) || "Subscription failed");
    const i = s.subscription, r = new Ie(this.cache, this.filter);
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
class Je {
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
      const n = /* @__PURE__ */ new Map();
      i.forEach((l) => {
        const o = n.get(l.pubkey);
        (!o || l.created_at > o.created_at) && n.set(l.pubkey, l);
      }), n.forEach((l, o) => {
        try {
          const h = JSON.parse(l.content);
          s.set(o, h), this.stats.profileHits++;
        } catch {
          this.stats.profileMisses++;
        }
      });
      const c = new Set(s.keys());
      return e.forEach((l) => {
        c.has(l) || this.stats.profileMisses++;
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
class qe {
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
    this.config = e, e.cache && (this.cacheInterface = new Je(e.cache), e.debug && console.log("📦 ProfileStore: Cache interface initialized for", e.pubkey.substring(0, 16) + "...")), this.store = S({
      profile: null,
      loading: !0,
      error: null,
      verified: !1,
      lastUpdated: null
    }), this.profile = m(this.store, (t) => t.profile), this.loading = m(this.store, (t) => t.loading), this.error = m(this.store, (t) => t.error), this.initialize();
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
            const n = await this.checkNip05Verification(s);
            this.store.set({
              profile: s,
              loading: !1,
              error: null,
              verified: n,
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
          this.store.update((n) => ({
            ...n,
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
class et {
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
    }, i = N.addEventId(s), r = await this.config.signingProvider.signEvent(s);
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
      }, i = N.addEventId(s), r = await this.config.signingProvider.signEvent(s), n = {
        ...i,
        sig: r
      }, l = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (h) => {
          try {
            return await this.config.relayManager.sendToRelay(h, ["EVENT", n]), { success: !0, relay: h };
          } catch (g) {
            return {
              success: !1,
              relay: h,
              error: g instanceof Error ? g.message : "Unknown error"
            };
          }
        })
      )).filter(
        (h) => h.status === "fulfilled" && h.value.success
      ).map((h) => h.value.relay);
      return l.length > 0 ? (this.config.debug && console.log(`ProfileBuilder: Published to ${l.length} relays`), {
        success: !0,
        eventId: n.id
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
          onEvent: (n) => {
            if (n.kind === 0 && n.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              try {
                const c = JSON.parse(n.content), l = {
                  pubkey: n.pubkey,
                  metadata: c,
                  lastUpdated: n.created_at,
                  eventId: n.id,
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
class tt {
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
        let n = !1;
        const c = setTimeout(() => {
          n || (n = !0, r({
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
                const o = JSON.parse(l.content), h = {
                  pubkey: l.pubkey,
                  metadata: o,
                  lastUpdated: l.created_at,
                  eventId: l.id,
                  isOwn: !1
                  // Batch operations are typically for other users
                };
                t.set(l.pubkey, h), i++, this.config.debug && console.log(`ProfileBatchBuilder: Found profile for ${l.pubkey.substring(0, 16)}...`);
              } catch (o) {
                s.set(l.pubkey, "Failed to parse profile data"), this.config.debug && console.error(`ProfileBatchBuilder: Parse error for ${l.pubkey}:`, o);
              }
          },
          onEose: () => {
            n || (n = !0, clearTimeout(c), this.config.debug && console.log(`ProfileBatchBuilder: Batch complete - found ${i}/${this.pubkeys.length} profiles`), r({
              profiles: t,
              success: !0,
              errors: s,
              totalRequested: this.pubkeys.length,
              totalFound: i
            }));
          },
          onError: (l) => {
            n || (n = !0, clearTimeout(c), this.pubkeys.forEach((o) => {
              s.set(o, l.message);
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
      return S({
        profiles: /* @__PURE__ */ new Map(),
        loading: !1,
        loadingStates: /* @__PURE__ */ new Map(),
        errors: /* @__PURE__ */ new Map(),
        lastUpdated: /* @__PURE__ */ new Date()
      });
    const e = S({
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
      this.pubkeys.forEach((o) => {
        s.set(o, null), i.set(o, !0);
      }), e.set({
        profiles: s,
        loading: !0,
        loadingStates: i,
        errors: r,
        lastUpdated: null
      });
      let n = !1;
      const c = setTimeout(() => {
        n || (n = !0, this.pubkeys.forEach((o) => {
          i.set(o, !1);
        }), e.update((o) => ({
          ...o,
          loading: !1,
          loadingStates: i,
          lastUpdated: /* @__PURE__ */ new Date()
        })));
      }, 5e3), l = await this.config.subscriptionManager.subscribe([t], {
        onEvent: (o) => {
          if (o.kind === 0 && this.pubkeys.includes(o.pubkey))
            try {
              const h = JSON.parse(o.content), g = {
                pubkey: o.pubkey,
                metadata: h,
                lastUpdated: o.created_at,
                eventId: o.id,
                isOwn: !1
              };
              s.set(o.pubkey, g), i.set(o.pubkey, !1), e.update((f) => ({
                ...f,
                profiles: new Map(s),
                loadingStates: new Map(i)
              })), this.config.debug && console.log(`ProfileBatchBuilder Store: Updated profile for ${o.pubkey.substring(0, 16)}...`);
            } catch (h) {
              r.set(o.pubkey, h instanceof Error ? h : new Error("Parse error")), i.set(o.pubkey, !1), e.update((g) => ({
                ...g,
                loadingStates: new Map(i),
                errors: new Map(r)
              }));
            }
        },
        onEose: () => {
          if (!n && (n = !0, clearTimeout(c), this.pubkeys.forEach((o) => {
            i.set(o, !1);
          }), e.update((o) => ({
            ...o,
            loading: !1,
            loadingStates: new Map(i),
            lastUpdated: /* @__PURE__ */ new Date()
          })), this.config.debug)) {
            const o = Array.from(s.values()).filter((h) => h !== null).length;
            console.log(`ProfileBatchBuilder Store: Batch complete - ${o}/${this.pubkeys.length} profiles`);
          }
        },
        onError: (o) => {
          n || (n = !0, clearTimeout(c), this.pubkeys.forEach((h) => {
            r.set(h, o), i.set(h, !1);
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
class st {
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
        const n = setTimeout(() => {
          r || (r = !0, this.finalizeResults(t, i));
        }, 1e4);
        this.config.subscriptionManager.subscribe([e], {
          onEvent: async (c) => {
            if (c.kind === 0 && !s.has(c.pubkey)) {
              s.add(c.pubkey);
              try {
                const l = await this.parseProfileEvent(c), o = await this.evaluateProfile(l);
                o && (t.push(o), this.config.debug && console.log(`ProfileDiscoveryBuilder: Found match - ${l.metadata.name || "unnamed"} (score: ${o.relevanceScore})`), this.criteria.limit && t.length >= this.criteria.limit && (r || (r = !0, clearTimeout(n), this.finalizeResults(t, i))));
              } catch (l) {
                this.config.debug && console.error("ProfileDiscoveryBuilder: Error processing profile:", l);
              }
            }
          },
          onEose: () => {
            r || (r = !0, clearTimeout(n), this.finalizeResults(t, i));
          },
          onError: (c) => {
            r || (r = !0, clearTimeout(n), this.config.debug && console.error("ProfileDiscoveryBuilder: Search error:", c), i(t));
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
    var c, l;
    const t = [];
    let s = 0, i = 0, r = 0;
    if (this.criteria.nameQuery) {
      r++;
      const o = ((c = e.metadata.name) == null ? void 0 : c.toLowerCase()) || "";
      if (o.includes(this.criteria.nameQuery))
        t.push("name"), i++, o === this.criteria.nameQuery ? s += 1 : o.startsWith(this.criteria.nameQuery) ? s += 0.8 : s += 0.5;
      else
        return null;
    }
    if (this.criteria.nip05Query) {
      r++;
      const o = ((l = e.metadata.nip05) == null ? void 0 : l.toLowerCase()) || "";
      if (o.includes(this.criteria.nip05Query))
        t.push("nip05"), i++, s += o === this.criteria.nip05Query ? 1 : 0.7;
      else
        return null;
    }
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0)
      for (const [o, h] of this.criteria.metadataFilters) {
        r++;
        const g = e.metadata[o];
        g !== void 0 && (h === void 0 ? (t.push(o), i++, s += 0.3) : typeof g == "string" && typeof h == "string" ? g.toLowerCase().includes(h.toLowerCase()) && (t.push(o), i++, s += g.toLowerCase() === h.toLowerCase() ? 0.8 : 0.5) : g === h && (t.push(o), i++, s += 0.8));
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
    const n = Math.min(1, s / Math.max(r, 1));
    return {
      profile: e,
      matchedFields: t,
      relevanceScore: n
    };
  }
  async checkNip05Verification(e) {
    var t;
    if (!e.metadata.nip05) return !1;
    try {
      const [s, i] = e.metadata.nip05.split("@");
      if (!s || !i) return !1;
      const r = new AbortController(), n = setTimeout(() => r.abort(), 5e3), c = await fetch(`https://${i}/.well-known/nostr.json?name=${s}`, {
        signal: r.signal
      });
      return clearTimeout(n), c.ok ? ((t = (await c.json()).names) == null ? void 0 : t[s]) === e.pubkey : !1;
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
class it {
  constructor(e) {
    u(this, "config");
    u(this, "store");
    u(this, "subscriptionId");
    // Derived stores for easy access
    u(this, "follows");
    u(this, "count");
    u(this, "loading");
    u(this, "error");
    this.config = e, this.store = S({
      follows: [],
      loading: !0,
      error: null,
      lastUpdated: null
    }), this.follows = m(this.store, (t) => t.follows), this.count = m(this.store, (t) => t.follows.length), this.loading = m(this.store, (t) => t.loading), this.error = m(this.store, (t) => t.error), this.initialize();
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
    return m(
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
          this.store.update((n) => ({
            ...n,
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
class rt {
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
      if (t.some((d) => d.pubkey === this.targetPubkey))
        return this.config.debug && console.log("FollowBuilder: Already following", this.targetPubkey.substring(0, 16) + "..."), {
          success: !1,
          error: "Already following this user"
        };
      const i = {
        pubkey: this.targetPubkey,
        relayUrl: this.relayUrl,
        petname: this.petnameValue
      }, c = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: [...t, i].map((d) => {
          const y = ["p", d.pubkey];
          return d.relayUrl && y.push(d.relayUrl), d.petname && y.push(d.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, l = N.addEventId(c), o = await this.config.signingProvider.signEvent(c), h = {
        ...l,
        sig: o
      }, f = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (d) => {
          try {
            return await this.config.relayManager.sendToRelay(d, ["EVENT", h]), { success: !0, relay: d };
          } catch (y) {
            return {
              success: !1,
              relay: d,
              error: y instanceof Error ? y.message : "Unknown error"
            };
          }
        })
      )).filter(
        (d) => d.status === "fulfilled" && d.value.success
      ).map((d) => d.value.relay);
      return f.length > 0 ? (this.config.debug && console.log(`FollowBuilder: Published follow list to ${f.length} relays`), {
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
          onEvent: (n) => {
            if (n.kind === 3 && n.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              const c = this.parseFollowListEvent(n);
              s(c);
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
class nt {
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
        (f) => !this.toRemove.includes(f.pubkey)
      ), this.config.debug && console.log(`FollowBatchBuilder: Removed ${this.toRemove.length} follows`)), this.toAdd.length > 0) {
        const f = this.toAdd.filter((p) => !s.some((d) => d.pubkey === p)).map((p) => ({ pubkey: p }));
        s.push(...f), this.config.debug && console.log(`FollowBatchBuilder: Added ${f.length} new follows (${this.toAdd.length - f.length} were duplicates)`);
      }
      const r = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.map((f) => {
          const p = ["p", f.pubkey];
          return f.relayUrl && p.push(f.relayUrl), f.petname && p.push(f.petname), p;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, n = N.addEventId(r), c = await this.config.signingProvider.signEvent(r), l = {
        ...n,
        sig: c
      }, h = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (f) => {
          try {
            return await this.config.relayManager.sendToRelay(f, ["EVENT", l]), { success: !0, relay: f };
          } catch (p) {
            return {
              success: !1,
              relay: f,
              error: p instanceof Error ? p.message : "Unknown error"
            };
          }
        })
      )).filter(
        (f) => f.status === "fulfilled" && f.value.success
      ).map((f) => f.value.relay);
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
          onEvent: (n) => {
            if (n.kind === 3 && n.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              const c = this.parseFollowListEvent(n);
              s(c);
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
class at {
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
    const t = new it({
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
    return new rt({
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
      if (!s.some((d) => d.pubkey === e))
        return this.config.debug && console.log("FollowsModule: Not following", e.substring(0, 16) + "..."), {
          success: !1,
          error: "Not following this user"
        };
      const c = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.filter((d) => d.pubkey !== e).map((d) => {
          const y = ["p", d.pubkey];
          return d.relayUrl && y.push(d.relayUrl), d.petname && y.push(d.petname), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: t
      }, l = N.addEventId(c), o = await this.config.signingProvider.signEvent(c), h = {
        ...l,
        sig: o
      }, f = (await Promise.allSettled(
        this.config.relayManager.relayUrls.map(async (d) => {
          try {
            return await this.config.relayManager.sendToRelay(d, ["EVENT", h]), { success: !0, relay: d };
          } catch (y) {
            return {
              success: !1,
              relay: d,
              error: y instanceof Error ? y.message : "Unknown error"
            };
          }
        })
      )).filter(
        (d) => d.status === "fulfilled" && d.value.success
      ).map((d) => d.value.relay);
      return f.length > 0 ? (this.config.debug && console.log(`FollowsModule: Published updated follow list to ${f.length} relays`), {
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
    return new nt({
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
          onEvent: (n) => {
            if (n.kind === 3 && n.pubkey === e && !i) {
              i = !0, clearTimeout(r);
              const c = this.parseFollowListEvent(n);
              s(c);
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
class ot {
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
    const t = new qe({
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
    return new et({
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
    return this._follows || (this._follows = new at({
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
    return new tt({
      subscriptionManager: this.config.subscriptionManager,
      debug: this.config.debug
    });
  }
  /**
   * Phase 6: Profile Discovery - Search and discover profiles
   * Creates a ProfileDiscoveryBuilder for profile search operations
   */
  discover() {
    return new st({
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
class ps {
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
      relays: e.relays ?? St,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? ee.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? ee.RETRY_DELAY,
      timeout: e.timeout ?? ee.PUBLISH_TIMEOUT,
      signingProvider: e.signingProvider
    }, this.relayManager = new _t(this.config.relays, {
      debug: this.config.debug
    }), this.subscriptionManager = new ss(this.relayManager), this.events = new Tt(this), e.signingProvider ? (this.signingProvider = e.signingProvider, this.signingMethod = e.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary", this.cache = new me("", {}), this._initializeCache().catch((t) => {
      this.config.debug && console.log("⚠️ Cache initialization with private key failed:", t);
    }), this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!")) : (this.cache = new me("", {}), this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later")), this.dm = new Ze({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    }), this.social = new ts({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      eventBuilder: new N(),
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
        this.cache = new me(e, {});
        const t = await this.signingProvider.getPublicKey();
        this.universalDM = new Qt(this, t), this.config.debug && console.log("🎯 Universal Cache and Universal DM Module initialized");
      } catch {
        this.cache = new me("", {}), this.config.debug && console.log("⚠️ Could not get private key for cache, using empty key (no gift wrap decryption)");
      }
  }
  /**
   * Get enhanced profile module (PERFECT DX - always works!)
   */
  get profile() {
    return this._profile || (this._profile = new ot({
      relayManager: this.relayManager,
      subscriptionManager: this.subscriptionManager,
      signingProvider: this.signingProvider,
      eventBuilder: new N(),
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
      const { provider: t, method: s } = await kt.createBestAvailable();
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
    const s = await new N(this.signingProvider).buildAndSign(e);
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
    return new is(this.subscriptionManager);
  }
  /**
   * Create a subscription builder
   */
  sub() {
    return new rs(this.subscriptionManager);
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
class ys extends Se {
  constructor(e) {
    super(), this.cache = e;
  }
  execute() {
    return new Ie(this.cache, this.filter);
  }
}
class bs extends Se {
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
    var n;
    const t = this.relayUrls.length > 0 ? { relays: this.relayUrls } : {}, s = await this.subscriptionManager.subscribe([this.filter], {
      ...t,
      onEvent: (c) => {
        this.cache.addEvent(c);
      }
    });
    if (!s.success || !s.subscription)
      throw new Error(((n = s.error) == null ? void 0 : n.message) || "Subscription failed");
    const i = s.subscription, r = new Ie(this.cache, this.filter);
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
const ms = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: Qe,
  DMModule: Ze,
  DMRoom: Xe,
  EphemeralKeyManager: Ee,
  GiftWrapCreator: Me,
  GiftWrapProtocol: se,
  NIP44Crypto: I,
  SealCreator: ue,
  TimestampRandomizer: Re
}, Symbol.toStringTag, { value: "Module" })), ws = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FollowBatchBuilder: nt,
  FollowBuilder: rt,
  FollowListStore: it,
  FollowsModule: at,
  ProfileBatchBuilder: tt,
  ProfileBuilder: et,
  ProfileCacheInterface: Je,
  ProfileDiscoveryBuilder: st,
  ProfileModule: ot,
  ProfileStore: qe
}, Symbol.toStringTag, { value: "Module" })), vs = "0.1.0";
export {
  St as DEFAULT_RELAYS,
  ms as DM,
  Oe as EVENT_KINDS,
  T as ErrorHandler,
  N as EventBuilder,
  Tt as EventsModule,
  xe as ExtensionSigner,
  Fe as FeedStoreImpl,
  At as FluentEventBuilder,
  De as LocalKeySigner,
  ps as NostrUnchained,
  ws as Profile,
  ys as QueryBuilder,
  os as QuickSigner,
  _t as RelayManager,
  kt as SigningProviderFactory,
  bs as SubBuilder,
  ss as SubscriptionManager,
  cs as TemporarySigner,
  vs as VERSION,
  us as createFeed,
  gs as createFeedFromFilter,
  hs as createFeedFromQuery,
  m as derived,
  ls as setDefaultSubscriptionManager,
  S as writable
};
