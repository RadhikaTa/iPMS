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
import { Link } from "react-router-dom";

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

        // Optional: Draw a label for the total
        ctx.font = "10px Arial";
        ctx.fillStyle = "#666666";
        // ctx.fillText("TOTAL", x, y + 15);
        ctx.restore();
    },
};

// ===================== CHART.JS REGISTRATION =====================
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

    // Stock chart state (initial values mirror the previous hardcoded data)
    const [stockChartData, setStockChartData] = useState({
        labels: ["EXCLUDED_STOCK", "SUGGESTED_STOCK", "OTHERS_STOCK"],
        datasets: [
            {
                data: [0, 0, 0],
                backgroundColor: ["#adb5bd", "#ff8800", "#ffcc00"],
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
        "SUGGESTED_STOCK": "#ff8800",
        "EXCLUDED_STOCK": "#adb5bd",
        "OTHERS_STOCK": "#ffcc00",
    };


    // Fallback data source for suggested stocks (kept for reference)
    //        const stockDataSource = [
    //                { label: "OTHERS", count: 1541, donatcolor: "#ffcc00" },
    //                { label: "SUGGESTED", count: 476, donatcolor: "#ff8800" },
    //                { label: "EXCLUDED", count: 245, donatcolor: "#adb5bd" },
    //        ];
    //
    // ⚠️ Define the required dealer code here (outside the useEffects for better scope)
    const DEALER_CODE = typeof window !== 'undefined' ? localStorage.getItem("dealer_code") || "10131" : "10131";

    // ===================== FETCH EFFECTS (UNCHANGED) =====================
    useEffect(() => {
        const fetchParts = async () => {
            try {
                const url = `http://127.0.0.1:8000/api/parts?dealer_code=${DEALER_CODE}`;
                const response = await fetch(url);

                if (!response.ok)
                    throw new Error(`Parts API error! status: ${response.status}`);

                const data = await response.json();
                setPartsData(data);
            } catch (err) {
                console.error("Error fetching parts:", err);
                setError(err instanceof Error ? err.message : String(err));
            }
        };
        fetchParts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [DEALER_CODE]);

    useEffect(() => {
        const fetchInventoryHealth = async () => {
            try {
                const url = `http://127.0.0.1:8000/api/inv-health?dealer_code=${DEALER_CODE}`;
                const response = await fetch(url);
                if (!response.ok)
                    throw new Error(
                        `Inventory Health API error! status: ${response.status}`
                    );

                const data = await response.json();

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


    //====================FETCH SUGGESTED STOCKS DATA=====================
    // ================== FETCH SUGGESTED STOCKS DATA ===================
    useEffect(() => {
        const fetchSuggestedStocks = async () => {
            try {
                const url = `http://127.0.0.1:8000/api/suggested-stocks?dealer_code=${DEALER_CODE}`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    const newChartData = {
                        labels: data.map(item => item.category.toUpperCase()),

                        datasets: [
                            {
                                data: data.map(item => item.items_count),
                                backgroundColor: data.map(
                                    item => donatColor[item.category.toUpperCase()] || "#ccc"
                                ),
                            },
                        ],
                    };

                    setStockChartData(newChartData);
                }
            } catch (err) {
                console.error("Error fetching Suggested Stocks:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestedStocks();
    }, [DEALER_CODE]);
    // 🎯 Added dependency on DEALER_CODE
    // ... (rest of the component) ...

    // ===================== CHART OPTIONS =====================
    const doughnutOptions = {
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((ctx.raw / total) * 100).toFixed(2);
                        return `${ctx.label}: ${ctx.raw} (${percentage}%)`;
                    },
                },
            },
        },
        cutout: "85%",
        maintainAspectRatio: false,
    };


    // ===================== PAGINATION (UNCHANGED) =====================
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const partsArray = Array.isArray(partsData) ? partsData : [];
    const currentParts = partsArray.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(partsArray.length / rowsPerPage);
    const goToNextPage = () =>
        setCurrentPage((page) => (page < totalPages ? page + 1 : page));
    const goToPrevPage = () =>
        setCurrentPage((page) => (page > 1 ? page - 1 : page));

    // ===================== SELECT HANDLER (UNCHANGED) =====================
    const handleSelectItem = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // ===================== Chart Label Renderer (Helper function) =====================
    const renderChartLabels = (data) => {
        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

        return (
            <div className="text-xs space-y-2">
                {data.labels.map((label, index) => {
                    const value = data.datasets[0].data[index];
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

    // ... (LOADING / ERROR UI REMAINS THE SAME) ...
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

    // ===================== RENDER UI (RESPONSIVE CHANGES) =====================
    return (
        <div className="p-4 md:p-6 bg-white overflow-y-auto min-h-screen text-sm">

            {/* 1. TOP CARDS: Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                {/* Control Panel (No change needed) */}
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

                {/* 2. Inventory Health Chart: Changed flex to allow stacking on mobile (flex-col) */}
                <div className="border p-4 rounded shadow-sm">
                    <h2 className="font-bold text-sm uppercase mb-2 text-center">Inventory Health</h2>

                    {/* 👇 CHANGE: Added flex-col for mobile, changed to flex-row on medium screens */}
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-4">

                        {/* Chart Container: Reduced base width for very small screens */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 relative flex-shrink-0">
                            <Doughnut data={inventoryChartData} options={doughnutOptions} />
                        </div>

                        {/* Labels on Right Side */}
                        {/* 👇 CHANGE: Added text-center on mobile for centered layout */}
                        <div className="flex-1 text-center md:text-left">
                            {renderChartLabels(inventoryChartData)}
                        </div>

                    </div>
                </div>

                {/* 3. Suggested Stocks Chart: Changed flex to allow stacking on mobile (flex-col) */}
                <div className="border p-4 rounded shadow-sm">
                    <h2 className="font-bold text-sm uppercase mb-2 text-center">Suggested Stocks</h2>

                    {/* 👇 CHANGE: Added flex-col for mobile, changed to flex-row on medium screens */}
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-4">

                        {/* Doughnut Chart: Reduced base width for very small screens */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 relative flex-shrink-0">
                            <Doughnut data={stockChartData} options={doughnutOptions} />
                        </div>

                        {/* Labels on Right Side */}
                        {/* 👇 CHANGE: Added text-center on mobile for centered layout */}
                        <div className="flex-1 text-center md:text-left">
                            {renderChartLabels(stockChartData)}
                        </div>
                    </div>
                </div>

                {/* Tips (No change needed) */}
                <div className="border p-4 rounded shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <img src={AiLogo} className="w-9 h-5" alt="AI" />
                        <h2 className="font-bold text-sm uppercase">Tips</h2>
                    </div>


                    {/* Inventory Health Chart */}
                    <Link to="/inventory-health-info">
                        <div className="border p-4 rounded shadow-sm items-center gap-6">
                            <h2 className="font-bold text-sm uppercase mb-2 text-center">Inventory Health</h2>
                            <div className="flex">
                                <div className="w-40 h-40 relative m-4 ">
                                    <h2 className="font-bold text-sm uppercase mb-2 absolute top-2 left-4 sr-only">Inventory Health</h2> {/* Title hidden for layout but good for accessibility/print */}
                                    <Doughnut data={inventoryChartData} options={doughnutOptions} />
                                </div>


                                {/* 4. ACTION BAR: Use flex-wrap on mobile */}
                                < div className="flex flex-col lg:flex-row justify-between gap-4 mb-4" >

                                    {/* Buttons: Use flex-wrap on small screens */}
                                    < div className="flex flex-wrap gap-2" >
                                        <button className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 text-xs sm:text-sm">
                                            <img src={Excel} className="w-4 h-4" alt="Excel" />
                                            Export to Excel
                                        </button>

                                        <button className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 text-xs sm:text-sm">
                                            <img src={Print} className="w-4 h-4" alt="Print" />
                                            Print
                                        </button>
                                    </div >
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Legends: Ensure good spacing with flex-wrap */}
                    < div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium" >
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
                    </div >

                </div >

                {/* 5. DATA TABLE: Scrollable Wrapper */}
                {/* The overflow-x-auto on the wrapper is crucial to handle the min-w-[1200px] table */}
                <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
                    <table className="min-w-[1200px] w-full border-collapse text-xs">
                        <thead>
                            <tr className="bg-[#2B2B2B] text-white uppercase h-11">
                                <th className="px-3 py-2 text-left border w-12">
                                    <input type="checkbox" className="accent-white" />
                                </th>

                                {["Part No", "Part Name", "Status"].map((heading, index) => (
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
                            {/* ... (Table Body remains the same) ... */}
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

                {/* 6. PAGINATION (No change needed) */}
                {
                    totalPages > 1 && (
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
                    )
                }

                {/* 7. BOTTOM BUTTONS: Use flex-wrap to prevent overflow */}
                <div className="flex flex-wrap justify-center gap-4 mt-6 pb-6">
                    <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                        Generate Data File
                    </button>
                    <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                        Transfer to VOR
                    </button>
                    <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                        Transfer to Stock Order
                    </button>
                    <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                        Reset
                    </button>
                </div>
            </div >
            );
};

            export default Dashboard;