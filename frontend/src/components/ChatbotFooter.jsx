import React from 'react';
// Assuming these paths are correct
import AiLogo from '../assets/iAI.png';
import Expand from '../assets/Expand.svg';

const ChatbotFooter = () => {
  return (
    // 1. Base (Mobile) Styles: Smaller padding, smaller text.
    // 2. sm: (Tablet/Desktop) Styles: Increased size for desktop.
    <div className="
        fixed bottom-3 right-3 z-50 
        flex items-center 
        px-2 py-1 sm:px-3 sm:py-[6px] 
        bg-white border border-gray-300 rounded-lg shadow-lg 
        text-[10px] sm:text-[11px] 
        font-medium font-mazda
    ">
      
      {/* Text: Adjusts whitespace to prevent wrapping on tiny screens */}
      <span className="
          mr-1 sm:mr-2 
          text-gray-800 
          whitespace-nowrap
      ">
        Chatbot Powered by
      </span>
      
      {/* Ai Logo: Adjusts height */}
      <img 
        src={AiLogo} 
        alt="iAi" 
        className="h-4 sm:h-[18px] mr-1 sm:mr-2" 
      />
      
      {/* Expand Icon: Adjusts height */}
      <img 
        src={Expand} 
        alt="Expand" 
        className="h-3 sm:h-[14px] opacity-70" 
      />
    </div>
  );
};

export default ChatbotFooter;