import { BaseRequest } from ".";

/** Interface for SaveRequest */
interface SaveRequest extends BaseRequest{
    dataProvider?: string
    onlySelected?: boolean
}
export default SaveRequest