interface FilterRequest {
    clientId: string,
    dataProvider: string|undefined,
    
    editorComponentId: string|undefined,
    value: string,
}
export default FilterRequest