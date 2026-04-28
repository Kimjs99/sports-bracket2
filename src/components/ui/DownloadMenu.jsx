import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, ChevronDown, Loader2 } from 'lucide-react';

async function captureElement(element) {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
    logging: false,
  });
}

function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Small delay before cleanup to ensure the click registers
  setTimeout(() => {
    document.body.removeChild(link);
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }, 200);
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

export default function DownloadMenu({ targetRef, filename = 'bracket' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function downloadPng() {
    if (!targetRef.current) return;
    setLoading('png'); setOpen(false);
    try {
      const canvas = await captureElement(targetRef.current);
      const blob = await canvasToBlob(canvas, 'image/png');
      triggerDownload(URL.createObjectURL(blob), `${filename}.png`);
    } catch (e) {
      console.error('PNG 다운로드 실패:', e);
      alert('다운로드에 실패했습니다. 다시 시도해 주세요.');
    } finally { setLoading(null); }
  }

  async function downloadJpg() {
    if (!targetRef.current) return;
    setLoading('jpg'); setOpen(false);
    try {
      const canvas = await captureElement(targetRef.current);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      triggerDownload(URL.createObjectURL(blob), `${filename}.jpg`);
    } catch (e) {
      console.error('JPG 다운로드 실패:', e);
      alert('다운로드에 실패했습니다. 다시 시도해 주세요.');
    } finally { setLoading(null); }
  }

  async function downloadPdf() {
    if (!targetRef.current) return;
    setLoading('pdf'); setOpen(false);
    try {
      const canvas = await captureElement(targetRef.current);
      const { jsPDF } = await import('jspdf');
      const blob = await canvasToBlob(canvas, 'image/png');
      const imgDataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const isLandscape = imgWidth > imgHeight;
      const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const w = imgWidth * ratio;
      const h = imgHeight * ratio;
      pdf.addImage(imgDataUrl, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);

      const pdfBlob = pdf.output('blob');
      triggerDownload(URL.createObjectURL(pdfBlob), `${filename}.pdf`);
    } catch (e) {
      console.error('PDF 다운로드 실패:', e);
      alert('다운로드에 실패했습니다. 다시 시도해 주세요.');
    } finally { setLoading(null); }
  }

  const isLoading = loading !== null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => !isLoading && setOpen(v => !v)}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isLoading
          ? <><Loader2 size={13} className="animate-spin" /> {loading?.toUpperCase()} 변환 중…</>
          : <><Download size={13} /> 내려받기 <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></>
        }
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]">
          <button
            onClick={downloadPng}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileImage size={14} className="text-blue-500" /> PNG 이미지
          </button>
          <button
            onClick={downloadJpg}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-50 dark:border-gray-700"
          >
            <FileImage size={14} className="text-green-500" /> JPG 이미지
          </button>
          <button
            onClick={downloadPdf}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-50 dark:border-gray-700"
          >
            <FileText size={14} className="text-red-500" /> PDF 문서
          </button>
        </div>
      )}
    </div>
  );
}
