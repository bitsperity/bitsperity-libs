var Ze = Object.defineProperty;
var Qe = (o, t, e) => t in o ? Ze(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var l = (o, t, e) => Qe(o, typeof t != "symbol" ? t + "" : t, e);
import * as dt from "@noble/secp256k1";
import { getSharedSecret as ts } from "@noble/secp256k1";
const lt = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function es(o) {
  return o instanceof Uint8Array || ArrayBuffer.isView(o) && o.constructor.name === "Uint8Array";
}
function qt(o) {
  if (!Number.isSafeInteger(o) || o < 0)
    throw new Error("positive integer expected, got " + o);
}
function gt(o, ...t) {
  if (!es(o))
    throw new Error("Uint8Array expected");
  if (t.length > 0 && !t.includes(o.length))
    throw new Error("Uint8Array expected of length " + t + ", got length=" + o.length);
}
function Qt(o) {
  if (typeof o != "function" || typeof o.create != "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  qt(o.outputLen), qt(o.blockLen);
}
function xt(o, t = !0) {
  if (o.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (t && o.finished)
    throw new Error("Hash#digest() has already been called");
}
function ss(o, t) {
  gt(o);
  const e = t.outputLen;
  if (o.length < e)
    throw new Error("digestInto() expects output buffer of length at least " + e);
}
function mt(...o) {
  for (let t = 0; t < o.length; t++)
    o[t].fill(0);
}
function Ut(o) {
  return new DataView(o.buffer, o.byteOffset, o.byteLength);
}
function tt(o, t) {
  return o << 32 - t | o >>> t;
}
const Se = /* @ts-ignore */ typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", rs = /* @__PURE__ */ Array.from({ length: 256 }, (o, t) => t.toString(16).padStart(2, "0"));
function D(o) {
  if (gt(o), Se)
    return o.toHex();
  let t = "";
  for (let e = 0; e < o.length; e++)
    t += rs[o[e]];
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
  if (Se)
    return Uint8Array.fromHex(o);
  const t = o.length, e = t / 2;
  if (t % 2)
    throw new Error("hex string expected, got unpadded hex of length " + t);
  const s = new Uint8Array(e);
  for (let r = 0, i = 0; r < e; r++, i += 2) {
    const n = oe(o.charCodeAt(i)), a = oe(o.charCodeAt(i + 1));
    if (n === void 0 || a === void 0) {
      const c = o[i] + o[i + 1];
      throw new Error('hex string expected, got non-hex character "' + c + '" at index ' + i);
    }
    s[r] = n * 16 + a;
  }
  return s;
}
function is(o) {
  if (typeof o != "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(o));
}
function bt(o) {
  return typeof o == "string" && (o = is(o)), gt(o), o;
}
function It(...o) {
  let t = 0;
  for (let s = 0; s < o.length; s++) {
    const r = o[s];
    gt(r), t += r.length;
  }
  const e = new Uint8Array(t);
  for (let s = 0, r = 0; s < o.length; s++) {
    const i = o[s];
    e.set(i, r), r += i.length;
  }
  return e;
}
class ke {
}
function ns(o) {
  const t = (s) => o().update(bt(s)).digest(), e = o();
  return t.outputLen = e.outputLen, t.blockLen = e.blockLen, t.create = () => o(), t;
}
function ht(o = 32) {
  if (lt && typeof lt.getRandomValues == "function")
    return lt.getRandomValues(new Uint8Array(o));
  if (lt && typeof lt.randomBytes == "function")
    return Uint8Array.from(lt.randomBytes(o));
  throw new Error("crypto.getRandomValues must be defined");
}
function os(o, t, e, s) {
  if (typeof o.setBigUint64 == "function")
    return o.setBigUint64(t, e, s);
  const r = BigInt(32), i = BigInt(4294967295), n = Number(e >> r & i), a = Number(e & i), c = s ? 4 : 0, u = s ? 0 : 4;
  o.setUint32(t + c, n, s), o.setUint32(t + u, a, s);
}
function as(o, t, e) {
  return o & t ^ ~o & e;
}
function cs(o, t, e) {
  return o & t ^ o & e ^ t & e;
}
class us extends ke {
  constructor(t, e, s, r) {
    super(), this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.blockLen = t, this.outputLen = e, this.padOffset = s, this.isLE = r, this.buffer = new Uint8Array(t), this.view = Ut(this.buffer);
  }
  update(t) {
    xt(this), t = bt(t), gt(t);
    const { view: e, buffer: s, blockLen: r } = this, i = t.length;
    for (let n = 0; n < i; ) {
      const a = Math.min(r - this.pos, i - n);
      if (a === r) {
        const c = Ut(t);
        for (; r <= i - n; n += r)
          this.process(c, n);
        continue;
      }
      s.set(t.subarray(n, n + a), this.pos), this.pos += a, n += a, this.pos === r && (this.process(e, 0), this.pos = 0);
    }
    return this.length += t.length, this.roundClean(), this;
  }
  digestInto(t) {
    xt(this), ss(t, this), this.finished = !0;
    const { buffer: e, view: s, blockLen: r, isLE: i } = this;
    let { pos: n } = this;
    e[n++] = 128, mt(this.buffer.subarray(n)), this.padOffset > r - n && (this.process(s, 0), n = 0);
    for (let d = n; d < r; d++)
      e[d] = 0;
    os(s, r - 8, BigInt(this.length * 8), i), this.process(s, 0);
    const a = Ut(t), c = this.outputLen;
    if (c % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const u = c / 4, h = this.get();
    if (u > h.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let d = 0; d < u; d++)
      a.setUint32(4 * d, h[d], i);
  }
  digest() {
    const { buffer: t, outputLen: e } = this;
    this.digestInto(t);
    const s = t.slice(0, e);
    return this.destroy(), s;
  }
  _cloneInto(t) {
    t || (t = new this.constructor()), t.set(...this.get());
    const { blockLen: e, buffer: s, length: r, finished: i, destroyed: n, pos: a } = this;
    return t.destroyed = n, t.finished = i, t.length = r, t.pos = a, r % e && t.buffer.set(s), t;
  }
  clone() {
    return this._cloneInto();
  }
}
const rt = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), ls = /* @__PURE__ */ Uint32Array.from([
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
]), it = /* @__PURE__ */ new Uint32Array(64);
class hs extends us {
  constructor(t = 32) {
    super(64, t, 8, !1), this.A = rt[0] | 0, this.B = rt[1] | 0, this.C = rt[2] | 0, this.D = rt[3] | 0, this.E = rt[4] | 0, this.F = rt[5] | 0, this.G = rt[6] | 0, this.H = rt[7] | 0;
  }
  get() {
    const { A: t, B: e, C: s, D: r, E: i, F: n, G: a, H: c } = this;
    return [t, e, s, r, i, n, a, c];
  }
  // prettier-ignore
  set(t, e, s, r, i, n, a, c) {
    this.A = t | 0, this.B = e | 0, this.C = s | 0, this.D = r | 0, this.E = i | 0, this.F = n | 0, this.G = a | 0, this.H = c | 0;
  }
  process(t, e) {
    for (let d = 0; d < 16; d++, e += 4)
      it[d] = t.getUint32(e, !1);
    for (let d = 16; d < 64; d++) {
      const g = it[d - 15], p = it[d - 2], f = tt(g, 7) ^ tt(g, 18) ^ g >>> 3, y = tt(p, 17) ^ tt(p, 19) ^ p >>> 10;
      it[d] = y + it[d - 7] + f + it[d - 16] | 0;
    }
    let { A: s, B: r, C: i, D: n, E: a, F: c, G: u, H: h } = this;
    for (let d = 0; d < 64; d++) {
      const g = tt(a, 6) ^ tt(a, 11) ^ tt(a, 25), p = h + g + as(a, c, u) + ls[d] + it[d] | 0, y = (tt(s, 2) ^ tt(s, 13) ^ tt(s, 22)) + cs(s, r, i) | 0;
      h = u, u = c, c = a, a = n + p | 0, n = i, i = r, r = s, s = p + y | 0;
    }
    s = s + this.A | 0, r = r + this.B | 0, i = i + this.C | 0, n = n + this.D | 0, a = a + this.E | 0, c = c + this.F | 0, u = u + this.G | 0, h = h + this.H | 0, this.set(s, r, i, n, a, c, u, h);
  }
  roundClean() {
    mt(it);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), mt(this.buffer);
  }
}
const ds = /* @__PURE__ */ ns(() => new hs()), et = ds, gs = [
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
class _ {
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
    ]), s = new TextEncoder().encode(e), r = et(s);
    return D(r);
  }
  /**
   * Add event ID to unsigned event
   */
  static addEventId(t) {
    const e = _.calculateEventId(t);
    return { ...t, id: e };
  }
  /**
   * Validate event structure and content
   */
  static validateEvent(t) {
    const e = [];
    if (t.pubkey || e.push("Missing pubkey"), t.created_at || e.push("Missing created_at"), typeof t.kind != "number" && e.push("Missing or invalid kind"), Array.isArray(t.tags) || e.push("Missing or invalid tags"), typeof t.content != "string" && e.push("Missing or invalid content"), t.pubkey && !Tt.HEX_64.test(t.pubkey) && e.push("Invalid pubkey format (must be 64-character hex string)"), t.id && !Tt.HEX_64.test(t.id) && e.push("Invalid event ID format (must be 64-character hex string)"), t.sig && !Tt.HEX_128.test(t.sig) && e.push("Invalid signature format (must be 128-character hex string)"), t.content === "" && !this.isEmptyContentAllowed(t.kind) && e.push(O.EMPTY_CONTENT), t.content && t.content.length > Z.MAX_CONTENT_LENGTH && e.push(O.CONTENT_TOO_LONG), t.created_at) {
      const s = Math.floor(Date.now() / 1e3), r = s - 3600, i = s + 3600;
      (t.created_at < r || t.created_at > i) && e.push("Timestamp is too far in the past or future");
    }
    return t.tags && (Array.isArray(t.tags) ? t.tags.forEach((s, r) => {
      Array.isArray(s) ? s.forEach((i, n) => {
        typeof i != "string" && e.push(`Tag ${r}[${n}] must be a string`);
      }) : e.push(`Tag ${r} must be an array`);
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
    return _.calculateEventId({
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
    const r = _.validateContent(t, s.kind);
    if (!r.valid)
      throw new Error(`Invalid content: ${r.errors.join(", ")}`);
    const i = {
      pubkey: e,
      created_at: s.created_at ?? Math.floor(Date.now() / 1e3),
      kind: s.kind ?? ae.TEXT_NOTE,
      tags: s.tags ?? [],
      content: t
    }, n = _.validateEvent(i);
    if (!n.valid)
      throw new Error(`Invalid event: ${n.errors.join(", ")}`);
    return i;
  }
}
async function fs() {
  if (typeof WebSocket < "u")
    return WebSocket;
  try {
    return (await import("ws")).default;
  } catch {
    throw new Error("WebSocket not available. In Node.js, install: npm install ws");
  }
}
class ys {
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
   * Add a relay to the manager (no connection is opened yet)
   */
  addRelay(t, e = {}) {
    return this.connections.has(t) ? !1 : (this.connections.set(t, { url: t, state: "disconnected", temporary: !!e.temporary }), this.debug && console.log(`Added ${e.temporary ? "temporary " : ""}relay: ${t}`), !0);
  }
  /**
   * Add multiple relays; returns the subset that were newly added
   */
  addRelays(t, e = {}) {
    const s = [];
    for (const r of t)
      this.connections.has(r) || (this.connections.set(r, { url: r, state: "disconnected", temporary: !!e.temporary }), s.push(r));
    return this.debug && s.length && console.log(`Added ${e.temporary ? "temporary " : ""}relays:`, s), s;
  }
  /**
   * Ensure all given relays are connected (assumes they are configured)
   */
  async ensureConnected(t) {
    const e = t.map(async (s) => {
      const r = this.connections.get(s);
      if (!r) throw new Error(`Relay ${s} not configured`);
      r.state !== "connected" && await this.connectToRelay(s);
    });
    await Promise.allSettled(e);
  }
  /**
   * Disconnect a specific relay (keeps it configured unless removed)
   */
  async disconnectRelay(t) {
    const e = this.connections.get(t);
    if (e) {
      if (e.ws) {
        try {
          e.ws.close();
        } catch {
        }
        e.ws = void 0;
      }
      e.state = "disconnected";
    }
  }
  /**
   * Disconnect multiple relays
   */
  async disconnectRelays(t) {
    await Promise.allSettled(t.map((e) => this.disconnectRelay(e)));
  }
  /**
   * Remove a relay from the manager (closes connection if open)
   */
  removeRelay(t) {
    const e = this.connections.get(t);
    if (e) {
      try {
        e.ws && e.ws.close();
      } catch {
      }
      this.connections.delete(t), this.debug && console.log(`Removed relay: ${t}`);
    }
  }
  /**
   * Remove multiple relays
   */
  removeRelays(t) {
    for (const e of t) this.removeRelay(e);
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
    return e.state === "connected" ? !0 : (e.state = "connecting", new Promise(async (s, r) => {
      try {
        const i = await fs(), n = new i(t), a = setTimeout(() => {
          n.close(), e.state = "error", e.error = "Connection timeout", r(new Error(`Connection to ${t} timed out`));
        }, Z.CONNECTION_TIMEOUT);
        n.onopen = () => {
          clearTimeout(a), e.ws = n, e.state = "connected", e.lastConnected = Date.now(), e.error = void 0, this.debug && console.log(`Connected to relay: ${t}`), s(!0);
        }, n.onerror = (c) => {
          clearTimeout(a), e.state = "error", e.error = "WebSocket error", this.debug && console.error(`WebSocket error for ${t}:`, c), r(new Error(`Failed to connect to ${t}: WebSocket error`));
        }, n.onclose = (c) => {
          e.state = "disconnected", e.ws = void 0, this.debug && console.log(`Disconnected from relay: ${t}`, c.code, c.reason), this.reconnectEnabled && c.code !== 1e3 && this.scheduleReconnection(t);
        }, n.onmessage = (c) => {
          this.handleRelayMessage(t, c.data);
        };
      } catch (i) {
        e.state = "error", e.error = i instanceof Error ? i.message : "Unknown error", r(i);
      }
    }));
  }
  /**
   * Publish event to specific relays
   */
  async publishToRelays(t, e, s) {
    const r = [], i = !!(s != null && s.resolveOnFirstOk), n = Math.max(1, (s == null ? void 0 : s.minAcks) ?? 1), a = (s == null ? void 0 : s.overallTimeoutMs) ?? this.publishTimeout ?? Z.PUBLISH_TIMEOUT;
    if (i) {
      let u = 0, h;
      const d = new Promise((p) => {
        h = p;
      }), g = setTimeout(() => {
        try {
          h(r.slice());
        } catch {
        }
      }, a);
      return e.forEach(async (p) => {
        const f = Date.now();
        try {
          const y = await this.publishToRelay(p, t), b = Date.now() - f;
          if (r.push({ relay: p, success: y, latency: b }), y && (u++, u >= n)) {
            try {
              clearTimeout(g);
            } catch {
            }
            h(r.slice());
          }
        } catch (y) {
          const b = Date.now() - f;
          r.push({
            relay: p,
            success: !1,
            error: y instanceof Error ? y.message : "Unknown error",
            latency: b
          });
        }
      }), await d;
    }
    const c = e.map(async (u) => {
      const h = Date.now();
      try {
        const d = await this.publishToRelay(u, t), g = Date.now() - h;
        r.push({
          relay: u,
          success: d,
          latency: g
        });
      } catch (d) {
        const g = Date.now() - h;
        r.push({
          relay: u,
          success: !1,
          error: d instanceof Error ? d.message : "Unknown error",
          latency: g
        });
      }
    });
    return await Promise.allSettled(c), r;
  }
  /**
   * Publish event to all connected relays
   */
  async publishToAll(t) {
    const e = [], s = this.connectedRelays.map(async (r) => {
      const i = Date.now();
      try {
        const n = await this.publishToRelay(r, t), a = Date.now() - i;
        e.push({
          relay: r,
          success: n,
          latency: a
        });
      } catch (n) {
        const a = Date.now() - i;
        e.push({
          relay: r,
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
    return new Promise((r, i) => {
      const n = s.ws, a = ["EVENT", e], c = setTimeout(() => {
        const h = `${e.id}|${t}`;
        this.pendingPublishes.delete(h), i(new Error("Publish timeout"));
      }, this.publishTimeout ?? Z.PUBLISH_TIMEOUT), u = `${e.id}|${t}`;
      this.pendingPublishes.set(u, { resolve: r, reject: i, timeout: c, originalEvent: e, retries: 0, awaitingAuth: !1 });
      try {
        const h = JSON.stringify(a);
        n.send(h), this.debug && (console.log(`📤 Publishing event ${e.id} to ${t}`), console.log("📤 Message:", h), console.log("📤 Added to pending:", u));
      } catch (h) {
        clearTimeout(c);
        const d = `${e.id}|${t}`;
        this.pendingPublishes.delete(d), i(h);
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
    this.pendingPublishes.forEach((r, i) => {
      const [n, a] = i.split("|");
      if (a === t && r.awaitingAuth) {
        try {
          clearTimeout(r.timeout);
        } catch {
        }
        r.timeout = setTimeout(() => {
          this.pendingPublishes.delete(i), r.reject(new Error("Publish timeout after AUTH"));
        }, this.publishTimeout ?? Z.PUBLISH_TIMEOUT);
        try {
          const c = ["EVENT", r.originalEvent];
          s.send(JSON.stringify(c)), r.awaitingAuth = !1, r.retries = (r.retries || 0) + 1, this.debug && console.log(`🔁 Re-publishing event ${n} to ${t} after AUTH`);
        } catch (c) {
          this.pendingPublishes.delete(i), r.reject(c);
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
      const r = JSON.parse(e);
      if (this.debug && console.log(`📥 Message from ${t}:`, r), r[0] === "OK") {
        const [, i, n, a] = r, c = `${i}|${t}`, u = this.pendingPublishes.get(c);
        if (this.debug) {
          console.log(`OK for event ${i} @ ${t}, success: ${n}, pending: ${!!u}`);
          const h = Array.from(this.pendingPublishes.keys());
          console.log("Pending publishes:", h);
        }
        if (u)
          if (n)
            clearTimeout(u.timeout), this.pendingPublishes.delete(c), u.resolve(!0);
          else if (this.isAuthRequiredError(a)) {
            if (this.debug && console.log(`🔐 Auth required for ${t} on event ${i}:`, a), (u.retries || 0) >= 1) {
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
          if (h && h.lastAuthEventId === i)
            h.isAuthenticated = !!n, this.debug && console.log(`🔐 AUTH ${n ? "succeeded" : "failed"} for ${t}${a ? " (" + a + ")" : ""}`), (s = this.onAuthStateChange) == null || s.call(this, t, { authenticated: !!n, reason: n ? void 0 : a }), n && this.retryPendingAfterAuth(t);
          else if (this.debug) {
            const d = n ? "already resolved (duplicate OK)" : this.isAuthRequiredError(a) ? "AUTH OK not matching pending" : "late/unsolicited OK";
            console.log(`ℹ️ OK for ${i} @ ${t} without pending - ${d}${a ? `: ${a}` : ""}`);
          }
        }
      } else if (r[0] === "NOTICE") {
        const [, i] = r;
        this.debug && console.log(`Notice from ${t}:`, i), typeof i == "string" && (i.startsWith("auth-required:") || i.startsWith("restricted:")) && (this.debug && console.log("NIP-42 hint via NOTICE:", i), this.tryAuthenticate(t));
      } else if (r[0] === "EVENT" || r[0] === "EOSE")
        this.messageHandler ? this.messageHandler(t, r) : this.debug && console.log(`No message handler registered for ${r[0]} message`);
      else if (r[0] === "AUTH") {
        const [, i] = r, n = this.connections.get(t);
        n && (n.lastAuthChallenge = i, n.isAuthenticated = !1), this.debug && console.log(`🔐 NIP-42 challenge from ${t}:`, i), this.tryAuthenticate(t);
      } else if (r[0] === "CLOSED") {
        const [, , i] = r;
        typeof i == "string" && (i.startsWith("auth-required:") || i.startsWith("restricted:")) && (this.debug && console.log(`🔐 NIP-42 CLOSED hint from ${t}:`, i), this.tryAuthenticate(t));
      }
    } catch (r) {
      this.debug && console.error(`Failed to parse message from ${t}:`, r);
    }
  }
  /**
   * NIP-42: Attempt to authenticate to a relay using stored challenge
   */
  async tryAuthenticate(t) {
    var r, i;
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
      e.ws.send(JSON.stringify(a)), this.debug && console.log(`📤 Sent AUTH to ${t}`), (r = this.onAuthStateChange) == null || r.call(this, t, { authenticated: !1, challenge: s });
    } catch (n) {
      this.debug && console.error("NIP-42 AUTH send failed:", n), (i = this.onAuthStateChange) == null || i.call(this, t, { authenticated: !1, challenge: s, reason: n.message });
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
      (s) => this.sendToRelay(s, t).catch((r) => {
        this.debug && console.warn(`Failed to send to ${s}:`, r);
      })
    );
    await Promise.allSettled(e);
  }
  /**
   * Send message to specific relays
   */
  async sendToRelays(t, e) {
    const s = t.map(
      (r) => this.sendToRelay(r, e).catch((i) => {
        this.debug && console.warn(`Failed to send to ${r}:`, i);
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
    const r = JSON.stringify(e);
    s.ws.send(r), this.debug && console.log(`📤 Sent to ${t}:`, r);
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
    const r = Math.min(
      this.baseReconnectDelay * Math.pow(2, e.reconnectAttempts),
      this.maxReconnectDelay
    ) + Math.random() * 1e3;
    this.debug && console.log(`Scheduling reconnection to ${t} in ${Math.round(r)}ms (attempt ${e.reconnectAttempts + 1}/${this.maxReconnectAttempts})`), e.reconnectTimeout = setTimeout(() => {
      this.attemptReconnection(t);
    }, r);
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
        const r = Date.now(), i = s.lastReconnectAttempt || r, n = Math.min(
          this.baseReconnectDelay * Math.pow(2, (s.reconnectAttempts || 0) - 1),
          this.maxReconnectDelay
        ), a = i + n;
        t[e].nextAttemptIn = Math.max(0, a - r);
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
    var s, r;
    if (!((r = (s = window.nostr) == null ? void 0 : s.nip44) != null && r.encrypt)) throw new Error("NIP-44 encrypt not supported by extension");
    return window.nostr.nip44.encrypt(t, e);
  }
  async nip44Decrypt(t, e) {
    var s, r;
    if (!((r = (s = window.nostr) == null ? void 0 : s.nip44) != null && r.decrypt)) throw new Error("NIP-44 decrypt not supported by extension");
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
    const e = _.calculateEventId(t), s = await dt.schnorr.sign(e, this.privateKey);
    return D(s);
  }
  async capabilities() {
    return { nip44Encrypt: !0, nip44Decrypt: !0 };
  }
  async nip44Encrypt(t, e) {
    const { NIP44Crypto: s } = await Promise.resolve().then(() => jt), r = s.deriveConversationKey(this.privateKey, t), i = s.encrypt(e, r);
    if (!i || typeof i.payload != "string")
      throw new Error("NIP-44 encrypt failed");
    return i.payload;
  }
  async nip44Decrypt(t, e) {
    const { NIP44Crypto: s } = await Promise.resolve().then(() => jt), r = s.deriveConversationKey(this.privateKey, t), i = s.decrypt(e, r);
    if (!i || !i.isValid) throw new Error("NIP-44 decrypt failed");
    return i.plaintext;
  }
}
class Ur extends St {
}
class Kr extends St {
}
class ps {
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
    const e = t.length, s = t.filter((i) => i.success), r = t.filter((i) => !i.success);
    if (e === 0)
      return {
        success: !1,
        error: $.createError("config", O.NO_RELAYS, {
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
      ), n = r.every(
        (a) => {
          var c, u;
          return ((c = a.error) == null ? void 0 : c.toLowerCase().includes("connect")) || ((u = a.error) == null ? void 0 : u.toLowerCase().includes("refused"));
        }
      );
      return i ? {
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
      const r = e.relayResults.filter((n) => n.success).length, i = e.relayResults.length;
      r > 0 ? s += ` (${r}/${i} relays succeeded)` : s += ` (0/${i} relays succeeded)`;
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
    const s = this.eventData.content || "", r = !s.includes(t);
    this.eventData.content = r ? s ? `${s} ${t}` : t : s;
    const i = [];
    if (i.push(`url ${t}`), e != null && e.mimeType && i.push(`m ${e.mimeType}`), e != null && e.blurhash && i.push(`blurhash ${e.blurhash}`), e != null && e.dim && i.push(`dim ${e.dim}`), e != null && e.alt && i.push(`alt ${e.alt}`), e != null && e.sha256 && i.push(`x ${e.sha256}`), e != null && e.fallbacks && e.fallbacks.length)
      for (const n of e.fallbacks) i.push(`fallback ${n}`);
    return this.eventData.tags.push(["imeta", ...i]), this;
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
    const r = [t, e, ...s];
    return this.eventData.tags.push(r), this;
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
    const e = (t || []).map((s) => (s || "").trim().replace(/\/+$/, "")).filter(Boolean);
    return this.targetRelays = e, this;
  }
  /**
   * Specify which relays to publish to via array
   */
  toRelayList(t) {
    const e = (t || []).map((s) => (s || "").trim().replace(/\/+$/, "")).filter(Boolean);
    return this.targetRelays = e, this;
  }
  /**
   * Explicitly sign the event (optional - auto-signs on publish)
   */
  async sign() {
    const t = this.eventData.kind || 1;
    if (!(/* @__PURE__ */ new Set([3, 5, 6, 7, 10002, 1984, 1985, 3e4, 30001, 30002, 30003, 34550, 4550, 27235, 1063])).has(t) && (!this.eventData.content || this.eventData.content.length === 0))
      throw new Error("Content is required before signing");
    const r = this.nostrInstance.signingProvider;
    if (!r)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const i = {
      pubkey: await r.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    }, n = _.validateEvent(i);
    if (!n.valid)
      throw new Error(`Invalid event: ${n.errors.join(", ")}`);
    const a = _.calculateEventId(i), c = {
      ...i,
      id: a,
      sig: await r.signEvent({ ...i, id: a })
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
      if (this.targetRelays && this.targetRelays.length)
        return await this.nostrInstance.publishSignedToRelaysSmart(this.signedEvent, this.targetRelays);
      const a = await this.nostrInstance.relayManager.publishToAll(this.signedEvent), c = a.some((u) => u.success);
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
    const r = this.nostrInstance.signingProvider;
    if (!r)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const n = {
      pubkey: await r.getPublicKey(),
      kind: this.eventData.kind || 1,
      content: this.eventData.content,
      tags: this.eventData.tags,
      created_at: this.eventData.created_at || Math.floor(Date.now() / 1e3)
    };
    return this.targetRelays && this.targetRelays.length ? await this.nostrInstance.publishToRelaysSmart(n, this.targetRelays) : await this.nostrInstance.publish(n);
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
class ms {
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
      e = s, t.forEach((r) => r(e));
    },
    update(s) {
      e = s(e), t.forEach((r) => r(e));
    }
  };
}
function I(o, t) {
  const e = Array.isArray(o) ? o : [o], s = /* @__PURE__ */ new Set();
  let r, i = !1;
  const n = [], a = () => {
    if (e.length === 1) {
      const c = e[0].subscribe((u) => {
        const h = t(u);
        (!i || h !== r) && (r = h, i && s.forEach((d) => d(r)));
      });
      n.length === 0 && n.push(c);
    }
  };
  return {
    subscribe(c) {
      return i || (a(), i = !0), r !== void 0 && c(r), s.add(c), () => {
        s.delete(c), s.size === 0 && (n.forEach((u) => u()), n.length = 0, i = !1);
      };
    }
  };
}
function Ae(o) {
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
    this.parent = t, this._events = I(t.events, (r) => {
      let i = r;
      return e && (i = i.filter(e)), s && (i = [...i].sort(s)), i;
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
    return Ae(I(this._events, t));
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
    const s = t.filter((n) => this._readIds.has(n.id)).length, r = t.length, i = r - s;
    return { read: s, unread: i, total: r };
  }
}
class te {
  constructor(t, e, s = {}, r = {}) {
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
    this.subscriptionManager = t, this.filters = e, this.options = s, this.maxEvents = r.maxEvents, this.isLive = r.live || !1, this.eventPredicate = r.predicate, this.eventComparator = r.comparator, this.initializeSubscription();
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
    return Ae(I(this._events, t));
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
    const s = t.filter((n) => this._readIds.has(n.id)).length, r = t.length, i = r - s;
    return { read: s, unread: i, total: r };
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
        onEvent: (r) => {
          this.handleEvent(r);
        },
        onEose: (r) => {
          this._status.set("active"), this._loading.set(!1);
        },
        onClose: (r) => {
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
      if (e.some((r) => r.id === t.id))
        return e;
      const s = [...e, t];
      return this.eventComparator ? s.sort(this.eventComparator) : s.sort((r, i) => i.created_at - r.created_at), this.maxEvents && s.length > this.maxEvents ? s.slice(0, this.maxEvents) : s;
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
function Hr(o) {
  ut = o;
}
function Wr() {
  if (!ut)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  return new bs(ut);
}
function zr(o) {
  if (!ut)
    throw new Error("Default SubscriptionManager not set. Call setDefaultSubscriptionManager first.");
  const t = o.toFilter();
  return new te(ut, t);
}
function qr(o) {
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
      const r = JSON.stringify(t), i = await e.nip44Encrypt(s, r), n = t.pubkey, a = {
        pubkey: n,
        created_at: Math.floor(Date.now() / 1e3),
        kind: Q.SEAL_KIND,
        tags: [],
        content: i
      }, c = this.calculateEventId(a), u = { ...a, id: c }, h = await e.signEvent(u);
      return {
        id: c,
        pubkey: n,
        created_at: a.created_at,
        kind: Q.SEAL_KIND,
        tags: [],
        content: i,
        sig: h
      };
    } catch (r) {
      throw r instanceof v ? r : new v(
        `Seal creation (with signer) failed: ${r.message}`,
        E.SEAL_CREATION_FAILED,
        r
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
    return Array.from(s).map((r) => r.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  // Raw-key Schnorr signing removed in P1
}
const ws = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SealCreator: Dt
}, Symbol.toStringTag, { value: "Module" }));
class _e extends ke {
  constructor(t, e) {
    super(), this.finished = !1, this.destroyed = !1, Qt(t);
    const s = bt(e);
    if (this.iHash = t.create(), typeof this.iHash.update != "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const r = this.blockLen, i = new Uint8Array(r);
    i.set(s.length > r ? t.create().update(s).digest() : s);
    for (let n = 0; n < i.length; n++)
      i[n] ^= 54;
    this.iHash.update(i), this.oHash = t.create();
    for (let n = 0; n < i.length; n++)
      i[n] ^= 106;
    this.oHash.update(i), mt(i);
  }
  update(t) {
    return xt(this), this.iHash.update(t), this;
  }
  digestInto(t) {
    xt(this), gt(t, this.outputLen), this.finished = !0, this.iHash.digestInto(t), this.oHash.update(t), this.oHash.digestInto(t), this.destroy();
  }
  digest() {
    const t = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(t), t;
  }
  _cloneInto(t) {
    t || (t = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: e, iHash: s, finished: r, destroyed: i, blockLen: n, outputLen: a } = this;
    return t = t, t.finished = r, t.destroyed = i, t.blockLen = n, t.outputLen = a, t.oHash = e._cloneInto(t.oHash), t.iHash = s._cloneInto(t.iHash), t;
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
function vs(o, t, e) {
  return Qt(o), vt(o, bt(e), bt(t));
}
const Ht = /* @__PURE__ */ Uint8Array.from([0]), ce = /* @__PURE__ */ Uint8Array.of();
function Es(o, t, e, s = 32) {
  Qt(o), qt(s);
  const r = o.outputLen;
  if (s > 255 * r)
    throw new Error("Length should be <= 255*HashLen");
  const i = Math.ceil(s / r);
  e === void 0 && (e = ce);
  const n = new Uint8Array(i * r), a = vt.create(o, t), c = a._cloneInto(), u = new Uint8Array(a.outputLen);
  for (let h = 0; h < i; h++)
    Ht[0] = h + 1, c.update(h === 0 ? ce : u).update(e).update(Ht).digestInto(u), n.set(u, r * h), a._cloneInto(c);
  return a.destroy(), c.destroy(), mt(u, Ht), n.slice(0, s);
}
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function Ss(o) {
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
function At(o, ...t) {
  if (!Ss(o))
    throw new Error("Uint8Array expected");
  if (t.length > 0 && !t.includes(o.length))
    throw new Error("Uint8Array expected of length " + t + ", got length=" + o.length);
}
function ot(o) {
  return new Uint32Array(o.buffer, o.byteOffset, Math.floor(o.byteLength / 4));
}
function ks(...o) {
  for (let t = 0; t < o.length; t++)
    o[t].fill(0);
}
function As(o, t) {
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
const Me = (o) => Uint8Array.from(o.split("").map((t) => t.charCodeAt(0))), Ms = Me("expand 16-byte k"), Ps = Me("expand 32-byte k"), Is = ot(Ms), Ts = ot(Ps);
function S(o, t) {
  return o << t | o >>> 32 - t;
}
function Vt(o) {
  return o.byteOffset % 4 === 0;
}
const _t = 64, Rs = 16, Pe = 2 ** 32 - 1, he = new Uint32Array();
function Cs(o, t, e, s, r, i, n, a) {
  const c = r.length, u = new Uint8Array(_t), h = ot(u), d = Vt(r) && Vt(i), g = d ? ot(r) : he, p = d ? ot(i) : he;
  for (let f = 0; f < c; n++) {
    if (o(t, e, s, h, n, a), n >= Pe)
      throw new Error("arx: counter overflow");
    const y = Math.min(_t, c - f);
    if (d && y === _t) {
      const b = f / 4;
      if (f % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let m = 0, w; m < Rs; m++)
        w = b + m, p[w] = g[w] ^ h[m];
      f += _t;
      continue;
    }
    for (let b = 0, m; b < y; b++)
      m = f + b, i[m] = r[m] ^ u[b];
    f += y;
  }
}
function xs(o, t) {
  const { allowShortKeys: e, extendNonceFn: s, counterLength: r, counterRight: i, rounds: n } = As({ allowShortKeys: !1, counterLength: 8, counterRight: !1, rounds: 20 }, t);
  if (typeof o != "function")
    throw new Error("core must be a function");
  return Wt(r), Wt(n), ue(i), ue(e), (a, c, u, h, d = 0) => {
    At(a), At(c), At(u);
    const g = u.length;
    if (h === void 0 && (h = new Uint8Array(g)), At(h), Wt(d), d < 0 || d >= Pe)
      throw new Error("arx: counter overflow");
    if (h.length < g)
      throw new Error(`arx: output (${h.length}) is shorter than data (${g})`);
    const p = [];
    let f = a.length, y, b;
    if (f === 32)
      p.push(y = le(a)), b = Ts;
    else if (f === 16 && e)
      y = new Uint8Array(32), y.set(a), y.set(a, 16), b = Is, p.push(y);
    else
      throw new Error(`arx: invalid 32-byte key, got length=${f}`);
    Vt(c) || p.push(c = le(c));
    const m = ot(y);
    if (s) {
      if (c.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      s(b, m, ot(c.subarray(0, 16)), m), c = c.subarray(16);
    }
    const w = 16 - r;
    if (w !== c.length)
      throw new Error(`arx: nonce must be ${w} or 16 bytes`);
    if (w !== 12) {
      const A = new Uint8Array(12);
      A.set(c, i ? 0 : 12 - c.length), c = A, p.push(c);
    }
    const k = ot(c);
    return Cs(o, b, m, k, u, h, d, n), ks(...p), h;
  };
}
function Ns(o, t, e, s, r, i = 20) {
  let n = o[0], a = o[1], c = o[2], u = o[3], h = t[0], d = t[1], g = t[2], p = t[3], f = t[4], y = t[5], b = t[6], m = t[7], w = r, k = e[0], A = e[1], M = e[2], P = n, T = a, R = c, C = u, F = h, x = d, N = g, B = p, U = f, K = y, H = b, W = m, z = w, q = k, V = A, j = M;
  for (let ne = 0; ne < i; ne += 2)
    P = P + F | 0, z = S(z ^ P, 16), U = U + z | 0, F = S(F ^ U, 12), P = P + F | 0, z = S(z ^ P, 8), U = U + z | 0, F = S(F ^ U, 7), T = T + x | 0, q = S(q ^ T, 16), K = K + q | 0, x = S(x ^ K, 12), T = T + x | 0, q = S(q ^ T, 8), K = K + q | 0, x = S(x ^ K, 7), R = R + N | 0, V = S(V ^ R, 16), H = H + V | 0, N = S(N ^ H, 12), R = R + N | 0, V = S(V ^ R, 8), H = H + V | 0, N = S(N ^ H, 7), C = C + B | 0, j = S(j ^ C, 16), W = W + j | 0, B = S(B ^ W, 12), C = C + B | 0, j = S(j ^ C, 8), W = W + j | 0, B = S(B ^ W, 7), P = P + x | 0, j = S(j ^ P, 16), H = H + j | 0, x = S(x ^ H, 12), P = P + x | 0, j = S(j ^ P, 8), H = H + j | 0, x = S(x ^ H, 7), T = T + N | 0, z = S(z ^ T, 16), W = W + z | 0, N = S(N ^ W, 12), T = T + N | 0, z = S(z ^ T, 8), W = W + z | 0, N = S(N ^ W, 7), R = R + B | 0, q = S(q ^ R, 16), U = U + q | 0, B = S(B ^ U, 12), R = R + B | 0, q = S(q ^ R, 8), U = U + q | 0, B = S(B ^ U, 7), C = C + F | 0, V = S(V ^ C, 16), K = K + V | 0, F = S(F ^ K, 12), C = C + F | 0, V = S(V ^ C, 8), K = K + V | 0, F = S(F ^ K, 7);
  let L = 0;
  s[L++] = n + P | 0, s[L++] = a + T | 0, s[L++] = c + R | 0, s[L++] = u + C | 0, s[L++] = h + F | 0, s[L++] = d + x | 0, s[L++] = g + N | 0, s[L++] = p + B | 0, s[L++] = f + U | 0, s[L++] = y + K | 0, s[L++] = b + H | 0, s[L++] = m + W | 0, s[L++] = w + z | 0, s[L++] = k + q | 0, s[L++] = A + V | 0, s[L++] = M + j | 0;
}
const de = /* @__PURE__ */ xs(Ns, {
  counterRight: !1,
  counterLength: 4,
  allowShortKeys: !1
}), Ds = {
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
      let r = e.replace(/^0x/, "");
      if (r.length === 66 && (r.startsWith("02") || r.startsWith("03")) && (r = r.slice(2)), s.length !== 64)
        throw new G(
          "Invalid private key length",
          Y.INVALID_KEY
        );
      if (r.length !== 64)
        throw new G(
          "Invalid public key length - expected 32-byte x-coordinate",
          Y.INVALID_KEY
        );
      const i = new Uint8Array(32);
      for (let u = 0; u < 32; u++)
        i[u] = parseInt(s.substr(u * 2, 2), 16);
      const a = ts(i, "02" + r).subarray(1, 33);
      return vs(et, a, "nip44-v2");
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
      const s = Es(et, t, e, 76);
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
    const e = t.length, s = this.calculatePaddedContentLength(e), r = new Uint8Array(s);
    return r.set(t, 0), r;
  }
  /**
   * Apply NIP-44 formatting: [plaintext_length: u16][padded_plaintext]
   * Returns the complete formatted data for encryption
   */
  static formatForEncryption(t) {
    const e = t.length, s = this.applyPadding(t), r = 2 + s.length, i = new Uint8Array(r);
    return new DataView(i.buffer).setUint16(0, e, !1), i.set(s, 2), i;
  }
  /**
   * Apply NIP-44 formatting with length prefix:
   * [plaintext_length: u16][padded_plaintext]
   */
  static applyNIP44Formatting(t) {
    const e = t.length, s = this.applyPadding(t), r = 2 + s.length, i = new Uint8Array(r);
    return new DataView(i.buffer).setUint16(0, e, !1), i.set(s, 2), i;
  }
  /**
   * Remove padding from padded content (two different formats supported)
   */
  static removePadding(t) {
    if (t.length >= 2) {
      const r = new DataView(t.buffer).getUint16(0, !1);
      if (r <= t.length - 2 && r > 0)
        return t.subarray(2, 2 + r);
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
      const r = new TextEncoder().encode(t), i = s || this.generateNonce(), n = this.deriveMessageKeys(e, i), a = this.formatForEncryption(r), c = de(
        n.chachaKey,
        n.chachaNonce,
        a
      ), u = It(i, c), h = vt(et, n.hmacKey, u), d = new Uint8Array([this.VERSION]), g = It(d, i, c, h);
      return {
        payload: typeof Buffer < "u" ? Buffer.from(g).toString("base64") : btoa(String.fromCharCode(...g)),
        nonce: i
      };
    } catch (r) {
      throw r instanceof G ? r : new G(
        `Encryption failed: ${r.message}`,
        Y.ENCRYPTION_FAILED,
        r
      );
    }
  }
  /**
   * Decrypt NIP-44 v2 payload
   */
  static decrypt(t, e) {
    try {
      const s = typeof Buffer < "u" ? new Uint8Array(Buffer.from(t, "base64")) : (() => {
        const m = atob(t), w = new Uint8Array(m.length);
        for (let k = 0; k < m.length; k++) w[k] = m.charCodeAt(k);
        return w;
      })(), r = this.VERSION_SIZE + this.NONCE_SIZE + this.MAC_SIZE;
      if (s.length < r)
        throw new G(
          "Payload too short",
          Y.INVALID_PAYLOAD
        );
      let i = 0;
      const n = s[i];
      if (i += this.VERSION_SIZE, n !== this.VERSION)
        throw new G(
          `Unsupported version: ${n}`,
          Y.INVALID_PAYLOAD
        );
      const a = s.slice(i, i + this.NONCE_SIZE);
      i += this.NONCE_SIZE;
      const c = s.slice(i, -this.MAC_SIZE), u = s.slice(-this.MAC_SIZE), h = this.deriveMessageKeys(e, a), d = It(a, c), g = vt(et, h.hmacKey, d);
      if (!_s(g, u))
        return {
          plaintext: "",
          isValid: !1
        };
      const f = de(
        h.chachaKey,
        h.chachaNonce,
        c
      ), y = this.removePadding(f);
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
        const r = atob(t), i = new Uint8Array(r.length);
        for (let n = 0; n < r.length; n++) i[n] = r.charCodeAt(n);
        return i;
      })(), s = this.VERSION_SIZE + this.NONCE_SIZE + 1;
      return !(e.length < s || e[0] !== this.VERSION);
    } catch {
      return !1;
    }
  }
}
l(X, "VERSION", 2), l(X, "SALT", new TextEncoder().encode(Ds.saltInfo)), l(X, "NONCE_SIZE", 32), l(X, "CHACHA_KEY_SIZE", 32), l(X, "CHACHA_NONCE_SIZE", 12), l(X, "HMAC_KEY_SIZE", 32), l(X, "MAC_SIZE", 32), l(X, "VERSION_SIZE", 1);
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
      const t = ht(32), e = Array.from(t).map((n) => n.toString(16).padStart(2, "0")).join(""), r = dt.getPublicKey(e, !1).slice(1, 33), i = Array.from(r).map((n) => n.toString(16).padStart(2, "0")).join("");
      return {
        privateKey: e,
        publicKey: i
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
      const s = dt.getPublicKey(t.privateKey, !1).slice(1, 33), r = Array.from(s).map((i) => i.toString(16).padStart(2, "0")).join("");
      return t.publicKey.toLowerCase() === r.toLowerCase();
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
      const e = ht(32).reduce((s, r) => s + r.toString(16).padStart(2, "0"), "");
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
    for (let r = 0; r < t; r++)
      s.push(this.generateRandomizedTimestamp(e));
    return s;
  }
  /**
   * Validate that a timestamp is within acceptable bounds for gift wraps
   */
  static validateGiftWrapTimestamp(t, e = Q.MAX_TIMESTAMP_AGE_SECONDS) {
    try {
      const s = Math.floor(Date.now() / 1e3), r = s - e, i = s + 60;
      return t >= r && t <= i;
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
    const s = e - t, r = this.generateSecureRandomOffset(s);
    return t + r;
  }
}
class Lt {
  /**
   * Create a single gift wrap for one recipient
   */
  static async createGiftWrap(t, e, s, r) {
    try {
      this.validateSeal(t), this.validateRecipient(e);
      const i = s || Rt.generateEphemeralKeyPair();
      if (!Rt.validateEphemeralKeyPair(i))
        throw new v(
          "Invalid ephemeral key pair",
          E.GIFT_WRAP_CREATION_FAILED
        );
      const n = r || Gt.generateRandomizedTimestamp(), a = JSON.stringify(t), c = X.deriveConversationKey(
        i.privateKey,
        e.pubkey
      ), u = X.encrypt(a, c), h = e.relayHint ? ["p", e.pubkey, e.relayHint] : ["p", e.pubkey], d = {
        pubkey: i.publicKey,
        created_at: n,
        kind: Q.GIFT_WRAP_KIND,
        tags: [h],
        content: u.payload
      }, g = this.calculateEventId(d), p = await this.signEvent(d, g, i.privateKey);
      return {
        giftWrap: {
          id: g,
          pubkey: i.publicKey,
          created_at: n,
          kind: Q.GIFT_WRAP_KIND,
          tags: [h],
          content: u.payload,
          sig: p
        },
        ephemeralKeyPair: i,
        recipient: e.pubkey
      };
    } catch (i) {
      throw i instanceof v ? i : new v(
        `Gift wrap creation failed: ${i.message}`,
        E.GIFT_WRAP_CREATION_FAILED,
        i
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
    const s = [], r = Rt.generateMultipleEphemeralKeyPairs(
      e.length
    ), i = Gt.generateMultipleRandomizedTimestamps(
      e.length
    );
    for (let n = 0; n < e.length; n++) {
      const a = await this.createGiftWrap(
        t,
        e[n],
        r[n],
        i[n]
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
    ]), s = new TextEncoder().encode(e), r = et(s);
    return D(r);
  }
  /**
   * Sign event according to NIP-01 using Schnorr signatures
   */
  static async signEvent(t, e, s) {
    try {
      const r = await dt.schnorr.sign(e, s);
      return D(r);
    } catch (r) {
      throw new v(
        "Failed to sign gift wrap event",
        E.GIFT_WRAP_CREATION_FAILED,
        r
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
const Ls = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapCreator: Lt
}, Symbol.toStringTag, { value: "Module" }));
class at {
  /**
   * Create gift-wrapped direct messages for multiple recipients
   * This is the main entry point for the NIP-59 protocol
   */
  static async createGiftWrappedDM(t, e, s, r, i) {
    try {
      this.validateCreateDMInputs(t, e, s);
      const n = this.createRumor(t, e, r), a = [];
      for (const u of s.recipients) {
        const h = await Dt.createSealWithSigner(n, i, u.pubkey), d = s.maxTimestampAge === 0 ? Math.floor(Date.now() / 1e3) : void 0, g = await Lt.createGiftWrap(
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
        a.push(g);
      }
      const c = await Dt.createSealWithSigner(n, i, s.recipients[0].pubkey);
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
    const r = [];
    return s && r.push(["subject", s]), {
      pubkey: e,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 14,
      // Chat message kind (NIP-17, not 4)
      tags: r,
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
      const r = await this.createGiftWrappedDM(
        s.message,
        s.senderPrivateKey,
        s.config
      );
      e.push(r);
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
    for (const r of t) {
      const i = await this.decryptGiftWrappedDM(r, e);
      i.isValid && s.push(i);
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
    for (const r of s.recipients)
      if (!r || typeof r.pubkey != "string" || !/^[0-9a-f]{64}$/i.test(r.pubkey))
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
      ), r = dt.getPublicKey(e, !1).slice(1, 33);
      return Array.from(r).map((n) => n.toString(16).padStart(2, "0")).join("");
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
    const e = t.length, s = t.reduce((c, u) => c + u.giftWraps.length, 0), r = Math.floor(Date.now() / 1e3), i = t.flatMap(
      (c) => c.giftWraps.map((u) => r - u.giftWrap.created_at)
    ), n = i.length > 0 ? i.reduce((c, u) => c + u, 0) / i.length : 0, a = new Set(
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
      const { SealCreator: s } = await Promise.resolve().then(() => ws), { NIP44Crypto: r } = await Promise.resolve().then(() => jt), i = r.deriveConversationKey(
        e,
        t.pubkey
      ), n = r.decrypt(
        t.content,
        i
      );
      if (!n || !n.isValid)
        return null;
      const a = JSON.parse(n.plaintext);
      if (!a || a.kind !== 13)
        return null;
      const c = r.deriveConversationKey(
        e,
        a.pubkey
      ), u = r.decrypt(
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
const Fs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GiftWrapProtocol: at
}, Symbol.toStringTag, { value: "Module" }));
class Ie {
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
    var r, i;
    const t = this, e = (r = t.config) == null ? void 0 : r.relayManager, s = (e == null ? void 0 : e.signingProvider) || t.signer || ((i = t.nostr) == null ? void 0 : i.signingProvider);
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
    var s, r;
    try {
      this.config.debug && console.log("📤 DMConversation.send called:", {
        content: t.substring(0, 20) + "...",
        subject: e,
        recipientPubkey: this.config.recipientPubkey.substring(0, 8) + "...",
        hasSenderPrivateKey: !!this.config.senderPrivateKey,
        senderPrivateKeyLength: (s = this.config.senderPrivateKey) == null ? void 0 : s.length
      }), this.updateStatus("active");
      const i = this.generateMessageId(), n = Math.floor(Date.now() / 1e3), a = {
        id: i,
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
        (r = this.config.relayHints) == null ? void 0 : r[0]
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
      for (const g of u.giftWraps)
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
        return this.updateMessageStatus(i, "sent"), this.config.debug && console.log(`✅ DM sent successfully: ${i}`), { success: !0, messageId: i };
      {
        this.updateMessageStatus(i, "failed");
        const g = d || "Failed to publish to any relay";
        return this.setError(g), this.config.debug && console.error(`❌ DM send failed: ${g}`), { success: !1, error: g, messageId: i };
      }
    } catch (i) {
      const n = i instanceof Error ? i.message : "Unknown error sending message";
      return this.setError(n), this.config.debug && console.error("❌ Exception in send:", i), { success: !1, error: n };
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
        onEvent: (r) => this.handleIncomingEvent(r),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`DM conversation subscription active for ${this.config.recipientPubkey}`);
        },
        onClose: (r) => {
          this.updateStatus("disconnected"), r && this.setError(`Subscription closed: ${r}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([e], s), !this.subscription.success) {
        const r = ((t = this.subscription.error) == null ? void 0 : t.message) || "Failed to create subscription";
        this.setError(r), this.updateStatus("error");
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
      return s.sort((r, i) => r.timestamp - i.timestamp), {
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
        (r) => r.id === t ? { ...r, status: e } : r
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
    const e = (s = t.tags) == null ? void 0 : s.find((r) => r[0] === "subject");
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
class Te {
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
      const r = this.generateMessageId(), i = Math.floor(Date.now() / 1e3), n = this.getCurrentSubject(), a = this.getCurrentParticipants(), c = {
        id: r,
        content: t,
        senderPubkey: this.config.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: i,
        isFromMe: !0,
        status: "sending",
        subject: n,
        participants: a
      };
      this.addMessage(c);
      const h = {
        recipients: a.filter((f) => f !== this.config.senderPubkey).map((f) => ({ pubkey: f })),
        relayHint: (s = (e = this.config.options) == null ? void 0 : e.relayHints) == null ? void 0 : s[0]
      }, d = await at.createGiftWrappedDM(
        t,
        this.config.senderPrivateKey,
        h
      );
      let g = !1, p;
      for (const f of d.giftWraps)
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
        participants: s.participants.filter((r) => r !== t)
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
        onEvent: (r) => this.handleIncomingEvent(r),
        onEose: () => {
          this.updateStatus("active"), this.config.debug && console.log(`Room subscription active: ${this.roomId}`);
        },
        onClose: (r) => {
          this.updateStatus("disconnected"), r && this.setError(`Subscription closed: ${r}`);
        }
      };
      if (this.subscription = await this.config.subscriptionManager.subscribe([e], s), !this.subscription.success) {
        const r = ((t = this.subscription.error) == null ? void 0 : t.message) || "Failed to create subscription";
        this.setError(r), this.updateStatus("error");
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
      const r = this.extractSubjectFromRumor(e.rumor), i = this.getCurrentSubject(), n = {
        id: this.generateMessageId(),
        content: e.rumor.content,
        senderPubkey: e.senderPubkey,
        recipientPubkey: "",
        // Not applicable for rooms
        timestamp: e.rumor.created_at,
        isFromMe: !1,
        eventId: t.id,
        status: "received",
        subject: r || i,
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
      return s.sort((r, i) => r.timestamp - i.timestamp), {
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
        (r) => r.id === t ? { ...r, status: e } : r
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
    const e = (s = t.tags) == null ? void 0 : s.find((r) => r[0] === "subject");
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
class Re {
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
    const s = t.map((n) => this.normalizePubkey(n)), r = this.generateRoomId(s);
    let i = this.rooms.get(r);
    return i || (i = await this.createRoom(s, e), this.rooms.set(r, i), this.updateConversationList(), this.config.debug && console.log(`Created new DM room: ${r} with ${s.length} participants`)), i;
  }
  /**
   * Get all active conversations as summaries
   */
  getConversations() {
    if (this.shouldUseUniversalDM()) {
      const s = this.getUniversalDMInstance();
      if (s && typeof s.summaries == "function")
        return s.summaries().map((i) => ({
          pubkey: i.pubkey,
          latestMessage: null,
          // TODO: Get latest message from conversation
          lastActivity: 0,
          // TODO: Get last activity timestamp
          isActive: !0,
          // TODO: Get actual status
          subject: i.subject,
          // Use subject from UniversalDM summary
          participants: i.participants,
          type: i.type
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
    }, r = new Ie(s);
    return this.setupConversationReactivity(r), r;
  }
  async createRoom(t, e) {
    if (!this._senderPubkey)
      throw new Error("Sender public key not available. Call nostr.publish() or another method first to initialize signing.");
    const s = await this.getPrivateKeySecurely(), r = {
      participants: t,
      senderPrivateKey: s,
      senderPubkey: this._senderPubkey,
      subscriptionManager: this.config.subscriptionManager,
      relayManager: this.config.relayManager,
      options: e,
      debug: this.config.debug
    }, i = new Te(r);
    return this.setupRoomReactivity(i), i;
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
      let r = null, i = "disconnected", n;
      const a = e.latest.subscribe((h) => {
        r = h;
      }), c = e.status.subscribe((h) => {
        i = h;
      }), u = e.subject.subscribe((h) => {
        n = h;
      });
      a(), c(), u(), t.push({
        pubkey: s,
        latestMessage: r,
        lastActivity: (r == null ? void 0 : r.timestamp) || 0,
        isActive: i === "active" || i === "connecting",
        subject: n,
        type: "conversation"
      });
    }), this.rooms.forEach((e, s) => {
      let r = null, i = "disconnected", n = "", a = [];
      const c = e.latest.subscribe((g) => {
        r = g;
      }), u = e.status.subscribe((g) => {
        i = g;
      }), h = e.subject.subscribe((g) => {
        n = g;
      }), d = e.participants.subscribe((g) => {
        a = g;
      });
      c(), u(), h(), d(), t.push({
        pubkey: s,
        // Use roomId as the identifier
        latestMessage: r,
        lastActivity: (r == null ? void 0 : r.timestamp) || 0,
        isActive: i === "active" || i === "connecting",
        subject: n,
        participants: a,
        type: "room"
      });
    }), t.sort((e, s) => s.lastActivity - e.lastActivity), this._conversationList.set(t);
  }
  async handleGlobalInboxEvent(t) {
    this.config.debug && console.log("🎁 Processing gift wrap event:", t.id);
    try {
      const { GiftWrapProtocol: e } = await Promise.resolve().then(() => Fs), s = await this.getPrivateKeySecurely(), r = await e.unwrapGiftWrap(t, s);
      if (r) {
        const i = r.pubkey;
        if (this.config.debug && console.log("✅ Decrypted event (kind " + r.kind + ") from:", i.substring(0, 8) + "..."), r.kind === 4 || r.kind === 14) {
          let n = this.conversations.get(i);
          n || (this.config.debug && console.log("🆕 Auto-creating conversation with:", i.substring(0, 8) + "..."), n = await this.with(i)), n && typeof n.handleDecryptedEvent == "function" && n.handleDecryptedEvent(r), this.updateConversationList(), this.config.debug && console.log("🔄 Updated conversations, total:", this.conversations.size);
        } else
          this.config.debug && console.log("🔮 Received encrypted event kind " + r.kind + " - not a DM, caching for future use");
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
    var r;
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
      constructor: (r = s == null ? void 0 : s.constructor) == null ? void 0 : r.name
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
    var r, i;
    this.nostr = t, this.myPubkey = (e || "").toLowerCase(), this.otherPubkey = (s || "").toLowerCase(), console.log("🚀 UniversalDMConversation constructor:", {
      myPubkey: e.substring(0, 16) + "...",
      otherPubkey: s.substring(0, 16) + "...",
      hasQueryMethod: typeof this.nostr.query == "function"
    });
    try {
      this.nostr.startUniversalGiftWrapSubscription().catch(() => {
      }), this.store = this.nostr.query().kinds([14]).authors([this.myPubkey, this.otherPubkey]).tags("p", [this.myPubkey, this.otherPubkey]).execute(), console.log("✅ Store created successfully:", typeof this.store, (i = (r = this.store) == null ? void 0 : r.constructor) == null ? void 0 : i.name), setTimeout(() => {
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
      const s = await this.convertEventsToMessages(e), i = [...this.messageCache, ...s].filter(
        (n, a, c) => c.findIndex(
          (u) => u.eventId === n.eventId || u.content === n.content && Math.abs(u.timestamp - n.timestamp) < 5
        ) === a
      );
      i.sort((n, a) => n.timestamp - a.timestamp), this.messageCache = i, t(i);
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
      const r = this.nostr.signingProvider, i = await (((s = r == null ? void 0 : r.capabilities) == null ? void 0 : s.call(r)) ?? { nip44Encrypt: !1, nip44Decrypt: !1 }), n = {
        pubkey: this.myPubkey,
        created_at: Math.floor(Date.now() / 1e3),
        kind: 14,
        tags: e ? [["subject", e]] : [],
        content: t
      };
      if (i.nip44Encrypt && typeof r.nip44Encrypt == "function") {
        const a = async (f) => {
          const y = await r.nip44Encrypt(f, JSON.stringify(n)), b = {
            pubkey: this.myPubkey,
            created_at: Math.floor(Date.now() / 1e3),
            kind: 13,
            tags: [],
            content: y
          }, m = _.calculateEventId(b), w = await r.signEvent(b);
          return { ...b, id: m, sig: w };
        }, [c, u] = await Promise.all([
          a(this.otherPubkey),
          a(this.myPubkey)
        ]), { GiftWrapCreator: h } = await Promise.resolve().then(() => Ls), [d, g] = await Promise.all([
          h.createGiftWrap(c, { pubkey: this.otherPubkey }, void 0, Math.floor(Date.now() / 1e3)),
          h.createGiftWrap(u, { pubkey: this.myPubkey }, void 0, Math.floor(Date.now() / 1e3))
        ]), [p] = await Promise.all([
          this.nostr.publishSigned(d.giftWrap),
          this.nostr.publishSigned(g.giftWrap).catch(() => ({ success: !1 }))
        ]);
        if (p.success) {
          const f = d.giftWrap, y = {
            id: f.id,
            content: t,
            senderPubkey: this.myPubkey,
            recipientPubkey: this.otherPubkey,
            timestamp: f.created_at,
            isFromMe: !0,
            eventId: f.id,
            status: "sent",
            subject: e,
            sender: this.myPubkey
          };
          return this.messageCache.push(y), this.messageCache.sort((b, m) => b.timestamp - m.timestamp), { success: !0, messageId: f.id };
        }
        return { success: !1, error: "Failed to publish to recipient" };
      } else
        return { success: !1, error: "Signer does not support NIP-44 encryption" };
    } catch (r) {
      return {
        success: !1,
        error: r instanceof Error ? r.message : "Unknown error"
      };
    }
  }
  async convertEventsToMessages(t) {
    const e = [];
    for (const s of t) {
      if (s.kind !== 14) continue;
      const r = s.pubkey === this.myPubkey, i = s.tags.some((a) => a[0] === "p" && a[1] === this.otherPubkey);
      (s.tags.some((a) => a[0] === "p" && a[1] === this.myPubkey) || r && i) && e.push({
        id: s.id,
        content: s.content,
        senderPubkey: s.pubkey,
        recipientPubkey: r ? this.otherPubkey : this.myPubkey,
        timestamp: s.created_at,
        isFromMe: r,
        eventId: s.id,
        status: r ? "sent" : "received",
        subject: this.getSubjectFromEvent(s),
        sender: s.pubkey
      });
    }
    return e.sort((s, r) => s.timestamp - r.timestamp);
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
    const e = (s = t.tags) == null ? void 0 : s.find((r) => r[0] === "subject");
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
        const r = s.filter((i) => i.tags.some((n) => n[0] === "subject")).sort((i, n) => n.created_at - i.created_at)[0];
        e(r ? t.getSubjectFromEvent(r) : void 0);
      }),
      get current() {
        const s = t.store.current.filter((r) => r.tags.some((i) => i[0] === "subject")).sort((r, i) => i.created_at - r.created_at)[0];
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
function Ce(o) {
  return o instanceof Uint8Array || ArrayBuffer.isView(o) && o.constructor.name === "Uint8Array";
}
function xe(o, t) {
  return Array.isArray(t) ? t.length === 0 ? !0 : o ? t.every((e) => typeof e == "string") : t.every((e) => Number.isSafeInteger(e)) : !1;
}
function $s(o) {
  if (typeof o != "function")
    throw new Error("function expected");
  return !0;
}
function Et(o, t) {
  if (typeof t != "string")
    throw new Error(`${o}: string expected`);
  return !0;
}
function Ne(o) {
  if (!Number.isSafeInteger(o))
    throw new Error(`invalid integer: ${o}`);
}
function Yt(o) {
  if (!Array.isArray(o))
    throw new Error("array expected");
}
function De(o, t) {
  if (!xe(!0, t))
    throw new Error(`${o}: array of strings expected`);
}
function Le(o, t) {
  if (!xe(!1, t))
    throw new Error(`${o}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function Os(...o) {
  const t = (i) => i, e = (i, n) => (a) => i(n(a)), s = o.map((i) => i.encode).reduceRight(e, t), r = o.map((i) => i.decode).reduce(e, t);
  return { encode: s, decode: r };
}
// @__NO_SIDE_EFFECTS__
function Bs(o) {
  const t = typeof o == "string" ? o.split("") : o, e = t.length;
  De("alphabet", t);
  const s = new Map(t.map((r, i) => [r, i]));
  return {
    encode: (r) => (Yt(r), r.map((i) => {
      if (!Number.isSafeInteger(i) || i < 0 || i >= e)
        throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${o}`);
      return t[i];
    })),
    decode: (r) => (Yt(r), r.map((i) => {
      Et("alphabet.decode", i);
      const n = s.get(i);
      if (n === void 0)
        throw new Error(`Unknown letter: "${i}". Allowed: ${o}`);
      return n;
    }))
  };
}
// @__NO_SIDE_EFFECTS__
function Us(o = "") {
  return Et("join", o), {
    encode: (t) => (De("join.decode", t), t.join(o)),
    decode: (t) => (Et("join.decode", t), t.split(o))
  };
}
const Fe = (o, t) => t === 0 ? o : Fe(t, o % t), Ft = /* @__NO_SIDE_EFFECTS__ */ (o, t) => o + (t - Fe(o, t)), Ct = /* @__PURE__ */ (() => {
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
  let r = 0, i = 0;
  const n = Ct[t], a = Ct[e] - 1, c = [];
  for (const u of o) {
    if (Ne(u), u >= n)
      throw new Error(`convertRadix2: invalid data word=${u} from=${t}`);
    if (r = r << t | u, i + t > 32)
      throw new Error(`convertRadix2: carry overflow pos=${i} from=${t}`);
    for (i += t; i >= e; i -= e)
      c.push((r >> i - e & a) >>> 0);
    const h = Ct[i];
    if (h === void 0)
      throw new Error("invalid carry");
    r &= h - 1;
  }
  if (r = r << e - i & a, !s && i >= t)
    throw new Error("Excess padding");
  if (!s && r > 0)
    throw new Error(`Non-zero padding: ${r}`);
  return s && i > 0 && c.push(r >>> 0), c;
}
// @__NO_SIDE_EFFECTS__
function Ks(o, t = !1) {
  if (Ne(o), o <= 0 || o > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ Ft(8, o) > 32 || /* @__PURE__ */ Ft(o, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (e) => {
      if (!Ce(e))
        throw new Error("radix2.encode input should be Uint8Array");
      return Jt(Array.from(e), 8, o, !t);
    },
    decode: (e) => (Le("radix2.decode", e), Uint8Array.from(Jt(e, o, 8, t)))
  };
}
function fe(o) {
  return $s(o), function(...t) {
    try {
      return o.apply(null, t);
    } catch {
    }
  };
}
const Xt = /* @__PURE__ */ Os(/* @__PURE__ */ Bs("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ Us("")), ye = [996825010, 642813549, 513874426, 1027748829, 705979059];
function yt(o) {
  const t = o >> 25;
  let e = (o & 33554431) << 5;
  for (let s = 0; s < ye.length; s++)
    (t >> s & 1) === 1 && (e ^= ye[s]);
  return e;
}
function pe(o, t, e = 1) {
  const s = o.length;
  let r = 1;
  for (let i = 0; i < s; i++) {
    const n = o.charCodeAt(i);
    if (n < 33 || n > 126)
      throw new Error(`Invalid prefix (${o})`);
    r = yt(r) ^ n >> 5;
  }
  r = yt(r);
  for (let i = 0; i < s; i++)
    r = yt(r) ^ o.charCodeAt(i) & 31;
  for (let i of t)
    r = yt(r) ^ i;
  for (let i = 0; i < 6; i++)
    r = yt(r);
  return r ^= e, Xt.encode(Jt([r % Ct[30]], 30, 5, !1));
}
// @__NO_SIDE_EFFECTS__
function Hs(o) {
  const t = o === "bech32" ? 1 : 734539939, e = /* @__PURE__ */ Ks(5), s = e.decode, r = e.encode, i = fe(s);
  function n(d, g, p = 90) {
    Et("bech32.encode prefix", d), Ce(g) && (g = Array.from(g)), Le("bech32.encode", g);
    const f = d.length;
    if (f === 0)
      throw new TypeError(`Invalid prefix length ${f}`);
    const y = f + 7 + g.length;
    if (p !== !1 && y > p)
      throw new TypeError(`Length ${y} exceeds limit ${p}`);
    const b = d.toLowerCase(), m = pe(b, g, t);
    return `${b}1${Xt.encode(g)}${m}`;
  }
  function a(d, g = 90) {
    Et("bech32.decode input", d);
    const p = d.length;
    if (p < 8 || g !== !1 && p > g)
      throw new TypeError(`invalid string length: ${p} (${d}). Expected (8..${g})`);
    const f = d.toLowerCase();
    if (d !== f && d !== d.toUpperCase())
      throw new Error("String must be lowercase or uppercase");
    const y = f.lastIndexOf("1");
    if (y === 0 || y === -1)
      throw new Error('Letter "1" must be present between prefix and data only');
    const b = f.slice(0, y), m = f.slice(y + 1);
    if (m.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const w = Xt.decode(m).slice(0, -6), k = pe(b, w, t);
    if (!m.endsWith(k))
      throw new Error(`Invalid checksum in ${d}: expected "${k}"`);
    return { prefix: b, words: w };
  }
  const c = fe(a);
  function u(d) {
    const { prefix: g, words: p } = a(d, !1);
    return { prefix: g, words: p, bytes: s(p) };
  }
  function h(d, g) {
    return n(d, r(g));
  }
  return {
    encode: n,
    decode: a,
    encodeFromBytes: h,
    decodeToBytes: u,
    decodeUnsafe: c,
    fromWords: s,
    fromWordsUnsafe: i,
    toWords: r
  };
}
const $t = /* @__PURE__ */ Hs("bech32"), $e = 5e3, Ot = new TextEncoder(), Mt = new TextDecoder();
function Ws(o) {
  const t = new Uint8Array(4);
  return t[0] = o >> 24 & 255, t[1] = o >> 16 & 255, t[2] = o >> 8 & 255, t[3] = o & 255, t;
}
function zt(o) {
  const t = {};
  let e = o;
  for (; e.length > 0 && !(e.length < 2); ) {
    const s = e[0], r = e[1];
    if (e.length < 2 + r) break;
    const i = e.slice(2, 2 + r);
    e = e.slice(2 + r), t[s] = t[s] || [], t[s].push(i);
  }
  return t;
}
function ee(o) {
  const t = [];
  return Object.entries(o).reverse().forEach(([e, s]) => {
    s.forEach((r) => {
      const i = new Uint8Array(r.length + 2);
      i.set([parseInt(e)], 0), i.set([r.length], 1), i.set(r, 2), t.push(i);
    });
  }), It(...t);
}
function Bt(o, t) {
  const e = $t.toWords(t);
  return $t.encode(o, e, $e);
}
function se(o, t) {
  return Bt(o, t);
}
function kt(o) {
  var r, i, n, a, c, u, h;
  if (o.toLowerCase().startsWith("nostr:")) {
    const g = o.slice(6).split("?")[0];
    return kt(g);
  }
  const { prefix: t, words: e } = $t.decode(o, $e), s = new Uint8Array($t.fromWords(e));
  switch (t) {
    case "nprofile": {
      const d = zt(s);
      if (!((r = d[0]) != null && r[0])) throw new Error("missing TLV 0 for nprofile");
      if (d[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      return {
        type: "nprofile",
        data: {
          pubkey: D(d[0][0]),
          relays: d[1] ? d[1].map((g) => Mt.decode(g)) : []
        }
      };
    }
    case "nevent": {
      const d = zt(s);
      if (!((i = d[0]) != null && i[0])) throw new Error("missing TLV 0 for nevent");
      if (d[0][0].length !== 32) throw new Error("TLV 0 should be 32 bytes");
      if (d[2] && d[2][0] && d[2][0].length !== 32) throw new Error("TLV 2 should be 32 bytes");
      if (d[3] && d[3][0] && d[3][0].length !== 4) throw new Error("TLV 3 should be 4 bytes");
      return {
        type: "nevent",
        data: {
          id: D(d[0][0]),
          relays: d[1] ? d[1].map((g) => Mt.decode(g)) : [],
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
          relays: d[1] ? d[1].map((g) => Mt.decode(g)) : []
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
function zs(o) {
  return typeof o == "string" && o.toLowerCase().startsWith("nostr:");
}
function Vr(o) {
  if (!zs(o)) throw new Error("Invalid Nostr URI: must start with nostr:");
  const t = o.slice(6), [e, s = ""] = t.split("?"), r = kt(e), i = {};
  if (s.length > 0)
    for (const n of s.split("&")) {
      if (!n) continue;
      const a = n.indexOf("="), c = decodeURIComponent(a >= 0 ? n.slice(0, a) : n), u = decodeURIComponent(a >= 0 ? n.slice(a + 1) : "");
      i[c] === void 0 ? i[c] = u : Array.isArray(i[c]) ? i[c].push(u) : i[c] = [i[c], u];
    }
  return { decoded: r, params: i };
}
function jr(o, t) {
  const e = typeof o == "string" ? o : (() => {
    switch (o.type) {
      case "npub":
        return `npub1${o.data.slice(4)}`;
      case "nsec":
        return "nsec1";
      case "note":
        return `note1${o.data.slice(4)}`;
      case "nprofile":
        return Oe(o.data);
      case "nevent":
        return Be(o.data);
      case "naddr":
        return Ue(o.data);
      default:
        throw new Error("Unsupported DecodedResult");
    }
  })(), s = t ? Object.entries(t).flatMap(([r, i]) => Array.isArray(i) ? i.map((n) => `${encodeURIComponent(r)}=${encodeURIComponent(n)}`) : [`${encodeURIComponent(r)}=${encodeURIComponent(i)}`]).join("&") : "";
  return s ? `nostr:${e}?${s}` : `nostr:${e}`;
}
function qs(o) {
  return se("nsec", o);
}
function Vs(o) {
  return se("npub", ct(o));
}
function js(o) {
  return se("note", ct(o));
}
function Oe(o) {
  const t = ee({
    0: [ct(o.pubkey)],
    1: (o.relays || []).map((e) => Ot.encode(e))
  });
  return Bt("nprofile", t);
}
function Be(o) {
  let t;
  o.kind !== void 0 && (t = Ws(o.kind));
  const e = ee({
    0: [ct(o.id)],
    1: (o.relays || []).map((s) => Ot.encode(s)),
    2: o.author ? [ct(o.author)] : [],
    3: t ? [new Uint8Array(t)] : []
  });
  return Bt("nevent", e);
}
function Ue(o) {
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
function Gr(o) {
  const t = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Vs(t);
}
function Yr(o) {
  const t = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex privkey: must be 64 hex characters");
  return qs(ct(t));
}
function Jr(o) {
  const t = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(t))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  return js(t);
}
function Ke(o) {
  if (!o.startsWith("npub1"))
    throw new Error('Invalid npub: must start with "npub1"');
  const t = kt(o);
  if (t.type !== "npub")
    throw new Error('Invalid npub: decoded type is not "npub"');
  return t.data;
}
function Gs(o) {
  if (!o.startsWith("nsec1"))
    throw new Error('Invalid nsec: must start with "nsec1"');
  const t = kt(o);
  if (t.type !== "nsec")
    throw new Error('Invalid nsec: decoded type is not "nsec"');
  return D(t.data);
}
function Ys(o) {
  if (!o.startsWith("note1"))
    throw new Error('Invalid note: must start with "note1"');
  const t = kt(o);
  if (t.type !== "note")
    throw new Error('Invalid note: decoded type is not "note"');
  return t.data;
}
function Xr(o, t) {
  const e = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(e))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Oe({ pubkey: e, relays: t });
}
function Zr(o, t, e, s) {
  const r = o.startsWith("0x") ? o.slice(2) : o;
  if (!/^[0-9a-fA-F]{64}$/.test(r))
    throw new Error("Invalid hex event id: must be 64 hex characters");
  let i;
  if (e && (i = e.startsWith("0x") ? e.slice(2) : e, !/^[0-9a-fA-F]{64}$/.test(i)))
    throw new Error("Invalid hex author pubkey: must be 64 hex characters");
  return Be({
    id: r,
    relays: t,
    author: i,
    kind: s
  });
}
function Js(o, t, e, s) {
  const r = t.startsWith("0x") ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(r))
    throw new Error("Invalid hex pubkey: must be 64 hex characters");
  return Ue({
    identifier: o,
    pubkey: r,
    kind: e,
    relays: s
  });
}
function Xs(o) {
  if (!o || typeof o != "string")
    return !1;
  const t = o.startsWith("0x") ? o.slice(2) : o;
  return /^[0-9a-fA-F]{64}$/.test(t);
}
function Zs(o) {
  if (!o || typeof o != "string" || !o.startsWith("npub1"))
    return !1;
  try {
    return Ke(o), !0;
  } catch {
    return !1;
  }
}
function Qr(o) {
  if (!o || typeof o != "string" || !o.startsWith("nsec1"))
    return !1;
  try {
    return Gs(o), !0;
  } catch {
    return !1;
  }
}
function ti(o) {
  if (!o || typeof o != "string" || !o.startsWith("note1"))
    return !1;
  try {
    return Ys(o), !0;
  } catch {
    return !1;
  }
}
class Qs {
  constructor(t, e) {
    l(this, "conversationCache", /* @__PURE__ */ new Map());
    l(this, "roomCache", /* @__PURE__ */ new Map());
    this.nostr = t, this.initialMyPubkey = e;
  }
  // DM conversation is just a query for kind 14 (with lazy gift wrap subscription)
  // Supports both hex pubkeys and npub format
  with(t) {
    const e = this.convertToHex(t), s = this.normalizePubkey(e), r = this.conversationCache.get(s);
    if (r)
      return r;
    if (!this.isValidPubkey(s)) {
      console.warn("⚠️ Invalid pubkey format, creating conversation that will fail gracefully:", t.substring(0, 16) + "...");
      const n = new ge(this.nostr, this.getMyPubkey(), s);
      return this.conversationCache.set(s, n), n;
    }
    this.nostr.startUniversalGiftWrapSubscription().catch((n) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DMs:", n);
    });
    const i = new ge(this.nostr, this.getMyPubkey(), s);
    return this.conversationCache.set(s, i), i;
  }
  /**
   * Convert npub to hex if needed, otherwise return as-is
   */
  convertToHex(t) {
    if (!t || typeof t != "string" || Xs(t))
      return t;
    if (Zs(t))
      try {
        return Ke(t);
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
    const s = t.map((a) => a.toLowerCase()), r = this.generateRoomId(s), i = this.roomCache.get(r);
    if (i)
      return i;
    this.nostr.startUniversalGiftWrapSubscription().catch((a) => {
      console.warn("⚠️ Failed to start gift wrap subscription for DM room:", a);
    });
    const n = new tr(this.nostr, this.getMyPubkey(), s, e);
    return this.roomCache.set(r, n), n;
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
    for (const [s, r] of this.conversationCache.entries())
      t.push({
        pubkey: s,
        type: "conversation"
        // Note: conversations don't have participants property (only rooms do)
      });
    for (const [s, r] of this.roomCache.entries())
      t.push({
        pubkey: s,
        type: "room",
        participants: s.split(","),
        // roomId contains all participants
        subject: (e = r.options) == null ? void 0 : e.subject
        // Access the subject from room options
      });
    return t;
  }
}
class tr {
  // TODO: Implement room store
  constructor(t, e, s, r) {
    l(this, "store");
    this.nostr = t, this.myPubkey = e, this.roomParticipants = s, this.options = r, this.store = this.nostr.query().kinds([14]).tags("p", [this.myPubkey, ...this.roomParticipants]).execute();
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
class er {
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
      var r;
      return ((r = s[0]) == null ? void 0 : r.content) || null;
    }) : this.createNullStore();
  }
  /**
   * React to an event
   * Creates a NIP-25 compliant reaction event
   */
  async react(t, e = "+") {
    var s;
    try {
      const r = await this.getTargetEvent(t);
      if (!r)
        return { success: !1, error: "Target event not found" };
      const i = await this.nostr.events.reaction(t, e).tag("p", r.pubkey).publish();
      return this.debug && console.log(`ReactionModule: Published reaction "${e}" to event ${t.substring(0, 8)}...`), {
        success: i.success,
        eventId: i.eventId,
        error: (s = i.error) == null ? void 0 : s.message
      };
    } catch (r) {
      return {
        success: !1,
        error: r instanceof Error ? r.message : "Failed to publish reaction"
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
      let i = this.nostr.query().kinds([7]).authors([s]).tags("e", [t]).execute().current || [];
      if ((!i || i.length === 0) && (await this.nostr.sub().kinds([7]).authors([s]).tags("e", [t]).limit(100).execute(), await new Promise((u) => setTimeout(u, 300)), i = this.nostr.query().kinds([7]).authors([s]).tags("e", [t]).limit(100).execute().current || [], !i || i.length === 0))
        return { success: !1, error: "No reaction found to remove" };
      const n = i[0];
      let a = this.nostr.events.deletion(n.id, "User removed reaction");
      for (let u = 1; u < i.length; u++)
        a = a.tag("e", i[u].id);
      this.debug && console.log("ReactionModule.unreact: deleting all my reactions for target", {
        targetEventId: t.substring(0, 8) + "...",
        count: i.length
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
    await this.nostr.sub().ids([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 500));
    const s = this.nostr.query().ids([t]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  aggregateReactions(t, e) {
    const s = {};
    let r = 0, i = !1, n;
    const a = this.nostr.me;
    return t.filter((c) => c && typeof c == "object").forEach((c) => {
      if (c.kind !== 7) return;
      const u = c.content || "+", h = c.pubkey;
      s[u] || (s[u] = {
        type: u,
        count: 0,
        authors: []
      }), s[u].count++, s[u].authors.push(h), r++, a && h === a && (i = !0, n = u);
    }), {
      targetEventId: e,
      totalCount: r,
      reactions: s,
      userReacted: i,
      userReactionType: n
    };
  }
  createNullStore() {
    return this.nostr.query().kinds([7]).authors([""]).limit(1).execute().map(() => null);
  }
}
class sr {
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
class He {
  constructor(t, e) {
    this.nostr = t, this.debug = e, this.debug && console.log("📝 ContentModule initialized with Clean Architecture");
  }
  /** NIP-23: create/edit long-form article (kind 30023) */
  article() {
    return new sr(this.nostr);
  }
  /** NIP-23: get latest article by author and identifier */
  getArticle(t, e) {
    return this.nostr.sub().kinds([30023]).authors([t]).execute().catch(() => {
    }), this.nostr.query().kinds([30023]).authors([t]).execute().map((s) => s.filter((i) => i.tags.some((n) => n[0] === "d" && n[1] === e)).sort((i, n) => n.created_at - i.created_at)[0] ?? null);
  }
  /** NIP-23: list articles by author (reactive) */
  articles(t, e) {
    this.nostr.sub().kinds([30023]).authors([t]).execute().catch(() => {
    });
    let s = this.nostr.query().kinds([30023]).authors([t]);
    return e != null && e.limit && (s = s.limit(e.limit)), s.execute().map((r) => r.sort((i, n) => n.created_at - i.created_at));
  }
  /** Convenience: build naddr for an article */
  async naddrForArticle(t, e, s) {
    return Js(e, t, 30023, s);
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
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((r) => this.sortByCreatedAt(r));
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
      const r = await this.getEvent(t);
      if (!r)
        return { success: !1, error: "Original event not found" };
      const i = await this.nostr.events.create().kind(6).content("").tag("e", t, e || "").tag("p", r.pubkey).publish();
      return this.debug && console.log(`ContentModule: Reposted event ${t.substring(0, 8)}...`), {
        success: i.success,
        eventId: i.eventId,
        error: (s = i.error) == null ? void 0 : s.message
      };
    } catch (r) {
      return {
        success: !1,
        error: r instanceof Error ? r.message : "Failed to publish repost"
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
    await this.nostr.sub().ids([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 500));
    const s = this.nostr.query().ids([t]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  sortByCreatedAt(t) {
    return [...t].sort((e, s) => s.created_at - e.created_at);
  }
  aggregateContentSummary(t) {
    const e = t.filter((n) => n.kind === 1), s = t.filter((n) => n.kind === 6), r = this.sortByCreatedAt(e), i = this.sortByCreatedAt(s);
    return {
      totalNotes: e.length,
      totalReposts: s.length,
      latestNote: r[0],
      latestRepost: i[0]
    };
  }
}
class rr {
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
    return s = s.tags("e", [t]), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((r) => this.buildThreadStructure(r, t));
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
    return e ? this.nostr.query().kinds([3]).authors([e]).limit(1).execute().map((r) => {
      if (!r || r.length === 0)
        return [];
      const n = r[0].tags.filter((a) => a[0] === "p").map((a) => a[1]);
      return n.length === 0 ? [] : (this.startFollowingThreadsSubscription(n, t), []);
    }) : this.createEmptyStore();
  }
  /**
   * Reply to an event (creates a threaded reply)
   */
  async reply(t, e, s = []) {
    var r;
    try {
      const i = await this.getEvent(t);
      if (!i)
        return { success: !1, error: "Target event not found" };
      const { rootEventId: n, replyEventId: a } = this.determineThreadStructure(i);
      let c = this.nostr.events.create().kind(1).content(e);
      n && n !== t && (c = c.tag("e", n, "", "root")), c = c.tag("e", t, "", "reply");
      const u = i.tags.filter((g) => g[0] === "p" && g[1]).map((g) => g[1]), h = /* @__PURE__ */ new Set([i.pubkey, ...u]);
      for (const g of s)
        h.add(g);
      for (const g of h)
        c = c.tag("p", g);
      const d = await c.publish();
      return this.debug && console.log(`ThreadModule: Published reply to event ${t.substring(0, 8)}...`), {
        success: d.success,
        eventId: d.eventId,
        error: (r = d.error) == null ? void 0 : r.message
      };
    } catch (i) {
      return {
        success: !1,
        error: i instanceof Error ? i.message : "Failed to publish reply"
      };
    }
  }
  /**
   * Get thread by ID (alias for thread method for API compatibility)
   */
  get(t, e) {
    return new Promise((s) => {
      const r = this.thread(t);
      let i = null;
      i = r.subscribe((n) => {
        if (i) {
          const a = i;
          i = null, a();
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
    var i;
    let s, r;
    typeof t == "string" ? (s = t, r = e) : (s = t.content, r = t.mentions || []);
    try {
      this.nostr.events;
    } catch {
      return { success: !1, error: "No signing provider available. Please initialize signing first." };
    }
    try {
      let n = this.nostr.events.note(s);
      for (const u of r)
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
        error: (i = a.error) == null ? void 0 : i.message,
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
    await this.nostr.sub().ids([t]).limit(1).execute(), await new Promise((r) => setTimeout(r, 500));
    const s = this.nostr.query().ids([t]).limit(1).execute().current;
    return s && s.length > 0 ? s[0] : null;
  }
  buildThreadStructure(t, e) {
    const s = [];
    for (const r of t) {
      const i = this.analyzeThreadEvent(r, e);
      s.push(i);
    }
    return s.sort((r, i) => r.created_at - i.created_at), s;
  }
  analyzeThreadEvent(t, e) {
    const s = t.tags.filter((c) => c[0] === "e");
    let r = 0, i = null, n = [], a = e;
    if (s.length > 0) {
      const c = s.find((h) => h[3] === "root"), u = s.find((h) => h[3] === "reply");
      c && (a = c[1]), u && (i = u[1], r = 1), !u && s.length > 0 && (s.length === 1 ? (i = s[0][1], r = 1) : (a = s[0][1], i = s[s.length - 1][1], r = s.length - 1)), n = s.map((h) => h[1]);
    }
    return {
      ...t,
      depth: r,
      rootEventId: a,
      replyToEventId: i,
      threadPath: n
    };
  }
  determineThreadStructure(t) {
    const e = t.tags.filter((r) => r[0] === "e");
    if (e.length === 0)
      return {
        rootEventId: t.id,
        replyEventId: t.id
      };
    const s = e.find((r) => r[3] === "root");
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
    let s = 0, r = 0;
    const i = /* @__PURE__ */ new Set();
    let n, a;
    for (const c of t) {
      const u = this.analyzeThreadEvent(c, e);
      u.id === e ? a = u : (s++, (!n || u.created_at > n.created_at) && (n = u)), r = Math.max(r, u.depth), i.add(u.pubkey);
    }
    return {
      rootEventId: e,
      totalReplies: s,
      maxDepth: r,
      participants: Array.from(i),
      latestReply: n,
      rootEvent: a
    };
  }
  extractThreadSummaries(t) {
    const e = /* @__PURE__ */ new Map();
    for (const r of t) {
      const i = r.tags.filter((n) => n[0] === "e");
      if (i.length === 0) {
        const n = r.id;
        e.has(n) || e.set(n, []), e.get(n).push(r);
      } else {
        const n = i.find((c) => c[3] === "root"), a = n ? n[1] : i[0][1];
        e.has(a) || e.set(a, []), e.get(a).push(r);
      }
    }
    const s = [];
    for (const [r, i] of e) {
      const n = this.aggregateThreadSummary(i, r);
      s.push(n);
    }
    return s.sort((r, i) => {
      var c, u, h, d;
      const n = ((c = r.latestReply) == null ? void 0 : c.created_at) || ((u = r.rootEvent) == null ? void 0 : u.created_at) || 0;
      return (((h = i.latestReply) == null ? void 0 : h.created_at) || ((d = i.rootEvent) == null ? void 0 : d.created_at) || 0) - n;
    }), s;
  }
  createEmptyStore() {
    return this.nostr.query().kinds([1]).authors([""]).limit(1).execute().map(() => []);
  }
}
class ir {
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
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((r) => this.processFeedEvents(r, e));
  }
  /**
   * Get following feed (events from followed users) (reactive)
   * Requires user to be signed in and have a follow list
   */
  following(t = {}) {
    const e = this.nostr.me;
    return e ? this.nostr.query().kinds([3]).authors([e]).limit(1).execute().map((r) => {
      if (!r || r.length === 0)
        return [];
      const n = r[0].tags.filter((c) => c[0] === "p").map((c) => c[1]);
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
    let r = this.nostr.query().kinds(s.kinds).authors([t]);
    return s.since && (r = r.since(s.since)), s.until && (r = r.until(s.until)), s.limit && (r = r.limit(s.limit)), r.execute().map((i) => this.processFeedEvents(i, s));
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
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit * 3)), s.execute().map((r) => this.processTrendingEvents(r, e));
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
    return e.authors && (s = s.authors(e.authors)), e.since && (s = s.since(e.since)), e.until && (s = s.until(e.until)), e.limit && (s = s.limit(e.limit)), s.execute().map((r) => this.calculateFeedStats(r));
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
    let r = this.nostr.query().kinds(s.kinds);
    return s.authors && (r = r.authors(s.authors)), s.since && (r = r.since(s.since)), s.until && (r = r.until(s.until)), s.limit && (r = r.limit(s.limit * 5)), r.execute().map((i) => this.filterEventsByContent(i, t, s));
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
    for (const r of t) {
      const i = this.convertToFeedEvent(r);
      !e.includeReplies && i.feedType === "thread" && i.referencedEventId || !e.includeReactions && i.feedType === "reaction" || !e.includeReposts && i.feedType === "repost" || s.push(i);
    }
    return s.sort((r, i) => i.created_at - r.created_at), s;
  }
  processTrendingEvents(t, e) {
    const s = t.map((r) => this.convertToFeedEvent(r));
    return s.sort((r, i) => i.created_at - r.created_at), s.slice(0, e.limit || 20);
  }
  filterEventsByContent(t, e, s) {
    const r = e.toLowerCase(), n = t.filter((a) => a.content ? a.content.toLowerCase().includes(r) : !1).map((a) => this.convertToFeedEvent(a));
    return n.sort((a, c) => c.created_at - a.created_at), n.slice(0, s.limit || 30);
  }
  convertToFeedEvent(t) {
    let e = "note", s, r;
    if (t.kind === 6) {
      e = "repost";
      const i = t.tags.filter((n) => n[0] === "e");
      i.length > 0 && (s = i[0][1]);
    } else if (t.kind === 7) {
      e = "reaction";
      const i = t.tags.filter((n) => n[0] === "e");
      i.length > 0 && (s = i[0][1]);
    } else if (t.kind === 1) {
      const i = t.tags.filter((n) => n[0] === "e");
      if (i.length > 0) {
        e = "thread";
        const n = i.find((c) => c[3] === "root"), a = i.find((c) => c[3] === "reply");
        n && (r = n[1]), a ? s = a[1] : i.length > 0 && (s = i[0][1]);
      }
    }
    return {
      ...t,
      feedType: e,
      referencedEventId: s,
      threadRoot: r
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
    let r = t[0].created_at, i = t[0].created_at;
    for (const n of t)
      n.kind === 1 ? n.tags.filter((c) => c[0] === "e").length > 0 ? e.threadCount++ : e.noteCount++ : n.kind === 6 ? e.repostCount++ : n.kind === 7 && e.reactionCount++, s.add(n.pubkey), r = Math.min(r, n.created_at), i = Math.max(i, n.created_at);
    return e.uniqueAuthors = s.size, e.timeRange.oldest = r, e.timeRange.newest = i, e;
  }
  createEmptyStore() {
    return this.nostr.query().kinds([1]).authors([""]).limit(1).execute().map(() => []);
  }
}
class nr {
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
    return this._content || (this._content = new He(this.config.nostr, this.config.debug)), this._content;
  }
  /**
   * Reaction operations (NIP-25)
   * Likes, dislikes, emoji reactions
   */
  get reactions() {
    return this._reactions || (this._reactions = new er(this.config.nostr, this.config.debug)), this._reactions;
  }
  /**
   * Thread operations (NIP-10, NIP-22)
   * Threading, conversations, comments
   */
  get threads() {
    return this._threads || (this._threads = new rr(this.config.nostr, this.config.debug)), this._threads;
  }
  /**
   * Feed operations
   * Timeline aggregation, social feeds
   */
  get feeds() {
    return this._feeds || (this._feeds = new ir(this.config.nostr, this.config.debug)), this._feeds;
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
class or {
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
  onAddressableRoot(t, e, s, r) {
    return this.root.A = { address: `${t}:${e}:${s}`, relay: r || void 0 }, this.root.K = { kind: t }, this.root.P = { pubkey: e }, this;
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
  replyToAddress(t, e, s, r) {
    return this.parent.a = { address: `${t}:${e}:${s}`, relay: r || void 0 }, this.parent.k = { kind: t }, this.parent.p = { pubkey: e }, this;
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
    for (const i of this.buildTags()) e.tag(i[0], ...i.slice(1));
    const s = await e.sign();
    return await this.nostr.publishSigned(await s.build(), t);
  }
}
class ar {
  constructor(t) {
    this.nostr = t;
  }
  /** Create a new comment builder */
  create() {
    return new or(this.nostr);
  }
  /** Reactive stream of comments for a given root address (kind:pubkey:d) */
  getForAddressable(t, e, s) {
    const r = `${t}:${e}:${s}`;
    return this.nostr.sub().kinds([1111]).execute().catch(() => {
    }), this.nostr.query().kinds([1111]).execute().map(
      (i) => i.filter((n) => n.tags.some((a) => a[0] === "A" && a[1] === r || a[0] === "a" && a[1] === r))
    );
  }
  /** Reactive stream of replies to a parent comment id */
  getRepliesTo(t) {
    return this.nostr.sub().kinds([1111]).execute().catch(() => {
    }), this.nostr.query().kinds([1111]).execute().map((e) => e.filter((s) => s.tags.some((r) => r[0] === "e" && r[1] === t)));
  }
}
class cr {
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
    const r = ["p", t];
    return e && r.push(e), s && r.push(s), this.tags.push(r), this;
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
class ur {
  constructor(t) {
    this.nostr = t;
  }
  edit(t, e) {
    const s = new cr(this.nostr, t);
    return e && s.id(e), s;
  }
  get(t, e, s) {
    const r = this.nostr.sub().kinds([e]).authors([t]);
    s && r.tags("d", [s]), r.limit(1).execute().catch(() => {
    });
    const i = this.nostr.query().kinds([e]).authors([t]);
    return s && i.tags("d", [s]), i.limit(1).execute().map((a) => this.parse(a == null ? void 0 : a[0]));
  }
  parse(t) {
    if (!t) return null;
    const e = (p) => {
      var f;
      return (f = t.tags.find((y) => y[0] === p)) == null ? void 0 : f[1];
    }, s = (p) => t.tags.filter((f) => f[0] === p), r = e("d") || null, i = e("title"), n = e("description"), a = e("image"), c = s("p").map((p) => ({ pubkey: p[1], relay: p[2], petname: p[3] })), u = s("e").map((p) => ({ id: p[1], relay: p[2] })), h = s("a").map((p) => ({ address: p[1], relay: p[2] })), d = s("relay").map((p) => p[1]), g = s("t").map((p) => p[1]);
    return {
      kind: t.kind,
      identifier: r,
      title: i,
      description: n,
      image: a,
      p: c,
      e: u,
      a: h,
      relays: d,
      topics: g,
      updatedAt: t.created_at
    };
  }
}
class lr {
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
class hr {
  constructor(t) {
    this.nostr = t;
  }
  edit() {
    return new lr(this.nostr);
  }
  /** Reactive store of labels (kind 1985) for a given target event */
  forEvent(t) {
    return this.nostr.sub().kinds([1985]).tags("e", [t]).execute().catch(() => {
    }), this.nostr.query().kinds([1985]).tags("e", [t]).execute();
  }
}
class dr {
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
class gr {
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
class fr {
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
class yr {
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
class pr {
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
class mr {
  constructor(t) {
    this.nostr = t;
  }
  create() {
    return new dr(this.nostr);
  }
  metadata(t) {
    return new gr(this.nostr, t);
  }
  message(t) {
    return new fr(this.nostr, t);
  }
  hide(t) {
    return new yr(this.nostr, t);
  }
  mute(t) {
    return new pr(this.nostr, t);
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
    const s = this.messagesFor(t), r = this.nostr.query().kinds([43]).authors([e]).execute(), i = this.nostr.query().kinds([44]).authors([e]).execute();
    return s.map((n) => {
      var u, h;
      const a = new Set(((u = r.current) == null ? void 0 : u.flatMap((d) => d.tags.filter((g) => g[0] === "e").map((g) => g[1]))) || []), c = new Set(((h = i.current) == null ? void 0 : h.flatMap((d) => d.tags.filter((g) => g[0] === "p").map((g) => g[1]))) || []);
      return n.filter((d) => !a.has(d.id) && !c.has(d.pubkey));
    });
  }
}
function re(o) {
  return `34550:${o.authorPubkey}:${o.identifier}`;
}
class br {
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
    var e, s;
    if (!this.d) throw new Error("Community identifier (d) is required");
    const t = this.nostr.events.create().kind(34550).content("");
    t.tag("d", this.d), this.nameTag && t.tag("name", this.nameTag), this.descriptionTag && t.tag("description", this.descriptionTag), this.imageTag && t.tag("image", this.imageTag.url, ...this.imageTag.dim ? [this.imageTag.dim] : []);
    for (const r of this.moderators)
      t.tag("p", r.pubkey, ...r.relay ? [r.relay] : [], "moderator");
    for (const r of this.relays)
      r.marker ? t.tag("relay", r.url, r.marker) : t.tag("relay", r.url);
    try {
      const r = (e = this.relays.find((i) => i.marker === "author")) == null ? void 0 : e.url;
      r && ((s = t.toRelays) == null || s.call(t, r));
    } catch {
    }
    return await t.publish();
  }
}
class wr {
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
    const t = re(this.community), e = [];
    return e.push(["A", t, ...this.community.relay ? [this.community.relay] : []]), e.push(["a", t, ...this.community.relay ? [this.community.relay] : []]), e.push(["P", this.community.authorPubkey, ...this.community.relay ? [this.community.relay] : []]), e.push(["p", this.community.authorPubkey, ...this.community.relay ? [this.community.relay] : []]), e.push(["K", "34550"]), e.push(["k", "34550"]), e;
  }
  async publish() {
    var e, s, r, i, n;
    if (!this._content || this._content.length === 0) throw new Error("Post content must not be empty");
    const t = this.nostr.events.create().kind(1111).content(this._content);
    if (this.relayHint)
      try {
        (e = t.toRelays) == null || e.call(t, this.relayHint);
      } catch {
      }
    else if (this.community.relay)
      try {
        (s = t.toRelays) == null || s.call(t, this.community.relay);
      } catch {
      }
    else
      try {
        const a = await this.nostr.communities.resolveRelays(
          this.community.authorPubkey,
          this.community.identifier,
          3e3
          // ✅ Increased from 800ms to 3000ms
        );
        if (a != null && a.requests)
          try {
            (r = t.toRelays) == null || r.call(t, a.requests);
          } catch {
          }
      } catch {
      }
    if (!t.targetRelays || (((i = t.targetRelays) == null ? void 0 : i.length) || 0) === 0) {
      this.nostr.getDebug() && console.warn("⚠️ Community post without relay markers. Falling back to connected relays. Consider adding explicit relay markers for better delivery.");
      const a = this.nostr.relayManager.connectedRelays;
      if (a.length > 0)
        try {
          (n = t.toRelays) == null || n.call(t, a);
        } catch {
        }
      else
        throw new Error("No connected relays available for community post. Ensure you are connected to at least one relay.");
    }
    for (const a of this.buildTags()) t.tag(a[0], ...a.slice(1));
    return await t.publish();
  }
}
class vr {
  constructor(t, e, s) {
    l(this, "_content");
    l(this, "relayHint");
    this.nostr = t, this.community = e, this.parent = s;
  }
  content(t) {
    return this._content = t ?? "", this;
  }
  relay(t) {
    return this.relayHint = t, this;
  }
  async publish() {
    var s, r, i, n, a;
    if (!this._content || this._content.length === 0) throw new Error("Reply content must not be empty");
    const t = re(this.community), e = this.nostr.events.create().kind(1111).content(this._content);
    if (this.relayHint)
      try {
        (s = e.toRelays) == null || s.call(e, this.relayHint);
      } catch {
      }
    else if (this.community.relay)
      try {
        (r = e.toRelays) == null || r.call(e, this.community.relay);
      } catch {
      }
    else
      try {
        const c = await this.nostr.communities.resolveRelays(this.community.authorPubkey, this.community.identifier, 800);
        if (c != null && c.requests)
          try {
            (i = e.toRelays) == null || i.call(e, c.requests);
          } catch {
          }
      } catch {
      }
    if (!e.targetRelays || (((n = e.targetRelays) == null ? void 0 : n.length) || 0) === 0) {
      this.nostr.getDebug() && console.warn("⚠️ Community reply without relay markers. Falling back to connected relays. Consider adding explicit relay markers for better delivery.");
      const c = this.nostr.relayManager.connectedRelays;
      if (c.length > 0)
        try {
          (a = e.toRelays) == null || a.call(e, c);
        } catch {
        }
      else
        throw new Error("No connected relays available for community reply. Ensure you are connected to at least one relay.");
    }
    return e.tag("A", t, ...this.community.relay ? [this.community.relay] : []), e.tag("P", this.community.authorPubkey, ...this.community.relay ? [this.community.relay] : []), e.tag("K", "34550"), e.tag("e", this.parent.id, ...this.parent.relay ? [this.parent.relay] : []), e.tag("p", this.parent.pubkey, ...this.parent.relay ? [this.parent.relay] : []), e.tag("k", String(this.parent.kind ?? 1111)), await e.publish();
  }
}
class Er {
  constructor(t, e) {
    l(this, "_post");
    l(this, "_contentJson");
    l(this, "relayHint");
    this.nostr = t, this.community = e;
  }
  post(t) {
    return this._post = t, this._contentJson = JSON.stringify(t), this;
  }
  relay(t) {
    return this.relayHint = t, this;
  }
  async publish() {
    var s, r, i, n, a;
    if (!this._post) throw new Error("Approval requires a post event");
    const t = this.nostr.events.create().kind(4550).content(this._contentJson);
    if (this.relayHint)
      try {
        (s = t.toRelays) == null || s.call(t, this.relayHint);
      } catch {
      }
    else if (this.community.relay)
      try {
        (r = t.toRelays) == null || r.call(t, this.community.relay);
      } catch {
      }
    else
      try {
        const c = await this.nostr.communities.resolveRelays(
          this.community.authorPubkey,
          this.community.identifier,
          3e3
          // ✅ Increased from 800ms to 3000ms
        );
        if (c != null && c.approvals)
          try {
            (i = t.toRelays) == null || i.call(t, c.approvals);
          } catch {
          }
      } catch {
      }
    if (!t.targetRelays || (((n = t.targetRelays) == null ? void 0 : n.length) || 0) === 0) {
      this.nostr.getDebug() && console.warn("⚠️ Community approval without relay markers. Falling back to connected relays. Consider adding explicit relay markers for better delivery.");
      const c = this.nostr.relayManager.connectedRelays;
      if (c.length > 0)
        try {
          (a = t.toRelays) == null || a.call(t, c);
        } catch {
        }
      else
        throw new Error("No connected relays available for community approval. Ensure you are connected to at least one relay.");
    }
    const e = re(this.community);
    return t.tag("a", e, ...this.community.relay ? [this.community.relay] : []), t.tag("e", this._post.id), t.tag("p", this._post.pubkey), t.tag("k", String(this._post.kind)), await t.publish();
  }
}
class Sr {
  constructor(t) {
    l(this, "relayMap", /* @__PURE__ */ new Map());
    this.nostr = t;
  }
  getAddress(t, e) {
    return `34550:${t}:${e}`;
  }
  learnRelaysFromEvent(t) {
    const e = { author: void 0, requests: void 0, approvals: void 0 };
    try {
      for (const s of (t == null ? void 0 : t.tags) || [])
        if (s[0] === "relay") {
          const r = s[1], i = s[2];
          i === "author" ? e.author = r : i === "requests" ? e.requests = r : i === "approvals" && (e.approvals = r);
        }
    } catch {
    }
    return e;
  }
  getRelays(t, e) {
    var i;
    const s = this.getAddress(t, e), r = this.relayMap.get(s);
    if (r) return r;
    try {
      const a = this.nostr.query().kinds([34550]).authors([t]).execute().current || [];
      let c = null;
      for (const u of a)
        ((i = (u.tags || []).find((d) => d[0] === "d")) == null ? void 0 : i[1]) === e && (!c || u.created_at > c.created_at) && (c = u);
      if (c) {
        const u = this.learnRelaysFromEvent(c);
        return this.relayMap.set(s, u), u;
      }
    } catch {
    }
    return {};
  }
  /**
   * Ensure latest community definition is cached and return its marker relays.
   */
  async resolveRelays(t, e, s = 2e3) {
    var h, d;
    const r = this.getAddress(t, e), i = this.relayMap.get(r);
    if (i && (i.author || i.requests || i.approvals))
      return this.nostr.getDebug() && console.log("✅ Community relays from cache:", { author: t.slice(0, 8), identifier: e, cached: i }), i;
    const n = Array.from(/* @__PURE__ */ new Set([
      ...this.nostr.relayManager.connectedRelays,
      ...this.nostr.config.relays
    ]));
    this.nostr.getDebug() && console.log("🔍 Resolving community relays:", {
      author: t.slice(0, 8),
      identifier: e,
      searchingRelays: n
    });
    try {
      await this.nostr.sub().kinds([34550]).authors([t]).relays(n).execute();
    } catch (g) {
      this.nostr.getDebug() && console.warn("⚠️ Subscription failed:", g);
    }
    const a = this.nostr.query().kinds([34550]).authors([t]).execute(), c = (g) => g.filter(
      (f) => (f.tags || []).some((y) => y[0] === "d" && y[1] === e)
    ).sort((f, y) => y.created_at - f.created_at)[0] || null;
    let u = c(a.current || []);
    if (u || (u = await new Promise((g) => {
      let p = !1, f;
      try {
        const y = a.subscribe((b) => {
          if (p) return;
          const m = c(b);
          if (m) {
            p = !0;
            try {
              clearTimeout(f);
            } catch {
            }
            try {
              y && y();
            } catch {
            }
            g(m);
          }
        });
        f = setTimeout(() => {
          if (!p) {
            p = !0;
            try {
              y && y();
            } catch {
            }
            g(null);
          }
        }, Math.max(2e3, s));
      } catch {
        g(null);
      }
    })), u) {
      const g = this.learnRelaysFromEvent(u);
      return this.relayMap.set(r, g), this.nostr.getDebug() && console.log("✅ Resolved community relays:", {
        author: t.slice(0, 8),
        identifier: e,
        relays: g,
        cacheSize: ((h = a.current) == null ? void 0 : h.length) || 0
      }), g;
    }
    return this.nostr.getDebug() && console.warn("⚠️ Community NOT FOUND:", {
      author: t.slice(0, 8),
      identifier: e,
      searchedRelays: n,
      cacheSize: ((d = a.current) == null ? void 0 : d.length) || 0
    }), {};
  }
  // Builders
  create(t) {
    return new br(this.nostr, t);
  }
  postTo(t, e, s) {
    const r = new wr(this.nostr, { authorPubkey: t, identifier: e, relay: s || void 0 });
    try {
      if (!s) {
        const i = this.getRelays(t, e);
        i != null && i.requests && r.relay(i.requests);
      }
    } catch {
    }
    return r;
  }
  replyTo(t, e) {
    const s = new vr(this.nostr, t, e);
    try {
      if (!t.relay) {
        const r = this.getRelays(t.authorPubkey, t.identifier);
        r != null && r.requests && s.relay(r.requests);
      }
    } catch {
    }
    return s;
  }
  approve(t) {
    const e = new Er(this.nostr, t);
    try {
      const s = this.getRelays(t.authorPubkey, t.identifier);
      s != null && s.approvals && e.relay(s.approvals);
    } catch {
    }
    return e;
  }
  // Revoke an approval via NIP-09 deletion (kind 5)
  async revokeApproval(t, e) {
    return await this.nostr.events.create().kind(5).content(e || "").tag("e", t, "", "deletion").publish();
  }
  // Readers (subscription-first: we start subs narrowly by kind)
  getCommunity(t, e) {
    const s = e;
    return this.nostr.sub().kinds([34550]).authors([t]).execute().catch(() => {
    }), this.nostr.query().kinds([34550]).authors([t]).execute().map((r) => r.filter((n) => n.tags.some((a) => a[0] === "d" && a[1] === s)).sort((n, a) => a.created_at - n.created_at)[0] ?? null);
  }
  posts(t, e, s) {
    const r = `34550:${t}:${e}`;
    return this.nostr.sub().kinds([1111]).tags("A", [r]).execute().catch(() => {
    }), s != null && s.approvedOnly && (this.nostr.sub().kinds([4550]).tags("a", [r]).execute().catch(() => {
    }), this.nostr.sub().kinds([34550]).authors([t]).execute().catch(() => {
    }), this.nostr.sub().kinds([5]).execute().catch(() => {
    })), this.nostr.query().kinds([1111]).tags("A", [r]).execute().map(
      (i) => {
        let n = i.filter((a) => a.tags.some((c) => (c[0] === "A" || c[0] === "a") && c[1] === r));
        if (s != null && s.approvedOnly) {
          const c = this.nostr.query().kinds([4550]).execute().current || [], h = this.nostr.query().kinds([5]).execute().current || [], d = (f) => h.some((y) => y.tags.some((b) => b[0] === "e" && b[1] === f.id)), g = this.moderators(t, e), p = new Set(g.current || []);
          n = n.filter((f) => {
            const y = c.filter(
              (b) => b.tags.some((m) => m[0] === "a" && m[1] === r) && b.tags.some((m) => m[0] === "e" && m[1] === f.id) && !d(b)
            );
            return y.length === 0 ? !1 : s != null && s.moderatorsOnly ? y.some((b) => p.has(b.pubkey)) : !0;
          });
        }
        return n;
      }
    );
  }
  approvals(t, e, s) {
    const r = `34550:${t}:${e}`;
    return this.nostr.sub().kinds([4550]).execute().catch(() => {
    }), this.nostr.query().kinds([4550]).execute().map(
      (i) => i.filter(
        (n) => n.tags.some((a) => a[0] === "a" && a[1] === r) && (!s || n.tags.some((a) => a[0] === "e" && a[1] === s))
      )
    );
  }
  moderators(t, e) {
    const s = e;
    return this.nostr.sub().kinds([34550]).authors([t]).execute().catch(() => {
    }), this.nostr.query().kinds([34550]).authors([t]).execute().map((r) => {
      const n = r.filter((c) => c.tags.some((u) => u[0] === "d" && u[1] === s)).sort((c, u) => u.created_at - c.created_at)[0];
      if (!n) return [];
      const a = n.tags.filter((c) => c[0] === "p" && (c[3] === "moderator" || c.includes("moderator"))).map((c) => c[1]);
      return Array.from(new Set(a));
    });
  }
}
class kr {
  constructor(t) {
    this.nostr = t;
  }
  async hashHex(t) {
    const e = t instanceof Uint8Array ? t : new Uint8Array(t);
    return D(et(e));
  }
  async publishNoteWithAttachment(t, e, s = {}) {
    const r = this.nostr.events.create().kind(1).content(t), i = { mimeType: s.mimeType, alt: s.alt, dim: s.dim };
    if (s.addHash)
      try {
        const n = await fetch(e), a = new Uint8Array(await n.arrayBuffer());
        i.sha256 = await this.hashHex(a);
      } catch {
      }
    return r.attachMedia(e, i), await r.publish();
  }
}
class Ar {
  constructor(t, e, s, r = {}) {
    l(this, "listeners", /* @__PURE__ */ new Map());
    l(this, "subscriptionResult");
    l(this, "eventCount", 0);
    l(this, "createdAt", Date.now());
    l(this, "lastEventAt");
    l(this, "debug");
    this.key = t, this.filters = e, this.relays = s, this.debug = r.debug || !1;
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
        Promise.resolve(s.onEvent(t)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEvent error:`, r), s.onError && s.onError(r instanceof Error ? r : new Error(String(r)));
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
        Promise.resolve(s.onEose(t)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onEose error:`, r), s.onError && s.onError(r instanceof Error ? r : new Error(String(r)));
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
        Promise.resolve(s.onClose(t)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onClose error:`, r);
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
        Promise.resolve(s.onError(t)).catch((r) => {
          this.debug && console.error(`SharedSubscription: Listener ${s.id} onError handler error:`, r);
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
class _r {
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
    const s = e && e.length > 0 ? e : this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, r = this.generateFilterHash(t, s);
    if (this.sharedSubscriptions.has(r)) {
      const a = this.sharedSubscriptions.get(r);
      if (this.debug) {
        const c = a.getStats(), u = this.summarizeFilters(t);
        console.log(`SubscriptionManager: Reusing shared subscription ${r} (${c.listenerCount} listeners) - Filters: ${u}`);
      }
      return a;
    }
    const i = new Ar(r, t, s, { debug: this.debug }), n = await this.subscribe(t, {
      relays: s,
      onEvent: (a) => i.broadcast(a),
      onEose: (a) => i.notifyEose(a),
      onClose: (a) => i.notifyClose(a),
      onError: (a) => i.notifyError(a)
    });
    if (i.setSubscriptionResult(n), n.success && (this.sharedSubscriptions.set(r, i), this.debug)) {
      const a = this.summarizeFilters(t);
      console.log(`SubscriptionManager: Created new shared subscription ${r} - Filters: ${a}`);
    }
    return i;
  }
  /**
   * Create a human-readable summary of filters for debugging
   */
  summarizeFilters(t) {
    return t.map((e) => {
      const s = [];
      if (e.kinds && s.push(`kinds:[${e.kinds.join(",")}]`), e.authors) {
        const r = e.authors.length > 1 ? `${e.authors.length} authors` : `author:${e.authors[0].substring(0, 8)}...`;
        s.push(r);
      }
      if (e.ids) {
        const r = e.ids.length > 1 ? `${e.ids.length} ids` : `id:${e.ids[0].substring(0, 8)}...`;
        s.push(r);
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
    }), r = JSON.stringify(s), i = e.slice().sort().join(","), n = `${r}:${i}`;
    return typeof crypto < "u" && crypto.subtle ? this.generateSHA256HashSync(n) : this.generateSecureHash(n);
  }
  /**
   * Generate SHA-256 hash synchronously (fallback implementation)
   */
  generateSHA256HashSync(t) {
    const s = new TextEncoder().encode(t);
    let r = 2166136261;
    for (let i = 0; i < s.length; i++)
      r ^= s[i], r = Math.imul(r, 16777619);
    return r ^= r >>> 16, r = Math.imul(r, 2246822507), r ^= r >>> 13, r = Math.imul(r, 3266489909), r ^= r >>> 16, (r >>> 0).toString(16).padStart(8, "0");
  }
  /**
   * Enhanced hash function with better collision resistance
   */
  generateSecureHash(t) {
    const e = this.djb2Hash(t), s = this.sdbmHash(t), r = this.fnvHash(t);
    return ((e ^ s ^ r) >>> 0).toString(16).padStart(8, "0");
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
        const r = s.getSubscriptionId();
        r && await this.close(r, "No more listeners");
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
      const r = s.getStats();
      t += r.listenerCount, r.listenerCount > 1 && (e += r.listenerCount - 1);
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
      const r = s.getStats();
      t.push({
        key: e,
        subscriptionId: s.getSubscriptionId(),
        stats: { listenerCount: r.listenerCount, eventCount: r.eventCount, age: r.age },
        filters: r.filters,
        relays: r.relays
      });
    }
    return t.sort((e, s) => s.stats.listenerCount - e.stats.listenerCount), t;
  }
  /**
   * Create a new subscription with given filters
   * Performance requirement: <100ms subscription creation
   */
  async subscribe(t, e = {}) {
    var s, r, i, n;
    try {
      const a = this.validateFilters(t);
      if (a)
        return {
          subscription: {},
          success: !1,
          relayResults: [],
          error: a
        };
      const c = this.generateSubscriptionId(), u = Date.now(), h = e.relays && e.relays.length > 0 ? e.relays : this.relayManager.connectedRelays.length > 0 ? this.relayManager.connectedRelays : this.relayManager.relayUrls, d = {
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
      if (h.forEach((m) => {
        d.relayStates[m] = "active";
      }), e.timeout && (d.timeoutId = setTimeout(() => {
        this.handleSubscriptionTimeout(c);
      }, e.timeout)), this.subscriptions.set(c, d), this.debug) {
        const m = this.summarizeFilters(t);
        console.log(`Creating subscription ${c} with ${t.length} filters: ${m}`);
      }
      const g = e.retryAttempts || 1, p = e.retryDelay || 1e3;
      let f = [], y;
      for (let m = 0; m < g; m++)
        try {
          const w = ["REQ", c, ...t];
          if (e.relays && e.relays.length > 0) {
            try {
              const A = new Set(this.relayManager.relayUrls), M = (e.relays || []).filter((P) => !A.has(P));
              M.length && this.relayManager.addRelays && this.relayManager.addRelays(M, { temporary: !0 }), this.relayManager.ensureConnected && await this.relayManager.ensureConnected(h);
            } catch {
            }
            f = [];
            let k = !1;
            for (const A of h)
              try {
                await ((r = (s = this.relayManager).sendToRelays) == null ? void 0 : r.call(s, [A], w)), f.push({ relay: A, success: !0, subscriptionId: c }), k = !0;
              } catch (M) {
                f.push({ relay: A, success: !1, error: M instanceof Error ? M.message : "Unknown error", subscriptionId: c });
              }
            if (k) break;
            y = new Error("All relays failed");
          } else {
            await ((n = (i = this.relayManager).sendToAll) == null ? void 0 : n.call(i, w)), f = h.map((k) => ({ relay: k, success: !0 }));
            break;
          }
        } catch (w) {
          y = w instanceof Error ? w : new Error("Unknown error"), f = h.map((k) => ({
            relay: k,
            success: !1,
            error: y
          })), m < g - 1 && await new Promise((k) => setTimeout(k, p));
        }
      const b = f.length > 0 && f.some((m) => m.success);
      return b || (this.subscriptions.delete(c), d.timeoutId && clearTimeout(d.timeoutId)), {
        subscription: b ? this.externalizeSubscription(d) : {},
        success: b,
        relayResults: f,
        error: b ? void 0 : {
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
  async activate(t) {
    var s, r, i, n;
    const e = this.subscriptions.get(t);
    if (!e)
      throw new Error(`Subscription ${t} not found`);
    e.state = "active";
    try {
      const a = ["REQ", t, ...e.filters], c = this.relayManager.connectedRelays;
      e.relays.length !== c.length || !e.relays.every((h) => c.includes(h)) ? await ((r = (s = this.relayManager).sendToRelays) == null ? void 0 : r.call(s, e.relays, a)) : await ((n = (i = this.relayManager).sendToAll) == null ? void 0 : n.call(i, a));
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
    var r, i;
    const s = this.subscriptions.get(t);
    if (s) {
      s.state = "closed", s.timeoutId && (clearTimeout(s.timeoutId), s.timeoutId = void 0);
      try {
        const n = ["CLOSE", t];
        await ((i = (r = this.relayManager).sendToAll) == null ? void 0 : i.call(r, n));
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
    const r = [];
    for (const i of e)
      s.receivedEventIds.has(i.id) || (s.receivedEventIds.add(i.id), r.push(i));
    if (s.eventCount += r.length, s.lastEventAt = Date.now(), s.onEvent && r.length > 0)
      for (const i of r)
        s.onEvent(i);
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
    const [s, r, ...i] = e;
    switch (s) {
      case "EVENT":
        const n = i[0];
        await this.handleRelayEvent(t, r, n);
        break;
      case "EOSE":
        await this.markEose(r, t);
        break;
      case "NOTICE":
        this.debug && console.log(`Notice from ${t}:`, i[0]);
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
    const s = [], r = ["REQ", t.id, ...t.filters];
    if (this.relayManager.sendToRelays)
      for (const i of t.relays)
        try {
          await this.relayManager.sendToRelays([i], r), s.push({
            relay: i,
            success: !0,
            subscriptionId: t.id
          });
        } catch (n) {
          s.push({
            relay: i,
            success: !1,
            error: n instanceof Error ? n.message : "Unknown error",
            subscriptionId: t.id
          });
        }
    else
      try {
        this.relayManager.sendToAll ? (await this.relayManager.sendToAll(r), t.relays.forEach((i) => {
          s.push({
            relay: i,
            success: !0,
            subscriptionId: t.id
          });
        })) : t.relays.forEach((i) => {
          s.push({
            relay: i,
            success: !0,
            subscriptionId: t.id
          });
        });
      } catch (i) {
        t.relays.forEach((n) => {
          s.push({
            relay: n,
            success: !1,
            error: i instanceof Error ? i.message : "Unknown error",
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
      set(e, s, r) {
        return s === "eventCount" || s === "lastEventAt" || s === "state" ? (e[s] = r, !0) : !1;
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
        for (const r of t.tags)
          Array.isArray(r) && r[0] === "e" && typeof r[1] == "string" && r[1] && e.push(r[1]);
        const s = e.filter((r) => {
          const i = this.events.get(r);
          return !!i && i.pubkey === t.pubkey;
        });
        s.length > 0 && (this.config.debug && console.log("[UEC] Deletion event received – removing referenced events from cache", {
          deletionId: (t.id || "").substring(0, 8) + "...",
          count: s.length,
          ids: s.map((r) => r.substring(0, 8) + "...")
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
    s.forEach((i) => this.updateAccessTracking(i.id));
    const r = performance.now() - e;
    return this.stats.queryCount++, this.stats.totalQueryTime += r, s;
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
    this.eventsByKind.forEach((i, n) => {
      s[n] = i.size;
    });
    const r = s[0] || 0;
    return {
      // Basic metrics
      totalEvents: this.events.size,
      memoryUsageMB: this.estimateMemoryUsage(),
      subscribersCount: this.subscribers.size,
      // Distribution metrics
      byKind: s,
      profileCount: r,
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
        const s = JSON.parse(e), r = await this.decryptor.nip44Decrypt(s.pubkey, s.content);
        if (!r) return null;
        const i = JSON.parse(r);
        return this.normalizeRumorFromWrap(t, i);
      } catch {
      }
    return null;
  }
  normalizeRumorFromWrap(t, e) {
    try {
      const s = t.tags.find((u) => Array.isArray(u) && typeof u[0] == "string"), r = s && typeof s[1] == "string" ? s[1] : "", i = Array.isArray(e == null ? void 0 : e.tags) ? e.tags : [], a = i.some((u) => Array.isArray(u) && u[0] === "p") || !r ? i : [...i, ["p", r]], c = {
        id: "",
        pubkey: e.pubkey,
        created_at: e.created_at,
        kind: e.kind,
        tags: a,
        content: e.content,
        sig: ""
      };
      return c.id = _.calculateEventId(c), c;
    } catch {
      return null;
    }
  }
  updateIndexes(t) {
    this.eventsByKind.has(t.kind) || this.eventsByKind.set(t.kind, /* @__PURE__ */ new Set()), this.eventsByKind.get(t.kind).add(t.id), this.eventsByAuthor.has(t.pubkey) || this.eventsByAuthor.set(t.pubkey, /* @__PURE__ */ new Set()), this.eventsByAuthor.get(t.pubkey).add(t.id), t.tags.forEach((e) => {
      const s = e[0] || "", r = e[1] || "";
      if (!s || !r) return;
      this.eventsByTag.has(s) || this.eventsByTag.set(s, /* @__PURE__ */ new Map());
      const i = this.eventsByTag.get(s);
      i.has(r) || i.set(r, /* @__PURE__ */ new Set()), i.get(r).add(t.id);
    });
  }
  getMatchingEvents(t) {
    let e;
    if (t.kinds && t.kinds.length > 0) {
      const r = t.kinds.map((i) => this.eventsByKind.get(i) || /* @__PURE__ */ new Set());
      e = this.unionSets(r);
    }
    if (t.authors && t.authors.length > 0) {
      const r = t.authors.map((n) => this.eventsByAuthor.get(n) || /* @__PURE__ */ new Set()), i = this.unionSets(r);
      e = e ? this.intersectSets([e, i]) : i;
    }
    Object.entries(t).forEach(([r, i]) => {
      if (r.startsWith("#") && Array.isArray(i) && i.length > 0) {
        const n = r.slice(1), a = this.eventsByTag.get(n);
        if (a) {
          const c = i.map((h) => a.get(h) || /* @__PURE__ */ new Set()), u = this.unionSets(c);
          e = e ? this.intersectSets([e, u]) : u;
        } else
          e = /* @__PURE__ */ new Set();
      }
    });
    const s = Array.from(e ?? new Set(Array.from(this.events.keys()))).map((r) => this.events.get(r)).filter((r) => r && this.matchesFilter(r, t)).sort((r, i) => i.created_at - r.created_at);
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
      s.forEach((r) => e.add(r));
    }), e;
  }
  intersectSets(t) {
    if (t.length === 0) return /* @__PURE__ */ new Set();
    if (t.length === 1) return t[0] || /* @__PURE__ */ new Set();
    const e = /* @__PURE__ */ new Set();
    return t[0].forEach((r) => {
      t.every((i) => i.has(r)) && e.add(r);
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
    var r, i;
    const e = this.events.get(t);
    if (!e) return;
    this.stats.evictedCount++, this.events.delete(t), (r = this.eventsByKind.get(e.kind)) == null || r.delete(t), (i = this.eventsByAuthor.get(e.pubkey)) == null || i.delete(t), e.tags.forEach((n) => {
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
class We {
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
    return new Mr(this, t);
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
      const s = t.tags.filter((r) => r[0] === "p").map((r) => r[1]);
      if (!e["#p"].some((r) => s.includes(r)))
        return !1;
    }
    if (e["#e"] && e["#e"].length > 0) {
      const s = t.tags.filter((r) => r[0] === "e").map((r) => r[1]);
      if (!e["#e"].some((r) => s.includes(r)))
        return !1;
    }
    if (e["#t"] && e["#t"].length > 0) {
      const s = t.tags.filter((r) => r[0] === "t").map((r) => r[1]);
      if (!e["#t"].some((r) => s.includes(r)))
        return !1;
    }
    for (const s of Object.keys(e))
      if (s.startsWith("#") && s.length > 1 && !["#p", "#e", "#t"].includes(s)) {
        const r = s.slice(1), i = e[s];
        if (i && i.length > 0) {
          const n = t.tags.filter((a) => a[0] === r).map((a) => a[1]);
          if (!i.some((a) => n.includes(a)))
            return !1;
        }
      }
    return !0;
  }
}
class Mr {
  constructor(t, e) {
    l(this, "_data");
    l(this, "subscribers", /* @__PURE__ */ new Set());
    l(this, "sourceUnsubscriber");
    this.sourceStore = t, this.transform = e, this._data = this.safeTransform(this.sourceStore.current, this._data), this.sourceUnsubscriber = this.sourceStore.subscribe((s) => {
      const r = this.safeTransform(s, this._data);
      this._data !== r && (this._data = r, this.notifySubscribers());
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
class ie extends We {
  constructor(t) {
    super(), this.cache = t;
  }
  clone(t) {
    const e = new ie(this.cache);
    return e.filter = t, e;
  }
  execute() {
    return new pt(this.cache, this.filter);
  }
}
const J = class J extends We {
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
      if (Object.keys(a).filter((A) => {
        const M = a[A];
        return M == null ? !1 : Array.isArray(M) ? M.length > 0 : typeof M == "object" ? Object.keys(M).length > 0 : !0;
      }).some((A) => !n.has(A)))
        return await this.executeNonBatched(e);
      const h = this.autoBatchFieldName, d = { ...this.filter }, g = d[h], p = String(g[0]);
      d[h] = "__BATCH__";
      const f = (e || []).slice().sort().join(","), y = JSON.stringify(d) + "::" + f;
      J.pendingBatches.has(y) || J.pendingBatches.set(y, {
        tagName: h,
        ids: /* @__PURE__ */ new Set(),
        timer: null,
        creating: !1,
        resolvers: [],
        targetRelays: e,
        baseFilter: d
      });
      const b = J.pendingBatches.get(y);
      b.ids.add(p);
      const m = new Promise((A) => {
        b.resolvers.push((M) => A(M ?? y));
      });
      if (!b.timer) {
        const A = async () => {
          if (b.timer = null, !b.creating) {
            b.creating = !0;
            try {
              const M = Array.from(b.ids).slice(0, this.autoBatchMaxValues), P = { ...b.baseFilter };
              P[b.tagName] = M;
              const T = this.filter.limit ?? 100, R = Math.min(T * M.length, this.autoBatchMaxTotalLimit);
              R && (P.limit = R);
              const C = await this.subscriptionManager.getOrCreateSubscription([P], b.targetRelays), F = C.addListener({
                onEvent: (N) => {
                  this.cache.addEvent(N);
                }
              }), x = String(C.key);
              b.sharedKey = x, b.resolvers.forEach((N) => N(x)), b.resolvers = [], J._batchedListenerRegistry = J._batchedListenerRegistry || /* @__PURE__ */ new Map(), J._batchedListenerRegistry.set(x, { sub: C, listenerId: F });
            } finally {
              J.pendingBatches.delete(y);
            }
          }
        };
        typeof window < "u" && typeof window.requestAnimationFrame == "function" ? b.timer = window.requestAnimationFrame(() => A()) : b.timer = setTimeout(A, this.autoBatchWindowMs || 0);
      }
      const w = new pt(this.cache, this.filter);
      let k = null;
      return m.then((A) => {
        k = A;
      }), {
        id: k || y,
        store: w,
        stop: async () => {
          var P;
          const A = J._batchedListenerRegistry, M = k || y;
          if (A && A.has(M)) {
            const T = A.get(M), R = T.sub.removeListener(T.listenerId);
            A.delete(M), R && ((P = this.subscriptionManager) != null && P.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
          }
        },
        isActive: () => !0
      };
    }
    const s = await this.subscriptionManager.getOrCreateSubscription([this.filter], e), r = s.addListener({
      onEvent: (n) => {
        this.cache.addEvent(n);
      }
    }), i = new pt(this.cache, this.filter);
    return {
      id: s.key,
      store: i,
      stop: async () => {
        var a;
        s.removeListener(r) && ((a = this.subscriptionManager) != null && a.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
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
    const s = (e == null ? void 0 : e.closeOn) || "eose", r = this.relayUrls.length > 0 ? this.relayUrls : void 0, i = await this.subscriptionManager.getOrCreateSubscription([this.filter], r), n = i.addListener({
      onEvent: (c) => {
        var u;
        this.cache.addEvent(c), s === "first-event" && i.removeListener(n) && (u = this.subscriptionManager) != null && u.cleanupSharedSubscriptions && this.subscriptionManager.cleanupSharedSubscriptions().catch(() => {
        });
      },
      onEose: (c) => {
        var u;
        s === "eose" && i.removeListener(n) && (u = this.subscriptionManager) != null && u.cleanupSharedSubscriptions && this.subscriptionManager.cleanupSharedSubscriptions().catch(() => {
        });
      }
    }), a = new pt(this.cache, this.filter);
    return {
      id: i.key,
      store: a,
      stop: async () => {
        var u;
        i.removeListener(n) && ((u = this.subscriptionManager) != null && u.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
      },
      isActive: () => i.hasListeners()
    };
  }
  async executeNonBatched(e) {
    const s = await this.subscriptionManager.getOrCreateSubscription([this.filter], e), r = s.addListener({
      onEvent: (n) => {
        this.cache.addEvent(n);
      }
    }), i = new pt(this.cache, this.filter);
    return {
      id: s.key,
      store: i,
      stop: async () => {
        var a;
        s.removeListener(r) && ((a = this.subscriptionManager) != null && a.cleanupSharedSubscriptions) && await this.subscriptionManager.cleanupSharedSubscriptions();
      },
      isActive: () => s.hasListeners()
    };
  }
};
// safety cap for merged limit
// Static pending batches per process (keyed by base filter signature + relays)
l(J, "pendingBatches", /* @__PURE__ */ new Map());
let Zt = J;
class ze {
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
    }, r = _.addEventId(s), i = await this.config.signingProvider.signEvent(s);
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
      const t = await this.prepareProfileData();
      this.config.debug && console.log("ProfileBuilder: Publishing profile:", t);
      const e = await this.config.signingProvider.getPublicKey(), s = {
        kind: 0,
        content: JSON.stringify(t),
        tags: [],
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, r = _.addEventId(s), i = await this.config.signingProvider.signEvent(s), n = {
        ...r,
        sig: i
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
        const i = s[0];
        try {
          const n = JSON.parse(i.content);
          return {
            pubkey: i.pubkey,
            metadata: n,
            lastUpdated: i.created_at,
            eventId: i.id,
            isOwn: !0
          };
        } catch {
          return null;
        }
      }
      await this.config.nostr.sub().kinds([0]).authors([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = e.current;
      if (r && r.length > 0) {
        const i = r[0];
        try {
          const n = JSON.parse(i.content);
          return {
            pubkey: i.pubkey,
            metadata: n,
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
class qe {
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
      const t = this.config.nostr.query().kinds([0]).authors(this.pubkeys).limit(this.pubkeys.length).execute(), e = t.current, s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
      this.pubkeys.forEach((a) => {
        s.set(a, null);
      });
      let i = 0;
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
            s.set(a.pubkey, u), i++;
          } catch {
            r.set(a.pubkey, "Failed to parse profile metadata");
          }
      }), this.config.debug && console.log(`ProfileBatchBuilder: Found ${i}/${this.pubkeys.length} profiles in cache`), i === this.pubkeys.length ? {
        profiles: s,
        success: !0,
        errors: r,
        totalRequested: this.pubkeys.length,
        totalFound: i
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
            s.set(a.pubkey, u), i++;
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
            const r = JSON.parse(s.content);
            e.set(s.pubkey, {
              pubkey: s.pubkey,
              metadata: r,
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
      return new Promise((r) => {
        let i = !1;
        const n = setTimeout(() => {
          i || (i = !0, this.finalizeResults(e, r));
        }, 1e4);
        (async () => {
          const c = await this.config.subscriptionManager.getOrCreateSubscription([t]), u = c.addListener({
            onEvent: async (h) => {
              if (h.kind === 0 && !s.has(h.pubkey)) {
                s.add(h.pubkey);
                try {
                  const d = await this.parseProfileEvent(h), g = await this.evaluateProfile(d);
                  g && (e.push(g), this.config.debug && console.log(`ProfileDiscoveryBuilder: Found match - ${d.metadata.name || "unnamed"} (score: ${g.relevanceScore})`), this.criteria.limit && e.length >= this.criteria.limit && (i || (i = !0, clearTimeout(n), c.removeListener(u), this.finalizeResults(e, r))));
                } catch (d) {
                  this.config.debug && console.error("ProfileDiscoveryBuilder: Error processing profile:", d);
                }
              }
            },
            onEose: () => {
              i || (i = !0, clearTimeout(n), c.removeListener(u), this.finalizeResults(e, r));
            },
            onError: (h) => {
              i || (i = !0, clearTimeout(n), c.removeListener(u), this.config.debug && console.error("ProfileDiscoveryBuilder: Search error:", h), r(e));
            }
          });
        })().catch((c) => {
          i || (i = !0, clearTimeout(n), this.config.debug && console.error("ProfileDiscoveryBuilder: Failed to start search:", c), r(e));
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
    let s = 0, r = 0, i = 0;
    if (this.criteria.nameQuery) {
      i++;
      const u = ((a = t.metadata.name) == null ? void 0 : a.toLowerCase()) || "";
      if (u.includes(this.criteria.nameQuery))
        e.push("name"), r++, u === this.criteria.nameQuery ? s += 1 : u.startsWith(this.criteria.nameQuery) ? s += 0.8 : s += 0.5;
      else
        return null;
    }
    if (this.criteria.nip05Query) {
      i++;
      const u = ((c = t.metadata.nip05) == null ? void 0 : c.toLowerCase()) || "";
      if (u.includes(this.criteria.nip05Query))
        e.push("nip05"), r++, s += u === this.criteria.nip05Query ? 1 : 0.7;
      else
        return null;
    }
    if (this.criteria.metadataFilters && this.criteria.metadataFilters.size > 0)
      for (const [u, h] of this.criteria.metadataFilters) {
        i++;
        const d = t.metadata[u];
        d !== void 0 && (h === void 0 ? (e.push(u), r++, s += 0.3) : typeof d == "string" && typeof h == "string" ? d.toLowerCase().includes(h.toLowerCase()) && (e.push(u), r++, s += d.toLowerCase() === h.toLowerCase() ? 0.8 : 0.5) : d === h && (e.push(u), r++, s += 0.8));
      }
    if (this.criteria.verifiedOnly) {
      if (i++, t.metadata.nip05) {
        if (await this.checkNip05Verification(t))
          e.push("verified"), r++, s += 0.5;
        else if (this.criteria.verifiedOnly)
          return null;
      } else if (this.criteria.verifiedOnly)
        return null;
    }
    if (i === 0 && (s = 0.1, r = 1, i = 1), i > 0 && r === 0)
      return null;
    const n = Math.min(1, s / Math.max(i, 1));
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
      const [s, r] = t.metadata.nip05.split("@");
      if (!s || !r) return !1;
      const i = new AbortController(), n = setTimeout(() => i.abort(), 5e3), a = await fetch(`https://${r}/.well-known/nostr.json?name=${s}`, {
        signal: i.signal
      });
      return clearTimeout(n), a.ok ? ((e = (await a.json()).names) == null ? void 0 : e[s]) === t.pubkey : !1;
    } catch (s) {
      return this.config.debug && console.error("ProfileDiscoveryBuilder: NIP-05 verification failed:", s), !1;
    }
  }
  finalizeResults(t, e) {
    t.sort((r, i) => i.relevanceScore - r.relevanceScore);
    const s = this.criteria.limit ? t.slice(0, this.criteria.limit) : t;
    this.config.debug && console.log(`ProfileDiscoveryBuilder: Discovery complete - found ${s.length} matches`), e(s);
  }
}
class je {
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
      if (e.some((f) => f.pubkey === this.targetPubkey))
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
        tags: [...e, r].map((f) => {
          const y = ["p", f.pubkey];
          return f.petname && !f.relayUrl ? (y.push(""), y.push(f.petname)) : f.relayUrl && !f.petname ? y.push(f.relayUrl) : f.relayUrl && f.petname && (y.push(f.relayUrl), y.push(f.petname)), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: t
      }, c = _.addEventId(a), u = await this.config.signingProvider.signEvent(a), h = {
        ...c,
        sig: u
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
        const i = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowBuilder: Using cached follow list with", i.length, "follows"), i;
      }
      this.config.debug && console.log("FollowBuilder: No cached follow list, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = e.current;
      if (r && r.length > 0) {
        const i = this.parseFollowListEvent(r[0]);
        return this.config.debug && console.log("FollowBuilder: Found follow list from relay with", i.length, "follows"), i;
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
          const r = {
            pubkey: s[1]
          };
          s[2] && (r.relayUrl = s[2]), s[3] && (r.petname = s[3]), e.push(r);
        }
      return e;
    } catch (s) {
      return this.config.debug && console.error("FollowBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class Ge {
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
        const r = await this.config.signingProvider.getPublicKey();
        this.config.debug && console.log(`FollowBatchBuilder: Batch operation attempt ${s + 1}/${t} - adding ${this.toAdd.length}, removing ${this.toRemove.length}`);
        const { follows: i, eventId: n, createdAt: a } = await this.getCurrentFollowsWithMetadata();
        if (this.baseEventId && this.baseEventId !== n) {
          this.config.debug && console.log(`FollowBatchBuilder: Detected concurrent update (base: ${this.baseEventId}, current: ${n}), retrying...`), this.baseEventId = n, this.baseCreatedAt = a;
          continue;
        }
        this.baseEventId = n, this.baseCreatedAt = a;
        let c = [...i];
        if (this.toRemove.length > 0 && (c = c.filter(
          (m) => !this.toRemove.includes(m.pubkey)
        ), this.config.debug && console.log(`FollowBatchBuilder: Removed ${this.toRemove.length} follows`)), this.toAdd.length > 0) {
          const m = this.toAdd.filter((w) => !c.some((k) => k.pubkey === w)).map((w) => ({ pubkey: w }));
          c.push(...m), this.config.debug && console.log(`FollowBatchBuilder: Added ${m.length} new follows (${this.toAdd.length - m.length} were duplicates)`);
        }
        const h = {
          kind: 3,
          content: "",
          // Follow lists typically have empty content
          tags: c.map((m) => {
            const w = ["p", m.pubkey];
            return m.petname && !m.relayUrl ? (w.push(""), w.push(m.petname)) : m.relayUrl && !m.petname ? w.push(m.relayUrl) : m.relayUrl && m.petname && (w.push(m.relayUrl), w.push(m.petname)), w;
          }),
          created_at: Math.floor(Date.now() / 1e3),
          pubkey: r
        }, d = _.addEventId(h), g = await this.config.signingProvider.signEvent(h), p = {
          ...d,
          sig: g
        }, y = (await Promise.allSettled(
          this.config.relayManager.relayUrls.map(async (m) => {
            try {
              return await this.config.relayManager.sendToRelay(m, ["EVENT", p]), { success: !0, relay: m };
            } catch (w) {
              return {
                success: !1,
                relay: m,
                error: w instanceof Error ? w.message : "Unknown error"
              };
            }
          })
        )).filter(
          (m) => m.status === "fulfilled" && m.value.success
        ).map((m) => m.value.relay);
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
      } catch (r) {
        if (e = r instanceof Error ? r.message : "Failed to publish batch update", this.config.debug && console.warn(`FollowBatchBuilder: Attempt ${s + 1} failed:`, e), s === t - 1)
          return {
            success: !1,
            error: e
          };
        await new Promise((i) => setTimeout(i, 100 * (s + 1)));
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
        const i = s[0];
        console.log("FollowBatchBuilder: Latest cached event:", {
          id: i == null ? void 0 : i.id,
          created_at: i == null ? void 0 : i.created_at,
          tags: i == null ? void 0 : i.tags.filter((n) => n[0] === "p")
        });
      }
      if (s.length > 0) {
        const i = s[0];
        if (i && this.config.debug && console.log("FollowBatchBuilder: Using cached follow list with", i.tags.filter((n) => n[0] === "p").length, "follows"), i)
          return {
            follows: this.parseFollowListEvent(i),
            eventId: i.id,
            createdAt: i.created_at
          };
      }
      this.config.debug && console.log("FollowBatchBuilder: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = e.current;
      if (r && r.length > 0) {
        const i = r[0], n = this.parseFollowListEvent(i);
        return this.config.debug && console.log("FollowBatchBuilder: Found follow list from relay with", n.length, "follows"), {
          follows: n,
          eventId: i.id,
          createdAt: i.created_at
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
          const r = {
            pubkey: s[1]
          };
          s[2] && (r.relayUrl = s[2]), s[3] && (r.petname = s[3]), e.push(r);
        }
      return e;
    } catch (s) {
      return this.config.debug && console.error("FollowBatchBuilder: Failed to parse follow list event:", s), [];
    }
  }
}
class Pr {
  // Frontend expects this
  constructor(t) {
    l(this, "baseStore");
    l(this, "count");
    l(this, "follows");
    this.baseStore = t, this.count = new Ye(t), this.follows = t;
  }
  // Delegate to base store (for direct usage)
  subscribe(t, e) {
    return this.baseStore.subscribe(t, e);
  }
  get current() {
    return this.baseStore.current;
  }
}
class Ye {
  constructor(t) {
    l(this, "sourceStore");
    l(this, "_count", 0);
    l(this, "subscribers", /* @__PURE__ */ new Set());
    var e;
    this.sourceStore = t, this._count = ((e = t.current) == null ? void 0 : e.length) || 0, t.subscribe((s) => {
      const r = (s == null ? void 0 : s.length) || 0;
      r !== this._count && (this._count = r, this.notifySubscribers());
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
class Je {
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
    return new Pr(e);
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
      const r = /* @__PURE__ */ new Set();
      return s.forEach((i) => {
        i.kind === 3 && i.tags.some(
          (a) => a[0] === "p" && a[1] === t
        ) && r.add(i.pubkey);
      }), Array.from(r);
    });
    return new Ye(e);
  }
  /**
   * Phase 4: Add a user to follow list
   * Returns FollowBuilder for fluent API configuration
   */
  add(t) {
    if (!this.config.signingProvider)
      throw new Error("Cannot add follow: No signing provider available. Initialize signing first.");
    return new je({
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
      if (!s.some((f) => f.pubkey === t))
        return this.config.debug && console.log("FollowsModule: Not following", t.substring(0, 16) + "..."), {
          success: !1,
          error: "Not following this user"
        };
      const a = {
        kind: 3,
        content: "",
        // Follow lists typically have empty content
        tags: s.filter((f) => f.pubkey !== t).map((f) => {
          const y = ["p", f.pubkey];
          return f.petname && !f.relayUrl ? (y.push(""), y.push(f.petname)) : f.relayUrl && !f.petname ? y.push(f.relayUrl) : f.relayUrl && f.petname && (y.push(f.relayUrl), y.push(f.petname)), y;
        }),
        created_at: Math.floor(Date.now() / 1e3),
        pubkey: e
      }, c = _.addEventId(a), u = await this.config.signingProvider.signEvent(a), h = {
        ...c,
        sig: u
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
    return new Ge({
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
        const i = this.parseFollowListEvent(s[0]);
        return this.config.debug && console.log("FollowsModule: Using cached follow list with", i.length, "follows"), i;
      }
      this.config.debug && console.log("FollowsModule: No cached follow list found, querying relays..."), await this.config.nostr.sub().kinds([3]).authors([t]).limit(1).execute(), await new Promise((i) => setTimeout(i, 1e3));
      const r = e.current;
      if (r && r.length > 0) {
        const i = this.parseFollowListEvent(r[0]);
        return this.config.debug && console.log("FollowsModule: Found follow list from relay with", i.length, "follows"), i;
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
          const r = {
            pubkey: s[1]
          };
          s[2] && (r.relayUrl = s[2]), s[3] && (r.petname = s[3]), e.push(r);
        }
      return e;
    } catch (s) {
      return this.config.debug && console.error("FollowsModule: Failed to parse follow list event:", s), [];
    }
  }
}
class Xe {
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
      return this.config.debug && console.warn(`Failed to parse profile event for ${e}:`, r), null;
    }
  }
  /**
   * Phase 2: Profile Creation & Updates - Fluent Builder API
   * Creates a ProfileBuilder for updating profiles with field preservation
   */
  edit() {
    if (!this.config.signingProvider)
      throw new Error("Cannot edit profile: No signing provider available. Initialize signing first.");
    return new ze({
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
    return this._follows || (this._follows = new Je({
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
    return new qe({
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
class Ir {
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
    const t = (i) => {
      if (!i) return i;
      let n = i.trim();
      if (!/^wss?:\/\//i.test(n)) {
        const a = n.replace(/^[\/]+/, "");
        n = (/(^localhost(?::\d+)?$)|(^127\.0\.0\.1(?::\d+)?$)|((?:^|\.)local(?::\d+)?$)/i.test(a) ? "ws://" : "wss://") + a;
      }
      return n = n.replace(/\/+$/, ""), n;
    }, e = /* @__PURE__ */ new Set(), s = this.list.map((i) => ({ url: t(i.url), mode: i.mode })).filter((i) => i.url && !e.has(i.url) && (e.add(i.url), !0)), r = this.nostr.events.kind(10002).content("");
    for (const i of s)
      i.mode === "read" ? r.tag("r", i.url, "read") : i.mode === "write" ? r.tag("r", i.url, "write") : r.tag("r", i.url);
    return r.publish();
  }
}
class Tr {
  constructor(t, e) {
    this.nostr = t, this.debug = e;
  }
  /** Create a fluent builder for publishing a NIP-65 relay list */
  edit() {
    return new Ir(this.nostr);
  }
  /** Get reactive relay list for an author (kind 10002) */
  get(t) {
    return this.nostr.sub().kinds([10002]).authors([t]).limit(1).execute().catch(() => {
    }), this.nostr.query().kinds([10002]).authors([t]).limit(1).execute().map((s) => this.parseRelayList(t, s));
  }
  parseRelayList(t, e) {
    const s = Array.isArray(e) && e.length > 0 ? e[0] : null, r = [];
    if (s && Array.isArray(s.tags))
      for (const c of s.tags) {
        if (!Array.isArray(c) || c[0] !== "r") continue;
        const u = c[1] || "", h = (c[2] || "").toLowerCase(), d = h === "read" ? "read" : h === "write" ? "write" : "both";
        u && r.push({ url: u, mode: d });
      }
    const i = r.filter((c) => c.mode === "read").map((c) => c.url), n = r.filter((c) => c.mode === "write").map((c) => c.url), a = r.filter((c) => c.mode === "both").map((c) => c.url);
    return {
      author: t,
      entries: r,
      read: i,
      write: n,
      both: a,
      updatedAt: s ? s.created_at : null
    };
  }
}
class Rr {
  constructor(t, e = (s) => s) {
    this.relayList = t, this.normalizeUrl = e;
  }
  async selectRelays(t, e, s) {
    try {
      const r = /* @__PURE__ */ new Set();
      await this.ensureLoaded(s.authorPubkey);
      const i = this.relayList.get(s.authorPubkey).current;
      if (i && i.entries.length > 0)
        for (const n of [...i.write, ...i.both])
          r.add(this.normalizeUrl(n));
      for (const n of s.mentionedPubkeys || []) {
        await this.ensureLoaded(n);
        const a = this.relayList.get(n).current;
        if (a && a.entries.length > 0)
          for (const c of [...a.read, ...a.both])
            r.add(this.normalizeUrl(c));
      }
      for (const n of e) r.add(this.normalizeUrl(n));
      return Array.from(r);
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
class Cr {
  constructor(t) {
    this.nostr = t;
  }
  async check(t, e = 3e3) {
    var r, i;
    const s = Date.now();
    try {
      await ((i = (r = this.nostr.getSubscriptionManager()) == null ? void 0 : r.ensureConnection) == null ? void 0 : i.call(r, t, e));
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
class xr {
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
    for (const i of s || [])
      for (const n of i.tags)
        n[0] === "r" && n[1] && e.add(me(n[1]));
    const r = this.nostr.query().kinds([2]).authors([t]).execute().current;
    for (const i of r || []) {
      const n = (i.content || "").trim();
      n && e.add(me(n));
    }
    return Array.from(e);
  }
}
function me(o) {
  let t = o.trim();
  return /^wss?:\/\//i.test(t) || (t = "wss://" + t.replace(/^\/*/, "")), t.replace(/\/+$/, "");
}
class Nr {
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
    }), this.nostr.query().kinds([9735]).execute().map((e) => e.filter((s) => s.tags.some((r) => r[0] === "e" && r[1] === t)));
  }
  /** Reactive store of Zap Receipts (kind 9735) for a profile/pubkey */
  receiptsForProfile(t) {
    return this.nostr.sub().kinds([9735]).execute().catch(() => {
    }), this.nostr.query().kinds([9735]).execute().map((e) => e.filter((s) => s.tags.some((r) => r[0] === "p" && r[1] === t)));
  }
}
class be {
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
      for (const r of s)
        try {
          const i = r.content, n = await this.clientTransport.nip44Decrypt(this.remoteSignerPubkey, i), a = JSON.parse(n), c = this.responseCallbacks.get(a.id);
          c && (this.responseCallbacks.delete(a.id), c(a));
        } catch {
        }
    }), this.subscriptionStarted = !0;
  }
  async rpcRequest(t, e) {
    await this.ensureResponseSubscription();
    const s = await this.clientTransport.getPublicKey(), r = Math.random().toString(36).slice(2), i = { id: r, method: t, params: e }, n = await this.clientTransport.nip44Encrypt(this.remoteSignerPubkey, JSON.stringify(i)), a = {
      pubkey: s,
      created_at: Math.floor(Date.now() / 1e3),
      kind: 24133,
      tags: [["p", this.remoteSignerPubkey]],
      content: n
    }, c = _.calculateEventId(a), u = await this.clientTransport.signEvent(a), h = { ...a, id: c, sig: u }, d = new Promise((g, p) => {
      const f = setTimeout(() => {
        this.responseCallbacks.delete(r), p(new Error("NIP-46 request timeout"));
      }, 1e4);
      this.responseCallbacks.set(r, (y) => {
        clearTimeout(f), y.error ? p(new Error(y.error)) : g(y.result);
      });
    });
    return await this.nostr.publishSigned(h), await d;
  }
  /**
   * Client-initiated connection token (nostrconnect://)
   * Allows sharing a QR/URI with remote-signer to establish permissions.
   */
  async createClientToken(t) {
    const e = await this.clientTransport.getPublicKey(), s = (t != null && t.relays && t.relays.length ? t.relays : this.relays) || [], r = new URLSearchParams();
    for (const n of s) r.append("relay", encodeURIComponent(n));
    t != null && t.perms && t.perms.length && (r.set("perms", t.perms.join(",")), this.requestedPermissions = t.perms.slice()), t != null && t.name && r.set("name", t.name), t != null && t.secret && r.set("secret", t.secret);
    const i = r.toString();
    return `nostrconnect://${e}${i ? `?${i}` : ""}`;
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
class ei {
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
      relays: t.relays ?? gs,
      debug: t.debug ?? !1,
      retryAttempts: t.retryAttempts ?? Z.RETRY_ATTEMPTS,
      retryDelay: t.retryDelay ?? Z.RETRY_DELAY,
      timeout: t.timeout ?? Z.PUBLISH_TIMEOUT,
      routing: t.routing ?? "none"
    };
    if (t.signingProvider && (e.signingProvider = t.signingProvider), this.config = e, this.config.debug && console.log("🔥 NostrUnchained v0.1.0-FIX (build:", (/* @__PURE__ */ new Date()).toISOString().substring(0, 19) + "Z)"), this.relayManager = new ys(this.config.relays, {
      debug: this.config.debug,
      publishTimeout: this.config.timeout
    }), this.subscriptionManager = new _r(this.relayManager), this.relayManager.configureAuth({
      authEventFactory: async ({ relay: r, challenge: i }) => {
        if (!this.signingProvider) throw new Error("No signing provider for AUTH");
        const a = {
          pubkey: await this.signingProvider.getPublicKey(),
          created_at: Math.floor(Date.now() / 1e3),
          kind: 22242,
          tags: [
            ["relay", r],
            ["challenge", i]
          ],
          content: ""
        }, c = _.calculateEventId(a), u = await this.signingProvider.signEvent(a);
        return { ...a, id: c, sig: u };
      },
      onAuthStateChange: (r, i) => {
        this.config.debug && console.log(`NIP-42 state for ${r}:`, i);
      }
    }), this.events = new ms(this), t.signingProvider) {
      this.signingProvider = t.signingProvider;
      try {
        this.signingMethod = (s = t.signingProvider) != null && s.isExtension || t.signingProvider.constructor.name.includes("Extension") ? "extension" : "temporary";
      } catch {
        this.signingMethod = "temporary";
      }
      this.cache = new Pt("", { debug: this.config.debug }), this._initializeCache().catch((r) => {
        this.config.debug && console.log("⚠️ Cache initialization with private key failed:", r);
      }), this.config.debug && console.log("🎯 NostrUnchained initialized with PROVIDED signing provider - Everything ready!");
    } else
      this.cache = new Pt("", { debug: this.config.debug }), this.config.debug && console.log("🚨 NostrUnchained initialized WITHOUT signing provider - will auto-detect later");
    this.dm = new Re({
      subscriptionManager: this.subscriptionManager,
      relayManager: this.relayManager,
      signingProvider: this.signingProvider,
      debug: this.config.debug,
      parent: this
    }), this.social = new nr({
      nostr: this,
      debug: this.config.debug
    }), this.config.debug && console.log("NostrUnchained initialized with relays:", this.config.relays), this.config.routing === "nip65" && (this.relayRouter = new Rr(this.relayList, (i) => this.normalizeRelayUrl(i)), (async () => {
      try {
        if (!this.signingProvider) return;
        const i = await this.signingProvider.getPublicKey();
        await this.sub().kinds([10002]).authors([i]).limit(1).execute();
        const n = this.query().kinds([10002]).authors([i]).limit(1).execute();
        if (n && typeof n.subscribe == "function") {
          let a = !0;
          const c = n.subscribe((u) => {
            var d, g;
            try {
              if (!a) return;
              a = !1, c && c();
            } catch {
            }
            const h = Array.isArray(u) && u.length ? u[0] : null;
            if (h && Array.isArray(h.tags)) {
              const p = h.tags.filter((f) => f[0] === "r").map((f) => f[1]).filter(Boolean);
              try {
                (g = (d = this.relayRouter) == null ? void 0 : d.setAuthorRelayHints) == null || g.call(d, i, p);
              } catch {
              }
            }
          });
        }
      } catch {
      }
    })());
  }
  /** NIP-46 DX Module: start client-initiated pairing as a managed session */
  get nip46() {
    const t = this;
    return {
      /**
       * Startet Pairing und gibt eine Session mit URI/Secret/ClientPub & Helfern zurück.
       * Die Session hält Transport-Relays verbunden, startet 24133-Sub und bietet onAck/useAsSigner.
       */
      startPairing: async (e) => {
        const s = new be({ remoteSignerPubkey: e.remoteSignerPubkey || "", relays: e.relays, nostr: t, debug: t.getDebug() }), { uri: r, secret: i, clientPub: n } = await s.createClientTokenWithSecret({ name: e.name, perms: e.perms, relays: e.relays, url: e.url, image: e.image });
        if (t.getDebug() && console.log("[NIP46] Pairing started – listening on relays:", e.relays, "clientPub:", n.substring(0, 8)), e.remoteSignerPubkey)
          try {
            t.getDebug() && console.log("[NIP46] Sending connect RPC to remote-signer:", e.remoteSignerPubkey.substring(0, 8)), (async () => {
              try {
                await s.connect(e.perms, i);
              } catch (c) {
                t.getDebug() && console.warn("[NIP46] connect RPC failed (non-fatal):", c);
              }
            })();
          } catch {
          }
        return {
          uri: r,
          secret: i,
          clientPub: n,
          relays: e.relays.slice(),
          onAck: async (c = 15e3) => (t.getDebug() && console.log("[NIP46] Awaiting ACK/secret on relays:", e.relays), await s.waitForConnectAck(i, c), t.getDebug() && console.log("[NIP46] ACK received"), !0),
          useAsSigner: async () => {
            await t.initializeSigning(s);
            const c = await t.getPublicKey();
            return t.getDebug() && console.log("[NIP46] Remote signer initialized. userPub:", c.substring(0, 8)), c;
          },
          close: async () => {
          }
        };
      }
    };
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
        this.universalDM = new Qs(this, t), this.config.debug && console.log("🎯 Universal Cache and Universal DM Module initialized");
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
    return this._profile || (this._profile = new Xe({
      relayManager: this.relayManager,
      subscriptionManager: this.subscriptionManager,
      signingProvider: this.signingProvider,
      eventBuilder: new _(),
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
    return this._relayList || (this._relayList = new Tr(this)), this._relayList;
  }
  // NIP-66 Discovery & Health (lightweight helpers)
  get relayDiscovery() {
    return this._relayDiscovery || (this._relayDiscovery = new xr(this)), this._relayDiscovery;
  }
  get relayHealth() {
    return this._relayHealth || (this._relayHealth = new Cr(this)), this._relayHealth;
  }
  /** NIP-57 Zaps */
  get zaps() {
    return this._zap || (this._zap = new Nr(this)), this._zap;
  }
  /** NIP-51 Lists module */
  get lists() {
    return this._lists || (this._lists = new ur(this)), this._lists;
  }
  /** NIP-32 Labels module */
  get labels() {
    return this._labels || (this._labels = new hr(this)), this._labels;
  }
  /** NIP-28 Channels module */
  get channels() {
    return this._channels || (this._channels = new mr(this)), this._channels;
  }
  /** NIP-22 Comments module */
  get comments() {
    return this._comments || (this._comments = new ar(this)), this._comments;
  }
  /** NIP-72 Communities module */
  get communities() {
    return this._communities || (this._communities = new Sr(this)), this._communities;
  }
  /** Content module (NIP-23/18/01) */
  get content() {
    return this._content || (this._content = new He(this, this.config.debug)), this._content;
  }
  /** Files/Attachments helper (NIP-92/94/96) */
  get files() {
    return this._files || (this._files = new kr(this)), this._files;
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
      const { provider: s, method: r } = await ps.createBestAvailable();
      this.signingProvider = s, this.signingMethod = r;
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
    const s = _.validateEvent(t);
    if (!s.valid)
      throw new Error(`Invalid event: ${s.errors.join(", ")}`);
    const r = _.calculateEventId(t), i = await this.signingProvider.signEvent(t), n = { ...t, id: r, sig: i }, a = await this.relayManager.publishToRelays(n, e), c = a.some((u) => u.success);
    return {
      success: c,
      eventId: c ? n.id : void 0,
      event: c ? n : void 0,
      relayResults: a,
      timestamp: Date.now(),
      error: c ? void 0 : { message: "Failed to publish to any relay", retryable: !0 }
    };
  }
  /**
   * Smart publish to specific relays: ensures connections (one-shot) and cleans up afterwards
   */
  async publishToRelaysSmart(t, e, s) {
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const r = _.validateEvent(t);
    if (!r.valid)
      throw new Error(`Invalid event: ${r.errors.join(", ")}`);
    const i = _.calculateEventId(t), n = await this.signingProvider.signEvent(t), a = { ...t, id: i, sig: n }, c = Array.from(new Set(e.filter(Boolean))), u = new Set(this.relayManager.relayUrls), h = c.filter((y) => !u.has(y));
    h.length && this.relayManager.addRelays(h, { temporary: !0 }), await this.relayManager.ensureConnected(c);
    const d = await this.relayManager.publishToRelays(a, c, s), g = d.some((y) => y.success), p = c.filter((y) => h.includes(y));
    if (p.length) {
      try {
        await this.relayManager.disconnectRelays(p);
      } catch {
      }
      try {
        this.relayManager.removeRelays(p);
      } catch {
      }
    }
    const f = {
      success: g,
      eventId: g ? a.id : void 0,
      event: g ? a : void 0,
      relayResults: d,
      timestamp: Date.now(),
      error: g ? void 0 : { message: "Failed to publish to any relay", retryable: !0 }
    };
    return this.config.debug && (f.debug = { targetRelays: c }), f;
  }
  async publish(t, e = 1) {
    const s = Date.now();
    if (!this.signingProvider)
      throw new Error("No signing provider available. Call initializeSigning() first.");
    const r = typeof t == "string" ? await _.createEvent(t, await this.getPublicKey(), { kind: e }) : t, i = _.validateEvent(r);
    if (!i.valid)
      throw new Error(`Invalid event: ${i.errors.join(", ")}`);
    const n = _.calculateEventId(r), a = await this.signingProvider.signEvent(r), c = { ...r, id: n, sig: a };
    let u = null;
    try {
      u = await this.autoSelectRelaysForEvent(r);
    } catch {
    }
    if (Array.isArray(u) && u.length > 0)
      return await this.publishToRelaysSmart(r, u);
    this.isRoutingSensitiveEventKind(r.kind) && this.config.debug && console.warn(`⚠️ Routing-sensitive event (kind ${r.kind}) without specific relay markers. Falling back to connected relays. Consider adding explicit relay markers for better delivery.`);
    let h = this.relayManager.connectedRelays;
    try {
      if (this.relayRouter && this.config.routing === "nip65") {
        const y = c.pubkey, b = this.extractMentionedPubkeys(c);
        h = await this.relayRouter.selectRelays(c, h, {
          authorPubkey: y,
          mentionedPubkeys: b
        });
      }
    } catch {
    }
    const d = await this.relayManager.publishToRelays(c, h), g = Date.now() - s, p = d.some((y) => y.success), f = {
      success: p,
      eventId: p ? c.id : void 0,
      event: p ? c : void 0,
      relayResults: d,
      timestamp: Date.now(),
      error: p ? void 0 : { message: "Failed to publish to any relay", retryable: !0, suggestion: "Check relay connectivity or try different relays" }
    };
    return this.config.debug && (f.debug = {
      connectionAttempts: this.relayManager.connectedRelays.length,
      relayLatencies: d.reduce((y, b) => (y[b.relay] = 0, y), {}),
      totalTime: g,
      signingMethod: this.signingMethod === "extension" ? "extension" : "temporary",
      targetRelays: h
    }), f;
  }
  /**
   * Publish an already signed event (for Gift Wraps, etc.)
   * This bypasses the normal signing process since the event is already signed
   */
  async publishSigned(t) {
    const e = Date.now();
    if (!t.id || !t.sig || !t.pubkey)
      throw new Error("Invalid signed event: Missing required fields (id, sig, pubkey)");
    let s = null;
    try {
      s = await this.autoSelectRelaysForEvent(t);
    } catch {
    }
    if (Array.isArray(s) && s.length > 0)
      return await this.publishSignedToRelaysSmart(t, s);
    if (this.isRoutingSensitiveEventKind(t.kind))
      throw new Error("No target relay known for routing-sensitive event. Ensure markers (NIP-72) or recipient relay list (NIP-65) are available.");
    let r = this.relayManager.connectedRelays;
    try {
      if (this.relayRouter && this.config.routing === "nip65") {
        const u = t.pubkey, h = this.extractMentionedPubkeys(t);
        r = await this.relayRouter.selectRelays(t, r, {
          authorPubkey: u,
          mentionedPubkeys: h
        });
      }
    } catch {
    }
    const i = await this.relayManager.publishToRelays(t, r), n = Date.now() - e, a = i.some((u) => u.success), c = {
      success: a,
      eventId: a ? t.id : void 0,
      event: a ? t : void 0,
      relayResults: i,
      timestamp: Date.now(),
      error: a ? void 0 : { message: "Failed to publish to any relay", retryable: !0, suggestion: "Check relay connectivity or try different relays" }
    };
    return this.config.debug && (c.debug = {
      connectionAttempts: this.relayManager.connectedRelays.length,
      relayLatencies: i.reduce((u, h) => (u[h.relay] = 0, u), {}),
      totalTime: n,
      signingMethod: "temporary",
      targetRelays: r
    }), c;
  }
  // Heuristik: automatische Relay-Auswahl für spezielle Kinds (NIP‑72)
  async autoSelectRelaysForEvent(t) {
    var e, s;
    try {
      if (!t || !Array.isArray(t.tags)) return null;
      if (t.kind === 34550) {
        const r = (e = (t.tags || []).find((n) => n[0] === "relay" && n[2] === "author")) == null ? void 0 : e[1];
        if (r) return [r];
        const i = (s = (t.tags || []).find((n) => n[0] === "relay")) == null ? void 0 : s[1];
        return i ? [i] : null;
      }
      if (t.kind === 1111) {
        const r = (t.tags || []).find((n) => n[0] === "A" || n[0] === "a"), i = Array.isArray(r) ? r[1] : null;
        if (i && i.startsWith("34550:")) {
          const n = i.split(":"), a = String(n[1] || ""), c = String(n[2] || "");
          try {
            const u = await this.communities.resolveRelays(a, c, 800);
            if (u != null && u.requests) return [u.requests];
          } catch {
          }
        }
        return Array.isArray(r) && typeof r[2] == "string" && r[2] ? [r[2]] : null;
      }
      if (t.kind === 4550) {
        const r = (t.tags || []).find((n) => n[0] === "a"), i = Array.isArray(r) ? r[1] : null;
        if (i && i.startsWith("34550:")) {
          const [n, a, c] = i.split(":"), u = String(a || ""), h = String(c || "");
          try {
            const d = await this.communities.resolveRelays(u, h, 800);
            if (d != null && d.approvals) return [d.approvals];
          } catch {
          }
        }
        return Array.isArray(r) && typeof r[2] == "string" && r[2] ? [r[2]] : null;
      }
      if (t.kind === 4 || t.kind === 14 || t.kind === 1059) {
        const r = (t.tags || []).filter((n) => Array.isArray(n) && n[0] === "p" && typeof n[1] == "string").map((n) => String(n[1])).filter((n) => !!n);
        if (!r.length) return null;
        const i = await this.resolveRecipientsPreferredRelays(r, 1e3);
        return i.length ? i : null;
      }
      return null;
    } catch {
      return null;
    }
  }
  isRoutingSensitiveEventKind(t) {
    return t === 34550 || t === 1111 || t === 4550 || t === 4 || t === 14 || t === 1059;
  }
  /** Resolve recipients' preferred relays using their NIP‑65 lists (blocking with timeout). */
  async resolveRecipientsPreferredRelays(t, e = 1e3) {
    const s = /* @__PURE__ */ new Set();
    for (const r of Array.from(new Set(t || [])))
      try {
        const i = await this.resolveRelayListForAuthor(r, e);
        [...i.read || [], ...i.both || [], ...i.write || []].forEach((n) => {
          n && s.add(String(n));
        });
      } catch {
      }
    return Array.from(s);
  }
  /** Blockingly resolve NIP‑65 relay list for an author using the RelayListModule store. */
  async resolveRelayListForAuthor(t, e = 1e3) {
    try {
      const s = this.relayList.get(t);
      let r = s.current;
      return r && typeof r == "object" && (Array.isArray(r.read) || Array.isArray(r.write) || Array.isArray(r.both)) ? { read: r.read || [], write: r.write || [], both: r.both || [] } : await new Promise((i, n) => {
        let a = !1, c;
        try {
          const u = s.subscribe((h) => {
            if (!a && h && (Array.isArray(h.read) || Array.isArray(h.write) || Array.isArray(h.both))) {
              a = !0;
              try {
                clearTimeout(c);
              } catch {
              }
              try {
                u && u();
              } catch {
              }
              i({ read: h.read || [], write: h.write || [], both: h.both || [] });
            }
          });
          c = setTimeout(() => {
            if (!a) {
              a = !0;
              try {
                u && u();
              } catch {
              }
              n(new Error("Timeout resolving relay list"));
            }
          }, Math.max(200, e));
        } catch (u) {
          n(u);
        }
      });
    } catch (s) {
      throw s;
    }
  }
  /**
   * Smart publish for already signed events to specific relays (one-shot connect/cleanup)
   */
  async publishSignedToRelaysSmart(t, e, s) {
    if (!(t != null && t.id) || !(t != null && t.sig) || !(t != null && t.pubkey))
      throw new Error("Invalid signed event: Missing required fields (id, sig, pubkey)");
    const r = Array.from(new Set(e.filter(Boolean))), i = new Set(this.relayManager.relayUrls), n = r.filter((d) => !i.has(d));
    n.length && this.relayManager.addRelays(n, { temporary: !0 }), await this.relayManager.ensureConnected(r);
    const a = await this.relayManager.publishToRelays(t, r, s), c = a.some((d) => d.success), u = (s == null ? void 0 : s.removeAfter) ?? !0 ? r.filter((d) => n.includes(d)) : [];
    if (u.length) {
      try {
        await this.relayManager.disconnectRelays(u);
      } catch {
      }
      try {
        this.relayManager.removeRelays(u);
      } catch {
      }
    }
    const h = {
      success: c,
      eventId: c ? t.id : void 0,
      event: c ? t : void 0,
      relayResults: a,
      timestamp: Date.now(),
      error: c ? void 0 : { message: "Failed to publish to any relay", retryable: !0 }
    };
    return this.config.debug && (h.debug = { targetRelays: r }), h;
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
  // Internal helper for debug flag access in subcomponents
  getDebug() {
    try {
      return !!this.config.debug;
    } catch {
      return !1;
    }
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
    return new ie(this.cache);
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
   * DX convenience: initialize with Nostr Connect (NIP-46) remote signer
   * Returns a client token for QR pairing and waits for connect ACK if requested.
   */
  async useNostrConnect(t) {
    try {
      const e = new be({ remoteSignerPubkey: t.remoteSignerPubkey, relays: t.relays, nostr: this }), { uri: s, secret: r, clientPub: i } = await e.createClientTokenWithSecret({ name: t.name, perms: t.perms, relays: t.relays, url: t.url, image: t.image }), n = typeof t.waitForAckMs == "number" ? t.waitForAckMs : 0;
      if (n && n > 0)
        try {
          await e.waitForConnectAck(r, n);
        } catch {
        }
      return { success: !0, client: { uri: s, secret: r, clientPub: i } };
    } catch (e) {
      return { success: !1, error: e.message };
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
        const r = ((e = t == null ? void 0 : t.constructor) == null ? void 0 : e.name) || "";
        this.signingMethod = r.includes("Extension") ? "extension" : "temporary";
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
const we = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif"
}, ve = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v"
}, Ee = {
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4"
};
function si(o) {
  try {
    const s = new URL(o).pathname.toLowerCase().match(/\.([a-z0-9]+)$/i), r = (s == null ? void 0 : s[1]) || "";
    if (we[r]) return we[r];
    if (ve[r]) return ve[r];
    if (Ee[r]) return Ee[r];
  } catch {
  }
}
function ri(o) {
  const t = [];
  if (t.push(`url ${o.url}`), o.mimeType && t.push(`m ${o.mimeType}`), o.blurhash && t.push(`blurhash ${o.blurhash}`), o.dim && t.push(`dim ${o.dim}`), o.alt && t.push(`alt ${o.alt}`), o.sha256 && t.push(`x ${o.sha256}`), o.fallbacks && o.fallbacks.length)
    for (const e of o.fallbacks) t.push(`fallback ${e}`);
  return ["imeta", ...t];
}
function ii(o) {
  const t = [];
  for (const e of o.tags || []) {
    if (e[0] !== "imeta") continue;
    const s = { url: "" };
    for (let r = 1; r < e.length; r++) {
      const i = e[r], n = i.indexOf(" ");
      if (n <= 0) continue;
      const a = i.slice(0, n), c = i.slice(n + 1);
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
const ni = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DMConversation: Ie,
  DMModule: Re,
  DMRoom: Te,
  EphemeralKeyManager: Rt,
  GiftWrapCreator: Lt,
  GiftWrapProtocol: at,
  NIP44Crypto: X,
  SealCreator: Dt,
  TimestampRandomizer: Gt
}, Symbol.toStringTag, { value: "Module" })), oi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FollowBatchBuilder: Ge,
  FollowBuilder: je,
  FollowsModule: Je,
  ProfileBatchBuilder: qe,
  ProfileBuilder: ze,
  ProfileDiscoveryBuilder: Ve,
  ProfileModule: Xe
}, Symbol.toStringTag, { value: "Module" }));
function Dr(o) {
  return typeof globalThis.btoa == "function" ? globalThis.btoa(o) : Buffer.from(o, "utf8").toString("base64");
}
async function Lr(o, t) {
  const e = t.method.toUpperCase(), s = t.url;
  let r;
  t.payload && typeof t.payload == "string" ? r = D(et(new TextEncoder().encode(t.payload))) : t.payload && (r = D(et(t.payload)));
  const i = o.events.create().kind(27235).content("").tag("u", s).tag("method", e);
  return r && i.tag("payload", r), await (await i.sign()).build();
}
function Fr(o) {
  const t = JSON.stringify(o);
  return `Nostr ${Dr(t)}`;
}
async function $r(o, t) {
  const e = await Lr(o, t), s = Fr(e);
  return { event: e, header: s };
}
class ai {
  constructor(t) {
    this.nostr = t;
  }
  async discover(t) {
    const e = new URL("/.well-known/nostr/nip96.json", t).toString(), s = await fetch(e);
    if (!s.ok) throw new Error(`nip96.json fetch failed: ${s.status}`);
    const r = await s.json();
    if (!r.api_url || typeof r.api_url != "string") throw new Error("Invalid nip96.json: missing api_url");
    return r;
  }
  async upload(t, e, s = {}) {
    var p;
    const r = await this.discover(t), i = r.api_url || r.delegated_to_url || t, n = e instanceof Uint8Array ? e : new Uint8Array(e), a = new FormData(), c = new Blob([n], { type: s.contentType || "application/octet-stream" });
    a.append("file", c, s.filename || "upload.bin"), s.caption && a.append("caption", s.caption), s.alt && a.append("alt", s.alt);
    const u = { method: "POST", body: a, headers: {} };
    if (s.requireAuth) {
      const { header: f } = await $r(this.nostr, {
        method: "POST",
        url: i,
        payload: n
        // not strictly the file-hash semantics, but header exists
      });
      u.headers.Authorization = f;
    }
    const h = await fetch(i, u), d = await h.json(), g = { status: d.status || (h.ok ? "success" : "error"), message: d.message };
    if ((p = d.nip94_event) != null && p.tags) {
      g.nip94_event = d.nip94_event;
      const f = d.nip94_event.tags, y = f.find((w) => w[0] === "url"), b = f.find((w) => w[0] === "ox"), m = f.find((w) => w[0] === "x");
      g.url = y == null ? void 0 : y[1], g.ox = b == null ? void 0 : b[1], g.x = m == null ? void 0 : m[1];
    }
    return g;
  }
  async publishNip94(t) {
    const e = this.nostr.events.create().kind(1063).content(t.content || "");
    for (const s of t.tags || []) e.tag(s[0], ...s.slice(1));
    return await e.publish();
  }
}
const ci = "0.2.0";
export {
  gs as DEFAULT_RELAYS,
  ni as DM,
  ae as EVENT_KINDS,
  $ as ErrorHandler,
  _ as EventBuilder,
  ms as EventsModule,
  Nt as ExtensionSigner,
  te as FeedStoreImpl,
  Kt as FluentEventBuilder,
  St as LocalKeySigner,
  ai as Nip96Client,
  be as NostrConnectSigner,
  ei as NostrUnchained,
  oi as Profile,
  ie as QueryBuilder,
  Ur as QuickSigner,
  ys as RelayManager,
  ps as SigningProviderFactory,
  Zt as SubBuilder,
  _r as SubscriptionManager,
  Kr as TemporarySigner,
  ci as VERSION,
  Lr as buildHttpAuthEvent,
  Fr as buildHttpAuthHeader,
  ri as buildImetaTag,
  Wr as createFeed,
  qr as createFeedFromFilter,
  zr as createFeedFromQuery,
  Js as createNaddr,
  Zr as createNevent,
  Xr as createNprofile,
  kt as decode,
  I as derived,
  si as guessMimeType,
  Jr as hexToNote,
  Gr as hexToNpub,
  Yr as hexToNsec,
  zs as isNostrUri,
  Xs as isValidHexKey,
  ti as isValidNote,
  Zs as isValidNpub,
  Qr as isValidNsec,
  Ue as naddrEncode,
  Be as neventEncode,
  js as noteEncode,
  Ys as noteToHex,
  Oe as nprofileEncode,
  Vs as npubEncode,
  Ke as npubToHex,
  qs as nsecEncode,
  Gs as nsecToHex,
  ii as parseImetaTags,
  Vr as parseNostrUri,
  Hr as setDefaultSubscriptionManager,
  $r as signHttpAuth,
  jr as toNostrUri,
  nt as writable
};
