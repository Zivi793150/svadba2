import React from "react";
import "./SideFireworks.css";

const sparksLeft = Array.from({ length: 5 });
const sparksRight = Array.from({ length: 5 });

export default function SideFireworks() {
  return (
    <>
      <div className="side-fireworks left">
        {sparksLeft.map((_, i) => (
          <div className={`spark spark-${i + 1}`} key={i} />
        ))}
      </div>
      <div className="side-fireworks right">
        {sparksRight.map((_, i) => (
          <div className={`spark spark-${i + 1}`} key={i} />
        ))}
      </div>
    </>
  );
} 