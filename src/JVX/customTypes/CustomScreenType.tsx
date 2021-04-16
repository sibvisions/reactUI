/** React imports */
import { ReactElement } from "react";

/** Interface for CustomScreens */
type CustomScreenType = {
    name: string,
    screen: ReactElement,
    menuGroup: string,
    icon?: string,
    replace?: false,
} | {
    name: string,
    screen: ReactElement,
    replace: true,
}
export default CustomScreenType;