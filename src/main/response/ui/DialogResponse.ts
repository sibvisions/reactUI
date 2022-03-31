/** Other imports */
import { ComponentResponse, MessageResponse } from "..";

/** Interface for DialogResponse */
interface DialogResponse extends MessageResponse, ComponentResponse {
    iconType: 0|1|2|3|9|-1,
    buttonType: 4|5|6|7|8|-1,
    resizable?: boolean,
    closable?: boolean,
    okComponentId?: string,
    notOkComponentId?: string,
    cancelComponentId?: string
}
export default DialogResponse