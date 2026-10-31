// Gửi thông báo đẩy tới thiết bị của owner khi có yêu cầu lấy hàng mới.
// Nhân viên gửi yêu cầu mới: { action: 'notify', request_id } -> thông báo cho owner.
// Owner duyệt/từ chối: { action: 'resolved', request_id } -> thông báo ngược lại cho nhân viên đã gửi (không biết ai thì cho mọi nhân viên).
// Cũng trả khóa công khai VAPID cho app đăng ký thiết bị: { action: 'public-key' }.
// Khóa VAPID tự sinh lần đầu và nằm trong bảng push_config (chỉ service role đọc được).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const URL_BASE = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_BASE, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const CHANNEL_NAME: Record<string, string> = {
  "808": "808", TLD: "THAILAN", HP: "HAIPHONG", SHP: "SHOPPE", SPF: "SHOPIFY", IG: "IG",
};

async function getVapid() {
  const got = await admin.from("push_config").select("public_key,private_key").eq("id", 1).maybeSingle();
  if (got.data) return got.data;
  const k = webpush.generateVAPIDKeys();
  const ins = await admin.from("push_config").insert({ id: 1, public_key: k.publicKey, private_key: k.privateKey });
  if (ins.error) {
    // hai yêu cầu cùng sinh khóa: lấy bản đã được lưu trước
    const again = await admin.from("push_config").select("public_key,private_key").eq("id", 1).single();
    if (again.data) return again.data;
    throw ins.error;
  }
  return { public_key: k.publicKey, private_key: k.privateKey };
}

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

// Gửi một thông báo tới các thiết bị khớp (cột = giá trị), dọn thiết bị đã hết hạn
async function sendAll(payload: string, vapid: { public_key: string; private_key: string }, col: string, val: string) {
  const { data: subs } = await admin.from("push_subs").select("id,endpoint,p256dh,auth").eq(col, val);
  let sent = 0;
  const dead: string[] = [];
  const errors: string[] = [];
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        {
          TTL: 3600,
          urgency: "high",
          vapidDetails: { subject: URL_BASE, publicKey: vapid.public_key, privateKey: vapid.private_key },
        },
      );
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.id);
      else errors.push(String(e?.statusCode ?? e?.message ?? e).slice(0, 120));
    }
  }));
  if (dead.length) await admin.from("push_subs").delete().in("id", dead);
  return { sent, devices: (subs ?? []).length, removed: dead.length, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Phải là người đã đăng nhập (kiểm bằng Auth, không phụ thuộc kiểu khóa ký JWT)
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return json({ error: "unauthorized" }, 401);

    let body: any = {};
    try { body = await req.json(); } catch { /* thân rỗng */ }
    const vapid = await getVapid();

    if (body.action === "public-key") return json({ publicKey: vapid.public_key });

    if (body.action === "test") {
      const payload = JSON.stringify({ title: "PHONCHAY", body: "Thông báo thử: máy này nhận được rồi.", url: "./", tag: "test" });
      return json(await sendAll(payload, vapid, "user_id", u.user.id));
    }

    if (body.action === "notify" || body.action === "resolved") {
      const { data: doc } = await admin.from("app_docs").select("data").eq("key", "inventory").maybeSingle();
      const r = (doc?.data?.requests ?? []).find((x: any) => x.id === body.request_id);
      if (!r) return json({ sent: 0, reason: "no-request" });
      const lines = r.lines ?? [];
      const qty = lines.reduce((a: number, l: any) => a + (Number(l.qty) || 0), 0);
      const ch = CHANNEL_NAME[r.ch] ?? r.ch;

      if (body.action === "notify") {
        if (r.status !== "pending") return json({ sent: 0, reason: "not-pending" });
        const dup = await admin.from("push_sent").insert({ request_id: `${r.id}:new:${await sha(JSON.stringify(lines))}` });
        if (dup.error) return json({ sent: 0, reason: "already-sent" });
        const payload = JSON.stringify({
          title: "Yêu cầu lấy hàng mới",
          body: `${ch}: ${lines.length} SKU, ${qty} sp. Bấm để duyệt.`,
          url: "./",
          tag: r.id,
        });
        return json(await sendAll(payload, vapid, "role", "owner"));
      }

      // resolved: chỉ owner được gọi
      if (u.user.app_metadata?.role !== "owner") return json({ error: "forbidden" }, 403);
      if (r.status !== "approved" && r.status !== "rejected") return json({ sent: 0, reason: "not-resolved" });
      const dup = await admin.from("push_sent").insert({ request_id: `${r.id}:${r.status}:${await sha(JSON.stringify(lines))}` });
      if (dup.error) return json({ sent: 0, reason: "already-sent" });
      const ok = r.status === "approved";
      const payload = JSON.stringify({
        title: ok ? "Yêu cầu được duyệt" : "Yêu cầu bị từ chối",
        body: ok ? `${r.id} (${ch}, ${qty} sp): hàng đã chuyển về kênh.` : `${r.id} (${ch}, ${qty} sp): owner từ chối yêu cầu.`,
        url: "./",
        tag: `${r.id}-${r.status}`,
      });
      // gửi đúng người đã gửi yêu cầu; yêu cầu cũ không ghi người gửi thì gửi mọi nhân viên
      return json(r.by ? await sendAll(payload, vapid, "user_id", r.by) : await sendAll(payload, vapid, "role", "staff"));
    }
    return json({ error: "unknown-action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
