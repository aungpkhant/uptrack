import { google, sheets_v4 } from 'googleapis';
import { Credentials } from './models';

class SheetsAPIClient {
  private readonly auth: any;
  private sheets: sheets_v4.Sheets;

  constructor(private readonly credentials: Credentials) {
    const { client_email, private_key } = credentials;
    this.auth = new google.auth.JWT(client_email, undefined, private_key, [
      'https://www.googleapis.com/auth/spreadsheets',
    ]);
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
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
