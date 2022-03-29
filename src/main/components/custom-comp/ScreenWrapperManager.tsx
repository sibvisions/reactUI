import React, { FC, ReactElement, useContext } from "react"
import { useParams } from "react-router";
import { appContext } from "../../AppProvider"
import { getScreenIdFromNavigation } from "../util";
import WorkScreen from "../../../application-frame/screen-management/workscreen/WorkScreen";

/** This component for global screen-wrapppers, decides wether the screen should display a screen-wrapper or just the workscreen */
const ScreenWrapperManager:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    return context.contentStore.screenWrappers.has(screenId) ? 
        context.contentStore.screenWrappers.get(screenId || "")?.wrapper as ReactElement : 
        <WorkScreen/>
}
export default ScreenWrapperManager;