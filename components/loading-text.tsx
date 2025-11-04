import { useEffect, useState } from "react";

export const LoadingText = () => {
  return (
    <span className="inline-flex items-center">
      추천 받는 중
      <span className="loading-dots ml-1">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
      <style jsx>{`
        .loading-dots {
          display: inline-flex;
        }
        
        .dot {
          opacity: 0;
          animation: loadingDot 1.4s infinite;
          margin-left: 1px;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes loadingDot {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
};