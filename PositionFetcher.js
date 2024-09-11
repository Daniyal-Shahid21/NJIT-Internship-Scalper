function fetchGitHubData() {
  const url = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md';
  const response = UrlFetchApp.fetch(url);
  const content = response.getContentText();
  
  // Parse the table
  const tableRows = extractTableFromMarkdown(content);

  // Have the older positions on top
  tableRows.reverse();

  // Get the Google Sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Get the most recent date
  const mostRecentDate = getMostRecentDate(sheet);

  let startRow = findLastRow(sheet) + 1;

  // Append only new rows (skip rows containing 🔒 emoji)
  tableRows.forEach(row => {
    const rowDate = parseGitHubDate(row[4]);  // Assuming the date is in column 5 of the repo table
    if (!row.includes('🔒') && (!mostRecentDate || rowDate > mostRecentDate)) {
      // Only take the first 5 columns
      const rowData = row.slice(0, 5);

      // Clean up the company name, location, and link
      rowData[0] = cleanCompanyData(rowData[0]);  // Clean company name
      rowData[2] = cleanCompanyData(rowData[2]);  // Clean location
      rowData[3] = extractLinkFromHtml(rowData[3]); // Clean link

      // Insert the new position
      sheet.getRange(startRow, 1, 1, rowData.length).setValues([rowData]);
      
      // Format the date
      sheet.getRange(startRow, 5).setNumberFormat("MM/dd/yyyy");
      
      startRow++;
    }
  });
}

// Function to get the most recent date from column E
function getMostRecentDate(sheet) {
  const dates = sheet.getRange('E:E').getValues().flat().filter(String;
  const dateObjects = dates.map(date => new Date(date)).filter(d => !isNaN(d));
  return dateObjects.length ? new Date(Math.max.apply(null, dateObjects)) : null;
}

// Function to parse GitHub date format
function parseGitHubDate(dateStr) {
  const [month, day] = dateStr.split(' ');
  const year = new Date().getFullYear();  // Current year
  return new Date(`${month} ${day}, ${year}`);
}

function cleanCompanyData(cellContent) {
  let cleanContent = cellContent.replace(/<\/?[^>]+(>|$)/g, ""); 

  cleanContent = cleanContent.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  return cleanContent;
}

function extractLinkFromHtml(cellContent) {
  const match = cellContent.match(/href="([^"]+)"/);
  return match ? match[1] : cellContent;
}

function isRowInSheet(row, sheet) {
  const existingData = sheet.getDataRange().getValues();
  return existingData.some(existingRow => {
    return existingRow.slice(0, 5).join(',') === row.slice(0, 5).join(',');
  });
}

function findLastRow(sheet) {
  const values = sheet.getRange('A:A').getValues();
  let lastRow = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0]) {
      lastRow = i + 1;
      break;
    }
  }
  return lastRow;
}

function extractTableFromMarkdown(content) {
  const lines = content.split('\n');
  
  let inTable = false;
  const tableRows = [];
  let headerRowFound = false; 

  lines.forEach(line => {
    // Detect table rows by checking for | characters (used in Markdown tables)
    if (line.includes('|')) {
      if (!headerRowFound) {
        headerRowFound = true;
        return;
      }
      
      // Ignore the table header separator (e.g. | --- | --- |)
      if (line.includes('---')) return;
      
      // Extract row data
      const row = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      tableRows.push(row);
    }
  });

  return tableRows;
}
