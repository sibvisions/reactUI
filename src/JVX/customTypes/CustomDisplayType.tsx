/** React imports */
import { ReactElement } from "react";

export type CustomDisplayOptions = {
    global?: boolean
}

/** Interface for ReplaceScreens */
interface CustomDisplayType {
    screen: string|string[],
    customDisplay: ReactElement,
    options?: CustomDisplayOptions
}
export default CustomDisplayType;