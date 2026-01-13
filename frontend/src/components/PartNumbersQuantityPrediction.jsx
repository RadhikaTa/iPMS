import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

/* ----------------- CONSTANTS ----------------- */

const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const spinnerPathD = "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z";

/* ----------------- COMPONENT ----------------- */

export default function PartNumbersQuantityPrediction() {
  const [dealerCode, setDealerCode] = useState(localStorage.getItem("dealerCode") || "10131");
  const [selectedMonth, setSelectedMonth] = useState("October");
  const [predictionMode, setPredictionMode] = useState("single");

  const [orderData, setOrderData] = useState([]);
  const [singlePartNumber, setSinglePartNumber] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState("");

  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [top100Data, setTop100Data] = useState([]);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const updateItemByKey = (key, updates) => {
    setOrderData((prev) => prev.map((i) => (i.key === key ? { ...i, ...updates } : i)));
  };

  /* ----------------- API HELPERS ----------------- */

  const fetchWithBackoff = async (url, payload, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.post(url, payload);
        return res.data.predicted_quantity;
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
  };

  /* ----------------- SINGLE ----------------- */

  const handleSinglePredict = async (e) => {
    e.preventDefault();
    setSingleLoading(true);
    setSingleError("");

    const key = Date.now();
    setOrderData((p) => [...p, { key, dealer_code: dealerCode, partNumber: singlePartNumber, piPrediction: "-", iaiPrediction: "-", isLoading: true }]);

    try {
      const dbRes = await axios.get(`http://127.0.0.1:8000/api/stock-details?cust_number=${dealerCode}&item_no=${singlePartNumber}`);
      const piQty = dbRes.data?.[0]?.pe_suggested_stock_qty ?? "-";

      const mlQty = await fetchWithBackoff("http://127.0.0.1:8000/predict", {
        dealer_code: dealerCode,
        part_number: singlePartNumber,
        month: selectedMonth,
      });

      updateItemByKey(key, { piPrediction: piQty, iaiPrediction: Math.round(mlQty), isLoading: false });
    } catch (e) {
      updateItemByKey(key, { iaiPrediction: "FAIL", isLoading: false });
      setSingleError("Prediction failed. Please check server.");
    } finally {
      setSingleLoading(false);
    }
  };

  /* ----------------- BULK ----------------- */

  const handleBulkPredict = async () => {
    setBulkLoading(true);
    setBulkError("");
    setTop100Data([]);
    setCurrentPage(1); // Reset to first page on new search

    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/top100-parts?dealer_code=${dealerCode}&month=${selectedMonth}`);
      setTop100Data(res.data);
      if (!res.data.length) setBulkError("No prediction data available for selection.");
    } catch (e) {
      setBulkError("Failed to load Top 100 predictions.");
    } finally {
      setBulkLoading(false);
    }
  };

  // ===================== PAGINATION LOGIC =====================
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const partsArray = Array.isArray(top100Data) ? top100Data : [];
  const currentParts = partsArray.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(partsArray.length / rowsPerPage);

  const goToNextPage = () =>
    setCurrentPage((page) => (page < totalPages ? page + 1 : page));
  const goToPrevPage = () =>
    setCurrentPage((page) => (page > 1 ? page - 1 : page));


  const headerStyle = "px-4 py-2 font-bold border border-[#E0E0E0] h-[66px] text-white bg-[#2B2B2B] text-left uppercase tracking-wider text-[13px]";

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#ECEFF1] min-h-screen">

      <Link to="/" className="font-bold text-sm p-3 underline">
        RETURN TO DASHBOARD
      </Link>
      <br />
      <br />
      {/* HEADER */}
      <h1 className="text-[18px] font-bold text-[#101010] mb-6 uppercase tracking-wider">
        Prediction Dashboard
      </h1>

      {/* MODE TOGGLE */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setPredictionMode("single")}
          className={`px-6 py-2.5 uppercase hover:bg-blue-900 text-[13px] ${predictionMode === "single" ? "bluebgColour rounded-[3px] text-white" : "border-black bg-white rounded-[3px] text-black"}`}
        >
          Single Part Prediction
        </button>
        <button
          onClick={() => setPredictionMode("bulk")}
          className={`px-6 py-2.5 uppercase text-[13px]  ${predictionMode === "bulk" ? "bluebgColour rounded-[3px] text-white hover:bg-blue-900" : "border border-black rounded-[3px] bg-white text-black"}`}
        >
          Bulk Top 100 Prediction
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white border border-[#D9D9D9] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
              Dealer / Cust Code
            </label>
            <input
              value={dealerCode}
              onChange={(e) => setDealerCode(e.target.value)}
              className="border border-[#CCCCCC] px-4 py-2 w-full outline-none"
            />
          </div>

          <div>
            <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
              Prediction Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#CCCCCC] px-4 py-2 w-full bg-white"
            >
              {allMonths.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {predictionMode === "single" && (
            <div>
              <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
                Part Number
              </label>
              <input
                value={singlePartNumber}
                onChange={(e) => setSinglePartNumber(e.target.value)}
                className="border border-[#CCCCCC] px-4 py-2 w-full outline-none"
              />
            </div>
          )}
        </div>

        <div className="mt-6 text-right">
          {predictionMode === "single" ? (
            <button
              onClick={handleSinglePredict}
              disabled={singleLoading}
              className="bluebgColour rounded-[3px] text-white px-6 py-2 text-[13px] uppercase hover:bg-blue-900"
            >
              {singleLoading ? "Predicting..." : "Predict"}
            </button>
          ) : (
            <button
              onClick={handleBulkPredict}
              disabled={bulkLoading}
              className="bluebgColour rounded-[3px] text-white px-6 py-2 text-[13px] uppercase"
            >
              {bulkLoading ? "Loading..." : "Get Top 100"}
            </button>
          )}
        </div>

        {singleError && <p className="text-sm text-red-600 mt-3">{singleError}</p>}
        {bulkError && <p className="text-sm text-yellow-600 mt-3">{bulkError}</p>}
      </div>

      {/* SINGLE TABLE */}
      {predictionMode === "single" && orderData.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 mb-6">
          <table className="w-full min-w-[900px] text-xs border-collapse font-sans">
            <thead>
              <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
                {["Dealer Code", "Part Number", "PI Suggested Stock", "iAI Prediction"].map(
                  (heading, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-[13px] font-semibold text-white text-center whitespace-nowrap bg-[#2953CD]"
                    >
                      <div className="flex items-center justify-center gap-2 cursor-pointer">
                        <span>{heading}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 opacity-80">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {orderData.map((i, idx) => (
                <tr
                  key={i.key}
                  className={`${idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"} hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
                >
                  <td className="px-4 py-3 text-center text-[#101010] font-medium">{i.dealer_code}</td>
                  <td className="px-4 py-3 text-center text-[#101010] font-medium">{i.partNumber}</td>
                  <td className="px-4 py-3 text-center text-[#101010]">{i.piPrediction}</td>
                  <td className="px-4 py-3 text-center font-semibold text-red-600">{i.iaiPrediction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BULK TABLE */}
      {predictionMode === "bulk" && top100Data.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
          <table className="w-full min-w-[900px] text-xs border-collapse font-sans">
            <thead>
              <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
                {["Rank", "Part Number", "iAI Monthly Prediction", "PI Suggested Stock"].map(
                  (heading, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-[13px] font-semibold text-white text-center whitespace-nowrap bg-[#2953CD]"
                    >
                      <div className="flex items-center justify-center gap-2 cursor-pointer">
                        <span>{heading}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 opacity-80">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentParts.map((i, idx) => (
                <tr
                  key={i.item_no}
                  className={`${idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"} hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
                >
                  <td className="px-4 py-3 text-center font-semibold text-[#101010]">
                    {indexOfFirstRow + idx + 1}
                  </td>
                  <td className="px-4 py-3 text-center text-[#101010] font-medium">{i.item_no}</td>
                  <td className="px-4 py-3 text-center font-semibold text-red-600">
                    {Math.round(i.predicted_monthly)}
                  </td>
                  <td className="px-4 py-3 text-center text-[#101010]">{i.pe_suggested_stock_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION SECTION */}
      {predictionMode === "bulk" && totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <ul className="flex gap-2 text-bold items-center">
            <li>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 hover:text-[#2953CD] font-bold"
              >
                &lt;
              </button>
            </li>

            {(() => {
              let pages = [];
              if (totalPages <= 3) {
                pages = Array.from({ length: totalPages }, (_, i) => i + 1);
              } else if (currentPage === 1) {
                pages = [1, 2, 3];
              } else if (currentPage === totalPages) {
                pages = [totalPages - 2, totalPages - 1, totalPages];
              } else {
                pages = [currentPage - 1, currentPage, currentPage + 1];
              }

              return pages.map((page) => (
                <li
                  key={page}
                  className={`px-3 py-1 cursor-pointer font-bold ${page === currentPage
                    ? "border-b-2 border-[#2953CD] text-[#2953CD]"
                    : "hover:text-[#2953CD]"
                    }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </li>
              ));
            })()}

            <li>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 hover:text-[#2953CD] font-bold"
              >
                &gt;
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}