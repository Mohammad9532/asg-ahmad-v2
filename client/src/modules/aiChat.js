
import { state } from './state.js';
import { BASE_URL } from './config.js';
import { SHOP_PREFIXES } from './config.js';

// --- AI CHAT LOGIC ---

export function toggleAIChat() {
    const modal = document.getElementById('aiChatModal');
    const isHidden = modal.classList.contains('hidden');

    if (isHidden) {
        modal.classList.remove('hidden');
        // Small timeout to allow removing hidden before animating opacity
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
            document.getElementById('chatInput').focus();
        }, 10);
    } else {
        modal.classList.remove('scale-100', 'opacity-100');
        modal.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // Match transition duration
    }
}

export async function handleChatSubmit(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    await sendAIMessage(message);
}

async function sendAIMessage(message, hiddenSystemPrompt = null) {
    // Add User Message (if not a system trigger)
    if (!hiddenSystemPrompt) {
        appendMessage('user', message);
    } else {
        // For system triggers, maybe show a different kind of message or just the user equivalent
        appendMessage('user', message);
    }

    // Show Loading State
    const loadingId = appendMessage('ai', 'Analyzing data...', true);

    try {
        // Gather Context
        const context = getChatContext();

        // Final Prompt: Use hidden prompt if provided (for specialized tasks), else user message
        const finalPrompt = hiddenSystemPrompt || message;

        // Send to API
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: finalPrompt, context })
        });

        const data = await response.json();

        // Remove Loading Logic
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();

        if (data.error) {
            appendMessage('ai', `**Error:** ${data.error}`);
        } else {
            appendMessage('ai', data.response);
        }

    } catch (error) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        appendMessage('ai', `**System Error:** ${error.message}`);
    }
}

export function triggerHealthAnalysis() {
    // 1. Open Chat
    const modal = document.getElementById('aiChatModal');
    if (modal.classList.contains('hidden')) {
        toggleAIChat();
    }

    // 2. Send Analysis Request
    // We display "Analyze Shop Health" to the user, but enforce a structured prompt to the AI
    const displayMsg = "Analyze Shop Health 🏥";
    const systemPrompt = `
        Please perform a comprehensive health check on this shop based on the provided data context.
        1. Analyze the Profitability (Net Booking vs Expenses).
        2. Evaluate Operational Efficiency (Cancellation Rates).
        3. Check Stock Health (Uncollected booking balance).
        
        Output format:
        **🏥 Shop Health Report**
        - **Status**: [Healthy / Caution / Critical]
        - **Key Metrics**: [Bullet points]
        - **Recommendations**: [Actionable tips]
        
        Keep it concise and professional.
    `;

    sendAIMessage(displayMsg, systemPrompt);
}

function appendMessage(sender, text, isLoading = false) {
    const history = document.getElementById('chatHistory');
    const id = 'msg-' + Date.now();

    let contentHtml = '';
    if (isLoading) {
        contentHtml = `<div class="animate-pulse flex space-x-2"><div class="h-2 w-2 bg-slate-400 rounded-full"></div><div class="h-2 w-2 bg-slate-400 rounded-full"></div><div class="h-2 w-2 bg-slate-400 rounded-full"></div></div>`;
    } else {
        // Use marked.js if available, otherwise raw text
        contentHtml = typeof marked !== 'undefined' ? marked.parse(text) : text;
    }

    const isUser = sender === 'user';

    const html = `
    <div class="flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}" id="${id}">
        <div class="w-8 h-8 rounded-full ${isUser ? 'bg-indigo-600' : 'bg-indigo-100'} flex items-center justify-center flex-shrink-0 text-white">
            <span class="text-sm">${isUser ? '👤' : '🤖'}</span>
        </div>
        <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-gray-200 ${isUser ? 'bg-indigo-50 rounded-l-xl rounded-br-xl' : 'bg-white rounded-r-xl rounded-bl-xl shadow-sm'}">
            <div class="text-sm font-normal text-gray-900 prose prose-sm max-w-none ${isUser ? 'text-indigo-900' : ''}">
                ${contentHtml}
            </div>
        </div>
    </div>`;

    history.insertAdjacentHTML('beforeend', html);
    history.scrollTop = history.scrollHeight;
    return id;
}

function getChatContext() {
    // Sends the current view's data summary to the AI

    // 1. Basic Info
    const ctx = {
        shop: state.activeShop,
        dateRange: state.dateRange,
        dataType: state.activeDataType,
        activeDataSummary: {},
        globalSummary: {}
    };

    // 2. Global Summary Data (Important for overall business context)
    if (typeof SHOP_PREFIXES !== 'undefined') {
        SHOP_PREFIXES.forEach(shop => {
            const bk = state.allResults[`${shop}|bookings`];
            const del = state.allResults[`${shop}|delivery`];
            const exp = state.allResults[`${shop}|expense`];

            if (bk) {
                ctx.globalSummary[shop] = {
                    netBooking: bk.netAmount !== undefined ? bk.netAmount : (bk.totalAmount || 0),
                    delivery: del ? (del.totalAmount || 0) : 0,
                    expense: exp ? (exp.totalAmount || 0) : 0
                };
            }
        });
    }

    // 3. Detailed Data Snapshot for Active Shop
    if (state.activeShop !== 'OVERVIEW' && !['COMPARE', 'CUSTOMERS'].includes(state.activeShop)) {
        const bk = state.allResults[`${state.activeShop}|bookings`];
        const exp = state.allResults[`${state.activeShop}|expense`];
        const del = state.allResults[`${state.activeShop}|delivery`];

        if (bk) {
            const net = bk.netAmount !== undefined ? bk.netAmount : 0;
            const gross = bk.totalAmount || 0;
            const cancel = bk.cancelAmount !== undefined ? bk.cancelAmount : 0;

            ctx.activeDataSummary.bookings = {
                gross: gross,
                canceled: cancel,
                net: net,
                count: bk.filteredData ? bk.filteredData.length : 0
            };
        }

        if (exp) {
            const totalExp = exp.totalAmount || 0;
            ctx.activeDataSummary.expenses = {
                total: totalExp,
                count: exp.filteredData ? exp.filteredData.length : 0
            };
        }

        if (del) {
            const totalDel = del.totalAmount || 0;
            ctx.activeDataSummary.delivery = {
                total: totalDel,
                count: del.filteredData ? del.filteredData.length : 0,
                paymentMethods: del.paymentMethods || {}
            };
        }
    }

    return ctx;
}

// Global attachments
window.toggleAIChat = toggleAIChat;
window.handleChatSubmit = handleChatSubmit;
window.triggerHealthAnalysis = triggerHealthAnalysis;
