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

enum EditMode {
    noButtons = 0,
    clearAndOk = 1,
    startEdit = 2,
    clearAndEndEdit = 3
}

const SignaturePad:FC<ISignaturPad> = (baseProps) => {

    const [context, [props], layoutStyle,, styleClassNames] = useComponentConstants<ISignaturPad>(baseProps);
    const screenName = useMemo(() => context.contentStore.getScreenName(props.id, props.dataRow) as string, [props.id, props.dataRow]);
    const [selectedRow] = useRowSelect(screenName, props.dataRow);

    // Use image state instead of raw data from record
    const [localImageSrc, setLocalImageSrc] = useState<string | null>(null);

    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const padRef = useRef<SignaturePadLib | null>(null);

    // the currently drawed signature (for resize)
    // -> useRef instead of useState -> doesn't trigger repaint
    const drawingDataRef = useRef<any[] | null>(null);


    /** Shows signature as background image. */
    const loadBackground = (imgSrc: string | null, width: number, height: number) => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        
        // set internal pixel size (will clear canvas)
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // scale High DPI
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (imgSrc == null) {
            return;
        }

        //we render the image here as well, to fix resizing
        const img = new Image();
        img.onload = () => {
            // be sure that canvas is available after load
            if (bgCanvasRef.current === canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                //uses css size, thanks to ctx.scale above
                ctx.drawImage(img, 0, 0, width, height);
            }
        };
        img.src = imgSrc;
    };

    /** Initializes the canvas for drawing signature. */
    const initSignaturePad = (width: number, height: number) => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;

        if (padRef.current) {
            padRef.current.off();
            padRef.current = null;
        }

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);

        const pad = new SignaturePadLib(canvas, {
            penColor: context.appSettings.applicationMetaData.applicationColorScheme.value === "dark" ? "white" : "black",
            backgroundColor: "rgba(0,0,0,0)",
        });

        pad.addEventListener("beginStroke", () => {
            //add classname to remove the buttons
            if (drawCanvasRef && drawCanvasRef.current) {
                drawCanvasRef.current.parentElement?.classList.add('sigpad-drawing');
            }
        });

        pad.addEventListener("endStroke", () => {
            drawingDataRef.current = pad.toData();

            if (drawCanvasRef && drawCanvasRef.current) {
                drawCanvasRef.current.parentElement?.classList.remove('sigpad-drawing');
            }
        });

        padRef.current = pad;
    };    

    /** Clears background and signature canvas, and all states/refs. */
    const clearAll = () => {
        //shows empty background immediate -> useEffect
        setLocalImageSrc(null);
        drawingDataRef.current = null;

        const width = layoutStyle?.width ? parseInt(layoutStyle.width as string) : 400;
        const height = layoutStyle?.height ? parseInt(layoutStyle.height as string) : 200;

        initSignaturePad(width, height);
    };      

    /** Creates the image for saving the signature. */
    const exportSignature = async () => {
        //we won't save empty image as image -> handle like null
        if (padRef.current) {
            var points = padRef.current?.toData();

            if (!points || points.length == 0) {
                return null;
            }
        }

        const draw = drawCanvasRef.current;
        if (!draw) return null;

        // Use canvas size and avoids missing or not calculated layout for first time
        const actualWidth = draw.width;
        const actualHeight = draw.height;

        const out = document.createElement("canvas");
        out.width = actualWidth;
        out.height = actualHeight;

        const ctx = out.getContext("2d");
        if (!ctx) return null;

        // Draw signature with same resolution
        ctx.drawImage(draw, 0, 0);

        return out.toDataURL("image/png").replace("data:image/png;base64,", "");
    };    

    /** Detects edit mode for current state. */
    const detectEditMode = () => {
        return props.saveLock ? 
            props.saveLock === true && selectedRow?.data[props.columnName] != undefined ? 
                EditMode.noButtons 
                : 
                props.editLock !== false ?
                    EditMode.startEdit
                    :
                    EditMode.clearAndOk 
            : 
            props.editLock !== false?
                EditMode.startEdit
                :
                EditMode.clearAndOk;
    }

    const [editMode, setEditMode] = useState<EditMode>(detectEditMode());

    useDesignerUpdates("default-button");
    
    const btnBgdUpdate = useButtonBackground();
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [btnBgdUpdate]);

    useEffect(() => {
        if (selectedRow?.data && selectedRow.data[props.columnName] != undefined) {
            setLocalImageSrc("data:image/png;base64," + selectedRow.data[props.columnName]);
        } else {
            drawingDataRef.current = null;
            setLocalImageSrc(null);
        }
    }, [selectedRow, props.columnName]);

    /** Sets edit mode for current record */
    useEffect(() => {
        setEditMode(detectEditMode());
    }, [selectedRow, props.saveLock, props.editLock, props.columnName]);
    
    /** Resets flags when records is changed */
    useEffect(() => {
        drawingDataRef.current = null;
    }, [selectedRow?.index, selectedRow]);

    /** Shows signature of current record. */
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;

        const width = layoutStyle?.width ? parseInt(layoutStyle.width as string) : 400;
        const height = layoutStyle?.height ? parseInt(layoutStyle.height as string) : 200;

        // cleard-flag check is important, otherwise the canvas would be cleared after a single paint operation
        // after we cleared all with clearAll
        if (localImageSrc) {
            loadBackground(localImageSrc, width, height);
            initSignaturePad(width, height);

            // If we currently draw and resize -> keep data and show current signature
            if (drawingDataRef.current && padRef.current) {
                padRef.current.fromData(drawingDataRef.current);
            }            
        } else {
            //clear all
            loadBackground(null, width, height);

            const ctx = canvas.getContext("2d");
            if (ctx) {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                // Clear and recognize pixel ratio
                ctx.clearRect(0, 0, width * ratio, height * ratio);
            }            

            initSignaturePad(width, height);

            if (drawingDataRef.current && padRef.current) {
                padRef.current.fromData(drawingDataRef.current);
            }            
        }
    }, [layoutStyle?.width, layoutStyle?.height, props.columnName, localImageSrc]);

    /** Header buttons. */
    const getHeaderButtons = useCallback(() => {
        if (props.saveLock === true)
            return (
                <Button
                    className="rc-button no-focus no-ripple no-click"
                    icon="fas fa-lock"
                    tabIndex={-1}
                    style={{
                        position: "absolute",
                        height: "35px",
                        width: "35px",
                        top: "4px",
                        left: "4px",
                        zIndex: 3,
                        '--background': btnBgd,
                        '--hoverBackground': btnBgd
                    } as CSSProperties}
                />
            );      
    }, [btnBgd, props.saveLock]);

    /** Footer buttons. */
    const getFooterButtons = useCallback(() => {
        switch (editMode) {
            case EditMode.noButtons:
                return;

            case EditMode.startEdit:
                return (
                    <Button
                        className="rc-button"
                        icon="fas fa-pen"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        onClick={() => {
                            if (props.saveLock === true) {
                                setEditMode(EditMode.clearAndOk)
                            }
                            else {
                                if (selectedRow?.data[props.columnName] != undefined) {
                                    setEditMode(EditMode.clearAndEndEdit);
                                }
                                else {
                                    setEditMode(EditMode.clearAndOk);
                                }
                            }
                        }}
                    />
                );

            case EditMode.clearAndEndEdit:
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
                                clearAll();

                                setEditMode(EditMode.clearAndOk);
                            }}
                        />
                        <Button
                            className="rc-button"
                            icon={
                                <span style={{ display: 'inline-grid', width: '1em', height: '1em', verticalAlign: 'middle' }}>
                                    <i className="fas fa-pen" style={{ gridArea: '1/1'}}></i>
                                    <i className="fas fa-slash" style={{ gridArea: '1/1', WebkitTextStroke: '1px'}}></i>
                                </span>                                
                            }
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties}
                            onClick={async () => {
                                setEditMode(detectEditMode());
                            }}
                        />
                    </>
                );

            case EditMode.clearAndOk:
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
                                clearAll();
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

                                showTopBar(context.server.sendRequest(svReq, REQUEST_KEYWORDS.SET_VALUES).then(() => { 
                                    drawingDataRef.current = null;
                                }), context.server.topbar);
                            }}
                        />
                    </>
                );
        }
    }, [editMode, btnBgd, context.server, props.name, props.dataRow, props.columnName, props.saveLock, props.editLock, selectedRow]);

    return (
        <div className={concatClassnames("rc-signature-pad", styleClassNames)} style={{ position: "relative" }}>
            <div className="signature-header-buttons">
                {getHeaderButtons()}
            </div>

            <canvas
                ref={bgCanvasRef}
                className="sigCanvas-bg"
                style={{
                    width: layoutStyle?.width ? parseInt(layoutStyle.width as string) : 400,
                    height: layoutStyle?.height ? parseInt(layoutStyle.height as string) : 200,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 0
                }}
            />

            <canvas
                ref={drawCanvasRef}
                className="sigCanvas-draw"
                style={{
                    width: layoutStyle?.width ? parseInt(layoutStyle.width as string) : 400,
                    height: layoutStyle?.height ? parseInt(layoutStyle.height as string) : 200,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    pointerEvents: editMode != EditMode.clearAndOk ? "none" : "auto"
                }}
            />

            <div className="signature-footer-buttons">
                {getFooterButtons()}
            </div>
        </div>
    );
};

export default SignaturePad;
