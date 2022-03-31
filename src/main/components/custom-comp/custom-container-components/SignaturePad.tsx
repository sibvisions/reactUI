import React, { FC } from "react"
import SignatureCanvas from 'react-signature-canvas'
import BaseComponent from "../../../util/types/BaseComponent"

const SignaturePad:FC<BaseComponent> = (props) => {
    return (
        <div className="rc-signature-pad" style={{ height: 200, width: 400, border: "1px solid #000" }}>
            <SignatureCanvas canvasProps={{height: 200, width: 400, className: 'sigCanvas'}} />
        </div>
    )
}
export default SignaturePad