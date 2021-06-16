/** React imports */
import React, { FC, ReactElement, useContext } from "react"

/** 3rd Party imports */
import { useParams } from "react-router";

/** Other imports */
import { appContext } from "../../AppProvider"
import { getScreenIdFromNavigation } from "../util";
import WorkScreen from "../../../frontmask/workscreen/WorkScreen";

/** This component for global custom overlays, decides wether the screen should display a custom overlay or just the workscreen */
const CustomOverlayManager:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    return context.contentStore.customOverlays.has(screenId) ? 
        context.contentStore.customOverlays.get(screenId || "")?.overlay as ReactElement : 
        <WorkScreen/>
}
export default CustomOverlayManager;