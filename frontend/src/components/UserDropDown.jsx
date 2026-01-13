import React, { useState } from "react";
import  User2  from "../assets/User2.svg" // <-- update this path

export default function UserDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* User Icon */}
      <img
        src={User2}
        alt="User Icon"
        className="w-8 h-8 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full cursor-pointer"
        onClick={() => setOpen(!open)}
      />

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md overflow-hidden z-50">
          <div className="px-4 py-2 text-sm text-gray-800 border-b">
            Radhika Tayal
          </div>
          <button
            onClick={() => {
              console.log("Sign Out clicked");
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}



