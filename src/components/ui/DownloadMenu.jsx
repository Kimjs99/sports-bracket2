import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, ChevronDown, Loader2 } from 'lucide-react';

function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }, 200);
}

async function captureBlob(element, type, quality) {
  const { default: domtoimage } = await import('dom-to-image-more');
  const target = element.querySelector('.bracket-container') ?? element;
  const isDark = document.documentElement.classList.contains('dark');
  const bgcolor = isDark ? '#1e293b' : '#ffffff';
  const scale = 2;

  // Wait for all fonts (including Noto Sans KR) to be fully loaded
  await document.fonts.ready;

  const opts = type === 'image/jpeg'
    ? { scale, bgcolor, type: 'image/jpeg', quality: quality ?? 0.92 }
    : { scale, bgcolor };

  // First call warms up dom-to-image's internal CSS/font cache
  try { await domtoimage.toBlob(target, opts); } catch { /* ignore warmup errors */ }
  // Second call renders with the now-cached resources
  return domtoimage.toBlob(target, opts);
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
      const blob = await captureBlob(targetRef.current, 'image/png');
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
      const blob = await captureBlob(targetRef.current, 'image/jpeg', 0.92);
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
      const blob = await captureBlob(targetRef.current, 'image/png');
      const imgUrl = URL.createObjectURL(blob);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      URL.revokeObjectURL(imgUrl);

      const { jsPDF } = await import('jspdf');
      const isLandscape = imgWidth > imgHeight;
      const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const w = imgWidth * ratio;
      const h = imgHeight * ratio;

      const reader = new FileReader();
      const imgDataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

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
