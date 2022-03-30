import { DataProviderRequest } from "..";

export type SortDefinition = {
    columnName: string,
    mode: "None"|"Ascending"|"Descending"
}

interface SortRequest extends DataProviderRequest {
    sortDefinition?: SortDefinition[]
}
export default SortRequest