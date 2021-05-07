/** Other imports */
import ContentStore from "../../ContentStore";

/**
 * Returns the metadata of the given dataprovider
 * @param compId - the component id of the screen
 * @param dataprovider - the dataprovider of the metadata wanted
 * @param contentStore - the contentstore instance
 * @returns the metadata of the given dataprovider
 */
export function getMetaData(compId:string, dataprovider:string, contentStore:ContentStore) {
    return contentStore.dataProviderMetaData.get(compId)?.get(dataprovider);
}