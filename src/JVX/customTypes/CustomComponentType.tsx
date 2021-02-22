/** React imports */
import { ReactElement } from "react";

/** Interface for CustomComponents */
interface CustomComponentType {
    componentName: string,
    compFactory: () => ReactElement
}
export default CustomComponentType;