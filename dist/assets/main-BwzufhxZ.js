(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const l of o)if(l.type==="childList")for(const n of l.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(o){const l={};return o.integrity&&(l.integrity=o.integrity),o.referrerPolicy&&(l.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?l.credentials="include":o.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function a(o){if(o.ep)return;o.ep=!0;const l=s(o);fetch(o.href,l)}})();const i={allResults:{},activeShop:"OVERVIEW",activeDataType:"bookings",dateRange:{},sortState:{},searchState:{},pageState:{}},N=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:3000":"https://asg-ahmad.vercel.app",_=["Albarieklamaa","Algaidamadam","Gaidamnasir","Gaidatailor","Galaxybranch","Galaxyzakhir","Gawanimadam","Naseem","Staralgawani"],$t=["bookings","delivery","expense","employee"],W=[{id:"2027-2028",label:"2027 - 2028",start:"2027-05-18",end:"2028-05-06",eid:"2028-02-25"},{id:"2026-2027",label:"2026 - 2027",start:"2026-05-28",end:"2027-05-17",eid:"2027-03-09"},{id:"2025-2026",label:"2025 - 2026",start:"2025-06-08",end:"2026-05-27",eid:"2026-03-20"},{id:"2024-2025",label:"2024 - 2025",start:"2024-06-18",end:"2025-06-07",eid:"2025-03-31"},{id:"2023-2024",label:"2023 - 2024",start:"2023-06-30",end:"2024-06-17",eid:"2024-04-10"},{id:"2022-2023",label:"2022 - 2023",start:"2022-07-11",end:"2023-06-29",eid:"2023-04-21"}],St=Object.freeze(Object.defineProperty({__proto__:null,BASE_URL:N,DATA_TYPES:$t,ISLAMIC_CYCLES:W,SHOP_PREFIXES:_},Symbol.toStringTag,{value:"Module"}));function g(t){const e=Number(t);return isNaN(e)?"AED 0.00":`${e<0?"-":""} AED ${Math.abs(e).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`}function U(t,e,s){const a=["totalAmount","gross","cancelAmount","netAmount","delivery","expense","CASH","ADIB","ATM","count","total","amount"];return t.sort((o,l)=>{let n=o[e]||0,d=l[e]||0;if(e.includes(".")){const[r,u]=e.split(".");n=o[r]&&o[r][u]||0,d=l[r]&&l[r][u]||0}return e.toLowerCase().includes("date")||e.toLowerCase().includes("monthyear")?(n=new Date(n),d=new Date(d)):a.includes(e)?(n=parseFloat(n),d=parseFloat(d)):(n=String(n).toLowerCase(),d=String(d).toLowerCase()),n<d?s==="asc"?-1:1:n>d?s==="asc"?1:-1:0}),t}function O(t,e){const s=i.sortState?i.sortState[e]:null;return!s||s.key!==t?'<span class="sort-icon text-gray-400">▲▼</span>':`<span class="sort-icon text-teal-600">${s.dir==="asc"?"▲":"▼"}</span>`}function se(t){if(t==null)return!1;const e=String(t).toLowerCase().trim();return e==="cancel"||e==="canceled"||e==="cancelled"||e==="deducted"}function Ae(t){return Array.isArray(t)?t.filter(e=>se(e.status)).reduce((e,s)=>e+(Number(s.amount)||0),0):0}const Ct="modulepreload",Et=function(t){return"/"+t},Ne={},Ge=function(e,s,a){let o=Promise.resolve();if(s&&s.length>0){let u=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};var n=u;document.getElementsByTagName("link");const d=document.querySelector("meta[property=csp-nonce]"),r=d?.nonce||d?.getAttribute("nonce");o=u(s.map(c=>{if(c=Et(c),c in Ne)return;Ne[c]=!0;const m=c.endsWith(".css"),p=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${p}`))return;const x=document.createElement("link");if(x.rel=m?"stylesheet":Ct,m||(x.as="script"),x.crossOrigin="",x.href=c,r&&x.setAttribute("nonce",r),document.head.appendChild(x),m)return new Promise((h,k)=>{x.addEventListener("load",h),x.addEventListener("error",()=>k(new Error(`Unable to preload CSS for ${c}`)))})}))}function l(d){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=d,window.dispatchEvent(r),!r.defaultPrevented)throw d}return o.then(d=>{for(const r of d||[])r.status==="rejected"&&l(r.reason);return e().catch(l)})};function Dt(t){const e=i.allResults[`${t}|bookings`]?.filteredData||[],s=i.allResults[`${t}|delivery`]?.filteredData||[],a=i.allResults[`${t}|expense`]?.filteredData||[],o={};return e.forEach(l=>{const n=new Date(l.date),d=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`,r=l.amount||0,u=se(l.status);o[d]||(o[d]={gross:0,canceled:0,net:0,delivery:{total:0,breakdown:{}},expense:0}),o[d].gross+=r,u&&(o[d].canceled+=r),o[d].net=o[d].gross-o[d].canceled}),s.forEach(l=>{const n=new Date(l.date),d=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`,r=l.amount||0,u=(l.billNo||"").toLowerCase().trim();let c=l.amountType?l.amountType.toUpperCase().trim():"CASH";(c.includes("CARD")||c.includes("VISA")||c.includes("MASTER"))&&(c="ADIB"),c!=="ADIB"&&c!=="ATM"&&(c="CASH"),o[d]||(o[d]={gross:0,canceled:0,net:0,delivery:{total:0,bookingTotal:0,miscTotal:0,breakdown:{}},expense:0}),o[d].delivery.breakdown||(o[d].delivery.breakdown={},o[d].delivery.bookingTotal=0,o[d].delivery.miscTotal=0),o[d].delivery.total+=r,u&&u!=="other-amounts"?o[d].delivery.bookingTotal+=r:o[d].delivery.miscTotal+=r,o[d].delivery.breakdown[c]||(o[d].delivery.breakdown[c]=0),o[d].delivery.breakdown[c]+=r}),a.forEach(l=>{const n=new Date(l.date),d=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`,r=l.amount||0;o[d]||(o[d]={gross:0,canceled:0,net:0,delivery:{total:0,breakdown:{}},expense:0}),o[d].expense+=r}),Object.keys(o).sort().map(l=>({monthYear:l,...o[l]}))}function Ye(t){const e=document.getElementById("dataTypeContentContainer"),s=Dt(t);if(s.length===0){e.innerHTML='<p class="text-center text-gray-500 mt-8">No data found across bookings, deliveries, or expenses for the monthly summary in the selected range.</p>';return}e.innerHTML=`
        <div class="flex justify-end mb-4">
            <button 
                onclick="exportMonthlySummaryToCSV('${t}')" 
                class="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-lg"
            >
                Export Monthly Report to CSV (Excel Format)
            </button>
        </div>
    `,e.innerHTML+=At(s,t),e.innerHTML+='<h3 class="text-xl font-bold mt-8 mb-4 border-b pb-2 text-teal-700">Monthly Delivery Total</h3>',e.innerHTML+=Bt(s,t),e.innerHTML+='<h3 class="text-xl font-bold mt-8 mb-4 border-b pb-2 text-red-700">Monthly Expense Total</h3>',e.innerHTML+=Mt(s,t)}function At(t,e){const s=`${e}_monthly_bookings`,a=i.sortState[s];a&&(t=U([...t],a.key,a.dir));let o=0,l=0,n=0;const d=t.map(r=>{const[u,c]=r.monthYear.split("-").map(Number),m=new Date(u,c-1,1).toLocaleString("default",{month:"long"}),p=r.gross||0,x=r.canceled||0,h=r.net||0;o+=p,l+=x,n+=h;const k=h>=0?"text-green-700-bold":"text-red-700-bold",$=p>=0?"text-teal-700":"text-red-700-bold";return`<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${m} ${u}</td>
            <td class="px-6 py-3 text-right ${$}">${g(p)}</td>
            <td class="px-6 py-3 text-right text-red-700-bold">${g(x)}</td>
            <td class="px-6 py-3 text-right ${k} bg-green-100/50">${g(h)}</td>
                <td class="px-6 py-3 text-center">
                <button onclick="downloadMonthlyExcel('${e}', '${r.monthYear}')" class="text-green-600 hover:text-green-800 transition-colors" title="Download Excel">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
            </td>
        </tr>`}).join("");return`
    <div id="${s}_container">
        <h3 class="text-xl font-bold mb-4 border-b pb-2 text-teal-700">Monthly Booking Report (Gross, Canceled, Net)</h3>
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg mb-8 shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${s}', renderMonthlySummary)">
                            Month / Year ${O("monthYear",s)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('gross', '${s}', renderMonthlySummary)">
                            Gross Bookings ${O("gross",s)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right text-red-700-bold sortable-header" onclick="handleSort('canceled', '${s}', renderMonthlySummary)">
                            Canceled/Deducted ${O("canceled",s)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right bg-green-100/50 text-green-700-bold sortable-header" onclick="handleSort('net', '${s}', renderMonthlySummary)">
                            Net Booking Total ${O("net",s)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-center">Export</th>
                    </tr>
                </thead>
                <tbody>
                    ${d}
                </tbody>
                <tfoot class="text-xs text-gray-700 uppercase bg-gray-200 sticky bottom-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base">Grand Totals</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-teal-700">${g(o)}</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-red-700-bold">${g(l)}</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-green-700-bold bg-green-100/50">${g(n)}</th>
                        <th scope="col" class="px-6 py-3"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
`}function Bt(t,e){const s=`${e}_monthly_deliveries`,a=new Set;t.forEach(c=>{c.delivery&&c.delivery.breakdown&&Object.keys(c.delivery.breakdown).forEach(m=>a.add(m))});const o=["CASH","ADIB","ATM"],l=i.sortState[s];l&&(t=U([...t],l.key,l.dir));let n=0;const d={};o.forEach(c=>d[c]=0);const r=t.map(c=>{const[m,p]=c.monthYear.split("-").map(Number),x=new Date(m,p-1,1).toLocaleString("default",{month:"long"}),h=c.delivery.total||0;n+=h;const k=o.map(b=>{const D=c.delivery.breakdown[b]||0;return d[b]+=D,`<td class="px-6 py-3 text-right">${g(D)}</td>`}).join(""),$=h>=0?"text-green-700-bold":"text-red-700-bold";return`<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${x} ${m}</td>
            ${k}
            <td class="px-6 py-3 text-right font-extrabold ${$} bg-teal-100/50">${g(h)}</td>
        </tr>`}).join(""),u=o.map(c=>{const m=`delivery.breakdown.${c}`;return`<th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('${m}', '${s}', renderMonthlySummary)">
            ${c} ${O(m,s)}
        </th>`}).join("");return`
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg mb-8 shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${s}', renderMonthlySummary)">
                            Month / Year ${O("monthYear",s)}
                        </th>
                        ${u}
                        <th scope="col" class="px-6 py-3 text-right bg-teal-200/50 sortable-header" onclick="handleSort('delivery.total', '${s}', renderMonthlySummary)">
                            Total Delivery Amount ${O("delivery.total",s)}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${r}
                </tbody>
                <tfoot class="text-xs text-gray-700 uppercase bg-gray-200 sticky bottom-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base">Grand Total</th>
                        ${o.map(c=>`<th scope="col" class="px-6 py-3 font-extrabold text-base text-right">${g(d[c])}</th>`).join("")}
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-teal-700 bg-teal-200/50">${g(n)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    `}function Mt(t,e){const s=`${e}_monthly_expenses`,a=i.sortState[s];a&&(t=U([...t],a.key,a.dir));let o=0;const l=t.map(n=>{const[d,r]=n.monthYear.split("-").map(Number),u=new Date(d,r-1,1).toLocaleString("default",{month:"long"}),c=n.expense||0;o+=c;const m=-c;return`<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${u} ${d}</td>
            <td class="px-6 py-3 text-right text-red-700-bold bg-red-50/50">${g(m)}</td>
        </tr>`}).join("");return`
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${s}', renderMonthlySummary)">Month / Year ${O("monthYear",s)}</th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('expense', '${s}', renderMonthlySummary)">Total Expense Amount ${O("expense",s)}</th>
                    </tr>
                </thead>
                <tbody>
                    ${l}
                </tbody>
                <tfoot class="text-xs text-gray-700 uppercase bg-gray-200 sticky bottom-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base">Grand Total</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-red-700-bold bg-red-200/50">${g(-o)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    `}let z="pending",Y=[];async function We(t){const e=document.getElementById("dataTypeContentContainer"),s=`
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Stock Audit: ${t}</h2>
                <div class="flex flex-wrap gap-2 mt-2 bg-slate-100 p-1 rounded-lg inline-flex">
                    <button onclick="switchAuditTab('${t}', 'pending')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${z==="pending"?"bg-white text-teal-700 shadow-sm":"text-slate-500 hover:text-slate-700"}">
                        Pending Stock
                    </button>
                    <button onclick="switchAuditTab('${t}', 'verified')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${z==="verified"?"bg-white text-teal-700 shadow-sm":"text-slate-500 hover:text-slate-700"}">
                        Checked History
                    </button>
                    <button onclick="switchAuditTab('${t}', 'archived')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${z==="archived"?"bg-white text-indigo-700 shadow-sm":"text-slate-500 hover:text-slate-700"}">
                        Archived History
                    </button>
                </div>
            </div>
            <div class="flex flex-wrap gap-3">
                 <button onclick="archiveCurrentAudit('${t}')" class="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Start New Audit
                </button>
                 <button onclick="printAuditList()" class="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print List
                </button>
            </div>
        </div>
        <div id="auditContent"></div>
    `;e.innerHTML=s,await Xe(t)}async function Ke(t,e){z=e,We(t)}async function Xe(t){const e=document.getElementById("auditContent"),s=`${t}|stock_audit|${z}`;if(i.allResults&&i.allResults[s]){Y=i.allResults[s],z==="pending"?Pe(t,Y):z==="verified"?_e(t,Y):z==="archived"&&he(t,Y);return}e.innerHTML=`
        <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
    `;try{Y=await It(t,z),i.allResults&&(i.allResults[s]=Y),z==="pending"?Pe(t,Y):z==="verified"?_e(t,Y):z==="archived"&&he(t,Y)}catch(a){e.innerHTML=`
            <div class="bg-red-50 text-red-700 p-4 rounded-lg">
                <p>Error loading data: ${a.message}</p>
                 <button onclick="loadAuditContent('${t}')" class="mt-2 text-sm underline">Retry</button>
            </div>
        `}}async function It(t,e){const s=`${N}/api/${t}/stock_audit?status=${e}`,a=localStorage.getItem("authToken"),o={"Content-Type":"application/json"};a&&(o.Authorization=`Bearer ${a}`);const l=await fetch(s,{headers:o});if(!l.ok){const n=await l.text();throw new Error(n)}return await l.json()}async function Tt(t){const e=prompt("Enter a name for this audit batch to archive it (e.g., 'Year End 2024'):");if(e!==null){if(e.trim()===""){alert("Please enter a valid name.");return}if(confirm(`Are you sure you want to archive all currently Checked items as "${e}"? 
This will reset the Checked History and Pending Stock will populate for the new cycle.`))try{const s=`${N}/api/${t}/stock_audit/archive`,a=localStorage.getItem("authToken"),o=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({auditName:e})});if(!o.ok)throw new Error(await o.text());const l=await o.json();i.allResults&&Object.keys(i.allResults).forEach(n=>{n.startsWith(`${t}|stock_audit|`)&&delete i.allResults[n]}),alert(`Successfully archived ${l.modifiedCount} items!`),Ke(t,"pending")}catch(s){console.error("Archive Error:",s),alert("Failed to archive audit: "+s.message)}}}function Pe(t,e){const s=document.getElementById("auditContent");if(!e||e.length===0){s.innerHTML='<div class="p-8 text-center text-slate-500">No pending stock items found. Great job!</div>';return}const a=e.reduce((l,n)=>l+n.balance,0);let o=`
        <div class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
            <div class="flex items-center">
                <svg class="h-5 w-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Found <strong>${e.length}</strong> pending items. Total Value: <strong>${g(a)}</strong></span>
            </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-16">Qty</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Total Amt</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Balance</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-24">Missing Pcs</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-48">Remark</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm">
    `;if(e.forEach(l=>{const n=l.qty?l.qty:"-",d=l.qty||0,r=l.balance||0;o+=`
            <tr id="row_${l.billNo}" class="hover:bg-slate-50 group transition-colors">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">
                    <button onclick="showBillDetails('${t}', '${l.billNo}')" 
                        class="text-teal-600 hover:text-teal-800 hover:underline focus:outline-none flex items-center">
                        ${l.billNo}
                        <svg class="w-3 h-3 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${new Date(l.date).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-slate-700 font-medium">${l.name}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-600">${n}</td>
                 <td class="px-6 py-4 text-right font-medium text-slate-600">${g(l.bookedAmount||0)}</td>
                <td class="px-6 py-4 text-right font-bold text-teal-700">${g(l.balance)}</td>
                <td class="px-6 py-3">
                    <input type="number" 
                        id="missing_${l.billNo}" 
                        min="0"
                        class="w-full text-center text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" 
                        placeholder="0"
                    >
                </td>
                <td class="px-6 py-3">
                    <input type="text" 
                        id="remark_${l.billNo}" 
                        class="w-full text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" 
                        placeholder="Location / Status..."
                    >
                </td>
                <td class="px-6 py-3 text-center">
                    <button onclick="verifyStockAuditItem('${t}', '${l.billNo}', ${d}, ${r})" 
                        class="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors shadow-sm border border-green-200"
                        title="Mark as Checked">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </td>
            </tr>
        `}),o+="</tbody></table></div></div>",!document.getElementById("billDetailsModal")){const l=document.createElement("div");l.id="billDetailsModal",l.className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center hidden z-50 p-4 backdrop-blur-sm",l.innerHTML=`
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all scale-95" id="billDetailsContent">
                <!-- Dynamic Content Load Here -->
            </div>
        `,document.body.appendChild(l),l.addEventListener("click",n=>{n.target===l&&Je()})}s.innerHTML=o}async function Lt(t,e){const s=document.getElementById("billDetailsModal"),a=document.getElementById("billDetailsContent");s.classList.remove("hidden"),setTimeout(()=>{a.classList.remove("scale-95"),a.classList.add("scale-100")},10),a.innerHTML=`
        <div class="p-8 flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    `;try{const o=`${N}/api/${t}/bill_details?billNo=${e}`,l=localStorage.getItem("authToken"),n=await fetch(o,{headers:{Authorization:`Bearer ${l}`}});if(!n.ok)throw new Error("Failed to fetch details");const d=await n.json(),{booking:r,deliveries:u}=d;if(!r){a.innerHTML=`<div class="p-8 text-center text-red-500">Booking not found for Bill ${e}.</div>`;return}const c=r.amount||0,m=u.reduce((h,k)=>h+(k.amount||0),0),p=c-m;let x="";u.length===0?x='<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400 italic">No deliveries recorded yet.</td></tr>':u.forEach((h,k)=>{x+=`
                    <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-3 text-slate-600">${k+1}</td>
                        <td class="px-4 py-3 font-mono text-slate-700 font-bold">${h.amountType||"Cash/Card"}</td>
                        <td class="px-4 py-3 text-slate-500">${new Date(h.date).toLocaleDateString()}</td>
                        <td class="px-4 py-3 text-right font-bold text-teal-700">${g(h.amount)}</td>
                    </tr>
                `}),a.innerHTML=`
            <div class="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 class="text-xl font-bold text-white flex items-center">
                    <svg class="w-6 h-6 mr-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bill #${r.billNo} Details
                </h3>
                <button onclick="closeBillDetails()" class="text-indigo-100 hover:text-white hover:bg-indigo-500 rounded-full p-1 transition-colors">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="p-6">
                <!-- Booking Info -->
                <div class="bg-indigo-50 rounded-xl p-5 mb-6 border border-indigo-100">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <div>
                            <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Date</p>
                            <p class="font-semibold text-indigo-900">${new Date(r.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Customer</p>
                            <p class="font-semibold text-indigo-900">${r.name||"Unknown"}</p>
                        </div>
                        <div>
                             <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Phone</p>
                             <p class="font-semibold text-indigo-900 font-mono">${r.countryCode||""} ${r.phone||"-"}</p>
                        </div>
                         <div>
                             <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Order Qty</p>
                             <p class="font-bold text-indigo-900 bg-white inline-block px-2 rounded border border-indigo-200">${r.qty||0}</p>
                        </div>
                    </div>
                </div>

                <!-- Financial Summary -->
                <div class="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p class="text-xs text-slate-500 uppercase font-bold mb-1">Total Booked</p>
                        <p class="text-xl font-bold text-slate-800">${g(c)}</p>
                    </div>
                     <div class="bg-teal-50 p-4 rounded-lg border border-teal-200">
                        <p class="text-xs text-teal-600 uppercase font-bold mb-1">Total Delivered</p>
                        <p class="text-xl font-bold text-teal-700">${g(m)}</p>
                    </div>
                     <div class="bg-amber-50 p-4 rounded-lg border border-amber-200 ring-2 ring-amber-100">
                        <p class="text-xs text-amber-600 uppercase font-bold mb-1">Balance Due</p>
                        <p class="text-xl font-bold text-amber-700">${g(p)}</p>
                    </div>
                </div>

                <!-- Delivery History -->
                <div class="border rounded-lg overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-600 text-sm flex justify-between items-center">
                        <span>Delivery History</span>
                        <span class="text-xs font-normal bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">${u.length} Records</span>
                    </div>
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-2 w-12">#</th>
                                <th class="px-4 py-2">Type</th>
                                <th class="px-4 py-2">Date</th>
                                <th class="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${x}
                        </tbody>
                    </table>
                </div>
            </div>
            
             <div class="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                <button onclick="closeBillDetails()" class="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    Close Details
                </button>
            </div>
        `}catch(o){a.innerHTML=`
            <div class="p-8 text-center text-red-500">
                <p>Error loading details.</p>
                <p class="text-sm mt-2 font-mono bg-red-50 p-2 rounded text-red-800">${o.message}</p>
                 <button onclick="closeBillDetails()" class="mt-4 text-sm underline">Close</button>
            </div>
        `}}function Je(){const t=document.getElementById("billDetailsModal"),e=document.getElementById("billDetailsContent");e.classList.remove("scale-100"),e.classList.add("scale-95"),setTimeout(()=>{t.classList.add("hidden")},200)}function _e(t,e){const s=document.getElementById("auditContent");let a=`
        <div class="mb-4">
            <input type="text" 
                id="historySearchInput" 
                onkeyup="filterHistoryTable()" 
                placeholder="Search by Bill No or Remarks..." 
                class="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
        </div>
    `;if(!e||e.length===0){s.innerHTML=a+'<div class="p-8 text-center text-slate-500">No checked items in history yet.</div>';return}a+=`
        <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200" id="checkedHistoryTable">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Qty</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Amount</th> 
                            <th class="px-6 py-3 text-center text-xs font-bold text-red-500 uppercase w-24">Missing</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-full">Remark</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Checked At</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm">
    `,e.forEach(o=>{const l=o.missingPcs>0?`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">${o.missingPcs} Missing</span>`:'<span class="text-slate-400">-</span>',n=o.amount!==void 0&&o.amount!==null?`<span class="font-bold text-teal-700">${g(o.amount)}</span>`:'<span class="text-slate-400 italic">-</span>';let d=`${o.billNo} ${o.remark||""}`.toLowerCase();o.missingPcs>0&&(d+=` missing ${o.missingPcs}`),a+=`
            <tr class="hover:bg-slate-50 history-row" data-search="${d}">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">${o.billNo}</td>
                <td class="px-6 py-4 text-center text-slate-600 font-semibold">${o.qty!==void 0&&o.qty!==null?o.qty:"-"}</td>
                 <td class="px-6 py-4 text-right">${n}</td>
                <td class="px-6 py-4 text-center">${l}</td>
                <td class="px-6 py-4 text-slate-600">${o.remark||'<span class="text-slate-400 italic">No remark</span>'}</td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                    ${new Date(o.checkedAt).toLocaleDateString()} 
                    <span class="text-slate-400 ml-1">${new Date(o.checkedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Checked
                    </span>
                </td>
            </tr>
        `}),a+="</tbody></table></div></div>",s.innerHTML=a}let xe=null,Be="";function he(t,e){const s=document.getElementById("auditContent");if(Be=t,!e||e.length===0){s.innerHTML='<div class="p-8 text-center text-slate-500">No archived history found.</div>';return}xe?jt(t,e,xe):Rt(t,e)}function Rt(t,e){const s=document.getElementById("auditContent"),a={};e.forEach(n=>{const d=n.batchLabel||"Unnamed Audit";a[d]||(a[d]={label:d,count:0,totalAmount:0,missingCount:0,lastChecked:n.checkedAt}),a[d].count++,a[d].totalAmount+=n.amount||0,n.missingPcs>0&&(a[d].missingCount+=n.missingPcs),new Date(n.checkedAt)>new Date(a[d].lastChecked)&&(a[d].lastChecked=n.checkedAt)});const o=Object.values(a).sort((n,d)=>new Date(d.lastChecked)-new Date(n.lastChecked));let l=`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
    `;o.forEach(n=>{l+=`
            <div onclick="openArchiveBatch('${n.label}')" 
                class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-indigo-500">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                     <div class="text-right">
                        <span class="block text-xs text-slate-400 uppercase font-bold tracking-wider">Total Value</span>
                        <span class="block text-lg font-bold text-slate-700">${g(n.totalAmount)}</span>
                    </div>
                </div>
                
                <h3 class="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">${n.label}</h3>
                <p class="text-sm text-slate-500 mb-4">Last updated: ${new Date(n.lastChecked).toLocaleDateString()}</p>
                
                <div class="border-t border-slate-100 pt-4 flex justify-between items-center text-sm">
                    <span class="text-slate-600 font-medium">${n.count} Items</span>
                     ${n.missingCount>0?`<span class="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">${n.missingCount} Missing</span>`:'<span class="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">All Clear</span>'}
                </div>
            </div>
        `}),l+="</div>",s.innerHTML=l}function jt(t,e,s){const a=document.getElementById("auditContent"),o=e.filter(n=>(n.batchLabel||"Unnamed Audit")===s);let l=`
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <button onclick="closeArchiveBatch()" class="flex items-center text-indigo-600 hover:text-indigo-800 font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Archives
            </button>
            <h3 class="text-xl font-bold text-slate-800">${s}</h3>
            <div class="w-full md:w-1/3">
                <input type="text" 
                    id="archivedSearchInput" 
                    onkeyup="filterArchivedTable()" 
                    placeholder="Search in ${s}..." 
                    class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
            </div>
        </div>
    `;l+=`
        <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200" id="archivedTable">
                    <thead class="bg-indigo-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-indigo-800 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-indigo-500 uppercase w-20">Qty</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-indigo-500 uppercase w-32">Amount</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-red-500 uppercase w-24">Missing</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-indigo-500 uppercase w-full">Remark</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-indigo-500 uppercase whitespace-nowrap">Checked At</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm bg-white">
    `,o.forEach(n=>{const d=n.missingPcs>0?`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">${n.missingPcs} Missing</span>`:'<span class="text-slate-400">-</span>',r=n.amount!==void 0&&n.amount!==null?`<span class="font-bold text-slate-700">${g(n.amount)}</span>`:'<span class="text-slate-400 italic">-</span>',u=`${n.billNo} ${n.remark||""}`.toLowerCase();l+=`
            <tr class="hover:bg-slate-50 archived-row" data-search="${u}">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">${n.billNo}</td>
                <td class="px-6 py-4 text-center text-slate-600 font-semibold">${n.qty!==void 0&&n.qty!==null?n.qty:"-"}</td>
                <td class="px-6 py-4 text-right">${r}</td>
                <td class="px-6 py-4 text-center">${d}</td>
                <td class="px-6 py-4 text-slate-600">${n.remark||'<span class="text-slate-400 italic">No remark</span>'}</td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                    ${new Date(n.checkedAt).toLocaleDateString()} 
                    <span class="text-slate-400 ml-1">${new Date(n.checkedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                </td>
            </tr>
        `}),l+="</tbody></table></div></div>",a.innerHTML=l}function Ht(t){xe=t,he(Be,Y)}function Ot(){xe=null,he(Be,Y)}function Nt(){const e=document.getElementById("historySearchInput").value.toLowerCase();document.querySelectorAll(".history-row").forEach(a=>{const o=a.getAttribute("data-search");o&&o.includes(e)?a.style.display="":a.style.display="none"})}function Pt(){const e=document.getElementById("archivedSearchInput").value.toLowerCase();document.querySelectorAll(".archived-row").forEach(a=>{const o=a.getAttribute("data-search");o&&o.includes(e)?a.style.display="":a.style.display="none"})}async function _t(t,e,s,a){const o=document.getElementById(`remark_${e}`),l=document.getElementById(`missing_${e}`),n=o?o.value:"",d=l&&l.value?l.value:0,r=document.getElementById(`row_${e}`);r&&(r.style.transition="all 0.5s",r.style.opacity="0.5",r.style.backgroundColor="#f0fdf4");try{const u=`${N}/api/${t}/stock_audit/verify`,c=localStorage.getItem("authToken");await fetch(u,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({billNo:e,remark:n,qty:s,missingPcs:d,amount:a})}),i.allResults&&(delete i.allResults[`${t}|stock_audit|pending`],delete i.allResults[`${t}|stock_audit|verified`]),r&&(r.innerHTML='<td colspan="9" class="px-6 py-4 text-center text-green-700 font-bold bg-green-50">Verified! Moved to History.</td>',setTimeout(()=>{r.remove()},1e3))}catch(u){console.error("Verification Error:",u),alert("Failed to verify item: "+u.message),r&&(r.style.opacity="1",r.style.backgroundColor="")}}window.switchAuditTab=Ke;window.archiveCurrentAudit=Tt;window.showBillDetails=Lt;window.verifyStockAuditItem=_t;window.closeBillDetails=Je;window.openArchiveBatch=Ht;window.closeArchiveBatch=Ot;window.filterHistoryTable=Nt;window.filterArchivedTable=Pt;window.loadAuditContent=Xe;async function fe(t,e=null){const s=document.getElementById("dataTypeContentContainer");let a=e;a||(a=new Date().toLocaleDateString("en-CA"));const o=`${t}|daily_ledger|${a}`;if(i.allResults&&i.allResults[o]){Fe(t,i.allResults[o],a);return}s.innerHTML=`
        <div class="flex flex-col items-center justify-center p-12 h-96">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p class="text-slate-500 font-medium text-lg animate-pulse">Loading ${t} Ledger...</p>
        </div>
    `;try{const l=await Ft(t,a);i.allResults&&(i.allResults[o]=l),Fe(t,l,a)}catch(l){s.innerHTML=`
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm mx-auto max-w-2xl mt-8">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg leading-6 font-medium text-red-800">Error Loading Ledger</h3>
                        <div class="mt-2 text-red-700"><p>${l.message}</p></div>
                        <div class="mt-4">
                            <button onclick="renderDailyLedger('${t}', '${a}')" class="text-sm font-medium text-red-600 hover:text-red-500 underline">
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `}}async function Ft(t,e){const s=`${N}/api/${t}/daily_ledger?date=${e}`,a=localStorage.getItem("authToken"),o=await fetch(s,{headers:{Authorization:`Bearer ${a}`}});if(!o.ok)throw new Error(await o.text());return await o.json()}function Fe(t,e,s){const a=document.getElementById("dataTypeContentContainer"),{entries:o,openingBalance:l,closingBalance:n,adjustments:d}=e,r=Vt(o,l),u=d&&d.short?d.short:0,c=d&&d.extra?d.extra:0,m=r.closingBalance-u+c,p=new Date(s).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});let x="";u>0&&(x+=`
            <div class="flex justify-between items-center text-red-600 text-sm mt-1 px-2">
                <span>Less: Short Cash</span>
                <span class="font-bold">(${g(u)})</span>
            </div>
        `),c>0&&(x+=`
            <div class="flex justify-between items-center text-green-600 text-sm mt-1 px-2">
                <span>Add: Extra Cash</span>
                <span class="font-bold">+${g(c)}</span>
            </div>
        `);const h=`
        <div class="max-w-5xl mx-auto">
            <!-- Header & Controls -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div class="flex items-center gap-4">
                     <button onclick="changeLedgerDate('${t}', '${s}', -1)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div class="text-center">
                        <h2 class="text-xl font-bold text-slate-800">${t} Daily Ledger</h2>
                        <input type="date" value="${s}" onchange="renderDailyLedger('${t}', this.value)" 
                            class="mt-1 block w-full text-center border-none text-slate-500 focus:ring-0 text-sm font-semibold cursor-pointer hover:text-indigo-600 bg-transparent">
                    </div>
                     <button onclick="changeLedgerDate('${t}', '${s}', 1)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>

                <div class="flex gap-2">
                     <button onclick="showAdjustmentModal('${t}', '${s}', ${u}, ${c})" class="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors border border-indigo-200 shadow-sm">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Adjust Cash</span>
                    </button>
                    <div class="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                        <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">Reviewing</span>
                        <span class="block font-semibold text-slate-700">${p}</span>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <!-- Opening Balance -->
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <span class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Opening Balance</span>
                    <span class="text-2xl font-mono font-bold text-slate-700">${g(l)}</span>
                </div>

                <!-- Total Income -->
                <div class="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 flex flex-col justify-center items-center">
                    <span class="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Total Income</span>
                    <span class="text-2xl font-mono font-bold text-green-700">+${g(r.totalIncome)}</span>
                </div>

                <!-- Total Expenses -->
                <div class="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 flex flex-col justify-center items-center">
                    <span class="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Expenses</span>
                    <span class="text-2xl font-mono font-bold text-red-700">-${g(r.totalExpense)}</span>
                </div>

                <!-- Closing Balance -->
                <div class="bg-indigo-600 p-4 rounded-xl shadow-md flex flex-col justify-center items-center text-white relative overflow-hidden group">
                    <div class="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full transform group-hover:scale-150 transition-transform duration-500"></div>
                    <span class="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Net Cash in Box</span>
                    <span class="text-3xl font-mono font-bold">${g(m)}</span>
                     ${x}
                </div>
            </div>

            <!-- Ledger Entries Table -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th class="px-6 py-4 text-left w-24">Category</th>
                                <th class="px-6 py-4 text-left">Description</th>
                                <th class="px-6 py-4 text-right w-32">Debit (Out)</th>
                                <th class="px-6 py-4 text-right w-32">Credit (In)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${r.rowsHtml}
                        </tbody>
                        <tfoot class="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                            <tr>
                                <td colspan="2" class="px-6 py-4 text-right uppercase tracking-wider text-xs">Daily Totals</td>
                                <td class="px-6 py-4 text-right text-red-600">${g(r.totalExpense)}</td>
                                <td class="px-6 py-4 text-right text-green-600">${g(r.totalIncome)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

             <!-- Render Recent History (Last 30 Days) -->
             <div class="mt-8">
                 <h3 class="text-lg font-bold text-slate-800 mb-4 px-2">Last 30 Days Overview</h3>
                 <div id="ledgerHistoryContainer" class="bg-slate-50 rounded-xl p-4 text-center text-slate-500 text-sm animate-pulse">
                    Loading history...
                 </div>
             </div>
        </div>
    `;a.innerHTML=h,Gt(t,s)}function Vt(t,e){let s=0,a=0,o="";t.length===0?o='<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">No transactions recorded for this day.</td></tr>':t.forEach(n=>{const d=n.amount||0,r=n.type==="credit",u=n.type==="debit";r&&(s+=d),u&&(a+=d);const c=u?"text-red-700 font-medium":"text-slate-300",m=r?"text-green-700 font-medium":"text-slate-300",p=se(n.status)?"bg-slate-50 opacity-50 decoration-slice line-through":"hover:bg-slate-50 transition-colors";o+=`
                <tr class="${p}">
                    <td class="px-6 py-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}">
                            ${n.category||"General"}
                        </span>
                    </td>
                    <td class="px-6 py-3 text-slate-600">
                        ${n.description||"-"}
                        ${n.billNo?`<span class="ml-2 text-xs font-mono text-slate-400">#${n.billNo}</span>`:""}
                    </td>
                    <td class="px-6 py-3 text-right font-mono ${c}">
                        ${u?g(d):"-"}
                    </td>
                    <td class="px-6 py-3 text-right font-mono ${m}">
                        ${r?g(d):"-"}
                    </td>
                </tr>
            `});const l=e+s-a;return{totalIncome:s,totalExpense:a,closingBalance:l,rowsHtml:o}}function qt(t,e,s){const a=new Date(e);a.setDate(a.getDate()+s);const o=a.toLocaleDateString("en-CA");fe(t,o)}function zt(t,e,s,a){let o=document.getElementById("adjustmentModal");o||(o=document.createElement("div"),o.id="adjustmentModal",o.className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 backdrop-blur-sm hidden",document.body.appendChild(o)),o.innerHTML=`
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 p-6">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Adjust Cash Balance</h3>
            <p class="text-sm text-slate-500 mb-6">Date: <span class="font-semibold text-slate-700">${e}</span></p>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Short Cash (Money Missing)</label>
                    <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">AED</span>
                        </div>
                        <input type="number" id="adjShortInput" value="${s||""}" class="focus:ring-red-500 focus:border-red-500 block w-full pl-12 pr-4 sm:text-sm border-gray-300 rounded-md py-2" placeholder="0.00">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Extra Cash (Money Found)</label>
                    <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">AED</span>
                        </div>
                        <input type="number" id="adjExtraInput" value="${a||""}" class="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-4 sm:text-sm border-gray-300 rounded-md py-2" placeholder="0.00">
                    </div>
                </div>
            </div>

            <div class="mt-8 flex justify-end gap-3">
                 <button onclick="closeAdjustmentModal()" class="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
                 <button onclick="adjustDailyCash('${t}', '${e}')" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-all transform active:scale-95">Save Adjustments</button>
            </div>
        </div>
    `,o.classList.remove("hidden")}function Qe(){const t=document.getElementById("adjustmentModal");t&&t.classList.add("hidden")}async function Ut(t,e){const s=parseFloat(document.getElementById("adjShortInput").value)||0,a=parseFloat(document.getElementById("adjExtraInput").value)||0;try{const o=`${N}/api/${t}/ledger/adjustment`,l=localStorage.getItem("authToken"),n=a-s,d=`Adj: ${a>0?"Extra "+a:""} ${s>0?"Short "+s:""}`.trim(),r=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${l}`},body:JSON.stringify({date:e,amount:n,note:d})});if(!r.ok)throw new Error(await r.text());i.allResults&&delete i.allResults[`${t}|daily_ledger|${e}`],Qe(),fe(t,e),alert("Adjustments Saved Successfully!")}catch(o){alert("Failed to save adjustments: "+o.message)}}async function Gt(t,e){const s=document.getElementById("ledgerHistoryContainer");if(s)try{const a=`${N}/api/${t}/ledger/history?date=${e}`,o=localStorage.getItem("authToken"),l=await fetch(a,{headers:{Authorization:`Bearer ${o}`}});if(!l.ok)throw new Error("Failed");const n=await l.json();if(n.length===0){s.innerHTML="No history available.";return}let d=`
            <div class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                         <tr>
                            <th class="px-4 py-2">Date</th>
                            <th class="px-4 py-2 text-right">Income</th>
                            <th class="px-4 py-2 text-right">Expense</th>
                            <th class="px-4 py-2 text-right">Adjust</th>
                            <th class="px-4 py-2 text-right">Closing</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
        `;n.forEach(r=>{const u=(r.extra||0)-(r.short||0),c=u>0?"text-green-600":u<0?"text-red-600":"text-slate-300",m=new Date(r.date),p=m.toLocaleDateString()===new Date().toLocaleDateString();d+=`
                <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick="renderDailyLedger('${t}', '${r.date}')">
                    <td class="px-4 py-2 font-medium ${p?"text-indigo-600":"text-slate-600"}">
                        ${m.toLocaleDateString()}
                    </td>
                    <td class="px-4 py-2 text-right text-green-700">${g(r.income)}</td>
                    <td class="px-4 py-2 text-right text-red-700">${g(r.expense)}</td>
                    <td class="px-4 py-2 text-right font-bold ${c}">${u!==0?g(u):"-"}</td>
                    <td class="px-4 py-2 text-right font-bold text-slate-800">${g(r.closing)}</td>
                </tr>
            `}),d+="</tbody></table></div>",s.innerHTML=d,s.classList.remove("animate-pulse")}catch{s.innerHTML='<span class="text-red-400">Failed to load history.</span>'}}window.renderDailyLedger=fe;window.changeLedgerDate=qt;window.showAdjustmentModal=zt;window.closeAdjustmentModal=Qe;window.adjustDailyCash=Ut;let le="",ce="";async function Yt(t){if(!t)return;if(!le&&_.length>0&&(le=_[0]),!ce&&typeof W<"u"){const o=new Date().toISOString().split("T")[0],l=W.find(n=>o>=n.start&&o<=n.end);ce=l?l.id:W[0].id}const e=_.map(o=>`<option value="${o}" ${o===le?"selected":""}>${o}</option>`).join(""),a=[...W].sort((o,l)=>l.start.localeCompare(o.start)).map(o=>`<option value="${o.id}" ${o.id===ce?"selected":""}>${o.label}</option>`).join("");t.innerHTML=`
        <div class="space-y-8 animate-fade-in-up">
            <!-- Hero Header with Controls -->
            <div class="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 text-white">
                <!-- Background Pattern -->
                <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <div class="relative z-10 flex flex-wrap justify-between items-end gap-6">
                    <div>
                        <h2 class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">Target & Growth</h2>
                        <p class="mt-2 text-slate-400 text-lg">Analyze performance by Business Year (Bakra Eid Cycles).</p>
                    </div>

                    <div class="flex flex-wrap gap-4">
                        <!-- Shop Selector -->
                        <div class="group">
                            <label class="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Select Shop</label>
                            <div class="relative">
                                <select id="compareShopSelect" onchange="updateCompareShop(this.value)" 
                                    class="appearance-none bg-slate-800/50 backdrop-blur border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-48 p-3 hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    ${e}
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Year Selector -->
                        <div class="group">
                            <label class="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Focus Business Year</label>
                            <div class="relative">
                                <select id="compareYearSelect" onchange="updateCompareCycle(this.value)" 
                                    class="appearance-none bg-slate-800/50 backdrop-blur border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-40 p-3 hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    ${a}
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Area (Loader / Table) -->
            <div id="compareContent" class="min-h-[400px]">
                <div class="flex justify-center items-center h-64">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            </div>
        </div>
    `,await ye(le)}window.updateCompareShop=async function(t){le=t,await ye(t)};window.updateCompareCycle=async function(t){ce=t,await ye(le)};async function ye(t){const e=document.getElementById("compareContent");if(e)try{const s=localStorage.getItem("authToken"),a=await fetch(`${N}/api/analytics/compare?shop=${t}`,{headers:{Authorization:`Bearer ${s}`}});if(!a.ok){const l=await a.json().catch(()=>({}));throw new Error(l.error||`Server Error ${a.status}`)}const o=await a.json();Wt(o,e,t,ce)}catch(s){console.error("Compare Data Error:",s),e.innerHTML=`
            <div class="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p class="font-medium">Error loading data: ${s.message}</p>
            </div>
        `}}function Wt(t,e,s,a){const o=t.actuals||{},l=t.targets||{},n=[...W].sort((f,E)=>f.start.localeCompare(E.start)),d=n.findIndex(f=>f.id===a),r=Math.max(0,d-2),u=n.slice(r,d+1),c=(f,E)=>{const y=E.getFullYear(),S=E.getMonth();return f[y]&&f[y][S]!==void 0?f[y][S]:0},m=u.map(f=>({id:f.id,label:f.label,startDate:new Date(f.start),isFocus:f.id===a})),p=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],x=[];for(let f=0;f<12;f++){const E={index:f,cells:[]};m.forEach(y=>{const S=new Date(y.startDate);S.setMonth(S.getMonth()+f);const P=`${p[S.getMonth()]} ${S.getFullYear()}`,L=c(o,S),j=c(l,S);E.cells.push({cycleId:y.id,actual:L,target:j,date:S,monthLabel:P})}),x.push(E)}const h={};m.forEach(f=>h[f.id]={actual:0,target:0});let k="";m.forEach(f=>{const E=f.isFocus?"px-6 py-4 text-right text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 border-b-2 border-teal-200":"px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100";k+=`<th scope="col" class="${E}">${f.label}</th>`});let $="";x.forEach(f=>{let E="";const y=f.cells.find(w=>w.cycleId===a);f.cells.forEach(w=>{h[w.cycleId].actual+=w.actual,w.cycleId===a&&(h[w.cycleId].target+=w.target||0);const ae=w.cycleId===a?"bg-teal-50/30 font-bold text-slate-800 ring-1 ring-teal-500/10":"text-slate-500",ee=w.actual===0?'<span class="text-slate-300 font-light">–</span>':g(w.actual);E+=`
                <td class="px-6 py-4 whitespace-nowrap text-sm ${ae} text-right transition-all duration-200 group relative">
                    ${ee}
                    <div class="absolute bottom-1 right-2 text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none">${w.monthLabel}</div>
                </td>`});let S=y&&y.target||0,P=!1;if(S===0&&m.length>1){const w=m.findIndex(V=>V.id===a)-1;w>=0&&(S=f.cells[w].actual,P=!0)}const L=y?y.actual:0;let j=0;S>0&&(j=L/S*100);let T="bg-slate-500";j>=100?T="bg-emerald-500":j>=80?T="bg-amber-400":j>0&&(T="bg-rose-500");const M=Math.min(j,100),oe=y?y.date:new Date,F=oe.getFullYear(),G=oe.getMonth(),v=y&&y.target?y.target:"",C=y?y.monthLabel.split(" ")[0]:`Period ${f.index+1}`;$+=`
            <tr class="hover:bg-slate-50/80 transition-all duration-200 group border-b border-slate-50 last:border-0">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">
                    ${C}
                </td>
                ${E}
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-right relative">
                     <input 
                        type="number" 
                        value="${v}"
                        placeholder="${P?g(S).replace("AED ",""):"Set"}"
                        onchange="saveTarget('${s}', ${F}, ${G}, this.value)"
                        class="block w-32 ml-auto text-right px-3 py-1.5 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-slate-900 font-medium text-sm transition-all shadow-sm group-hover:shadow-md ${P?"placeholder-slate-300":"bg-white"}"
                    >
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3 w-40">
                        <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full ${T} rounded-full transition-all duration-500 ease-out" style="width: ${M}%"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-600 w-12 text-right">${j>0?j.toFixed(0)+"%":"–"}</span>
                    </div>
                </td>
            </tr>
        `});let R="";m.forEach(f=>{const y=f.isFocus?"text-teal-300 bg-slate-800":"text-slate-400";R+=`<td class="px-6 py-5 whitespace-nowrap text-base font-bold ${y} text-right">${g(h[f.id].actual)}</td>`});const b=h[a].actual,D=h[a].target;let B=0;D>0&&(B=b/D*100);let A="bg-slate-500";B>=100?A="bg-emerald-500":B>=80?A="bg-amber-400":A="bg-rose-500";const I=`
        <tr class="bg-slate-900 border-t-[10px] border-white shadow-2xl relative z-10 text-white">
            <td class="px-6 py-5 whitespace-nowrap text-sm font-black text-slate-100 uppercase tracking-widest pl-8">Total</td>
            ${R}
            <td class="px-6 py-5 whitespace-nowrap text-base font-black text-white text-right tracking-wide">${g(D)}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-3 w-40">
                    <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-600">
                        <div class="h-full ${A} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style="width: ${Math.min(B,100)}%"></div>
                    </div>
                    <span class="text-xs font-black text-white w-12 text-right text-shadow">${D>0?B.toFixed(1)+"%":"–"}</span>
                </div>
            </td>
        </tr>
    `,H=`
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full tabular-nums border-collapse">
                    <thead>
                        <tr class="bg-white border-b border-slate-100">
                            <th scope="col" class="px-6 py-4 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[120px]">Month</th>
                            ${k}
                            <th scope="col" class="px-6 py-4 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Target</th>
                            <th scope="col" class="px-6 py-4 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider w-40">Growth</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${$}
                        ${I}
                    </tbody>
                </table>
            </div>
            <div class="p-4 bg-slate-50 text-xs text-slate-400 text-center">
                * Comparing months based on Business Cycle alignment. Row labels show Gregorian month for the selected Focus Year.
            </div>
        </div>
    `;e.innerHTML=H}window.saveTarget=async function(t,e,s,a){const o=localStorage.getItem("authToken"),l=parseFloat(a);if(!isNaN(l))try{(await fetch(`${N}/api/targets`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({shop:t,year:e,month:s,amount:l})})).ok&&ye(t)}catch(n){console.error(n)}};let Z=[],re=[],ue={key:"totalAmount",dir:"desc"},J=1;const Se=20;function Ze(){console.log("Aggregating Customers V2...");const t=new Map,e=i.allResults;for(const[s,a]of Object.entries(e)){if(s.includes("|SUMMARY|")||!s.endsWith("|bookings"))continue;const o=s.split("|")[0];(a.filteredData||[]).forEach(n=>{if(!n.phone)return;const d=n.phone.replace(/\D/g,"");if(d.length<8)return;const r=d;t.has(r)||t.set(r,{phone:n.phone,cleanPhone:d,name:n.name||"Unknown",totalAmount:0,totalOrders:0,shops:new Set,lastOrderDate:null,countryCode:n.countryCode||""});const u=t.get(r);u.totalAmount+=n.amount||0,u.totalOrders+=1,u.shops.add(o);const c=new Date(n.date);(!u.lastOrderDate||c>u.lastOrderDate)&&(u.lastOrderDate=c)})}Z=Array.from(t.values()).map(s=>({...s,shopCount:s.shops.size,shopsArray:Array.from(s.shops).join(", ")})),et("totalAmount","desc"),re=[...Z],ve()}function et(t,e="desc"){ue={key:t,dir:e},Z=U(Z,t,e)}function Kt(t){const s=(ue.key===t?ue.dir:"desc")==="asc"?"desc":"asc";et(t,s);const a=document.getElementById("customerSearchInput")?.value||"";a?tt(a):(re=[...Z],J=1,ve())}function ve(){const t=document.getElementById("dataTypeContentContainer");if(!t)return;const e=re.length,s=Math.ceil(e/Se);J>s&&(J=s||1);const a=(J-1)*Se,o=Math.min(a+Se,e),l=re.slice(a,o),n=r=>ue.key!==r?'<span class="text-slate-300 ml-1">⇅</span>':ue.dir==="asc"?'<span class="text-teal-600 ml-1">▲</span>':'<span class="text-teal-600 ml-1">▼</span>';let d=`
        <div class="max-w-7xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Customer Directory</h2>
                    <p class="text-slate-500 text-sm mt-1">Total Unique Customers: <span class="font-bold text-teal-600">${Z.length}</span></p>
                </div>
                <div class="w-full md:w-96 relative">
                     <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input type="text" id="customerSearchInput" 
                        placeholder="Search name or phone..." 
                        onkeyup="filterCustomers(this.value)"
                        class="pl-10 w-full rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                    >
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200">
                        <thead class="bg-slate-50">
                            <tr>
                                <th onclick="handleCustomerSort('name')" class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Name ${n("name")}
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th onclick="handleCustomerSort('totalOrders')" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Orders ${n("totalOrders")}
                                </th>
                                <th onclick="handleCustomerSort('totalAmount')" class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Total Spent ${n("totalAmount")}
                                </th>
                                <th onclick="handleCustomerSort('shopCount')" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Shops Visited ${n("shopCount")}
                                </th>
                                 <th onclick="handleCustomerSort('lastOrderDate')" class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Last Seen ${n("lastOrderDate")}
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 text-sm">
    `;l.length===0?d+='<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 italic">No customers found matching your search.</td></tr>':l.forEach(r=>{const u=r.lastOrderDate?r.lastOrderDate.toLocaleDateString():"-";let c=`<span class="font-medium text-slate-700">${r.name}</span>`;r.totalAmount>5e3&&(c+=' <span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-200 ml-1">VIP</span>'),d+=`
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">${c}</td>
                    <td class="px-6 py-4 font-mono text-slate-600">${r.countryCode} ${r.phone}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                            ${r.totalOrders}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-emerald-700">${g(r.totalAmount)}</td>
                    <td class="px-6 py-4 text-center">
                        <div class="tooltip" data-tip="${r.shopsArray}">
                             <span class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 cursor-help">
                                ${r.shopCount}
                            </span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-xs">${u}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="viewCustomerProfile('${r.cleanPhone}')" class="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-2 rounded-lg transition-colors" title="View Profile">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </td>
                </tr>
            `}),d+="</tbody></table></div>",s>1&&(d+=`
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button onclick="changeCustomerPage(-1)" ${J===1?"disabled":""} class="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                </button>
                <span class="text-sm text-slate-600">Page <span class="font-bold">${J}</span> of ${s}</span>
                <button onclick="changeCustomerPage(1)" ${J===s?"disabled":""} class="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                </button>
            </div>
        `),d+="</div></div>",t.innerHTML=d,document.getElementById("customerSearchInput")}function tt(t){if(!t)re=[...Z];else{const s=t.toLowerCase();re=Z.filter(a=>a.name.toLowerCase().includes(s)||a.phone.includes(t)||a.cleanPhone.includes(t))}J=1,ve();const e=document.getElementById("customerSearchInput");e&&(e.value=t,e.focus())}function Xt(t){J+=t,ve()}async function Jt(t){const e=Z.find(n=>n.cleanPhone===t);if(!e)return;const s=[];for(const[n,d]of Object.entries(i.allResults)){if(!n.endsWith("|bookings"))continue;const r=n.split("|")[0];(d.filteredData||[]).filter(c=>c.phone&&c.phone.replace(/\D/g,"")===t).forEach(c=>{s.push({...c,shop:r})})}s.sort((n,d)=>new Date(d.date)-new Date(n.date));const a=`
        <div class="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onclick="if(event.target === this) closeCustomerModal()">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="bg-slate-800 text-white p-6 flex justify-between items-start">
                    <div>
                        <h3 class="text-2xl font-bold">${e.name}</h3>
                        <p class="text-slate-400 font-mono mt-1 text-lg">${e.countryCode} ${e.phone}</p>
                        <div class="flex gap-2 mt-3">
                             <span class="bg-indigo-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Total Spent: ${g(e.totalAmount)}</span>
                             <span class="bg-slate-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Orders: ${s.length}</span>
                        </div>
                    </div>
                    <button onclick="closeCustomerModal()" class="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Order History</h4>
                    
                    <div class="space-y-3">
                        ${s.map(n=>`
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">${n.shop}</span>
                                        <span class="text-sm font-bold text-slate-800">Bill #${n.billNo}</span>
                                    </div>
                                    <p class="text-xs text-slate-500">${new Date(n.date).toLocaleDateString(void 0,{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-teal-700">${g(n.amount)}</p>
                                    <p class="text-xs text-slate-400">Qty: ${n.qty||"-"}</p>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        </div>
    `,o=document.getElementById("customerProfileModal");o&&o.remove();const l=document.createElement("div");l.id="customerProfileModal",l.innerHTML=a,document.body.appendChild(l)}function Qt(){const t=document.getElementById("customerProfileModal");t&&t.remove()}window.aggregateCustomers=Ze;window.handleCustomerSort=Kt;window.filterCustomers=tt;window.changeCustomerPage=Xt;window.viewCustomerProfile=Jt;window.closeCustomerModal=Qt;function we(t,e,s,a){if(e.filteredData.length===0)return'<p class="text-center text-gray-500 mt-4">No data found in the selected date range.</p>';const o=`${t}_${s}_detailed`;let l=[...e.filteredData];const n=i.sortState[o];n?l=U(l,n.key,n.dir):l=U(l,"date","desc");const d=i.searchState[o]||"";if(d){const A=d.toLowerCase();l=l.filter(I=>Object.values(I).some(H=>H&&H.toString().toLowerCase().includes(A)))}const r=50,u=l.length,c=Math.ceil(u/r),m=i.pageState[o]||1,p=(m-1)*r,x=l.slice(p,p+r),h={billNo:"Bill No",name:"Customer/Ref",date:"Date",amountType:"Type",status:"Status",amount:"Amount",cat:"Category",dept:"Department"};let k=new Set(Object.keys(h));l.slice(0,100).forEach(A=>Object.keys(A).forEach(I=>k.add(I)));const $=Array.from(k).filter(A=>!["_id","__v","createdAt","updatedAt","countryCode","phone","qty","modelName"].includes(A)),R=$.map(A=>{const I=h[A]||A.charAt(0).toUpperCase()+A.slice(1);return`<th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('${A}', '${o}')">
            ${I} ${O(A,o)}
        </th>`}).join(""),b=x.map(A=>{const I=a&&se(A.status),H=I?-(A.amount||0):A.amount||0,f=I?"text-red-700-bold":"text-green-700-bold",E=$.map(y=>{let S=A[y];if(y==="date"&&S)S=new Date(S).toLocaleDateString();else{if(y==="amount")return`<td class="px-6 py-4 ${f}">${g(H)}</td>`;y==="status"&&(S=`<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${I?"bg-red-200 text-red-800":"bg-green-200 text-green-800"}">${S||"N/A"}</span>`)}return`<td class="px-6 py-4">${S||"-"}</td>`}).join("");return`<tr class="bg-white border-b hover:bg-gray-50 transition-colors ${I?"bg-red-50":""}">${E}</tr>`}).join(""),D=c>1?`
        <div class="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
            <div class="text-xs text-slate-500 font-medium">
                Showing <span class="font-bold text-slate-700 dark:text-slate-300">${p+1}</span> to <span class="font-bold text-slate-700 dark:text-slate-300">${Math.min(p+r,u)}</span> of <span class="font-bold text-slate-700 dark:text-slate-300">${u}</span>
            </div>
            <div class="flex space-x-2">
                <button onclick="handlePageChange('${o}', ${m-1})" ${m===1?"disabled":""} 
                        class="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    Prev
                </button>
                <div class="flex items-center px-2 text-xs font-bold text-slate-600">
                    Page ${m} / ${c}
                </div>
                <button onclick="handlePageChange('${o}', ${m+1})" ${m===c?"disabled":""}
                        class="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    Next
                </button>
            </div>
        </div>
    `:"";return`
        ${`
        <div class="mb-3 relative max-w-md">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
            </div>
            <input 
                type="text" 
                placeholder="Search bill number, name, amount..." 
                class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                value="${d.replace(/"/g,"&quot;")}"
                oninput="handleTableSearch('${o}', this.value)"
            />
        </div>
    `}
        <div class="overflow-hidden border rounded-xl shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700">
            <div id="${o}" class="overflow-x-auto custom-scroll max-h-[600px]">
                <table class="w-full text-sm text-left text-gray-500 data-table">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700/50 dark:text-slate-300 sticky top-0 z-10">
                        <tr>
                            ${R}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                        ${b}
                    </tbody>
                </table>
            </div>
            ${D}
        </div>
    `}function Zt(t,e){i.pageState[t]=e,typeof window.renderContent=="function"&&window.renderContent(i.activeShop,i.activeDataType)}function es(t,e,s){if(t.length===0)return`<p class="text-center text-gray-500 mt-4">No daily ${e.toLowerCase()} trend data found in the selected date range.</p>`;let a=`
        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('dateStr', '${s}')">Date ${O("dateStr",s)}</th>
        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('gross', '${s}')">Gross Bookings ${O("gross",s)}</th>
        <th scope="col" class="px-6 py-3 text-right text-red-700-bold sortable-header" onclick="handleSort('canceled', '${s}')">Canceled/Deducted ${O("canceled",s)}</th>
        <th scope="col" class="px-6 py-3 text-right bg-green-100/50 text-green-700-bold sortable-header" onclick="handleSort('net', '${s}')">Net Booking Total ${O("net",s)}</th>
        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('count', '${s}')">Count ${O("count",s)}</th>
    `,o="";return t.forEach(l=>{let n=l.gross||0,d=l.canceled||0,r=l.net||0,u=r>=0?"text-green-700-bold":"text-red-700-bold",c=n>=0?"text-teal-700":"text-red-700-bold";o+=`<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${l.dateStr}</td>
            <td class="px-6 py-3 text-right ${c}">${g(n)}</td>
            <td class="px-6 py-3 text-right text-red-700-bold">${g(d)}</td>
            <td class="px-6 py-3 text-right ${u} bg-green-100/50">${g(r)}</td>
            <td class="px-6 py-3 text-right text-gray-700">${l.count}</td>
        </tr>`}),`
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        ${a}
                    </tr>
                </thead>
                <tbody>
                    ${o}
                </tbody>
            </table>
        </div>
    `}function st(t,e,s,a){if(t.length===0)return`<p class="text-center text-gray-500 mt-4">No daily ${s.toLowerCase()} trend data found in the selected date range.</p>`;const o=s==="Expenses";let l=`<th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('dateStr', '${a}')">Date ${O("dateStr",a)}</th>`;const n=o?"Total Expense":"Grand Total",d=o?"bg-red-100/50":"bg-teal-100/50",r="total";o&&(l+=`<th scope="col" class="px-6 py-3 text-right font-bold ${d} sortable-header" onclick="handleSort('${r}', '${a}')">${n} ${O(r,a)}</th>`),e.forEach(c=>{l+=`<th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('breakdown.${c}', '${a}')">${c.charAt(0).toUpperCase()+c.slice(1)} ${O(`breakdown.${c}`,a)}</th>`}),o||(l+=`<th scope="col" class="px-6 py-3 text-right font-bold ${d} sortable-header" onclick="handleSort('${r}', '${a}')">${n} ${O(r,a)}</th>`),l+=`<th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('count', '${a}')">Count ${O("count",a)}</th>`;let u="";return t.forEach(c=>{const m=c;let p=`<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${m.dateStr}</td>`,x=m.total||0;o&&(x=-x);const h=x>=0?"text-green-700-bold":"text-red-700-bold";o&&(p+=`<td class="px-6 py-3 text-right font-extrabold ${h} ${d}">${g(x)}</td>`),e.forEach(k=>{let $=m.breakdown[k]||0;const R=o?-$:$,b=R>=0?"text-green-700-bold":"text-red-700-bold";p+=`<td class="px-6 py-3 text-right ${b}">${g(R)}</td>`}),o||(p+=`<td class="px-6 py-3 text-right font-extrabold ${h} ${d}">${g(x)}</td>`),p+=`<td class="px-6 py-3 text-right text-gray-700">${m.count}</td></tr>`,u+=p}),`
        <div id="${a}" class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        ${l}
                    </tr>
                </thead>
                <tbody>
                    ${u}
                </tbody>
            </table>
        </div>
    `}typeof window.chartInstances>"u"&&(window.chartInstances={});function K(t,e){const s=document.getElementById("dataTypeContentContainer"),a=document.getElementById("statusMessage"),o=document.getElementById("dataTypeTabsContainer");if(!s)return;const l=t==="OVERVIEW"||t==="COMPARE"||t==="CUSTOMERS",n=i.allResults["GLOBAL|LOADED"],d=i.allResults[`${t}|FULL_LOADED`];if((l&&n||!l&&d)&&!(e==="daily_ledger"||e==="stock_audit")){a&&a.classList.add("hidden"),Ve(t,e,s,a,o);return}s.innerHTML="";const c=document.getElementById("skeletonLoader"),m=document.getElementById("skeletonDashboard"),p=document.getElementById("skeletonTable");c&&(c.classList.remove("hidden"),m&&m.classList.add("hidden"),p&&p.classList.add("hidden"),e==="dashboard"||l?m&&m.classList.remove("hidden"):p&&p.classList.remove("hidden")),a&&a.classList.add("hidden"),setTimeout(()=>{c&&c.classList.add("hidden"),Ve(t,e,s,a,o)},10)}function Ve(t,e,s,a,o){if(t==="OVERVIEW"){if(o&&o.classList.add("hidden"),Object.keys(i.allResults).length===0){a&&(a.textContent="Welcome to the Global Overview. Please select a date range and click 'Fetch Data'.",a.classList.remove("hidden"));return}ss(s);return}if(t==="COMPARE"){o&&o.classList.add("hidden"),Yt(s);return}if(t==="CUSTOMERS"){o&&o.classList.add("hidden"),Ze();return}o&&o.classList.remove("hidden");const l=`${t}|${e}`,n=e==="monthly_summary";if(n){const r=`${t}|bookings`,u=`${t}|delivery`,c=`${t}|expense`;if(!i.allResults[r]||!i.allResults[u]||!i.allResults[c]){a&&(a.textContent="Error: Core data (Bookings, Deliveries, or Expenses) needed for the Monthly Summary is missing. Please click 'Fetch All Shop Data'.",a.classList.remove("hidden"));return}if(i.allResults[r].isError||i.allResults[u].isError||i.allResults[c].isError){s.innerHTML=`
                <div class="p-6 bg-red-100 text-red-800 rounded-xl shadow-lg border border-red-300">
                    <p class="font-bold">Error: Monthly Summary cannot be calculated due to API errors in core data types:</p>
                    <ul class="list-disc ml-5 mt-2 text-sm">
                        ${i.allResults[r].isError?`<li>Bookings: ${i.allResults[r].errorMessage}</li>`:""}
                        ${i.allResults[u].isError?`<li>Deliveries: ${i.allResults[u].errorMessage}</li>`:""}
                        ${i.allResults[c].isError?`<li>Expenses: ${i.allResults[c].errorMessage}</li>`:""}
                    </ul>
                    <p class="mt-3 text-sm font-semibold">Action: Check the backend server for these specific routes.</p>
                </div>`;return}}const d=i.allResults[l];e==="dashboard"?ts(t,s):e==="bookings"?as(t,d,s):e==="delivery"?ns(t,d,s):e==="expense"?ls(t,d,s):e==="employee"?rs(t,s):n?Ye(t):e==="stock_audit"?We(t):e==="daily_ledger"?fe(t):we(t,d,e)}function ts(t,e){const s=i.allResults[`${t}|bookings`],a=i.allResults[`${t}|expense`],o=i.allResults[`${t}|delivery`];let l=0,n=0,d=0;s&&s.filteredData&&(n=s.filteredData.reduce((E,y)=>E+(y.amount||0),0),d=Ae(s.filteredData),l=n-d);let r=0;a&&a.filteredData&&(r=a.filteredData.reduce((E,y)=>E+(y.amount||0),0));let u=0,c=0,m=0,p={CASH:0,ADIB:0,ATM:0};o&&o.filteredData&&(u=o.filteredData.reduce((E,y)=>{const S=y.amount||0,P=(y.billNo||"").toLowerCase().trim();P&&P!=="other-amounts"?c+=S:m+=S;let L=y.amountType?y.amountType.toUpperCase().trim():"CASH";return(L.includes("CARD")||L.includes("VISA")||L.includes("MASTER"))&&(L="ADIB"),L!=="ADIB"&&L!=="ATM"&&(L="CASH"),p.hasOwnProperty(L)?p[L]+=S:p.CASH+=S,E+S},0));const x=i.allResults[`${t}|accrual_delivery`],h=x&&x.totalAccrualAmount||0,k=h-r,$=l-h,R=c-h,b=u-r,D=l>0?$/l*100:0,B=new Map;s&&s.filteredData&&s.filteredData.forEach(E=>{const y=new Date(E.date).toLocaleDateString("en-CA"),S=E.amount||0,P=se(E.status)?-S:S;B.set(y,(B.get(y)||0)+P)});const A=Array.from(B.keys()).sort(),I=A.map(E=>B.get(E));e.innerHTML=`
        <div class="space-y-6">
            <!-- Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- 1. Gross -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase">Gross Booking</h3>
                    <p class="text-xl font-bold text-slate-700 mt-1">${g(n)}</p>
                </div>
                <!-- 2. Cancel -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase">Cancelled</h3>
                    <p class="text-xl font-bold text-red-600 mt-1">${g(d)}</p>
                </div>
                <!-- 3. Net -->
                <div class="bg-indigo-50 p-4 rounded-xl shadow border border-indigo-100">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase">Net Booking</h3>
                    <p class="text-xl font-bold text-indigo-900 mt-1">${g(l)}</p>
                </div>
                <!-- 4. Deliveries (Accrual) -->
                <div class="bg-blue-50 p-4 rounded-xl shadow border border-blue-100">
                    <h3 class="text-xs font-semibold text-blue-800 uppercase tracking-tighter">Del (Accrual)</h3>
                    <p class="text-xl font-bold text-blue-900 mt-1">${g(h)}</p>
                </div>
                <!-- 5. Expenses -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase">Expenses</h3>
                    <p class="text-xl font-bold text-red-600 mt-1">${g(r)}</p>
                </div>
                
                <!-- 6. Profit -->
                <div class="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
                    <h3 class="text-xs font-semibold text-emerald-800 uppercase">Est. Profit</h3>
                    <p class="text-xs text-emerald-600 mb-1">(Accrual Del - Exp)</p>
                    <p class="text-xl font-bold text-emerald-900">${g(k)}</p>
                </div>
                <!-- 7. Old Collection -->
                <div class="bg-cyan-50 p-4 rounded-xl shadow-sm border border-cyan-100">
                    <h3 class="text-xs font-semibold text-cyan-800 uppercase">Old Booking Coll.</h3>
                    <p class="text-xs text-cyan-600 mb-1">(Booking Del - Accrual)</p>
                    <p class="text-xl font-bold text-cyan-900">${g(R)}</p>
                </div>
                <!-- 8. Misc Collections -->
                <div class="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase">Misc Collections</h3>
                    <p class="text-xs text-amber-600 mb-1">(Rent, Advance, etc.)</p>
                    <p class="text-xl font-bold text-amber-900">${g(m)}</p>
                </div>
                <!-- 9. Total Balance -->
                <div class="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase">Total Balance</h3>
                    <p class="text-xs text-indigo-600 mb-1">(Total Del - Exp)</p>
                    <p class="text-xl font-bold text-indigo-900">${g(b)}</p>
                </div>
                <!-- 10. Stock Available -->
                <div class="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100">
                    <h3 class="text-xs font-semibold text-teal-800 uppercase">Stock Available</h3>
                    <p class="text-xs text-teal-600 mb-1">(Net - Accrual Del)</p>
                    <p class="text-xl font-bold text-teal-900">${g($)}</p>
                </div>
                <!-- 10. Stock Percentage -->
                <div class="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100">
                    <h3 class="text-xs font-semibold text-purple-800 uppercase">Stock %</h3>
                    <p class="text-xs text-purple-600 mb-1">(Uncollected %)</p>
                    <p class="text-xl font-bold text-purple-700">${D.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Charts Area -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Daily Trend -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h4 class="font-bold text-slate-700 mb-2 text-sm">Daily Net Booking Trend</h4>
                    <div class="h-60 relative w-full">
                        <canvas id="shopTrendChart"></canvas>
                    </div>
                </div>
                    <!-- Payment Methods -->
                    <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-2 text-sm">Delivery Payment Methods</h4>
                        <div class="flex flex-col md:flex-row items-center h-60 w-full">
                        <div class="relative w-full md:w-1/2 h-full flex justify-center">
                            <canvas id="shopPaymentChart"></canvas>
                        </div>
                        <div class="w-full md:w-1/2 p-4">
                            ${ot(p,u)}
                        </div>
                        </div>
                    </div>
            </div>

            <!-- Monthly Summary Reuse -->
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 class="font-bold text-slate-800 text-sm">Monthly Summary Quick View</h3>
                        <button onclick="downloadMonthlyExcel('${t}')" class="text-xs flex items-center bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel Report
                    </button>
                </div>
                <div id="dashboardMonthlyContainer" class="p-4">
                        <button onclick="setActiveDataType('monthly_summary')" class="text-teal-600 hover:text-teal-800 font-medium underline">View Full Monthly Breakdown</button>
                </div>
            </div>
        </div>
    `,window.chartInstances.shopTrend&&window.chartInstances.shopTrend.destroy(),window.chartInstances.shopPay&&window.chartInstances.shopPay.destroy();const H=document.getElementById("shopTrendChart").getContext("2d");window.chartInstances.shopTrend=new Chart(H,{type:"line",data:{labels:A,datasets:[{label:"Net Booking",data:I,borderColor:"#0d9488",backgroundColor:"rgba(13, 148, 136, 0.1)",fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}}}});const f=document.getElementById("shopPaymentChart").getContext("2d");window.chartInstances.shopPay=new Chart(f,{type:"doughnut",data:{labels:["Cash","Card/ADIB","ATM"],datasets:[{data:[p.CASH,p.ADIB,p.ATM],backgroundColor:["#10b981","#6366f1","#f59e0b"],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}}}})}function ss(t){let e=0,s=0,a=0,o=0,l=0,n=0,d=0,r=0;const u=[];let c=[],m=[];const p={CASH:0,ADIB:0,ATM:0,OTHER:0};_.forEach(b=>{const D=F=>i.allResults[`${b}|${F}`]||i.allResults[`${b}|SUMMARY|${F}`],B=D("bookings"),A=B&&B.totalAmount||0;let I=0,H=0;B&&(B.netAmount!==void 0?(I=B.netAmount,H=B.cancelAmount||0):B.filteredData&&(I=B.filteredData.reduce((F,G)=>F+(se(G.status)?0:G.amount||0),0),H=Ae(B.filteredData))),e+=A,s+=H,a+=I;const f=D("delivery");let E=0,y=0,S=0;f&&(E=f.totalAmount||0,f.paymentMethods?(y=f.bookingDel||0,S=f.miscDel||0,p.CASH+=f.paymentMethods.CASH||0,p.ADIB+=f.paymentMethods.ADIB||0,p.ATM+=f.paymentMethods.ATM||0):f.filteredData&&f.filteredData.forEach(F=>{const G=F.amount||0,v=(F.billNo||"").toLowerCase().trim();v&&v!=="other-amounts"?y+=G:S+=G;let C=F.amountType?F.amountType.toUpperCase().trim():"CASH";(C.includes("CARD")||C.includes("VISA")||C.includes("MASTER")||C.includes("ADIB"))&&(C="ADIB"),C!=="ADIB"&&C!=="ATM"&&(C="CASH"),p[C]+=G})),r+=E,o+=y,l+=S;const P=D("accrual_delivery"),L=P&&P.totalAccrualAmount||0;n+=L;const j=D("expense"),T=j&&j.totalAmount||0;d+=T;const M=D("lifetime"),oe=M&&M.lifetimeStock||0;u.push({shop:b,net:I,gross:A,cancel:H,exp:T,del:E,accDel:L,totStock:oe}),c.push(b),m.push(I)}),u.sort((b,D)=>D.net-b.net);const x=n-d,h=a-n,k=o-n,$=r-d,R=a>0?h/a*100:0;t.innerHTML=`
        <div class="space-y-6">
            <!-- Grand Totals Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- 1. Gross -->
                    <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Gross Booking</h3>
                    <p class="text-xl font-extrabold text-indigo-900 mt-1">${g(e)}</p>
                </div>
                <!-- 2. Cancel -->
                <div class="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-sm border border-red-200">
                    <h3 class="text-xs font-semibold text-red-800 uppercase tracking-wider">Cancelled</h3>
                    <p class="text-xl font-extrabold text-red-900 mt-1">${g(s)}</p>
                </div>
                <!-- 3. Net -->
                <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Total Net Booking</h3>
                    <p class="text-xl font-extrabold text-indigo-900 mt-1">${g(a)}</p>
                </div>
                    <!-- 4. Deliveries Accrual -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                    <h3 class="text-xs font-semibold text-blue-800 uppercase tracking-wider">Del (Accrual)</h3>
                    <p class="text-xl font-extrabold text-blue-900 mt-1">${g(n)}</p>
                </div>
                    <!-- 5. Expenses -->
                <div class="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl shadow-sm border border-pink-200">
                    <h3 class="text-xs font-semibold text-pink-800 uppercase tracking-wider">Total Expenses</h3>
                    <p class="text-xl font-extrabold text-pink-900 mt-1">${g(d)}</p>
                </div>
                
                <!-- 6. Profit -->
                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl shadow-sm border border-emerald-200">
                    <h3 class="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Estimate Profit</h3>
                    <p class="text-xs text-emerald-600 mb-1">(Accrual Del - Exp)</p>
                    <p class="text-xl font-extrabold text-emerald-900">${g(x)}</p>
                </div>
                <!-- 7. Old Collection -->
                <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl shadow-sm border border-cyan-200">
                    <h3 class="text-xs font-semibold text-cyan-800 uppercase tracking-wider">Old Booking Coll.</h3>
                    <p class="text-xs text-cyan-600 mb-1">(Booking Del - Accrual)</p>
                    <p class="text-xl font-extrabold text-cyan-900">${g(k)}</p>
                </div>
                <!-- 8. Misc Collections -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm border border-amber-200">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Misc Collections</h3>
                    <p class="text-xs text-amber-600 mb-1">(Rent, Advance, etc.)</p>
                    <p class="text-xl font-extrabold text-amber-900">${g(l)}</p>
                </div>
                <!-- 9. Total Balance -->
                    <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Total Balance</h3>
                    <p class="text-xs text-indigo-600 mb-1">(Total Del - Exp)</p>
                    <p class="text-xl font-extrabold text-indigo-900">${g($)}</p>
                </div>
                    <!-- 10. Stock Accrual -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm border border-amber-200">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Stock Available</h3>
                    <p class="text-xs text-amber-600 mb-1">(Net - Accrual Del)</p>
                    <p class="text-xl font-extrabold text-amber-900">${g(h)}</p>
                </div>
                <!-- 11. Stock Percent -->
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm border border-purple-200">
                    <h3 class="text-xs font-semibold text-purple-800 uppercase tracking-wider">Stock %</h3>
                    <p class="text-xs text-purple-600 mb-1">(Uncollected %)</p>
                    <p class="text-xl font-extrabold text-purple-900">${R.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-2 text-sm">Shop Performance (Net Booking)</h4>
                        <div class="h-60 relative w-full">
                        <canvas id="shopPerformanceChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-2 text-sm">Delivery Payment Methods</h4>
                        <div class="flex flex-col md:flex-row items-center h-60 w-full">
                        <div class="relative w-full md:w-1/2 h-full flex justify-center">
                            <canvas id="paymentMethodsChart"></canvas>
                        </div>
                        <div class="w-full md:w-1/2 p-4">
                            ${ot(p,r)}
                        </div>
                        </div>
                    </div>
            </div>

            <!-- Leaderboard Table -->
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col max-h-[400px]">
                <div class="px-6 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <h3 class="font-bold text-slate-800 text-sm">Shop Leaderboard</h3>
                </div>
                <div class="overflow-y-auto custom-scroll">
                    <table class="w-full text-sm text-center relative">
                        <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th class="px-2 py-3 text-left bg-slate-50">Shop</th>
                                <th class="px-2 py-3 text-right bg-slate-50" title="Gross Booking">Gross</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-red-600" title="Cancelled/Deducted">Cancel</th>
                                <th class="px-2 py-3 text-right bg-slate-50 font-bold" title="Net Booking">Net</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-blue-600" title="Deliveries (Accrual)">Del(Acc)</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-red-600" title="Expenses">Exp</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-emerald-700" title="Est Profit (Acc. Del - Exp)">Profit</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-cyan-700" title="Total Del - Acc. Del">Old Coll.</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-indigo-700 font-bold" title="Total Balance (Total Del - Exp)">Tot. Bal</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-amber-700" title="Stock Avail (Net - Acc. Del)">Stock(Acc)</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-purple-700" title="Percentage of Net Booking Uncollected">Stock %</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${u.map(b=>{const D=b.accDel-b.exp,B=b.del-b.accDel,A=b.del-b.exp,I=b.net-b.accDel,H=b.net>0?I/b.net*100:0;return`
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-2 py-3 text-left font-medium text-slate-900 truncate max-w-[120px]" title="${b.shop}">${b.shop}</td>
                                        <td class="px-2 py-3 text-right text-slate-500">${g(b.gross)}</td>
                                        <td class="px-2 py-3 text-right text-red-500">${g(b.cancel)}</td>
                                        <td class="px-2 py-3 text-right font-semibold text-slate-700">${g(b.net)}</td>
                                        <td class="px-2 py-3 text-right text-blue-600 font-medium">${g(b.accDel)}</td>
                                        <td class="px-2 py-3 text-right text-red-600">${g(b.exp)}</td>
                                        <td class="px-2 py-3 text-right font-bold ${D>=0?"text-emerald-600":"text-red-500"}">${g(D)}</td>
                                        <td class="px-2 py-3 text-right font-medium text-cyan-600">${g(B)}</td>
                                        <td class="px-2 py-3 text-right font-bold text-indigo-700">${g(A)}</td>
                                        <td class="px-2 py-3 text-right font-bold ${I>=0?"text-amber-600":"text-red-500"}">${g(I)}</td>
                                        <td class="px-2 py-3 text-right font-bold ${H>0?"text-purple-600":"text-emerald-600"}">${H.toFixed(1)}%</td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `,os(c,m,p)}function os(t,e,s){window.chartInstances.perf&&window.chartInstances.perf.destroy(),window.chartInstances.pay&&window.chartInstances.pay.destroy();const a=document.getElementById("shopPerformanceChart").getContext("2d");window.chartInstances.perf=new Chart(a,{type:"bar",data:{labels:t.map(l=>l.substring(0,10)),datasets:[{label:"Net Booking (AED)",data:e,backgroundColor:"#0d9488",borderRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{beginAtZero:!0}}}});const o=document.getElementById("paymentMethodsChart").getContext("2d");window.chartInstances.pay=new Chart(o,{type:"doughnut",data:{labels:["Cash","Card/ADIB","ATM"],datasets:[{data:[s.CASH,s.ADIB,s.ATM],backgroundColor:["#10b981","#6366f1","#f59e0b"],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}}}})}function as(t,e,s){if(s||(s=document.getElementById("dataTypeContentContainer")),!s)return;const a=e.filteredData.reduce((p,x)=>p+(x.amount||0),0),o=Ae(e.filteredData),l=a-o,n=`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="stat-card bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-sm border border-teal-200/50 text-center relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-sm text-slate-600 font-medium mb-2">Gross Bookings</p>
                    <p class="text-3xl font-extrabold text-teal-700 tracking-tight">${g(a)}</p>
                </div>
                <div class="absolute inset-0 bg-teal-500/5 transform rotate-6 scale-150 translate-x-1/2 rounded-3xl transition-transform group-hover:scale-100"></div>
            </div>

            <div class="stat-card bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200/50 text-center relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-sm text-slate-600 font-medium mb-2">Cancel/Deducted</p>
                    <p class="text-3xl font-extrabold text-red-700 tracking-tight">${g(o)}</p>
                </div>
                <div class="absolute inset-0 bg-red-500/5 transform -rotate-6 scale-150 -translate-x-1/2 rounded-3xl transition-transform group-hover:scale-100"></div>
            </div>
            
            <div class="stat-card bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-sm border border-emerald-200/50 text-center relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-sm text-slate-600 font-medium mb-2">Net Total Booking</p>
                    <p class="text-3xl font-extrabold text-emerald-700 tracking-tight">${g(l)}</p>
                </div>
                <div class="absolute inset-0 bg-emerald-500/5 transform rotate-12 scale-150 translate-y-1/2 rounded-3xl transition-transform group-hover:scale-100"></div>
            </div>
        </div>
    `,d=e.filteredData.reduce((p,x)=>{const h=new Date(x.date).toISOString().split("T")[0],k=x.amount||0,$=se(x.status);return p[h]||(p[h]={dateStr:h,gross:0,canceled:0,net:0,count:0}),p[h].gross+=k,p[h].count+=1,$&&(p[h].canceled+=k),p},{});let r=Object.keys(d).map(p=>{const x=d[p];return x.net=x.gross-x.canceled,{dateStr:p,...x}});const u=`${t}_daily_bookings`,c=i.sortState[u];c?r=U(r,c.key,c.dir):r=U(r,"dateStr","asc");let m=`
        <div class="space-y-8">
            ${n}
            <div>
                <h3 class="text-xl font-bold mb-4">Daily Net Booking Trend (${i.dateRange.start} to ${i.dateRange.end})</h3>
                ${es(r,"Bookings",u)}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">All Booking Records (Gross & Canceled)</h3>
                ${we(t,e,"bookings",!0)}
            </div>
        </div>
    `;s.innerHTML=m}function ns(t,e,s){if(s||(s=document.getElementById("dataTypeContentContainer")),!s)return;if(e.filteredData.length===0){s.innerHTML='<p class="text-center text-gray-500 mt-8">No delivery data found in the selected date range.</p>';return}const a=`${t}_daily_delivery`,o=new Map,l=new Set;e.filteredData.forEach(p=>{const x=new Date(p.date).toISOString().split("T")[0];let h=p.amountType?p.amountType.toUpperCase().trim():"CASH";(h.includes("CARD")||h.includes("VISA")||h.includes("MASTER"))&&(h="ADIB"),h!=="ADIB"&&h!=="ATM"&&(h="CASH"),l.add(h);const k=p.amount||0;o.has(x)||o.set(x,{dateStr:x,total:0,count:0,breakdown:{}});const $=o.get(x);$.total+=k,$.count+=1,$.breakdown[h]=($.breakdown[h]||0)+k});const n=Array.from(l).sort();let d=Array.from(o.values());const r=i.sortState[a];r?d=U(d,r.key,r.dir):d=U(d,"dateStr","asc");const u=e.paymentMethods||{},c=e.totalAmount||0;let m=`
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="stat-card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p class="text-xs font-bold text-slate-500 uppercase mb-2">Total Delivery Volume</p>
                    <p class="text-3xl font-black text-indigo-600">${g(c)}</p>
                </div>
                ${Object.entries(u).map(([p,x])=>`
                    <div class="stat-card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2">${p} Collection</p>
                        <p class="text-2xl font-bold text-slate-700">${g(x)}</p>
                    </div>
                `).join("")}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">Daily Delivery Trend</h3>
                ${st(d,n,"Deliveries",a)}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">All Delivery Records</h3>
                ${we(t,e,"delivery",!1)}
            </div>
        </div>
    `;s.innerHTML=m}function ls(t,e,s){if(s||(s=document.getElementById("dataTypeContentContainer")),!s)return;if(e.filteredData.length===0){s.innerHTML='<p class="text-center text-gray-500 mt-8">No expense data found in the selected date range.</p>';return}const a=`${t}_daily_expense`,o=new Set,l=new Map;e.filteredData.forEach(p=>{const x=new Date(p.date).toISOString().split("T")[0],h=p.dept||"Uncategorized";o.add(h);const k=p.amount||0;l.has(x)||l.set(x,{dateStr:x,total:0,count:0,breakdown:{}});const $=l.get(x);$.total+=k,$.count+=1,$.breakdown[h]=($.breakdown[h]||0)+k});const n=Array.from(o).sort();let d=Array.from(l.values());const r=i.sortState[a];r?d=U(d,r.key,r.dir):d=U(d,"dateStr","asc");const u=e.categoryTotals||{},c=e.totalAmount||0;let m=`
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="stat-card bg-red-50 p-6 rounded-xl border border-red-100">
                    <p class="text-xs font-bold text-red-600 uppercase mb-2">Total Expense</p>
                    <p class="text-3xl font-black text-red-700">${g(c)}</p>
                </div>
                ${Object.entries(u).slice(0,3).map(([p,x])=>`
                    <div class="stat-card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2">${p}</p>
                        <p class="text-xl font-bold text-slate-700">${g(x)}</p>
                    </div>
                `).join("")}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">Daily Expense Trend (By Department)</h3>
                ${st(d,n,"Expenses",a)}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">All Expense Records</h3>
                ${we(t,e,"expense",!1)}
            </div>
        </div>
    `;s.innerHTML=m}function rs(t,e){const s=i.allResults[`${t}|employee`]||i.allResults[`${t}|employees`];if(e||(e=document.getElementById("dataTypeContentContainer")),!e)return;if(!s){e.innerHTML='<p class="text-center text-gray-500 mt-4 italic">No employee data loaded in cache.</p>';return}if(s.isError){e.innerHTML=`
            <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <p class="text-red-700 font-bold">Failed to load staff data</p>
                <p class="text-red-600 text-sm mt-1">${s.errorMessage||"Unknown API Error"}</p>
            </div>`;return}if(!s.employees||s.employees.length===0){e.innerHTML=`
            <div class="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p class="text-slate-500 font-medium whitespace-pre-wrap">No staff activity found in ${t}
Between ${i.dateRange.start} and ${i.dateRange.end}</p>
            </div>`;return}const a=s.employees,o=a.length;let l=0,n=0;const d=a.map(r=>{const u=r.total||0;return l+=u,(r.status||"active")==="active"&&n++,`
        <div class="employee-card bg-white rounded-xl shadow border border-slate-200 p-4 hover:shadow-md transition-shadow relative group cursor-pointer" 
             data-name="${r.name.toLowerCase()}"
             onclick="viewEmployeeHistory('${t}', '${r.name}')">
            <div class="flex items-center space-x-4">
               <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    ${r.name.charAt(0).toUpperCase()}
               </div>
               <div>
                   <h4 class="font-bold text-slate-800">${r.name}</h4>
                   <p class="text-xs text-slate-500">${r.designation||"Staff Member"}</p>
               </div>
            </div>
            <div class="mt-4 border-t border-slate-100 pt-3">
                 <div class="flex justify-between text-sm mb-1">
                    <span class="text-slate-500">Period Earnings</span>
                    <span class="font-semibold text-slate-700">${g(u)}</span>
                 </div>
                 <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Records</span>
                    <span class="font-semibold text-slate-700">${r.count||0} entries</span>
                 </div>
            </div>
        </div>
        `}).join("");e.innerHTML=`
        <div class="space-y-6">
            <!-- Summary Header -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                     <p class="text-xs text-indigo-600 uppercase font-semibold">Total Staff</p>
                     <p class="text-2xl font-bold text-indigo-900">${o}</p>
                 </div>
                 <div class="bg-green-50 p-4 rounded-xl border border-green-100">
                     <p class="text-xs text-green-600 uppercase font-semibold">Active Now</p>
                     <p class="text-2xl font-bold text-green-900">${n}</p>
                 </div>
                 <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <p class="text-xs text-slate-500 uppercase font-semibold">Total Payroll (Basic)</p>
                     <p class="text-2xl font-bold text-slate-700">${g(l)}</p>
                 </div>
            </div>

            <!-- Search Bar -->
            <div class="relative">
                 <input type="text" placeholder="Search employees..." 
                    class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    oninput="filterEmployeeGrid(this.value)">
                 <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="employeeGrid">
                ${d}
            </div>
        </div>
    `}async function ds(t,e){const{fetchEmployeeHistory:s}=await Ge(async()=>{const{fetchEmployeeHistory:o}=await Promise.resolve().then(()=>cs);return{fetchEmployeeHistory:o}},void 0);let a=document.getElementById("employeeHistoryModal");a||(a=document.createElement("div"),a.id="employeeHistoryModal",a.className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4",a.onclick=o=>{o.target===a&&a.classList.add("hidden")},document.body.appendChild(a)),a.classList.remove("hidden"),a.innerHTML=`
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div class="p-8 flex items-center justify-center">
                <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
        </div>
        `;try{const o=await s(t,e),l=o.reduce((n,d)=>n+(d.amount||0),0);a.innerHTML=`
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                <!-- Header -->
                <div class="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <div class="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xl">${e.charAt(0).toUpperCase()}</div>
                            <div>
                                <h3 class="text-2xl font-bold">${e}</h3>
                                <p class="text-indigo-100 text-sm">Staff Activity Log • ${t}</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('employeeHistoryModal').classList.add('hidden')" class="text-indigo-200 hover:text-white p-2 rounded-lg transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <!-- Stats Bar -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Total Earned</p>
                        <p class="text-lg font-black text-indigo-600">${g(l)}</p>
                    </div>
                    <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Entries</p>
                        <p class="text-lg font-black text-slate-700 dark:text-slate-200">${o.length}</p>
                    </div>
                </div>

                <!-- History Table Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
            ${o.length===0?'<p class="text-center text-slate-500 py-10">No records found for this period.</p>':`
                        <div class="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <table class="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                <thead class="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700/50 dark:text-slate-300">
                                    <tr>
                                        <th class="px-6 py-3">Date</th>
                                        <th class="px-6 py-3">Category</th>
                                        <th class="px-6 py-3">Reference/Note</th>
                                        <th class="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                                    ${o.map(n=>`
                                        <tr class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                                                ${new Date(n.date).toLocaleDateString()}
                                            </td>
                                            <td class="px-6 py-4">
                                                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                    ${n.cat||"General"}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                                                ${n.description||n.dept||"-"}
                                            </td>
                                            <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                ${g(n.amount)}
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                     `}
        </div>
            </div>
        `}catch(o){a.innerHTML=`
            <div class="bg-white p-8 rounded-2xl text-center">
                <p class="text-red-500 font-bold">Failed to load history</p>
                <p class="text-sm text-slate-500 mt-2">${o.message}</p>
                <button onclick="document.getElementById('employeeHistoryModal').classList.add('hidden')" class="mt-4 px-4 py-2 bg-slate-100 rounded-lg">Close</button>
            </div>
        `}}window.viewEmployeeHistory=ds;function ot(t,e){const s={CASH:"#10b981",ADIB:"#6366f1",ATM:"#f59e0b",OTHER:"#94a3b8"},a={CASH:"Cash",ADIB:"Card/ADIB",ATM:"ATM",OTHER:"Other"};let o='<div class="space-y-3">';for(const[l,n]of Object.entries(t))if(n>0||l==="CASH"){const d=e>0?(n/e*100).toFixed(1):"0.0";o+=`
        <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${s[l]}"></span>
                        <span class="text-slate-600 font-medium">${a[l]}</span>
                    </div>
                    <div class="flex items-center text-slate-700">
                        <span class="font-bold mr-2">${g(n)}</span>
                        <span class="text-xs text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">${d}%</span>
                    </div>
                </div>
        `}return o+="</div>",o}window.renderContent=K;function Me(t){const e=document.getElementById("errorLog");e&&(e.classList.remove("hidden"),e.innerHTML=`<p class="font-bold">API Error! One or more API requests failed.</p><p>Error: ${t}</p>`),console.error(t)}const me=()=>{localStorage.removeItem("authToken"),window.location.href="login.html"};async function at(t,e,s){const a=localStorage.getItem("authToken");if(!a){window.location.href="login.html";return}const o=e.toLowerCase();try{const l=await fetch(`${N}/api/${t}/${o}/create`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify(s)});if(!l.ok){const n=await l.json();throw new Error(n.error||"Failed to create entry")}return await l.json()}catch(l){throw console.error("Create Entry Error:",l),l}}async function Q(t,e,s,a){const o=`/api/${t}/${e}/summary?start=${s}&end=${a}`,l=N+o;try{const n=await fetch(l,{headers:{Authorization:`Bearer ${localStorage.getItem("authToken")}`}});if(n.status===401||n.status===403){me();return}if(!n.ok)throw new Error(`[${t}|${e}] Failed with status ${n.status}`);const d=await n.json();i.allResults[`${t}|${e}`]=d}catch(n){Me(`[${t}|${e}] ${n.message}`),i.allResults[`${t}|${e}`]={totalAmount:0,filteredData:[],isError:!0,errorMessage:n.message}}}async function nt(t,e){const s=`${N}/api/global/summary?start=${t}&end=${e}`;try{const a=await fetch(s,{headers:{Authorization:`Bearer ${localStorage.getItem("authToken")}`}});if(a.status===401||a.status===403){me();return}if(!a.ok){const l=await a.json();throw new Error(l.error||"Failed to fetch global summary")}const o=await a.json();Object.keys(o).forEach(l=>{const n=o[l];i.allResults[`${l}|SUMMARY|bookings`]=n.bookings,i.allResults[`${l}|SUMMARY|delivery`]=n.delivery,i.allResults[`${l}|SUMMARY|expense`]=n.expense,i.allResults[`${l}|SUMMARY|accrual_delivery`]=n.accrual_delivery,i.allResults[`${l}|SUMMARY|lifetime`]=n.lifetime}),i.allResults["GLOBAL|LOADED"]=!0}catch(a){console.error("Global Summary Error:",a);const o=a.message.includes("Failed to fetch")?"Global Summary Error: The server could not process the request. Some charts may be empty.":a.message;Me(o)}}async function ke(t){if(t==="OVERVIEW"||t==="COMPARE"||t==="CUSTOMERS")return;de(!0);const e=[Q(t,"bookings",i.dateRange.start,i.dateRange.end),Q(t,"delivery",i.dateRange.start,i.dateRange.end),Q(t,"expense",i.dateRange.start,i.dateRange.end),Q(t,"employee",i.dateRange.start,i.dateRange.end),Q(t,"accrual_delivery",i.dateRange.start,i.dateRange.end),Q(t,"lifetime",i.dateRange.start,i.dateRange.end)];await Promise.all(e),de(!1),i.allResults[`${t}|FULL_LOADED`]=!0,K(i.activeShop,i.activeDataType)}async function is(t,e){const s=`${N}/api/${t}/employee/history?name=${encodeURIComponent(e)}&start=${i.dateRange.start}&end=${i.dateRange.end}`,a=await fetch(s,{headers:{Authorization:`Bearer ${localStorage.getItem("authToken")}`}});if(!a.ok)throw new Error(await a.text());return await a.json()}async function ge(){i.dateRange.start=document.getElementById("startDate").value,i.dateRange.end=document.getElementById("endDate").value,localStorage.setItem("startDate",i.dateRange.start),localStorage.setItem("endDate",i.dateRange.end);const t=localStorage.getItem("selectedRangeType");["today","yesterday","thisMonth","lastMonth","thisYear","fiscal"].includes(t)||localStorage.setItem("selectedRangeType","custom"),i.allResults={},i.sortState={},i.searchState={},i.pageState={},document.getElementById("errorLog").classList.add("hidden"),de(!0);try{if(i.activeShop==="OVERVIEW"||i.activeShop==="COMPARE")await nt(i.dateRange.start,i.dateRange.end);else if(i.activeShop==="CUSTOMERS"){const{SHOP_PREFIXES:o}=await Ge(async()=>{const{SHOP_PREFIXES:n}=await Promise.resolve().then(()=>St);return{SHOP_PREFIXES:n}},void 0),l=o.map(n=>Q(n,"bookings",i.dateRange.start,i.dateRange.end));await Promise.all(l)}else await ke(i.activeShop);const s=new Date,a=document.getElementById("lastUpdated");a&&(a.textContent=s.toLocaleTimeString()),dt(),it(i.activeShop),K(i.activeShop,i.activeDataType)}catch(s){Me("Fetch Operation Failed: "+s.message)}finally{de(!1)}}const cs=Object.freeze(Object.defineProperty({__proto__:null,createEntry:at,fetchAllData:ge,fetchEmployeeHistory:is,fetchEndpoint:Q,fetchGlobalSummary:nt,fetchShopData:ke,logout:me},Symbol.toStringTag,{value:"Module"}));window.addEventListener("popstate",Ie);async function Ie(){const e=window.location.pathname.split("/").filter(Boolean);let s="OVERVIEW",a="dashboard";if(e.length===1){const o=e[0].toUpperCase();if(o==="GLOBALOVERVIEW"||o==="INDEX.HTML"||o==="DASHBOARD")s="OVERVIEW";else if(o==="TARGET-COMPARE"||o==="COMPARE")s="COMPARE";else if(o==="CUSTOMERS")s="CUSTOMERS";else{const l=_.find(n=>n.toUpperCase()===o);l&&(s=l)}}else if(e.length>=2){const o=e[0].toUpperCase(),l=_.find(n=>n.toUpperCase()===o);l&&(s=l,a=e[1].toLowerCase(),a==="employees"&&(a="employee"))}i.activeShop!==s&&(i.activeShop=s),i.activeDataType!==a&&(i.activeDataType=a),await us()}async function us(){dt(),it(i.activeShop),i.activeShop==="OVERVIEW"||i.activeShop==="COMPARE"||i.activeShop==="CUSTOMERS"?i.allResults["GLOBAL|LOADED"]||await ge():i.allResults[`${i.activeShop}|FULL_LOADED`]||await ke(i.activeShop),K(i.activeShop,i.activeDataType)}function be(t,e="dashboard"){let s="/";t==="OVERVIEW"?s="/globaloverview":t==="COMPARE"?s="/target-compare":t==="CUSTOMERS"?s="/customers":(s=`/${t.toLowerCase()}`,e!=="dashboard"&&(s+=`/${e}`)),window.location.pathname!==s&&(window.history.pushState({},"",s),Ie())}function de(t){const e=document.getElementById("loadingIndicator"),s=document.getElementById("fetchButton"),a=document.getElementById("statusMessage");e&&e.classList.toggle("hidden",!t),s&&(s.disabled=t),a&&a.classList.toggle("hidden",t)}function lt(){const t=document.getElementById("sidebar"),e=document.getElementById("sidebarOverlay");t.classList.contains("-translate-x-full")?(t.classList.remove("-translate-x-full"),e.classList.remove("hidden")):(t.classList.add("-translate-x-full"),e.classList.add("hidden"))}function ps(){localStorage.getItem("darkMode")==="true"&&(document.body.classList.add("dark"),rt(!0))}function ms(){const t=document.body.classList.toggle("dark");localStorage.setItem("darkMode",t),rt(t)}function rt(t){const e=document.getElementById("darkModeIcon"),s=document.getElementById("darkModeText");e&&(e.textContent=t?"☀️":"🌙"),s&&(s.textContent=t?"Light Mode":"Dark Mode")}function dt(){const t=document.getElementById("sidebarShopList");if(!t)return;const e=s=>s?"bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400":"text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border-r-4 border-transparent";t.innerHTML=`
        <div class="space-y-1">
            <button onclick="setActiveShop('OVERVIEW')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${e(i.activeShop==="OVERVIEW")}">
                🌍 Global Overview
            </button>
            <button onclick="setActiveShop('COMPARE')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${e(i.activeShop==="COMPARE")}">
                🎯 Targets & Compare
            </button>
            <button onclick="setActiveShop('CUSTOMERS')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${e(i.activeShop==="CUSTOMERS")}">
                👥 Customers
            </button>
            
            <div class="my-2 border-t border-slate-100 dark:border-slate-700"></div>
            
            ${_.map(s=>`
                <button onclick="setActiveShop('${s}')"
                    class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${e(s===i.activeShop)}">
                    🏪 ${s}
                </button>
            `).join("")}
        </div>
    `}async function gs(t){if(window.innerWidth<1024){const e=document.getElementById("sidebar");e&&!e.classList.contains("-translate-x-full")&&lt()}typeof be=="function"&&be(t,i.activeDataType)}function it(t){const e=document.getElementById("dataTypeTabsContainer");if(!e)return;if(t==="OVERVIEW"||t==="COMPARE"||t==="CUSTOMERS"){e.classList.add("hidden");return}e.classList.remove("hidden");const s=[{type:"dashboard",label:"📊 Dashboard"},{type:"bookings",label:"Net Bookings"},{type:"delivery",label:"Deliveries"},{type:"expense",label:"Expenses"},{type:"employee",label:"👥 Employees"},{type:"daily_ledger",label:"Daily Ledger"},{type:"monthly_summary",label:"Monthly"},{type:"stock_audit",label:"✅ Stock Audit"}];e.innerHTML=`<div class="flex flex-nowrap overflow-x-auto tabs-scroll-container pb-4 font-sans">${s.map(a=>`
        <button 
            onclick="setActiveDataType('${a.type}')"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap border ${a.type===i.activeDataType?"text-indigo-600 bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700":"text-slate-600 bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mr-2"
        >
            ${a.label}
        </button>
    `).join("")}</div>`}function xs(t){typeof be=="function"&&be(i.activeShop,t)}function qe(t){const e=new Date;let s=new Date,a=new Date;const o=l=>{const n=l.getFullYear(),d=String(l.getMonth()+1).padStart(2,"0"),r=String(l.getDate()).padStart(2,"0");return`${n}-${d}-${r}`};t==="today"||(t==="yesterday"?(s.setDate(e.getDate()-1),a.setDate(e.getDate()-1)):t==="thisMonth"?(s=new Date(e.getFullYear(),e.getMonth(),1),a=new Date(e.getFullYear(),e.getMonth()+1,0)):t==="lastMonth"?(s=new Date(e.getFullYear(),e.getMonth()-1,1),a=new Date(e.getFullYear(),e.getMonth(),0)):t==="thisYear"&&(s=new Date(e.getFullYear(),0,1),a=e)),document.getElementById("startDate").value=o(s),document.getElementById("endDate").value=o(a),localStorage.setItem("selectedRangeType",t),localStorage.setItem("startDate",o(s)),localStorage.setItem("endDate",o(a)),typeof window.fetchAllData=="function"&&window.fetchAllData()}function hs(){const t=document.getElementById("fiscalYearSelect");if(!t)return;if(t.innerHTML='<option value="">-- Select Year --</option>',typeof W>"u"){console.error("ISLAMIC_CYCLES not defined");return}W.forEach(s=>{const a=document.createElement("option");a.value=s.id,a.textContent=s.label,t.appendChild(a)});const e=localStorage.getItem("selectedFiscalYear");if(e&&W.find(s=>s.id===e))t.value=e,Ee();else{const s=localStorage.getItem("startDate"),a=localStorage.getItem("endDate");if(s&&a)document.getElementById("startDate").value=s,document.getElementById("endDate").value=a,i.dateRange.start=s,i.dateRange.end=a;else{const o=new Date().toISOString().split("T")[0],l=W.find(n=>o>=n.start&&o<=n.end);l&&(t.value=l.id,Ee())}}}function Ee(){const t=document.getElementById("fiscalYearSelect").value;t&&localStorage.setItem("selectedFiscalYear",t);const e=document.getElementById("fiscalPeriodSelect");if(e.innerHTML='<option value="">-- Select Period --</option>',e.disabled=!t,!t)return;const s=W.find(n=>n.id===t);if(!s)return;const a=new Date(s.eid);a.setDate(a.getDate()-1);const o=a.toISOString().split("T")[0];[{id:"full",label:"Full Fiscal Year (BE to BE)",start:s.start,end:s.end},{id:"part1",label:"Bakra Eid to Eid",start:s.start,end:o},{id:"part2",label:"Eid to Bakra Eid",start:s.eid,end:s.end}].forEach(n=>{const d=document.createElement("option");d.value=JSON.stringify({start:n.start,end:n.end}),d.textContent=n.label,e.appendChild(d)}),e.options.length>1&&(e.value=e.options[1].value,ct())}function ct(){const e=document.getElementById("fiscalPeriodSelect").value;if(!e)return;const s=JSON.parse(e);document.getElementById("startDate").value=s.start,document.getElementById("endDate").value=s.end,localStorage.setItem("startDate",s.start),localStorage.setItem("endDate",s.end),localStorage.setItem("selectedRangeType","fiscal"),i.dateRange.start=s.start,i.dateRange.end=s.end,typeof window.fetchAllData=="function"&&window.fetchAllData()}function bs(t,e){const s=i.sortState[e]||{key:"date",dir:"desc"};s.key===t?s.dir=s.dir==="asc"?"desc":"asc":(s.key=t,s.dir="asc"),i.sortState[e]=s,i.activeDataType==="monthly_summary"?Ye(i.activeShop):i.activeDataType==="bookings"?K(i.activeShop,"bookings"):i.activeDataType==="delivery"?K(i.activeShop,"delivery"):i.activeDataType==="expense"?K(i.activeShop,"expense"):K(i.activeShop,i.activeDataType)}function fs(t,e){i.searchState[t]=e,i.activeDataType==="bookings"||i.activeDataType==="delivery"||i.activeDataType==="expense"||i.activeDataType,K(i.activeShop,i.activeDataType)}function ys(t){const e=document.querySelectorAll(".employee-card"),s=(t||"").toLowerCase().trim();e.forEach(a=>{const o=a.getAttribute("data-name")||"";a.classList.toggle("hidden",!o.includes(s))})}let q="booking",Te=!1;const Le={},ut={Profit:{value:"profit",categories:["donation","salman","family","customer service"]},"Shop Expenses":{value:"shop-expense",categories:["recharge","salary","stationary","shop","electric","room","loss","cancel","transport","visa"]},"Piece Expense":{value:"piece-expense",categories:["stitching","folak","fusoos","fusoos-purchase","khauwar","tola","khaka","computer","magribi","qureshi","talli","altor","out-statching","sample","material","jheek","delivery","punching"]}};function vs(){Te=!1;const t=document.getElementById("addEntryModal");t.classList.remove("hidden");const e=localStorage.getItem("sideBySideMode")!=="false",s=document.getElementById("sideBySideToggle");s&&(s.checked=e,pt(e)),$s(),Es(),pe();const a=document.getElementById("lastEntryPreview");a&&(a.classList.add("hidden"),a.innerHTML="");const o=document.getElementById("entryShop");o.innerHTML="",_.forEach(n=>{const d=document.createElement("option");d.value=n.toLowerCase(),d.textContent=n,o.appendChild(d)}),o.addEventListener("change",()=>De(o.value)),o.value&&De(o.value),ht("booking"),t.onkeydown=n=>{if(n.ctrlKey&&n.key==="Enter"){const d=document.getElementById("addEntryForm");d&&d.requestSubmit()}}}function ws(){document.getElementById("addEntryModal").classList.add("hidden"),document.getElementById("addEntryForm").reset(),gt(),Te&&ge()}let te=1,ze=!1;function ks(){const e=document.getElementById("sideBySideToggle").checked;localStorage.setItem("sideBySideMode",e),pt(e)}function pt(t){const e=document.getElementById("imageViewerColumn"),s=document.getElementById("entryFormColumn"),a=document.querySelector("#addEntryModal > div"),o=document.getElementById("pastedHint");t?(e&&e.classList.remove("hidden"),s&&(s.classList.remove("md:w-full","max-w-2xl","mx-auto"),s.classList.add("md:w-1/2")),a&&(a.classList.remove("max-w-2xl"),a.classList.add("max-w-6xl")),o&&o.classList.remove("hidden")):(e&&e.classList.add("hidden"),s&&(s.classList.remove("md:w-1/2"),s.classList.add("md:w-full","max-w-2xl","mx-auto")),a&&(a.classList.remove("max-w-6xl"),a.classList.add("max-w-2xl")),o&&o.classList.add("hidden"))}function $s(){const t=document.getElementById("imagePlaceholder"),e=document.getElementById("billImageInput");ze||(t&&e&&(t.onclick=()=>e.click(),e.onchange=s=>{s.target.files&&s.target.files[0]&&mt(s.target.files[0])}),document.addEventListener("paste",Ss),ze=!0)}function Ss(t){const e=document.getElementById("addEntryModal");if(e&&!e.classList.contains("hidden")){const s=(t.clipboardData||t.originalEvent.clipboardData).items;for(let a in s){const o=s[a];if(o.kind==="file"&&o.type.includes("image")){const l=o.getAsFile();mt(l)}}}}function mt(t){const e=new FileReader;e.onload=s=>{const a=document.getElementById("entryImagePreview"),o=document.getElementById("imagePlaceholder"),l=document.getElementById("clearImageBtn"),n=document.getElementById("imageControls");a&&o&&(a.src=s.target.result,a.classList.remove("hidden"),o.classList.add("hidden"),l&&l.classList.remove("hidden"),n&&n.classList.remove("hidden"),te=1,xt())},e.readAsDataURL(t)}function gt(){const t=document.getElementById("entryImagePreview"),e=document.getElementById("imagePlaceholder"),s=document.getElementById("clearImageBtn"),a=document.getElementById("imageControls"),o=document.getElementById("billImageInput");t&&e&&(t.src="",t.classList.add("hidden"),e.classList.remove("hidden"),s&&s.classList.add("hidden"),a&&a.classList.add("hidden"),o&&(o.value=""))}function Cs(t){te+=t,te<.1&&(te=.1),te>5&&(te=5),xt()}function xt(){const t=document.getElementById("entryImagePreview"),e=document.getElementById("zoomLevel");t&&(t.style.transform=`scale(${te})`,t.style.transformOrigin="center center"),e&&(e.textContent=`${Math.round(te*100)}%`)}function Es(){const t=document.getElementById("entryShop"),e=document.getElementById("addEntryForm");t?.addEventListener("change",pe),e?.addEventListener("change",s=>{s.target.name==="date"&&pe()})}let Ce=null;async function pe(){Ce&&clearTimeout(Ce),Ce=setTimeout(async()=>{const t=document.getElementById("entryShop").value,e=document.querySelector('input[name="date"]'),s=document.getElementById("dailyTotalsContainer"),a=document.getElementById("selectedDateLabel"),o=document.getElementById("selectedDateValue"),l=document.getElementById("selectedDateCard"),n=document.getElementById("previousDateValue"),d=document.getElementById("previousDateLabel");if(!t||!e)return;const r=e.value;if(r){s?.classList.remove("hidden");try{const u=localStorage.getItem("authToken"),c=new Date(r);c.setDate(c.getDate()-1);const m=c.toISOString().split("T")[0],[p,x]=await Promise.all([fetch(`${N}/api/${t}/daily_ledger?date=${r}`,{headers:{Authorization:`Bearer ${u}`}}),fetch(`${N}/api/${t}/daily_ledger?date=${m}`,{headers:{Authorization:`Bearer ${u}`}})]),[h,k]=await Promise.all([p.json(),x.json()]);let $="Booking",R=h.grossBooking||0,b=k.grossBooking||0,D="indigo";q==="delivery"?($="Delivery",R=h.totalDelivery||0,b=k.totalDelivery||0,D="emerald"):q==="expense"&&($="Expense",R=h.totalExpense||0,b=k.totalExpense||0,D="rose"),l&&(l.className=`p-3 rounded-xl border transition-all duration-300 shadow-sm ${D==="indigo"?"bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50":D==="emerald"?"bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50":"bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50"}`),a&&(a.textContent=`${$} Total`),d&&(d.textContent=`Prev ${$}`),Ue(o,R,D),Ue(n,b,"slate")}catch(u){console.error("Daily Totals Fetch Error:",u)}}},50)}function Ue(t,e,s="indigo"){if(!t)return;const a=g(e),o={indigo:["text-indigo-600","dark:text-indigo-400"],emerald:["text-emerald-600","dark:text-emerald-400"],rose:["text-rose-600","dark:text-rose-400"],slate:["text-slate-600","dark:text-slate-400"]}[s]||["text-indigo-600","dark:text-indigo-400"];t.classList.add("scale-105",...o),setTimeout(()=>{t.textContent=a,t.classList.remove("scale-105",...o)},250)}function ht(t){q=t;const e=document.getElementById("lastEntryPreview");e&&e.classList.add("hidden"),["booking","delivery","expense"].forEach(o=>{const l=document.getElementById(`tab-${o}`);o===t?l.className="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 focus:outline-none":l.className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 focus:outline-none"});const s=document.getElementById("entryFields");if(s.innerHTML="",pe(),t==="expense"){const o=document.getElementById("entryShop");o&&o.value&&De(o.value)}const a=new Date().toISOString().split("T")[0];if(t==="booking")s.innerHTML=`
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bill No <span class="text-red-500">*</span></label>
                    <input type="text" name="billNo" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" id="bookingName" name="name" autocomplete="name" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone <span class="text-red-500">*</span></label>
                    <div class="flex">
                        <select name="countryCode" class="inline-flex items-center px-2 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer w-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <option value="+971" selected>UAE (+971)</option>
                            <option value="+968">OMN (+968)</option>
                            <option value="+966">KSA (+966)</option>
                            <option value="+974">QAT (+974)</option>
                            <option value="+965">KWT (+965)</option>
                        </select>
                        <input type="text" id="bookingPhone" name="phone" autocomplete="tel" class="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </div>
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                    <input type="date" name="date" value="${a}" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qty <span class="text-red-500">*</span></label>
                    <input type="number" name="qty" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select name="status" onchange="handleBookingStatusChange(this)" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="stock" selected>STOCK</option>
                        <option value="delivered">DELIVERED</option>
                        <option value="cancel">CANCEL</option>
                    </select>
                </div>
                <!-- Amount Type (Hidden by default) -->
                 <div id="bookingAmountTypeField" class="hidden">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Type</label>
                    <select name="amountType" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="cash">CASH</option>
                        <option value="atm">ATM</option>
                        <option value="adib">ADIB</option>
                    </select>
                </div>
            </div>



            <div class="flex space-x-6 mt-2 items-center">
                <div class="flex items-center">
                    <label class="inline-flex items-center">
                        <input type="checkbox" name="advanceCheck" id="advanceCheck" onchange="toggleAdvance()" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Advance</span>
                    </label>
                    <!-- Advance Amount Input (Hidden by default) -->
                    <div id="advanceAmountField" class="hidden ml-2">
                        <input type="number" name="advance" placeholder="Amount" step="0.01" class="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </div>
                </div>

                <label class="inline-flex items-center">
                    <input type="checkbox" name="readyMade" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                    <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Ready-Made</span>
                </label>
            </div>
        `;else if(t==="delivery")s.innerHTML=`
            <div>
                <div class="flex items-center justify-between mb-1">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Bill No <span class="text-red-500">*</span></label>
                    <label class="inline-flex items-center text-xs font-normal text-slate-500 dark:text-slate-400 cursor-pointer">
                        <input type="checkbox" name="otherAmountsCheck" id="otherAmountsCheck" onchange="toggleOtherAmounts()" class="form-checkbox h-3 w-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mr-1">
                        Other Amount
                    </label>
                </div>
                <input type="text" name="billNo" id="delBillNoInput" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date <span class="text-red-500">*</span></label>
                <input type="date" name="date" value="${a}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

             <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Type</label>
                <select name="amountType" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <option value="CASH">CASH</option>
                    <option value="ADIB">ADIB (Card)</option>
                    <option value="ATM">ATM</option>
                </select>
            </div>

            <div class="col-span-1">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <input type="text" name="remarks" id="remarksInput" placeholder="Optional notes" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>
        `;else if(t==="expense"){s.innerHTML=`
            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" name="name" list="employeeSuggestions" oninput="handleNameInput(this)" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" id="expenseNameInput">
                    <datalist id="employeeSuggestions"></datalist>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" name="date" value="${a}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <div class="relative">
                        <select name="dept" onchange="updateExpenseCategories(this)" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            ${Object.entries(ut).map(([l,n])=>`<option value="${n.value}">${l}</option>`).join("")}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category <span class="text-red-500">*</span></label>
                <select name="cat" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <!-- Populated dynamically -->
                </select>
            </div>
            
            <div>
                 <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                 <textarea name="message" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
            </div>
        `;const o=s.querySelector('[name="dept"]');o&&Re(o)}}function Re(t){const e=t.value,s=t.closest("form").querySelector('[name="cat"]');if(!s)return;s.innerHTML="";const a=Object.values(ut).find(l=>l.value===e);(a?a.categories:[]).forEach(l=>{const n=document.createElement("option");n.value=l,n.textContent=l,s.appendChild(n)})}function bt(){const t=document.getElementById("advanceCheck").checked,e=document.getElementById("advanceAmountField"),s=document.getElementById("bookingAmountTypeField");t?(e.classList.remove("hidden"),e.querySelector("input").focus(),s&&s.classList.remove("hidden")):(e.classList.add("hidden"),e.querySelector("input").value="",s&&s.classList.add("hidden"))}function Ds(){const t=document.getElementById("otherAmountsCheck").checked,e=document.getElementById("delBillNoInput");if(t){e.value="other-amounts",e.disabled=!0,e.classList.add("bg-slate-100","text-slate-500");const a=document.getElementById("addEntryForm").querySelector('[name="amount"]');a&&a.focus()}else e.value="",e.disabled=!1,e.classList.remove("bg-slate-100","text-slate-500"),e.focus()}async function As(t){t.preventDefault();const e=t.target,s=new FormData(e),a=document.getElementById("entryShop").value,o={};if(s.forEach((l,n)=>{n==="advanceCheck"||n==="readyMade"||n==="otherAmountsCheck"||(o[n]=l)}),q==="booking"){if(e.querySelector('[name="advanceCheck"]').checked){const r=o.advance;r&&(o.advance=parseFloat(r))}else delete o.advance,delete o.amountType;e.querySelector('[name="readyMade"]').checked&&(o.readyMade=!0),o.countryCode||(o.countryCode="+971");const d=o.status?o.status.toLowerCase():"stock";delete o.status,o.noOfUpdates=0,o.status=d}q==="delivery"&&e.querySelector('[name="otherAmountsCheck"]').checked&&(o.billNo="other-amounts");try{const l=q==="booking"?"bookings":q;q==="expense"&&o.name&&(o.name=o.name.toLowerCase()),await at(a,l,o),Bs("Entry Added Successfully!"),Te=!0,pe();const n=document.getElementById("lastEntryPreview");if(n){let d="";const r=parseFloat(o.amount).toLocaleString("en-AE",{style:"currency",currency:"AED"});q==="booking"?d=`<b>Booking Saved:</b> Bill #${o.billNo} - ${o.name} (${r})`:q==="delivery"?d=`<b>Delivery Saved:</b> Bill #${o.billNo} - ${r}`:q==="expense"&&(d=`<b>Expense Saved:</b> ${o.cat} - ${o.name} (${r})`),n.innerHTML=`<span>${d}</span> <span class="text-xs text-green-600">Now</span>`,n.classList.remove("hidden")}if(q==="booking"){const d=e.querySelector('[name="billNo"]'),r=parseInt(o.billNo);isNaN(r)?d.value="":d.value=r+1;const u=e.querySelector('[name="name"]');u.value="";const c=e.querySelector('[name="phone"]');c&&(c.value=""),e.querySelector('[name="qty"]').value="",e.querySelector('[name="amount"]').value="",e.querySelector('[name="advanceCheck"]').checked=!1,bt(),e.querySelector('[name="readyMade"]').checked=!1;const m=e.querySelector('[name="countryCode"]');m&&(m.value="+971");const p=e.querySelector('[name="status"]');p&&(p.value="stock"),u.focus()}else if(q==="delivery"){const d=e.querySelector('[name="billNo"]');d.disabled||(d.value=""),e.querySelector('[name="amount"]').value="";const r=document.getElementById("remarksInput");r&&(r.value=""),d.focus()}else q==="expense"&&(e.querySelector('[name="amount"]').value="",e.querySelector('[name="name"]').value="",e.querySelector('[name="message"]').value="",e.querySelector('[name="name"]').focus())}catch(l){alert(l.message)}}function Bs(t){const e=document.createElement("div");e.className="fixed bottom-6 right-6 bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-20 opacity-0 z-[60]",e.innerHTML=`
        <div class="flex items-center space-x-2">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="font-medium">${t}</span>
        </div>
    `,document.body.appendChild(e),requestAnimationFrame(()=>{e.classList.remove("translate-y-20","opacity-0")}),setTimeout(()=>{e.classList.add("translate-y-20","opacity-0"),setTimeout(()=>e.remove(),300)},2e3)}function Ms(t){if(t.value==="cancel"){const e=document.getElementById("addEntryForm"),s=e.querySelector('[name="name"]');s&&(s.value="Cancelled");const a=e.querySelector('[name="phone"]');a&&(a.value="-");const o=e.querySelector('[name="qty"]');o&&(o.value="0");const l=e.querySelector('[name="amount"]');l&&(l.value="0")}}async function De(t){if(t)try{const e=localStorage.getItem("authToken"),s=await fetch(`${N}/api/${t}/expense/employees`,{headers:{Authorization:`Bearer ${e}`}});if(s.ok){const a=await s.json();Le[t]=a,Is(t)}}catch(e){console.error("Employee fetch failed:",e)}}function Is(t){const e=document.getElementById("employeeSuggestions");if(!e)return;e.innerHTML="",(Le[t]||[]).forEach(a=>{const o=document.createElement("option");o.value=a.name,e.appendChild(o)})}function Ts(t){const e=t.value.trim().toLowerCase();if(e.length<3)return;const s=document.getElementById("entryShop").value,o=(Le[s]||[]).find(l=>l.name.toLowerCase()===e);if(o){const l=t.closest("form"),n=l.querySelector('[name="dept"]'),d=l.querySelector('[name="cat"]'),r=l.querySelector('[name="amount"]');n&&o.dept&&(n.value=o.dept.toLowerCase(),Re(n),d&&o.cat&&(d.value=o.cat.toLowerCase())),r&&setTimeout(()=>r.focus(),10)}}window.openAddEntryModal=vs;window.closeAddEntryModal=ws;window.switchEntryType=ht;window.toggleAdvance=bt;window.toggleOtherAmounts=Ds;window.handleAddEntrySubmit=As;window.handleBookingStatusChange=Ms;window.updateExpenseCategories=Re;window.toggleSideBySideMode=ks;window.clearEntryImage=gt;window.zoomImage=Cs;window.handleNameInput=Ts;function ft(t,e){const s=i.allResults[`${t}|bookings`],a=i.allResults[`${t}|expense`],o=i.allResults[`${t}|delivery`],l="Please ensure all data (Bookings, Expenses, Deliveries) is fetched for this shop and try again.";if(!s||!a||!o){alert(l);return}let n,d,r;if(e){const v=e.split("-");d=parseInt(v[0],10),n=parseInt(v[1],10)-1,r=new Date(d,n,1).toLocaleString("default",{month:"long"})}else{const v=new Date(document.getElementById("startDate").value);n=v.getMonth(),d=v.getFullYear(),r=v.toLocaleString("default",{month:"long"})}const u=new Set;o.filteredData&&o.filteredData.forEach(v=>{const C=new Date(v.date);if(C.getMonth()===n&&C.getFullYear()===d){(v.billNo||"").toLowerCase().trim();let w=v.amountType?v.amountType.toUpperCase().trim():"CASH";(w.includes("CARD")||w.includes("VISA")||w.includes("MASTER"))&&(w="ADIB"),w!=="ADIB"&&w!=="ATM"&&(w="CASH"),u.add(w)}});const c=["CASH","ADIB","ATM"],m=new Date(d,n+1,0).getDate(),p=new Map;for(let v=1;v<=m;v++){const C={date:`${v}/${n+1}/${d}`,booking:0,deliveryBreakdown:{},totalDelivery:0,expense:0,cancelled:0,salman:0};c.forEach(w=>C.deliveryBreakdown[w]=0),p.set(v,C)}const x=(v,C)=>{!v||!v.filteredData||v.filteredData.forEach(w=>{const V=new Date(w.date);if(V.getMonth()!==n||V.getFullYear()!==d)return;const ae=V.getDate(),ee=p.get(ae),ie=w.amount||0;if(C==="booking")se(w.status)?ee.cancelled+=ie:ee.booking+=ie;else if(C==="expense")ee.expense+=ie;else if(C==="delivery"){(w.billNo||"").toLowerCase().trim();let X=w.amountType?w.amountType.toUpperCase().trim():"CASH";(X.includes("CARD")||X.includes("VISA")||X.includes("MASTER"))&&(X="ADIB"),X!=="ADIB"&&X!=="ATM"&&(X="CASH"),ee.deliveryBreakdown.hasOwnProperty(X)&&(ee.deliveryBreakdown[X]+=ie,ee.totalDelivery+=ie)}})};x(s,"booking"),x(a,"expense"),x(o,"delivery");const h=["beingReal Accounts","","","","","","","Official Monthly Report"],k=[`Shop: ${t.toUpperCase()}`,`Month: ${r} ${d}`,`Generated: ${new Date().toLocaleDateString()}`],$=[],R=["Date","Booking"];c.forEach(v=>R.push(`${v} Delivery`)),R.push("Total Delivery","Expense","Cancelled","Salman Bhai");const b=[h,k,$,R],D=Array.from(p.keys()).sort((v,C)=>v-C);let B=0,A=0,I=0,H=0,f=0;const E={};c.forEach(v=>E[v]=0),D.forEach(v=>{const C=p.get(v),w=[C.date,C.booking];c.forEach(V=>{const ae=C.deliveryBreakdown[V]||0;w.push(ae),E[V]+=ae}),w.push(C.totalDelivery,C.expense,C.cancelled,0),b.push(w),B+=C.booking,A+=C.cancelled,I+=C.expense}),o.filteredData&&o.filteredData.forEach(v=>{const C=new Date(v.date);if(C.getMonth()===n&&C.getFullYear()===d){const w=v.amount||0,V=(v.billNo||"").toLowerCase().trim();V&&V!=="other-amounts"?H+=w:f+=w}});const y=XLSX.utils.aoa_to_sheet(b),S=R.length,P=1,L=S+1,j=S+2,T=(v,C,w)=>{const V=XLSX.utils.encode_cell({r:v,c:C});y[V]={t:typeof w=="number"?"n":"s",v:w}};T(P,j,"Month Total");let M=P+2;T(M,L,"Booking"),T(M,j,B),M++,T(M,L,"Cancelled"),T(M,j,A),M++,T(M,L,"Net Booking"),T(M,j,B-A),M++,c.forEach(v=>{T(M,L,`${v} Delivery`),T(M,j,E[v]),M++}),T(M,L,"Booking Delivery"),T(M,j,H),M++,T(M,L,"Misc Collections"),T(M,j,f),M++,T(M,L,"Total Delivery"),T(M,j,H+f),M++,T(M,L,"Expense"),T(M,j,I),M++;const oe=B-A-(H+f);T(M,L,"Balance"),T(M,j,oe);const F=[];for(let v=0;v<j+1;v++)F.push({wch:15});y["!cols"]=F;const G=XLSX.utils.book_new();XLSX.utils.book_append_sheet(G,y,`${r} Report`),XLSX.writeFile(G,`${t}_${r}_${d}_Report.xlsx`)}function Ls(t){ft(t)}window.downloadMonthlyExcel=ft;window.exportMonthlySummaryToCSV=Ls;async function Rs(){const t=document.getElementById("dataTypeContentContainer");if(!t)return;const e=t.cloneNode(!0);e.querySelectorAll("button, .mb-3.relative.max-w-md").forEach(r=>r.remove());const s=document.createElement("div");s.style.marginBottom="20px",s.style.padding="20px",s.style.borderBottom="2px solid #0d9488",s.style.backgroundColor="#f8fafc";const a=i.activeShop==="OVERVIEW"?"GLOBAL OVERVIEW":i.activeShop,o=`Period: ${document.getElementById("startDate").value} to ${document.getElementById("endDate").value}`,l=i.activeDataType.replace("_"," ").toUpperCase();s.innerHTML=`
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
                <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">beingReal <span style="color: #0d9488;">Accounts</span></h1>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Professional Shop Data Report</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-weight: 800; color: #1e293b; font-size: 18px;">${a}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">${o}</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8; margin-top: 4px;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
        <div style="display: inline-block; background-color: #0d9488; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 12px; text-transform: uppercase;">${l}</div>
    `,e.insertBefore(s,e.firstChild);const n={margin:[.5,.5],filename:`${a.replace(/\s+/g,"_")}_${l.replace(/\s+/g,"_")}_Report.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1,letterRendering:!0},jsPDF:{unit:"in",format:"a4",orientation:"landscape"},pagebreak:{mode:["avoid-all","css","legacy"]}},d=document.querySelector('button[onclick="downloadPDF()"]');if(d){const r=d.innerHTML;d.innerHTML=`
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
        `,d.disabled=!0;try{await html2pdf().set(n).from(e).save()}catch(u){console.error("PDF Generation failed:",u),alert("Failed to generate PDF. Please try again.")}finally{d.innerHTML=r,d.disabled=!1}}else try{await html2pdf().set(n).from(e).save()}catch(r){console.error("PDF Generation failed:",r)}}window.downloadPDF=Rs;function js(){const t=document.getElementById("dataTypeContentContainer"),e=document.getElementById("dataTypeTabsContainer"),s=document.getElementById("statusMessage");if(t&&(!i||!i.currentShop)){e&&e.classList.add("hidden"),s&&s.classList.remove("hidden"),t.innerHTML="";return}}window.renderOverview=js;function Hs(){const t=document.getElementById("missingBillsModal");yt(),t.classList.remove("hidden"),document.body.style.overflow="hidden"}function Os(){document.getElementById("missingBillsModal").classList.add("hidden"),document.body.style.overflow="",document.getElementById("missingResults").innerHTML=""}function Ns(){let t=1/0,e=-1/0,s=!1;const a=!!document.getElementById("normalizeBill")?.checked,o=Array.from(document.querySelectorAll(".shop-select-checkbox")).filter(n=>n.checked);if((o.length?o.map(n=>n.value):[..._]).forEach(n=>{const d=`${n}|bookings`,r=i.allResults[d];r&&r.filteredData&&r.filteredData.forEach(u=>{const c=je(u);if(!c)return;const m=a?He(c):c;if(m&&/^\d+$/.test(m)){const p=parseInt(m,10);p<t&&(t=p),p>e&&(e=p),s=!0}})}),!s){alert("No data available for the selected shops to calculate range. Please fetch data first.");return}document.getElementById("missingStart").value=t,document.getElementById("missingEnd").value=e}function $e(t,e,s){const a=[];for(const[r,u]of t.entries())r>=e&&r<=s&&u>1&&a.push(r);a.sort((r,u)=>r-u);const o=[];let l=0;const n=Array.from(t.keys()).filter(r=>r>=e&&r<=s).sort((r,u)=>r-u);if(n.length===0){if(s>=e){const r=e===s?`${e}`:`${e}-${s}`;o.push(r),l+=s-e+1}return{missingRanges:o,duplicates:a,missingCount:l,duplicateCount:a.length}}if(n[0]>e){const r=n[0]-1,u=e===r?`${e}`:`${e}-${r}`;o.push(u),l+=r-e+1}for(let r=0;r<n.length-1;r++){const u=n[r],c=n[r+1];if(c>u+1){const m=u+1,p=c-1,x=m===p?`${m}`:`${m}-${p}`;o.push(x),l+=p-m+1}}const d=n[n.length-1];if(d<s){const r=d+1,u=r===s?`${r}`:`${r}-${s}`;o.push(u),l+=s-r+1}return{missingRanges:o,duplicates:a,missingCount:l,duplicateCount:a.length}}function je(t){const e=["billNo","bill_no","billno","billNumber","bill_number","invoiceNo","invoice_no","invoice","bill"];for(const a of e)if(t[a]!=null)return String(t[a]);const s=new Set(["qty","quantity","amount","price","total","count","cnt","year","month","day","__v","phone","mobile"]);for(const a of Object.keys(t)){if(s.has(a.toLowerCase()))continue;const o=t[a];if(o==null)continue;const l=String(o);if(/\d/.test(l)&&l.length<=12)return l}return null}function He(t){if(t==null)return null;const e=String(t).replace(/\D+/g,"");return e?e.replace(/^0+/,"")||"0":null}function yt(){const t=document.getElementById("shopSelectionContainer");t&&(t.innerHTML=_.map(e=>`
        <label class="inline-flex items-center space-x-2 text-sm">
            <input type="checkbox" class="shop-select-checkbox" value="${e}" checked />
            <span>${e}</span>
        </label>
    `).join(""))}async function vt(t){t&&t.preventDefault();const e=parseInt(document.getElementById("missingStart").value||"1",10),s=parseInt(document.getElementById("missingEnd").value||"5000",10);if(isNaN(e)||isNaN(s)||e<1||s<e){alert("Please provide a valid numeric range where End ≥ Start and both ≥ 1.");return}const a=document.getElementById("missingResults");a.innerHTML='<p class="text-sm text-slate-500">Scanning... This uses cached results from the last "Fetch Data" call. If data is missing, please click "Fetch Data" first.</p>';const o=Array.from(document.querySelectorAll(".shop-select-checkbox")).filter(c=>c.checked),l=o.length?o.map(c=>c.value):[..._],n=!!document.getElementById("normalizeBill")?.checked,d={};l.forEach(c=>{const m=`${c}|bookings`,p=i.allResults[m],x=new Map;let h=!1,k=p?.errorMessage||null;if(p&&Array.isArray(p.filteredData)&&(h=!0,p.filteredData.forEach(R=>{let b=je(R);if(b==null)return;b=b.trim();const D=n?He(b):b;if(D&&/^\d+$/.test(D)){const B=parseInt(D,10);x.set(B,(x.get(B)||0)+1)}})),!h){d[c]={hasData:!1,error:k};return}const $=$e(x,e,s);d[c]={hasData:!0,...$}});let r='<div class="space-y-4">';const u=document.getElementById("onlyMissing")?.checked;Object.keys(d).forEach(c=>{const m=d[c],p=m.hasData&&m.missingCount===0&&m.duplicateCount===0;u&&p||(r+=`
            <div class="p-4 border rounded-lg bg-slate-50 relative">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-3">
                        <h4 class="font-bold text-slate-800 text-lg">${c}</h4>
                        ${m.hasData?`
                            <span class="px-2 py-0.5 rounded text-xs font-semibold ${m.missingCount>0?"bg-red-100 text-red-700":"bg-green-100 text-green-700"}">
                                Missing: ${m.missingCount}
                            </span>
                            <span class="px-2 py-0.5 rounded text-xs font-semibold ${m.duplicateCount>0?"bg-amber-100 text-amber-700":"bg-gray-100 text-gray-600"}">
                                Duplicates: ${m.duplicateCount}
                            </span>
                        `:""}
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="text-xs px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50" onclick='copyMissing(${JSON.stringify(c)}, ${e}, ${s})'>Copy Report</button>
                    </div>
                </div>
        `,m.hasData?p?r+='<p class="text-sm text-green-700 font-medium flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Perfect! No missing numbers or duplicates in range.</p>':(m.missingCount>0&&(r+=`
                    <div class="mb-2">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Missing Ranges</p>
                        <p class="text-sm font-mono text-red-700 bg-red-50 p-2 rounded border border-red-100 break-words whitespace-pre-wrap leading-relaxed">${m.missingRanges.join(", ")}</p>
                    </div>
                `),m.duplicateCount>0&&(r+=`
                    <div>
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Duplicate Bills</p>
                        <p class="text-sm font-mono text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 break-words">${m.duplicates.join(", ")}</p>
                    </div>
                `)):r+=`<p class="text-sm text-amber-700">No booking data fetched. <button class="underline font-medium" onclick="fetchSingleShop('${c}')">Fetch now</button></p>`,r+="</div>")}),r+="</div>",a.innerHTML=r}function Ps(t,e,s){const a=`${t}|bookings`,o=i.allResults[a],l=!!document.getElementById("normalizeBill")?.checked,n=Oe(o?o.filteredData:[],l),d=$e(n,e,s).missingRanges,r=new Blob([d.join(`
`)],{type:"text/plain"}),u=document.createElement("a");u.href=URL.createObjectURL(r),u.download=`${t}_missing_bills_${e}_to_${s}.txt`,document.body.appendChild(u),u.click(),document.body.removeChild(u)}function Oe(t,e){const s=new Map;return t&&t.forEach(a=>{let o=je(a);if(o==null)return;o=o.trim();const l=e?He(o):o;if(l&&/^\d+$/.test(l)){const n=parseInt(l,10);s.set(n,(s.get(n)||0)+1)}}),s}function _s(t,e,s){const a=`${t}|bookings`,o=i.allResults[a],l=!!document.getElementById("normalizeBill")?.checked,n=Oe(o?o.filteredData:[],l),{missingRanges:d,duplicates:r}=$e(n,e,s);let u=`Shop: ${t}
Range: ${e}-${s}
`;if(u+=`Missing: ${d.length>0?d.join(", "):"None"}
`,u+=`Duplicates: ${r.length>0?r.join(", "):"None"}`,!navigator.clipboard){const c=document.createElement("textarea");c.value=u,document.body.appendChild(c),c.select(),document.execCommand("copy"),document.body.removeChild(c),alert("Copied to clipboard");return}navigator.clipboard.writeText(u).then(()=>{alert("Report copied to clipboard")}).catch(c=>{console.error("Clipboard error",c),alert("Copy failed")})}async function Fs(t){try{de(!0),await Q(t,"bookings",i.dateRange.start,i.dateRange.end),vt()}catch(e){console.error("Error fetching single shop bookings",e),alert("Failed to fetch bookings for "+t)}finally{de(!1)}}function Vs(){const t=parseInt(document.getElementById("missingStart").value||"1",10),e=parseInt(document.getElementById("missingEnd").value||"5000",10);if(isNaN(t)||isNaN(e)||t<1||e<t){alert("Please provide a valid numeric range where End ≥ Start and both ≥ 1.");return}const s=[["Shop","MissingCount","DuplicateCount","MissingRanges","DuplicateList"]],a=Array.from(document.querySelectorAll(".shop-select-checkbox")).filter(u=>u.checked),o=a.length?a.map(u=>u.value):[..._],l=!!document.getElementById("normalizeBill")?.checked;if(o.forEach(u=>{const c=`${u}|bookings`,m=i.allResults[c];if(!(m&&Array.isArray(m.filteredData)))return;const p=Oe(m.filteredData,l),{missingRanges:x,duplicates:h,missingCount:k,duplicateCount:$}=$e(p,t,e),R=`"${x.join(", ")}"`,b=`"${h.join(", ")}"`;s.push([u,String(k),String($),R,b])}),s.length===1){alert("No booking data available for selected shops. Fetch data first.");return}const n=s.map(u=>u.join(",")).join(`
`),d=new Blob([n],{type:"text/csv"}),r=document.createElement("a");r.href=URL.createObjectURL(d),r.download=`detailed_missing_bills_${t}_to_${e}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r)}window.openMissingBillsModal=Hs;window.closeMissingBillsModal=Os;window.autoSetRange=Ns;window.scanMissingBills=vt;window.downloadAllMissingCSV=Vs;window.copyMissing=_s;window.downloadMissing=Ps;window.fetchSingleShop=Fs;window.shopSelectionContainer=yt;function wt(){const t=document.getElementById("aiChatModal");t.classList.contains("hidden")?(t.classList.remove("hidden"),setTimeout(()=>{t.classList.remove("scale-95","opacity-0"),t.classList.add("scale-100","opacity-100"),document.getElementById("chatInput").focus()},10)):(t.classList.remove("scale-100","opacity-100"),t.classList.add("scale-95","opacity-0"),setTimeout(()=>{t.classList.add("hidden")},300))}async function qs(t){t&&t.preventDefault();const e=document.getElementById("chatInput"),s=e.value.trim();s&&(e.value="",await kt(s))}async function kt(t,e=null){ne("user",t);const s=ne("ai","Analyzing data...",!0);try{const a=Us(),o=e||t,l=localStorage.getItem("authToken"),d=await(await fetch(`${N}/api/ai/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${l}`},body:JSON.stringify({prompt:o,context:a})})).json(),r=document.getElementById(s);r&&r.remove(),d.error?ne("ai",`**Error:** ${d.error}`):ne("ai",d.response)}catch(a){const o=document.getElementById(s);o&&o.remove(),ne("ai",`**System Error:** ${a.message}`)}}function zs(){document.getElementById("aiChatModal").classList.contains("hidden")&&wt(),kt("Analyze Shop Health 🏥",`
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
    `)}function ne(t,e,s=!1){const a=document.getElementById("chatHistory"),o="msg-"+Date.now();let l="";s?l='<div class="animate-pulse flex space-x-2"><div class="h-2 w-2 bg-slate-400 rounded-full"></div><div class="h-2 w-2 bg-slate-400 rounded-full"></div><div class="h-2 w-2 bg-slate-400 rounded-full"></div></div>':l=typeof marked<"u"?marked.parse(e):e;const n=t==="user",d=`
    <div class="flex items-start gap-2.5 ${n?"flex-row-reverse":""}" id="${o}">
        <div class="w-8 h-8 rounded-full ${n?"bg-indigo-600":"bg-indigo-100"} flex items-center justify-center flex-shrink-0 text-white">
            <span class="text-sm">${n?"👤":"🤖"}</span>
        </div>
        <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-gray-200 ${n?"bg-indigo-50 rounded-l-xl rounded-br-xl":"bg-white rounded-r-xl rounded-bl-xl shadow-sm"}">
            <div class="text-sm font-normal text-gray-900 prose prose-sm max-w-none ${n?"text-indigo-900":""}">
                ${l}
            </div>
        </div>
    </div>`;return a.insertAdjacentHTML("beforeend",d),a.scrollTop=a.scrollHeight,o}function Us(){const t={shop:i.activeShop,dateRange:i.dateRange,dataType:i.activeDataType,activeDataSummary:{},globalSummary:{}};if(typeof _<"u"&&_.forEach(e=>{const s=i.allResults[`${e}|bookings`],a=i.allResults[`${e}|delivery`],o=i.allResults[`${e}|expense`];s&&(t.globalSummary[e]={netBooking:s.netAmount!==void 0?s.netAmount:s.totalAmount||0,delivery:a&&a.totalAmount||0,expense:o&&o.totalAmount||0})}),i.activeShop!=="OVERVIEW"&&!["COMPARE","CUSTOMERS"].includes(i.activeShop)){const e=i.allResults[`${i.activeShop}|bookings`],s=i.allResults[`${i.activeShop}|expense`],a=i.allResults[`${i.activeShop}|delivery`];if(e){const o=e.netAmount!==void 0?e.netAmount:0,l=e.totalAmount||0,n=e.cancelAmount!==void 0?e.cancelAmount:0;t.activeDataSummary.bookings={gross:l,canceled:n,net:o,count:e.filteredData?e.filteredData.length:0}}if(s){const o=s.totalAmount||0;t.activeDataSummary.expenses={total:o,count:s.filteredData?s.filteredData.length:0}}if(a){const o=a.totalAmount||0;t.activeDataSummary.delivery={total:o,count:a.filteredData?a.filteredData.length:0,paymentMethods:a.paymentMethods||{}}}}return t}window.toggleAIChat=wt;window.handleChatSubmit=qs;window.triggerHealthAnalysis=zs;window.handleSort=bs;window.handleTableSearch=fs;window.handlePageChange=Zt;window.toggleSidebar=lt;window.toggleDarkMode=ms;window.setActiveShop=gs;window.setActiveDataType=xs;window.filterEmployeeGrid=ys;window.fetchAllData=ge;window.fetchShopData=ke;window.logout=me;window.updatePeriodOptions=Ee;window.applyFiscalPeriod=ct;window.addEventListener("DOMContentLoaded",()=>{ps(),hs();const t=localStorage.getItem("selectedRangeType")||"thisMonth";if(t==="fiscal"||t==="custom"){const a=localStorage.getItem("startDate"),o=localStorage.getItem("endDate");a&&o?(document.getElementById("startDate").value=a,document.getElementById("endDate").value=o,i.dateRange.start=a,i.dateRange.end=o,window.fetchAllData()):qe("thisMonth")}else qe(t);Ie();const e=document.getElementById("fetchButton");e&&e.addEventListener("click",()=>ge());const s=document.getElementById("logoutBtn");s&&s.addEventListener("click",me)});
