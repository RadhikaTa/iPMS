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
import Scrap1 from "../assets/Scrap1.svg";
import { Link } from "react-router-dom";
import TransferOrder from "./TransferOrder"

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
                backgroundColor: ["#FB8C00", "#1E88E5", "#43A047"],
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
        "SUGGESTED_STOCK": "#1E88E5",
        "EXCLUDED_STOCK": "#FB8C00",
        "OTHERS_STOCK": "#43A047",

    };


    // Stock Chart (Static)
    // const stockDataSource = [
    //     { label: "OTHERS", count: 1541, donatcolor: "#ffcc00" },
    //     { label: "SUGGESTED", count: 476, donatcolor: "#ff8800" },
    //     { label: "EXCLUDED", count: 245, donatcolor: "#adb5bd" },
    // ];
    // const stockChartData = {
    //     labels: stockDataSource.map((i) => i.label),
    //     datasets: [
    //         {
    //             data: stockDataSource.map((i) => i.count),
    //             backgroundColor: stockDataSource.map((i) => i.donatcolor),
    //         },
    //     ],
    // };

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
                setIsLoading(false);
            }
        };
        fetchInventoryHealth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [DEALER_CODE]);

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
                        labels: data.map(item => item.category.toUpperCase().replaceAll("_", "\n")),

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


    // ===================== CHART OPTIONS (UNCHANGED) =====================
    const doughnutOptions = {
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        let total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        let percentage = ((ctx.raw / total) * 100).toFixed(2);
                        return `${ctx.label}: ${ctx.raw} (${percentage}%)`;
                    },
                },
            },
            doughnutLabels: true,
        },
        cutout: "88%",
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
        <div className="p-4 md:p-6 bg-[#ECEFF1]  min-h-screen text-sm overflow-x-hidden">

            {/* 1. TOP CARDS: Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                {/* Control Panel (No change needed) */}
                <div className="border bg-white p-4 rounded shadow-sm">
                    <h2 className="font-semibold text-[#101010] text-[16px] mb-2 uppercase">Generate Graphs</h2>
                    <p className="text-xs text-gray-500 mb-3">(At max 1 or 2)</p>

                    <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="bluebgColour" />
                            Inventory Health
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="bluebgColour" />
                            Suggested Stocks
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="bluebgColour" />
                            Idle & Pre Idle Inventory Trends
                        </label>
                    </div>
                    <br />
                    <button className="bluebgColour text-white px-4 py-2.5 rounded-[5px] flex items-center gap-2 hover:bg-blue-900 text-[13px] sm:text-sm">
                        Generate Report
                    </button>
                </div>

                {/* 2. Inventory Health Chart: Changed flex to allow stacking on mobile (flex-col) */}
                <div className="bg-white border p-4 rounded shadow-sm">
                    <Link to="/inventory-health-info">
                        <h2 className="font-semibold text-[16px] uppercase mb-2 text-center">Inventory Health</h2>

                        {/* 👇 CHANGE: Added flex-col for mobile, changed to flex-row on medium screens */}
                        <div className="flex flex-col items-center md:flex-row md:items-start gap-4">

                            {/* Chart Container: Reduced base width for very small screens */}
                            <div className="w-32 h-32 sm:w-40 sm:h-40 relative flex-shrink-0">
                                <Doughnut data={inventoryChartData} options={doughnutOptions} />
                            </div>

                            {/* Labels on Right Side */}
                            {/* 👇 CHANGE: Added text-center on mobile for centered layout */}
                            <div className="flex-1 text-center md:text-left">
                                {renderChartLabels(inventoryChartData, doughnutOptions)}
                            </div>

                        </div>
                    </Link>
                </div>

                {/* 3. Suggested Stocks Chart: Changed flex to allow stacking on mobile (flex-col) */}
                <div className="bg-white border p-4 rounded shadow-sm">
                    <h2 className="font-semibold text-[16px] uppercase mb-2 text-center">Suggested Stocks</h2>

                    {/* 👇 CHANGE: Added flex-col for mobile, changed to flex-row on medium screens */}
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-4">

                        {/* Doughnut Chart: Reduced base width for very small screens */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 relative flex-shrink-0">
                            <Doughnut data={stockChartData} options={doughnutOptions} />
                        </div>

                        {/* Labels on Right Side */}
                        {/* 👇 CHANGE: Added text-center on mobile for centered layout */}
                        <div className="flex-1 text-center md:text-left">
                            {renderChartLabels(stockChartData, doughnutOptions)}
                        </div>
                    </div>
                </div>

                {/* Tips (No change needed) */}
                <div className="bg-white border p-4 rounded shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <img src={AiLogo} className="w-9 h-5" alt="AI" />
                        <h2 className="font-bold text-[16px] uppercase">Tips</h2>
                    </div>

                    <ul className="font-semibold text-[13px] text-sm space-y-2">
                        <li className="bg-[#ECEFF1] rounded-[5px] p-2 text-[13px] text-black">Suggested Stocks Below RDP 38</li>
                        <li className="bg-[#ECEFF1] rounded-[5px] p-2 text-[13px] text-black">Idle Inventory &gt; 2%</li>
                        <li className="bg-[#ECEFF1] rounded-[5px] p-2 text-[13px] text-black">Pre Idle Inventory &gt; 2%</li>
                    </ul>
                </div>
            </div>

            {/* 4. ACTION BAR: Use flex-wrap on mobile */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">

                {/* Buttons: Use flex-wrap on small screens */}
                <div className="flex flex-wrap gap-4">
                    <button className="bluebgColour text-white px-4 py-2.5 rounded-[5px] flex items-center gap-2 hover:bg-blue-900 text-[13px] sm:text-sm">
                        <img src={Excel} className="w-4 h-4" alt="Excel" />
                        EXPORT TO EXCEL
                    </button>

                    <button className="bluebgColour text-white px-4 py-2.5 rounded-[5px] flex items-center gap-2 hover:bg-blue-900 text-[13px] sm:text-sm">
                        <img src={Print} className="w-4 h-4" alt="Print" />
                        PRINT
                    </button>
                    <Link to="part-numbers-quantity-prediction">
                     <button className="bluebgColour text-white px-4 py-2.5 rounded-[5px] flex items-center gap-2 hover:bg-blue-900 text-[13px] sm:text-sm">
                        HISTORICAL DATA
                    </button>
                    </Link>
                </div>

                {/* Legends: Ensure good spacing with flex-wrap */}
                <div className="bg-white rounded-[5px] flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium px-3 border-[1px] border-[#D5D5D5">
                    <span className="font-bold">Legends:</span>

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
                        <img src={Scrap1} className="w-5 h-5" alt="Scrap1" />
                    </span>
                </div>

            </div>

            {/* 5. DATA TABLE: Scrollable Wrapper */}
            {/* The overflow-x-auto on the wrapper is crucial to handle the min-w-[1200px] table */}
            {/* The overflow-x-auto on the wrapper is crucial to handle the min-w-[1200px] table */}
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                <table className="w-full min-w-[1200px] text-xs border-collapse font-sans">
                    <thead>
                        <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
                            {/* Header Checkbox */}
                            <th className="px-4 py-3 bg-[#2953CD] w-[50px] text-center">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-white cursor-pointer"
                                    />
                                </div>
                            </th>

                            {/* Header Columns */}
                            {["Part No", "Part Name", "Status"].map((heading, index) => (
                                <th
                                    key={index}
                                    className={`px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap bg-[#2953CD] ${heading === "Status" ? "text-center" : "text-left"
                                        }`}
                                >
                                    {/* Added conditional justify-center for Status column */}
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer ${heading === "Status" ? "justify-center" : "justify-start"
                                            }`}
                                    >
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

                    <tbody className="bg-white">
                        {currentParts.length > 0 ? (
                            currentParts.map((item, idx) => (
                                <tr
                                    key={item.id || idx}
                                    className={`${idx % 2 === 0 ? "bg-[#FFFFFF]" : "bg-[#ECEFF1]"
                                        } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
                                >
                                    {/* Body Checkbox */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-[#2953CD] cursor-pointer"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                            />
                                        </div>
                                    </td>

                                    {/* Part No */}
                                    <td className="px-4 py-3 text-[#101010] font-medium text-left">
                                        {item.part_no}
                                    </td>

                                    {/* Part Name */}
                                    <td className="px-4 py-3 text-[#101010] text-left">
                                        {item.part_name}
                                    </td>

                                    {/* Status Badge - Kept Center to match the now Centered Header */}
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className="px-3 py-1 rounded text-white text-[11px] font-medium inline-block shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    donatColor[item.status?.toUpperCase()] || "#999",
                                            }}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-gray-500 text-sm">
                                    No parts data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 6. PAGINATION (No change needed) */}
            {totalPages > 1 && (
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

            {/* 7. BOTTOM BUTTONS: Use flex-wrap to prevent overflow */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 pb-6">
                <button className="bluebgColour text-white px-6 py-2.5 rounded-[3px] hover:bg-blue-900 text-[13px] sm:text-sm">
                    GENERATE DATA FILE
                </button>
                {/* <button className="bluebgColour text-white px-6 py-2.5 rounded-[3px] hover:bg-blue-900 text-[13px] sm:text-sm">
                  <Link to='./VOROrder.jsx'>  TRANSFER TO VOR </Link>
                </button> */}
                <Link to="/transfer-order">
                <button className="bluebgColour text-white px-6 py-2.5 rounded-[3px] hover:bg-blue-900 text-[13px] sm:text-sm">
                    TRANSFER ORDER
                </button>
                </Link>
                <button className="bluebgColour text-white px-6 py-2.5 rounded-[3px] hover:bg-blue-900 text-[13px] sm:text-sm">
                    RESET
                </button>
            </div>
        </div>
    );
};

export default Dashboard;