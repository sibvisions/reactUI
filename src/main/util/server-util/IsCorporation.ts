/**
 * Returns true, if the applayout is corporation, when window-width <= 530 and theme is basti mobile, it returns false because standard menu is displayed instead.
 * @param appLayout - the current layout sent by the server
 * @param theme - the current theme sent by the server
 */
 export function isCorporation(appLayout:string, theme:string) {
    if (appLayout === "corporation") {
        if (theme === "basti_mobile" && window.innerWidth <= 530) {
            return false;
        }
        return true;
    }
    return false;
}