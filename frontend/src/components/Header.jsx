import React from 'react';
// import MazdaLogo from '../assets/MazdaLogo.png';
import iAI from '../assets/iAI.png';
import UserIcon from '../assets/user-icon.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSidebar } from './MainLayout'; // Import context

// Corrected sections structure
const sections = [
  {
    title: 'PARTS ORDER',
    items: [
      { label: 'Suggested Stocks', path: '/' },
      { label: 'Inquire Availability', path: '/inquire-availability' },
      { label: 'VOR Order', path: '/vor-order' },
      { label: 'Order Inquiry', path: '/order-inquiry' },
      { label: 'Stock Order', path: '/stock-order' },
      { label: 'View Stock Order', path: '/view-stock-order' },
      { label: 'Manage Backorders', path: '/manage-backorders' },
      { label: 'Inquire Parts Orders', path: '/inquire-parts-orders' },
    ],
  },
  { title: 'PARTS RETURN', items: [] },
  { title: 'VEHICLE ORDER', items: [] },
  { title: 'SALES', items: [] },
  { title: 'INCENTIVES', items: [] },
  { title: 'SERVICE', items: [] },
  { title: 'CLAIM AUTHORIZATION', items: [] },
  { title: 'MARKETING / CUSTOMER', items: [] },
];

const Header = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  // 💡 FIX: Read the stored dealer code from localStorage
  // Use the stored value, or default to "10131" if none is set yet
  const currentDealerCode = localStorage.getItem("dealer_code") || "10131"; 

  return (
    <>
      {/* ===== Header Bar ===== */}
      <header className="w-full h-[70px] bg-[#2B2B2B] flex items-center justify-between px-4 md:px-6 lg:px-8 shadow-sm z-30 fixed top-0 left-0 right-0">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Hamburger */}
          <button
            className="text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mazda Logo and Title */}
          <img
            src={iAI}
            alt="Mazda Logo"
            className="w-10 h-5 md:w-[50px] md:h-[30px] lg:w-[50px] lg:h-[30px]"
          />
          <h1 className="text-white text-[18px] md:text-[22px] lg:text-[26px] font-bold font-mazda leading-none">
            iPMS
          </h1>
        </div>

        {/* Right: User Info */}
        <div className="flex items-center gap-3 md:gap-4 ">
          <div className=" text-white font-mazda uppercase text-sm text-center leading-tight">
            Radhika Tayal
            <br />
            <span className="text-black ">
              <select
                // 💡 FIX: Set the value to the retrieved code from localStorage
                value={currentDealerCode}
                onChange={(e) => {
                  localStorage.setItem("dealer_code", e.target.value);
                  window.location.reload(); // reloads the app with the selected dealer
                }}
              >
                <option value="10131">10131</option>
                <option value="23454">23454</option>
                <option value="23925">23925</option>
                <option value="34318">34318</option>
                <option value="51485">51485</option>
                <option value="83314">83314</option>
              </select>
            </span>
          </div>
          <img
            src={UserIcon}
            alt="User Icon"
            className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] lg:w-[26px] lg:h-[26px]"
          />
        </div>
      </header>

      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed top-[70px] left-0 h-full bg-[#2B2B2B] z-20 font-mazda overflow-y-auto shadow-lg transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full md:translate-x-0 md:w-0'}`}
      >
        {isSidebarOpen && (
          <div className="w-[220px]">
            {sections.map((section, i) => (
              <div key={i}>
                <div className="h-[55px] flex items-center px-5 text-[13px] font-bold text-white uppercase border-b border-[#3A3A3A] tracking-widest">
                  {section.title}
                </div>

                <div className="flex flex-col">
                  {(section.items || []).map((item, j) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.label === 'Suggested Stocks' && location.pathname === '/');

                    return (
                      <button
                        key={j}
                        onClick={() => {
                          navigate(item.path);
                          if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile
                        }}
                        className={`text-left text-[13px] font-medium tracking-wide px-6 py-3 transition-all
                          ${isActive
                            ? 'bg-[#464646] text-white'
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
      </aside>
    </>
  );
};

export default Header;