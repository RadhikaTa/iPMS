import React, { useState } from 'react';

const PartsInquiry = () => {
  const [rows, setRows] = useState(
    Array(5).fill({
      partNumber: '',
      inqQty: '',
      vcQty: '',
      abQty: '',
      icQty: '',
      chQty: '',
      txQty: '',
      gaQty: '',
      paQty: '',
      description: '',
      dealerCost: '',
      suggRetail: '',
      remark: '',
      iaiTips: '',
      selected: false,
    })
  );

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  return (
    <div className="bg-[#ECEFF1] px-4 sm:px-6 py-6 font-mazda text-sm min-h-screen">
      {/* Top Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex gap-2">
          <button className="bluebgColour rounded-[3px] text-white font-semibold text-[13px] px-5 py-1.5 hover:bg-blue-900">ADD</button>
          <button className="border border-black rounded-[3px] font-semibold text-[13px] px-5 py-1.5 hover:bg-gray-100">DELETE</button>
        </div>
        <button className="border border-black font-semibold rounded-[3px] text-[13px] px-5 py-1.5 hover:bg-gray-100">
          UPLOAD EPIC DATA FILE
        </button>
      </div>

      {/* Table */}
      {/* MULTI-QTY ORDER TABLE – MASTER STYLE */}
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
        <table className="w-full min-w-[1400px] text-xs border-collapse font-sans">
 
          {/* HEADER */}
          <thead>
            <tr className="sticky top-0 z-10 h-[66px] bg-[#2953CD] text-white">
              {[
                '✓', 'Line', 'Part Number', 'Inq Qty', 'Qty - VC', 'Qty - AB', 'Qty - IC',
                'Qty - CH', 'Qty - TX', 'Qty - GA', 'Qty - PA', 'Description',
                'Dealer Cost', 'Sugg Retail', 'Remark', 'iAI Tips',
              ].map((heading, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap bg-[#2953CD] ${heading === '✓' || heading === 'iAI Tips'
                      ? 'text-center'
                      : 'text-left'
                    }`}
                >
                  <div
                    className={`flex items-center gap-2 ${heading === '✓' || heading === 'iAI Tips'
                        ? 'justify-center'
                        : 'justify-start'
                      }`}
                  >
                    <span
                      className={heading === 'Part Number' ? 'underline cursor-pointer' : ''}
                    >
                      {heading}
                    </span>
                    {heading !== '✓' && (
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
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
 
          {/* BODY */}
          <tbody className="bg-white">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`${idx % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#ECEFF1]'
                  } hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 h-[60px] text-[13px]`}
              >
                {/* Checkbox */}
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => handleChange(idx, 'selected', !row.selected)}
                    className="w-4 h-4 accent-[#2953CD] cursor-pointer"
                  />
                </td>
 
                {/* Line */}
                <td className="px-4 py-3 text-center font-medium">
                  {idx + 1}
                </td>
 
                {[
                  'partNumber', 'inqQty', 'vcQty', 'abQty', 'icQty',
                  'chQty', 'txQty', 'gaQty', 'paQty',
                  'description', 'dealerCost', 'suggRetail', 'remark',
                ].map((field, i) => (
                  <td key={i} className="px-4 py-3">
                    <input
                      type={[
                        'inqQty', 'vcQty', 'abQty', 'icQty',
                        'chQty', 'txQty', 'gaQty', 'paQty',
                        'dealerCost', 'suggRetail',
                      ].includes(field) ? 'number' : 'text'}
                      value={row[field]}
                      onChange={(e) => handleChange(idx, field, e.target.value)}
                      className={`w-full h-[32px] rounded border border-gray-300 px-2 text-[13px] ${field !== 'description' && field !== 'remark'
                          ? 'text-center'
                          : ''
                        } focus:ring-1 focus:ring-[#2953CD] focus:outline-none`}
                    />
                  </td>
                ))}
 
                {/* iAI Tips */}
                <td className="px-4 py-3 text-center text-[16px] text-green-600 font-bold">
                  ✓
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
 

      {/* Bottom Totals */}
      <div className="mt-4 flex flex-wrap justify-end items-center gap-2 text-[13px]">
        <span className="font-semibold">TOTAL:</span>
        <input
          type="text"
          readOnly
          className="border-b border-gray-400 bg-transparent w-[100px] text-end"
        />
        <input
          type="text"
          readOnly
          className="border-b border-gray-400 bg-transparent w-[100px] text-end"
        />
      </div>

      {/* Bottom Buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-[9px] font-semibold uppercase">
        <button className="bluebgColour rounded-[3px] text-white px-5 py-1.5 text-[13px] hover:bg-blue-900">INQUIRE</button>
        <button className="border border-black rounded-[3px] px-3 py-1.5 text-[13px] hover:bg-gray-100">ESTIMATE</button>
        <button className="border border-black rounded-[3px] px-3 py-1.5 text-[13px] hover:bg-gray-100">TRANSFER TO VOR</button>
        <button className="border border-black rounded-[3px] px-3 py-1.5 text-[13px] hover:bg-gray-100">TRANSFER TO STOCK ORDER</button>
        <button className="border border-black rounded-[3px] px-3 py-1.5 text-[13px] hover:bg-gray-100">RESET</button>
        <button className="border border-black rounded-[3px] px-3 py-1.5 text-[13px] hover:bg-gray-100">PRINT</button>
        <button className="border border-black px-3 py-1.5 text-[13px] hover:bg-gray-100">PRINT RETAIL</button>
      </div>
    </div>
  );
};

export default PartsInquiry;
