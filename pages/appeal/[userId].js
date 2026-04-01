import { useState, useEffect, useRef } from "react";
import Head from "next/head";

export async function getServerSideProps({ params }) {
  const BOT_API = process.env.BOT_API || "http://46.62.230.81:5015";
  try {
    const res = await fetch(`${BOT_API}/api/appeal/record/${params.userId}`);
    const data = await res.json();
    if (!data.ok) return { props: { error: data.error, userId: params.userId } };
    return { props: { record: data.record, appeal: data.appeal||null, questions: data.questions||[], guildName: data.guildName||"Anti Gang Force", guildIcon: data.guildIcon||null, userId: params.userId } };
  } catch { return { props: { error: "Could not connect to the server.", userId: params.userId } }; }
}

export default function AppealPage({ record, appeal, questions, guildName, guildIcon, userId, error }) {
  const [answers, setAnswers] = useState(questions.map(()=>""));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const fileRef = useRef();

  useEffect(() => { setMounted(true); }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setImages(files);
    const previews = [];
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => { previews.push(ev.target.result); if (previews.length === files.length) setImagePreviews([...previews]); };
      r.readAsDataURL(f);
    });
    if (!files.length) setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(null);
    if (answers.some(a=>!a.trim())) return setErr("Please answer all questions before submitting.");
    if (!check1) return setErr("You must acknowledge the first statement.");
    if (!check2) return setErr("You must acknowledge the second statement.");
    setSubmitting(true);
    try {
      // Upload images as base64
      const imageData = await Promise.all(imagePreviews.map(async (p, i) => {
        const res = await fetch("/api/upload-image", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ data: p, name: images[i]?.name || `image_${i}.jpg` }) });
        const d = await res.json();
        return d.url || null;
      }));
      const res = await fetch("/api/submit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId: record?.userId||userId, answers, questions, images: imageData.filter(Boolean) }) });
      const data = await res.json();
      if (data.ok) setSubmitted(true); else setErr(data.error||"Submission failed. Try again.");
    } catch { setErr("Network error. Please try again."); }
    setSubmitting(false);
  };

  const resolved = appeal && appeal.status !== "pending";
  const pending = (appeal && appeal.status === "pending") || submitted;
  const showForm = !error && record && !resolved && !pending;
  const bannedDate = record?.bannedAt ? new Date(record.bannedAt) : null;
  const proofs = record?.proof || [];

  return (
    <>
      <Head>
        <title>Ban Appeal — {guildName}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <meta name="theme-color" content="#0d0d12"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <style>{globalCSS}</style>
      </Head>

      <div className={`root ${mounted?"mounted":""}`}>
        <div className="bg">
          <div className="bg-orb bg-orb1"/>
          <div className="bg-orb bg-orb2"/>
          <div className="bg-orb bg-orb3"/>
          <div className="bg-grid"/>
        </div>

        <div className="wrap">
          <nav className="nav">
            <div className="nav-logo">
              {guildIcon ? <img src={guildIcon} alt="" className="nav-icon"/> : <div className="nav-icon nav-icon-fallback">⚖</div>}
              <span className="nav-name">{guildName}</span>
            </div>
            <div className="nav-tag">Ban Appeal</div>
          </nav>

          <div className="hero">
            <div className="hero-badge"><span className="badge-dot"/>Appeal System</div>
            <h1 className="hero-title">
              {error ? "No Record Found" : resolved ? (appeal.status==="accepted" ? "Appeal Accepted" : "Appeal Denied") : pending ? "Under Review" : "Submit Your Appeal"}
            </h1>
            <p className="hero-sub">
              {error ? "Make sure you are using the correct link from your ban DM."
                : resolved ? (appeal.status==="accepted" ? "Your appeal was successful. You have been unbanned." : "Your appeal has been reviewed and denied.")
                : pending ? "Your appeal is being reviewed by AGF staff. You will be notified via DM."
                : "Fill out every field carefully. Honest and detailed answers improve your chances."}
            </p>
          </div>

          {error && (
            <div className="glass-card card-center">
              <div className="empty-icon">🚫</div>
              <div className="empty-title">No ban record found</div>
              <div className="empty-body">{error}</div>
            </div>
          )}

          {(resolved || pending) && (
            <div className={`glass-card status-card status-${resolved?(appeal.status==="accepted"?"green":"red"):"yellow"}`}>
              <div className="status-icon">{resolved ? (appeal.status==="accepted" ? "✓" : "✕") : "⏳"}</div>
              <div className="status-body">
                <div className="status-title">{resolved ? (appeal.status==="accepted" ? "Appeal Accepted" : "Appeal Denied") : "Under Review"}</div>
                <div className="status-msg">
                  {resolved ? (appeal.status==="accepted" ? "You have been unbanned and are welcome to rejoin Anti Gang Force." : `Your appeal was denied.${appeal.denyReason ? ` Reason: ${appeal.denyReason}` : ""}`) : "Your appeal has been submitted and is currently under review by our staff team."}
                </div>
              </div>
            </div>
          )}

          {record && (
            <div className="glass-card">
              <div className="card-label">Ban Details</div>
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-key">Username</div><div className="detail-val">{record.tag || record.userTag || record.username || userId}</div></div>
                <div className="detail-item"><div className="detail-key">Duration</div><div className="detail-val detail-val--red">{record.duration || "Permanent"}</div></div>
                <div className="detail-item"><div className="detail-key">Banned By</div><div className="detail-val">{record.bannedBy || "Staff"}</div></div>
                <div className="detail-item"><div className="detail-key">Date</div><div className="detail-val">{bannedDate ? bannedDate.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "Unknown"}</div></div>
              </div>
              <div className="reason-block">
                <div className="reason-label">Reason</div>
                <div className="reason-text">{record.reason || "No reason provided"}</div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="glass-card">
              <div className="card-label">Appeal Form</div>
              <div className="form-notice"><span className="notice-icon">💡</span>Be specific and honest. Vague answers lead to automatic denials.</div>
              <form onSubmit={handleSubmit}>
                {questions.map((q,i) => (
                  <div key={i} className={`field ${focused===i?"field--active":""}`}>
                    <label className="field-label">
                      <span className="field-num">{String(i+1).padStart(2,"0")}</span>{q}
                    </label>
                    <div className="textarea-wrap">
                      <textarea className="textarea" value={answers[i]} onChange={e=>{const a=[...answers];a[i]=e.target.value;setAnswers(a);}} onFocus={()=>setFocused(i)} onBlur={()=>setFocused(null)} placeholder="Write your answer here..." required rows={4}/>
                      <div className="textarea-border"/>
                    </div>
                    <div className="char-count">{(answers[i]||"").length} chars</div>
                  </div>
                ))}

                {/* Image upload */}
                <div className="field">
                  <div className="field-label" style={{marginBottom:"10px"}}>
                    <span className="field-num" style={{background:"rgba(99,102,241,.15)",color:"#a5b4fc"}}>📎</span>
                    Proof / Evidence <span style={{color:"#475569",fontWeight:400,fontSize:"12px"}}>(optional — max 3 images)</span>
                  </div>
                  <div className="upload-area" onClick={()=>fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleImageChange}/>
                    {imagePreviews.length === 0 ? (
                      <div className="upload-placeholder">
                        <div className="upload-icon">🖼️</div>
                        <div className="upload-text">Click to add images</div>
                        <div className="upload-sub">PNG, JPG, GIF up to 5MB each</div>
                      </div>
                    ) : (
                      <div className="upload-previews">
                        {imagePreviews.map((src,i) => (
                          <div key={i} className="preview-item">
                            <img src={src} alt={`Proof ${i+1}`}/>
                            <button type="button" className="preview-remove" onClick={ev=>{ev.stopPropagation();const imgs=[...images];const prevs=[...imagePreviews];imgs.splice(i,1);prevs.splice(i,1);setImages(imgs);setImagePreviews(prevs);}}>×</button>
                          </div>
                        ))}
                        {imagePreviews.length < 3 && <div className="preview-add">+ Add more</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acknowledgement checkboxes */}
                <div className="ack-section">
                  <div className="ack-title">Before you submit</div>
                  <label className={`ack-item ${check1?"ack-checked":""}`} onClick={()=>setCheck1(v=>!v)}>
                    <div className={`ack-box ${check1?"ack-box-checked":""}`}>{check1?"✓":""}</div>
                    <span>I understand that contacting staff directly about my ban will result in an automatic decline.</span>
                  </label>
                  <label className={`ack-item ${check2?"ack-checked":""}`} onClick={()=>setCheck2(v=>!v)}>
                    <div className={`ack-box ${check2?"ack-box-checked":""}`}>{check2?"✓":""}</div>
                    <span>I understand that my appeal may be declined and I accept the decision of the staff team.</span>
                  </label>
                </div>

                {err && <div className="err-msg"><span>⚠</span> {err}</div>}

                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? (<><span className="btn-spinner"/><span>Submitting appeal...</span></>) : (<><span>Submit Appeal</span><span className="btn-arrow">→</span></>)}
                </button>
              </form>
            </div>
          )}

          <div className="footer">Anti Gang Force · Ban Appeal System · All rights reserved</div>
        </div>
      </div>
    </>
  );
}

const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body { background: #0d0d12; color: #e2e8f0; font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100vh; overflow-x: hidden; }
  ::selection { background: rgba(99,102,241,.35); color: #fff; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }
  .root { min-height: 100vh; position: relative; }
  .root.mounted .glass-card { animation: cardIn .5s cubic-bezier(.16,1,.3,1) both; }
  .root.mounted .hero { animation: heroIn .6s cubic-bezier(.16,1,.3,1) both; }
  .root.mounted .nav { animation: heroIn .4s cubic-bezier(.16,1,.3,1) both; }
  .bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .bg-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .6; }
  .bg-orb1 { width: 700px; height: 700px; top: -200px; left: -200px; background: radial-gradient(circle, rgba(99,102,241,.2) 0%, transparent 70%); }
  .bg-orb2 { width: 500px; height: 500px; bottom: -100px; right: -100px; background: radial-gradient(circle, rgba(239,68,68,.15) 0%, transparent 70%); }
  .bg-orb3 { width: 400px; height: 400px; top: 50%; left: 55%; background: radial-gradient(circle, rgba(168,85,247,.1) 0%, transparent 70%); }
  .bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px); background-size: 60px 60px; }
  .wrap { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; padding: 0 20px 60px; }
  .nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 0 8px; }
  .nav-logo { display: flex; align-items: center; gap: 10px; }
  .nav-icon { width: 34px; height: 34px; border-radius: 50%; border: 2px solid rgba(99,102,241,.4); object-fit: cover; }
  .nav-icon-fallback { background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .nav-name { font-size: 14px; font-weight: 700; color: #f1f5f9; letter-spacing: -.2px; }
  .nav-tag { font-size: 11px; font-weight: 600; color: #6366f1; background: rgba(99,102,241,.12); border: 1px solid rgba(99,102,241,.25); border-radius: 20px; padding: 3px 10px; letter-spacing: .3px; text-transform: uppercase; }
  .hero { padding: 52px 0 40px; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.2); border-radius: 20px; padding: 5px 12px; font-size: 11px; font-weight: 600; color: #a5b4fc; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 18px; }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 6px #6366f1; animation: pulse 2s infinite; }
  .hero-title { font-size: 42px; font-weight: 900; color: #fff; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 14px; }
  .hero-sub { font-size: 16px; color: #64748b; line-height: 1.7; max-width: 500px; }
  .glass-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 28px; margin-bottom: 16px; backdrop-filter: blur(16px); position: relative; overflow: hidden; }
  .glass-card::before { content: ''; position: absolute; inset: 0; border-radius: 20px; background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 60%); pointer-events: none; }
  .card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #475569; margin-bottom: 20px; }
  .card-center { text-align: center; padding: 48px 28px; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-title { font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
  .empty-body { font-size: 14px; color: #64748b; line-height: 1.6; }
  .status-card { display: flex; gap: 20px; align-items: flex-start; }
  .status-card.status-green { border-color: rgba(34,197,94,.25); background: rgba(34,197,94,.05); }
  .status-card.status-red { border-color: rgba(239,68,68,.25); background: rgba(239,68,68,.05); }
  .status-card.status-yellow { border-color: rgba(245,158,11,.25); background: rgba(245,158,11,.05); }
  .status-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0; }
  .status-green .status-icon { background: rgba(34,197,94,.15); color: #22c55e; }
  .status-red .status-icon { background: rgba(239,68,68,.15); color: #ef4444; }
  .status-yellow .status-icon { background: rgba(245,158,11,.15); color: #f59e0b; }
  .status-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin-bottom: 5px; }
  .status-msg { font-size: 14px; color: #94a3b8; line-height: 1.6; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .detail-key { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: #475569; margin-bottom: 5px; }
  .detail-val { font-size: 15px; font-weight: 600; color: #f1f5f9; }
  .detail-val--red { color: #f87171; }
  .reason-block { background: rgba(239,68,68,.05); border: 1px solid rgba(239,68,68,.12); border-left: 3px solid #ef4444; border-radius: 12px; padding: 16px; }
  .reason-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #f87171; margin-bottom: 8px; }
  .reason-text { font-size: 14px; color: #cbd5e1; line-height: 1.6; }
  .form-notice { display: flex; align-items: flex-start; gap: 10px; background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.15); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 28px; }
  .notice-icon { flex-shrink: 0; font-size: 15px; }
  .field { margin-bottom: 24px; }
  .field--active .field-num { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; }
  .field--active .field-label { color: #e2e8f0; }
  .field-label { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 10px; line-height: 1.4; transition: color .2s; }
  .field-num { width: 22px; height: 22px; border-radius: 6px; background: rgba(255,255,255,.07); font-size: 10px; font-weight: 800; color: #6366f1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: monospace; transition: background .2s, color .2s; }
  .textarea-wrap { position: relative; }
  .textarea { width: 100%; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 14px 16px; color: #e2e8f0; font-size: 14px; font-family: inherit; resize: vertical; line-height: 1.65; min-height: 110px; transition: border-color .2s, background .2s; outline: none; display: block; }
  .textarea:focus { background: rgba(255,255,255,.05); border-color: rgba(99,102,241,.5); }
  .textarea::placeholder { color: #334155; }
  .textarea-border { position: absolute; inset: 0; border-radius: 12px; border: 1px solid rgba(99,102,241,.5); opacity: 0; pointer-events: none; transition: opacity .2s; box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
  .textarea:focus ~ .textarea-border { opacity: 1; }
  .char-count { font-size: 11px; color: #334155; text-align: right; margin-top: 5px; }
  /* Upload */
  .upload-area { border: 2px dashed rgba(255,255,255,.08); border-radius: 14px; padding: 20px; cursor: pointer; transition: border-color .2s, background .2s; }
  .upload-area:hover { border-color: rgba(99,102,241,.4); background: rgba(99,102,241,.05); }
  .upload-placeholder { text-align: center; }
  .upload-icon { font-size: 32px; margin-bottom: 8px; }
  .upload-text { font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
  .upload-sub { font-size: 12px; color: #475569; }
  .upload-previews { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .preview-item { position: relative; width: 90px; height: 70px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); }
  .preview-item img { width: 100%; height: 100%; object-fit: cover; }
  .preview-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; background: rgba(239,68,68,.85); border: none; border-radius: 50%; color: #fff; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
  .preview-add { width: 90px; height: 70px; border: 2px dashed rgba(255,255,255,.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #475569; cursor: pointer; }
  /* Acknowledgements */
  .ack-section { margin: 24px 0; background: rgba(245,158,11,.04); border: 1px solid rgba(245,158,11,.15); border-radius: 14px; padding: 20px; }
  .ack-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #b45309; margin-bottom: 14px; }
  .ack-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; cursor: pointer; user-select: none; }
  .ack-item:last-child { margin-bottom: 0; }
  .ack-box { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; border: 2px solid rgba(245,158,11,.3); background: rgba(245,158,11,.05); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #f59e0b; transition: all .15s; }
  .ack-box-checked { background: rgba(245,158,11,.2); border-color: #f59e0b; }
  .ack-item span { font-size: 13px; color: #94a3b8; line-height: 1.5; padding-top: 1px; }
  .ack-checked span { color: #cbd5e1; }
  .err-msg { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #f87171; margin-bottom: 16px; }
  .submit-btn { width: 100%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border: none; border-radius: 14px; padding: 16px 24px; color: #fff; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform .15s, box-shadow .15s, opacity .2s; position: relative; overflow: hidden; }
  .submit-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.1), transparent); }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,.4); }
  .submit-btn:disabled { opacity: .55; cursor: not-allowed; }
  .btn-arrow { font-size: 18px; transition: transform .2s; }
  .submit-btn:hover .btn-arrow { transform: translateX(4px); }
  .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.25); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
  .footer { text-align: center; font-size: 12px; color: #1e293b; margin-top: 40px; }
  @keyframes heroIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes cardIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.6;transform:scale(.85);} }
  @keyframes spin { to { transform: rotate(360deg); } }
  .glass-card:nth-child(1){animation-delay:.05s;} .glass-card:nth-child(2){animation-delay:.1s;} .glass-card:nth-child(3){animation-delay:.15s;} .glass-card:nth-child(4){animation-delay:.2s;}
  @media(max-width:520px) { .hero-title{font-size:28px;} .detail-grid{grid-template-columns:1fr;gap:14px;} .glass-card{padding:20px;border-radius:16px;} }
`;
