import BaseContentStore from "../../contentstore/BaseContentStore";

/**
 * Returns the screenId from the navigation-name
 * @param navigationName - the navigation name of the screen
 * @param contentStore - the content-store
 * @returns the screenId from the navigation-name
 */
export function getScreenIdFromNavigation(navigationName:string, contentStore:BaseContentStore) {
    let screenId:string = navigationName;
    for (let [key, value] of contentStore.navigationNames.entries()) {
        if (value === navigationName)
            screenId = key
    }
    return screenId
}