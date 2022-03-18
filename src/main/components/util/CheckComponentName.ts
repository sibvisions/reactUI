/**
 * Checks if the component-name starts with a number, if it does, it adds an "_" before the name.
 * Returns the name adjusted if it starts with a number and default if it doesn't need to be changed.
 * @param name - the name of the component
 */
export function checkComponentName(name:string) {
    if (name.match(/^\d/)) {
        return "_" + name;
    }

    if (name.includes(".")) {
        return name.replace(".", "");
    }

    return name;
}