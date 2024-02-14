import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SheetsAPIClient } from './client';
import { sheets_v4 } from 'googleapis';

describe('SheetsAPIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSheets = {
    spreadsheets: {
      values: {
        append: vi.fn(),
      },
    },
  } as unknown as sheets_v4.Sheets;

  const gsheetClient = new SheetsAPIClient(mockSheets);

  describe('appendData', () => {
    it('should call append with correct parameters', async () => {
      await gsheetClient.appendData('test_sheet_id', 'test_sheet_name', 'A:B', [['test']]);
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1);
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'test_sheet_id',
        range: `test_sheet_name!A:B`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['test']],
        },
      });
    });
  });
});
