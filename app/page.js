'use client'
import { useState, useRef, useEffect } from 'react'

function getTime() {
  const n = new Date()
  return n.getHours().toString().padStart(2, '0') + ':' + n.getMinutes().toString().padStart(2, '0')
}

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'wolf', text: '……遅いな。', time: getTime() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', text, time: getTime() }])
    const newHistory = [...history, { role: 'user', content: text }]
    setHistory(newHistory)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'wolf', text: data.reply, time: getTime() }])
      setHistory(prev => [...prev, { role: 'assistant', content: data.reply }].slice(-20))
    } catch (e) {
      setMessages(prev => [...prev, { role: 'wolf', text: '…………', time: getTime(), isError: true }])
      setHistory(prev => prev.slice(0, -1))
    }
    setLoading(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); send()
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #0d0b08; font-family: 'Noto Serif JP', serif; }
        .inft-badge { position: fixed; top: 16px; left: 16px; background: #c8a84a; color: #0d0b08; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; padding: 4px 10px; border-radius: 4px; z-index: 100; }
        .wolf-title { position: fixed; top: 12px; left: 0; right: 0; text-align: center; font-size: 22px; font-weight: 300; letter-spacing: 0.5em; color: #e04040; z-index: 100; pointer-events: none; }
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
        .input-area { display: flex; align-items: center; gap: 10px; padding: 12px 16px 28px; background: linear-gradient(to top, rgba(13,11,8,0.95) 60%, rgba(13,11,8,0.0)); flex-shrink: 0; }
        .text-input { flex: 1; background: rgba(20, 18, 12, 0.7); border: 0.5px solid rgba(60, 50, 30, 0.8); border-radius: 20px; padding: 10px 16px; color: #c8b888; font-size: 14px; font-family: 'Noto Serif JP', serif; outline: none; resize: none; line-height: 1.6; transition: border-color 0.2s; backdrop-filter: blur(4px); }
        .text-input:focus { border-color: #4a3c22; }
        .text-input::placeholder { color: rgba(80, 70, 45, 0.8); }
        .send-btn { width: 40px; height: 40px; border-radius: 50%; background: rgba(30, 26, 16, 0.8); border: 0.5px solid rgba(74, 60, 34, 0.8); color: #c8b888; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s; }
        .send-btn:hover { background: rgba(42, 36, 24, 0.9); }
        .send-btn:disabled { opacity: 0.3; cursor: default; }
      `}</style>

      <img className="bg-image" src="/kokurou.jpg" alt="黒狼" />
      <div className="bg-gradient" />
      <div className="inft-badge">iNFT</div>
      <div className="wolf-title">黒 狼</div>

      <div className="container">
        <div className="overlay-area">
          <div className="spacer" />
          {messages.map((msg, i) => (
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
          ))}
          {loading && (
            <div className="msg-wolf">
              <div className="typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="input-area">
          <textarea className="text-input" rows={1} placeholder="問いかける…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>↑</button>
        </div>
      </div>
    </>
  )
}