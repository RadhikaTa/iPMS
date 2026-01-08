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
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#F5F5F5] min-h-screen relative">
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
          className="border border-[#CCCCCC] text-[#999999] px-4 py-2 w-full sm:w-[250px] outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border border-[#D9D9D9]">
        <table className="min-w-[900px] w-full border-collapse">
          <thead>
            <tr className="bg-[#2B2B2B] text-white text-[13px] h-[66px]">
              {[
                "Line",
                "Dealer Ord No",
                "Part Number",
                "Order Qty",
                "ALC QTY.",
                "BO QTY.",
                "ALC PDC",
                "Sales Ord No",
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
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.line}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.dealerOrdNo}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center underline hover:text-blue-700"
                    defaultValue={item.partNumber}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.orderQty}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.alcQty}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.boQty}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.alcPdc}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2">
                  <input
                    type="text"
                    className="w-full border px-1 py-0.5 text-center"
                    defaultValue={item.salesOrdNo}
                  />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2 text-right">
                  {item.iaiTips === "show" ? (
                    <button onClick={() => setShowModal(true)}>
                      <img src={Tip} alt="tip" className="inline-block" />
                    </button>
                  ) : (
                    <div className="text-[10px] leading-tight text-[#007bff] cursor-pointer text-right">
                      <Link
                        to="/other-dealer-inventory"
                        className="underline text-[#007bff] hover:text-blue-800 text-[10px]"
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
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-[12px]">
        <button className="w-[30px] h-[30px] border border-gray-300 hover:bg-gray-200">
          {"<"}
        </button>
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            className={`w-[30px] h-[30px] border ${
              num === 1
                ? "bg-black text-white"
                : "border-gray-300 hover:bg-gray-200"
            }`}
          >
            {num}
          </button>
        ))}
        <button className="w-[30px] h-[30px] border border-gray-300 hover:bg-gray-200">
          {">"}
        </button>
      </div>

      {/* PRINT BUTTON */}
      <div className="mt-8 flex justify-center">
        <button className="bg-black text-white px-6 py-2 text-[12px] font-semibold uppercase tracking-wide">
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
