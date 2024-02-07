import { google, sheets_v4 } from "googleapis";

class SheetsAPIClient {
  private readonly auth: any;
  private spreadsheetID: string;
  private sheetName: string;
  private sheets: sheets_v4.Sheets;

  constructor(
    private readonly credentials: any,
    spreadsheetID: string,
    sheetName: string
  ) {
    const { client_email, private_key } = credentials;
    this.auth = new google.auth.JWT(client_email, undefined, private_key, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);
    this.spreadsheetID = spreadsheetID;
    this.sheetName = sheetName;
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  async readData() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetID,
        range: `${this.sheetName}!A1:Z`,
      });
      return response.data.values;
    } catch (e) {
      const error = e as Error;
      throw new Error(`Error reading data: ${error.message}`);
    }
  }

  async writeData(data: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetID,
        range: `${this.sheetName}!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: data,
        },
      });
    } catch (e) {
      const error = e as Error;
      throw new Error(`Error writing data: ${error.message}`);
    }
  }
}
