import { state } from './state.js';
import { BASE_URL } from './config.js';
import { formatCurrency } from './utils.js';

// --- COMPARE BOOKINGS LOGIC ---

/**
 * Renders the custom Date A vs Date B comparison view.
 * @param {string} shopPrefix 
 */
export async function renderShopCompareBookings(shopPrefix) {
    const container = document.getElementById('dataTypeContentContainer');

    // Default dates if not set yet
    if (typeof window.compareState === 'undefined') {
        const today = new Date();
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const firstDayLastYear = new Date(today.getFullYear() - 1, today.getMonth(), 1);
        const lastDayLastYear = new Date(today.getFullYear() - 1, today.getMonth() + 1, 0);

        window.compareState = {
            startA: firstDayThisMonth.toLocaleDateString('en-CA'),
            endA: lastDayThisMonth.toLocaleDateString('en-CA'),
            startB: firstDayLastYear.toLocaleDateString('en-CA'),
            endB: lastDayLastYear.toLocaleDateString('en-CA')
        };
    }

    const { startA, endA, startB, endB } = window.compareState;

    // --- HTML Skeleton ---
    container.innerHTML = `
        <div class="max-w-6xl mx-auto space-y-6">
            <!-- Controls -->
            <div class="bg-indigo-50 border border-indigo-100 p-6 rounded-xl shadow-sm">
                <div class="flex flex-col md:flex-row justify-between items-end gap-6">
                    
                    <div class="flex-1 space-y-2">
                        <label class="font-bold text-indigo-900 text-sm uppercase tracking-wider">Period A</label>
                        <div class="flex gap-2">
                            <input type="date" id="compStartA" value="${startA}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-white transition-colors">
                            <input type="date" id="compEndA" value="${endA}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-white transition-colors">
                        </div>
                    </div>

                    <div class="flex items-center justify-center text-slate-400 font-bold mb-2">VS</div>

                    <div class="flex-1 space-y-2">
                        <label class="font-bold text-slate-700 text-sm uppercase tracking-wider">Period B</label>
                        <div class="flex gap-2">
                            <input type="date" id="compStartB" value="${startB}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-white transition-colors">
                            <input type="date" id="compEndB" value="${endB}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-white transition-colors">
                        </div>
                    </div>

                    <button onclick="fetchCompareBookings('${shopPrefix}')" class="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 whitespace-nowrap">
                        Compare Now
                    </button>
                </div>
            </div>

            <!-- Results Data Area -->
            <div id="compareResultsArea" class="hidden space-y-6 animate-fade-in">
                <!-- Data will be injected here -->
            </div>
            
            <!-- Loading State -->
            <div id="compareLoading" class="hidden flex flex-col items-center justify-center p-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                <p class="text-slate-500 font-medium animate-pulse">Analyzing periods...</p>
            </div>
        </div>
    `;

    // Make fetch logic globally accessible for the button
    window.fetchCompareBookings = async (shop) => {
        const sA = document.getElementById('compStartA').value;
        const eA = document.getElementById('compEndA').value;
        const sB = document.getElementById('compStartB').value;
        const eB = document.getElementById('compEndB').value;

        if (!sA || !eA || !sB || !eB) {
            alert("Please select all four dates.");
            return;
        }

        window.compareState = { startA: sA, endA: eA, startB: sB, endB: eB };

        document.getElementById('compareResultsArea').classList.add('hidden');
        document.getElementById('compareLoading').classList.remove('hidden');

        try {
            const url = `${BASE_URL}/api/${shop}/compare_bookings?startA=${sA}&endA=${eA}&startB=${sB}&endB=${eB}`;
            const token = localStorage.getItem('authToken');
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            renderComparisonData(data, shop);

        } catch (err) {
            alert("Error fetching comparison: " + err.message);
        } finally {
            document.getElementById('compareLoading').classList.add('hidden');
        }
    };

    // Auto-fetch if first render
    if (!state.allResults[`${shopPrefix}| compare_last_fetch`]) {
        window.fetchCompareBookings(shopPrefix);
        state.allResults[`${shopPrefix}| compare_last_fetch`] = true;
    }
}

function renderComparisonData(data, shop) {
    const area = document.getElementById('compareResultsArea');
    const { periodA, periodB } = data;

    // Math Helpers
    const calcDiff = (a, b) => {
        if (b === 0) return a > 0 ? 100 : 0;
        return ((a - b) / b) * 100;
    };

    const diffNet = calcDiff(periodA.stats.net, periodB.stats.net);
    const diffGross = calcDiff(periodA.stats.gross, periodB.stats.gross);
    const diffCount = calcDiff(periodA.stats.count, periodB.stats.count);

    const getBadge = (val, isInverted = false) => {
        const isPositive = val > 0;
        let isGood = isPositive;
        if (isInverted) isGood = !isPositive; // For cancellations, negative diff is good

        let color = isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
        if (val === 0) color = 'bg-slate-100 text-slate-800';

        const sign = isPositive ? '+' : '';
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${color}">
            ${sign}${val.toFixed(1)}%
        </span>`;
    };

    area.innerHTML = `
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Net Booking -->
            <div class="bg-white p-6 rounded-xl shadow border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest">Net Booking</h3>
                    ${getBadge(diffNet)}
                </div>
                <div class="flex justify-between items-end border-b border-slate-100 pb-4 mb-4">
                    <div>
                        <p class="text-xs font-semibold text-indigo-600 mb-1">Period A</p>
                        <p class="text-2xl font-black text-indigo-900">${formatCurrency(periodA.stats.net)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-medium text-slate-400 mb-1">Period B</p>
                        <p class="text-lg font-bold text-slate-600">${formatCurrency(periodB.stats.net)}</p>
                    </div>
                </div>
            </div>

            <!-- Gross Booking -->
            <div class="bg-white p-6 rounded-xl shadow border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest">Gross Booking</h3>
                    ${getBadge(diffGross)}
                </div>
                <div class="flex justify-between items-end border-b border-slate-100 pb-4 mb-4">
                    <div>
                        <p class="text-xs font-semibold text-indigo-600 mb-1">Period A</p>
                        <p class="text-2xl font-black text-slate-800">${formatCurrency(periodA.stats.gross)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-medium text-slate-400 mb-1">Period B</p>
                        <p class="text-lg font-bold text-slate-600">${formatCurrency(periodB.stats.gross)}</p>
                    </div>
                </div>
            </div>

            <!-- Order Volume -->
            <div class="bg-white p-6 rounded-xl shadow border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest">Order Volume</h3>
                    ${getBadge(diffCount)}
                </div>
                <div class="flex justify-between items-end border-b border-slate-100 pb-4 mb-4">
                    <div>
                        <p class="text-xs font-semibold text-indigo-600 mb-1">Period A</p>
                        <p class="text-2xl font-black text-slate-800">${periodA.stats.count} <span class="text-sm font-normal text-slate-400">orders</span></p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-medium text-slate-400 mb-1">Period B</p>
                        <p class="text-lg font-bold text-slate-600">${periodB.stats.count}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Chart -->
        <div class="bg-white p-6 rounded-xl shadow border border-slate-200">
            <h4 class="font-bold text-slate-800 mb-6">Net Booking Comparison</h4>
            <div class="relative w-full h-80">
                <canvas id="compareBarChart"></canvas>
            </div>
        </div>

        <!-- Daily Comparison Table -->
        <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h4 class="font-bold text-slate-800">Daily Breakdown Comparison</h4>
                <span class="text-xs font-medium text-slate-400 italic">Comparing matching days in sequence</span>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-[13px] text-left block md:table">
                    <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 hidden md:table-header-group">
                        <tr>
                            <th class="px-6 py-4 font-bold">Timeline</th>
                            <th class="px-6 py-4 font-bold">${periodA.label} (Net)</th>
                            <th class="px-6 py-4 font-bold">${periodB.label} (Net)</th>
                            <th class="px-6 py-4 font-bold text-right">Variance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 block md:table-row-group">
                        ${(() => {
            const datesA = Object.keys(periodA.stats.dailyData).sort();
            const datesB = Object.keys(periodB.stats.dailyData).sort();
            const maxLen = Math.max(datesA.length, datesB.length);
            let html = '';

            for (let i = 0; i < maxLen; i++) {
                const valA = datesA[i] ? periodA.stats.dailyData[datesA[i]].net : 0;
                const valB = datesB[i] ? periodB.stats.dailyData[datesB[i]].net : 0;
                const diff = calcDiff(valA, valB);
                const isPos = diff >= 0;

                html += `
                                <tr class="hover:bg-slate-50 transition-colors block md:table-row border-b-4 border-slate-50 md:border-none mb-4 md:mb-0">
                                    <td class="px-6 py-2.5 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block font-bold text-slate-900 bg-slate-50/30 md:bg-transparent">
                                        <span class="md:hidden text-slate-400 font-bold uppercase text-[10px] tracking-tight">Timeline</span>
                                        <span>Day ${i + 1}</span>
                                    </td>
                                    <td class="px-6 py-2.5 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                        <span class="md:hidden text-slate-400 font-bold uppercase text-[10px] tracking-tight">Period A</span>
                                        <span class="font-semibold text-indigo-700">${formatCurrency(valA)}</span>
                                    </td>
                                    <td class="px-6 py-2.5 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                        <span class="md:hidden text-slate-400 font-bold uppercase text-[10px] tracking-tight">Period B</span>
                                        <span class="font-medium text-slate-600">${formatCurrency(valB)}</span>
                                    </td>
                                    <td class="px-6 py-2.5 text-right block md:table-cell md:border-none flex justify-between items-center md:block">
                                        <span class="md:hidden text-slate-400 font-bold uppercase text-[10px] tracking-tight">Variance</span>
                                        <span class="font-black ${isPos ? 'text-emerald-600' : 'text-rose-600'}">
                                            ${isPos ? '+' : ''}${diff.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            `;
            }
            return html || '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">No daily data available for comparison.</td></tr>';
        })()}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    area.classList.remove('hidden');

    // Render Chart
    if (window.chartInstances && window.chartInstances.compareNet) {
        window.chartInstances.compareNet.destroy();
    }

    const ctx = document.getElementById('compareBarChart').getContext('2d');

    window.chartInstances.compareNet = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Net Booking Value'],
            datasets: [
                {
                    label: `Period A (${periodA.label})`,
                    data: [periodA.stats.net],
                    backgroundColor: '#4f46e5', // indigo-600
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: `Period B (${periodB.label})`,
                    data: [periodB.stats.net],
                    backgroundColor: '#cbd5e1', // slate-300
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9', drawBorder: false },
                    ticks: {
                        callback: function (value) {
                            return (value / 1000) + 'k'; // simplify large numbers
                        }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });

}
