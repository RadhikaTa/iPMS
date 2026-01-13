import React from 'react';

const Footer = () => {
  return (
    // 1. Footer Container: 
    // - Use slightly more padding (py-3) on mobile, then return to py-4 on md screens.
    // - Use text-xs (12px) on mobile and text-sm (14px) on desktop for better hierarchy.
    <footer className="w-full h-[50px] bg-[#263238] text-[#FFFFFF] text-xs md:text-sm font-mazda px-4 py-3 md:py-4">
      
      {/* 2. Content Container: 
          - flex-col (default) for stacking on mobile.
          - md:flex-row for side-by-side layout on larger screens.
          - justify-center and items-center ensure perfect alignment.
      */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center leading-relaxed">
        
        {/* Copyright Text */}
        <span className='Open Sans text-[12px] '>
          Copyright &copy;{new Date().getFullYear()}  | All Rights Reserved by InterraIT
        </span>
        
        {/* Separator: Still hidden on small screens, shown on md and up */}
        {/* <span className="hidden md:inline-block">|</span> */}
        
        {/* Help Link */}
        {/* <span>
          Need help?{' '}
          <a
            href="#"
            className="underline hover:text-white transition-colors duration-200"
          >
            Contact Support
          </a>
        </span> */}
      </div>
    </footer>
  );
};

export default Footer;