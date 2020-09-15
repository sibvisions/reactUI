export function stringToBoolean(str) {
    switch(str.toLowerCase().trim()){
        case "true": case "yes": case "1": case "y": return true;
        case "false": case "no": case "0": case "n": case null: return false;
        default: return Boolean(str);
    }
}