import { ReactElement } from "react";

interface CustomScreenType {
    screenName: string,
    menuGroup: string,
    screenFactory: () => ReactElement
}
export default CustomScreenType;