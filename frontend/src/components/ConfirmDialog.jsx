import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "OK", 
  cancelText = "キャンセル",
  showCancel = true, // キャンセルボタンを表示するかどうか
  type = "info" // 'info' or 'danger' (削除時などは赤くするため)
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        <div className="p-4 bg-slate-50 flex justify-center space-x-3 border-t border-slate-100">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-8 py-2 text-white text-sm rounded-lg font-bold transition-all active:scale-95 ${
              type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;