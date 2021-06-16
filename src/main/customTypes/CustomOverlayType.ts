/** React imports */
import { ReactElement } from "react";

export type CustomOverlayOptions = {
    global?: boolean
}

/** Interface for ReplaceScreens */
interface CustomOverlayType {
    screen: string|string[],
    overlay: ReactElement,
    options?: CustomOverlayOptions
}
export default CustomOverlayType;