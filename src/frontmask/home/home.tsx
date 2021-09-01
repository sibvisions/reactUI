/** React imports */
import React, { FC } from "react";


/** UI Imports */
import UIManager, { IUIManagerProps } from "../UIManager";


/** Container-component for the main layout of the app, provides layout with its built react-children */
const Home: FC<{
    customAppWrapper?: IUIManagerProps["customAppWrapper"]
}> = (props) => {
    /** Screens which are currently displayed by the layout can be multiple screens if there are popups */

    return (
        <UIManager customAppWrapper={props.customAppWrapper} />
    )
}
export default Home