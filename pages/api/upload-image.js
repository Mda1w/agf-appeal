export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  try {
    const { data, name } = req.body;
    if (!data) return res.json({ ok: false, error: "No data" });
    // Just return the base64 data URL as-is - the bot will handle it
    // OR upload to the transcripts Blob store (same token)
    const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
    if (!BLOB_TOKEN) {
      // No blob - return base64 URL directly (will be embedded in Discord)
      return res.json({ ok: true, url: data });
    }
    // Upload to Vercel Blob
    const base64 = data.split(",")[1];
    const mimeMatch = data.match(/data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const buf = Buffer.from(base64, "base64");
    const filename = `appeal-proofs/${Date.now()}-${(name||"image").replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    
    const uploadRes = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${BLOB_TOKEN}`,
        "x-content-type": mime,
        "x-add-random-suffix": "0",
      },
      body: buf,
    });
    const blobData = await uploadRes.json();
    return res.json({ ok: true, url: blobData.url || data });
  } catch(e) {
    return res.json({ ok: true, url: req.body?.data || "" }); // fallback
  }
}
