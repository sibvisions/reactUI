/** React imports */
import React, { FC, useContext } from "react";

/** 3rd Party imports */
import { useParams } from "react-router-dom";

/** UI Imports */
import UIManager, { IUIManagerProps } from "../UIManager";

/** Hook imports */
import { useHomeComponents } from "../../main/components/zhooks";
import { getScreenIdFromNavigation } from "../../main/components/util";

/** Other imports */
import { appContext } from "../../main/AppProvider";


/** Container-component for the main layout of the app, provides layout with its built react-children */
const Home: FC<{
    customAppWrapper?: IUIManagerProps["customAppWrapper"]
}> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Screens which are currently displayed by the layout can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);

    //TODO the homeChildren actually never get rendered in UIManager

    return (
        <UIManager screenId={getScreenIdFromNavigation(componentId, context.contentStore)} customAppWrapper={props.customAppWrapper}>
            {homeChildren}
        </UIManager>
    )
}
export default Home