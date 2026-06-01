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
import React, { CSSProperties, FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import SignaturePadLib from "signature_pad"
import tinycolor from "tinycolor2"
import { createSetValuesRequest } from "../../../factories/RequestFactory"
import useRowSelect from "../../../hooks/data-hooks/useRowSelect";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants"
import useButtonBackground from "../../../hooks/style-hooks/useButtonBackground"
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates"
import { concatClassnames } from "../../../util/string-util/ConcatClassnames"
import IBaseComponent from "../../../util/types/IBaseComponent"
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS"
import { showTopBar } from "../../topbar/TopBar"
import useDeviceStatus from "../../../hooks/event-hooks/useDeviceStatus"

export interface ISignaturPad extends IBaseComponent {
    dataRow:string,
    columnName:string,
    editLock?:boolean
    saveLock?:boolean
}

enum EDITLOCK_STATUS {
    LOCK = 0,
    LOCK_DELETE = 1,
    EDITING = 2,
    NO_BUTTONS = 3
}

const SignaturePad:FC<ISignaturPad> = (baseProps) => {

    const [context, [props], layoutStyle,,styleClassNames] = useComponentConstants<ISignaturPad>(baseProps);
    const screenName = useMemo(() => context.contentStore.getScreenName(props.id, props.dataRow) as string, [props.id, props.dataRow]);
    const [selectedRow] = useRowSelect(screenName, props.dataRow);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const padRef = useRef<SignaturePadLib | null>(null);

    const [saveLocked, setSaveLocked] = useState<boolean>(props.saveLock && selectedRow && selectedRow.data[props.columnName])
    const editLockEnabled = useMemo(() => props.editLock !== false, [props.editLock]);
    const [editStatus, setEditStatus] = useState<EDITLOCK_STATUS>(saveLocked ? EDITLOCK_STATUS.NO_BUTTONS : (editLockEnabled ? EDITLOCK_STATUS.LOCK : EDITLOCK_STATUS.EDITING));

    useDesignerUpdates("default-button");
    const bgdUpdate = useButtonBackground();
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [bgdUpdate]);
    const deviceStatus = useDeviceStatus(true);

    /** Setup SignaturePad */
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        // Pixelgröße setzen
        canvas.width = (layoutStyle?.width ? parseInt(layoutStyle.width as string) : 400) * ratio;
        canvas.height = (layoutStyle?.height ? parseInt(layoutStyle.height as string) : 200) * ratio;

        const ctx = canvas.getContext("2d");
        ctx?.scale(ratio, ratio);

        padRef.current = new SignaturePadLib(canvas, {
            penColor: context.appSettings.applicationMetaData.applicationColorScheme.value === "dark" ? "white" : "black"
        });

    }, [layoutStyle?.width, layoutStyle?.height]);

    /** Load signature from DB */
    useEffect(() => {
        if (!padRef.current) return;

        padRef.current.clear();

        if (selectedRow?.data[props.columnName]) {
            const base64 = "data:image/png;base64," + selectedRow.data[props.columnName];
            padRef.current.fromDataURL(base64);
        } else if (saveLocked) {
            setSaveLocked(false);
            setEditStatus(EDITLOCK_STATUS.LOCK);
        }
    }, [selectedRow]);

    /** Reload on device change */
    useEffect(() => {
        if (!padRef.current) return;

        if (selectedRow?.data[props.columnName]) {
            const base64 = "data:image/png;base64," + selectedRow.data[props.columnName];
            padRef.current.clear();
            padRef.current.fromDataURL(base64);
        }
    }, [deviceStatus]);

    /** Export helper */
    const exportSignature = async () => {
        if (!padRef.current) return "";
        return padRef.current.toDataURL("image/png").replace("data:image/png;base64,", "");
    };

    /** Footer buttons */
    const getFooterButtons = useCallback(() => {
        switch (editStatus) {
            case EDITLOCK_STATUS.NO_BUTTONS:
                return;

            case EDITLOCK_STATUS.LOCK:
                return (
                    <Button
                        className="rc-button"
                        icon="fas fa-pen"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        onClick={() => setEditStatus(EDITLOCK_STATUS.LOCK_DELETE)}
                    />
                );

            case EDITLOCK_STATUS.LOCK_DELETE:
                return (
                    <>
                        <Button
                            className="rc-button"
                            icon="fas fa-edit"
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties}
                            onClick={async () => {
                                padRef.current?.clear();
                                const svReq = createSetValuesRequest();
                                svReq.componentId = props.name;
                                svReq.dataProvider = props.dataRow;
                                svReq.editorColumnName = props.columnName;
                                svReq.columnNames = [props.columnName];
                                svReq.values = [await exportSignature()];
                                showTopBar(context.server.sendRequest(svReq, REQUEST_KEYWORDS.SET_VALUES), context.server.topbar);
                                setEditStatus(EDITLOCK_STATUS.EDITING);
                            }}
                        />
                        <Button
                            className="rc-button"
                            icon="fas fa-ban"
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties}
                            onClick={() => setEditStatus(EDITLOCK_STATUS.LOCK)}
                        />
                    </>
                );

            case EDITLOCK_STATUS.EDITING:
            default:
                return (
                    <>
                        <Button
                            className="rc-button"
                            icon="fas fa-times"
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties}
                            onClick={async () => {
                                padRef.current?.clear();
                                const svReq = createSetValuesRequest();
                                svReq.componentId = props.name;
                                svReq.dataProvider = props.dataRow;
                                svReq.editorColumnName = props.columnName;
                                svReq.columnNames = [props.columnName];
                                svReq.values = [await exportSignature()];
                                showTopBar(context.server.sendRequest(svReq, REQUEST_KEYWORDS.SET_VALUES), context.server.topbar);
                            }}
                        />
                        <Button
                            className="rc-button"
                            icon="fas fa-check"
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties}
                            onClick={async () => {
                                const svReq = createSetValuesRequest();
                                svReq.componentId = props.name;
                                svReq.dataProvider = props.dataRow;
                                svReq.editorColumnName = props.columnName;
                                svReq.columnNames = [props.columnName];
                                svReq.values = [await exportSignature()];
                                showTopBar(context.server.sendRequest(svReq, REQUEST_KEYWORDS.SET_VALUES), context.server.topbar);

                                setEditStatus(props.saveLock ? EDITLOCK_STATUS.NO_BUTTONS : EDITLOCK_STATUS.LOCK);
                                if (props.saveLock) setSaveLocked(true);
                            }}
                        />
                    </>
                );
        }
    }, [editStatus]);

    return (
        <div className={concatClassnames("rc-signature-pad", styleClassNames)}>
            {saveLocked &&
                <Button
                    className="rc-button"
                    icon="fas fa-lock"
                    tabIndex={-1}
                    style={{
                        position: "absolute",
                        height: "35px",
                        width: "35px",
                        top: "4px",
                        left: "4px",
                        '--background': btnBgd,
                        '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                    } as CSSProperties}
                />
            }

            <canvas
                ref={canvasRef}
                className={concatClassnames(
                    "sigCanvas",
                    editStatus !== EDITLOCK_STATUS.EDITING ? "signature-pad-editing-locked" : ""
                )}
                style={{
                    width: layoutStyle?.width ? parseInt(layoutStyle.width as string) : 400,
                    height: layoutStyle?.height ? parseInt(layoutStyle.height as string) : 200,
                    display: "block"
                }}
            />

            <div className="signature-buttons">
                {getFooterButtons()}
            </div>
        </div>
    );
};

export default SignaturePad;
