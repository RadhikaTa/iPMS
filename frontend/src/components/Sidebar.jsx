import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
        { label: 'Part Numbers Quantity Prediction', path: '/part-numbers-quantity-prediction' },
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

  return (
    <>
      {/* Hamburger Icon - Mobile */}
      <button
        className="md:hidden fixed top-[70px] left-0 z-30 p-3 bg-[#2B2B2B] text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-[90px] left-0 w-[220px] h-[calc(100vh-90px)] bg-[#2B2B2B] z-20 font-mazda overflow-y-auto shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}
      >
        {sections.map((section, i) => (
          <div key={i}>
            <div className="h-[55px] flex items-center px-5 text-[13px] font-bold text-white uppercase border-b border-[#3A3A3A] tracking-widest">
              {section.title}
            </div>
            <div className="flex flex-col">
              {section.items.map((item, j) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.label === 'Suggested Stocks' && location.pathname === '/');

                return (
                  <button
                    key={j}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className={`text-left text-[13px] font-medium tracking-wide px-6 py-3 transition-all
                      ${
                        isActive
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
      </aside>
    </>
  );
};

export default Sidebar;
