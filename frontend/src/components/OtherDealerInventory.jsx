import React from "react";
import { Link } from "react-router-dom";

const OtherDealerInventory = ({ onBack }) => {
  const dealerInventoryData = [
    {
      dealer: "40206",
      partNumber: "BCKAV3650",
      description: "WESTCOTT MAZDA",
      address: "2800 NATIONAL CITY BLVD. NATIONAL CIT , CA 91950",
      phone: "619-474-1591",
      qty: 1,
    },
    {
      dealer: "42076",
      partNumber: "BCKAV3650",
      description: "MAZDA OF EVERETT",
      address: "11409 HIGHWAY 99 EVERETT , WA 98204",
      phone: "425-353-3403",
      qty: 1,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#F5F5F5] min-h-screen">
      {/* Back Link */}
      <div className="mb-2">
        <button
          className="text-[10px] text-black font-bold tracking-widest underline"
          onClick={() => onBack()}
        >
          <Link to="/inquire-parts-orders">RETURN TO INQUIRE PARTS ORDERS</Link>
        </button>
      </div>

      {/* Header */}
      <h2 className="uppercase font-bold text-[13px] tracking-wide mb-4 text-[#101010]">
        Other Dealer Inventory
      </h2>

      {/* Table */}
      {/* DEALER INVENTORY TABLE – MASTER STYLE */}
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
        <table className="w-full min-w-[1000px] text-xs border-collapse font-sans">
 
          {/* HEADER */}
          <thead>
            <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
              {[
                "Dealer",
                "Part Number",
                "Description / Dealership",
                "Address",
                "Phone",
                "QTY",
              ].map((heading, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap bg-[#2953CD] text-left"
                >
                  <div className="flex items-center gap-2">
                    <span>{heading}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3 h-3 opacity-80"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
 
          {/* BODY */}
          <tbody className="bg-white">
            {dealerInventoryData.map((item, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"
                  } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
              >
                <td className="px-4 py-3 text-[#101010] font-medium">
                  {item.dealer}
                </td>
 
                <td className="px-4 py-3 text-[#101010]">
                  {item.partNumber}
                </td>
 
                <td className="px-4 py-3 text-[#101010]">
                  {item.description}
                </td>
 
                <td className="px-4 py-3 text-[#101010]">
                  {item.address}
                </td>
 
                <td className="px-4 py-3 text-[#101010] whitespace-nowrap">
                  {item.phone}
                </td>
 
                <td className="px-4 py-3 text-center font-semibold">
                  {item.qty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#101010] gap-3">
        <span className="ml-1">SHOWING 1 TO 2 OF 2 ENTRIES</span>
        <div className="flex gap-1 flex-wrap items-center sm:mr-1">
          {["◅", 1, 2, 3, 4, 5, "▻"].map((item, idx) => (
            <button
              key={idx}
              className={`px-[7px] py-[2px] border border-gray-400 text-[#101010] ${
                item === 1 ? "bg-[#2B2B2B] text-white font-bold" : "bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OtherDealerInventory;
