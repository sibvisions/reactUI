/** React imports */
import { ReactElement } from "react";

export type ScreenWrapperOptions = {
    global?: boolean
}

/** Interface for ScreenWrappers */
interface ScreenWrapperType {
    screen: string|string[],
    wrapper: ReactElement,
    options?: ScreenWrapperOptions
}
export default ScreenWrapperType;