import { useState } from "react";
import Head from "next/head";

export async function getServerSideProps({ params }) {
  const BOT_API = process.env.BOT_API || "http://46.62.230.81:5015";
  try {
    const res = await fetch(`${BOT_API}/api/appeal/record/${params.userId}`);
    const data = await res.json();
    if (!data.ok) return { props: { error: data.error, userId: params.userId } };
    return { props: { record: data.record, appeal: data.appeal || null, questions: data.questions || [], guildName: data.guildName || "Anti Gang Force", guildIcon: data.guildIcon || null, userId: params.userId } };
  } catch {
    return { props: { error: "Could not connect to bot.", userId: params.userId } };
  }
}

export default function AppealPage({ record, appeal, questions, guildName, guildIcon, userId, error }) {
  const [answers, setAnswers] = useState(questions.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (answers.some(a => !a.trim())) return setErr("Please answer all questions.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: record?.userId || userId, answers }) });
      const data = await res.json();
      if (data.ok) setSubmitted(true);
      else setErr(data.error || "Failed to submit.");
    } catch { setErr("Network error. Try again."); }
    setSubmitting(false);
  };

  const alreadyResolved = appeal && appeal.status !== "pending";
  const alreadyPending = appeal && appeal.status === "pending";
  const showForm = !error && record && !alreadyResolved && !alreadyPending && !submitted;

  return (
    <>
      <Head>
        <title>Ban Appeal — {guildName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{css}</style>
      </Head>
      <div className="bg-blobs">
        <div className="blob blob1" />
        <div className="blob blob2" />
      </div>
      <div className="page">
        <div className="container">
          <div className="header">
            {guildIcon
              ? <img src={guildIcon} className="logo" alt="" />
              : <div className="logo-fallback">⚖️</div>}
            <h1>Ban Appeal</h1>
            <p className="subtitle">{guildName} · Appeal Review System</p>
          </div>

          {error && <Card><div className="empty"><div style={{fontSize:52,marginBottom:16}}>🚫</div><h2>{error}</h2><p>Make sure you are using the correct link from your ban DM.</p></div></Card>}

          {alreadyResolved && <Banner type={appeal.status} title={appeal.status==="accepted"?"✅ Appeal Accepted":"❌ Appeal Denied"} msg={appeal.status==="accepted"?"Your appeal was accepted and you have been unbanned. Welcome back.":`Your appeal was denied.${appeal.denyReason?" Reason: "+appeal.denyReason:""}`} />}
          {(alreadyPending||submitted) && <Banner type="pending" title="⏳ Under Review" msg="Your appeal has been submitted. AGF staff will review it and DM you with the result." />}

          {record && (
            <Card>
              <Label>Your Ban</Label>
              <div className="grid2">
                <Info label="Username" value={record.userTag||record.username||userId} />
                <Info label="Duration" value={record.duration||"Permanent"} red />
                <Info label="Banned By" value={record.bannedBy||"Staff"} />
                <Info label="Date" value={record.bannedAt?new Date(record.bannedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"Unknown"} />
              </div>
              <div className="reason-box">
                <div className="reason-label">Reason</div>
                <p>{record.reason||"No reason provided"}</p>
              </div>
              {record.proof&&record.proof.length>0&&(
                <div style={{marginTop:16}}>
                  <div className="proof-label">Proof ({record.proof.length})</div>
                  <div className="proof-grid">
                    {record.proof.map((url,i)=>(
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="proof-img-wrap">
                        <img src={url} alt={`Proof ${i+1}`} className="proof-img" onError={e=>e.target.parentElement.style.display="none"} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {showForm && (
            <Card>
              <Label>Appeal Form</Label>
              <p className="form-hint">Answer every question honestly. Incomplete or dishonest appeals will be denied.</p>
              <form onSubmit={handleSubmit}>
                {questions.map((q,i)=>(
                  <div key={i} className="field">
                    <label><span className="q-num">{String(i+1).padStart(2,"0")}</span> {q}</label>
                    <textarea value={answers[i]} onChange={e=>{const a=[...answers];a[i]=e.target.value;setAnswers(a);}} placeholder="Your answer..." required rows={3} className="textarea" />
                  </div>
                ))}
                {err && <div className="err-box">{err}</div>}
                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? <><span className="spinner" /> Submitting...</> : "Submit Appeal →"}
                </button>
              </form>
            </Card>
          )}

          <div className="footer">Anti Gang Force · Ban Appeal System</div>
        </div>
      </div>
    </>
  );
}

function Card({children}){return <div className="card">{children}</div>;}
function Label({children}){return <div className="section-label">{children}</div>;}
function Info({label,value,red}){return(<div><div className="info-label">{label}</div><div className="info-value" style={red?{color:"#f87171"}:{}}>{value}</div></div>);}
function Banner({type,title,msg}){const c={accepted:"#22c55e",denied:"#ef4444",pending:"#f59e0b"};const color=c[type]||c.pending;return(<div className="banner" style={{borderLeftColor:color,background:`rgba(${type==="accepted"?"34,197,94":type==="denied"?"239,68,68":"245,158,11"},.06)`,borderColor:`rgba(${type==="accepted"?"34,197,94":type==="denied"?"239,68,68":"245,158,11"},.2)`}}><div className="banner-title" style={{color}}>{title}</div><p className="banner-msg">{msg}</p></div>);}

const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#0a0c12;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
::selection{background:rgba(88,101,242,.35)}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0a0c12}::-webkit-scrollbar-thumb{background:#1e2030;border-radius:3px}
.bg-blobs{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.blob{position:absolute;border-radius:50%;filter:blur(60px)}
.blob1{top:-20%;left:-15%;width:600px;height:600px;background:radial-gradient(circle,rgba(88,101,242,.15),transparent 70%)}
.blob2{bottom:-10%;right:-10%;width:500px;height:500px;background:radial-gradient(circle,rgba(239,68,68,.1),transparent 70%)}
.page{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:52px 16px 80px}
.container{width:100%;max-width:660px}
.header{text-align:center;margin-bottom:40px}
.logo{width:76px;height:76px;border-radius:50%;border:3px solid rgba(88,101,242,.5);display:block;margin:0 auto 16px;box-shadow:0 0 32px rgba(88,101,242,.2)}
.logo-fallback{width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#5865f2,#4752c4);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 0 32px rgba(88,101,242,.3)}
h1{font-size:30px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-bottom:6px}
.subtitle{color:#475569;font-size:14px}
.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px;margin-bottom:16px;backdrop-filter:blur(8px);animation:fadeUp .4s ease both}
.section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#475569;margin-bottom:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.info-label{font-size:11px;color:#334155;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.info-value{font-size:14px;color:#f1f5f9;font-weight:600}
.reason-box{background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.15);border-left:3px solid #ef4444;border-radius:10px;padding:14px 16px}
.reason-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#ef4444;margin-bottom:6px}
.reason-box p{font-size:14px;color:#cbd5e1;line-height:1.6}
.proof-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#475569;margin-bottom:10px}
.proof-grid{display:flex;flex-wrap:wrap;gap:8px}
.proof-img-wrap{display:block;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.08);transition:transform .2s,box-shadow .2s;flex-shrink:0}
.proof-img-wrap:hover{transform:scale(1.04);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.proof-img{width:130px;height:86px;object-fit:cover;display:block}
.banner{border:1px solid;border-left:3px solid;border-radius:12px;padding:16px 20px;margin-bottom:16px;animation:fadeUp .4s ease both}
.banner-title{font-weight:700;font-size:15px;margin-bottom:5px}
.banner-msg{font-size:13px;color:#94a3b8;line-height:1.6}
.form-hint{font-size:13px;color:#475569;margin-bottom:24px;line-height:1.7}
.field{margin-bottom:20px}
.field label{display:block;font-size:13px;font-weight:600;color:#c9d8f0;margin-bottom:8px;line-height:1.5}
.q-num{color:#5865f2;font-size:11px;margin-right:6px;font-weight:700;font-family:monospace}
.textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 14px;color:#e2e8f0;font-size:13px;font-family:inherit;resize:vertical;transition:border-color .2s,box-shadow .2s;line-height:1.6}
.textarea:focus{outline:none;border-color:#5865f2;box-shadow:0 0 0 3px rgba(88,101,242,.12)}
.err-box{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#f87171}
.submit-btn{width:100%;background:linear-gradient(135deg,#5865f2,#4752c4);border:none;border-radius:12px;padding:14px;color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;transition:transform .15s,box-shadow .15s,opacity .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.submit-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(88,101,242,.35)}
.submit-btn:disabled{opacity:.5;cursor:not-allowed}
.spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
.empty{text-align:center;padding:32px 0;color:#475569}
.empty h2{color:#94a3b8;font-size:20px;margin-bottom:8px}
.empty p{font-size:13px;line-height:1.6}
.footer{text-align:center;margin-top:32px;color:#1e293b;font-size:12px}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:500px){.grid2{grid-template-columns:1fr}.proof-img{width:110px;height:74px}}
`;
