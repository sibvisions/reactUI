/** React imports */
import React, { FC, useContext } from "react";

/** 3rd Party imports */
import { useParams } from "react-router-dom";

/** UI Imports */
import UIManager from "../UIManager";

/** Hook imports */
import { useHomeComponents } from "../../JVX/components/zhooks";
import { getScreenIdFromNavigation } from "../../JVX/components/util";

/** Other imports */
import { jvxContext } from "../../JVX/jvxProvider";


/** Container-component for the main layout of the app, provides layout with its built react-children */
const Home: FC = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Screens which are currently displayed by the layout can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);

    //TODO the homeChildren actually never get rendered in UIManager

    return(
        <UIManager screenId={getScreenIdFromNavigation(componentId, context.contentStore)}>
            {homeChildren}
        </UIManager>
    )
}
export default Home