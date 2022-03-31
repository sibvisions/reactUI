/**
 * Checks if the component-name starts with a number, if it does, it adds an "_" before the name.
 * Returns the name adjusted if it starts with a number and default if it doesn't need to be changed.
 * @param name - the name of the component
 */
export function checkComponentName(name:string) {
    let checkedName = name;
    if (name.match(/^\d/)) {
        checkedName = "_" + name;
    }

    if (name.includes(".")) {
        checkedName = name.replaceAll(".", "");
    }

    return checkedName;
}