/** React imports */
import { ReactElement } from "react";

/** Interface for ReplaceScreens */
interface ReplaceScreenType {
    screenToReplace: string,
    screenFactory: () => ReactElement
}
export default ReplaceScreenType;