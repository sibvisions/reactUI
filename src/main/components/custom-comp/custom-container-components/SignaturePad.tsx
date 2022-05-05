import React, { FC } from "react"
import SignatureCanvas from 'react-signature-canvas'
import { concatClassnames } from "../../../util"
import BaseComponent from "../../../util/types/BaseComponent"

const SignaturePad:FC<BaseComponent> = (props) => {
    return (
        <div className={concatClassnames("rc-signature-pad", props.style)} style={{ height: 200, width: 400, border: "1px solid #000" }}>
            <SignatureCanvas canvasProps={{height: 200, width: 400, className: 'sigCanvas'}} />
        </div>
    )
}
export default SignaturePad