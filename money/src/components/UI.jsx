import React from 'react'

export default function UI({ wind, onToggleWind, onReset }) {
  return (
    <div className="toolbar">
      <button
        className={`toolbar-btn ${wind ? 'active' : ''}`}
        onClick={onToggleWind}
      >
        {wind ? '🌬️ 停风' : '🌬️ 吹风'}
      </button>
      <button className="toolbar-btn" onClick={onReset}>
        ↺ 重置
      </button>
      <style>{`
        .toolbar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
          border: 1px solid rgba(255,255,255,0.6);
          z-index: 100;
        }
        .toolbar-btn {
          padding: 8px 20px;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.8);
          color: #333;
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .toolbar-btn:hover {
          background: rgba(255,255,255,1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .toolbar-btn:active {
          transform: scale(0.97);
        }
        .toolbar-btn.active {
          background: #1a7a3a;
          color: white;
          border-color: #15632f;
        }
        .toolbar-btn.active:hover {
          background: #1a8a42;
        }
      `}</style>
    </div>
  )
}
