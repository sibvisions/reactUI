/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { getNumberSeparators, ScaleType } from "../../components/editors/number/UIEditorNumber";

/**
 * Returns true, if there is a ',' in the number format to enable grouping
 * @param numberFormat - the number format
 * @returns true or false wether there is a ',' in number format or not
 */
export function getGrouping(numberFormat:string) {
    return numberFormat.includes(',');
}

/**
 * Returns the minimum digits of a number format before the decimal separator
 * @param numberFormat - the number format 
 * @returns the minimum digits of a number format before the decimal separator
 */
export function getMinimumIntDigits(numberFormat:string) {
    return (numberFormat.split('.')[0].match(/0/g) || []).length;
}

/**
 * Returns a string of leading zeros or undefined based on the minimum digits before the decimal separator and the value
 * @param numberFormat - the number format
 * @param value - the current value of the number editor
 * @returns a string of leading zeros or undefined
 */
export function getPrimePrefix(numberFormat:string, value:any, locale: string, useGrouping: boolean) {
    const numberSeperators = getNumberSeparators(locale);
    const splitFormat = numberFormat.split('.')[0];
    let count = (splitFormat.match(/0/g) || []).length;
    let isNegative = false;
    if(value?.toString().startsWith("-")) {
        value = value.toString().slice(1);
        isNegative = true;
    }
    const valueLength = value 
        ? value.toString().includes(".") 
            ? value.split(".")[0].length 
            : value.length 
        : 1
    if (count - valueLength >= 1) {
        let string = "";
        let j = 2;
        // add leading zeros and grouping if needed
        for (let i = 0; i < count - valueLength; i++) {
            string += "0";
            if (useGrouping) {
                if (j === 2) {
                    string += numberSeperators.group;
                    j = 0;
                }
                else {
                    j++;
                }
            }
        }
        return string
    }
    return "";
}

/**
 * Returns the minimum and maximum scale digits based on the numberFormat. The maximum scale is 20
 * @param numberFormat - the number format
 */
export function getDisplayScaleDigits(numberFormat:string) {
    const splitString = numberFormat.includes('.') ? numberFormat.split('.')[1] : undefined;
    if (splitString) {
        let minScale = (splitString.match(/0/g) || []).length;
        let maxScale = (splitString.substring(splitString.lastIndexOf('0')).match(/#/g) || []).length + splitString.lastIndexOf('0') + 1;
        if (maxScale > 20) {
            maxScale = 20;
        }
        return { minScale: minScale,  maxScale: maxScale}
    }
    return { minScale: 0, maxScale: 0 }
}

/**
 * Returns the minimum and maximum amount of scaleDigits if server sends scale -1 PrimeReact maximum is 20
 * @param numberFormat - the number format
 * @param scale - the server sent scale
 */
export function getWriteScaleDigits(numberFormat:string, scale:number) {
    let count = numberFormat.includes('.') ? (numberFormat.split('.')[1].match(/0/g) || []).length : 0;
    return scale === 0 ? { minScale: 0, maxScale: 0 } : scale === -1 ? {minScale: count, maxScale: 20} : {minScale: count, maxScale: scale < count ? count : scale}
}

/**
 * Returns a formatted number using the Intl.NumberFormat.format function
 * @param numberFormat - the number format
 * @param locale - the locale as string
 * @param value - the value to format
 * @param scale - the scale
 */
export function formatNumber(numberFormat: string, locale: string, value: any, scale:number) {
    return Intl.NumberFormat(locale,
        {
            useGrouping: getGrouping(numberFormat),
            minimumIntegerDigits: getMinimumIntDigits(numberFormat),
            minimumFractionDigits: getWriteScaleDigits(numberFormat, scale).minScale,
            maximumFractionDigits: getWriteScaleDigits(numberFormat, scale).maxScale
        }).format(value);
}

/**
 * Returns the maximum length for the number editor
 * @param scaleDigits - the minimum and maximum amount of scale digits
 * @param precision - combined digits before and after the decimal separator
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
    /** If grouping is enabled add the thousand separators to the max length */
    if (grouping && returnLength)
        returnLength += Math.floor((precision - scale)/4)
    /** If there are leading zeros add them to the maximum length */
    if (minInt && returnLength)
        returnLength += minInt.length
    return returnLength
}

/**
 * Returns the deciaml length of the number editor
 * @param precision - combined digits before and after the decimal separator
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