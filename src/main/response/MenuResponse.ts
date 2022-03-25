/** Other imports */
import { ComponentResponse } from ".";

export interface BaseMenuButton {
    componentId: string,
    text: string,
    image:string,
    enabled?: boolean,
    className?: string
    action?: () => Promise<any>
}

/** Interface for serverMenuButtons */
export interface ServerMenuButtons extends BaseMenuButton {
    group: string,
    action: () => Promise<any>
}

/** Interface for ManuResponse */
interface MenuResponse extends ComponentResponse {
    entries: Array<ServerMenuButtons>
    toolBarEntries: Array<BaseMenuButton>
}
export default MenuResponse