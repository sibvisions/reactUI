/** React imports */
import { ReactElement } from "react";

/** Interface for CustomScreens */
interface CustomScreenType {
    screenName: string,
    menuGroup: string,
    customScreen: ReactElement
    icon?: string
}
export default CustomScreenType;