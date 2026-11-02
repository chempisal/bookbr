/**
 * =========================================================================================
 * ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល - Google Apps Script Backend (Cloud Database គ្រប់ Device)
 * Textbook Stock & Borrowing Management System - Multi-Device Google Sheets Database
 * =========================================================================================
 * 
 * របៀបតម្លើង (Setup Instructions):
 * 1. បង្កើត Google Sheet ថ្មីមួយលើ Google Drive (ចូលទៅកាន់ https://sheets.new)
 * 2. ដាក់ឈ្មោះ Google Sheet ឧទាហរណ៍៖ "BookStock_Database"
 * 3. ចូលទៅកាន់ Extensions (ផ្នែកបន្ថែម) -> Apps Script
 * 4. លុបកូដចាស់ចោលទាំងអស់ រួចចម្លងកូដក្នុងឯកសារនេះទៅបិទភ្ជាប់ (Paste)
 * 5. ចុច Save (រូបថាស)
 * 6. ចុចប៊ូតុង "Deploy" (ដាក់ឱ្យប្រើប្រាស់) -> "New deployment" (ការដាក់ឱ្យប្រើប្រាស់ថ្មី)
 * 7. ចុចលើរូបស្ពឺ Select type -> ជ្រើសរើស "Web app"
 * 8. បំពេញ៖
 *    - Description: "BookStock Cloud API"
 *    - Execute as: "Me" (គណនី Gmail របស់អ្នក)
 *    - Who has access: "Anyone" (អ្នកណាក៏ដោយ - សំខាន់ណាស់!)
 * 9. ចុច "Deploy" -> ចុច "Authorize access" (ផ្តល់សិទ្ធិ) -> ជ្រើសរើស Gmail -> ចុច "Advanced" -> ចុច "Go to ... (unsafe)" -> ចុច "Allow"
 * 10. ចម្លង "Web app URL" (ដែលបញ្ចប់ដោយ /exec) យកមកបិទភ្ជាប់ក្នុងប្រព័ន្ធ BookStock (ផ្ទាំងការកំណត់ ឬក្នុង js/config.js)!
 */

// Global Sheet Tab Names
var SHEET_BOOKS = "Books";
var SHEET_STUDENTS = "Students";
var SHEET_BORROWINGS = "Borrowings";
var SHEET_SETTINGS = "Settings";
var SHEET_LOGS = "ActivityLogs";

/**
 * Handle GET Requests: Test connection or Fetch all data from Google Sheets
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);

    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "get";
    var callback = params.callback;

    // 1. Connection Health Check & Diagnostics
    if (action === "test" || action === "ping") {
      var bookCount = Math.max(0, (ss.getSheetByName(SHEET_BOOKS).getLastRow() - 1));
      var studentCount = Math.max(0, (ss.getSheetByName(SHEET_STUDENTS).getLastRow() - 1));
      var borrowCount = Math.max(0, (ss.getSheetByName(SHEET_BORROWINGS).getLastRow() - 1));

      var testResult = {
        status: "success",
        connected: true,
        message: "Google Sheets Cloud Database ត្រូវបានតភ្ជាប់ដោយជោគជ័យ!",
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        sheets: [SHEET_BOOKS, SHEET_STUDENTS, SHEET_BORROWINGS, SHEET_SETTINGS, SHEET_LOGS],
        counts: {
          books: bookCount,
          students: studentCount,
          borrowings: borrowCount
        },
        timestamp: new Date().toISOString()
      };

      return formatResponse(testResult, callback);
    }

    // 2. Fetch all data (Pull)
    var result = {
      status: "success",
      timestamp: new Date().toISOString(),
      books: readBooks(ss),
      students: readStudents(ss),
      borrowings: readBorrowings(ss),
      settings: readSettings(ss),
      logs: readLogs(ss)
    };

    return formatResponse(result, callback);

  } catch (error) {
    var errResult = {
      status: "error",
      connected: false,
      message: "កំហុសប្រព័ន្ធ Google Apps Script: " + error.toString()
    };
    var cb = e && e.parameter && e.parameter.callback;
    return formatResponse(errResult, cb);
  }
}

/**
 * Handle POST Requests: Save/Sync all changes from Client to Google Sheets
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);

    var rawContents = "";
    if (e && e.postData && e.postData.contents) {
      rawContents = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      rawContents = e.parameter.data;
    }

    if (!rawContents) {
      throw new Error("មិនមានទិន្នន័យត្រូវបានផ្ញើមកទេ (Empty Payload)");
    }

    var data = JSON.parse(rawContents);
    var allowEmpty = (data.allowEmpty === true || data.isReset === true);

    // 1. Write Books (protected against accidental wipe)
    if (data.books && Array.isArray(data.books)) {
      writeBooks(ss, data.books, allowEmpty);
    }

    // 2. Write Students (protected against accidental wipe)
    if (data.students && Array.isArray(data.students)) {
      writeStudents(ss, data.students, allowEmpty);
    }

    // 3. Write Borrowings (protected against accidental wipe)
    if (data.borrowings && Array.isArray(data.borrowings)) {
      writeBorrowings(ss, data.borrowings, allowEmpty);
    }

    // 4. Write Settings
    if (data.settings && typeof data.settings === 'object') {
      writeSettings(ss, data.settings);
    }

    // 5. Append Activity Logs
    if (data.newLogs && Array.isArray(data.newLogs)) {
      appendLogs(ss, data.newLogs);
    } else if (data.logs && Array.isArray(data.logs)) {
      writeLogs(ss, data.logs);
    }

    var result = {
      status: "success",
      message: "បានរក្សាទុក និងសមកាលកម្មទិន្នន័យទៅកាន់ Google Sheets រួចរាល់!",
      counts: {
        books: (data.books && data.books.length) || 0,
        students: (data.students && data.students.length) || 0,
        borrowings: (data.borrowings && data.borrowings.length) || 0
      },
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errResult = {
      status: "error",
      message: "បរាជ័យក្នុងការរក្សាទុកទិន្នន័យ: " + error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Format response as JSON or JSONP
 */
function formatResponse(dataObj, callback) {
  var outputText = JSON.stringify(dataObj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + outputText + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(outputText)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ensure all required Sheet Tabs exist with proper styled headers
 */
function ensureSheetsExist(ss) {
  var sheets = [
    { name: SHEET_BOOKS, headers: ["ID", "Title", "Subject", "Grade", "Quantity", "Borrowed", "Available", "LastUpdated"] },
    { name: SHEET_STUDENTS, headers: ["ID", "Name", "Gender", "Grade", "Class", "Phone", "Note", "LastUpdated"] },
    { name: SHEET_BORROWINGS, headers: ["ID", "StudentID", "StudentName", "Grade", "Class", "BorrowDate", "DueDate", "Status", "BooksJSON", "Note", "LastUpdated"] },
    { name: SHEET_SETTINGS, headers: ["Key", "Value", "Description"] },
    { name: SHEET_LOGS, headers: ["Timestamp", "Action", "Details", "Type", "DeviceTime"] }
  ];

  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      var headerRange = sheet.getRange(1, 1, 1, s.headers.length);
      headerRange.setBackground("#1e3a8a")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setFontFamily("Arial");
      sheet.setFrozenRows(1);
    }
  });
}

// -------------------------------------------------------------
// READ FUNCTIONS
// -------------------------------------------------------------
function readBooks(ss) {
  var sheet = ss.getSheetByName(SHEET_BOOKS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  return rows.map(function(r) {
    return {
      id: String(r[0] || ""),
      title: String(r[1] || ""),
      subject: String(r[2] || ""),
      grade: String(r[3] || ""),
      quantity: Number(r[4]) || 0,
      borrowed: Number(r[5]) || 0
    };
  }).filter(function(b) { return b.id && b.title; });
}

function readStudents(ss) {
  var sheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  return rows.map(function(r) {
    return {
      id: String(r[0] || ""),
      name: String(r[1] || ""),
      gender: String(r[2] || "ប្រុស"),
      grade: String(r[3] || ""),
      class: String(r[4] || ""),
      phone: String(r[5] || ""),
      note: String(r[6] || "")
    };
  }).filter(function(s) { return s.id && s.name; });
}

function readBorrowings(ss) {
  var sheet = ss.getSheetByName(SHEET_BORROWINGS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  return rows.map(function(r) {
    var booksArr = [];
    try {
      if (r[8]) {
        booksArr = typeof r[8] === 'string' ? JSON.parse(r[8]) : r[8];
      }
    } catch(e) {
      booksArr = [];
    }
    return {
      id: String(r[0] || ""),
      studentId: String(r[1] || ""),
      studentName: String(r[2] || ""),
      grade: String(r[3] || ""),
      class: String(r[4] || ""),
      borrowDate: formatDateString(r[5]),
      dueDate: formatDateString(r[6]),
      status: String(r[7] || "borrowing"),
      books: Array.isArray(booksArr) ? booksArr : [],
      note: String(r[9] || "")
    };
  }).filter(function(b) { return b.id; });
}

function readSettings(ss) {
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var settings = {};
  rows.forEach(function(r) {
    if (r[0]) {
      var val = r[1];
      if (r[0] === 'loanDurationDays') val = Number(val) || 14;
      settings[r[0]] = val;
    }
  });
  return settings;
}

function readLogs(ss) {
  var sheet = ss.getSheetByName(SHEET_LOGS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var numRows = Math.min(sheet.getLastRow() - 1, 50);
  var startRow = Math.max(2, sheet.getLastRow() - numRows + 1);
  var rows = sheet.getRange(startRow, 1, numRows, 5).getValues();
  return rows.map(function(r) {
    return {
      timestamp: String(r[0] || ""),
      action: String(r[1] || ""),
      details: String(r[2] || ""),
      type: String(r[3] || "info"),
      deviceTime: String(r[4] || "")
    };
  }).reverse();
}

// -------------------------------------------------------------
// WRITE FUNCTIONS (With Protection Against Accidental Data Loss)
// -------------------------------------------------------------
function writeBooks(ss, books, allowEmpty) {
  var sheet = ss.getSheetByName(SHEET_BOOKS);
  if (!sheet) return;

  if (books.length === 0) {
    if (allowEmpty) {
      clearDataRows(sheet);
    }
    return;
  }

  clearDataRows(sheet);
  var now = new Date().toISOString();
  var rows = books.map(function(b) {
    var total = Number(b.quantity) || 0;
    var borrowed = Number(b.borrowed) || 0;
    var available = Math.max(0, total - borrowed);
    return [b.id, b.title, b.subject, b.grade, total, borrowed, available, now];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function writeStudents(ss, students, allowEmpty) {
  var sheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!sheet) return;

  if (students.length === 0) {
    if (allowEmpty) {
      clearDataRows(sheet);
    }
    return;
  }

  clearDataRows(sheet);
  var now = new Date().toISOString();
  var rows = students.map(function(s) {
    return [s.id, s.name, s.gender || "ប្រុស", s.grade, s.class, s.phone || "", s.note || "", now];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function writeBorrowings(ss, borrowings, allowEmpty) {
  var sheet = ss.getSheetByName(SHEET_BORROWINGS);
  if (!sheet) return;

  if (borrowings.length === 0) {
    if (allowEmpty) {
      clearDataRows(sheet);
    }
    return;
  }

  clearDataRows(sheet);
  var now = new Date().toISOString();
  var rows = borrowings.map(function(b) {
    var booksJson = JSON.stringify(b.books || []);
    return [
      b.id, b.studentId, b.studentName, b.grade, b.class,
      formatDateString(b.borrowDate), formatDateString(b.dueDate),
      b.status, booksJson, b.note || "", now
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  try {
    sheet.getRange(2, 9, rows.length, 1).setNumberFormat("@");
  } catch(e) {}
}

function writeSettings(ss, settings) {
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return;
  clearDataRows(sheet);
  var rows = [];
  for (var key in settings) {
    rows.push([key, settings[key], "App Setting"]);
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}

function appendLogs(ss, logs) {
  var sheet = ss.getSheetByName(SHEET_LOGS);
  if (!sheet || !logs || logs.length === 0) return;
  var rows = logs.map(function(l) {
    return [
      l.timestamp || new Date().toISOString(),
      l.action || "",
      l.details || "",
      l.type || "info",
      l.deviceTime || new Date().toLocaleString()
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
}

function writeLogs(ss, logs) {
  var sheet = ss.getSheetByName(SHEET_LOGS);
  if (!sheet) return;
  clearDataRows(sheet);
  if (!logs || logs.length === 0) return;
  var rows = logs.slice(0, 100).map(function(l) {
    return [
      l.timestamp || new Date().toISOString(),
      l.action || "",
      l.details || "",
      l.type || "info",
      l.deviceTime || new Date().toLocaleString()
    ];
  });
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function clearDataRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var yyyy = val.getFullYear();
    var mm = ("0" + (val.getMonth() + 1)).slice(-2);
    var dd = ("0" + val.getDate()).slice(-2);
    return yyyy + "-" + mm + "-" + dd;
  }
  var str = String(val).trim();
  if (str.indexOf("T") > -1) {
    return str.split("T")[0];
  }
  var match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    var m = ("0" + match[2]).slice(-2);
    var d = ("0" + match[3]).slice(-2);
    return match[1] + "-" + m + "-" + d;
  }
  return str;
}

