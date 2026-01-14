import React, { useState } from "react";
import Tip from "../assets/Tip.svg";
import Idle from "../assets/Idle.png";
import PreIdle from "../assets/PreIdle.png";
import { Link } from "react-router-dom";

const StockOrder = () => {
  const [orderData, setOrderData] = useState([
    {
      line: "0001",
      partNumber: "AJB4132211",
      orderQty: 4,
      description: "GSKT, SURGE TANK, GRILL",
      remark: "",
      iaiTips: Tip,
    },
    {
      line: "0002",
      partNumber: "N244V3010",
      orderQty: 2,
      description: "BLACK FILM 4 RR BMPR",
      remark: "",
      iaiTips: Idle,
    },
    {
      line: "0003",
      partNumber: "0000110H7",
      orderQty: 1,
      description: "BULB,LOW BEAM",
      remark: "",
      iaiTips: "",
    },
    {
      line: "0004",
      partNumber: "000018F287",
      orderQty: 4,
      description: "SPARK PLUG",
      remark: "",
      iaiTips: PreIdle,
    },
    {
      line: "0005",
      partNumber: "VC67V3440",
      orderQty: 7,
      description: "Splash Guards, Front & Rear",
      remark: "",
      iaiTips: "",
    },
  ]);

  const handleChange = (index, key, value) => {
    const updated = [...orderData];
    updated[index][key] = value;
    setOrderData(updated);
  };

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#F5F5F5] min-h-screen relative">
      {/* ORDER NUMBER */}
       <Link to="/" className="font-bold text-sm p-3 underline">
          RETURN TO DASHBOARD
        </Link>
        <br />
        <br />
      <div className="mb-6">
        <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
          Order Number:
        </label>
        <input
          type="text"
          placeholder="Enter order number"
          className="border border-[#CCCCCC] rounded-[3px] text-[#999999] px-4 py-2 w-full sm:w-[250px] outline-none"
        />
      </div>

      {/* ADD & DELETE BUTTONS */}
      <div className="mb-4 flex flex-wrap gap-4">
        <button className="rounded-[3px] text-[13px] px-4 py-2 bluebgColour text-white uppercase hover:bg-blue-900">Add</button>
        <button className="border border-black rounded-[3px] text-[13px] px-4 py-2 uppercase">Delete</button>
      </div>

      {/* LEGENDS */}
      <div className="mb-4 flex flex-wrap justify-end items-center gap-2 text-[11px]">
        <span className="text-[#6B7280] uppercase tracking-wide mr-2">LEGENDS:</span>
        {[{ label: "Tips", icon: Tip }, { label: "Pre Idle", icon: PreIdle }, { label: "Idle", icon: Idle }].map(
          (legend, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 border border-[#D1D5DB] rounded-full px-2 py-1 bg-white"
            >
              <span className="text-black">{legend.label}</span>
              <img src={legend.icon} alt={legend.label} className="w-[14px] h-[14px]" />
            </span>
          )
        )}
      </div>

      {/* TABLE */}
      {/* ORDER TABLE – MASTER STYLE */}
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
        <table className="w-full min-w-[1000px] text-xs border-collapse font-sans">
 
          {/* HEADER */}
          <thead className="h-[66px">
            <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
              {[
                "✔",
                "Line",
                "Part Number",
                "Order Qty",
                "Description",
                "Remark",
                "iAI Tips",
              ].map((heading, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap bg-[#2953CD] ${heading === "✔" || heading === "iAI Tips"
                      ? "text-center"
                      : "text-left"
                    }`}
                >
                  <div
                    className={`flex items-center gap-2 ${heading === "✔" || heading === "iAI Tips"
                        ? "justify-center"
                        : "justify-start"
                      }`}
                  >
                    <span>{heading}</span>
                    {heading !== "✔" && (
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
 
          {/* BODY */}
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
                    type="text"
                    value={item.line}
                    onChange={(e) => handleChange(index, "line", e.target.value)}
                    className="w-full h-[32px] rounded border border-gray-300 text-center focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* Part Number */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.partNumber}
                    onChange={(e) =>
                      handleChange(index, "partNumber", e.target.value)
                    }
                    className="w-full h-[32px] rounded border border-gray-300 text-center focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* Order Qty */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    value={item.orderQty}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "orderQty",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full h-[32px] rounded border border-gray-300 text-center focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* Description */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleChange(index, "description", e.target.value)
                    }
                    className="w-full h-[32px] rounded border border-gray-300 px-2 focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* Remark */}
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) =>
                      handleChange(index, "remark", e.target.value)
                    }
                    className="w-full h-[32px] rounded border border-gray-300 px-2 focus:ring-1 focus:ring-[#2953CD] focus:outline-none"
                  />
                </td>
 
                {/* iAI Tips */}
                <td className="px-4 py-3 text-center">
                  {item.iaiTips ? (
                    <img
                      src={item.iaiTips}
                      alt="Tips"
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
 

      {/* BOTTOM ACTION BUTTONS */}
      <div className="mt-8 flex justify-center flex-wrap gap-4 sm:gap-6 text-[11px] font-semibold uppercase">
        <button className="bluebgColour rounded-[3px] text-[13px] text-white px-6 py-2 hover:bg-blue-900">Place Order</button>
        <button className="border border-black rounded-[3px] text-[13px] px-6 py-2">Save</button>
        <button className="border border-black rounded-[3px] text-[13px] px-6 py-2">Reset</button>
        <button className="border border-black rounded-[3px] text-[13px] px-6 py-2">Print</button>
      </div>
    </div>
  );
};

export default StockOrder;
