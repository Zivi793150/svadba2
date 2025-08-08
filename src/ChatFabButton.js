import React from "react";
import { FaPaperPlane } from 'react-icons/fa';
import "./ChatFabButton.css";

export default function ChatFabButton({ onClick, hasNewMsg }) {
  return (
    <button
      className="chat-fab-new"
      onClick={onClick}
      aria-label="Открыть чат"
    >
      <FaPaperPlane size={28} color="#fff" />
      {hasNewMsg && <span style={badgeStyle} />}
    </button>
  );
}

const badgeStyle = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: '#ff3b3b',
  border: '2px solid #fff',
  boxShadow: '0 0 6px #ff3b3b',
  zIndex: 2,
}; 