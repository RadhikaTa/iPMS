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
    <div className="bg-[#F9F9F9] px-4 sm:px-6 py-6 font-mazda text-sm min-h-screen">
      {/* Top Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex gap-2">
          <button className="bg-black text-white text-[11px] px-5 py-1.5">ADD</button>
          <button className="border border-black text-[11px] px-5 py-1.5">DELETE</button>
        </div>
        <button className="border border-black text-[11px] px-5 py-1.5">
          UPLOAD EPIC DATA FILE
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#D9D9D9] bg-white overflow-x-auto">
        <table className="min-w-[1200px] w-full border-collapse text-[13px]">
          <thead className="bg-[#2B2B2B] text-white uppercase h-[44px]">
            <tr>
              {[
                '✓', 'Line', 'Part Number', 'Inq Qty', 'Qty - VC', 'Qty - AB', 'Qty - IC',
                'Qty - CH', 'Qty - TX', 'Qty - GA', 'Qty - PA', 'Description',
                'Dealer Cost', 'Sugg Retail', 'Remark', 'iAI Tips',
              ].map((heading, i) => (
                <th
                  key={i}
                  className="px-2 py-2 font-bold border border-[#E0E0E0] text-left whitespace-nowrap"
                >
                  {heading === 'Part Number' ? (
                    <span className="underline cursor-pointer">{heading}</span>
                  ) : (
                    heading
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#101010]">
            {rows.map((row, idx) => (
              <tr key={idx} className="h-[44px]">
                <td className="border border-[#E0E0E0] text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => handleChange(idx, 'selected', !row.selected)}
                    className="scale-90"
                  />
                </td>
                <td className="border border-[#E0E0E0] text-center">{idx + 1}</td>
                {[
                  'partNumber', 'inqQty', 'vcQty', 'abQty', 'icQty',
                  'chQty', 'txQty', 'gaQty', 'paQty',
                  'description', 'dealerCost', 'suggRetail', 'remark',
                ].map((field, i) => (
                  <td key={i} className="border border-[#E0E0E0] px-2">
                    <input
                      type={['inqQty', 'vcQty', 'abQty', 'icQty', 'chQty', 'txQty', 'gaQty', 'paQty', 'dealerCost', 'suggRetail'].includes(field) ? 'number' : 'text'}
                      className="w-full h-[30px] border px-1 text-[12px]"
                      value={row[field]}
                      onChange={(e) => handleChange(idx, field, e.target.value)}
                    />
                  </td>
                ))}
                <td className="border border-[#E0E0E0] text-center text-[16px]">✓</td>
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
        <button className="bg-black text-white px-5 py-1.5">INQUIRE</button>
        <button className="border border-black px-3 py-1.5">ESTIMATE</button>
        <button className="border border-black px-3 py-1.5">TRANSFER TO VOR</button>
        <button className="border border-black px-3 py-1.5">TRANSFER TO STOCK ORDER</button>
        <button className="border border-black px-3 py-1.5">RESET</button>
        <button className="border border-black px-3 py-1.5">PRINT</button>
        <button className="border border-black px-3 py-1.5">PRINT RETAIL</button>
      </div>
    </div>
  );
};

export default PartsInquiry;
