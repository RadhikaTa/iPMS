import React, {act, useEffect, useState} from "react";
import { Link } from "react-router-dom";
import '../index.css';
 
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
 
export default function InventoryHealthInfo() {
  const [activeTab, setActiveTab] = useState("IDLE");
  const [allTables, setAllTables] = useState({
    IDLE: [],
    PRE_IDLE: [],
    DROP_SHIP: [],
    NORMAL: [],
  });
 
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
 
  // Replace with actual dealer code as needed
 
   const DEALER_CODE = "83314";
   
 
  // Fetch data from API
  useEffect(() => {
    const fetchTableData = async () => {
   
      try {
        setLoading(true);
        const endpoints = {
          IDLE: "idle-part-list",
          PRE_IDLE: "pre-idle-part-list",
          DROP_SHIP: "drop-ship-part-list",
          NORMAL: "normal-part-list",
        };
 
        const requests = Object.keys(endpoints).map((key) =>
          fetch(
            `http://127.0.0.1:8000/api/${endpoints[key]}?dealer_code=${DEALER_CODE}` //FETCHING DATA FROM BACKEND
          ).then((res) => res.json())
        );
 
       
       
        const results = await Promise.all(requests);
 
        // Map results to corresponding tables
 
        setAllTables({
          IDLE: Array.isArray(results[0]) ? results[0] : results[0].data || [],
          PRE_IDLE: Array.isArray(results[1]) ? results[1] : results[1].data || [],
          DROP_SHIP: Array.isArray(results[2]) ? results[2] : results[2].data || [],
          NORMAL: Array.isArray(results[3]) ? results[3] : results[3].data || [],
        });
        setLoading(false);
       
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
 
    fetchTableData();
  }, []);
 
  const data = allTables[activeTab] || [];
 
  // Pagination logic
 
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = data.slice(indexOfFirstEntry, indexOfLastEntry);
 
  const totalPages = Math.ceil(data.length / entriesPerPage);
 
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
 
  const getPageNumbers = () => {
    let start = currentPage - 1;
    let end = currentPage + 1;
 
    if (start < 1) {
      start = 1;
      end = 3;
    }
 
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(totalPages - 2, 1);
    }
 
    let pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };
 
  // Export to Excel functionality
 
  const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(data);  
  const workbook = XLSX.utils.book_new();
 
  XLSX.utils.book_append_sheet(workbook, worksheet, activeTab);
 
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
 
  const fileName = `${activeTab}_parts_list.xlsx`;
 
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
 
  saveAs(blob, fileName);
  };
 
  // Print functionality
  const printTable = () => {
    window.print();
  };
 
 return (
    <div className="w-full min-h-screen overflow-x-auto overflow-y-auto bg-[#ECEFF1]">
      <div className="min-h-screen flex flex-col bg-[#ECEFF1]">
        <Link to="/" className="font-bold text-sm p-3 underline">
          RETURN TO DASHBOARD
        </Link>
 
        {/* NAVBAR */}
        <nav className="w-full p-4 flex items-center text-[13px] text-gray-600 gap-8 font-semibold border-b">
          {["IDLE", "PRE_IDLE", "DROP_SHIP", "NORMAL"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1); // reset pagination when switching
              }}
              className={`hover:text-gray-900 transition ${
                activeTab === tab ? "font-bold" : ""
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </nav>
 
        {/* PAGE CONTENT */}
        <div className="flex-1 p-6">
          <h2 className="text-[18px] font-semibold mb-2">
            {activeTab.replace("_", " ")} PARTS LIST
          </h2>
 
          {loading ? (
            <p className="text-center py-10 text-gray-500 font-medium">Loading tables...</p>
          ) : data.length === 0? (
            <p className="text-center py-10 text-gray-500 font-medium">NO DATA FOUND FOR {activeTab.replace("_", " ")}</p>
          ) : (
            <>
              <div className="flex pt-2 pb-2">
                <button
                  onClick={exportToExcel}
                  className="bluebgColour text-white px-4 py-2.5 rounded-[3px] flex items-center gap-2 hover:bg-blue-900">
                  <img src="/src/assets/Excel.svg" alt="icon" />
                  EXPORT TO EXCEL
                </button>
                <button
                  onClick={printTable}
                  className="bluebgColour text-white py-2.5 px-4 rounded-[3px] flex items-center gap-2 hover:bg-blue-900 ml-5">
                  <img
                    src="/src/assets/print.svg"
                    alt="icon"
                    style={{ width: "20px", height: "20px", marginRight: "4px" }}
                  />
                  PRINT
                </button>
              </div>
 
                <table className="w-full border border-[#E5E7EB] border-collapse text-[12px]">
                {/* HEADER */}
                <thead className="bg-[#2953CD] text-white sticky top-0 z-10">
                  <tr className="h-[44px]">
                    <th className="px-4 font-semibold text-left">Dealer Code</th>
                    <th className="px-4 font-semibold text-left">Part Number</th>
                    <th className="px-4 font-semibold text-left">Part Name</th>
                    <th className="px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
 
                {/* BODY */}
                <tbody>
                  {currentEntries.map((item, index) => (
                    <tr
                      key={index}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-[#F7F9FC]"
                        } hover:bg-blue-50 transition`}
                    >
                      <td className="px-4 py-2 border border-[#E5E7EB]">
                        {item.dealer_code}
                      </td>
                      <td className="px-4 py-2 border border-[#E5E7EB]">
                        {item.part_no}
                      </td>
                      <td className="px-4 py-2 border border-[#E5E7EB]">
                        {item.part_name}
                      </td>
                      <td className="px-4 py-2 border border-[#E5E7EB] text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-sm
              ${item.status === "Available"
                              ? "bg-green-100 text-green-700"
                              : item.status === "Backorder"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
            `}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
 
 
              {/* PAGINATION */}
              <div className="pt-3 pb-8 mb-20 flex justify-center items-center gap-2 select-none">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-[#607D8B] font-bold hover:text-[#2953CD] font-[15px]"
                >
                  &lt;
                </button>
 
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 font-bold ${
                      page === currentPage ? "text-[#2953CD] font-[15px] border-b-2 border-[#2953CD]" : "text-[#607D8B]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
 
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-[#607D8B] font-bold hover:text-[#2953CD] font-[15px]"
                >
                  &gt;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
 