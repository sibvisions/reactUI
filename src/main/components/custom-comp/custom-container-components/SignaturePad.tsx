import React, { FC, useContext } from "react"
import SignatureCanvas from 'react-signature-canvas'
import { appContext } from "../../../AppProvider"
import { concatClassnames } from "../../../util"
import BaseComponent from "../../../util/types/BaseComponent"

const SignaturePad:FC<BaseComponent> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    return (
        <div className={concatClassnames("rc-signature-pad", props.style)} style={{ height: 200, width: 400, border: "1px solid #ced4da" }}>
            <SignatureCanvas penColor={context.appSettings.applicationMetaData.applicationColorScheme.value === "dark" ? "white" : "black"} canvasProps={{height: 200, width: 400, className: 'sigCanvas'}} />
        </div>
    )
}
export default SignaturePad