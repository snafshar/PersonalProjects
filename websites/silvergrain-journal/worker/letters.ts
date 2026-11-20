import type { Bindings, Letter } from "./types";
import { fail, readText, validEmail } from "./store";

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
const period = 15 * 60;
const clock = () => Math.floor(Date.now() / 1000);
const getSalt = "SELECT value FROM journal_settings WHERE name='contact_secret'";

async function signingKey(env: Bindings) {
  let salt = await env.DB.prepare(getSalt).first<string>("value");
  if (!salt) {
    const generated = crypto.getRandomValues(new Uint8Array(32));
    await env.DB.prepare("INSERT OR IGNORE INTO journal_settings(name,value) VALUES('contact_secret',?)").bind(hex(generated.buffer)).run();
    salt = await env.DB.prepare(getSalt).first<string>("value");
  }
  if (!salt) return fail(503, "The contact form is temporarily unavailable.");
  return crypto.subtle.importKey("raw", encoder.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export type Challenge = { prompt: string; ticket: string };
export async function challenge(env: Bindings): Promise<Challenge> {
  const numbers = crypto.getRandomValues(new Uint8Array(2));
  const left = 2 + numbers[0] % 8, right = 2 + numbers[1] % 8;
  const payload = [clock(), crypto.randomUUID(), left, right].join(".");
  const signature = await crypto.subtle.sign("HMAC", await signingKey(env), encoder.encode("form:" + payload));
  return { prompt: `What is ${left} plus ${right}?`, ticket: payload + "." + hex(signature) };
}
async function throttle(req: Request, env: Bindings, key: CryptoKey) {
  const interval = Math.floor(clock() / period);
  const digest = hex(await crypto.subtle.sign("HMAC", key, encoder.encode("sender:" + (req.headers.get("cf-connecting-ip") || "shared"))));
  const [, updated] = await env.DB.batch<{ count: number }>([
    env.DB.prepare("DELETE FROM journal_contact_rates WHERE window < ?").bind(interval - 1),
    env.DB.prepare("INSERT INTO journal_contact_rates(key, window, count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END, window=excluded.window RETURNING count").bind(digest, interval),
  ]);
  if ((updated.results[0]?.count ?? 9) > 8) fail(429, "Please wait a few minutes before sending another message.");
}
export async function contactInput(req: Request) {
  const origin = req.headers.get("origin"), site = req.headers.get("sec-fetch-site");
  if ((origin && origin !== new URL(req.url).origin) || (site && site !== "same-origin" && site !== "none")) fail(403, "Open the journal contact form to send a message.");
  if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers.get("content-type") || "")) fail(415, "Use the contact form to send a message.");
  return new URLSearchParams(await readText(req, 20_000));
}
export async function acceptLetter(req: Request, env: Bindings, form: URLSearchParams) {
  const key = await signingKey(env);
  await throttle(req, env, key);
  if (form.get("website")) return;
  const sender = (form.get("name") || "").trim(), email = (form.get("email") || "").trim(), body = (form.get("body") || "").trim();
  if (!sender || sender.length > 80 || !validEmail(email) || !body || body.length > 3000 || /\x00/.test(sender + body)) fail(422, "Enter your name, a valid email address, and a message of up to 3,000 characters.");
  const parts = /^(\d{1,12})\.([a-f0-9-]{36})\.([2-9])\.([2-9])\.([a-f0-9]{64})$/.exec(form.get("ticket") || "");
  const invalid = () => fail(422, "Please answer the new verification question.");
  if (!parts) return invalid();
  const [, stamp, ticket, left, right, mac] = parts;
  const age = clock() - Number(stamp);
  const signature = Uint8Array.from(mac.match(/../g)!, byte => parseInt(byte, 16));
  const authentic = await crypto.subtle.verify("HMAC", key, signature, encoder.encode("form:" + [stamp, ticket, left, right].join(".")));
  if (!authentic || age < 0 || age > period || form.get("answer")?.trim() !== String(Number(left) + Number(right))) return invalid();
  // A browser retry of a successful submission receives the same confirmation.
  await env.DB.prepare("INSERT INTO journal_letters(sender,email,body,received,ticket) VALUES(?,?,?,?,?) ON CONFLICT(ticket) DO NOTHING").bind(sender, email, body, clock(), ticket).run();
}
export async function inbox(env: Bindings, before: number): Promise<Letter[]> {
  const rows = await env.DB.prepare("SELECT id,sender,email,body,received FROM journal_letters WHERE id < ? ORDER BY id DESC LIMIT 51").bind(before).all<Letter>();
  return rows.results;
}
