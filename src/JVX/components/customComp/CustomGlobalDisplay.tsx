import React, { FC, useContext, useLayoutEffect } from "react";
import { jvxContext } from "../../jvxProvider";

const CustomGlobalDisplay:FC = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    return (
        <div>just a test</div>
    )

}
export default CustomGlobalDisplay