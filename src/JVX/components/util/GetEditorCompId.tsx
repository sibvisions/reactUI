import ContentStore from "src/JVX/ContentStore";

export function getEditorCompId(id:string, contentStore:ContentStore, dataRow:string) {
    return id && contentStore.getComponentId(id) ? contentStore.getComponentId(id) as string : dataRow.split('/')[1];
}