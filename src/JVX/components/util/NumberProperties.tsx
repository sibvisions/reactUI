import { ScaleType } from "../editors/number/UIEditorNumber";

export function getGrouping(numberFormat:string) {
    return numberFormat.includes(',');
}

export function getMinimumIntDigits(numberFormat:string, value:any) {
    let count = (numberFormat.split('.')[0].match(/0/g) || []).length;
    if (count - (value ? value.toString().length : 0) > 1)
        return '0'.repeat(count - (value ? value.toString().length : 0))
    else
        return undefined;
}

export function getScaleDigits(numberFormat:string, scale:number) {
    let count = numberFormat.includes('.') ? (numberFormat.split('.')[1].match(/0/g) || []).length : 0;
    return scale === -1 ? {minScale: count, maxScale:20} : {minScale: count, maxScale: scale}
}

export function getNumberLength(scaleDigits:ScaleType, precision:number, scale:number, grouping:boolean, minInt:string|undefined) {
    let returnLength:number|undefined = undefined;
    if (scaleDigits.maxScale === 0)
        returnLength = precision;
    else if (precision !== 0 && scale !== -1)
        returnLength = precision+1;
    if (grouping && returnLength)
        returnLength += Math.floor((precision - scale)/4)
    if (minInt && returnLength)
        returnLength += minInt.length
    return returnLength
}

export function getDecimalLength(precision:number, scale:number) {
    if (precision > 0)
    return precision - scale
else
    return undefined
}