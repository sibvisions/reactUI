export interface RecordFormat {
    [k: string]: RecordFormatEntry;
}

export interface RecordFormatEntry {
    format: string[];
    records: number[][];
}

export default RecordFormat;