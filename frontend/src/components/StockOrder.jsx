import React, { useState } from "react";
import Tip from "../assets/Tip.svg";
import Idle from "../assets/Idle.png";
import PreIdle from "../assets/PreIdle.png";

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
      <div className="mb-6">
        <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
          Order Number:
        </label>
        <input
          type="text"
          placeholder="Enter order number"
          className="border border-[#CCCCCC] text-[#999999] px-4 py-2 w-full sm:w-[250px] outline-none"
        />
      </div>

      {/* ADD & DELETE BUTTONS */}
      <div className="mb-4 flex flex-wrap gap-4">
        <button className="border border-black text-[12px] px-4 py-1 uppercase">Add</button>
        <button className="border border-black text-[12px] px-4 py-1 uppercase">Delete</button>
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
      <div className="overflow-x-auto bg-white border border-[#D9D9D9]">
        <table className="min-w-[900px] w-full border-collapse">
          <thead>
            <tr className="bg-[#2B2B2B] text-white text-[13px] h-[66px]">
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
                  className="px-4 py-2 text-left font-bold border border-[#E0E0E0]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-[13px] text-[#101010] mazda">
            {orderData.map((item, index) => (
              <tr key={index} className="h-[60px]">
                <td className="border border-[#E0E0E0] px-4 py-2 text-center">
                  <input type="checkbox" className="scale-90" />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2 text-center">
                  <input
                    type="text"
                    value={item.line}
                    className="w-full border px-1 py-0.5 text-center"
                    onChange={(e) => handleChange(index, "line", e.target.value)}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    value={item.partNumber}
                    onChange={(e) => handleChange(index, "partNumber", e.target.value)}
                    className="w-full border px-1 py-0.5 text-center"
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2 text-center">
                  <input
                    type="number"
                    value={item.orderQty}
                    onChange={(e) => handleChange(index, "orderQty", parseInt(e.target.value) || 0)}
                    className="w-full border px-1 py-0.5 text-center"
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleChange(index, "description", e.target.value)}
                    className="w-full border px-1 py-0.5"
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => handleChange(index, "remark", e.target.value)}
                    className="w-full border px-1 py-0.5"
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2 text-center">
                  {item.iaiTips ? (
                    <img src={item.iaiTips} alt="Tips" className="w-4 h-4 mx-auto" />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="mt-8 flex justify-center flex-wrap gap-4 sm:gap-6 text-[11px] font-semibold uppercase">
        <button className="bg-black text-white px-6 py-1.5">Place Order</button>
        <button className="border border-black px-6 py-1.5">Save</button>
        <button className="border border-black px-6 py-1.5">Reset</button>
        <button className="border border-black px-6 py-1.5">Print</button>
      </div>
    </div>
  );
};

export default StockOrder;
