export type SortDefinition = {
    columnName: string,
    mode: "None"|"Ascending"|"Descending"
}

interface SortRequest {
    clientId: string,
    dataProvider?: string,
    sortDefinition?: SortDefinition[]
}
export default SortRequest