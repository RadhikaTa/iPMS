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
      <div className="overflow-x-auto bg-white border border-[#D9D9D9] rounded-sm">
        <table className="min-w-[900px] w-full border-collapse">
          <thead>
            <tr className="bg-[#2B2B2B] text-white text-[13px] h-[60px]">
              <th className="px-4 py-2 text-left font-bold">Dealer</th>
              <th className="px-4 py-2 text-left font-bold">Part Number</th>
              <th className="px-4 py-2 text-left font-bold">
                Description / Dealership
              </th>
              <th className="px-4 py-2 text-left font-bold">Address</th>
              <th className="px-4 py-2 text-left font-bold">Phone</th>
              <th className="px-4 py-2 text-left font-bold">QTY</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-[#101010]">
            {dealerInventoryData.map((item, index) => (
              <tr
                key={index}
                className="h-[60px] border-b border-[#E0E0E0] text-[#101010]"
              >
                <td className="px-4 py-2">{item.dealer}</td>
                <td className="px-4 py-2">{item.partNumber}</td>
                <td className="px-4 py-2">{item.description}</td>
                <td className="px-4 py-2">{item.address}</td>
                <td className="px-4 py-2">{item.phone}</td>
                <td className="px-4 py-2">{item.qty}</td>
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
