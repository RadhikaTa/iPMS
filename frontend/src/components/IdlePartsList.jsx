import React from "react"

const IdlePartsList = ({ onNavigate }) => {
  const idlePartsData = [
    {
      partNo: "VC67V3440",
      description: "Splash Guards, Front & Rear",
      onHandQty: 7,
      dnp: 4.9,
      inventoryValue: 20.7,
      agingMonths: 23,
      twelveMonthSalesQty: 10,
      productHierarchy: "ACCESSORY",
    },
    {
      partNo: "VAS1V3840A",
      description: "Crossbars, Black, PIO Set",
      onHandQty: 4,
      dnp: 7.76,
      inventoryValue: 31.04,
      agingMonths: 17,
      twelveMonthSalesQty: 0,
      productHierarchy: "ACCESSORY",
    },
    {
      partNo: "000011OH7",
      description: "BULB,LOW BEAM",
      onHandQty: 50,
      dnp: 5.8,
      inventoryValue: 290,
      agingMonths: 11,
      twelveMonthSalesQty: 5,
      productHierarchy: "REPAIR",
    },
    {
      partNo: "KBB460220",
      description: "COVER,COLUMN,UPPER",
      onHandQty: 3,
      dnp: 5.3,
      inventoryValue: 15.9,
      agingMonths: 21,
      twelveMonthSalesQty: 4,
      productHierarchy: "REPAIR",
    },
    {
      partNo: "0000110194",
      description: "BULB",
      onHandQty: 3,
      dnp: 2.05,
      inventoryValue: 6.15,
      agingMonths: 39,
      twelveMonthSalesQty: 1,
      productHierarchy: "REPAIR",
    },
  ]

  return (
    <div className="p-4 w-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-gray-300 pb-2 mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">IDLE PARTS LIST</h1>
        <button
          className="mt-2 sm:mt-0 px-4 py-2 border border-gray-500 text-gray-700 rounded hover:bg-gray-100"
          onClick={() => onNavigate("dashboard")}
        >
          RETURN TO DASHBOARD
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap border-b border-gray-300 text-sm">
          {["NORMAL", "DROP SHIP", "PRE IDLE", "IDLE"].map((tab, i) => (
            <button
              key={i}
              className={`px-4 py-2 ${
                tab === "IDLE"
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded-[3px] hover:bg-blue-900">
            PRINT
          </button>
          <button className="px-4 py-2.5 border border-blue-500 text-blue-500 rounded-[3px] hover:bg-blue-900">
            EXPORT TO EXCEL
          </button>
        </div>
      </div>

      {/* Data Table */}
      {/* DATA TABLE */}
      <div className="overflow-x-auto bg-white border border-[#E5E7EB]">
        <table className="min-w-full border-collapse text-[12px]">
          {/* HEADER */}
          <thead className="bg-[#2953CD] text-white sticky top-0 z-10">
            <tr className="h-[44px]">
              {[
                "PART NO.",
                "PART DESCRIPTION",
                "ON HAND QTY",
                "DNP",
                "INVENTORY VALUE",
                "AGING MONTHS",
                "12 MONTH SALES QTY",
                "PRODUCT HIERARCHY",
              ].map((heading, idx) => (
                <th
                  key={idx}
                  className="px-4 text-left font-semibold border border-[#E5E7EB] whitespace-nowrap"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
 
          {/* BODY */}
          <tbody>
            {idlePartsData.map((item, index) => (
              <tr
                key={index}
                className={`h-[44px] ${index % 2 === 0 ? "bg-white" : "bg-[#F7F9FC]"
                  } hover:bg-blue-50 transition`}
              >
                <td className="px-4 border border-[#E5E7EB]">{item.partNo}</td>
                <td className="px-4 border border-[#E5E7EB]">{item.description}</td>
                <td className="px-4 border border-[#E5E7EB] text-center">{item.onHandQty}</td>
                <td className="px-4 border border-[#E5E7EB] text-center">{item.dnp}</td>
                <td className="px-4 border border-[#E5E7EB] text-right">{item.inventoryValue}</td>
                <td className="px-4 border border-[#E5E7EB] text-center">{item.agingMonths}</td>
                <td className="px-4 border border-[#E5E7EB] text-center">
                  {item.twelveMonthSalesQty}
                </td>
                <td className="px-4 border border-[#E5E7EB]">{item.productHierarchy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 
 

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <nav>
          <ul className="inline-flex items-center -space-x-px text-sm">
            <li>
              <a href="#" className="px-3 py-1 rounded-l border border-gray-300 bg-white hover:bg-gray-100">◅</a>
            </li>
            {[1, 2, 3, 4, 5].map((num) => (
              <li key={num}>
                <a
                  href="#"
                  className={`px-3 py-1 border border-gray-300 ${
                    num === 1 ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {num}
                </a>
              </li>
            ))}
            <li>
              <a href="#" className="px-3 py-1 rounded-r border border-gray-300 bg-white hover:bg-gray-100">▻</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default IdlePartsList
