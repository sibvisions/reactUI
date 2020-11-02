export function checkProperties(obj:any) {
    let emptyProps:string[] = [];
    for (var key in obj) {
        if (obj[key] === null || obj[key] === "") {
            emptyProps.push(key);
        }
            
    }
    return emptyProps;
}