import { sheets_v4 } from 'googleapis';

class SheetsAPIClient {
  private readonly auth: any;
  private sheets: sheets_v4.Sheets;

  constructor(sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
  }

  async appendData(spreadsheetID: string, sheetName: string, range: string, rows: any[][]) {
    return await this.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });
  }

  async get(spreadsheetID: string, sheetName: string, range: string) {
    return await this.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetID,
      majorDimension: 'ROWS',
      range: `${sheetName}!${range}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
  }

  async update(spreadsheetID: string, sheetName: string, range: string, rows: any[][]) {
    return await this.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });
  }
}

export { SheetsAPIClient };
