'use client';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'キャンセル',
  showCancel = true,
  type = 'info',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6 text-center">
          <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{message}</p>
        </div>

        <div className="flex justify-center space-x-3 border-t border-slate-100 bg-slate-50 p-4">
          {showCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg px-6 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`rounded-lg px-8 py-2 text-sm font-bold text-white transition-all active:scale-95 ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
