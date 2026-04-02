import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { mockDiaries } from '../data/mockData';

const Calendar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  // ★重要：3つの項目を個別に管理するState
  const [formData, setFormData] = useState({ 
    work: '', 
    issue: '', 
    solution: '' 
  });

  // ★ツールチップ用のState
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: {} });

  // 日付クリック（またはイベントクリック）時の共通処理
  const handleOpenModal = (dateStr) => {
    // setSelectedDate(dateStr);
    
    // // mockDataから該当する日付のデータを探す
    // const existingEntry = mockDiaries.find(d => d.date === dateStr);

    // if (existingEntry) {
    //   // 既存データがあれば、3項目すべてにセット（これで再編集が可能になります）
    //   setFormData({
    //     work: existingEntry.work || '',
    //     issue: existingEntry.issue || '',
    //     solution: existingEntry.solution || ''
    //   });
    // } else {
    //   // 新規の場合はすべて空にする
    //   setFormData({ work: '', issue: '', solution: '' });
    // }
    // setIsModalOpen(true);
    // 1. まずツールチップを確実に閉じる（座標もリセット）
    setTooltip({ show: false, x: 0, y: 0, content: {} });

    // 2. 日付をセット
    setSelectedDate(dateStr);
  
    // 3. データの読み込み
    const existingEntry = mockDiaries.find(d => d.date === dateStr);
    if (existingEntry) {
        setFormData({
            work: existingEntry.work || '',
            issue: existingEntry.issue || '',
            solution: existingEntry.solution || ''
        });
    } else {
        setFormData({ work: '', issue: '', solution: '' });
    }

    // 4. モーダルを開く
    setIsModalOpen(true);
    };

  const handleMouseEnter = (info) => {
    const { work, issue } = info.event.extendedProps;
    setTooltip({
      show: true,
      x: info.jsEvent.pageX,
      y: info.jsEvent.pageY,
      content: { work, issue }
    });
  };
  

  return (
    <div className="relative">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={['ja']}
          locale="ja"
          events={mockDiaries.map(d => ({
            title: d.summary,
            start: d.date,
            extendedProps: { ...d }
          }))}
          dateClick={(arg) => {
            // handleMouseLeave(); 
            handleOpenModal(arg.dateStr);
          }}
          eventClick={(info) => handleOpenModal(info.event.startStr)}
          eventMouseEnter={handleMouseEnter}
          eventMouseLeave={() => setTooltip({ ...prev, show: false })}
          height="auto"
          eventClassNames="cursor-pointer bg-blue-600 border-none text-white p-1 rounded text-xs"
        />
      </div>

      {/* --- カスタムツールチップ --- */}
      {tooltip.show && (
        <div 
          className="fixed z-[100] pointer-events-none bg-slate-800 text-white p-3 rounded-lg shadow-xl text-sm max-w-xs"
          style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}
        >
          <div className="font-bold text-blue-400 mb-1">【業務】</div>
          <div className="mb-2">{tooltip.content.work}</div>
          <div className="font-bold text-orange-400 mb-1">【課題】</div>
          <div>{tooltip.content.issue}</div>
        </div>
      )}

      {/* --- 編集ダイアログ（モーダル） --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">{selectedDate} の業務記録</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-blue-200 text-xl">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 1. 実施した業務 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">実施した業務</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 h-20 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.work}
                  onChange={(e) => setFormData({...formData, work: e.target.value})}
                  placeholder="何を行いましたか？"
                />
              </div>

              {/* 2. 課題点 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">課題点</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 h-20 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.issue}
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                  placeholder="直面した課題は？"
                />
              </div>

              {/* 3. 解決した方法 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">課題を解決した方法</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 h-20 focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.solution}
                  onChange={(e) => setFormData({...formData, solution: e.target.value})}
                  placeholder="どうやって解決しましたか？"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end space-x-3 border-t">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
              >
                キャンセル
              </button>
              <button 
                onClick={() => {
                  console.log("保存データ:", formData);
                  alert("保存しました（モックのためログ出力のみ）");
                  setIsModalOpen(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;