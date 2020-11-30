import JVxLocation from "./JVxLocation";
import Size from "./Size";

export function parseJVxSize(size:string|undefined):Size|undefined {
    if (size) {
        const sizeSplitted = size.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else
        return undefined;
}

export function parseJVxLocation(location:string|undefined):JVxLocation|undefined {
    if (location) {
        const locationSplitted = location.split(',');
        return {latitude: parseFloat(locationSplitted[0]), longitude: parseFloat(locationSplitted[1])};
    }
    else
        return undefined;
}