/** Other imports */
import JVxLocation from "./JVxLocation";
import Size from "./Size";

/**
 * Splits up the given size and returns it as a Size object
 * @param size - the size for the component
 * @returns split up size as object 
 */
export function parseJVxSize(size:string|undefined):Size|undefined {
    if (size) {
        const sizeSplitted = size.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else
        return undefined;
}

/**
 * Splits up the given location and returns it as a JVxLocation object
 * @param location - the location for the point
 * @returns split up location (longitude, latitude) as object
 */
export function parseJVxLocation(location:string|undefined):JVxLocation|undefined {
    if (location) {
        const locationSplitted = location.split(',');
        return {latitude: parseFloat(locationSplitted[0]), longitude: parseFloat(locationSplitted[1])};
    }
    else
        return undefined;
}