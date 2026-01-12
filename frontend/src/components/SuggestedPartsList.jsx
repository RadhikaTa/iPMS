import React from "react";

const SuggestedPartsList = ({ onNavigate }) => {
  const suggestedPartsData = [
    {
      id: 1,
      partNo: "VC67V3440",
      description: "Splash Guards, Front & Rear",
      onHandQty: 7,
      suggestedQty: 15,
      suggestedOrderQty: 8,
      dnp: 4,
      dmsLastSoldDate: "09/25/2024",
      lastPurchaseDate: "04/13/2025",
      dmsAge: 6,
      twelveMonthSaleQty: 4,
      productHierarchy: "ACCESSORY",
    },
    {
      id: 2,
      partNo: "VAS1V3840A",
      description: "Crossbars, Black, PIO Set",
      onHandQty: 4,
      suggestedQty: 15,
      suggestedOrderQty: 7,
      dnp: 4,
      dmsLastSoldDate: "01/15/2025",
      lastPurchaseDate: "07/14/2024",
      dmsAge: 5,
      twelveMonthSaleQty: 4,
      productHierarchy: "ACCESSORY",
    },
    {
      id: 3,
      partNo: "000011OH7",
      description: "BULB,LOW BEAM",
      onHandQty: 50,
      suggestedQty: 30,
      suggestedOrderQty: 0,
      dnp: 5,
      dmsLastSoldDate: "02/27/2025",
      lastPurchaseDate: "02/27/2025",
      dmsAge: 4,
      twelveMonthSaleQty: 53,
      productHierarchy: "REPAIR",
    },
    {
      id: 4,
      partNo: "KBB460220",
      description: "COVER,COLUMN,UPPER",
      onHandQty: 3,
      suggestedQty: 4,
      suggestedOrderQty: 5,
      dnp: 5,
      dmsLastSoldDate: "03/15/2025",
      lastPurchaseDate: "08/16/2024",
      dmsAge: 4,
      twelveMonthSaleQty: 45,
      productHierarchy: "REPAIR",
    },
    {
      id: 5,
      partNo: "0000110194",
      description: "BULB",
      onHandQty: 3,
      suggestedQty: 25,
      suggestedOrderQty: 2,
      dnp: 5,
      dmsLastSoldDate: "04/13/2025",
      lastPurchaseDate: "03/13/2025",
      dmsAge: 2,
      twelveMonthSaleQty: 25,
      productHierarchy: "REPAIR",
    },
  ];

  return (
    <div className="w-full px-4 md:px-6 py-6 font-mazda bg-[#F9F9F9] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-3 mb-6">
        <h2 className="text-xl font-bold tracking-wide">Suggested Parts List</h2>
        <button
          className="border border-black text-[12px] px-4 py-1.5 uppercase font-semibold"
          onClick={() => onNavigate("dashboard")}
        >
          Return to Dashboard
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-4 text-[13px] font-medium">
        <button className="text-gray-600 hover:text-black">OTHERS</button>
        <button className="text-gray-600 hover:text-black">EXCLUDED</button>
        <button className="text-black font-bold border-b-2 border-black pb-1">SUGGESTED</button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="border border-blue-600 text-blue-600 px-4 py-1 text-[12px] font-medium">PRINT</button>
        <button className="border border-green-600 text-green-600 px-4 py-1 text-[12px] font-medium">
          EXPORT TO EXCEL
        </button>
      </div>

      {/* Table */}
      {/* SUGGESTED PARTS TABLE */}
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
        <table className="w-full min-w-[1400px] text-xs border-collapse font-sans">
 
          {/* TABLE HEADER */}
          <thead>
            <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
              {[
                "Part No.",
                "Description",
                "On Hand Qty",
                "Suggested Qty",
                "Suggested Order Qty",
                "DNP",
                "DMS Last Sold",
                "Last Purchase",
                "DMS Age (Months)",
                "12M Sale Qty",
                "Product Hierarchy",
              ].map((heading, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap bg-[#2953CD] text-center"
                >
                  <div className="flex items-center justify-center gap-2 cursor-pointer">
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
 
          {/* TABLE BODY */}
          <tbody className="bg-white">
            {suggestedPartsData.map((part, idx) => (
              <tr
                key={part.id}
                className={`${idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"
                  } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
              >
                <td className="px-4 py-3 text-center font-medium text-[#101010]">
                  {part.partNo}
                </td>
 
                <td className="px-4 py-3 text-left text-[#101010]">
                  {part.description}
                </td>
 
                <td className="px-4 py-3 text-center">
                  {part.onHandQty}
                </td>
 
                <td className="px-4 py-3 text-center">
                  {part.suggestedQty}
                </td>
 
                <td className="px-4 py-3 text-center font-semibold">
                  {part.suggestedOrderQty}
                </td>
 
                <td className="px-4 py-3 text-center">
                  {part.dnp}
                </td>
 
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {part.dmsLastSoldDate}
                </td>
 
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {part.lastPurchaseDate}
                </td>
 
                <td className="px-4 py-3 text-center">
                  {part.dmsAge}
                </td>
 
                <td className="px-4 py-3 text-center">
                  {part.twelveMonthSaleQty}
                </td>
 
                <td className="px-4 py-3 text-left">
                  {part.productHierarchy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-1 text-[12px]">
        {["◅", 1, 2, 3, 4, 5, "▻"].map((item, idx) => (
          <button
            key={idx}
            className={`px-2 py-1 border text-black ${
              item === 1 ? "bg-black text-white font-bold" : "bg-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPartsList;
