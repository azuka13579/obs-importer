/* ---------- SHA-256 (fallback jika crypto.subtle tidak tersedia, mis. halaman http di IP LAN) ---------- */
const K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];

function sha256Fallback(msg) {
  const len = msg.length, bitLen = len * 8;
  const total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total); buf.set(msg); buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000)); dv.setUint32(total - 4, bitLen >>> 0);
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  const out = new Uint8Array(32); const odv = new DataView(out.buffer);
  H.forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}

async function sha256(bytes) {
  if (window.crypto && crypto.subtle) {
    try { return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)); } catch { /* pakai fallback */ }
  }
  return sha256Fallback(bytes);
}

const toB64 = bytes => btoa(String.fromCharCode(...bytes));

async function makeAuth(password, salt, challenge) {
  const enc = new TextEncoder();
  const secret = toB64(await sha256(enc.encode(password + salt)));
  return toB64(await sha256(enc.encode(secret + challenge)));
}

/* ---------- Klien obs-websocket v5 ---------- */
export class OBSClient {
  constructor() {
    this.ws = null;
    this.pending = new Map();
    this.n = 0;
    this.onClose = null;
    this.identified = false;
  }

  get connected() { return !!this.ws && this.ws.readyState === 1 && this.identified; }

  connect(url, password) {
    return new Promise((resolve, reject) => {
      let settled = false, ws;
      const fail = msg => {
        if (settled) return;
        settled = true; reject(new Error(msg));
        try { ws.close(); } catch { /* sudah tertutup */ }
      };
      try { ws = new WebSocket(url); } catch { reject(new Error('Alamat server tidak valid.')); return; }
      this.ws = ws; this.identified = false;

      ws.onmessage = async ev => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.op === 0) {
          const d = { rpcVersion: 1 };
          const auth = msg.d.authentication;
          if (auth) {
            if (!password) { fail('OBS meminta password. Isi kolom password lalu coba lagi.'); return; }
            d.authentication = await makeAuth(password, auth.salt, auth.challenge);
          }
          ws.send(JSON.stringify({ op: 1, d }));
        } else if (msg.op === 2) {
          this.identified = true; settled = true; resolve(msg.d);
        } else if (msg.op === 7) {
          const p = this.pending.get(msg.d.requestId);
          if (!p) return;
          this.pending.delete(msg.d.requestId);
          const st = msg.d.requestStatus;
          if (st.result) p.resolve(msg.d.responseData || {});
          else {
            const err = new Error(st.comment || ('Kode error ' + st.code));
            err.code = st.code; p.reject(err);
          }
        }
      };
      ws.onerror = () => fail('Tidak bisa tersambung. Pastikan OBS terbuka, WebSocket server aktif, dan jika browser meminta izin akses jaringan lokal, pilih Izinkan.');
      ws.onclose = ev => {
        fail(ev.code === 4009 ? 'Password salah.' : 'Koneksi ditutup (kode ' + ev.code + ').');
        const wasIdentified = this.identified;
        this.identified = false; this.ws = null;
        this.pending.forEach(p => p.reject(new Error('Koneksi ke OBS terputus.')));
        this.pending.clear();
        if (wasIdentified && this.onClose) this.onClose();
      };
    });
  }

  disconnect() { if (this.ws) this.ws.close(); }

  call(requestType, requestData = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) { reject(new Error('Belum tersambung ke OBS.')); return; }
      const requestId = 'r' + (++this.n);
      this.pending.set(requestId, { resolve, reject });
      this.ws.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } }));
    });
  }
}
