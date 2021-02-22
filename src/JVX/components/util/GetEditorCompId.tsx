/** Other imports */
import ContentStore from "src/JVX/ContentStore";

/**
 * Returns the componentId of the screen
 * @param id - id of component
 * @param contentStore - instance of contentStore
 * @param dataRow - the dataRow/dataBook/dataProvider
 * @returns componentId of the screen
 */
export function getEditorCompId(id:string, contentStore:ContentStore, dataRow:string) {
    return id && contentStore.getComponentId(id) ? contentStore.getComponentId(id) as string : dataRow.split('/')[1];
}