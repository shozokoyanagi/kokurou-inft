'use client'
import { useState, useRef, useEffect } from 'react'

function getTime() {
  const d = new Date()
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

const STORAGE_KEY = 'kokurou_conversations'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function persistSaved(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export default function Home() {
  const [messages, setMessages] = useState([{ role: 'wolf', text: '……遅いな。', time: getTime() }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiHistory, setApiHistory] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [saved, setSaved] = useState([])
  const [saveFlash, setSaveFlash] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { setSaved(loadSaved()) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const handleSave = () => {
    if (messages.length <= 1) return
    const wolfReply = messages.find(m => m.role === 'wolf' && m.text !== '……遅いな。')?.text
    const preview = (wolfReply || messages[messages.length - 1]?.text || '').slice(0, 50)
    const now = new Date()
    const savedAt = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const newConvo = {
      id: Date.now().toString(),
      savedAt,
      preview: preview + (preview.length >= 50 ? '…' : ''),
      messages,
      history: apiHistory
    }
    const updated = [newConvo, ...saved]
    setSaved(updated)
    persistSaved(updated)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1500)
  }

  const handleLoad = (convo) => { setMessages(convo.messages); setApiHistory(convo.history); setShowPanel(false) }
  const handleDelete = (id, e) => { e.stopPropagation(); const u = saved.filter(c => c.id !== id); setSaved(u); persistSaved(u) }
  const handleNew = () => { setMessages([{ role: 'wolf', text: '……遅いな。', time: getTime() }]); setApiHistory([]); setShowPanel(false) }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput(''); setLoading(true)
    setMessages(prev => [...prev, { role: 'user', text, time: getTime() }])
    const newHistory = [...apiHistory, { role: 'user', content: text }]
    setApiHistory(newHistory)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: apiHistory })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'wolf', text: data.reply, time: getTime() }])
      setApiHistory(prev => [...prev, { role: 'assistant', content: data.reply }].slice(-20))
    } catch {
      setMessages(prev => [...prev, { role: 'wolf', text: '…………', time: getTime(), isError: true }])
      setApiHistory(prev => prev.slice(0, -1))
    }
    setLoading(false)
  }

  const hasContent = messages.length > 1

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0d0b08; font-family: 'Noto Serif JP', serif; }
        .inft-badge { position: fixed; top: 16px; left: 16px; background: #c8a84a; color: #0d0b08; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; padding: 4px 10px; border-radius: 4px; z-index: 200; }
        .wolf-title { position: fixed; top: 12px; left: 0; right: 0; text-align: center; font-size: 22px; font-weight: 300; letter-spacing: 0.5em; color: #e04040; z-index: 200; pointer-events: none; }
        .top-right { position: fixed; top: 12px; right: 12px; z-index: 200; display: flex; gap: 8px; }
        .icon-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(13,11,8,0.75); border: 0.5px solid rgba(100,80,40,0.5); color: rgba(200,180,120,0.8); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; backdrop-filter: blur(4px); }
        .icon-btn:hover { background: rgba(30,26,16,0.95); }
        .icon-btn.active { background: rgba(42,36,24,0.95); border-color: rgba(200,180,120,0.6); }
        .bg-image { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; height: 100vh; object-fit: cover; object-position: center 20%; filter: grayscale(10%) contrast(1.05) brightness(0.55); z-index: 0; }
        .bg-gradient { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; height: 100vh; background: linear-gradient(to bottom, rgba(13,11,8,0.1) 0%, rgba(13,11,8,0.0) 30%, rgba(13,11,8,0.4) 70%, rgba(13,11,8,0.75) 100%); z-index: 1; pointer-events: none; }
        .container { position: relative; width: 100%; max-width: 480px; min-height: 100vh; margin: 0 auto; display: flex; flex-direction: column; z-index: 2; }
        .overlay-area { flex: 1; overflow-y: auto; padding: 80px 20px 16px; display: flex; flex-direction: column; gap: 20px; scrollbar-width: none; }
        .overlay-area::-webkit-scrollbar { display: none; }
        .spacer { flex: 1; min-height: 50vh; }
        .msg-wolf { display: flex; flex-direction: column; gap: 6px; }
        .msg-wolf-text { font-size: 17px; line-height: 2.0; color: rgba(230, 210, 160, 0.92); white-space: pre-wrap; text-shadow: 0 1px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7); font-weight: 300; letter-spacing: 0.05em; }
        .msg-wolf-text.err { color: rgba(120, 100, 70, 0.7); font-style: italic; }
        .msg-user { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .msg-user-label { font-size: 10px; letter-spacing: 0.25em; color: rgba(120, 110, 150, 0.7); }
        .msg-user-text { font-size: 13px; color: rgba(160, 150, 190, 0.85); background: rgba(20, 16, 35, 0.6); border: 0.5px solid rgba(80, 60, 120, 0.4); border-radius: 12px 12px 0 12px; padding: 8px 14px; line-height: 1.7; text-align: right; max-width: 85%; backdrop-filter: blur(2px); }
        .typing { display: flex; gap: 5px; padding: 4px 0; }
        .typing span { width: 6px; height: 6px; border-radius: 50%; background: rgba(180, 150, 80, 0.6); animation: pulse 1.2s ease-in-out infinite; }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
        .input-area { display: flex; align-items: center; gap: 8px; padding: 12px 16px 28px; background: linear-gradient(to top, rgba(13,11,8,0.95) 60%, rgba(13,11,8,0.0)); flex-shrink: 0; }
        .text-input { flex: 1; background: rgba(20, 18, 12, 0.7); border: 0.5px solid rgba(60, 50, 30, 0.8); border-radius: 20px; padding: 10px 16px; color: #c8b888; font-size: 14px; font-family: 'Noto Serif JP', serif; outline: none; resize: none; line-height: 1.6; transition: border-color 0.2s; backdrop-filter: blur(4px); }
        .text-input:focus { border-color: #4a3c22; }
        .text-input::placeholder { color: rgba(80, 70, 45, 0.8); }
        .send-btn { width: 40px; height: 40px; border-radius: 50%; background: rgba(30, 26, 16, 0.8); border: 0.5px solid rgba(74, 60, 34, 0.8); color: #c8b888; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s; }
        .send-btn:hover { background: rgba(42, 36, 24, 0.9); }
        .send-btn:disabled { opacity: 0.3; cursor: default; }
        .save-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(20, 18, 12, 0.6); border: 0.5px solid rgba(60, 50, 30, 0.6); color: rgba(180, 150, 80, 0.6); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .save-btn:hover:not(:disabled) { background: rgba(30, 26, 16, 0.9); color: #c8a84a; border-color: rgba(100,80,40,0.6); }
        .save-btn:disabled { opacity: 0.25; cursor: default; }
        .save-btn.flash { color: #c8a84a; border-color: #c8a84a; }
        .panel-overlay { position: fixed; inset: 0; z-index: 300; display: flex; justify-content: center; }
        .panel-bg { position: absolute; inset: 0; background: rgba(5,4,3,0.5); backdrop-filter: blur(2px); }
        .panel { position: relative; margin: 0 auto; width: 100%; max-width: 480px; height: 100vh; background: rgba(9, 8, 5, 0.98); display: flex; flex-direction: column; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 16px; border-bottom: 0.5px solid rgba(80,60,30,0.25); flex-shrink: 0; }
        .panel-title { font-size: 12px; letter-spacing: 0.45em; color: rgba(180,155,95,0.65); font-weight: 300; }
        .panel-header-btns { display: flex; gap: 10px; align-items: center; }
        .new-btn { font-size: 11px; letter-spacing: 0.2em; color: rgba(180,155,95,0.6); background: rgba(30,26,16,0.5); border: 0.5px solid rgba(74,60,34,0.4); border-radius: 12px; padding: 5px 14px; cursor: pointer; transition: all 0.2s; }
        .new-btn:hover { color: #c8a84a; border-color: rgba(180,150,70,0.6); background: rgba(40,34,20,0.7); }
        .close-btn { width: 28px; height: 28px; border-radius: 50%; background: transparent; border: 0.5px solid rgba(80,60,30,0.35); color: rgba(140,115,65,0.6); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .close-btn:hover { background: rgba(30,26,16,0.6); color: rgba(200,180,120,0.8); }
        .panel-list { flex: 1; overflow-y: auto; padding: 16px 12px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: none; }
        .panel-list::-webkit-scrollbar { display: none; }
        .convo-item { padding: 14px 16px; border-radius: 8px; border: 0.5px solid rgba(80,60,30,0.25); background: rgba(18,16,10,0.7); cursor: pointer; transition: all 0.2s; display: flex; align-items: flex-start; gap: 10px; }
        .convo-item:hover { background: rgba(28,24,16,0.9); border-color: rgba(120,90,40,0.4); }
        .convo-item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .convo-date { font-size: 10px; letter-spacing: 0.2em; color: rgba(120,100,55,0.7); }
        .convo-preview { font-size: 13px; color: rgba(195,172,115,0.7); line-height: 1.65; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .delete-btn { width: 24px; height: 24px; background: transparent; border: none; color: rgba(90,70,40,0.45); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: color 0.2s; padding: 0; line-height: 1; margin-top: 1px; }
        .delete-btn:hover { color: rgba(180,70,50,0.75); }
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
        .empty-state-icon { font-size: 28px; opacity: 0.35; }
        .empty-state-text { font-size: 11px; letter-spacing: 0.4em; color: rgba(100,82,50,0.55); }
      `}</style>

      <img className="bg-image" src="/kokurou.jpg" alt="黒狼" />
      <div className="bg-gradient" />
      <div className="inft-badge">iNFT</div>
      <div className="wolf-title">黒 狼</div>

      <div className="top-right">
        <button className={`icon-btn${showPanel ? ' active' : ''}`} onClick={() => setShowPanel(p => !p)} title="記録の一覧">📜</button>
      </div>

      <div className="container">
        <div className="overlay-area">
          <div className="spacer" />
          {messages.map((msg, i) =>
            msg.role === 'wolf' ? (
              <div key={i} className="msg-wolf">
                <div className={`msg-wolf-text${msg.isError ? ' err' : ''}`}>{msg.text}</div>
              </div>
            ) : (
              <div key={i} className="msg-user">
                <div className="msg-user-label">問いかけ</div>
                <div className="msg-user-text">{msg.text}</div>
              </div>
            )
          )}
          {loading && <div className="msg-wolf"><div className="typing"><span /><span /><span /></div></div>}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <button className={`save-btn${saveFlash ? ' flash' : ''}`} onClick={handleSave} disabled={!hasContent || loading} title="この会話を記録する">
            {saveFlash ? '✓' : '🕯'}
          </button>
          <textarea className="text-input" rows={1} placeholder="問いかける…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>↑</button>
        </div>
      </div>

      {showPanel && (
        <div className="panel-overlay">
          <div className="panel-bg" onClick={() => setShowPanel(false)} />
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">記録の一覧</span>
              <div className="panel-header-btns">
                <button className="new-btn" onClick={handleNew}>新しい問答</button>
                <button className="close-btn" onClick={() => setShowPanel(false)}>✕</button>
              </div>
            </div>
            <div className="panel-list">
              {saved.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🌑</div>
                  <div className="empty-state-text">記録はまだない</div>
                </div>
              ) : saved.map(convo => (
                <div key={convo.id} className="convo-item" onClick={() => handleLoad(convo)}>
                  <div className="convo-item-content">
                    <div className="convo-date">{convo.savedAt}</div>
                    <div className="convo-preview">{convo.preview}</div>
                  </div>
                  <button className="delete-btn" onClick={e => handleDelete(convo.id, e)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
