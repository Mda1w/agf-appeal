import { useState } from "react";
import Head from "next/head";

export async function getServerSideProps({ params }) {
  const BOT_API = process.env.BOT_API || "http://46.62.230.81:5015";
  try {
    const res = await fetch(`${BOT_API}/api/appeal/record/${params.userId}`);
    const data = await res.json();
    if (!data.ok) return { props: { error: data.error, userId: params.userId } };
    return { props: { record: data.record, appeal: data.appeal||null, questions: data.questions||[], guildName: data.guildName||"Anti Gang Force", guildIcon: data.guildIcon||null, userId: params.userId } };
  } catch { return { props: { error: "Could not connect to bot.", userId: params.userId } }; }
}

export default function AppealPage({ record, appeal, questions, guildName, guildIcon, userId, error }) {
  const [answers, setAnswers] = useState(questions.map(()=>""));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(null);
    if (answers.some(a=>!a.trim())) return setErr("Please answer all questions.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId: record?.userId||userId, answers }) });
      const data = await res.json();
      if (data.ok) setSubmitted(true); else setErr(data.error||"Failed to submit.");
    } catch { setErr("Network error. Try again."); }
    setSubmitting(false);
  };

  const resolved = appeal && appeal.status !== "pending";
  const pending = appeal && appeal.status === "pending";
  const showForm = !error && record && !resolved && !pending && !submitted;
  const banned_date = record?.bannedAt ? new Date(record.bannedAt) : null;

  return (
    <>
      <Head>
        <title>Ban Appeal — {guildName}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=gg+sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <style>{css}</style>
      </Head>

      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="server-icon" title={guildName}>
            {guildIcon ? <img src={guildIcon} alt="" className="server-img"/> : <span>⚖️</span>}
          </div>
          <div className="sidebar-divider"/>
          <div className="sidebar-icon sidebar-icon--appeal active" title="Ban Appeal">⚖️</div>
        </div>

        {/* Channel list */}
        <div className="channels">
          <div className="channels-header">{guildName}</div>
          <div className="channel-category">APPEAL SYSTEM</div>
          <div className="channel-item active"><span className="ch-hash">#</span> ban-appeal</div>
          <div className="channel-category">INFO</div>
          <div className="channel-item"><span className="ch-hash">#</span> ban-details</div>
          <div className="channel-item"><span className="ch-hash">#</span> proof</div>

          {/* User card at bottom */}
          <div className="user-card">
            <div className="user-avatar">
              {record?.userAvatar ? <img src={record.userAvatar} alt=""/> : <span>?</span>}
              <div className={`user-status ${resolved&&appeal.status==="accepted"?"green":resolved?"red":"yellow"}`}/>
            </div>
            <div className="user-info">
              <div className="user-name">{record?.userTag?.split("#")[0]||record?.username||"Unknown"}</div>
              <div className="user-disc">{resolved?appeal.status==="accepted"?"Unbanned":"Denied":pending||submitted?"Under Review":"Banned"}</div>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat">
          <div className="chat-header">
            <span className="chat-hash">#</span>
            <span className="chat-title">ban-appeal</span>
            <span className="chat-divider"/>
            <span className="chat-desc">Submit your ban appeal for review by AGF Staff</span>
          </div>

          <div className="messages">
            {/* System message */}
            <div className="system-msg">
              <div className="system-line"/>
              <span>Ban Appeal System</span>
              <div className="system-line"/>
            </div>

            {error && (
              <div className="msg-block">
                <div className="msg-avatar bot-avatar">🤖</div>
                <div className="msg-content">
                  <div className="msg-header"><span className="msg-author bot-name">AGF BOT</span><span className="msg-badge">APP</span><span className="msg-time">Today</span></div>
                  <div className="msg-text">No ban record found for this user ID. Make sure you are using the correct link from your ban DM.</div>
                </div>
              </div>
            )}

            {record && (
              <div className="msg-block">
                <div className="msg-avatar bot-avatar">🤖</div>
                <div className="msg-content">
                  <div className="msg-header"><span className="msg-author bot-name">AGF BOT</span><span className="msg-badge">APP</span><span className="msg-time">{banned_date?.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</span></div>
                  <div className="msg-text">Here is your ban information:</div>
                  {/* Ban embed */}
                  <div className="embed embed--red">
                    <div className="embed-author">
                      {guildIcon&&<img src={guildIcon} className="embed-author-icon" alt=""/>}
                      <span>{guildName}</span>
                    </div>
                    <div className="embed-title">You were banned</div>
                    <div className="embed-fields">
                      <div className="embed-field embed-field--inline">
                        <div className="embed-field-name">User</div>
                        <div className="embed-field-value">{record.userTag}</div>
                      </div>
                      <div className="embed-field embed-field--inline">
                        <div className="embed-field-name">Duration</div>
                        <div className="embed-field-value" style={{color:"#f87171"}}>{record.duration||"Permanent"}</div>
                      </div>
                      <div className="embed-field embed-field--inline">
                        <div className="embed-field-name">Banned By</div>
                        <div className="embed-field-value">{record.bannedBy||"Staff"}</div>
                      </div>
                      <div className="embed-field">
                        <div className="embed-field-name">Reason</div>
                        <div className="embed-field-value">{record.reason||"No reason provided"}</div>
                      </div>
                    </div>
                    {record.proof&&record.proof.length>0&&(
                      <div className="embed-field" style={{marginTop:8}}>
                        <div className="embed-field-name">Proof ({record.proof.length})</div>
                        <div className="proof-row">
                          {record.proof.map((url,i)=>(
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="proof-thumb">
                              <img src={url} alt={`Proof ${i+1}`} onError={e=>e.target.parentElement.style.display="none"}/>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="embed-footer">{banned_date?.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</div>
                  </div>
                </div>
              </div>
            )}

            {(resolved||pending||submitted)&&(
              <div className="msg-block">
                <div className="msg-avatar bot-avatar">🤖</div>
                <div className="msg-content">
                  <div className="msg-header"><span className="msg-author bot-name">AGF BOT</span><span className="msg-badge">APP</span><span className="msg-time">Today</span></div>
                  <div className={`embed embed--${resolved?(appeal.status==="accepted"?"green":"red"):"yellow"}`}>
                    <div className="embed-title">
                      {resolved?(appeal.status==="accepted"?"✅ Appeal Accepted":"❌ Appeal Denied"):"⏳ Appeal Under Review"}
                    </div>
                    <div className="embed-desc">
                      {resolved
                        ?(appeal.status==="accepted"
                          ?"Your appeal was accepted. You have been unbanned. Welcome back to Anti Gang Force."
                          :`Your appeal was denied.${appeal.denyReason?" **Reason:** "+appeal.denyReason:""}`)
                        :"Your appeal has been submitted and is currently under review by AGF Staff. You will be notified via DM."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showForm&&(
              <div className="msg-block">
                <div className="msg-avatar bot-avatar">🤖</div>
                <div className="msg-content">
                  <div className="msg-header"><span className="msg-author bot-name">AGF BOT</span><span className="msg-badge">APP</span><span className="msg-time">Today</span></div>
                  <div className="msg-text">Please fill out the appeal form below. Answer all questions honestly. Incomplete or dishonest appeals will be denied.</div>
                  <div className="embed embed--blue">
                    <div className="embed-title">📋 Ban Appeal Form</div>
                    <form onSubmit={handleSubmit} className="appeal-form">
                      {questions.map((q,i)=>(
                        <div key={i} className="form-field">
                          <label className="form-label"><span className="q-index">{i+1}</span>{q}</label>
                          <textarea className="form-textarea" value={answers[i]} onChange={e=>{const a=[...answers];a[i]=e.target.value;setAnswers(a);}} placeholder="Type your answer..." required rows={3}
                            onFocus={e=>e.target.classList.add("focused")} onBlur={e=>e.target.classList.remove("focused")}
                          />
                        </div>
                      ))}
                      {err&&<div className="form-error">{err}</div>}
                      <button type="submit" disabled={submitting} className="form-submit">
                        {submitting?<><span className="spinner"/>Submitting...</>:"Submit Appeal"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div style={{height:80}}/>
          </div>
        </div>
      </div>
    </>
  );
}

const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#313338;color:#dcddde;font-family:'gg sans','Noto Sans',Whitney,'Helvetica Neue',Helvetica,Arial,sans-serif;height:100%;overflow:hidden}
.app{display:flex;height:100vh;overflow:hidden}

/* Sidebar */
.sidebar{width:72px;background:#1e1f22;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:8px;flex-shrink:0;overflow-y:auto}
.server-icon{width:48px;height:48px;border-radius:50%;background:#5865f2;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;transition:border-radius .15s;overflow:hidden;flex-shrink:0}
.server-icon:hover{border-radius:16px}
.server-img{width:100%;height:100%;object-fit:cover}
.sidebar-divider{width:32px;height:2px;background:#3f4147;border-radius:1px;flex-shrink:0}
.sidebar-icon{width:48px;height:48px;border-radius:50%;background:#313338;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;transition:border-radius .15s,background .15s}
.sidebar-icon:hover,.sidebar-icon.active{border-radius:16px;background:#5865f2}

/* Channel list */
.channels{width:240px;background:#2b2d31;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden}
.channels-header{padding:16px;font-weight:700;font-size:15px;color:#f2f3f5;border-bottom:1px solid #1e1f22;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.channel-category{padding:16px 8px 4px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#949ba4;letter-spacing:.02em}
.channel-item{display:flex;align-items:center;gap:6px;padding:2px 8px;margin:0 8px;border-radius:4px;font-size:15px;color:#949ba4;cursor:pointer;transition:background .1s,color .1s}
.channel-item:hover,.channel-item.active{background:rgba(255,255,255,.07);color:#dcddde}
.channel-item.active{background:rgba(255,255,255,.1);color:#f2f3f5}
.ch-hash{font-size:20px;color:#5c5f66;flex-shrink:0}
.user-card{margin-top:auto;background:#232428;padding:8px;display:flex;align-items:center;gap:8px;flex-shrink:0}
.user-avatar{position:relative;flex-shrink:0}
.user-avatar img,.user-avatar span{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:#5865f2;object-fit:cover}
.user-status{position:absolute;bottom:-2px;right:-2px;width:10px;height:10px;border-radius:50%;border:2px solid #232428}
.user-status.green{background:#23a55a}
.user-status.red{background:#f23f42}
.user-status.yellow{background:#f0b232}
.user-info{min-width:0}
.user-name{font-size:13px;font-weight:600;color:#f2f3f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-disc{font-size:11px;color:#949ba4}

/* Chat */
.chat{flex:1;display:flex;flex-direction:column;background:#313338;overflow:hidden}
.chat-header{height:48px;background:#313338;border-bottom:1px solid rgba(0,0,0,.2);display:flex;align-items:center;padding:0 16px;gap:8px;flex-shrink:0;box-shadow:0 1px 0 rgba(0,0,0,.2)}
.chat-hash{font-size:22px;color:#72767d;flex-shrink:0}
.chat-title{font-weight:700;font-size:15px;color:#f2f3f5}
.chat-divider{width:1px;height:22px;background:#3f4147;margin:0 6px}
.chat-desc{font-size:13px;color:#949ba4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.messages{flex:1;overflow-y:auto;padding:16px 0;display:flex;flex-direction:column;gap:0}
.messages::-webkit-scrollbar{width:6px}
.messages::-webkit-scrollbar-track{background:#2f3136}
.messages::-webkit-scrollbar-thumb{background:#202225;border-radius:3px}
.system-msg{display:flex;align-items:center;gap:12px;padding:8px 16px;margin:8px 0}
.system-line{flex:1;height:1px;background:#3f4147}
.system-msg span{font-size:12px;color:#6d6f78;white-space:nowrap;font-weight:500}
.msg-block{display:flex;gap:16px;padding:2px 16px;margin-bottom:0}
.msg-block:hover{background:rgba(0,0,0,.07)}
.msg-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;margin-top:4px;display:flex;align-items:center;justify-content:center;font-size:20px}
.bot-avatar{background:#5865f2;border-radius:50%}
.msg-content{flex:1;min-width:0}
.msg-header{display:flex;align-items:baseline;gap:8px;margin-bottom:4px;flex-wrap:wrap}
.msg-author{font-size:15px;font-weight:600;color:#f2f3f5;cursor:pointer}
.msg-author:hover{text-decoration:underline}
.bot-name{color:#7289da}
.msg-badge{background:#5865f2;color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;text-transform:uppercase;letter-spacing:.5px}
.msg-time{font-size:11px;color:#72767d}
.msg-text{font-size:15px;color:#dcddde;line-height:1.5;word-break:break-word}

/* Embeds */
.embed{border-left:4px solid #5865f2;background:#2b2d31;border-radius:0 4px 4px 0;padding:12px 16px;margin-top:4px;max-width:520px}
.embed--red{border-left-color:#f23f42}
.embed--green{border-left-color:#23a55a}
.embed--yellow{border-left-color:#f0b232}
.embed--blue{border-left-color:#5865f2}
.embed-author{display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:12px;font-weight:600;color:#dcddde}
.embed-author-icon{width:18px;height:18px;border-radius:50%}
.embed-title{font-size:15px;font-weight:700;color:#f2f3f5;margin-bottom:8px}
.embed-desc{font-size:14px;color:#dcddde;line-height:1.5;margin-bottom:8px}
.embed-fields{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px}
.embed-field{grid-column:1/-1}
.embed-field--inline{grid-column:span 1}
.embed-field-name{font-size:12px;font-weight:700;color:#dcddde;margin-bottom:2px;text-transform:capitalize}
.embed-field-value{font-size:14px;color:#b5bac1}
.embed-footer{font-size:11px;color:#72767d;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05)}
.proof-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.proof-thumb{display:block;border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,.06)}
.proof-thumb img{width:100px;height:66px;object-fit:cover;display:block;transition:opacity .15s}
.proof-thumb:hover img{opacity:.85}

/* Form */
.appeal-form{margin-top:4px}
.form-field{margin-bottom:16px}
.form-label{display:block;font-size:13px;font-weight:600;color:#b5bac1;margin-bottom:6px;line-height:1.4}
.q-index{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#5865f2;border-radius:50%;font-size:10px;font-weight:700;color:#fff;margin-right:7px;flex-shrink:0}
.form-textarea{width:100%;background:#1e1f22;border:1px solid #1e1f22;border-radius:3px;padding:10px;color:#dcddde;font-size:14px;font-family:inherit;resize:vertical;line-height:1.5;transition:border-color .1s}
.form-textarea.focused,.form-textarea:focus{outline:none;border-color:#5865f2}
.form-error{background:rgba(242,63,66,.1);border:1px solid rgba(242,63,66,.3);border-radius:4px;padding:8px 12px;font-size:13px;color:#f87171;margin-bottom:12px}
.form-submit{background:#5865f2;border:none;border-radius:3px;padding:8px 16px;color:#fff;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .15s}
.form-submit:hover:not(:disabled){background:#4752c4}
.form-submit:disabled{opacity:.5;cursor:not-allowed}
.spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:600px){.channels{display:none}.chat-desc{display:none}.embed-fields{grid-template-columns:1fr 1fr}.embed-field--inline{grid-column:span 1}}
@media(max-width:400px){.sidebar{display:none}}
`;
