import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const Calendar = ({ getAccessToken }) => {
  const [diaries, setDiaries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({ work: '', issue: '', solution: '' });
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: {} });

  const diariesRef = useRef([]);
  const API_URL = import.meta.env.VITE_APP_API_URL;
  useEffect(() => { diariesRef.current = diaries; }, [diaries]);

  const fetchDiaries = async () => {
    try {
      const token = await getAccessToken();
      const response = await axios.get(`${API_URL}/diaries`, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      setDiaries(response.data);
    } catch (error) { console.error("取得失敗", error); }
  };

  useEffect(() => { fetchDiaries(); }, []);

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

    const token = await getAccessToken();

    try {
      const payload = {
        ...formData,
        date: selectedDate,
        summary: formData.work.substring(0, 10) + "..."
      };
      await axios.post(`${API_URL}/diaries`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDiaries();
      setIsModalOpen(false);
    } catch (error) {
      console.log(error)
      alert("保存に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${selectedDate} の記録を削除しますか？`)) return;

    try {
      const token = await getAccessToken();
      await axios.delete(`${API_URL}/diaries/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` } // ★追加
      });
      // await axios.delete(`https://4pvpjdgdrd.ap-northeast-1.awsapprunner.com/diaries/${selectedDate}`, {
      //   headers: { Authorization: `Bearer ${token}` } // ★追加
      // });
      await fetchDiaries(); // カレンダーを更新
      setIsModalOpen(false); // モーダルを閉じる
    } catch (error) {
      console.error("削除に失敗しました", error);
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

          /* 3. 重要：帯の中の「文字」がクリックを邪魔しないように「透過」させる */
          /* これにより、クリック判定は必ず「帯の枠自体」に届きます */
          .fc-event-main, .fc-event-title, .fc-event-time {
            pointer-events: none !important;
          }

          /* 4. カレンダー内部の他のレイヤーがクリックを吸い取らないように設定 */
          .fc-daygrid-day-frame, .fc-daygrid-day-events {
            pointer-events: auto !important;
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

          events={diaries.map(d => ({
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

          // ホバー（非表示）
          eventMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, content: {} })}
          dayMouseEnter={() => setTooltip({ show: false, x: 0, y: 0, content: {} })}
        />
      </div>

      {/* ツールチップ表示 */}
      {tooltip.show && createPortal(
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* ヘッダー */}
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Report</span>
                <h2 className="font-bold text-lg leading-tight">{selectedDate}</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >✕</button>
            </div>

            {/* フォーム内容 */}
            <div className="p-6 space-y-5">
              {/* 業務内容 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  業務内容
                </label>
                <textarea
                  className="w-full border border-slate-200 p-3 rounded-xl h-24 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm leading-relaxed"
                  value={formData.work}
                  onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                />
              </div>

              {/* 課題点 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>
                  課題点
                </label>
                <textarea
                  className="w-full border border-slate-200 p-3 rounded-xl h-20 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm leading-relaxed"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                />
              </div>

              {/* 解決策 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  解決策
                </label>
                <textarea
                  className="w-full border border-slate-200 p-3 rounded-xl h-20 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm leading-relaxed"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                />
              </div>
            </div>

            {/* フッターボタン */}
            {/* 左側に削除ボタン（既存データがある場合のみ表示） */}
            <div>
              {diaries.some(d => d.date === selectedDate) && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  削除する
                </button>
              )}
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2 bg-blue-600 text-white text-sm rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;