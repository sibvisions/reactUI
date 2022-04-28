import { IDataBook } from "../../contentstore/BaseContentStore";
import { IDataBook, ISelectedRow } from "../../ContentStore";

/**
 * Returns dataProviders and their data in a Map of a component. If there are no dataproviders
 * an empty Map is returned instead.
 * @param dataProviderMap - the dataProviderMap which contains every dataProvider and the data of a screen
 * @param dataBooks - the databooks of the component
 * @returns dataProviders and their data in a Map of a component, empty Map if no dataproviders for component
 */
export function getScreensData(dataProviderMap:Map<string, IDataBook>|undefined, dataBooks:string[], column?:string) {
    if (dataProviderMap !== undefined) {
        const tempMap = new Map();
        for (let [key, value] of dataProviderMap.entries()) {
            if (dataBooks.includes(key)) {
                if (column) {
                    tempMap.set(key, value.data?.get("current")[column]);
                }
                else {
                    tempMap.set(key, value.data);
                }
            }        
        }
        return tempMap;
    }
    return new Map();
}

export function getScreenSelectedRows(pMap:Map<string, IDataBook>|undefined, dataBooks:string[]): Map<string, ISelectedRow | undefined> {
    if (pMap !== undefined) {
        const tempMap = new Map();
        for (let [key, value] of pMap.entries()) {
            if (dataBooks.includes(key)) {
                tempMap.set(key, value.selectedRow);
            }
        }
        return tempMap;
    }
    return new Map();
}