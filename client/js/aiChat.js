// --- AI CHAT LOGIC ---

function toggleAIChat() {
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

async function handleChatSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    // Add User Message
    appendMessage('user', message);
    input.value = '';

    // Show Loading State
    const loadingId = appendMessage('ai', 'Thinking...', true);

    try {
        // Gather Context
        const context = getChatContext();

        // Send to API
        // NOTE: Using BASE_URL for AI
        const response = await fetch(`${BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message, context })
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
        shop: activeShop,
        dateRange: dateRange,
        dataType: activeDataType,
        activeDataSummary: {}
    };

    // 2. Data Snapshot
    if (activeShop === 'OVERVIEW') {
        ctx.activeDataSummary = "User is in Global Overview mode. Data from all shops is potentially relevant, but summary metrics are not fully aggregated here for brevity.";
    } else {
        // Get bookings, expense, delivery for this shop
        // Global allResults from state.js
        const bk = allResults[`${activeShop}|bookings`];
        const exp = allResults[`${activeShop}|expense`];
        const del = allResults[`${activeShop}|delivery`];

        if (bk && bk.filteredData) {
            const total = getTotalBookingsAmount(activeShop);
            const cancel = getTotalCanceledAmount(activeShop);
            ctx.activeDataSummary.bookings = {
                gross: total,
                canceled: cancel,
                net: total - cancel,
                count: bk.filteredData.length
            };
        }

        if (exp && exp.filteredData) {
            const totalExp = exp.filteredData.reduce((s, d) => s + (d.amount || 0), 0);
            ctx.activeDataSummary.expenses = {
                total: totalExp,
                count: exp.filteredData.length
            };
        }

        if (del && del.filteredData) {
            const totalDel = del.filteredData.reduce((s, d) => s + (d.amount || 0), 0);
            ctx.activeDataSummary.delivery = {
                total: totalDel,
                count: del.filteredData.length
            }
        }
    }

    return ctx;
}
