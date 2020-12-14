import { ReactElement } from "react";

interface ReplaceScreenType {
    screenToReplace: string,
    screenFactory: () => ReactElement
}
export default ReplaceScreenType;