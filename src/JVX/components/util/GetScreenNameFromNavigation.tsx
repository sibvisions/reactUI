/** Other imports */
import ContentStore from "../../ContentStore";

export function getScreenIdFromNavigation(navigationName:string, contentStore:ContentStore) {
    let screenId:string = navigationName;
    for (let [key, value] of contentStore.navigationNames.entries()) {
        if (value === navigationName)
            screenId = key
    }
    return screenId
}