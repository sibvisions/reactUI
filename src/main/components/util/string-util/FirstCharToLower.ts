/**
 * Returns the input string with the first char changed to lower case.
 * @param inputString - the string to change
 * @returns the input string with the first char changed to lower case
 */
export function firstCharToLower(inputString:string) {
    return inputString.charAt(0).toLowerCase() + inputString.slice(1);
}