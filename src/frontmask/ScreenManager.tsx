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

    /** If there is a custom-display for this screen, check if there is a global and global should be shown, if true show global if false don't */
    if (context.contentStore.customDisplays.has(screenId)) {
        const customDisplay = context.contentStore.customDisplays.get(screenId)
        if (context.contentStore.customDisplays.has('global') && customDisplay?.options.global)
            return context.contentStore.customDisplays.get('global')?.display as ReactElement;
        else 
            return context.contentStore.customDisplays.get(screenId)?.display as ReactElement;
    }
    /** If there is a custom-global-display show it, if not just show the workscreen */
    else if (context.contentStore.customDisplays.has('global'))
        return context.contentStore.customDisplays.get('global')?.display as ReactElement;
    else
        return <WorkScreen forwardedRef={forwardedRef} />
}
export default ScreenManager