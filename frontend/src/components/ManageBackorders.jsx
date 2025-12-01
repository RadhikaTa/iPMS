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
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#F5F5F5] min-h-screen relative">
      {/* TABLE */}
      <div className="overflow-x-auto bg-white border border-[#D9D9D9]">
        <table className="min-w-[900px] w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#2B2B2B] text-white h-[66px]">
              {[
                "",
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
                  className="px-2 text-left font-bold border border-[#E0E0E0]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#101010]">
            {backorderData.map((item, index) => (
              <tr key={index} className="h-[44px]">
                <td className="border border-[#E0E0E0] text-center">
                  <input type="checkbox" className="scale-90" />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.line}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.partNumber}
                    onClick={() => onNavigate?.("other-dealer-inventory")}
                    className="w-full border text-center h-[30px] px-1 underline cursor-pointer hover:text-blue-700"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.boQty}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.orderType}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.orderNumber}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.salesOrder}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.orderDate}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.etaDate}
                    className="w-full border text-center h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0]">
                  <input
                    type="text"
                    defaultValue={item.remark}
                    className="w-full border h-[30px] px-1"
                  />
                </td>
                <td className="border border-[#E0E0E0] text-right pr-2">
                  <Link
                    to="/other-dealer-inventory"
                    className="underline text-[#007bff] hover:text-blue-800 text-[10px]"
                  >
                    Other Dealer Inventory
                  </Link>
                  <div className="text-[9px] text-black leading-tight">
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
        <button className="bg-black text-white px-6 py-2 text-[12px] font-semibold uppercase tracking-wide">
          Cancel Backorder
        </button>
        <button className="border border-black px-6 py-2 text-[12px] font-semibold uppercase tracking-wide hover:bg-gray-100">
          Refresh Screen
        </button>
        <button className="border border-black px-6 py-2 text-[12px] font-semibold uppercase tracking-wide hover:bg-gray-100">
          Print
        </button>
      </div>
    </div>
  );
};

export default ManageBackorders;
