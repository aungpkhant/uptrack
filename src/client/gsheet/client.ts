import { sheets_v4 } from 'googleapis';

class SheetsAPIClient {
  private readonly auth: any;
  private sheets: sheets_v4.Sheets;

  constructor(sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
  }

  async appendData(
    spreadsheetID: string,
    sheetName: string,
    range: string,
    rows: any[][]
  ): Promise<void> {
    await this.sheets.spreadsheets.values.append({
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
