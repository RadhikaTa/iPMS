import React, { useState } from "react";
import axios from "axios";

/* ----------------- ICONS ----------------- */

const TipIcon = ({ className = "w-4 h-4 text-orange-500" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.3 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const IdleIcon = ({ className = "w-4 h-4 text-gray-500" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const PreIdleIcon = ({ className = "w-4 h-4 text-yellow-500" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

/* ----------------- MONTHS ----------------- */

const allMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ----------------- COMPONENT ----------------- */

export default function PartNumbersQuantityPrediction() {
  // ✔️ Dealer code auto-loads from LocalStorage
  const [dealerCode, setDealerCode] = useState(
    localStorage.getItem("dealerCode") || "10131"
  );

  const [selectedMonth, setSelectedMonth] = useState("October");
  const [orderData, setOrderData] = useState([]);

  const [singlePartNumber, setSinglePartNumber] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState("");

  const [bulkError, setBulkError] = useState("");

  const updateItemByKey = (key, updates) => {
    setOrderData((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...updates } : item))
    );
  };

  const fetchWithBackoff = async (url, payload, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.post(url, payload);
        return res.data.predicted_quantity;
      } catch (error) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
        } else {
          throw error;
        }
      }
    }
  };

  /* ----------------- SINGLE PREDICTION ----------------- */
  const handleSinglePredict = async (e) => {
    e.preventDefault();

    const dealer = dealerCode.trim();
    const part = singlePartNumber.trim();
    const month = selectedMonth.trim();

    if (!dealer || !part || !month) {
      setSingleError("Please enter   Part Number, and Month.");
      return;
    }

    // ✔️ Save dealer code to LocalStorage whenever used
    localStorage.setItem("dealerCode", dealer);

    setSingleError("");
    setSingleLoading(true);

    const uniqueKey = Date.now();

    const loadingItem = {
      key: uniqueKey,
      partNumber: part,
      dealer_code: dealer,
      piPrediction: "-",
      iaiPrediction: "Loading...",
      isLoading: true,
    };

    setOrderData((prev) => [...prev, loadingItem]);

    let piQty = "-";
    let iaiQty = "Error";

    try {
      /* --- PI Prediction (DB) --- */
      const dbURL = `http://127.0.0.1:8000/api/stock-details?cust_number=${dealer}&item_no=${part}`;

      let dbData = [];

      try {
        const dbRes = await axios.get(dbURL);
        dbData = dbRes.data;
      } catch (err) {
        console.warn("DB fetch failed:", err.message);
      }

      if (dbData.length > 0) {
        piQty = dbData[0].piPrediction || "-";
      } else {
        setSingleError(
          (prev) => (prev ? prev + " | " : "") + `No PI data found for ${part}.`
        );
      }

      updateItemByKey(uniqueKey, { piPrediction: piQty });

      /* --- ML Prediction --- */
      const payload = {
        dealer_code: dealer,
        part_number: part,
        month: month,
      };

      const mlQty = await fetchWithBackoff(
        "http://127.0.0.1:8000/predict",
        payload
      );

      iaiQty = Math.max(0, Math.round(mlQty));

      updateItemByKey(uniqueKey, {
        piPrediction: piQty,
        iaiPrediction: iaiQty,
        isLoading: false,
      });
    } catch (error) {
      console.error("Single prediction failed:", error);

      updateItemByKey(uniqueKey, {
        iaiPrediction: "FAIL",
        isLoading: false,
      });

      setSingleError("Prediction failed. Check API server.");
    } finally {
      setSingleLoading(false);
    }
  };

  /* ----------------- BULK PLACEHOLDER ----------------- */
  const handleBulkPredict = () => {
    setBulkError("Bulk prediction is not implemented yet.");
  };

  const headerStyle =
    "px-4 py-2 font-bold border border-[#E0E0E0] h-[66px] text-white bg-[#2B2B2B] text-center uppercase tracking-wider";

  /* ----------------- JSX ----------------- */

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 bg-[#F5F5F5] min-h-screen">
      <h1 className="text-2xl font-bold text-[#101010] mb-6 uppercase tracking-wider text-center">
        iAI Prediction Dashboard
      </h1>

      {/* ----------------- FORM ----------------- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-[#D9D9D9]">
        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider">
          Single Part Prediction Query
        </h2>

        <form onSubmit={handleSinglePredict}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
                Dealer/Cust Code
              </label>

              <input
                type="text"
                value={dealerCode}
                onChange={(e) => {
                  setDealerCode(e.target.value);
                  localStorage.setItem("dealerCode", e.target.value);
                }}
                placeholder="Dealer Code (ex: 10131)"
                className="border border-[#CCCCCC] px-4 py-2 w-full focus:border-black rounded-sm"
                required
              />
            </div>

            <div>
              <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
                Part Number
              </label>
              <input
                type="text"
                value={singlePartNumber}
                onChange={(e) => setSinglePartNumber(e.target.value)}
                placeholder="Enter Part No"
                className="border border-[#CCCCCC] px-4 py-2 w-full focus:border-black rounded-sm"
                required
              />
            </div>

            <div>
              <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">
                Prediction Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-[#CCCCCC] px-4 py-2 w-full bg-white rounded-sm"
                required
              >
                <option value="">Select Month</option>
                {allMonths.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={singleLoading}
              className="bg-black text-white font-bold text-[12px] px-6 py-2 uppercase hover:bg-green-800 transition-colors rounded-sm w-full"
            >
              {singleLoading ? "Predicting..." : "Predict & Add to Table"}
            </button>
          </div>
        </form>

        {singleError && (
          <p className="text-sm font-medium text-red-600 mt-3">
            ⚠️ {singleError}
          </p>
        )}
      </div>

      {/* ----------------- TABLE ----------------- */}

      <h2 className="text-lg font-bold mt-8 mb-4 uppercase tracking-wider">
        Part Order Quantity Comparison
      </h2>

      {bulkError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {bulkError}
        </div>
      )}

      <div className="overflow-x-auto bg-white border border-[#D9D9D9] rounded-lg shadow-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[13px] h-[66px] uppercase">
              <th className={headerStyle}>Dealer Code</th>
              <th className={headerStyle}>Part Number</th>
              <th className={headerStyle}>PI Prediction</th>
              <th className={headerStyle}>iAI Prediction</th>
            </tr>
          </thead>

          <tbody className="text-[13px] text-[#101010]">
            {orderData.length > 0 ? (
              orderData.map((item) => (
                <tr key={item.key} className="h-[60px] hover:bg-gray-50">
                  <td className="border px-4 py-2 text-center font-semibold">
                    {item.dealer_code}
                  </td>

                  <td className="border px-4 py-2 text-center font-bold font-mono">
                    {item.partNumber}
                  </td>

                  <td className="border px-4 py-2 text-center bg-gray-100 font-semibold">
                    {item.piPrediction}
                  </td>

                  <td className="border px-4 py-2 text-center font-extrabold text-red-600">
                    {item.isLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 
                          5.373 0 12h4zm2 5.291A7.962 
                          7.962 0 014 12H0c0 3.042 1.135 
                          5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : item.iaiPrediction === "FAIL" ? (
                      <span className="text-red-600 font-bold">FAIL</span>
                    ) : (
                      <span className="text-xl">{item.iaiPrediction}</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  Enter a <strong>Part Number</strong>, and
                  <strong> Month</strong> above to generate predictions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
