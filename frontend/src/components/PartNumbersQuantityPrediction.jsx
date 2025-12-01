import React, { useState } from 'react';
import axios from 'axios';

// --- Icon SVGs (Replacing Image Imports) ---
// Note: In a real app, these would be separate files or imported from an icon library.
// For this single-file solution, we use inline SVGs.

// Tip Icon (e.g., Warning/Suggestion)
const TipIcon = ({ className = "w-4 h-4 text-orange-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.3 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
);

// Idle Icon (e.g., No recent activity/Low demand)
const IdleIcon = ({ className = "w-4 h-4 text-gray-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// Pre-Idle Icon (e.g., Demand softening)
const PreIdleIcon = ({ className = "w-4 h-4 text-yellow-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
);


// Array for all months for the filter
const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Initial data structure for the Comparison Table
const initialOrderData = [
  { line: "0001", partNumber: "AJB4132211", finalOrderQty: 4, description: "GSKT, SURGE TANK, GRILL", remark: "", piPrediction: 0, iaiPrediction: null, iaiTips: "Tip", isLoading: false },
  { line: "0002", partNumber: "N244V3010", finalOrderQty: 2, description: "BLACK FILM 4 RR BMPR", remark: "", piPrediction: 0, iaiPrediction: null, iaiTips: "Idle", isLoading: false },
  { line: "0003", partNumber: "0000110H7", finalOrderQty: 1, description: "BULB,LOW BEAM", remark: "", piPrediction: 0, iaiPrediction: null, iaiTips: null, isLoading: false },
  { line: "0004", partNumber: "000018F287", finalOrderQty: 4, description: "SPARK PLUG", remark: "", piPrediction: 0, iaiPrediction: null, iaiTips: "PreIdle", isLoading: false },
  { line: "0005", partNumber: "VC67V3440", finalOrderQty: 7, description: "Splash Guards, Front & Rear", remark: "", piPrediction: 0, iaiPrediction: null, iaiTips: null, isLoading: false },
];

export default function PartOrderPredictionTable() {
  // Global Filters/Order Info
  const [dealerCode, setDealerCode] = useState('DLR-101');
  const [selectedMonth, setSelectedMonth] = useState('October'); // Default for single prediction
  const [orderNumber, setOrderNumber] = useState('PO-2024-001');

  // Comparison Table State
  const [orderData, setOrderData] = useState(initialOrderData);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  
  // Single Prediction State
  const [singlePartNumber, setSinglePartNumber] = useState('');
  const [singlePrediction, setSinglePrediction] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState('');

  // Helper function to render the correct SVG icon
  const renderIAITips = (tip) => {
    switch (tip) {
      case 'Tip': return <TipIcon className="w-4 h-4 mx-auto text-green-600" />;
      case 'Idle': return <IdleIcon className="w-4 h-4 mx-auto text-gray-500" />;
      case 'PreIdle': return <PreIdleIcon className="w-4 h-4 mx-auto text-yellow-600" />;
      default: return "-";
    }
  };

  // State update helpers
  const updateRowState = (index, updates) => {
    setOrderData(prevData =>
      prevData.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const handleChange = (index, key, value) => {
    updateRowState(index, { [key]: value });
  };

  // --- Prediction Logic with Exponential Backoff ---

  const fetchWithBackoff = async (url, payload, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.post(url, payload);
        return res.data.predicted_quantity;
      } catch (error) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        } else {
          throw error; // Throw error on last retry
        }
      }
    }
  };

  // --- 1. Single Part Prediction Handler (Requested in first row) ---
  const handleSinglePredict = async (e) => {
    e.preventDefault();
    if (!dealerCode || !selectedMonth || !singlePartNumber) {
      setSingleError("Please ensure Dealer Code, Month, and Part Number are filled.");
      return;
    }

    setSingleLoading(true);
    setSingleError('');
    setSinglePrediction(null);
    const predictionEndpoint = 'http://127.0.0.1:8000/predict';

    const payload = {
      dealer_code: dealerCode.trim(),
      part_number: singlePartNumber.trim(),
      month: selectedMonth.trim(),
    };

    try {
      const predictedQuantity = await fetchWithBackoff(predictionEndpoint, payload);
      setSinglePrediction(Math.max(0, Math.round(predictedQuantity))); // Non-negative, integer
    } catch (error) {
      console.error(`Single Prediction failed:`, error);
      setSingleError("Prediction failed. Check API server status.");
    } finally {
      setSingleLoading(false);
    }
  };


  // --- 2. Bulk Prediction Handler (For the Comparison Table) ---
  const handleBulkPredict = async () => {
    if (!dealerCode || !selectedMonth) {
      setBulkError("Please enter a Dealer Code and select a Month before predicting.");
      return;
    }

    setBulkLoading(true);
    setBulkError('');
    const predictionEndpoint = 'http://127.0.0.1:8000/predict';
    let hasError = false;

    // Sequential promise execution for robustness against mock API limits
    for (let index = 0; index < orderData.length; index++) {
      const item = orderData[index];
      
      updateRowState(index, { isLoading: true });

      const payload = {
        dealer_code: dealerCode.trim(),
        part_number: item.partNumber.trim(),
        month: selectedMonth.trim(),
      };

      try {
        const predictedQuantity = await fetchWithBackoff(predictionEndpoint, payload);
        
        updateRowState(index, { 
          iaiPrediction: Math.max(0, Math.round(predictedQuantity)),
          isLoading: false 
        });
      } catch (error) {
        console.error(`Prediction failed for ${item.partNumber}:`, error);
        hasError = true;
        updateRowState(index, { 
          iaiPrediction: 'Error',
          isLoading: false 
        });
      }
    }
    
    setBulkLoading(false);
    if (hasError) {
      setBulkError("One or more part predictions failed. Check individual row results.");
    }
  };

  const headerStyle = "px-4 py-2 text-left font-bold border border-[#E0E0E0] h-[66px] text-white bg-[#2B2B2B] text-center tracking-wider";

  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-10 font-sans bg-[#F5F5F5] min-h-screen relative">
      
      <h1 className="text-2xl font-bold text-[#101010] mb-6 uppercase tracking-wider text-center">
          iAI Prediction Dashboard
      </h1>

      

      {/* --- 1. SINGLE PART PREDICTION FORM (part no prediction month predict) --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-[#D9D9D9]">
          <h2 className="text-lg font-bold text-[#101010] mb-4 uppercase tracking-wider">
              Single Part Prediction Query
          </h2>
          <form onSubmit={handleSinglePredict}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Part Number */}
                  <div>
                      <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">Part Number</label>
                      <input
                          type="text"
                          value={singlePartNumber}
                          onChange={(e) => setSinglePartNumber(e.target.value)}
                          placeholder="Enter Part No"
                          className="border border-[#CCCCCC] text-[#101010] px-4 py-2 w-full outline-none focus:border-black rounded-sm"
                          required
                      />
                  </div>

                  {/* Prediction Month */}
                  <div>
                      <label className="block text-[#101010] font-bold text-[13px] tracking-[1.95px] mb-2 uppercase">Prediction Month</label>
                      <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="border border-[#CCCCCC] text-[#101010] px-4 py-2 w-full outline-none focus:border-black appearance-none bg-white rounded-sm"
                          required
                      >
                          <option value="">Select Month</option>
                          {allMonths.map((m) => (
                              <option key={m} value={m}>{m}</option>
                          ))}
                      </select>
                  </div>
                  
                  {/* Predict Button */}
                  <div className="md:col-span-1">
                      <button 
                          type="submit"
                          className="bg-black text-white font-bold text-[12px] px-6 py-2 uppercase hover:bg-gray-800 transition-colors w-full rounded-sm disabled:opacity-50"
                          disabled={singleLoading || !dealerCode || !selectedMonth || !singlePartNumber}
                      >
                          {singleLoading ? 'PREDICTING...' : 'PREDICT'}
                      </button>
                  </div>
              </div>
          </form>

          {/* Single Prediction Result Display */}
          <div className="mt-6 p-4 border-t border-gray-200">
              {singlePrediction !== null && (
                  <p className="text-lg font-semibold text-gray-700">
                      Predicted Quantity for <span className="text-black font-extrabold">{singlePartNumber}</span>: 
                      <span className="text-red-600 ml-2 text-2xl">{singlePrediction}</span>
                  </p>
              )}
              {singleError && (
                  <p className="text-sm font-medium text-red-600 mt-2">Error: {singleError}</p>
              )}
          </div>
      </div>

      {/* --- 2. COMPARISON TABLE SECTION --- */}
      <h2 className="text-lg font-bold text-[#101010] mb-4 uppercase tracking-wider mt-8">
          Part Order Quantity Comparison
      </h2>
      
      {/* BULK PREDICTION ACTION BUTTON */}
      <div className="mb-4 flex justify-between items-center">
          <div className='flex gap-4'>
           
          </div>

      </div>

      {/* BULK ERROR MESSAGE */}
      {bulkError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm font-medium rounded-lg">
              {bulkError}
          </div>
      )}

      {/* COMPARISON TABLE */}
      <div className="overflow-x-auto bg-white border border-[#D9D9D9] rounded-lg shadow-lg">
        <table className="min-w-full w-full border-collapse">
          <thead>
            <tr className="text-[13px] h-[66px] uppercase tracking-wider">
              <th className={headerStyle}>Part Number</th>
              <th className={headerStyle}>PI Prediction (Static)</th>
              <th className={headerStyle}>iAI Prediction (ML)</th>

            </tr>
          </thead>
          <tbody className="bg-white text-[13px] text-[#101010]">
            {orderData.map((item, index) => (
              <tr key={index} className="h-[60px] hover:bg-gray-50">
                <td className="border border-[#E0E0E0] px-4 py-2 text-center w-10">
                  <input type="checkbox" className="scale-90 accent-black" />
                </td>
                <td className="border border-[#E0E0E0] px-4 py-2 font-mono text-center font-bold w-40">
                  {item.partNumber}
                </td>
                
                {/* PI Prediction (Static 0) */}
                <td className="border border-[#E0E0E0] px-4 py-2 text-center font-semibold text-gray-700 bg-gray-100 w-32">
                  {item.piPrediction}
                </td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    
    </div>
  );
}