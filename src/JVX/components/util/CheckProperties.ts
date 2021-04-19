/**
 * Returns the empty properties of the config data
 * @param confData - the config data
 * @returns empty properties of the config data
 */
export function checkEmptyConfProperties(confData:any) {
    let emptyProps:string[] = [];
    for (var key in confData) {
        if (confData[key] === null || confData[key] === "") {
            emptyProps.push(key);
        }
            
    }
    return emptyProps;
}