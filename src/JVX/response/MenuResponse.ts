/** Other imports */
import { BaseResponse } from "./";

/** Interface for serverMenuButtons */
export type serverMenuButtons = {
    componentId: string,
    group: string,
    text: string,
    image: string,
    action: Function,
}

/** Interface for ManuResponse */
interface MenuResponse extends BaseResponse{
    componentId: string,
    entries: Array<serverMenuButtons>
}
export default MenuResponse