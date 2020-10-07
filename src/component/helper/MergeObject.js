export function mergeObject(keys, values) {
    let mergedObj = {};
    for (let i = 0; i < keys.length; i++) {
        mergedObj[keys[i]] = values[i];
    }    
    return mergedObj;
}