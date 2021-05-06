import { SelectFilter } from "./";

/** Interface for SelectTreeRequest */
interface SelectTreeRequest {
    clientId: string,
    componentId: string | undefined,
    dataProvider: string[] | undefined,
    filter: Array<SelectFilter|null> | undefined
}
export default SelectTreeRequest