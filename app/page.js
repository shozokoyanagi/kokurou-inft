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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0d0b08;
          font-family: 'Noto Serif JP', serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          width: 100%;
          max-width: 480px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0d0b08;
        }
        .header {
          position: relative;
          height: 260px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .header-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          filter: grayscale(15%) contrast(1.1) brightness(0.6);
        }
        .header-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(13,11,8,0.2) 0%, rgba(13,11,8,0.0) 40%, rgba(13,11,8,0.9) 100%);
        }
        .header-info {
          position: absolute;
          bottom: 16px;
          left: 0; right: 0;
          text-align: center;
        }
        .wolf-name {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 0.5em;
          color: #e8dfc0;
        }
        .wolf-state {
          font-size: 11px;
          letter-spacing: 0.3em;
          color: #7a6a45;
          margin-top: 4px;
        }
        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
        }
        .chat-area::-webkit-scrollbar { display: none; }
        .msg-row { display: flex; flex-direction: column; }
        .msg-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #4a4030;
          margin-bottom: 5px;
        }
        .msg-row.user .msg-label { text-align: right; }
        .bubble {
          max-width: 82%;
          padding: 10px 14px;
          line-height: 1.9;
          font-size: 14px;
          white-space: pre-wrap;
        }
        .msg-row.wolf .bubble {
          align-self: flex-start;
          background: #1c1810;
          border: 0.5px solid #3a3020;
          border-radius: 0 12px 12px 12px;
          color: #c8b888;
        }
        .msg-row.user .bubble {
          align-self: flex-end;
          background: #181624;
          border: 0.5px solid #302840;
          border-radius: 12px 12px 0 12px;
          color: #9890b8;
        }
        .bubble.err { color: #5a5040 !important; font-style: italic; }
        .msg-time {
          font-size: 10px;
          color: #3a3020;
          margin-top: 4px;
          font-family: monospace;
        }
        .msg-row.user .msg-time { text-align: right; }
        .typing {
          display: flex;
          gap: 5px;
          padding: 12px 16px;
          align-self: flex-start;
          background: #1c1810;
          border: 0.5px solid #3a3020;
          border-radius: 0 12px 12px 12px;
        }
        .typing span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6a5a35;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .input-area {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px 20px;
          border-top: 0.5px solid #1e1a12;
          flex-shrink: 0;
        }
        .text-input {
          flex: 1;
          background: #141210;
          border: 0.5px solid #2a2418;
          border-radius: 20px;
          padding: 10px 16px;
          color: #c8b888;
          font-size: 14px;
          font-family: 'Noto Serif JP', serif;
          outline: none;
          resize: none;
          line-height: 1.6;
          transition: border-color 0.2s;
        }
        .text-input:focus { border-color: #4a3c22; }
        .text-input::placeholder { color: #3a3020; }
        .send-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #1e1a10;
          border: 0.5px solid #4a3c22;
          color: #c8b888;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .send-btn:hover { background: #2a2418; }
        .send-btn:disabled { opacity: 0.3; cursor: default; }
      `}</style>

      <div className="container">
        <div className="header">
          <img className="header-img" src="/kokurou.jpg" alt="黒狼" />
          <div className="header-overlay" />
          <div className="header-info">
            <div className="wolf-name">黒 狼</div>
            <div className="wolf-state">◉ 初期状態</div>
          </div>
        </div>

        <div className="chat-area">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              <div className="msg-label">{msg.role === 'wolf' ? '黒狼' : '問いかけ'}</div>
              <div className={`bubble${msg.isError ? ' err' : ''}`}>{msg.text}</div>
              <div className="msg-time">{msg.time}</div>
            </div>
          ))}
          {loading && (
            <div className="msg-row wolf">
              <div className="msg-label">黒狼</div>
              <div className="typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <textarea
            className="text-input"
            rows={1}
            placeholder="問いかける…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>↑</button>
        </div>
      </div>
    </>
  )
}
