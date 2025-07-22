import React from "react";
import { FaPaperPlane } from 'react-icons/fa';
import "./ChatFabButton.css";

export default function ChatFabButton({ onClick }) {
  return (
    <button className="chat-fab-new" onClick={onClick} aria-label="Открыть чат">
      <FaPaperPlane size={28} color="#fff" />
    </button>
  );
} 