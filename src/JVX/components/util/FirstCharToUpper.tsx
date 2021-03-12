/**
 * Returns the input string with the first char changed to upper case.
 * @param inputString - the string to change
 * @returns the input string with the first char changed to lower case
 */
 export function firstCharToUpper(inputString:string) {
    return inputString.charAt(0).toUpperCase() + inputString.slice(1);
}