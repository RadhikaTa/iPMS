import React from 'react';
import AiLogo from '../assets/iAI.png';
import Expand from '../assets/Expand.svg';

const ChatbotFooter = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center px-3 py-[6px] bg-white border border-gray-300 rounded-md shadow-md text-[11px] font-medium font-mazda">
      <span className="mr-2 text-gray-800 whitespace-nowrap">Chatbot Powered by</span>
      <img src={AiLogo} alt="iAi" className="h-[18px] mr-2" />
      <img src={Expand} alt="Expand" className="h-[14px] opacity-70" />
    </div>
  );
};

export default ChatbotFooter;
