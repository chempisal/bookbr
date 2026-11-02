/**
 * config.js - Global Configuration for BookStock System
 * ដាក់ Web App URL នៅទីនេះ ដើម្បីឱ្យគ្រប់ Device (ទូរស័ព្ទ, កុំព្យូទ័រ, Tablet) តភ្ជាប់ទៅកាន់ Google Sheet តែមួយស្វ័យប្រវត្តិ!
 */
const APP_CONFIG = {
    // ដាក់ Google Apps Script Web App URL របស់អ្នកនៅទីនេះ (បញ្ចប់ដោយ /exec)
    // ឧទាហរណ៍៖ "https://script.google.com/macros/s/AKfycbx.../exec"
    DEFAULT_SHEET_URL: "",

    // រយៈពេលទាញទិន្នន័យស្វ័យប្រវត្តិតាមវិនាទី (Auto-Fetch Polling)
    AUTO_SYNC_INTERVAL_SEC: 30,

    // ឈ្មោះប្រព័ន្ធ និងជំនាន់
    APP_NAME: "ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល - កម្ពុជា",
    VERSION: "3.2.0"
};

