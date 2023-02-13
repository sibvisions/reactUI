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

import { Button } from "primereact/button"
import React, { CSSProperties, FC, useEffect, useMemo, useRef } from "react"
import SignatureCanvas from 'react-signature-canvas'
import tinycolor from "tinycolor2"
import { createSetValuesRequest } from "../../../factories/RequestFactory"
import useRowSelect from "../../../hooks/data-hooks/useRowSelect";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants"
import useButtonBackground from "../../../hooks/style-hooks/useButtonBackground"
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates"
import { concatClassnames } from "../../../util/string-util/ConcatClassnames"
import BaseComponent from "../../../util/types/BaseComponent"
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS"
import { showTopBar } from "../../topbar/TopBar"

export interface ISignaturPad extends BaseComponent {
    dataRow:string,
    columnName:string
}

/**
 * Displays a signature pad which can be used to draw or sign.
 * @param props - the properties sent by the server
 * @returns 
 */
const SignaturePad:FC<ISignaturPad> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props]] = useComponentConstants<ISignaturPad>(baseProps);

    const screenName = useMemo(() => context.contentStore.getScreenName(props.id, props.dataRow) as string, [props.id, props.dataRow]) 

    const [selectedRow] = useRowSelect(screenName, props.dataRow);

    const sigRef = useRef<any>(null);

    /** Subscribes to designer-changes so the components are updated live */
    useDesignerUpdates("default-button");

    /** Updates the button background live */
    const bgdUpdate = useButtonBackground();

    /** The button background based on the color-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [bgdUpdate]);

    const oldIndex = useRef<number>();

    useEffect(() => {
        if (sigRef.current) {
            if (selectedRow && selectedRow.data[props.columnName] && selectedRow.index !== oldIndex.current) {
                sigRef.current.clear();
                sigRef.current.fromDataURL("data:image/jpeg;base64," + selectedRow.data[props.columnName]);
                oldIndex.current = selectedRow.index;
            }
        }
    }, [selectedRow])

    return (
        <div className={concatClassnames("rc-signature-pad", props.style)} style={{ border: "1px solid #ced4da" }}>
            <SignatureCanvas
                ref={sigRef}
                penColor={context.appSettings.applicationMetaData.applicationColorScheme.value === "dark" ? "white" : "black"} 
                canvasProps={{height: 200, width: 400, className: 'sigCanvas' }}
                onBegin={() => {
                    if (sigRef.current) {
                        sigRef.current.getCanvas().parentElement.classList.add('sigpad-drawing');
                    }
                }}
                onEnd={() => {
                    if (sigRef.current && sigRef.current.getCanvas().parentElement.classList.contains('sigpad-drawing')) {
                        sigRef.current.getCanvas().parentElement.classList.remove('sigpad-drawing')
                    }
                }}/>
            <div className="signature-buttons">
                <Button
                    className="rc-button" 
                    icon="fas fa-times"
                    style={{
                        '--background': btnBgd,
                        '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                    } as CSSProperties}
                    onClick={() => {
                        if (sigRef.current) {
                            sigRef.current.clear();
                            const svReq = createSetValuesRequest();
                            svReq.componentId = props.name;
                            svReq.dataProvider = props.dataRow;
                            svReq.editorColumnName = props.columnName;
                            svReq.columnNames = [props.columnName];
                            svReq.values = [sigRef.current.toDataURL("image/png").replace("data:image/png;base64,", "")];
                            showTopBar(context.server.sendRequest(svReq, REQUEST_KEYWORDS.SET_VALUES), topbar)
                        }
                    }} />
                <Button
                    className="rc-button" 
                    icon="fas fa-check"
                    style={{
                        '--background': btnBgd,
                        '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                    } as CSSProperties}
                    onClick={() => {
                        if (sigRef.current) {
                            const svReq = createSetValuesRequest();
                            svReq.componentId = props.name;
                            svReq.dataProvider = props.dataRow;
                            svReq.editorColumnName = props.columnName;
                            svReq.columnNames = [props.columnName];
                            svReq.values = [sigRef.current.toDataURL("image/png").replace("data:image/png;base64,", "")];
                            showTopBar(context.server.sendRequest(svReq, REQUEST_KEYWORDS.SET_VALUES), topbar);
                        }
                    }} />
            </div>
        </div>
    )
}
export default SignaturePad