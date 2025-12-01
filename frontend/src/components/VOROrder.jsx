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

    
    <div className="px-4 sm:px-6 lg:px-8 py-6 bg-[#F9F9F9] min-h-screen font-mazda text-sm">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-4">
        {/* Left Input Section */}
        <div className="flex-1">
          <label className="block text-[11px] font-semibold tracking-wider mb-1">ORDER NUMBER:</label>
          <input
            type="text"
            className="w-full max-w-sm h-[36px] border border-gray-300 px-3 text-[13px]"
            placeholder="Enter order number"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="bg-black text-white text-[11px] px-5 py-1.5">ADD</button>
            <button className="border border-black text-[11px] px-5 py-1.5">DELETE</button>
          </div>
        </div>

        {/* Right Button + Legend Section */}
        <div className="flex flex-col items-start lg:items-end gap-14">
          <button className="bg-black text-white text-[12px] px-4 py-1 font-medium uppercase tracking-wider w-full lg:w-auto">
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
      <div className="border border-[#D9D9D9] bg-white overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-[13px]">
          <thead className="bg-[#2B2B2B] text-white uppercase h-[44px]">
            <tr>
              {["✓", "Line", "Part Number", "Order Qty", "Description", "Sales Order", "Alloc Qty", "B/O Qty", "Remark", "iAI Tips"].map((heading, i) => (
                <th key={i} className="px-3 py-2 font-bold border border-[#E0E0E0] text-left whitespace-nowrap">
                  {heading === "Part Number" ? <span className="underline cursor-pointer">{heading}</span> : heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#101010]">
            {orderData.map((item, index) => (
              <tr key={index} className="h-[44px]">
                <td className="border border-[#E0E0E0] px-3 text-center">
                  <input type="checkbox" className="scale-90" />
                </td>
                <td className="border border-[#E0E0E0] px-3 text-center">
                  <input readOnly value={item.line} className="w-full h-[30px] border px-1 text-center" />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input readOnly value={item.partNumber} className="w-full h-[30px] border px-1 text-center" />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input
                    type="number"
                    value={item.orderQty}
                    onChange={(e) => handleQtyChange(index, e.target.value)}
                    className="w-full h-[30px] border px-1 text-center"
                  />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input readOnly value={item.description} className="w-full h-[30px] border px-1" />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input className="w-full h-[30px] border px-1" />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input defaultValue="0" className="w-full h-[30px] border px-1 text-center" />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input defaultValue="0" className="w-full h-[30px] border px-1 text-center" />
                </td>
                <td className="border border-[#E0E0E0] px-3">
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => handleRemarkChange(index, e.target.value)}
                    className="w-full h-[30px] border px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0] px-3 text-center">
                  {item.iaiTips ? (
                    <img src={item.iaiTips} alt="tip" className="w-4 h-4 mx-auto" />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-center flex-wrap gap-4 mt-6 text-[11px] font-semibold uppercase">
        <button className="bg-black text-white px-5 py-1.5">Place Order</button>
        <button className="border border-black px-5 py-1.5">Save</button>
        <button className="border border-black px-5 py-1.5">Reset</button>
        <button className="border border-black px-5 py-1.5">Print</button>
      </div>
    </div>
  );
};

export default VOROrder;
