import React, {useState} from "react";
import { Link } from "react-router-dom";
import '../index.css';

export default function InventoryHealthInfo() {
  const [activeTab, setActiveTab] = useState("IDLE");
  return (
    <div className="w-full min-h-screen overflow-x-auto overflow-y-auto bg-gray-50">
    <div className="min-h-screen flex flex-col bg-gray-50">
        <Link to="/" className="font-bold text-sm p-3 underline">
          RETURN TO DASHBOARD
        </Link>

      {/* NAVBAR */}
      <nav className="w-full p-4 flex items-center text-[13px] text-gray-600 gap-8 font-medium border-b ">

        {/* LEFT SIDE: Return to Dashboard */}
        <button
          onClick={() => setActiveTab("IDLE")}
          className={`hover:text-gray-900 transition ${
            activeTab === "IDLE" ? "underline-offset" : ""
          }`
        }> 
          IDLE
        </button>
        <button
          onClick={() => setActiveTab("PRE_IDLE")}
          className={`hover:text-gray-900 transition ${
            activeTab === "PRE_IDLE" ? "underline-offset" : ""
          }`
        }> 
          PRE IDLE
        </button>
        <button
          onClick={() => setActiveTab("DROP_SHIP")}
          className={`hover:text-gray-900 transition ${
            activeTab === "DROP_SHIP" ? "underline-offset" : ""
          }`
        }> 
          DROP SHIP
        </button>
        <button
          onClick={() => setActiveTab("NORMAL")}
          className={`hover:text-gray-900 transition ${
            activeTab === "NORMAL" ? "underline-offset" : ""
          }`
        }> 
          NORMAL
        </button>
        

      </nav>

      {/* PAGE CONTENT */}
      <div className="flex-1 p-6">

        {/* Your table goes here */}
        {activeTab === "IDLE" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">IDLE PARTS LIST</h2>
             
             <div className="flex pt-2 pb-2">
              <button
                   
                    className= "flex align-items-center bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800">
                       <img src="/src/assets/Excel.svg" alt="icon" /> 
                     EXPORT TO EXCEL
              </button>
              <button
                className="flex align-items-center bg-black text-white py-2 px-4 rounded  items-center gap-2 hover:bg-gray-800 ml-4"> 
                <img src="/src/assets/print.svg" alt="icon" style={{ width: "20px", height: "20px", marginRight: "4px" }} /> 
                PRINT
              </button>
             </div>
            
            <table className="w-full whitespace-nowrap mb-0  border-shadow-sm">
              <thead className="bg-[#2B2B2B] text-white">
                <tr>
                  <th className="p-3 text-[13px] font-normal ">PART NO.</th>
                  <th className="p-3 text-[13px] font-normal">PART DESCRIPTION</th>
                  <th className="p-3 text-[13px] font-normal">ON HAND QTY</th>
                  <th className="p-3 text-[13px] font-normal">DNP</th>
                  <th className="p-3 text-[13px] font-normal">INVENTORY VALUE</th>
                  <th className="p-3 text-[13px] font-normal">AGING MONTHS</th>
                  <th className="p-3 text-[13px] font-normal">12 MONTHS SALES QTY</th>
                  <th className="p-3 text-[13px] font-normal">PRODUCT HEIRARCHY</th>
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-white even:bg-gray-100">
                  <td className="p-3 text-[13px]">0000-11-0194</td>
                  <td className="p-3 text-[13px]">BULB</td>
                  <td className="p-3 text-[13px]">3</td>
                  <td className="p-3 text-[13px]">2.05</td>
                  <td className="p-3 text-[13px]">6.15</td>
                  <td className="p-3 text-[13px]">9</td>
                  <td className="p-3 text-[13px]">13</td>
                  <td className="p-3 text-[13px]">REPAIR-ELECTRICAL</td>
                </tr>
                <tr className="odd:bg-white even:bg-gray-100">
                  <td className="p-3 text-[13px]">KBB4-60-220</td>
                  <td className="p-3 text-[13px]">COVER,COLUMN-UPPER</td>
                  <td className="p-3 text-[13px]">3</td>
                  <td className="p-3 text-[13px]">5.3</td>
                  <td className="p-3 text-[13px]">15.9</td>
                  <td className="p-3 text-[13px]">12</td>
                  <td className="p-3 text-[13px]">4</td>
                  <td className="p-3 text-[13px]">REPAIR-OTHER INTERIOR</td>
            
                </tr>
                <tr className="odd:bg-white even:bg-gray-100">
                  <td className="p-3 text-[13px]">0000-11-0H7</td>
                  <td className="p-3 text-[13px]">BULB,LOW BEAM</td>
                  <td className="p-3 text-[13px]">50</td>
                  <td className="p-3 text-[13px]">5.87</td>
                  <td className="p-3 text-[13px]">293.5</td>
                  <td className="p-3 text-[13px]">11</td>
                  <td className="p-3 text-[13px]">5</td>
                  <td className="p-3 text-[13px]">REPAIR-ELECTRICAL</td>
            
                </tr>
                <tr className="odd:bg-white even:bg-gray-100">
                  <td className="p-3 text-[13px]">VAS1-V3-840A</td>
                  <td className="p-3 text-[13px]">Crossbars, Black, PIO Set</td>
                  <td className="p-3 text-[13px]">4</td>
                  <td className="p-3 text-[13px]">7.76</td>
                  <td className="p-3 text-[13px]">31.04</td>
                  <td className="p-3 text-[13px]">17</td>
                  <td className="p-3 text-[13px]">0</td>
                  <td className="p-3 text-[13px]">ACCESSORY-ACCESSORY</td>
            
                </tr>
                <tr className="odd:bg-white even:bg-gray-100">
                  <td className="p-3 text-[13px]">VC67-V3-440</td>
                  <td className="p-3 text-[13px]">Splash Guards, Front & Rear</td>
                  <td className="p-3 text-[13px]">7</td>
                  <td className="p-3 text-[13px]">20.7</td>
                  <td className="p-3 text-[13px]">144.9</td>
                  <td className="p-3 text-[13px]">10</td>
                  <td className="p-3 text-[13px]">23</td>
                  <td className="p-3 text-[13px]">ACCESSORY-ACCESSORY</td>
            
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="pt-3 pb-8 mb-20 flex justify-center items-center gap-2 select-none">

            <button className="px-4 py-1 text-gray-400">
              &lt;
            </button>

            <button className="px-3 py-1  text-gray-400">
              1
            </button>

            <button className="px-3 py-1  text-gray-400">
              2
            </button>

            <button className="px-3 py-1  text-gray-400">
              3
            </button>

            <button className="px-3 py-1  text-gray-400">
              &gt;
            </button>

          </div>
      </div>
    </div>
    

    </div>
  );
}
