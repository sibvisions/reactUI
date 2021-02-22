/** React imports */
import { ReactElement } from "react";

/** Interface for CustomScreens */
interface CustomScreenType {
    screenName: string,
    menuGroup: string,
    screenFactory: () => ReactElement
}
export default CustomScreenType;