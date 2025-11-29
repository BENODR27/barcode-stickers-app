import React, { useState } from "react";
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

export default function App() {
  const [rows, setRows] = useState([]);
  const [colName, setColName] = useState("code");
  const [stickerWidthMm, setStickerWidthMm] = useState(45); // 9:16 approx
  const [stickerHeightMm, setStickerHeightMm] = useState(80);

  // XLSX file handler
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    setRows(json);

    // auto-detect column
    if (json.length > 0) {
      const keys = Object.keys(json[0]);
      if (keys.includes("code")) setColName("code");
      else setColName(keys[0]);
    }
  };

  // Generate barcode image (data URL)
  const generateBarcode = (value) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, String(value), {
      format: "CODE128",
      displayValue: false,
      height: 40,
    });
    return canvas.toDataURL("image/png");
  };

  const exportPdf = () => {
    if (!rows.length) return;

    const w = stickerWidthMm;
    const h = stickerHeightMm;

    // create doc with first page sized to sticker
    const pdf = new jsPDF({
      unit: "mm",
      format: [w, h],
    });

    rows.forEach((row, i) => {
      const val = row[colName] ?? Object.values(row)[0] ?? "";
      const img = generateBarcode(val);

      // draw border
      pdf.rect(2, 2, w - 4, h - 4);

      // barcode image
      pdf.addImage(img, "PNG", 5, 10, w - 10, 30);

      // text label
      pdf.setFontSize(10);
      pdf.text(val, w / 2, h - 10, { align: "center" });

      // add next page if not last
      if (i < rows.length - 1) {
        pdf.addPage([w, h], "portrait");
      }
    });

    pdf.save("stickers.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Sticker PDF Generator</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <label className="block mb-2 font-medium">Upload XLSX</label>
        <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="mb-3" />

        {rows.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm">Barcode Column</label>
            <input
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              className="border p-1 rounded"
            />
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm">Sticker Width (mm)</label>
            <input
              type="number"
              value={stickerWidthMm}
              onChange={(e) => setStickerWidthMm(Number(e.target.value))}
              className="border p-1 rounded w-24"
            />
          </div>
          <div>
            <label className="block text-sm">Sticker Height (mm)</label>
            <input
              type="number"
              value={stickerHeightMm}
              onChange={(e) => setStickerHeightMm(Number(e.target.value))}
              className="border p-1 rounded w-24"
            />
          </div>
        </div>

        <button
          onClick={exportPdf}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export Stickers PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium">Notes</h3>
        <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
          <li>Upload an Excel file (`.xlsx`) with a column of codes.</li>
          <li>Each row generates one sticker.</li>
          <li>Each PDF page is exactly the size of one sticker (default 45×80 mm).</li>
          <li>Adjust width/height to match your sticker dimensions.</li>
        </ul>
      </div>
    </div>
  );
}
