import React, { FC, ReactElement, useContext } from "react"
import { useParams } from "react-router";
import { jvxContext } from "../../jvxProvider"
import { getScreenIdFromNavigation } from "../util/GetScreenNameFromNavigation";
import WorkScreen from "../../../frontmask/workscreen/WorkScreen";

/** This component for global custom displays, decides wether the screen should display a custom display or just the workscreen */
const CustomDisplayManager:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    return context.contentStore.customDisplays.has(screenId) ? 
        context.contentStore.customDisplays.get(screenId || "")?.display as ReactElement : 
        <WorkScreen/>
}
export default CustomDisplayManager;