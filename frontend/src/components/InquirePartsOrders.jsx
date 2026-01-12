import React, { useState } from "react";
import Tip from "../assets/Tip.svg";
import AiLogo from "../assets/iAI@2x.png";
import { Link } from "react-router-dom";

const InquirePartsOrders = () => {
  const [showModal, setShowModal] = useState(false);

  const orderData = [
    {
      line: "0001",
      dealerOrdNo: "SKD11",
      partNumber: "BOL6YV4990",
      orderQty: 1,
      alcQty: 1,
      boQty: 0,
      alcPdc: "VC",
      salesOrdNo: "10768426",
      iaiTips: "show",
    },
    {
      line: "0002",
      dealerOrdNo: "SKD11",
      partNumber: "BCKAV3650",
      orderQty: 8,
      alcQty: 2,
      boQty: 6,
      alcPdc: "",
      salesOrdNo: "10768426",
      iaiTips: "link",
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#ECEFF1] min-h-screen relative">
      {/* ORDER DATE */}
      <div className="mb-6">
        <label
          htmlFor="order-date"
          className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase"
        >
          ORDER DATE:
        </label>
        <input
          type="date"
          id="order-date"
          defaultValue="2025-06-09"
          className="border border-[#CCCCCC] rounded-[3px] text-[#999999] px-4 py-2 w-full sm:w-[250px] outline-none"
        />
      </div>

      {/* TABLE */}
            {/* TABLE */}
      <div className="overflow-x-auto rounded-lg shadow-sm  border-gray-200">
        <table className="min-w-[1200px] w-full text-[12px] font-sans">
          {/* HEADER */}
          <thead className="sticky top-0 z-10">
            <tr className="h-[60px] bg-[#2953CD] text-white">
              {["Line", "Dealer Ord No", "Part Number", "Order Qty", "ALC QTY.", "BO QTY.", "ALC PDC", "Sales Ord No", "iAI Tips"].map(
                (heading, idx) => (
                  <th
                    key={idx}
                    className={`px-4 font-semibold text-left text-[12px]`}
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
 
          {/* BODY */}
          <tbody>
            {orderData.map((item, idx) => (
              <tr
                key={idx}
                className={`h-[60px] ${idx % 2 === 0 ? "bg-white" : "bg-[#F7F9FC]"
                  } hover:bg-blue-50 transition-colors duration-150`}
              >
                {/* LINE */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.line}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* DEALER ORD NO */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.dealerOrdNo}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* PART NUMBER */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.partNumber}
                    onClick={() => onNavigate?.("other-dealer-inventory")}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent underline cursor-pointer text-[#2953CD] hover:text-blue-700 text-[12px]"
                  />
                </td>
 
                {/* ORDER QTY */}
                <td className="px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.orderQty}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* ALC QTY */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.alcQty}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* BO QTY */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.boQty}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* ALC PDC */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.alcPdc}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* SALES ORD NO */}
                <td className=" px-3 py-1">
                  <input
                    type="text"
                    defaultValue={item.salesOrdNo}
                    className="w-full h-[28px] px-2 text-center outline-none bg-transparent text-[12px]"
                  />
                </td>
 
                {/* iAI TIPS */}
                <td className=" px-3 py-1 text-right">
                  {item.iaiTips === "show" ? (
                    <button onClick={() => setShowModal(true)}>
                      <img src={Tip} alt="tip" className="inline-block w-4 h-4" />
                    </button>
                  ) : (
                    <div className="text-[10px] leading-tight">
                      <Link
                        to="/other-dealer-inventory"
                        className="underline text-[#2953CD] hover:text-blue-700"
                      >
                        Other Dealer Inventory
                      </Link>
                      <div className="text-[9px] text-black">
                        (Who can cancel the backorder)
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
 
 

      {/* PAGINATION */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 font-bold text-[15px]">
        <button className="w-[30px] h-[30px] hover:text-blue-900">
          {"<"}
        </button>
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            className={`w-[30px] h-[30px] ${
              num === 1
                ? "text-[#2953CD] border-b-2 border-b-[#2953CD] font-bold"
                : "hover:text-blue-900"
            }`}
          >
            {num}
          </button>
        ))}
        <button className="w-[30px] h-[30px] hover:text-blue-900">
          {">"}
        </button>
      </div>

      {/* PRINT BUTTON */}
      <div className="mt-8 flex justify-center">
        <button className="bluebgColour rounded-[3px] text-white px-6 py-2 text-[13px] font-semibold uppercase tracking-wide hover:bg-blue-900">
          Print
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-[300px] h-[320px] p-6 relative font-mazda text-[#101010] rounded-sm text-center shadow-lg border border-[#707070]">
            <button
              className="absolute top-2 right-3 text-xl font-bold"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <div className="flex items-center justify-center mb-2 mt-2">
              <img src={AiLogo} alt="AI" className="w-[30px] mr-2" />
              <span className="font-bold text-[13px] tracking-wider">TIPS</span>
            </div>

            <p className="text-[13px] font-bold uppercase mb-4">
              Suggested Stock
            </p>

            <div className="text-[13px] text-left px-4 leading-[2]">
              <p>
                1. Suggested Quantity:{" "}
                <span className="float-right">20</span>
              </p>
              <p>
                2. Stock Quantity: <span className="float-right">12</span>
              </p>
              <p>
                3. Order Quantity: <span className="float-right">08</span>
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 bg-black text-white text-[12px] px-6 py-1 uppercase"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InquirePartsOrders;
