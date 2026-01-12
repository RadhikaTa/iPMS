import React, { useState } from 'react';
import Tip from "../assets/Tip.svg";
import Idle from "../assets/Idle.png";
import PreIdle from "../assets/PreIdle.png";

const VOROrder = () => {
  const [orderData, setOrderData] = useState([
    { line: 1, partNumber: "VC67V3440", orderQty: 7, description: "Splash Guards, Front & Rear", remark: "", iaiTips: Tip },
    { line: 2, partNumber: "000018F287", orderQty: 4, description: "SPARK PLUG", remark: "", iaiTips: Idle },
    { line: 3, partNumber: "0000110H7", orderQty: 1, description: "BULB,LOW BEAM", remark: "", iaiTips: Tip },
    { line: 4, partNumber: "N244V3010", orderQty: 2, description: "BLACK FILM 4 RR BMPR", remark: "", iaiTips: PreIdle },
    { line: 5, partNumber: "AJB4132211", orderQty: 4, description: "GSKT, SURGE TANK, GRILL", remark: "", iaiTips: Tip }
  ]);

  const handleQtyChange = (index, value) => {
    const newData = [...orderData];
    newData[index].orderQty = parseInt(value) || 0;
    setOrderData(newData);
  };

  const handleRemarkChange = (index, value) => {
    const newData = [...orderData];
    newData[index].remark = value;
    setOrderData(newData);
  };

  return (

    
    <div className="px-4 sm:px-6 lg:px-8 py-6 bg-[#ECEFF1] min-h-screen font-mazda text-sm">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-4">
        {/* Left Input Section */}
        <div className="flex-1">
          <label className="block text-[13px] font-semibold tracking-wider mb-1">ORDER NUMBER:</label>
          <input
            type="text"
            className="w-full max-w-sm h-[36px] border border-gray-300 rounded-[3px] px-3 text-[13px]"
            placeholder="Enter order number"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="bluebgColour rounded-[3px] text-white font-semibold text-[13px] px-5 py-1.5 hover:bg-blue-900">ADD</button>
            <button className="border border-black rounded-[3px] font-semibold text-[13px] px-5 py-1.5 hover:bg-gray-100">DELETE</button>
          </div>
        </div>

        {/* Right Button + Legend Section */}
        <div className="flex flex-col items-start lg:items-end gap-14">
          <button className="bluebgColour rounded-[3px] text-white text-[13px] px-4 py-2 font-medium uppercase tracking-wider w-full lg:w-auto hover:bg-blue-900">
            Load Data File
          </button>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="text-black font-semibold">LEGENDS:</span>
            <span className="flex items-center gap-1">TIPS <img src={Tip} alt="Tips" className="w-4 h-4" /></span>
            <span className="flex items-center gap-1">PRE IDLE <img src={PreIdle} alt="PreIdle" className="w-4 h-4" /></span>
            <span className="flex items-center gap-1">IDLE <img src={Idle} alt="Idle" className="w-4 h-4" /></span>
          </div>
        </div>
      </div>

      {/* Table */}
      {/* ORDER TABLE */}
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
        <table className="w-full min-w-[1200px] text-xs border-collapse font-sans">
 
          {/* TABLE HEADER */}
          <thead>
            <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
              {[
                "✓",
                "Line",
                "Part Number",
                "Order Qty",
                "Description",
                "Sales Order",
                "Alloc Qty",
                "B/O Qty",
                "Remark",
                "iAI Tips",
              ].map((heading, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap bg-[#2953CD] ${heading === "✓" || heading === "iAI Tips" ? "text-center" : "text-left"
                    }`}
                >
                  <div
                    className={`flex items-center gap-2 ${heading === "✓" || heading === "iAI Tips"
                        ? "justify-center"
                        : "justify-start"
                      }`}
                  >
                    <span
                      className={heading === "Part Number" ? "underline cursor-pointer" : ""}
                    >
                      {heading}
                    </span>
                    {heading !== "✓" && (
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
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
 
          {/* TABLE BODY */}
          <tbody className="bg-white">
            {orderData.map((item, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"
                  } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
              >
                {/* Checkbox */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#2953CD] cursor-pointer"
                  />
                </td>
 
                {/* Line */}
                <td className="px-4 py-3 text-center">
                  <input
                    readOnly
                    value={item.line}
                    className="w-full h-[32px] rounded border border-gray-300 text-center text-[#101010] bg-white focus:outline-none"
                  />
                </td>
 
                {/* Part Number */}
                <td className="px-4 py-3">
                  <input
                    readOnly
                    value={item.partNumber}
                    className="w-full h-[32px] rounded border border-gray-300 text-center text-[#101010] bg-white focus:outline-none"
                  />
                </td>
 
                {/* Order Qty */}
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.orderQty}
                    onChange={(e) => handleQtyChange(index, e.target.value)}
                    className="w-full h-[32px] rounded border border-gray-300 text-center focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* Description */}
                <td className="px-4 py-3">
                  <input
                    readOnly
                    value={item.description}
                    className="w-full h-[32px] rounded border border-gray-300 px-2 bg-white focus:outline-none"
                  />
                </td>
 
                {/* Sales Order */}
                <td className="px-4 py-3">
                  <input className="w-full h-[32px] rounded border border-gray-300 px-2 focus:ring-1 focus:ring-[#2953CD] focus:outline-none" />
                </td>
 
                {/* Alloc Qty */}
                <td className="px-4 py-3">
                  <input
                    defaultValue="0"
                    className="w-full h-[32px] rounded border border-gray-300 text-center focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* B/O Qty */}
                <td className="px-4 py-3">
                  <input
                    defaultValue="0"
                    className="w-full h-[32px] rounded border border-gray-300 text-center focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* Remark */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => handleRemarkChange(index, e.target.value)}
                    className="w-full h-[32px] rounded border border-gray-300 px-2 focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* iAI Tips */}
                <td className="px-4 py-3 text-center">
                  {item.iaiTips ? (
                    <img
                      src={item.iaiTips}
                      alt="tip"
                      className="w-4 h-4 mx-auto"
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-center flex-wrap gap-4 mt-6 text-[11px] font-semibold uppercase">
        <button className="bluebgColour rounded-[3px] text-white text-[13px] px-5 py-1.5 hover:bg-blue-900">Place Order</button>
        <button className="border border-black rounded-[3px] px-5 py-1.5 text-[13px] hover:bg-gray-100">Save</button>
        <button className="border border-black rounded-[3px] px-5 py-1.5 text-[13px] hover:bg-gray-100">Reset</button>
        <button className="border border-black rounded-[3px] px-5 py-1.5 text-[13px] hover:bg-gray-100">Print</button>
      </div>
    </div>
  );
};

export default VOROrder;
