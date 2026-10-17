declare module "xlsx" {
  interface WorkSheet {
    [key: string]: any;
    "!cols"?: Array<{ wch?: number }>;
  }
  interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }
  interface ParseDateResult {
    y: number;
    m: number;
    d: number;
    H: number;
    M: number;
    S: number;
  }
  const SSF: {
    parse_date_code(v: number): ParseDateResult | undefined;
  };
  function read(data: any, opts?: any): WorkBook;
  const utils: {
    sheet_to_json<T>(ws: WorkSheet, opts?: any): T[];
    aoa_to_sheet(data: any[][]): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void;
  };
  function writeFile(wb: WorkBook, filename: string): void;
}
