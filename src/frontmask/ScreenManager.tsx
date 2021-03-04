/** React imports */
import React, { FC, ReactElement, useContext } from "react";
import { useParams } from "react-router";

/** Other imports */
import { getScreenIdFromNavigation } from "../JVX/components/util/GetScreenNameFromNavigation";
import { IForwardRef } from "../JVX/IForwardRef";

/** Other imports */
import { jvxContext } from "../JVX/jvxProvider";
import WorkScreen from "./workscreen/WorkScreen";

/** Displays either CustomDisplays set by the user or the workscreen */
const ScreenManager:FC<IForwardRef> = ({forwardedRef}) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    if (context.contentStore.customDisplays.has('global'))
        return context.contentStore.customDisplays.get('global') as ReactElement;
    else if (context.contentStore.customDisplays.has(screenId))
        return context.contentStore.customDisplays.get(screenId) as ReactElement;
    else 
        return <WorkScreen forwardedRef={forwardedRef} />
}
export default ScreenManager