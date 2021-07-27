/** Other imports */
import { BaseResponse } from ".";

export interface BaseMenuButton {
    componentId: string,
    text: string,
    image:string,
    action: () => Promise<any>
}

/** Interface for serverMenuButtons */
export interface ServerMenuButtons extends BaseMenuButton {
    group: string,
}

/** Interface for ManuResponse */
interface MenuResponse extends BaseResponse {
    componentId: string,
    entries: Array<ServerMenuButtons>
    toolBarEntries: Array<BaseMenuButton>
}
export default MenuResponse