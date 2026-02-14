
import { state } from './state.js';

/**
 * Generates and downloads a professional PDF report using html2pdf.js
 */
export async function downloadPDF() {
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

    const shopName = state.activeShop === 'OVERVIEW' ? 'GLOBAL OVERVIEW' : state.activeShop;
    const dateStr = `Period: ${document.getElementById('startDate').value} to ${document.getElementById('endDate').value}`;
    const reportType = state.activeDataType.replace('_', ' ').toUpperCase();

    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
                <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">beingReal <span style="color: #0d9488;">Accounts</span></h1>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Professional Shop Data Report</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-weight: 800; color: #1e293b; font-size: 18px;">${shopName}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">${dateStr}</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8; margin-top: 4px;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
        <div style="display: inline-block; background-color: #0d9488; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; text-transform: uppercase;">${reportType}</div>
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
    if (btn) {
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
    } else {
        // Fallback if triggered programmatically
        try {
            await html2pdf().set(opt).from(pdfContent).save();
        } catch (error) {
            console.error('PDF Generation failed:', error);
        }
    }
}

// Global attachment
window.downloadPDF = downloadPDF;
