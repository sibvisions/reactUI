/**
 * Returns dataProviders and their data in a Map of a component. If there are no dataproviders
 * an empty Map is returned instead.
 * @param dataProviderMap - the dataProviderMap which contains every dataProvider and the data of a screen
 * @param dataBooks - the databooks of the component
 * @returns dataProviders and their data in a Map of a component, empty Map if no dataproviders for component
 */
export function getDataProvidersOfComp(dataProviderMap:Map<string, any>|undefined, dataBooks:string[], column?:string) {
    //console.log(dataProviderMap, dataBooks)
    if (dataProviderMap !== undefined) {
        const tempMap = new Map(dataProviderMap);
        for (let [key, value] of tempMap.entries()) {
            if (!dataBooks.includes(key)) {
                tempMap.delete(key);
                continue
            }
            if (column)
                tempMap.set(key, value[column]); 
        }
        return tempMap;
    }
    return new Map();
}