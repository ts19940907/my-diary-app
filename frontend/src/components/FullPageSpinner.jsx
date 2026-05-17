'use client';

export default function FullPageSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="animate-pulse font-medium text-slate-600">読み込み中...</p>
    </div>
  );
}
