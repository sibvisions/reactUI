/** React imports */
import React, {FC, ReactNode, useContext} from "react";

/** 3rd Party imports */
import {useParams} from "react-router-dom";

/** UI Imports */
import Layout from "../Layout";

/** Hook imports */
import useHomeComponents from "../../JVX/components/zhooks/useHomeComponents";
import { getScreenIdFromNavigation } from "../../JVX/components/util/GetScreenNameFromNavigation";

/** Other imports */
import { jvxContext } from "../../JVX/jvxProvider";

export interface IHome {
    libChildren?: any
}

/** Container-component for the main layout of the app, provides layout with its built react-children */
const Home: FC<IHome> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();
    /** Screens which are currently displayed by the layout can be multiple screens if there are popups */
    const homeChildren = useHomeComponents(componentId);

    return(
        <Layout libChildren={props.libChildren} screenId={getScreenIdFromNavigation(componentId, context.contentStore)}>
            {homeChildren}
        </Layout>
    )
}
export default Home