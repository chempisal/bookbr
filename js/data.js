/**
 * data.js - Data structures, Khmer translation helpers, Empty Initial State, Activity Logging & Cloud Sync Engine
 * ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល (Textbook Stock & Borrowing Management System)
 */

// Storage Keys
const STORAGE_KEYS = {
    BOOKS: 'tb_books',
    BORROWINGS: 'tb_borrowings',
    STUDENTS: 'tb_students',
    SETTINGS: 'tb_settings',
    AUTH: 'tb_auth',
    LOGS: 'tb_activity_logs',
    SHEET_URL: 'sheet_webhook_url',
    AUTO_SYNC: 'sheet_auto_sync',
    LAST_SYNC: 'sheet_last_sync',
    SAMPLE_CLEARED: 'tb_sample_cleared_v2'
};

// Khmer Digits and Months
const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const KHMER_MONTHS = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];
const KHMER_DAYS = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];

// Helper: Convert Arabic number to Khmer number
function toKhmerNumber(num) {
    if (num === null || num === undefined || (isNaN(num) && typeof num !== 'string')) return '';
    return String(num).replace(/[0-9]/g, digit => KHMER_DIGITS[+digit]);
}

// Helper: Convert Khmer number string to regular Arabic number
function fromKhmerNumber(khmerStr) {
    if (!khmerStr) return '';
    let result = String(khmerStr);
    KHMER_DIGITS.forEach((kh, i) => {
        result = result.split(kh).join(String(i));
    });
    return result;
}

// Helper: Format Date string (YYYY-MM-DD) to Khmer readable date
function formatKhmerDate(dateStr, includeDayName = false) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const dayName = KHMER_DAYS[date.getDay()];
    const day = date.getDate();
    const month = KHMER_MONTHS[date.getMonth()];
    const year = date.getFullYear();

    if (includeDayName) {
        return `ថ្ងៃ${dayName} ទី${toKhmerNumber(day)} ខែ${month} ឆ្នាំ${toKhmerNumber(year)}`;
    }
    return `ថ្ងៃទី ${toKhmerNumber(day)} ខែ ${month} ឆ្នាំ ${toKhmerNumber(year)}`;
}

// Helper: Relative Time in Khmer (e.g. មុននេះបន្តិច, ៥ នាទីមុន, ម្សិលមិញ)
function formatRelativeKhmerTime(isoDateStr) {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 30) return 'មុននេះបន្តិច';
    if (diffSec < 60) return `${toKhmerNumber(diffSec)} វិនាទីមុន`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${toKhmerNumber(diffMin)} នាទីមុន`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${toKhmerNumber(diffHour)} ម៉ោងមុន`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'ម្សិលមិញ';
    if (diffDays < 7) return `${toKhmerNumber(diffDays)} ថ្ងៃមុន`;

    return formatKhmerDate(isoDateStr.split('T')[0]);
}

// Helper: Get Today's Date string in YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Helper: Add days to date string
function addDaysToDate(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Default School Settings (Clean template)
const DEFAULT_SETTINGS = {
    districtOffice: "ការិយាល័យអប់រំ យុវជន និងកីឡា",
    schoolName: "វិទ្យាល័យ / អនុវិទ្យាល័យ",
    academicYear: "២០២៥ - ២០២៦",
    principalName: "",
    librarianName: "បណ្ណារក្ស",
    loanDurationDays: 14,
    receiptNote: "* សេចក្តីបញ្ជាក់៖ សូមរក្សាទុកសៀវភៅឱ្យបានល្អ កុំឱ្យហែក ប្រឡាក់ ឬបាត់បង់ និងត្រូវយកមកប្រគល់សងបណ្ណាល័យវិញឱ្យបានទាន់ពេលវេលាកំណត់។"
};

// CLEAN PRODUCTION INITIAL DATA: Empty arrays (No sample/mock data)
const DEFAULT_BOOKS = [];
const DEFAULT_STUDENTS = [];
const DEFAULT_BORROWINGS = [];

// Helper to provide realistic Cambodian curriculum sample data for instant testing
function getSampleDemoData() {
    const today = getTodayDateString();
    const books = [
        { id: "BK-001", title: "ភាសាខ្មែរ ថ្នាក់ទី ១២", subject: "ភាសាខ្មែរ", grade: "12", quantity: 120, borrowed: 0 },
        { id: "BK-002", title: "គណិតវិទ្យា ថ្នាក់ទី ១២ (កម្រិតខ្ពស់)", subject: "គណិតវិទ្យា", grade: "12", quantity: 110, borrowed: 0 },
        { id: "BK-003", title: "រូបវិទ្យា ថ្នាក់ទី ១២", subject: "រូបវិទ្យា", grade: "12", quantity: 95, borrowed: 0 },
        { id: "BK-004", title: "គីមីវិទ្យា ថ្នាក់ទី ១២", subject: "គីមីវិទ្យា", grade: "12", quantity: 90, borrowed: 0 },
        { id: "BK-005", title: "ជីវវិទ្យា ថ្នាក់ទី ១២", subject: "ជីវវិទ្យា", grade: "12", quantity: 85, borrowed: 0 },
        { id: "BK-006", title: "ប្រវត្តិវិទ្យា ថ្នាក់ទី ១២", subject: "ប្រវត្តិវិទ្យា", grade: "12", quantity: 75, borrowed: 0 },
        { id: "BK-007", title: "ភាសាអង់គ្លេស English for Cambodia Book 6", subject: "ភាសាអង់គ្លេស", grade: "12", quantity: 80, borrowed: 0 },
        { id: "BK-008", title: "ភាសាខ្មែរ ថ្នាក់ទី ១១", subject: "ភាសាខ្មែរ", grade: "11", quantity: 130, borrowed: 0 },
        { id: "BK-009", title: "គណិតវិទ្យា ថ្នាក់ទី ១១", subject: "គណិតវិទ្យា", grade: "11", quantity: 125, borrowed: 0 },
        { id: "BK-010", title: "រូបវិទ្យា ថ្នាក់ទី ១១", subject: "រូបវិទ្យា", grade: "11", quantity: 100, borrowed: 0 },
        { id: "BK-011", title: "គណិតវិទ្យា ថ្នាក់ទី ១០", subject: "គណិតវិទ្យា", grade: "10", quantity: 140, borrowed: 0 },
        { id: "BK-012", title: "ភាសាខ្មែរ ថ្នាក់ទី ៩", subject: "ភាសាខ្មែរ", grade: "9", quantity: 150, borrowed: 0 },
        { id: "BK-013", title: "គណិតវិទ្យា ថ្នាក់ទី ៧", subject: "គណិតវិទ្យា", grade: "7", quantity: 160, borrowed: 0 }
    ];

    const students = [
        { id: "STD-1201", name: "សុខ ចាន់ដារា", gender: "ប្រុស", grade: "12", class: "A", phone: "012 345 678", note: "សិស្សពូកែគណិតវិទ្យា" },
        { id: "STD-1202", name: "គង់ ចិន្តា", gender: "ស្រី", grade: "12", class: "A", phone: "098 765 432", note: "ប្រធានថ្នាក់" },
        { id: "STD-1203", name: "ហេង ពិសាល", gender: "ប្រុស", grade: "12", class: "B", phone: "077 123 456", note: "" },
        { id: "STD-1101", name: "កែវ មុនីរ័ត្ន", gender: "ស្រី", grade: "11", class: "A", phone: "015 889 900", note: "" },
        { id: "STD-1102", name: "ចាន់ សុផល", gender: "ប្រុស", grade: "11", class: "B", phone: "089 445 566", note: "" },
        { id: "STD-1001", name: "ម៉េង ស្រីពៅ", gender: "ស្រី", grade: "10", class: "A", phone: "096 332 211", note: "" },
        { id: "STD-0901", name: "វ៉ាន់ សុខា", gender: "ប្រុស", grade: "9", class: "A", phone: "010 778 899", note: "" },
        { id: "STD-0701", name: "ទេព សុភ័ក្ត្រ", gender: "ស្រី", grade: "7", class: "B", phone: "092 114 455", note: "" }
    ];

    const borrowings = [
        {
            id: "BR-" + Date.now().toString().slice(-6) + "-001",
            studentId: "STD-1201",
            studentName: "សុខ ចាន់ដារា",
            grade: "12",
            class: "A",
            borrowDate: addDaysToDate(today, -5),
            dueDate: addDaysToDate(today, 9),
            status: "borrowing",
            note: "ខ្ចីរៀនត្រៀមប្រឡងឆមាស",
            books: [
                { bookId: "BK-001", title: "ភាសាខ្មែរ ថ្នាក់ទី ១២", status: "borrowing", returnDate: null },
                { bookId: "BK-002", title: "គណិតវិទ្យា ថ្នាក់ទី ១២ (កម្រិតខ្ពស់)", status: "borrowing", returnDate: null }
            ]
        },
        {
            id: "BR-" + Date.now().toString().slice(-6) + "-002",
            studentId: "STD-1203",
            studentName: "ហេង ពិសាល",
            grade: "12",
            class: "B",
            borrowDate: addDaysToDate(today, -20),
            dueDate: addDaysToDate(today, -6),
            status: "overdue",
            note: "យឺតយ៉ាវហួសកាលកំណត់",
            books: [
                { bookId: "BK-003", title: "រូបវិទ្យា ថ្នាក់ទី ១២", status: "overdue", returnDate: null }
            ]
        },
        {
            id: "BR-" + Date.now().toString().slice(-6) + "-003",
            studentId: "STD-1101",
            studentName: "កែវ មុនីរ័ត្ន",
            grade: "11",
            class: "A",
            borrowDate: addDaysToDate(today, -15),
            dueDate: addDaysToDate(today, -1),
            status: "returned",
            note: "បានប្រគល់សងគ្រប់ចំនួន",
            books: [
                { bookId: "BK-008", title: "ភាសាខ្មែរ ថ្នាក់ទី ១១", status: "returned", returnDate: addDaysToDate(today, -2) }
            ]
        }
    ];

    return { books, students, borrowings };
}

// App Global State
let appBooks = [];
let appStudents = [];
let appBorrowings = [];
let appSettings = {};
let appActivityLogs = [];
let appAuth = { isLoggedIn: false, username: 'admin' };
let isSyncingWithCloud = false;

// Initialize Data Store (with automatic purge of legacy sample/demo data)
function initDataStore() {
    // Check if legacy sample data needs to be purged from localStorage
    const hasClearedSample = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED);
    if (!hasClearedSample) {
        localStorage.removeItem(STORAGE_KEYS.BOOKS);
        localStorage.removeItem(STORAGE_KEYS.STUDENTS);
        localStorage.removeItem(STORAGE_KEYS.BORROWINGS);
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        localStorage.setItem(STORAGE_KEYS.SAMPLE_CLEARED, 'true');
    }

    // Load Settings
    const localSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (localSettings) {
        try {
            appSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localSettings));
        } catch (e) {
            appSettings = Object.assign({}, DEFAULT_SETTINGS);
        }
    } else {
        appSettings = Object.assign({}, DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    }

    // Load Books (Starts empty if no user data)
    const localBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (localBooks) {
        try {
            appBooks = JSON.parse(localBooks);
        } catch (e) {
            appBooks = [];
        }
    } else {
        appBooks = [];
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
    }

    // Load Students (Starts empty if no user data)
    const localStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (localStudents) {
        try {
            appStudents = JSON.parse(localStudents);
        } catch (e) {
            appStudents = [];
        }
    } else {
        appStudents = [];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appStudents));
    }

    // Load Borrowings (Starts empty if no user data)
    const localBorrowings = localStorage.getItem(STORAGE_KEYS.BORROWINGS);
    if (localBorrowings) {
        try {
            appBorrowings = JSON.parse(localBorrowings);
        } catch (e) {
            appBorrowings = [];
        }
    } else {
        appBorrowings = [];
        localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
    }

    // Load Logs
    const localLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (localLogs) {
        try {
            appActivityLogs = JSON.parse(localLogs);
        } catch (e) {
            appActivityLogs = [];
        }
    } else {
        appActivityLogs = [
            {
                timestamp: new Date().toISOString(),
                action: 'ចាប់ផ្តើមប្រព័ន្ធ',
                details: 'ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោលត្រូវបានបើកដំណើរការ',
                type: 'system',
                icon: 'power'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));
    }

    // Sync book borrowed counts from active borrowings
    recalculateBookStock();
    // Update overdue flags
    updateOverdueStatus();

    // AUTO-FETCH FROM GOOGLE SHEETS ON STARTUP (Multi-Device Live Sync)
    setupCloudSyncOnStartup();
}

// Recalculate book borrowed counts dynamically based on active borrowings
function recalculateBookStock() {
    const counts = {};
    appBooks.forEach(b => counts[b.id] = 0);

    appBorrowings.forEach(br => {
        if (Array.isArray(br.books)) {
            br.books.forEach(item => {
                if (item.status !== 'returned') {
                    counts[item.bookId] = (counts[item.bookId] || 0) + 1;
                }
            });
        }
    });

    appBooks.forEach(b => {
        b.borrowed = counts[b.id] || 0;
    });

    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
}

// Update overdue status according to today's date
function updateOverdueStatus() {
    const today = getTodayDateString();
    let hasChanges = false;

    appBorrowings.forEach(br => {
        let anyOverdue = false;
        let allReturned = true;

        if (Array.isArray(br.books)) {
            br.books.forEach(item => {
                if (item.status !== 'returned') {
                    allReturned = false;
                    if (br.dueDate < today) {
                        item.status = 'overdue';
                        anyOverdue = true;
                    } else {
                        item.status = 'borrowing';
                    }
                }
            });
        }

        const oldStatus = br.status;
        if (allReturned) {
            br.status = 'returned';
        } else if (anyOverdue) {
            br.status = 'overdue';
        } else {
            br.status = 'borrowing';
        }

        if (oldStatus !== br.status) {
            hasChanges = true;
        }
    });

    if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
    }
}

// Log System Activity and dispatch notification
function logActivity(action, details, type = 'info', icon = 'bell', triggerPush = true) {
    const logItem = {
        id: 'log_' + Date.now() + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        action,
        details,
        type,
        icon,
        unread: true
    };

    appActivityLogs.unshift(logItem);
    if (appActivityLogs.length > 150) {
        appActivityLogs = appActivityLogs.slice(0, 150);
    }

    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));

    if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
    }

    let toastType = 'primary';
    if (type === 'return' || type === 'sync') toastType = 'success';
    else if (type === 'warning' || type === 'overdue') toastType = 'warning';
    else if (type === 'danger') toastType = 'danger';

    if (typeof showToast === 'function') {
        showToast(`<strong>${action}</strong>: ${details}`, toastType);
    }

    if (triggerPush && "Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(action, {
                body: details,
                icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231e3a8a'><path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z'/></svg>"
            });
        } catch (e) {
            // Ignore push error
        }
    }

    if (getEffectiveSheetUrl()) {
        debounceCloudSync();
    }
}

// Save all data to LocalStorage with safety try-catch and cloud push
function persistAllData() {
    try {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appStudents));
        localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    } catch (e) {
        console.error('Error saving data to localStorage:', e);
        if (typeof showToast === 'function') {
            showToast('កំហុសក្នុងការរក្សាទុកទិន្នន័យក្នុង Browser! សូមពិនិត្យមើល Storage Quota', 'danger');
        }
    }

    // Automatically push to Google Sheets so every device stays synchronized
    if (getEffectiveSheetUrl()) {
        debounceCloudSync();
    }
}

// =========================================================================================
// MULTI-DEVICE GOOGLE SHEETS CLOUD SYNCHRONIZATION ENGINE
// =========================================================================================

// Debounce helper to prevent flooding Google Sheets
let syncDebounceTimer = null;
function debounceCloudSync() {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
        pushDataToGoogleSheets(true, false);
    }, 1500);
}

// Get effective Google Apps Script Web App URL (checks localStorage then APP_CONFIG.DEFAULT_SHEET_URL)
function getEffectiveSheetUrl() {
    const localUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    if (localUrl && localUrl.trim()) {
        return localUrl.trim();
    }
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.DEFAULT_SHEET_URL && APP_CONFIG.DEFAULT_SHEET_URL.trim()) {
        return APP_CONFIG.DEFAULT_SHEET_URL.trim();
    }
    return '';
}

// Validate Google Apps Script Web App URL
function validateGoogleSheetUrl(url) {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return { isValid: false, message: 'សូមបញ្ចូល URL របស់ Google Apps Script Web App' };
    }
    const cleanUrl = url.trim();

    if (cleanUrl.includes('docs.google.com/spreadsheets')) {
        return {
            isValid: false,
            message: 'លោកអ្នកបានបញ្ចូល link របស់ Google Sheet ផ្ទាល់! សូមបើក Google Sheet នោះ រួចចូល Extensions -> Apps Script -> Deploy -> New deployment -> Web app -> Who has access: Anyone រួចចម្លង Web app URL ដែលបញ្ចប់ដោយ /exec មកដាក់ទីនេះ។'
        };
    }

    if (!cleanUrl.includes('script.google.com/macros/s/')) {
        return {
            isValid: false,
            message: 'URL មិនត្រឹមត្រូវទេ! Apps Script Web App URL ត្រូវតែចាប់ផ្តើមដោយ https://script.google.com/macros/s/... ឧទាហរណ៍៖ https://script.google.com/macros/s/.../exec'
        };
    }

    if (cleanUrl.endsWith('/dev')) {
        return {
            isValid: false,
            message: 'URL នេះជា Test Deployment (/dev) ដែលទាមទារ Login គណនី! សូមជ្រើសរើស "New deployment" រួចចម្លង URL ដែលបញ្ចប់ដោយ /exec ដើម្បីឱ្យគ្រប់ឧបករណ៍អាចប្រើបាន។'
        };
    }

    return { isValid: true, cleanUrl };
}

// JSONP Fallback Engine (100% immune to browser CORS restrictions & mobile sandbox)
function fetchViaJsonp(baseUrl, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
        const callbackName = 'gas_jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        const script = document.createElement('script');
        let timer = null;

        window[callbackName] = function (data) {
            cleanup();
            resolve(data);
        };

        function cleanup() {
            if (timer) clearTimeout(timer);
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
            try {
                delete window[callbackName];
            } catch (e) {
                window[callbackName] = undefined;
            }
        }

        script.onerror = function () {
            cleanup();
            reject(new Error('មិនអាចតភ្ជាប់ Google Apps Script បានទេ! សូមប្រាកដថាបានកំណត់ "Who has access: Anyone" ក្នុង Deployment'));
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error('ការតភ្ជាប់លើសពេលកំណត់ (Connection Timeout 12s)'));
        }, timeoutMs);

        const sep = baseUrl.includes('?') ? '&' : '?';
        script.src = `${baseUrl}${sep}callback=${callbackName}&t=${Date.now()}`;
        document.body.appendChild(script);
    });
}

// Robust Fetch from Google Endpoint: Modern fetch with automatic JSONP fallback
async function fetchFromGoogleEndpoint(url, action = 'get') {
    const sep = url.includes('?') ? '&' : '?';
    const fetchUrl = `${url}${sep}action=${action}&t=${Date.now()}`;

    // 1. Try standard modern fetch first (without custom headers to prevent preflight OPTIONS)
    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            redirect: 'follow'
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (fetchErr) {
        console.warn('Standard fetch failed, automatically falling back to JSONP:', fetchErr);
    }

    // 2. Fallback to JSONP (Works under file:// and all CORS/mobile scenarios)
    const jsonpData = await fetchViaJsonp(`${url}${sep}action=${action}`);
    return jsonpData;
}

// Test Connection to Google Sheets Backend
async function testGoogleSheetsConnection(targetUrl) {
    const url = targetUrl || getEffectiveSheetUrl();
    const validation = validateGoogleSheetUrl(url);
    if (!validation.isValid) {
        return { success: false, message: validation.message };
    }

    try {
        const data = await fetchFromGoogleEndpoint(validation.cleanUrl, 'test');
        if (data && data.status === 'success') {
            return {
                success: true,
                message: data.message || 'បានតភ្ជាប់ Google Sheets ដោយជោគជ័យ!',
                spreadsheetName: data.spreadsheetName || 'Google Sheet Database',
                counts: data.counts || {}
            };
        } else {
            return {
                success: false,
                message: (data && data.message) ? data.message : 'ការឆ្លើយតបពី Google Sheets មិនត្រឹមត្រូវ'
            };
        }
    } catch (err) {
        return {
            success: false,
            message: 'មិនអាចតភ្ជាប់បានទេ៖ ' + err.message
        };
    }
}

// Setup Cloud Sync on Startup & Visibility changes (Multi-Device Auto Sync)
function setupCloudSyncOnStartup() {
    const url = getEffectiveSheetUrl();
    if (url && validateGoogleSheetUrl(url).isValid) {
        fetchDataFromGoogleSheets(true);
    } else {
        updateCloudSyncPill('មិនទាន់ភ្ជាប់ Google Sheets', 'offline');
    }

    // Auto-polling interval across devices (default 30 seconds)
    const intervalSec = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.AUTO_SYNC_INTERVAL_SEC) ? APP_CONFIG.AUTO_SYNC_INTERVAL_SEC : 30;
    setInterval(() => {
        const currentUrl = getEffectiveSheetUrl();
        if (currentUrl && !document.hidden && !isSyncingWithCloud) {
            fetchDataFromGoogleSheets(true);
        }
    }, intervalSec * 1000);

    // Fetch immediately when user returns to window/tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const currentUrl = getEffectiveSheetUrl();
            if (currentUrl && !isSyncingWithCloud) {
                fetchDataFromGoogleSheets(true);
            }
        }
    });
}

// Update Top App Bar Cloud Sync Pill
function updateCloudSyncPill(statusText, state = 'synced') {
    const pill = document.getElementById('cloud-sync-pill');
    const dot = document.getElementById('cloud-sync-dot');
    const text = document.getElementById('cloud-sync-text');

    if (!pill || !dot || !text) return;

    text.textContent = statusText;

    dot.className = 'sync-status-dot';
    if (state === 'syncing') {
        dot.classList.add('syncing');
        pill.style.borderColor = 'var(--primary-border)';
    } else if (state === 'synced') {
        dot.classList.add('synced');
        pill.style.borderColor = 'var(--success-border)';
    } else if (state === 'error') {
        dot.classList.add('error');
        pill.style.borderColor = 'var(--danger-border)';
    } else {
        dot.classList.add('offline');
        pill.style.borderColor = 'var(--border-color)';
    }
}

// Fetch all data from Google Sheets (Pull / GET)
async function fetchDataFromGoogleSheets(silent = false) {
    const url = getEffectiveSheetUrl();
    const validation = validateGoogleSheetUrl(url);
    if (!validation.isValid) {
        updateCloudSyncPill('មិនទាន់ភ្ជាប់ Google Sheets', 'offline');
        if (!silent && url) {
            showToast(validation.message, 'warning');
        }
        return false;
    }

    isSyncingWithCloud = true;
    updateCloudSyncPill('កំពុងទាញទិន្នន័យពី Cloud...', 'syncing');

    try {
        const data = await fetchFromGoogleEndpoint(validation.cleanUrl, 'get');

        if (data && data.status === 'success') {
            // Set Books
            if (Array.isArray(data.books)) {
                appBooks = data.books;
                localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
            }

            // Set Students
            if (Array.isArray(data.students)) {
                appStudents = data.students;
                localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appStudents));
            }

            // Set Borrowings
            if (Array.isArray(data.borrowings)) {
                appBorrowings = data.borrowings;
                localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
            }

            // Set Settings
            if (data.settings && Object.keys(data.settings).length > 0) {
                appSettings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
            }

            recalculateBookStock();
            updateOverdueStatus();

            const nowStr = new Date().toLocaleTimeString('km-KH', { hour12: false });
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, `ជោគជ័យ ម៉ោង ${nowStr}`);

            updateCloudSyncPill('បានភ្ជាប់ Google Sheets (Cloud)', 'synced');

            if (!silent) {
                showToast('បានទាញយកទិន្នន័យចុងក្រោយពី Google Sheets ដោយជោគជ័យ!', 'success');
            }

            // Refresh UI Views
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderBooksTable === 'function') renderBooksTable();
            if (typeof renderStudentsTable === 'function') renderStudentsTable();
            if (typeof renderBorrowingsTable === 'function') renderBorrowingsTable();
            if (typeof renderReportPreview === 'function') renderReportPreview();
            if (typeof updateHeaderSchoolInfo === 'function') updateHeaderSchoolInfo();
            return true;
        } else {
            throw new Error((data && data.message) ? data.message : 'ទិន្នន័យឆ្លើយតបពី Google Sheets មិនត្រឹមត្រូវ');
        }
    } catch (err) {
        console.warn('Google Sheets Fetch Error:', err);
        updateCloudSyncPill('កំហុសសមកាលកម្ម Google Sheets', 'error');
        if (!silent) {
            showToast('មិនអាចទាញយកទិន្នន័យពី Google Sheets បានទេ៖ ' + err.message, 'warning');
        }
        return false;
    } finally {
        isSyncingWithCloud = false;
    }
}

// Push all data to Google Sheets (Save / POST)
async function pushDataToGoogleSheets(silent = false, allowEmpty = false) {
    const url = getEffectiveSheetUrl();
    const validation = validateGoogleSheetUrl(url);
    if (!validation.isValid) {
        if (!silent) {
            showToast(validation.message, 'warning');
        }
        return false;
    }

    // Safety guard: Don't push empty arrays if not explicit reset, to prevent wiping cloud database
    if (!allowEmpty && appBooks.length === 0 && appStudents.length === 0 && appBorrowings.length === 0) {
        console.warn('Local database is empty. Auto-push skipped to prevent wiping cloud database.');
        return false;
    }

    isSyncingWithCloud = true;
    updateCloudSyncPill('កំពុងរក្សាទុកទៅ Google Sheets...', 'syncing');

    const payload = {
        timestamp: new Date().toISOString(),
        allowEmpty: allowEmpty,
        books: appBooks,
        students: appStudents,
        borrowings: appBorrowings,
        settings: appSettings,
        logs: appActivityLogs.slice(0, 50)
    };

    try {
        await fetch(validation.cleanUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const nowStr = new Date().toLocaleTimeString('km-KH', { hour12: false });
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, `ជោគជ័យ ម៉ោង ${nowStr}`);

        updateCloudSyncPill('បានភ្ជាប់ Google Sheets (Cloud)', 'synced');

        if (!silent) {
            showToast('បានរក្សាទុកទិន្នន័យទៅកាន់ Google Sheets រួចរាល់!', 'success');
        }
        return true;
    } catch (err) {
        console.error('Google Sheets Push Error:', err);
        updateCloudSyncPill('បរាជ័យក្នុងការរក្សាទុកទៅ Cloud', 'error');
        if (!silent) {
            showToast('បរាជ័យក្នុងការរក្សាទុកទៅកាន់ Google Sheets! សូមពិនិត្យ Webhook URL', 'danger');
        }
        return false;
    } finally {
        isSyncingWithCloud = false;
    }
}
