import React from "react";
import { Link } from "react-router-dom";

const ManageBackorders = ({ onNavigate }) => {
  const backorderData = [
    {
      line: 1,
      partNumber: "AJB4132211",
      boQty: 1,
      orderType: "S",
      orderNumber: "10105",
      salesOrder: "10757412",
      orderDate: "10/10/24",
      etaDate: "04/16/25",
      remark: "",
    },
    {
      line: 2,
      partNumber: "N244V3010",
      boQty: 1,
      orderType: "S",
      orderNumber: "10295",
      salesOrder: "10764157",
      orderDate: "10/29/24",
      etaDate: "04/16/25",
      remark: "",
    },
    {
      line: 3,
      partNumber: "0000110H7",
      boQty: 1,
      orderType: "S",
      orderNumber: "11185",
      salesOrder: "10767283",
      orderDate: "11/18/24",
      etaDate: "04/16/25",
      remark: "",
    },
    {
      line: 4,
      partNumber: "000018F287",
      boQty: 10,
      orderType: "S",
      orderNumber: "11185",
      salesOrder: "10767283",
      orderDate: "11/18/24",
      etaDate: "07/25/25",
      remark: "",
    },
    {
      line: 5,
      partNumber: "VC67V3440",
      boQty: 1,
      orderType: "S",
      orderNumber: "11185",
      salesOrder: "10767283",
      orderDate: "11/18/24",
      etaDate: "07/25/25",
      remark: "",
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#ECEFF1] min-h-screen relative">
      {/* TABLE */}
         <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
        <table className="w-full min-w-[1200px] text-xs border-collapse font-sans">
          {/* HEADER */}
          <thead>
            <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
              {/* CHECKBOX */}
              <th className="px-4 py-3 w-[50px] text-center bg-[#2953CD]">
                <div className="flex justify-center">
                  <input type="checkbox" className="w-4 h-4 accent-white cursor-pointer" />
                </div>
              </th>
 
              {[
                "Line",
                "Part Number",
                "B/O Qty",
                "Order Type",
                "Order Number",
                "Sales Order",
                "Order Date",
                "ETA Date",
                "Remark",
                "iAI Tips",
              ].map((heading, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-[13px] font-semibold text-white bg-[#2953CD] text-left whitespace-nowrap"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
 
          {/* BODY */}
          <tbody className="bg-white">
            {backorderData.map((item, idx) => (
              <tr
                key={idx}
                className={`h-[6px] text-[13px] ${idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"
                  } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100`}
              >
                {/* CHECKBOX */}
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" className="w-4 h-4 accent-[#2953CD] cursor-pointer" />
                </td>
 
                {/* LINE */}
                <td className="px-py-3 text-center">
                  <input defaultValue={item.line} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* PART NUMBER */}
                <td className="px-4 py-3 text-center">
                  <input
                    defaultValue={item.partNumber}
                    onClick={() => onNavigate?.("other-dealer-inventory")}
                    className="w-full bg-transparent text-center underline cursor-pointer text-[#2953CD] hover:text-blue-700 outline-none"
                  />
                </td>
 
                {/* BO QTY */}
                <td className="px-4 py-3 text-center">
                  <input defaultValue={item.boQty} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* ORDER TYPE */}
                <td className="px-4 py-3 text-center">
                  <input defaultValue={item.orderType} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* ORDER NUMBER */}
                <td className="px-4 py-3 text-center">
                  <input defaultValue={item.orderNumber} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* SALES ORDER */}
                <td className="px-4 py-3 text-center">
                  <input defaultValue={item.salesOrder} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* ORDER DATE */}
                <td className="px-4 py-3 text-center">
                  <input defaultValue={item.orderDate} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* ETA DATE */}
                <td className="px-4 py-3 text-center">
                  <input defaultValue={item.etaDate} className="w-full bg-transparent text-center outline-none" />
                </td>
 
                {/* REMARK */}
                <td className="px-4 py-3">
                  <input defaultValue={item.remark} className="w-full bg-transparent outline-none" />
                </td>
 
                {/* IAI TIPS */}
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/other-dealer-inventory"
                    className="text-[11px] font-medium underline text-[#2953CD] hover:text-blue-700"
                  >
                    Other Dealer Inventory
                  </Link>
                  <div className="text-[10px] text-gray-600 leading-tight">
                    (Who can cancel the backorder)
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 

      {/* ACTION BUTTONS */}
      <div className="mt-8 flex justify-center flex-wrap gap-3 sm:gap-6">
        <button className="bluebgColour rounded-[3px] text-white px-6 py-2 text-[13px] font-semibold uppercase tracking-wide hover:bg-blue-900">
          Cancel Backorder
        </button>
        <button className="border border-black rounded-[3px] px-6 py-2 text-[13px] font-semibold uppercase tracking-wide hover:bg-gray-100">
          Refresh Screen
        </button>
        <button className="border border-black rounded-[3px] px-6 py-2 text-[13px] font-semibold uppercase tracking-wide hover:bg-gray-100">
          Print
        </button>
      </div>
    </div>
  );
};

export default ManageBackorders;
