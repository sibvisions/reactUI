/** Other imports */
import { ScaleType } from "../editors/number/UIEditorNumber";

/**
 * Returns true, if there is a ',' in the number format to enable grouping
 * @param numberFormat - the number format
 * @returns true or false wether there is a ',' in number format or not
 */
export function getGrouping(numberFormat:string) {
    return numberFormat.includes(',');
}

/**
 * Returns the minimum digits of a number format before the decimal seperator
 * @param numberFormat - the number format 
 * @returns the minimum digits of a number format before the decimal seperator
 */
export function getMinimumIntDigits(numberFormat:string) {
    return (numberFormat.split('.')[0].match(/0/g) || []).length;
}

/**
 * Returns a string of leading zeros or undefined based on the minimum digits before the decimal seperator and the value
 * @param numberFormat - the number format
 * @param value - the current value of the number editor
 * @returns a string of leading zeros or undefined
 */
export function getPrimePrefix(numberFormat:string, value:any) {
    let count = (numberFormat.split('.')[0].match(/0/g) || []).length;
    if (count - (value ? value.toString().length : 0) > 1)
        return '0'.repeat(count - (value ? value.toString().length : 0))
    else
        return undefined;
}

/**
 * Returns the minimum and maximum amount of scaleDigits if server sends scale -1 PrimeReact maximum is 20
 * @param numberFormat - the number format
 * @param scale - the server sent scale
 */
export function getScaleDigits(numberFormat:string, scale:number) {
    let count = numberFormat.includes('.') ? (numberFormat.split('.')[1].match(/0/g) || []).length : 0;
    return scale === -1 ? {minScale: count, maxScale:20} : {minScale: count, maxScale: scale}
}

/**
 * Returns the maximum length for the number editor
 * @param scaleDigits - the minimum and maximum amount of scale digits
 * @param precision - combined digits before and after the decimal seperator
 * @param scale - the server sent scale
 * @param grouping - if grouping is enabled
 * @param minInt - minimum integer digits
 * @returns the maximum length for the number editor
 */
export function getNumberLength(scaleDigits:ScaleType, precision:number, scale:number, grouping:boolean, minInt:string|undefined) {
    let returnLength:number|undefined = undefined;
    if (scaleDigits.maxScale === 0)
        returnLength = precision;
    /** If there is a ',' add it to the max length */
    else if (precision !== 0 && scale !== -1)
        returnLength = precision+1;
    /** If grouping is enabled add the thousand seperators to the max length */
    if (grouping && returnLength)
        returnLength += Math.floor((precision - scale)/4)
    /** If there are leading zeros add them to the maximum length */
    if (minInt && returnLength)
        returnLength += minInt.length
    return returnLength
}

/**
 * Returns the deciaml length of the number editor
 * @param precision - combined digits before and after the decimal seperator
 * @param scale - the server sent scale
 * @returns the deciaml length of the number editor
 */
export function getDecimalLength(precision:number, scale:number) {
    if (precision > 0) {
        return precision - scale
    }
    else {
        return undefined
    }
}