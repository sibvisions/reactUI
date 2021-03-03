/** React imports */
import React, {FC, ReactElement, useContext} from "react";
import { useParams } from "react-router";

/** Other imports */
import { jvxContext } from "../../jvxProvider";
import { getScreenIdFromNavigation } from "../util/GetScreenNameFromNavigation";

const CustomDisplayScreen:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** ComponentId of Screen extracted by useParams hook */
     const { componentId } = useParams<any>();
     const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    return context.contentStore.customDisplays.get(screenId||"") as ReactElement;

}
export default CustomDisplayScreen