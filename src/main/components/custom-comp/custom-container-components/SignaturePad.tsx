/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useContext } from "react"
import SignatureCanvas from 'react-signature-canvas'
import { appContext } from "../../../contexts/AppProvider"
import { concatClassnames } from "../../../util/string-util/ConcatClassnames"
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