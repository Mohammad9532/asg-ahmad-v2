import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Settings, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { LedgerEntryModal } from '../components/LedgerEntryModal';
import { AdjustCashModal } from '../components/AdjustCashModal';
import { Button } from '@/components/ui/Button';
import api from '@/config/api';

export default function LedgerReport() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpeningBalanceOpen, setIsOpeningBalanceOpen] = useState(false);
  const [isAdjustCashOpen, setIsAdjustCashOpen] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const displayDate = format(selectedDate, 'dd-MMM-yyyy');
  const reviewingDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  // Fetch Cash Book for the selected day
  const { data: cashBookData, isLoading: isCashBookLoading } = useQuery({
    queryKey: ['reports', 'cash-book', dateStr],
    queryFn: async () => {
      const res = await api.get('/reports/cash-book', { 
        params: { 
          start_date: dateStr, 
          end_date: dateStr, 
          per_page: 1000,
          payment_method: 1 // Strictly CASH only
        } 
      });
      return res.data;
    },
  });

  // Fetch Bookings for the selected day
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['reports', 'bookings', dateStr],
    queryFn: async () => {
      const res = await api.get('/reports/bookings', { 
        params: { start_date: dateStr, end_date: dateStr, export: true }
      });
      return res.data;
    },
  });

  const rawData = cashBookData?.data?.data || cashBookData?.data || [];
  const openingBalance = Number(cashBookData?.opening_balance || 0);

  const totalReceived = rawData.reduce((sum: number, row: any) => sum + Number(row.credit || 0), 0);
  const totalPaid = rawData.reduce((sum: number, row: any) => sum + Number(row.debit || 0), 0);
  const cashInHand = openingBalance + totalReceived - totalPaid;

  const totalBookingsAmount = Array.isArray(bookingsData) 
    ? bookingsData.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0)
    : 0;

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const getCategoryBadgeColor = (source: string, type: string) => {
    const s = source.toLowerCase();
    if (s.includes('opening balance')) return 'bg-indigo-100 text-indigo-700';
    if (s.includes('adjustment')) return 'bg-orange-100 text-orange-700';
    if (s.includes('payment') || type === 'CREDIT') return 'bg-green-100 text-green-700';
    if (s.includes('expense')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getCategoryName = (row: any) => {
    if (row.source === 'Opening Balance') return 'START';
    if (row.source === 'Adjustment') return 'ADJUSTMENT';
    if (row.source === 'Payment') return 'CASH';
    if (row.source === 'Expense') return 'EXPENSE';
    return row.source.toUpperCase();
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6 bg-slate-50 min-h-full font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-10 w-10 text-slate-400 hover:text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {/* @ts-ignore - shop might exist dynamically or we fallback */}
              {user?.shop?.name || 'Naseem'} Daily Ledger
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-0.5 cursor-pointer hover:text-primary" onClick={handleToday}>
              {displayDate} <span className="text-xs">📅</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-10 w-10 text-slate-400 hover:text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setIsOpeningBalanceOpen(true)} className="h-10 w-10 border-slate-200" title="Set Opening Balance">
            <Settings className="w-4 h-4 text-slate-500" />
          </Button>
          <Button onClick={() => setIsAdjustCashOpen(true)} className="h-10 gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border-none shadow-none font-semibold">
            <Plus className="w-4 h-4" /> Adjust Cash
          </Button>
          <div className="hidden sm:block border-l border-slate-200 h-8 mx-1"></div>
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviewing</div>
            <div className="text-sm font-semibold text-slate-700">{reviewingDate}</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Opening Balance</span>
          <span className="text-3xl font-black text-slate-800 tracking-tight">
            AED {openingBalance.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-md flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
          <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mb-2 z-10">Net Cash in Box</span>
          <span className="text-3xl font-black text-white tracking-tight z-10">
            AED {cashInHand.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bookings Bar */}
      <div>
        <div className="bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-xl flex justify-between items-center shadow-sm">
          <span className="font-bold text-indigo-900 tracking-tight">Total Bookings (Orders) Today:</span>
          <span className="font-bold text-indigo-700 tracking-tight">
            AED {totalBookingsAmount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 ml-2 font-medium">
          * Bookings are promised revenue and do not affect the physical cash box balance below.
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Debit (Out)</th>
                <th className="px-6 py-4 text-right">Credit (In)</th>
                <th className="px-6 py-4 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              
              {/* Opening Balance Row inside table (optional, but requested implicitly by screenshot) */}
              <tr className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">
                    START
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-700">Opening Balance</td>
                <td className="px-6 py-4 text-right text-slate-300 font-mono">-</td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-indigo-600 font-mono">
                    AED {openingBalance.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-6 py-4 text-center"></td>
              </tr>

              {isCashBookLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading entries...</td>
                </tr>
              )}
              
              {!isCashBookLoading && rawData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No physical cash movements recorded for this day.
                  </td>
                </tr>
              )}

              {rawData.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeColor(row.source, row.transaction_type)}`}>
                      {getCategoryName(row)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {row.description || row.remarks || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {Number(row.debit) > 0 ? (
                      <span className="font-bold text-red-500 font-mono">
                        AED {Number(row.debit).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {Number(row.credit) > 0 ? (
                      <span className="font-bold text-emerald-500 font-mono">
                        AED {Number(row.credit).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.source === 'Adjustment' || row.source === 'Opening Balance' ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs px-3 text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                        Edit
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-300 cursor-not-allowed" title="Auto-generated entry">System</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-800 tracking-wider text-xs">
                  DAILY TOTALS
                </td>
                <td className="px-6 py-4 text-right font-black text-red-600 font-mono text-base">
                  AED {totalPaid.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right font-black text-emerald-600 font-mono text-base">
                  AED {totalReceived.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <LedgerEntryModal 
        isOpen={isOpeningBalanceOpen} 
        onClose={() => setIsOpeningBalanceOpen(false)} 
      />

      <AdjustCashModal
        isOpen={isAdjustCashOpen}
        onClose={() => setIsAdjustCashOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}
