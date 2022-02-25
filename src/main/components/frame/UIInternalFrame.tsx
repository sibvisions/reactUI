import React, { FC } from "react";
import { IWindow } from "../launcher/UIMobileLauncher";
import { useComponentConstants } from "../zhooks";

const UIInternalFrame: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    console.log(props)

    return (
        <div>Internal Frame Test</div>
    )
}
export default UIInternalFrame