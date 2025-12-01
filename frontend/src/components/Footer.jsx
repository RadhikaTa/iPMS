import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#2B2B2B] text-[#888888] text-[13px] font-mazda px-4 py-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center text-sm leading-relaxed">
        <span>©2024 MAZDA NORTH AMERICAN OPERATIONS. ALL RIGHTS RESERVED.</span>
        <span className="hidden md:inline-block">|</span>
        <span>
          Need help?{' '}
          <a
            href="#"
            className="underline hover:text-white transition-colors duration-200"
          >
            Contact Support
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
