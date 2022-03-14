// Returns true if the string is a jsonstring
export function isJSONString(str:string) {
    try {
        JSON.parse(str);
    }
    catch(e) {
        return false;
    }
    return true;
}