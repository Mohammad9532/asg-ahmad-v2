
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

    // 3. Show loading state on the button
    const btn = document.querySelector('button[onclick="downloadPDF()"]');
    let originalContent = "Download Report";
    if (btn) {
        originalContent = btn.innerHTML;
        btn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
        `;
        btn.disabled = true;
    }

    try {
        // Collect all styles from the parent document to ensure Tailwind works
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(node => node.outerHTML)
            .join('\n');

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; // fixed avoids scrolling issues
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${shopName} - ${reportType} Report</title>
                    ${styles}
                    <style>
                        @page { size: auto; margin: 10mm; }
                        body { 
                            background-color: white !important; 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                            padding: 24px;
                            font-family: 'Inter', sans-serif;
                        }
                        /* Override scrolling constraints inside iframe */
                        .custom-scroll { overflow: visible !important; max-height: none !important; }
                        
                        /* Header specific for print */
                        .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
                        .print-header h1 { margin: 0; color: #1e293b; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
                        .print-header h1 span { color: #0d9488; }
                        .print-header p { margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                        .print-header-right { text-align: right; }
                        .print-header-right p { margin: 0; font-weight: 800; color: #1e293b; font-size: 18px; text-transform: none; }
                        .print-header-right .dates { margin: 0; font-size: 12px; color: #64748b; font-weight: 500; text-transform: none; }
                        .print-header-right .gen { margin: 0; font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: none; }
                        .report-badge { display: inline-block; background-color: #0d9488; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; text-transform: uppercase; margin-bottom: 20px;}
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <div>
                            <h1>beingReal <span>Accounts</span></h1>
                            <p>Professional Shop Data Report</p>
                        </div>
                        <div class="print-header-right">
                            <p>${shopName}</p>
                            <p class="dates">${dateStr}</p>
                            <p class="gen">Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="report-badge">${reportType}</div>
                    
                    <div>
                        ${pdfContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        doc.close();

        // Wait a tiny bit for browser to parse styles and render DOM
        await new Promise(resolve => setTimeout(resolve, 800));

        // Use the native print dialog
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Clean up after print dialog context yields
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 3000);

    } catch (err) {
        console.error("Failed to sequence print dialog: ", err);
        alert("Failed to open print dialog.");
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

// Global attachment
window.downloadPDF = downloadPDF;
