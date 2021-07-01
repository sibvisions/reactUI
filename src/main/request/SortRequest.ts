import { BaseRequest } from ".";

export type SortDefinition = {
    columnName: string,
    mode: "None"|"Ascending"|"Descending"
}

interface SortRequest extends BaseRequest {
    dataProvider?: string,
    sortDefinition?: SortDefinition[]
}
export default SortRequest