'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import FullPageSpinner from './FullPageSpinner';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'react-hot-toast';
import * as JapaneseHolidays from 'japanese-holidays';

const calendarStyles = `
  .fc-daygrid-day:hover {
    background-color: rgba(241, 245, 249, 0.6) !important;
    cursor: pointer;
  }
  .fc-event {
    z-index: 100 !important;
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  .fc-event-main {
    pointer-events: auto !important;
  }
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
    z-index: 1;
    pointer-events: none;
  }
`;

export default function Calendar() {
  const [diaries, setDiaries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({ work: '', issue: '', solution: '' });
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: {} });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isAllEmpty =
    !formData.work.trim() && !formData.issue.trim() && !formData.solution.trim();
  const isWorkMissing =
    !formData.work.trim() && (formData.issue.trim() || formData.solution.trim());
  const isExistingData = diaries?.some((d) => d.date === selectedDate);

  const getHolidayName = (date) => JapaneseHolidays.isHoliday(date);

  const diariesRef = useRef([]);
  const API_URL = '/api';
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: true,
    type: 'info',
  });

  const closeDialog = () => setDialogConfig({ ...dialogConfig, isOpen: false });

  const handleDeleteClick = () => {
    setDialogConfig({
      isOpen: true,
      title: '削除の確認',
      message: `${selectedDate} の記録を削除しますか？この操作は取り消せません。`,
      showCancel: true,
      type: 'danger',
      confirmText: '削除する',
      onConfirm: async () => {
        closeDialog();
        await handleDelete();
      },
      onCancel: closeDialog,
    });
  };

  const handleError = (error, msg) => {
    console.error(error);
    setDialogConfig({
      isOpen: true,
      title: 'エラーが発生しました',
      message: msg,
      showCancel: false,
      confirmText: 'OK',
      onConfirm: closeDialog,
      type: 'info',
    });
  };

  useEffect(() => {
    diariesRef.current = diaries;
  }, [diaries]);

  const fetchDiaries = async () => {
    const response = await axios.get(`${API_URL}/diaries`);
    setDiaries(response.data);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      try {
        await fetchDiaries();
      } catch (error) {
        handleError(error, '初期データの取得に失敗しました');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, []);

  const handleOpenModal = (dateStr) => {
    setTooltip({ show: false, x: 0, y: 0, content: {} });
    setSelectedDate(dateStr);
    const existing = diariesRef.current.find((d) => d.date === dateStr);
    setFormData(existing ? { ...existing } : { work: '', issue: '', solution: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    setIsActionLoading(true);
    try {
      await axios.delete(`${API_URL}/diaries/${selectedDate}`);
      toast.success('削除しました');
      await fetchDiaries();
      setIsModalOpen(false);
    } catch (error) {
      handleError(error, '削除に失敗しました');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.work.trim()) {
      handleDelete();
      return;
    }

    setIsActionLoading(true);
    try {
      const payload = {
        ...formData,
        date: selectedDate,
        summary: formData.work.substring(0, 10) + '...',
      };
      await axios.post(`${API_URL}/diaries`, payload);
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
      handleError(error, '保存に失敗しました');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <style>{calendarStyles}</style>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locales={['ja']}
          locale="ja"
          height="auto"
          navLinks={false}
          dayCellClassNames={(arg) => {
            const holidayName = getHolidayName(arg.date);
            if (holidayName) {
              return ['fc-day-sun'];
            }
            return [];
          }}
          events={diaries?.map((d) => ({
            title: d.summary,
            start: d.date,
            extendedProps: { ...d },
            className:
              'bg-blue-600 border-none text-white p-1 rounded text-xs shadow-sm',
          }))}
          dateClick={(arg) => {
            handleOpenModal(arg.dateStr);
          }}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            info.jsEvent.stopPropagation();
            handleOpenModal(info.event.startStr);
          }}
          eventMouseEnter={(info) => {
            const { work, issue } = info.event.extendedProps;
            setTooltip({
              show: true,
              x: info.jsEvent.clientX,
              y: info.jsEvent.clientY,
              content: { work, issue },
            });
          }}
          eventMouseLeave={() => {
            setTooltip({ show: false, x: 0, y: 0, content: {} });
          }}
        />
      </div>

      {tooltip.show &&
        !isModalOpen &&
        createPortal(
          <div
            className="pointer-events-none fixed max-w-xs rounded-xl border border-slate-600 bg-slate-800 p-4 text-sm text-white shadow-2xl"
            style={{
              top: tooltip.y + 25,
              left: tooltip.x + 25,
              userSelect: 'none',
              zIndex: 999999,
            }}
          >
            <div className="mb-1 border-b border-slate-600 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Work
            </div>
            <div className="mb-2 leading-relaxed">{tooltip.content.work}</div>
            <div className="mb-1 border-b border-slate-600 pb-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              Issue
            </div>
            <div className="leading-relaxed">{tooltip.content.issue}</div>
          </div>,
          document.body,
        )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[90%] w-[90%] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between bg-slate-900 p-4 text-white">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Daily Report
                </span>
                <h2 className="text-lg font-bold leading-tight">{selectedDate}</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <svg
                    className="mr-2 h-4 w-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  業務内容
                </label>
                <textarea
                  className={`h-30 w-full rounded-xl border p-3 text-sm leading-relaxed outline-none transition-all ${
                    isWorkMissing
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:ring-blue-500/20'
                  }`}
                  value={formData.work}
                  onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                />
                {isWorkMissing && (
                  <p className="mt-1 text-xs font-bold text-red-500">
                    ※ 実施した業務の入力は必須です
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <svg
                    className="mr-2 h-4 w-4 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  課題点
                </label>
                <textarea
                  className="h-40 w-full rounded-xl border border-slate-200 p-3 text-sm leading-relaxed outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <svg
                    className="mr-2 h-4 w-4 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.674a1 1 0 00.922-.617l2.108-4.742A4 4 0 105.196 9.5l2.359 5.285a1 1 0 00.922.617z"
                    />
                  </svg>
                  解決策
                </label>
                <textarea
                  className="h-40 w-full rounded-xl border border-slate-200 p-3 text-sm leading-relaxed outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.solution}
                  onChange={(e) =>
                    setFormData({ ...formData, solution: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 p-4">
              <div>
                {isExistingData && (
                  <button
                    onClick={handleDeleteClick}
                    disabled={isActionLoading || !isExistingData}
                    className={`rounded-lg px-4 py-2 text-sm font-bold text-red-600 transition-colors ${
                      isActionLoading ? 'opacity-50' : 'hover:bg-red-50'
                    }`}
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isActionLoading || isAllEmpty || isWorkMissing}
                  className={`rounded-lg px-8 py-2 text-sm font-bold text-white shadow-lg transition-all ${
                    isActionLoading || isAllEmpty || isWorkMissing
                      ? 'cursor-not-allowed bg-slate-300 shadow-none'
                      : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {isActionLoading ? '保存中...' : '保存する'}
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
}
