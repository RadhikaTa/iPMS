"use client";
import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Assets
import AiLogo from "../assets/iAI.png";
import Excel from "../assets/Excel.svg";
import Print from "../assets/Print.svg";
import Returnable from "../assets/Returnable.svg";
import Collision from "../assets/Collision.svg";
import Scrap from "../assets/Scrap.svg";

// ===================== CHART.JS PLUGIN DEFINITION (TOTAL IN CENTER) =====================
const doughnutLabelsPlugin = {
  id: "doughnutLabels",
  afterDraw(chart) {
    const { ctx, data } = chart;
    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

    // Get the center position of the chart
    const { x, y } = chart.getDatasetMeta(0).data[0].getCenterPoint();

    // 1. Display the TOTAL in the center
    ctx.save();
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // If you uncomment these lines, the total count will appear in the center
    // ctx.fillText(`${total}`, x, y); 

    // Optional: Draw a label for the total
    ctx.font = "10px Arial";
    ctx.fillStyle = "#666666";
    // ctx.fillText("TOTAL", x, y + 15);
    ctx.restore();
  },
};

// ===================== CHART.JS REGISTRATION =====================
// Register required elements and the custom plugin
ChartJS.register(ArcElement, Tooltip, Legend, doughnutLabelsPlugin);

const Dashboard = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [partsData, setPartsData] = useState([]);
  const [inventoryChartData, setInventoryChartData] = useState({
    labels: ["NORMAL", "DROPSHIP-PREIDLE", "IDLE", "PREIDLE", "IDLE-RETIRED"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: ["#28a745", "#3399ff", "#ffc107", "#d63384", "#adb5bd"],
      },
    ],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Colors
  const donatColor = {
    "NORMAL": "#28a745",
    "DROPSHIP-PREIDLE": "#3399ff",
    "IDLE": "#ffc107",
    "PREIDLE": "#d63384",
    "IDLE-RETIRED": "#adb5bd",
  };

  // Stock Chart (Static)
  const stockDataSource = [
    { label: "OTHERS", count: 1541, donatcolor: "#ffcc00" },
    { label: "SUGGESTED", count: 476, donatcolor: "#ff8800" },
    { label: "EXCLUDED", count: 245, donatcolor: "#adb5bd" },
  ];
  const stockChartData = {
    labels: stockDataSource.map((i) => i.label),
    datasets: [
      {
        data: stockDataSource.map((i) => i.count),
        backgroundColor: stockDataSource.map((i) => i.donatcolor),
      },
    ],
  };

  // ⚠️ Define the required dealer code here (outside the useEffects for better scope)
  const DEALER_CODE = typeof window !== 'undefined' ? localStorage.getItem("dealer_code") || "10131" : "10131"; 

  // ===================== FETCH PARTS TABLE =====================
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const url = `http://127.0.0.1:8000/api/parts?dealer_code=${DEALER_CODE}`;
        
        // 🚀 Send the request with the required query parameter
        const response = await fetch(url); 
        
        if (!response.ok)
          throw new Error(`Parts API error! status: ${response.status}`);

        const data = await response.json();
        setPartsData(data);
      } catch (err) {
        console.error("Error fetching parts:", err);
        // You should check if err has a message property before accessing it
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    fetchParts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DEALER_CODE]); // Depend on DEALER_CODE for a single load

  // ===================== FETCH INVENTORY HEALTH (UPDATED) =====================
  useEffect(() => {
    const fetchInventoryHealth = async () => {
      try {
        // 🎯 CHANGE: Construct URL with dealer_code
        const url = `http://127.0.0.1:8000/api/inv-health?dealer_code=${DEALER_CODE}`;

        const response = await fetch(url);
        if (!response.ok)
          throw new Error(
            `Inventory Health API error! status: ${response.status}`
          );

        const data = await response.json();

        if (data && Array.isArray(data)) {
          const newChartData = {
            labels: data.map((item) => item.status.toUpperCase()),
            datasets: [
              {
                data: data.map((item) => item.part_count),
                backgroundColor: data.map(
                  (item) => donatColor[item.status.toUpperCase()] || "#cccccc"
                ),
              },
            ],
          };
          setInventoryChartData(newChartData);
        }
      } catch (err) {
        console.error("Error fetching inventory health:", err);
      } finally {
        // Keep isLoading set here only if you want the loading spinner
        // to disappear only after *both* fetches complete.
        // For simplicity, I'll keep it here, assuming partsData is less critical
        // for initial dashboard rendering.
        setIsLoading(false); 
      }
    };

    fetchInventoryHealth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DEALER_CODE]); // 🎯 Added dependency on DEALER_CODE
// ... (rest of the component) ...


  // ===================== CHART OPTIONS =====================
  const doughnutOptions = {
    // Disable Chart.js legend since we are rendering custom labels next to the chart
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            let total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            // 🎯 FIXED: Tooltip percentage to 2 decimal places
            let percentage = ((ctx.raw / total) * 100).toFixed(2);
            return `${ctx.label}: ${ctx.raw} (${percentage}%)`;
          },
        },
      },
      doughnutLabels: true, // Enable the custom total-in-center plugin
    },
    cutout: "85%", // Increased cutout for a thinner ring
    maintainAspectRatio: false, // Allows chart container to define the size more easily
  };


  // ===================== PAGINATION =====================
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const partsArray = Array.isArray(partsData) ? partsData : [];

  const currentParts = partsArray.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(partsArray.length / rowsPerPage);

  const goToNextPage = () =>
    setCurrentPage((page) => (page < totalPages ? page + 1 : page));
  const goToPrevPage = () =>
    setCurrentPage((page) => (page > 1 ? page - 1 : page));

  // ===================== SELECT HANDLER =====================
  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ===================== Chart Label Renderer (Helper function) =====================
  const renderChartLabels = (data, chartOptions) => {
    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

    return (
      <div className="text-xs space-y-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index];
          // Handle potential division by zero
          // 🎯 FIXED: Manual label percentage to 2 decimal places
          const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2);
          const color = data.datasets[0].backgroundColor[index];

          return (
            <div key={index} className="flex flex-col leading-tight">
              <span className="font-bold">
                {value}, {percentage}%
              </span>
              <span style={{ color }}>{label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ===================== LOADING / ERROR =====================
  if (isLoading)
    return (
      <div className="p-6 min-h-screen flex justify-center items-center">
        Loading dashboard data...
      </div>
    );

  if (error)
    return (
      <div className="p-6 min-h-screen text-red-600 flex justify-center items-center">
        Error loading data: {error}
      </div>
    );

  // ===================== RENDER UI =====================
  return (
    <div className="p-4 md:p-6 bg-white overflow-y-auto min-h-screen text-sm">
      {/* ===================== TOP CARDS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Control Panel */}
        <div className="border p-4 rounded shadow-sm">
          <h2 className="font-bold text-sm mb-2 uppercase">Generate Graphs</h2>
          <p className="text-xs text-gray-500 mb-3">(At max 1 or 2)</p>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-black" />
              Inventory Health
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-black" />
              Suggested Stocks
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-black" />
              Idle & Pre Idle Inventory Trends
            </label>
          </div>

          <button className="bg-black text-white w-full py-2 mt-4 rounded hover:bg-gray-800">
            Generate Report
          </button>
        </div>

        {/* Inventory Health Chart */}
        <div className="border p-4 rounded shadow-sm items-center gap-6">
          <h2 className="font-bold text-sm uppercase mb-2 text-center">Inventory Health</h2>
          <div className="flex">
            <div className="w-40 h-40 relative m-4 ">
              <h2 className="font-bold text-sm uppercase mb-2 absolute top-2 left-4 sr-only">Inventory Health</h2> {/* Title hidden for layout but good for accessibility/print */}
              <Doughnut data={inventoryChartData} options={doughnutOptions} />
            </div>

            {/* Labels on Right Side */}
            <div className="flex-1">
              {renderChartLabels(inventoryChartData, doughnutOptions)}
            </div>

          </div>

        </div>


        {/* Suggested Stocks Chart */}
        <div className="border p-4 rounded shadow-sm items-center gap-6">
          <h2 className="font-bold text-sm uppercase mb-2 text-center">Suggested Stocks</h2>

          <div className="flex">
            {/* Doughnut Chart */}
            <div className="w-40 h-40 relative m-4">
              <h2 className="font-bold text-sm uppercase mb-2 absolute top-2 left-4 sr-only">
                Suggested Stocks
              </h2>
              <Doughnut data={stockChartData} options={doughnutOptions} />
            </div>

            {/* Labels on Right Side */}
            <div className="flex-1">
              {renderChartLabels(stockChartData, doughnutOptions)}
            </div>
          </div>
        </div>


        {/* Tips */}
        <div className="border p-4 rounded shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src={AiLogo} className="w-9 h-5" alt="AI" />
            <h2 className="font-bold text-sm uppercase">Tips</h2>
            </div>

          <ul className="list-disc pl-5 text-red-600 font-medium text-sm space-y-1">
            <li>Suggested Stocks Below RDP 38</li>
            <li>Idle Inventory &gt; 2%</li>
            <li>Pre Idle Inventory &gt; 2%</li>
          </ul>
        </div>
      </div>

      {/* ===================== ACTION BAR ===================== */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <button className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800">
            <img src={Excel} className="w-4 h-4" alt="Excel" />
            Export to Excel
          </button>

          <button className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800">
            <img src={Print} className="w-4 h-4" alt="Print" />
            Print
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="font-bold">LEGENDS:</span>

          <span className="flex items-center gap-1">
            Returnable
            <img src={Returnable} className="w-4 h-4" alt="Returnable" />
          </span>

          <span className="flex items-center gap-1">
            Collision
            <img src={Collision} className="w-4 h-4" alt="Collision" />
          </span>

          <span className="flex items-center gap-1">
            Scrap
            <img src={Scrap} className="w-4 h-4" alt="Scrap" />
          </span>
        </div>

      </div>

      {/* ===================== DATA TABLE ===================== */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <table className="min-w-[1200px] w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#2B2B2B] text-white uppercase h-11">
              <th className="px-3 py-2 text-left border w-12">
                <input type="checkbox" className="accent-white" />
              </th>

              {[
                "Part No",
                "Part Name",
                "Status",
              ].map((heading, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left border whitespace-nowrap"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white">
            {currentParts.length > 0 ? (
              currentParts.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="h-11 hover:bg-gray-50 transition"
                >
                  <td className="border px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      className="accent-black"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </td>

                  <td className="border px-3 py-2 font-medium">{item.part_no}</td>
                  <td className="border px-3 py-2">{item.part_name}</td>

                  <td className="border px-3 py-2 text-center">
                    <span
                      className="px-2 py-0.5 rounded text-white text-[10px]"
                      style={{ backgroundColor: donatColor[item.status?.toUpperCase()] || "#999" }}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="text-center py-4 text-gray-500">
                  No parts data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== PAGINATION ===================== */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <ul className="flex gap-2 text-sm items-center">
            <li>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                &lt; Prev
              </button>
            </li>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isFirst = page === 1;
              const isLast = page === totalPages;
              const isCurrent = page === currentPage;
              const isNearCurrent = Math.abs(currentPage - page) <= 2;

              if (totalPages > 10 && !isFirst && !isLast && !isCurrent && !isNearCurrent) {
                if (page === currentPage - 3 || page === currentPage + 3) {
                  return <li key={`ellipsis-${page}`} className="text-gray-500">...</li>;
                }
                return null;
              }

              return (
                <li
                  key={page}
                  className={`px-3 py-1 border rounded cursor-pointer ${page === currentPage
                    ? "bg-black text-white"
                    : "hover:bg-gray-100"
                    }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </li>
              );
            })}

            <li>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next &gt;
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ===================== BOTTOM BUTTONS ===================== */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 pb-6">
        <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
          Generate Data File
        </button>
        <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
          Transfer to VOR
        </button>
        <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
          Transfer to Stock Order
        </button>
        <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
          Reset
        </button>
      </div>
    </div>
  );
};

export default Dashboard;