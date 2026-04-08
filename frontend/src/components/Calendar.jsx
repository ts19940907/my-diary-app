import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import FullPageSpinner from './FullPageSpinner';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'react-hot-toast';
import * as JapaneseHolidays from 'japanese-holidays';

const Calendar = ({ getAccessToken }) => {
  const [diaries, setDiaries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({ work: '', issue: '', solution: '' });
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: {} });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isAllEmpty = !formData.work.trim() && !formData.issue.trim() && !formData.solution.trim();
  const isWorkMissing = !formData.work.trim() && (formData.issue.trim() || formData.solution.trim());
  const isExistingData = diaries?.some(d => d.date === selectedDate);
  const getHolidayName = (date) => {
    return JapaneseHolidays.isHoliday(date);
  };

  const diariesRef = useRef([]);
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => { }, showCancel: true, type: 'info'
  });

  const closeDialog = () => setDialogConfig({ ...dialogConfig, isOpen: false });

  // --- 削除時の呼び出し ---
  const handleDeleteClick = () => {
    setDialogConfig({
      isOpen: true,
      title: "削除の確認",
      message: `${selectedDate} の記録を削除しますか？この操作は取り消せません。`,
      showCancel: true,
      type: 'danger',
      confirmText: "削除する",
      onConfirm: async () => {
        closeDialog();
        await handleDelete(); // 実際の削除処理
      },
      onCancel: closeDialog
    });
  };

  // --- エラー時の呼び出し ---
  const handleError = (error, msg) => {
    setDialogConfig({
      isOpen: true,
      title: "エラーが発生しました",
      message: msg,
      showCancel: false, // キャンセルボタンを隠し、OKボタンのみにする
      confirmText: "OK",
      onConfirm: closeDialog,
      type: 'info'
    });
  };
  useEffect(() => { diariesRef.current = diaries; }, [diaries]);

  const fetchDiaries = async () => {
    // try-catch を外すか、エラーを throw するようにします
    const token = await getAccessToken();
    const response = await axios.get(`${API_URL}/diaries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDiaries(response.data);
  };

  // useEffect(() => { fetchDiaries(); }, []);
  useEffect(() => {
    const loadData = async () => {
      // 念のため開始時に true に（初期値が true なら省略可）
      setIsInitialLoading(true);
      try {
        // 既存の取得処理を呼び出す
        await fetchDiaries();
      } catch (error) {
        handleError(error, "初期データの取得に失敗しました");
      } finally {
        // 成功しても失敗しても、最後にローディングを解除
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOpenModal = (dateStr) => {
    setTooltip({ show: false, x: 0, y: 0, content: {} }); // モーダルを開く時にツールチップを消去
    setSelectedDate(dateStr);
    const existing = diariesRef.current.find(d => d.date === dateStr);
    setFormData(existing ? { ...existing } : { work: '', issue: '', solution: '' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // もし業務内容が空っぽなら、削除処理として扱う
    if (!formData.work.trim()) {
      handleDelete();
      return;
    }

    setIsActionLoading(true); // 💡 ローディング開始
    try {
      const token = await getAccessToken();
      const payload = {
        ...formData,
        date: selectedDate,
        summary: formData.work.substring(0, 10) + "..."
      };
      await axios.post(`${API_URL}/diaries`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('保存しました！', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      await fetchDiaries();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, "保存に失敗しました");
    } finally {
      setIsActionLoading(false); // 💡 成功・失敗に関わらず終了
    }
  };

  const handleDelete = async () => {
    // if (!window.confirm(`${selectedDate} の記録を削除しますか？`)) return;

    setIsActionLoading(true); // 💡 ローディング開始
    try {
      const token = await getAccessToken();
      await axios.delete(`${API_URL}/diaries/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('削除しました');
      await fetchDiaries();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, "削除に失敗しました");
    } finally {
      setIsActionLoading(false); // 💡 終了
    }
  };

  return (
    <div className="relative">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <style>{`
          /* 1. マス全体のホバー（データがない日も反応させる） */
          .fc-daygrid-day:hover {
            background-color: rgba(241, 245, 249, 0.6) !important;
            cursor: pointer;
          }

          /* 2. 青い帯（イベント）を最前面に。z-indexを極端に上げます */
          .fc-event {
            z-index: 100 !important;
            cursor: pointer !important;
            pointer-events: auto !important; /* 確実にクリックを通す */
          }
          
          .fc-event-main {
            pointer-events: auto !important;
          }

          /* 4. カレンダー内部の他のレイヤーがクリックを吸い取らないように設定 */
          .fc-daygrid-day-frame, .fc-daygrid-day-events {
            pointer-events: auto !important;
          }
          
          .fc-day-sat { 
            background-color: #eff6ff !important; 
          }
          .fc-day-sat .fc-col-header-cell-cushion,
          .fc-day-sat .fc-daygrid-day-number {
            color: #2563eb !important; 
          }

          .fc-day-sun { 
            background-color: #fef2f2 !important; 
          }
          .fc-day-sun .fc-col-header-cell-cushion,
          .fc-day-sun .fc-daygrid-day-number {
            color: #dc2626 !important; 
          }

          .fc-daygrid-day-number {
            position: relative;
            z-index: 1; /* 数字を低く */
            pointer-events: none; /* 数字自体はクリック不可にして、下のマスを叩かせる */
          }
        `}</style>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={['ja']}
          locale="ja"
          height="auto"
          // 日付の数字部分のリンクを無効化（クリック判定を安定させるため）
          navLinks={false}

          dayCellClassNames={(arg) => {
            const holidayName = getHolidayName(arg.date);
            if (holidayName) {
              // ここで返したクラス名は、再描画されても維持されます
              return ['fc-day-sun'];
            }
            return [];
          }}

          events={diaries?.map(d => ({
            title: d.summary,
            start: d.date,
            extendedProps: { ...d },
            className: "bg-blue-600 border-none text-white p-1 rounded text-xs shadow-sm"
          }))}

          // データがない場所をクリック
          dateClick={(arg) => {
            handleOpenModal(arg.dateStr);
          }}

          // ★データがある場所（青い帯）をクリック
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            info.jsEvent.stopPropagation(); // 重なりによる二重発火を防止
            handleOpenModal(info.event.startStr);
          }}

          // ホバー（表示）
          eventMouseEnter={(info) => {
            const { work, issue } = info.event.extendedProps;
            setTooltip({
              show: true,
              x: info.jsEvent.clientX,
              y: info.jsEvent.clientY,
              content: { work, issue }
            });
          }}
        />
      </div>

      {/* ツールチップ表示 */}
      {tooltip.show && !isModalOpen && createPortal(
        <div
          className="fixed pointer-events-none bg-slate-800 text-white p-4 rounded-xl shadow-2xl text-sm max-w-xs border border-slate-600"
          style={{
            top: tooltip.y + 25, // マウスから少し離す（重要！）
            left: tooltip.x + 25,
            userSelect: 'none',    // テキスト選択も無効化
            zIndex: 999999 // 圧倒的な最前面
          }}
        >
          <div className="font-bold text-blue-400 mb-1 border-b border-slate-600 pb-1 text-[10px] uppercase tracking-wider">Work</div>
          <div className="mb-2 leading-relaxed">{tooltip.content.work}</div>
          <div className="font-bold text-orange-400 mb-1 border-b border-slate-600 pb-1 text-[10px] uppercase tracking-wider">Issue</div>
          <div className="leading-relaxed">{tooltip.content.issue}</div>
        </div>,
        document.body // bodyの直下にレンダリングする
      )}

      {/* --- 修正ポイント：ラベル付きモーダル --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

          {/* モーダル本体: flex-col を明示し、高さを 90vh に制限 */}
          <div className="bg-white w-[90%] h-[90%] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col">

            {/* ヘッダー: flex-shrink-0 で固定 */}
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Report</span>
                <h2 className="font-bold text-lg leading-tight">{selectedDate}</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >✕</button>
            </div>

            {/* フォーム内容: ここに flex-1 と overflow-y-auto を必ず入れる */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              {/* 業務内容 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  業務内容
                </label>
                <textarea
                  className={`w-full border p-3 rounded-xl h-30 outline-none transition-all text-sm leading-relaxed ${isWorkMissing ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                    }`}
                  value={formData.work}
                  onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                />
                {/* 💡 警告メッセージの表示 */}
                {isWorkMissing && (
                  <p className="text-red-500 text-xs mt-1 font-bold">※ 実施した業務の入力は必須です</p>
                )}
              </div>

              {/* 課題点 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  課題点
                </label>
                <textarea
                  className="w-full border border-slate-200 p-3 rounded-xl h-40 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm leading-relaxed"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                />
              </div>

              {/* 解決策 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.674a1 1 0 00.922-.617l2.108-4.742A4 4 0 105.196 9.5l2.359 5.285a1 1 0 00.922.617z" /></svg>
                  解決策
                </label>
                <textarea
                  className="w-full border border-slate-200 p-3 rounded-xl h-40 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm leading-relaxed"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                />
              </div>
            </div>

            {/* フッター: 下部に固定 */}
            <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100 flex-shrink-0">
              <div>
                {isExistingData && (
                  <button
                    onClick={handleDeleteClick}
                    disabled={isActionLoading || !isExistingData} // 念のため条件追加
                    className={`px-4 py-2 text-sm font-bold text-red-600 rounded-lg transition-colors ${isActionLoading ? 'opacity-50' : 'hover:bg-red-50'
                      }`}
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isActionLoading || isAllEmpty || isWorkMissing}
                  className={`px-8 py-2 text-white text-sm rounded-lg font-bold shadow-lg transition-all ${(isActionLoading || isAllEmpty || isWorkMissing)
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 active:scale-95'
                    }`}
                >
                  {isActionLoading ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(isInitialLoading || isActionLoading) && <FullPageSpinner />}
      <ConfirmDialog {...dialogConfig} />
    </div>
  );
};

export default Calendar;