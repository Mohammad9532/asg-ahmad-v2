/**
 * Generates and downloads a professional PDF report using html2pdf.js
 */
async function downloadPDF() {
    const container = document.getElementById('dataTypeContentContainer');
    if (!container) return;

    // 1. Prepare a clone for the PDF to avoid messing up the live UI
    const pdfContent = container.cloneNode(true);

    // 2. Remove non-printable elements from the clone (buttons, search bars)
    pdfContent.querySelectorAll('button, .mb-3.relative.max-w-md').forEach(el => el.remove());

    // 3. Add a professional header 
    const header = document.createElement('div');
    header.style.marginBottom = '20px';
    header.style.padding = '20px';
    header.style.borderBottom = '2px solid #0d9488';
    header.style.backgroundColor = '#f8fafc';

    const shopName = activeShop === 'OVERVIEW' ? 'GLOBAL OVERVIEW' : activeShop;
    const dateStr = `Period: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}`;
    const reportType = activeDataType.replace('_', ' ').toUpperCase();

    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 800;">SHOP DATA REPORT</h1>
            <div style="text-align: right;">
                <p style="margin: 0; font-weight: 700; color: #0d9488;">${shopName}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b;">${dateStr}</p>
            </div>
        </div>
        <div style="margin-top: 10px; font-weight: 600; color: #475569; font-size: 14px;">${reportType}</div>
    `;

    pdfContent.insertBefore(header, pdfContent.firstChild);

    // 4. Ensure charts are rendered/visible (html2pdf captures what's currently there)
    // We might need a small delay or to ensure charts are images. 
    // html2pdf handles canvases by default.

    // 5. PDF Options
    const opt = {
        margin: [0.5, 0.5],
        filename: `${shopName.replace(/\s+/g, '_')}_${reportType.replace(/\s+/g, '_')}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // 6. Show loading state on the button
    const btn = document.querySelector('button[onclick="downloadPDF()"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Generating PDF...
    `;
    btn.disabled = true;

    try {
        // 7. Generate!
        await html2pdf().set(opt).from(pdfContent).save();
    } catch (error) {
        console.error('PDF Generation failed:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        // 8. Restore button state
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}
