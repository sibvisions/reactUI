import { SelectFilter } from "./SelectRowRequest";

/** Interface for SetValuesRequest */
interface SetValuesRequest{
    clientId: string | undefined,
    componentId: string | undefined,
    dataProvider: string | undefined,
    columnNames: Array<string> | undefined,
    filter: SelectFilter | undefined,
    values: Array<any> | undefined
}
export default SetValuesRequest