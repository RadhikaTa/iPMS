import React from 'react';
import iAI from '../assets/iAI.png';
import UserIcon from '../assets/user-icon.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSidebar } from './MainLayout';
import User2 from '../assets/User2.svg';
import InterraIT_NEW from '../assets/InterraIT_NEW.png';
import { ChevronDown } from 'lucide-react';
import UserDropdown from './UserDropDown';

// Sidebar sections
// const sections = [
//   {
//     title: 'PARTS ORDER',
//     items: [
//       { label: 'Suggested Stocks', path: '/' },
//       { label: 'iAI Prediction', path: '/part-numbers-quantity-prediction' },
//       { label: 'Inquire Availability', path: '/inquire-availability' },
//       { label: 'VOR Order', path: '/vor-order' },
//       { label: 'Order Inquiry', path: '/order-inquiry' },
//       { label: 'Stock Order', path: '/stock-order' },
//       { label: 'View Stock Order', path: '/view-stock-order' },
//       { label: 'Manage Backorders', path: '/manage-backorders' },
//       { label: 'Inquire Parts Orders', path: '/inquire-parts-orders' },
//     ],
//   },
//   { title: 'PARTS RETURN', items: [] },
//   { title: 'VEHICLE ORDER', items: [] },
//   { title: 'SALES', items: [] },
//   { title: 'INCENTIVES', items: [] },
//   { title: 'SERVICE', items: [] },
//   { title: 'CLAIM AUTHORIZATION', items: [] },
//   { title: 'MARKETING / CUSTOMER', items: [] },
// ];

const Header = () => {
  // const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  // Current dealer code
  const currentDealerCode = localStorage.getItem("dealerCode") || "10131";

  return (
    <>
      {/* ===== Header Bar ===== */}
      <header className="w-full h-[70px] bluebgColour flex items-center justify-between px-4 md:px-6 lg:px-8 shadow-sm fixed top-0 left-0 right-0 z-30">

        {/* Left: Logo */}
        <div className="flex items-start h-full">
          <img
            src={InterraIT_NEW}
            alt="Interra Logo"
            className="bg-white rounded-bl-[10px] rounded-br-[10px]  object-contain
                 w-[130px] h-[50px] lg:w-[200px] lg:h-[56px]  sm:px-1 sm:py-1 px-4 py-2"
          />
        </div>

        {/* Center / Left: App Title */}
        <div className="flex justify-center lg:justify-start ml-[20px] lg:ml-[30px]">
          <h1 className="font-sans font-bold text-[24px] tracking-[1.5px] text-white">
            iPMS
          </h1>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto">
          {/* Dealer Selector */}
          <div className="relative inline-flex items-center text-white text-sm uppercase font-mazda cursor-pointer">
            

            <span className="relative inline-flex items-center ml-2">
              {/* Invisible select */}
              <select
                value={currentDealerCode}
                onChange={(e) => {
                  localStorage.setItem("dealerCode", e.target.value);
                  window.location.reload();
                }}
                className="absolute inset-0 opacity-0 cursor-pointer text-black"
              >
                <option value="10131">10131</option>
                <option value="23454">23454</option>
                <option value="23925">23925</option>
                <option value="34318">34318</option>
                <option value="51485">51485</option>
                <option value="83314">83314</option>
              </select>

              {/* Visible icon */}
              <ChevronDown size={16} className="text-white" />
            </span>
          </div>

          {/* User Icon */}
          <UserDropdown />
        </div>

      </header>

      {/* ===== Sidebar ===== */}
      {/* <aside
        className={`fixed top-[70px] left-0 h-full bg-[#2D3C50] z-20 font-mazda overflow-y-auto shadow-lg transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full md:translate-x-0 md:w-0'}`}
      >
        {isSidebarOpen && (
          <div className="w-[220px]">
            {sections.map((section, index) => (
              <div key={index}>
                
                <div className="h-[55px] flex items-center px-5 text-[13px] font-bold text-[#969EA8] border-b border-[#3A3A3A] tracking-widest">
                  {section.title}
                </div>

                <div className="flex flex-col">
                  {(section.items || []).map((item, idx) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.label === 'Suggested Stocks' && location.pathname === '/');

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(item.path);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={`text-left text-[13px] font-medium tracking-wide px-6 py-3 transition-all
                          ${isActive
                            ? 'bg-[#6C7785] text-white'
                            : 'text-white/60 hover:bg-[#3b3b3b] hover:text-white'
                          }`}
                      >
                        • {item.label}
                      </button>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}
      </aside> */}
    </>
  );
};

export default Header;
