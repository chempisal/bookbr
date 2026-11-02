/**
 * settings.js - School Profile, System Configuration, Google Sheets Cloud Sync & Data Backup
 * ការកំណត់ព័ត៌មានសាលារៀន, ការបម្រុងទុកទិន្នន័យ (Backup/Restore), និងសមកាលកម្ម Google Sheets
 */

// Initialize Settings View
function initSettingsView() {
    loadSettingsIntoForm();
    setupSettingsListeners();
}

// Load current settings into settings form inputs
function loadSettingsIntoForm() {
    document.getElementById('settings-district-office').value = appSettings.districtOffice || '';
    document.getElementById('settings-school-name').value = appSettings.schoolName || '';
    document.getElementById('settings-academic-year').value = appSettings.academicYear || '';
    document.getElementById('settings-principal-name').value = appSettings.principalName || '';
    document.getElementById('settings-librarian-name').value = appSettings.librarianName || '';
    document.getElementById('settings-loan-duration').value = appSettings.loanDurationDays || 14;
    document.getElementById('settings-receipt-note').value = appSettings.receiptNote || '';

    // Google Sheets settings
    const webhookUrl = getEffectiveSheetUrl();
    const autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) !== 'false';
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'មិនទាន់សមកាលកម្ម';

    const webhookInput = document.getElementById('settings-sheet-url');
    const autoSyncInput = document.getElementById('settings-sheet-auto');
    const lastSyncLabel = document.getElementById('settings-sheet-last-sync');

    if (webhookInput) webhookInput.value = webhookUrl;
    if (autoSyncInput) autoSyncInput.checked = autoSync;
    if (lastSyncLabel) lastSyncLabel.textContent = lastSync;
}

// Setup Event Listeners for Settings
function setupSettingsListeners() {
    const schoolForm = document.getElementById('school-profile-form');
    if (schoolForm) {
        schoolForm.addEventListener('submit', handleSaveSchoolProfile);
    }

    const sheetsForm = document.getElementById('sheets-sync-form');
    if (sheetsForm) {
        sheetsForm.addEventListener('submit', handleSaveSheetsConfig);
    }

    const backupBtn = document.getElementById('backup-json-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', exportFullBackupJSON);
    }

    const restoreInput = document.getElementById('restore-json-input');
    if (restoreInput) {
        restoreInput.addEventListener('change', handleRestoreJSON);
    }

    // Clear all data button
    const clearBtn = document.getElementById('reset-demo-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearAllData);
    }

    // Load sample demo data button
    const loadDemoBtn = document.getElementById('load-demo-data-btn');
    if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', handleLoadDemoData);
    }

    // Test Google Sheets Connection button
    const testConnBtn = document.getElementById('test-sheets-conn-btn');
    if (testConnBtn) {
        testConnBtn.addEventListener('click', handleTestSheetsConnection);
    }

    const sheetUrlInput = document.getElementById('settings-sheet-url');
    if (sheetUrlInput) {
        sheetUrlInput.addEventListener('input', () => {
            const alertBox = document.getElementById('sheets-conn-alert');
            if (alertBox) alertBox.style.display = 'none';
        });
    }

    // Pull Button (Fetch from Google Sheets)
    const pullSheetsBtn = document.getElementById('pull-sheets-now-btn');
    if (pullSheetsBtn) {
        pullSheetsBtn.addEventListener('click', () => {
            fetchDataFromGoogleSheets(false);
        });
    }

    // Push Button (Save to Google Sheets)
    const pushSheetsBtn = document.getElementById('sync-sheets-now-btn');
    if (pushSheetsBtn) {
        pushSheetsBtn.addEventListener('click', () => {
            pushDataToGoogleSheets(false, false);
        });
    }

    // Show Google Apps Script Code modal button
    const viewScriptBtn = document.getElementById('view-apps-script-btn');
    if (viewScriptBtn) {
        viewScriptBtn.addEventListener('click', openAppsScriptGuideModal);
    }

    const changePwForm = document.getElementById('change-password-form');
    if (changePwForm) {
        changePwForm.addEventListener('submit', handleChangePassword);
    }
}

// Save School Profile Settings
function handleSaveSchoolProfile(e) {
    e.preventDefault();

    appSettings.districtOffice = document.getElementById('settings-district-office').value.trim();
    appSettings.schoolName = document.getElementById('settings-school-name').value.trim();
    appSettings.academicYear = document.getElementById('settings-academic-year').value.trim();
    appSettings.principalName = document.getElementById('settings-principal-name').value.trim();
    appSettings.librarianName = document.getElementById('settings-librarian-name').value.trim();
    appSettings.loanDurationDays = parseInt(document.getElementById('settings-loan-duration').value, 10) || 14;
    appSettings.receiptNote = document.getElementById('settings-receipt-note').value.trim();

    persistAllData();

    // Update Top App Bar School Name
    const schoolTag = document.getElementById('topbar-school-name');
    if (schoolTag) schoolTag.textContent = appSettings.schoolName;

    const librarianLabel = document.getElementById('sidebar-user-name');
    if (librarianLabel) librarianLabel.textContent = appSettings.librarianName || 'បណ្ណារក្ស';

    logActivity('កែប្រែព័ត៌មានសាលា', `បានរក្សាទុកព័ត៌មានសាលារៀន "${appSettings.schoolName}"`, 'system', 'settings');
    renderReportPreview();
}

// Test Google Sheets Connection and diagnose issues
async function handleTestSheetsConnection() {
    const input = document.getElementById('settings-sheet-url');
    const alertBox = document.getElementById('sheets-conn-alert');
    const btn = document.getElementById('test-sheets-conn-btn');
    const url = (input ? input.value : '').trim() || getEffectiveSheetUrl();

    if (!alertBox) return;

    if (!url) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;"><i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i> សូមបញ្ចូល Web App URL</div>
                <div style="margin-top: 4px; font-size: 12.5px;">សូមបញ្ចូល Google Apps Script Web App URL ឬកំណត់ក្នុង <code>js/config.js</code> ជាមុនសិន។</div>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const validation = validateGoogleSheetUrl(url);
    if (!validation.isValid) {
        alertBox.style.display = 'block';
        alertBox.innerHTML = `
            <div style="background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;"><i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i> ទម្រង់ URL មិនត្រឹមត្រូវ</div>
                <div style="margin-top: 4px; font-size: 12.5px; line-height: 1.6;">${validation.message}</div>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="refresh-cw" class="animate-spin" style="width: 14px; height: 14px;"></i> <span>កំពុងតេស្ត...</span>`;
    }

    alertBox.style.display = 'block';
    alertBox.innerHTML = `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px; border-radius: 8px;">
            <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="refresh-cw" class="animate-spin" style="width: 15px; height: 15px;"></i>
                <span>កំពុងផ្ញើសញ្ញាតេស្តទៅកាន់ Google Apps Script...</span>
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();

    try {
        const result = await testGoogleSheetsConnection(validation.cleanUrl);
        if (result.success) {
            alertBox.innerHTML = `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 8px;">
                    <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                        <span>ការតភ្ជាប់ជោគជ័យ ១០០%!</span>
                    </div>
                    <div style="margin-top: 6px; font-size: 12.5px; line-height: 1.6;">
                        • មូលដ្ឋានទិន្នន័យ៖ <strong>${result.spreadsheetName}</strong><br>
                        • សៀវភៅក្នុង Cloud៖ <strong>${toKhmerNumber(result.counts.books || 0)}</strong> ក្បាល | សិស្ស៖ <strong>${toKhmerNumber(result.counts.students || 0)}</strong> នាក់ | ប្រតិបត្តិការខ្ចី៖ <strong>${toKhmerNumber(result.counts.borrowings || 0)}</strong><br>
                        • គ្រប់ឧបករណ៍ទាំងអស់ (ទូរស័ព្ទ, កុំព្យូទ័រ, Tablet) អាចប្រើប្រាស់ និងសមកាលកម្មទិន្នន័យរួមគ្នាបានភ្លាមៗ!
                    </div>
                </div>`;
            showToast('ការតភ្ជាប់ទៅកាន់ Google Sheets ជោគជ័យ!', 'success');
        } else {
            alertBox.innerHTML = `
                <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px;">
                    <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="x-circle" style="width: 16px; height: 16px;"></i>
                        <span>ការតភ្ជាប់បរាជ័យ</span>
                    </div>
                    <div style="margin-top: 6px; font-size: 12.5px; line-height: 1.6;">${result.message}</div>
                </div>`;
            showToast('ការតភ្ជាប់បរាជ័យ! សូមពិនិត្យព័ត៌មានក្នុងប្រអប់ដំណឹង', 'danger');
        }
    } catch (e) {
        alertBox.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px;">
                <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
                    <span>កំហុសប្រព័ន្ធ</span>
                </div>
                <div style="margin-top: 6px; font-size: 12.5px;">${e.message}</div>
            </div>`;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="wifi"></i> <span>តេស្តតភ្ជាប់</span>`;
        }
        if (window.lucide) lucide.createIcons();
    }
}

// Save Google Sheets Sync Config
async function handleSaveSheetsConfig(e) {
    e.preventDefault();
    const url = document.getElementById('settings-sheet-url').value.trim();
    const auto = document.getElementById('settings-sheet-auto').checked;

    if (url) {
        const validation = validateGoogleSheetUrl(url);
        if (!validation.isValid) {
            const alertBox = document.getElementById('sheets-conn-alert');
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.innerHTML = `
                    <div style="background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 8px;">
                        <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;"><i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i> ទម្រង់ URL មិនត្រឹមត្រូវ</div>
                        <div style="margin-top: 4px; font-size: 12.5px; line-height: 1.6;">${validation.message}</div>
                    </div>`;
                if (window.lucide) lucide.createIcons();
            }
            showToast(validation.message, 'warning');
            return;
        }
        localStorage.setItem(STORAGE_KEYS.SHEET_URL, validation.cleanUrl);
    } else {
        localStorage.removeItem(STORAGE_KEYS.SHEET_URL);
    }

    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, auto ? 'true' : 'false');

    logActivity('ការកំណត់ Cloud Sync', `បានរក្សាទុក Google Sheets URL (${auto ? 'ស្វ័យប្រវត្តិ' : 'ដោយដៃ'})`, 'sync', 'cloud');
    showToast('បានរក្សាទុកការកំណត់ Google Sheets រួចរាល់!', 'success');

    if (url) {
        handleTestSheetsConnection();
        fetchDataFromGoogleSheets(false);
    } else {
        updateCloudSyncPill('មិនទាន់ភ្ជាប់ Google Sheets', 'offline');
    }
}

// Copy Google Apps Script code to clipboard
function copyAppsScriptSnippet() {
    const scriptPath = "google-apps-script/Code.gs";
    fetch(scriptPath)
        .then(r => r.text())
        .then(txt => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(txt).then(() => {
                    showToast('បានចម្លងកូដ Google Apps Script ទៅកាន់ Clipboard រួចរាល់!', 'success');
                });
            } else {
                showToast('លោកអ្នកអាចបើកមើលឯកសារ google-apps-script/Code.gs ដោយផ្ទាល់', 'primary');
            }
        })
        .catch(() => {
            showToast('លោកអ្នកអាចបើកមើលឯកសារ google-apps-script/Code.gs ដោយផ្ទាល់', 'primary');
        });
}

// Open Google Apps Script Modal Guide
function openAppsScriptGuideModal() {
    const modal = document.getElementById('apps-script-guide-modal');
    if (modal) {
        modal.classList.add('active');
        if (window.lucide) lucide.createIcons();
    }
}

// Export Full Database as JSON Backup
function exportFullBackupJSON() {
    const backupData = {
        exportDate: new Date().toISOString(),
        version: '3.0.0',
        school: appSettings,
        books: appBooks,
        students: appStudents,
        borrowings: appBorrowings,
        logs: appActivityLogs
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BookStock_Backup_${(appSettings.schoolName || 'school').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    logActivity('បម្រុងទុកទិន្នន័យ JSON', 'បានទាញយកឯកសារបម្រុងទុកមូលដ្ឋានទិន្នន័យពេញលេញ (JSON)', 'system', 'download');
}

// Restore Database from JSON
function handleRestoreJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('ការស្តារទិន្នន័យឡើងវិញ នឹងជំនួសទិន្នន័យបច្ចុប្បន្នទាំងអស់! តើលោកអ្នកពិតជាចង់បន្តមែនទេ?')) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data.books) || !Array.isArray(data.students) || !Array.isArray(data.borrowings)) {
                throw new Error('ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវ!');
            }

            appBooks = data.books;
            appStudents = data.students;
            appBorrowings = data.borrowings;
            if (data.school) {
                appSettings = Object.assign({}, DEFAULT_SETTINGS, data.school);
            }
            if (data.logs && Array.isArray(data.logs)) {
                appActivityLogs = data.logs;
                localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));
            }

            persistAllData();
            recalculateBookStock();
            updateOverdueStatus();

            loadSettingsIntoForm();
            renderDashboard();
            renderBooksTable();
            renderStudentsTable();
            renderBorrowingsTable();
            renderReportPreview();

            logActivity('ស្តារទិន្នន័យឡើងវិញ', 'បានស្តារទិន្នន័យប្រព័ន្ធពីឯកសារ JSON ដោយជោគជ័យ', 'system', 'upload');
        } catch (err) {
            console.error(err);
            showToast('មិនអាចស្តារទិន្នន័យបានទេ! ឯកសារមិនត្រឹមត្រូវ', 'danger');
        }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
}

// Load realistic demo data for instant testing
function handleLoadDemoData() {
    if (confirm('តើលោកអ្នកចង់ផ្ទុកទិន្នន័យគំរូសៀវភៅ និងសិស្សស្តង់ដារកម្ពុជាដើម្បីសាកល្បងប្រព័ន្ធមែនទេ?')) {
        const demo = getSampleDemoData();
        appBooks = demo.books;
        appStudents = demo.students;
        appBorrowings = demo.borrowings;

        persistAllData();
        recalculateBookStock();
        updateOverdueStatus();

        loadSettingsIntoForm();
        renderDashboard();
        renderBooksTable();
        renderStudentsTable();
        renderBorrowingsTable();
        renderReportPreview();

        logActivity('ផ្ទុកទិន្នន័យគំរូ', 'បានផ្ទុកទិន្នន័យគំរូសៀវភៅ និងសិស្សស្តង់ដារកម្ពុជាដោយជោគជ័យ', 'system', 'database');
        showToast('បានផ្ទុកទិន្នន័យគំរូសាកល្បងដោយជោគជ័យ! លោកអ្នកអាចសាកល្បងមុខងារទាំងអស់បានភ្លាមៗ', 'success');
    }
}

// Clear all data from system (Clean slate)
function handleClearAllData() {
    if (confirm('តើលោកអ្នកពិតជាចង់សម្អាត និងលុបទិន្នន័យទាំងអស់ (សៀវភៅ, សិស្ស, និងការខ្ចី-សង) ចេញពីប្រព័ន្ធមែនទេ? ទិន្នន័យទាំងអស់នឹងចាប់ផ្តើមជាទទេស្អាត!')) {
        const hasCloud = getEffectiveSheetUrl();
        const alsoClearCloud = hasCloud && confirm('តើលោកអ្នកចង់សម្អាតទិន្នន័យក្នុង Google Sheets Cloud Database ផងដែរទេ? (ជ្រើស OK ដើម្បីលុប Cloud ផង ឬ Cancel ដើម្បីលុបតែក្នុងម៉ាស៊ីននេះ)');

        appBooks = [];
        appStudents = [];
        appBorrowings = [];
        appActivityLogs = [];

        persistAllData();
        recalculateBookStock();
        updateOverdueStatus();

        loadSettingsIntoForm();
        renderDashboard();
        renderBooksTable();
        renderStudentsTable();
        renderBorrowingsTable();
        renderReportPreview();

        if (alsoClearCloud) {
            pushDataToGoogleSheets(false, true);
        }

        logActivity('សម្អាតទិន្នន័យ', 'បានសម្អាត និងលុបទិន្នន័យទាំងអស់ចេញពីប្រព័ន្ធ', 'warning', 'trash-2');
        showToast('បានសម្អាតទិន្នន័យទាំងអស់រួចរាល់! ប្រព័ន្ធចាប់ផ្តើមជាទទេស្អាត', 'success');
    }
}

// Change Librarian Password
function handleChangePassword(e) {
    e.preventDefault();
    const oldPw = document.getElementById('old-password').value;
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('confirm-password').value;

    const currentSavedPw = localStorage.getItem('tb_librarian_password') || '123456';

    if (oldPw !== currentSavedPw) {
        showToast('លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!', 'danger');
        return;
    }

    if (newPw.length < 4) {
        showToast('លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោច ៤ តួ!', 'warning');
        return;
    }

    if (newPw !== confirmPw) {
        showToast('លេខសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ!', 'danger');
        return;
    }

    localStorage.setItem('tb_librarian_password', newPw);
    document.getElementById('change-password-form').reset();
    logActivity('ប្តូរលេខសម្ងាត់', 'បានផ្លាស់ប្តូរលេខសម្ងាត់គណនីបណ្ណារក្សដោយជោគជ័យ', 'system', 'key');
}
