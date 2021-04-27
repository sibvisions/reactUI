/**
 * Returns the stringified object of the referenced column-names with null as their value
 * @param referencedColumnNames - the referenced column-names
 * @returns the stringified object of the referenced column-names with null as their value
 */
export function getSelfJoinedRootReference(referencedColumnNames:string[]) {
    return JSON.stringify(referencedColumnNames.reduce((obj:any, key:any) => {
        obj[key] = null;
        return obj
    },{}));
}