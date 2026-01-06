// --- CONFIGURATION ---
const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
const isFile = window.location.protocol === 'file:';

const BASE_URL = (isFile || (isLocal && window.location.port !== '3000')) 
    ? 'http://localhost:3000' 
    : '';

// --- SHOP CONFIGURATION (MUST MATCH server.js SHOP_NAMES array exactly) ---
const SHOP_PREFIXES = [
    'Albarieklamaa',
    'Algaidamadam',
    'Gaidamnasir',
    'Gaidatailor',
    'Galaxybranch',
    'Galaxyzakhir',
    'Gawanimadam',
    'Naseem',
    'Staralgawani',
];

const DATA_TYPES = ['bookings', 'delivery', 'expense'];

// --- DATE CONFIGURATION (Bakra Eid Logic) ---

// Define key dates
// Each entry represents a Full Fiscal Year cycle (Bakra Eid to Bakra Eid)
const ISLAMIC_CYCLES = [
    { id: '2027-2028', label: '2027 - 2028', start: '2027-05-18', end: '2028-05-06', eid: '2028-02-25' }, // Approx dates
    { id: '2026-2027', label: '2026 - 2027', start: '2026-05-28', end: '2027-05-17', eid: '2027-03-09' },
    { id: '2025-2026', label: '2025 - 2026', start: '2025-06-08', end: '2026-05-27', eid: '2026-03-20' },
    { id: '2024-2025', label: '2024 - 2025', start: '2024-06-18', end: '2025-06-07', eid: '2025-03-31' },
    { id: '2023-2024', label: '2023 - 2024', start: '2023-06-30', end: '2024-06-17', eid: '2024-04-10' },
    { id: '2022-2023', label: '2022 - 2023', start: '2022-07-11', end: '2023-06-29', eid: '2023-04-21' },
];
