import React, { useState } from "react";
import axios from "axios";

/* ----------------- CONSTANTS ----------------- */

const allMonths = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
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

  const headerStyle = "px-4 py-2 font-bold border border-[#E0E0E0] h-[66px] text-white bg-[#2B2B2B] text-left uppercase tracking-wider text-[13px]";

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-mazda bg-[#F5F5F5] min-h-screen">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-[#101010] mb-6 uppercase tracking-wider">
        Prediction Dashboard
      </h1>

      {/* MODE TOGGLE */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setPredictionMode("single")}
          className={`border border-black px-6 py-1 uppercase text-[12px] ${predictionMode === "single" ? "bg-black text-white" : "bg-white text-black"}`}
        >
          Single Part Prediction
        </button>
        <button
          onClick={() => setPredictionMode("bulk")}
          className={`border border-black px-6 py-1 uppercase text-[12px] ${predictionMode === "bulk" ? "bg-black text-white" : "bg-white text-black"}`}
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
              className="bg-black text-white px-6 py-2 text-[12px] uppercase"
            >
              {singleLoading ? "Predicting..." : "Predict"}
            </button>
          ) : (
            <button
              onClick={handleBulkPredict}
              disabled={bulkLoading}
              className="bg-black text-white px-6 py-2 text-[12px] uppercase"
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
        <div className="overflow-x-auto bg-white border border-[#D9D9D9] mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={headerStyle}>Dealer Code</th>
                <th className={headerStyle}>Part Number</th>
                <th className={headerStyle}>PI Suggested Stock</th>
                <th className={headerStyle}>iAI Prediction</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#101010]">
              {orderData.map((i) => (
                <tr key={i.key} className="h-[60px]">
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center">{i.dealer_code}</td>
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center font-mono">{i.partNumber}</td>
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center">{i.piPrediction}</td>
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center font-bold text-red-600">{i.iaiPrediction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BULK TABLE */}
      {predictionMode === "bulk" && top100Data.length > 0 && (
        <div className="overflow-x-auto bg-white border border-[#D9D9D9]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={headerStyle}>Rank</th>
                <th className={headerStyle}>Part Number</th>
                <th className={headerStyle}>iAI Monthly Prediction</th>
                <th className={headerStyle}>PI Suggested Stock</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#101010]">
              {top100Data.map((i, idx) => (
                <tr key={i.item_no} className="h-[60px]">
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center font-mono">{i.item_no}</td>
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center font-bold text-red-600">{Math.round(i.predicted_monthly)}</td>
                  <td className="border border-[#E0E0E0] px-4 py-2 text-center">{i.pe_suggested_stock_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
