import { ReactElement } from "react";

interface CustomComponentType {
    componentName: string,
    compFactory: () => ReactElement
}
export default CustomComponentType;