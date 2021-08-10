/** Other imports */
import { MessageResponse } from ".";

/** Interface for DialogResponse */
interface DialogResponse extends MessageResponse {
    iconType: 0|1|2|3|9,
    buttonType: 4|5|6|7|8,
    resizable?: boolean,
    closable?: boolean,
    okComponentId?: string,
    notOkComponentId?: string,
    cancelComponentId?: string
}
export default DialogResponse