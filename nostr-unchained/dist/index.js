var q = Object.defineProperty;
var Q = (i, e, t) => e in i ? q(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var l = (i, e, t) => Q(i, typeof e != "symbol" ? e + "" : e, t);
import * as z from "@noble/secp256k1";
const M = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function J(i) {
  return i instanceof Uint8Array || ArrayBuffer.isView(i) && i.constructor.name === "Uint8Array";
}
function U(i, ...e) {
  if (!J(i))
    throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(i.length))
    throw new Error("Uint8Array expected of length " + e + ", got length=" + i.length);
}
function V(i, e = !0) {
  if (i.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (e && i.finished)
    throw new Error("Hash#digest() has already been called");
}
function Z(i, e) {
  U(i);
  const t = e.outputLen;
  if (i.length < t)
    throw new Error("digestInto() expects output buffer of length at least " + t);
}
function B(...i) {
  for (let e = 0; e < i.length; e++)
    i[e].fill(0);
}
function $(i) {
  return new DataView(i.buffer, i.byteOffset, i.byteLength);
}
function w(i, e) {
  return i << 32 - e | i >>> e;
}
const ee = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", te = /* @__PURE__ */ Array.from({ length: 256 }, (i, e) => e.toString(16).padStart(2, "0"));
function D(i) {
  if (U(i), ee)
    return i.toHex();
  let e = "";
  for (let t = 0; t < i.length; t++)
    e += te[i[t]];
  return e;
}
function se(i) {
  if (typeof i != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(i));
}
function Y(i) {
  return typeof i == "string" && (i = se(i)), U(i), i;
}
class re {
}
function ne(i) {
  const e = (s) => i().update(Y(s)).digest(), t = i();
  return e.outputLen = t.outputLen, e.blockLen = t.blockLen, e.create = () => i(), e;
}
function ie(i = 32) {
  if (M && typeof M.getRandomValues == "function")
    return M.getRandomValues(new Uint8Array(i));
  if (M && typeof M.randomBytes == "function")
    return Uint8Array.from(M.randomBytes(i));
  throw new Error("crypto.getRandomValues must be defined");
}
function oe(i, e, t, s) {
  if (typeof i.setBigUint64 == "function")
    return i.setBigUint64(e, t, s);
  const r = BigInt(32), n = BigInt(4294967295), o = Number(t >> r & n), a = Number(t & n), c = s ? 4 : 0, d = s ? 0 : 4;
  i.setUint32(e + c, o, s), i.setUint32(e + d, a, s);
}
function ae(i, e, t) {
  return i & e ^ ~i & t;
}
function ce(i, e, t) {
  return i & e ^ i & t ^ e & t;
}
class le extends re {
  constructor(e, t, s, r) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = e, this.outputLen = t, this.padOffset = s, this.isLE = r, this.buffer = new Uint8Array(e), this.view = $(this.buffer);
  }
  update(e) {
    V(this), e = Y(e), U(e);
    const { view: t, buffer: s, blockLen: r } = this, n = e.length;
    for (let o = 0; o < n; ) {
      const a = Math.min(r - this.pos, n - o);
      if (a === r) {
        const c = $(e);
        for (; r <= n - o; o += r)
          this.process(c, o);
        continue;
      }
      s.set(e.subarray(o, o + a), this.pos), this.pos += a, o += a, this.pos === r && (this.process(t, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    V(this), Z(e, this), this.finished = !0;
    const { buffer: t, view: s, blockLen: r, isLE: n } = this;
    let { pos: o } = this;
    t[o++] = 128, B(this.buffer.subarray(o)), this.padOffset > r - o && (this.process(s, 0), o = 0);
    for (let u = o; u < r; u++)
      t[u] = 0;
    oe(s, r - 8, BigInt(this.length * 8), n), this.process(s, 0);
    const a = $(e), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const d = c / 4, h = this.get();
    if (d > h.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let u = 0; u < d; u++)
      a.setUint32(4 * u, h[u], n);
  }
  digest() {
    const { buffer: e, outputLen: t } = this;
    this.digestInto(e);
    const s = e.slice(0, t);
    return this.destroy(), s;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: t, buffer: s, length: r, finished: n, destroyed: o, pos: a } = this;
    return e.destroyed = o, e.finished = n, e.length = r, e.pos = a, r % t && e.buffer.set(s), e;
  }
  clone() {
    return this._cloneInto();
  }
}
const _ = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), ue = /* @__PURE__ */ Uint32Array.from([
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
]), S = /* @__PURE__ */ new Uint32Array(64);
class he extends le {
  constructor(e = 32) {
    super(64, e, 8, !1), this.A = _[0] | 0, this.B = _[1] | 0, this.C = _[2] | 0, this.D = _[3] | 0, this.E = _[4] | 0, this.F = _[5] | 0, this.G = _[6] | 0, this.H = _[7] | 0;
  }
  get() {
    const { A: e, B: t, C: s, D: r, E: n, F: o, G: a, H: c } = this;
    return [e, t, s, r, n, o, a, c];
  }
  // prettier-ignore
  set(e, t, s, r, n, o, a, c) {
    this.A = e | 0, this.B = t | 0, this.C = s | 0, this.D = r | 0, this.E = n | 0, this.F = o | 0, this.G = a | 0, this.H = c | 0;
  }
  process(e, t) {
    for (let u = 0; u < 16; u++, t += 4)
      S[u] = e.getUint32(t, !1);
    for (let u = 16; u < 64; u++) {
      const g = S[u - 15], v = S[u - 2], b = w(g, 7) ^ w(g, 18) ^ g >>> 3, m = w(v, 17) ^ w(v, 19) ^ v >>> 10;
      S[u] = m + S[u - 7] + b + S[u - 16] | 0;
    }
    let { A: s, B: r, C: n, D: o, E: a, F: c, G: d, H: h } = this;
    for (let u = 0; u < 64; u++) {
      const g = w(a, 6) ^ w(a, 11) ^ w(a, 25), v = h + g + ae(a, c, d) + ue[u] + S[u] | 0, m = (w(s, 2) ^ w(s, 13) ^ w(s, 22)) + ce(s, r, n) | 0;
      h = d, d = c, c = a, a = o + v | 0, o = n, n = r, r = s, s = v + m | 0;
    }
    s = s + this.A | 0, r = r + this.B | 0, n = n + this.C | 0, o = o + this.D | 0, a = a + this.E | 0, c = c + this.F | 0, d = d + this.G | 0, h = h + this.H | 0, this.set(s, r, n, o, a, c, d, h);
  }
  roundClean() {
    B(S);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), B(this.buffer);
  }
}
const de = /* @__PURE__ */ ne(() => new he()), fe = de, ge = [
  "ws://umbrel.local:4848",
  // Local testing relay (highest priority)
  "wss://relay.damus.io"
  // Single public relay fallback
], I = {
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
}, X = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_SERVER: 2,
  CONTACT_LIST: 3,
  ENCRYPTED_DM: 4,
  DELETE: 5
}, y = {
  EMPTY_CONTENT: "Content cannot be empty",
  CONTENT_TOO_LONG: "Content too long",
  NO_RELAYS: "No relays configured",
  CONNECTION_FAILED: "Failed to connect to relay",
  SIGNING_FAILED: "Failed to sign event",
  PUBLISH_FAILED: "Failed to publish to any relay",
  NO_EXTENSION: "No browser extension available",
  INVALID_EVENT: "Invalid event structure"
}, k = {
  EMPTY_CONTENT: "Add some content to your message",
  CONTENT_TOO_LONG: `Keep your message under ${I.MAX_CONTENT_LENGTH} characters`,
  CONNECTION_FAILED: "Check your internet connection and try again",
  NO_EXTENSION: "Install a Nostr browser extension or the library will use a temporary key",
  PUBLISH_FAILED: "Try again or check if your relays are accessible"
}, L = {
  HEX_64: /^[a-f0-9]{64}$/,
  // Event IDs and public keys
  HEX_128: /^[a-f0-9]{128}$/,
  // Signatures
  WEBSOCKET_URL: /^wss?:\/\/.+/
  // WebSocket URLs
};
class E {
  /**
   * Create a text note event (kind 1)
   */
  static createTextNote(e, t) {
    return {
      pubkey: t,
      created_at: Math.floor(Date.now() / 1e3),
      kind: X.TEXT_NOTE,
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
    ]), s = new TextEncoder().encode(t), r = fe(s);
    return D(r);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(e) {
    const t = E.calculateEventId(e);
    return { ...e, id: t };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(e) {
    const t = [];
    if (e.pubkey || t.push("Missing pubkey"), e.created_at || t.push("Missing created_at"), typeof e.kind != "number" && t.push("Missing or invalid kind"), Array.isArray(e.tags) || t.push("Missing or invalid tags"), typeof e.content != "string" && t.push("Missing or invalid content"), e.pubkey && !L.HEX_64.test(e.pubkey) && t.push("Invalid pubkey format (must be 64-character hex string)"), e.id && !L.HEX_64.test(e.id) && t.push("Invalid event ID format (must be 64-character hex string)"), e.sig && !L.HEX_128.test(e.sig) && t.push("Invalid signature format (must be 128-character hex string)"), e.content === "" && t.push(y.EMPTY_CONTENT), e.content && e.content.length > I.MAX_CONTENT_LENGTH && t.push(y.CONTENT_TOO_LONG), e.created_at) {
      const s = Math.floor(Date.now() / 1e3), r = s - 3600, n = s + 3600;
      (e.created_at < r || e.created_at > n) && t.push("Timestamp is too far in the past or future");
    }
    return e.tags && (Array.isArray(e.tags) ? e.tags.forEach((s, r) => {
      Array.isArray(s) ? s.forEach((n, o) => {
        typeof n != "string" && t.push(`Tag ${r}[${o}] must be a string`);
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
    return e === "" && t.push(y.EMPTY_CONTENT), e.length > I.MAX_CONTENT_LENGTH && t.push(y.CONTENT_TOO_LONG), {
      valid: t.length === 0,
      errors: t
    };
  }
  /**
   * Verify event ID matches calculated hash
   */
  static verifyEventId(e) {
    return E.calculateEventId({
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
    const r = E.validateContent(e);
    if (!r.valid)
      throw new Error(`Invalid content: ${r.errors.join(", ")}`);
    const n = {
      pubkey: t,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? X.TEXT_NOTE,
      tags: s.tags ?? [],
      content: e
    }, o = E.validateEvent(n);
    if (!o.valid)
      throw new Error(`Invalid event: ${o.errors.join(", ")}`);
    return n;
  }
}
async function ye() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class be {
  constructor(e, t = {}) {
    l(this, "connections", /* @__PURE__ */ new Map());
    l(this, "debug");
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
        const n = await ye(), o = new n(e), a = setTimeout(() => {
          o.close(), t.state = "error", t.error = "Connection timeout", r(new Error(`Connection to ${e} timed out`));
        }, I.CONNECTION_TIMEOUT);
        o.onopen = () => {
          clearTimeout(a), t.ws = o, t.state = "connected", t.lastConnected = Date.now(), t.error = void 0, this.debug && console.log(`Connected to relay: ${e}`), s(!0);
        }, o.onerror = (c) => {
          clearTimeout(a), t.state = "error", t.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${e}:`, c), r(new Error(`Failed to connect to ${e}: WebSocket error`));
        }, o.onclose = () => {
          t.state = "disconnected", t.ws = void 0, this.debug && console.log(`Disconnected from relay: ${e}`);
        }, o.onmessage = (c) => {
          this.handleRelayMessage(e, c.data);
        };
      } catch (n) {
        t.state = "error", t.error = n instanceof Error ? n.message : "Unknown error", r(n);
      }
    }));
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(e) {
    const t = [], s = this.connectedRelays.map(async (r) => {
      const n = Date.now();
      try {
        const o = await this.publishToRelay(r, e), a = Date.now() - n;
        t.push({
          relay: r,
          success: o,
          latency: a
        });
      } catch (o) {
        const a = Date.now() - n;
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
    return new Promise((r, n) => {
      const o = s.ws, a = ["EVENT", t], c = setTimeout(() => {
        n(new Error("Publish timeout"));
      }, I.PUBLISH_TIMEOUT), d = t.id;
      this.pendingPublishes.set(d, { resolve: r, reject: n, timeout: c });
      try {
        const h = JSON.stringify(a);
        o.send(h), this.debug && (console.log(`📤 Publishing event ${t.id} to ${e}`), console.log("📤 Message:", h), console.log("📤 Added to pending:", d));
      } catch (h) {
        clearTimeout(c), this.pendingPublishes.delete(d), n(h);
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
        const [, r, n, o] = s, a = this.pendingPublishes.get(r);
        this.debug && (console.log(`OK for event ${r}, success: ${n}, pending: ${!!a}`), console.log("Pending publishes:", Array.from(this.pendingPublishes.keys()))), a ? (clearTimeout(a.timeout), this.pendingPublishes.delete(r), n ? a.resolve(!0) : a.reject(new Error(o || "Relay rejected event"))) : this.debug && console.warn(`No pending publish found for event ID: ${r}`);
      } else if (s[0] === "NOTICE") {
        const [, r] = s;
        this.debug && console.log(`Notice from ${e}:`, r);
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
      return L.WEBSOCKET_URL.test(e) ? (await this.connectToRelay(e), { success: !0 }) : {
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
      (r) => this.sendToRelay(r, t).catch((n) => {
        this.debug && console.warn(`Failed to send to ${r}:`, n);
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
class P {
  async getPublicKey() {
    if (!window.nostr)
      throw new Error(y.NO_EXTENSION);
    try {
      return await window.nostr.getPublicKey();
    } catch (e) {
      throw new Error(`Extension signing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  async signEvent(e) {
    if (!window.nostr)
      throw new Error(y.NO_EXTENSION);
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
class Ee {
  constructor() {
    l(this, "privateKey");
    l(this, "publicKey");
    const e = ie(32);
    this.privateKey = D(e), this.publicKey = D(z.schnorr.getPublicKey(this.privateKey));
  }
  async getPublicKey() {
    return this.publicKey;
  }
  async signEvent(e) {
    const t = E.calculateEventId(e), s = await z.schnorr.sign(t, this.privateKey);
    return D(s);
  }
}
class we {
  static async createBestAvailable() {
    if (await P.isAvailable())
      try {
        const e = new P();
        return await e.getPublicKey(), {
          provider: e,
          method: "extension"
        };
      } catch (e) {
        console.warn("Extension detected but failed to initialize:", e);
      }
    return {
      provider: new Ee(),
      method: "temporary"
    };
  }
}
class f {
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
    return e === "" ? f.createError("validation", y.EMPTY_CONTENT, {
      retryable: !0,
      suggestion: k.EMPTY_CONTENT
    }) : e.length > 8192 ? f.createError("validation", y.CONTENT_TOO_LONG, {
      retryable: !0,
      suggestion: k.CONTENT_TOO_LONG
    }) : f.createError("validation", y.INVALID_EVENT);
  }
  /**
   * Handle signing errors
   */
  static handleSigningError(e) {
    const t = e.message.toLowerCase();
    return t.includes("user declined") || t.includes("denied") ? f.createError("signing", "User declined to sign the event", {
      retryable: !0,
      userAction: "User declined signing",
      suggestion: "Click approve in your Nostr extension to publish the event"
    }) : t.includes("no extension") ? f.createError("signing", y.NO_EXTENSION, {
      retryable: !1,
      suggestion: k.NO_EXTENSION
    }) : f.createError("signing", y.SIGNING_FAILED, {
      retryable: !0,
      suggestion: "Check your Nostr extension and try again"
    });
  }
  /**
   * Handle relay connection errors
   */
  static handleConnectionError(e, t) {
    const s = t.message.toLowerCase();
    return s.includes("timeout") ? f.createError("network", `Connection to ${e} timed out`, {
      retryable: !0,
      suggestion: "The relay might be slow or unavailable. Try again or use different relays"
    }) : s.includes("refused") || s.includes("failed to connect") ? f.createError("network", `Failed to connect to ${e}`, {
      retryable: !0,
      suggestion: "The relay might be down. Check the relay URL or try different relays"
    }) : f.createError("network", y.CONNECTION_FAILED, {
      retryable: !0,
      suggestion: k.CONNECTION_FAILED
    });
  }
  /**
   * Analyze relay results and determine overall success/failure
   */
  static analyzeRelayResults(e) {
    const t = e.length, s = e.filter((n) => n.success), r = e.filter((n) => !n.success);
    if (t === 0)
      return {
        success: !1,
        error: f.createError("config", y.NO_RELAYS, {
          retryable: !1,
          suggestion: "Configure at least one relay URL"
        })
      };
    if (s.length === 0) {
      const n = r.every(
        (a) => {
          var c;
          return (c = a.error) == null ? void 0 : c.toLowerCase().includes("timeout");
        }
      ), o = r.every(
        (a) => {
          var c, d;
          return ((c = a.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((d = a.error) == null ? void 0 : d.toLowerCase().includes("refused"));
        }
      );
      return n ? {
        success: !1,
        error: f.createError("network", "All relays timed out", {
          retryable: !0,
          suggestion: "Check your internet connection or try again later"
        })
      } : o ? {
        success: !1,
        error: f.createError("network", "Could not connect to any relay", {
          retryable: !0,
          suggestion: "Check relay URLs and your internet connection"
        })
      } : {
        success: !1,
        error: f.createError("relay", y.PUBLISH_FAILED, {
          retryable: !0,
          suggestion: k.PUBLISH_FAILED
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
      const r = t.relayResults.filter((o) => o.success).length, n = t.relayResults.length;
      r > 0 ? s += ` (${r}/${n} relays succeeded)` : s += ` (0/${n} relays succeeded)`;
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
class pe {
  constructor(e) {
    l(this, "eventData");
    l(this, "nostrInstance");
    // NostrUnchained instance for publishing
    l(this, "signed", !1);
    l(this, "signedEvent");
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
class me {
  constructor(e) {
    l(this, "nostrInstance");
    this.nostrInstance = e;
  }
  /**
   * Create a new fluent event builder
   */
  create() {
    return new pe(this.nostrInstance);
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
class Se {
  constructor(e = {}) {
    l(this, "relayManager");
    l(this, "signingProvider");
    l(this, "signingMethod");
    l(this, "config");
    // Fluent Event Builder API
    l(this, "events");
    this.config = {
      relays: e.relays ?? ge,
      debug: e.debug ?? !1,
      retryAttempts: e.retryAttempts ?? I.RETRY_ATTEMPTS,
      retryDelay: e.retryDelay ?? I.RETRY_DELAY,
      timeout: e.timeout ?? I.PUBLISH_TIMEOUT
    }, this.relayManager = new be(this.config.relays, {
      debug: this.config.debug
    }), this.events = new me(this), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays);
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
    const { provider: e, method: t } = await we.createBestAvailable();
    this.signingProvider = e, this.signingMethod = t, this.config.debug && console.log(`Initialized signing with method: ${t}`);
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
      throw f.handleConnectionError("relays", e);
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
      const r = await this.signingProvider.getPublicKey(), n = await E.createEvent(e, r), o = E.addEventId(n), a = await this.signingProvider.signEvent(n), c = {
        ...o,
        sig: a
      };
      if (this.connectedRelays.length === 0) {
        const g = Date.now();
        await this.connect(), s.connectionAttempts = Date.now() - g;
      }
      const d = await this.relayManager.publishToAll(c);
      this.config.debug && (s.relayLatencies = {}, d.forEach((g) => {
        g.latency && (s.relayLatencies[g.relay] = g.latency);
      }));
      const h = f.analyzeRelayResults(d);
      s.totalTime = Date.now() - t;
      const u = {
        success: h.success,
        eventId: c.id,
        event: c,
        relayResults: d,
        timestamp: Date.now(),
        error: h.error,
        debug: this.config.debug ? s : void 0
      };
      return this.config.debug && console.log("Publish result:", u), u;
    } catch (r) {
      s.totalTime = Date.now() - t;
      let n;
      return r instanceof Error ? r.message.includes("Content") ? n = f.handleContentError(e) : r.message.includes("sign") || r.message.includes("extension") ? n = f.handleSigningError(r) : n = f.handleConnectionError("relay", r) : n = f.createError("network", "Unknown error occurred", {
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
    const t = await this.signingProvider.getPublicKey(), s = await E.createEvent(
      e.content,
      t,
      {
        kind: e.kind,
        tags: e.tags,
        created_at: e.created_at
      }
    ), r = E.addEventId(s), n = await this.signingProvider.signEvent(s);
    return {
      ...r,
      sig: n
    };
  }
  /**
   * Calculate event ID (utility method for testing)
   */
  calculateEventId(e) {
    return E.calculateEventId(e);
  }
  /**
   * Verify event signature (utility method)
   */
  async verifyEvent(e) {
    return E.verifyEventId(e);
  }
  /**
   * Check if browser extension is available
   */
  async hasExtension() {
    return await P.isAvailable();
  }
  /**
   * Get public key from extension
   */
  async getExtensionPubkey() {
    if (!await this.hasExtension())
      throw new Error("No browser extension available");
    return await new P().getPublicKey();
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
        const a = Date.now();
        await this.connect(), s.connectionAttempts = Date.now() - a;
      }
      const r = await this.relayManager.publishToAll(e);
      this.config.debug && (s.relayLatencies = {}, r.forEach((a) => {
        a.latency && (s.relayLatencies[a.relay] = a.latency);
      }));
      const n = f.analyzeRelayResults(r);
      s.totalTime = Date.now() - t;
      const o = {
        success: n.success,
        eventId: e.id,
        event: e,
        relayResults: r,
        timestamp: Date.now(),
        error: n.error,
        debug: this.config.debug ? s : void 0
      };
      return this.config.debug && console.log("PublishEvent result:", o), o;
    } catch (r) {
      s.totalTime = Date.now() - t;
      let n;
      return r instanceof Error ? n = f.handleConnectionError("relay", r) : n = f.createError("network", "Unknown error occurred", {
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
}
class Ie {
  constructor(e) {
    l(this, "subscriptions", /* @__PURE__ */ new Map());
    l(this, "eventCallbacks", /* @__PURE__ */ new Map());
    l(this, "debug");
    this.relayManager = e, this.debug = e.debug || !1, this.setupRelayMessageHandling();
  }
  /**
   * Create a new subscription with given filters
   * Performance requirement: <100ms subscription creation
   */
  async subscribe(e, t = {}) {
    var s, r, n, o;
    try {
      const a = this.validateFilters(e);
      if (a)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: a
        };
      const c = this.generateSubscriptionId(), d = Date.now(), h = t.relays || this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, u = {
        id: c,
        filters: e,
        relays: h,
        state: "pending",
        createdAt: d,
        eventCount: 0,
        onEvent: t.onEvent,
        onEose: t.onEose,
        onClose: t.onClose,
        relayStates: {},
        eoseRelays: /* @__PURE__ */ new Set(),
        receivedEventIds: /* @__PURE__ */ new Set()
      };
      h.forEach((A) => {
        u.relayStates[A] = "active";
      }), t.timeout && (u.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, t.timeout)), this.subscriptions.set(c, u), this.debug && console.log(`Creating subscription ${c} with ${e.length} filters`);
      const g = t.retryAttempts || 1, v = t.retryDelay || 1e3;
      let b = [], m;
      for (let A = 0; A < g; A++)
        try {
          const x = ["REQ", c, ...e];
          try {
            await ((r = (s = this.relayManager).sendToAll) == null ? void 0 : r.call(s, x)), b = h.map((T) => ({
              relay: T,
              success: !0,
              error: void 0
            }));
            break;
          } catch (T) {
            b = [];
            let K = !1;
            for (const F of h)
              try {
                await ((o = (n = this.relayManager).sendToRelays) == null ? void 0 : o.call(n, [F], x)), b.push({
                  relay: F,
                  success: !0,
                  error: void 0
                }), K = !0;
              } catch (G) {
                b.push({
                  relay: F,
                  success: !1,
                  error: G instanceof Error ? G : new Error("Unknown error")
                });
              }
            if (K)
              break;
            m = T instanceof Error ? T : new Error("All relays failed");
          }
        } catch (x) {
          m = x instanceof Error ? x : new Error("Unknown error"), b = h.map((T) => ({
            relay: T,
            success: !1,
            error: m
          })), A < g - 1 && await new Promise((T) => setTimeout(T, v));
        }
      const O = b.length > 0 && b.some((A) => A.success);
      return O || (this.subscriptions.delete(c), u.timeoutId && clearTimeout(u.timeoutId)), {
        subscription: O ? this.externalizeSubscription(u) : {},
        success: O,
        relayResults: b,
        error: O ? void 0 : {
          message: m ? m.message : b.length === 0 ? "No relays available" : "All relays failed",
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
    var s, r, n, o;
    const t = this.subscriptions.get(e);
    if (!t)
      throw new Error(`Subscription ${e} not found`);
    t.state = "active";
    try {
      const a = ["REQ", e, ...t.filters], c = this.relayManager.connectedRelays;
      t.relays.length !== c.length || !t.relays.every((h) => c.includes(h)) ? await ((r = (s = this.relayManager).sendToRelays) == null ? void 0 : r.call(s, t.relays, a)) : await ((o = (n = this.relayManager).sendToAll) == null ? void 0 : o.call(n, a));
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
    var r, n;
    const s = this.subscriptions.get(e);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const o = ["CLOSE", e];
        await ((n = (r = this.relayManager).sendToAll) == null ? void 0 : n.call(r, o));
      } catch (o) {
        this.debug && console.error(`Error sending CLOSE for ${e}:`, o);
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
    const r = [];
    for (const n of t)
      s.receivedEventIds.has(n.id) || (s.receivedEventIds.add(n.id), r.push(n));
    if (s.eventCount += r.length, s.lastEventAt = Date.now(), s.onEvent && r.length > 0)
      for (const n of r)
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
    const [s, r, ...n] = t;
    switch (s) {
      case "EVENT":
        const o = n[0];
        await this.handleRelayEvent(e, r, o);
        break;
      case "EOSE":
        await this.markEose(r, e);
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
    const s = [], r = ["REQ", e.id, ...e.filters];
    if (this.relayManager.sendToRelays)
      for (const n of e.relays)
        try {
          await this.relayManager.sendToRelays([n], r), s.push({
            relay: n,
            success: !0,
            subscriptionId: e.id
          });
        } catch (o) {
          s.push({
            relay: n,
            success: !1,
            error: o instanceof Error ? o.message : "Unknown error",
            subscriptionId: e.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(r), e.relays.forEach((n) => {
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
        e.relays.forEach((o) => {
          s.push({
            relay: o,
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
      set(t, s, r) {
        return s === "eventCount" || s === "lastEventAt" || s === "state" ? (t[s] = r, !0) : !1;
      }
    });
  }
  setupRelayMessageHandling() {
  }
}
class H {
  constructor(e = {}, t) {
    l(this, "state");
    l(this, "subscriptionManager");
    this.state = { ...e }, this.subscriptionManager = t;
  }
  // Immutable helper to create new instance
  clone(e = {}) {
    return new H(
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
    const s = { ...this.state.tags }, r = e;
    return s[r] ? s[r] = Array.from(/* @__PURE__ */ new Set([...s[r], ...t])) : s[r] = Array.from(new Set(t)), this.clone({ tags: s });
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
    const t = e, s = { ...this.state }, r = t.state;
    if (r.kinds && (s.kinds ? s.kinds = Array.from(/* @__PURE__ */ new Set([...s.kinds, ...r.kinds])) : s.kinds = [...r.kinds]), r.authors && (s.authors ? s.authors = Array.from(/* @__PURE__ */ new Set([...s.authors, ...r.authors])) : s.authors = [...r.authors]), r.tags) {
      const n = { ...s.tags };
      for (const [o, a] of Object.entries(r.tags))
        n[o] ? n[o] = Array.from(/* @__PURE__ */ new Set([...n[o], ...a])) : n[o] = [...a];
      s.tags = n;
    }
    return r.since !== void 0 && (s.since = Math.max(s.since || 0, r.since)), r.until !== void 0 && (s.until !== void 0 ? s.until = Math.min(s.until, r.until) : s.until = r.until), r.limit !== void 0 && (s.limit !== void 0 ? s.limit = Math.min(s.limit, r.limit) : s.limit = r.limit), this.clone(s);
  }
  // Compilation
  toFilter() {
    const e = [];
    if (this.state.unionWith && this.state.unionWith.length > 0) {
      const t = this.compileStateToFilter(this.state);
      Object.keys(t).length > 0 && e.push(t);
      for (const s of this.state.unionWith) {
        const r = s.toFilter();
        e.push(...r);
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
      for (const [s, r] of Object.entries(e.tags))
        t[`#${s}`] = r;
    return e.search && (t.search = e.search), t;
  }
  // Execution
  async execute(e = {}) {
    var d;
    if (!this.subscriptionManager)
      throw new Error("SubscriptionManager is required for query execution");
    const t = this.toFilter(), s = [];
    let r = !1;
    const n = {
      ...e,
      onEvent: (h) => {
        s.push(h), e.onEvent && e.onEvent(h);
      },
      onEose: (h) => {
        r = !0, e.onEose && e.onEose(h);
      },
      autoClose: !0
      // Auto-close for execute
    }, o = await this.subscriptionManager.subscribe(t, n);
    if (!o.success)
      throw new Error(((d = o.error) == null ? void 0 : d.message) || "Query execution failed");
    const a = e.timeout || 1e4, c = Date.now();
    for (; !r && Date.now() - c < a; )
      await new Promise((h) => setTimeout(h, 100));
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
function ve(i) {
  return new H({}, i);
}
function Ae(i) {
  return ve(i);
}
function R(i) {
  const e = /* @__PURE__ */ new Set();
  let t = i;
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
function p(i, e) {
  const t = Array.isArray(i) ? i : [i], s = /* @__PURE__ */ new Set();
  let r, n = !1;
  const o = [], a = () => {
    if (t.length === 1) {
      const c = t[0].subscribe((d) => {
        const h = e(d);
        (!n || h !== r) && (r = h, n && s.forEach((u) => u(r)));
      });
      o.length === 0 && o.push(c);
    }
  };
  return {
    subscribe(c) {
      return n || (a(), n = !0), r !== void 0 && c(r), s.add(c), () => {
        s.delete(c), s.size === 0 && (o.forEach((d) => d()), o.length = 0, n = !1);
      };
    }
  };
}
function j(i) {
  return {
    subscribe: i.subscribe.bind(i),
    derive: (e) => p(i, e)
  };
}
class C {
  constructor(e, t, s) {
    l(this, "_events");
    l(this, "_readIds", /* @__PURE__ */ new Set());
    l(this, "parent");
    this.parent = e, this._events = p(e.events, (r) => {
      let n = r;
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
    return p(this._events, (e) => e.length);
  }
  get latest() {
    return p(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return this.parent.hasMore;
  }
  get isEmpty() {
    return p(this._events, (e) => e.length === 0);
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
    return j(p(this._events, e));
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
    return new C(this, e);
  }
  sortBy(e) {
    return new C(this, void 0, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((o) => {
      e = o;
    })();
    const s = e.filter((o) => this._readIds.has(o.id)).length, r = e.length, n = r - s;
    return { read: s, unread: n, total: r };
  }
}
class W {
  constructor(e, t, s = {}, r = {}) {
    l(this, "_events", R([]));
    l(this, "_status", R("connecting"));
    l(this, "_error", R(null));
    l(this, "_loading", R(!1));
    l(this, "_count", R(0));
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
    return p(this._events, (e) => e[0] || null);
  }
  get hasMore() {
    return p(this._events, () => !0);
  }
  get isEmpty() {
    return p(this._events, (e) => e.length === 0);
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
    return j(p(this._events, e));
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
    return new C(this, e, this.eventComparator);
  }
  sortBy(e) {
    return new C(this, this.eventPredicate, e);
  }
  getReadStatus() {
    let e = [];
    this._events.subscribe((o) => {
      e = o;
    })();
    const s = e.filter((o) => this._readIds.has(o.id)).length, r = e.length, n = r - s;
    return { read: s, unread: n, total: r };
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
      if (t.some((r) => r.id === e.id))
        return t;
      const s = [...t, e];
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((r, n) => n.created_at - r.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
    }), this._count.update((t) => t + 1));
  }
}
class Te {
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
    return new W(
      this.subscriptionManager,
      e,
      this.options,
      this.config
    );
  }
}
let N;
function Ne(i) {
  N = i;
}
function Me() {
  if (!N)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new Te(N);
}
function xe(i) {
  if (!N)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const e = i.toFilter();
  return new W(N, e);
}
function ke(i) {
  if (!N)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new W(N, [i]);
}
const Re = "0.1.0";
export {
  ge as DEFAULT_RELAYS,
  X as EVENT_KINDS,
  f as ErrorHandler,
  E as EventBuilder,
  me as EventsModule,
  P as ExtensionSigner,
  W as FeedStoreImpl,
  pe as FluentEventBuilder,
  Se as NostrUnchained,
  H as QueryBuilder,
  be as RelayManager,
  we as SigningProviderFactory,
  Ie as SubscriptionManager,
  Ee as TemporarySigner,
  Re as VERSION,
  Me as createFeed,
  ke as createFeedFromFilter,
  xe as createFeedFromQuery,
  ve as createQueryBuilder,
  p as derived,
  Ae as query,
  Ne as setDefaultSubscriptionManager,
  R as writable
};
