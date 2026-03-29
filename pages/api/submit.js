export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const BOT_API = process.env.BOT_API || "http://46.62.230.81:5015";
    const response = await fetch(`${BOT_API}/api/appeal/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.json({ ok: false, error: "Could not reach the bot server. Make sure it is online." });
  }
}
