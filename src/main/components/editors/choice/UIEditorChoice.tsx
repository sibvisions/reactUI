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

import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createSetValuesRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { Tooltip } from "primereact/tooltip";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getAlignments } from "../../comp-props/GetAlignments";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import Dimension from "../../../util/types/Dimension";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { IExtendableChoiceEditor } from "../../../extend-components/editors/ExtendChoiceEditor";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import { parseIconData } from "../../comp-props/ComponentProperties";
import IconProps from "../../comp-props/IconProps";
import { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages";
import useAddLayoutStyle from "../../../hooks/style-hooks/useAddLayoutStyle";

/** Interface for cellEditor property of ChoiceCellEditor */
export interface ICellEditorChoice extends ICellEditor {
    allowedValues: Array<string | boolean>,
    defaultImageName?: string
    imageNames: Array<string>,
}

/** Interface for ChoiceCellEditor */
export interface IEditorChoice extends IRCCellEditor {
    cellEditor: ICellEditorChoice
}

/**
 * The ChoiceCellEditor displays images sent by the server which change value by 
 * being clicked different images then will be displayed and the value in the databook will be changed
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorChoice: FC<IEditorChoice & IExtendableChoiceEditor> = (props) => {
    /** Reference for the image */
    const imgRef = useRef<HTMLImageElement>(null);

    /** Reference for the wrapper element */
    const wrapRef = useRef<HTMLSpanElement>(null);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /** Extracting onLoadCallback and id from props */
    const { onLoadCallback, id } = props;

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, wrapRef.current ? wrapRef.current as HTMLElement : undefined, props.context);

    /** Returns the given value as string */
    const getValAsString = useCallback((val) => val !== undefined ? (val === null ? "null" : val.toString()) : "undefined", [])

    /** The allowed values as string */
    const stringAllowedValues = useMemo(() => props.cellEditor.allowedValues.map(val => getValAsString(val)), [props.cellEditor.allowedValues])

    /** Check if the ChoiceCellEditor only accepts two values */
    const viableAriaPressed = stringAllowedValues.length === 2 && stringAllowedValues.some(val => ['y', 'yes', 'true'].indexOf(getValAsString(val).toLowerCase()) !== -1);

    // Sets the background-color if cellFormatting is set in a cell-editor
    useLayoutEffect(() => {
        if (props.isCellEditor && wrapRef.current) {
            if (props.cellFormatting && props.colIndex !== undefined && props.cellFormatting[props.colIndex]) {
                if (props.cellFormatting[props.colIndex].background) {
                    (wrapRef.current.parentElement as HTMLElement).style.background = props.cellFormatting[props.colIndex].background as string
                }
            }
        }
    }, [props.cellFormatting])

    /**
     * Returns an object of the allowed values as key and the corresponding image as value
     */
    const validImages = useMemo(() => {
        let mergedValImg: any
        /**
         * Returns a merged object of two arrays keys for the object are taken from the first array values form the second
         * @param keys - the array which should represent the keys of the merged object
         * @param values - the array which should represent the values of the merged object
         * @returns merged object of two arrays
         */
        const mergeObject = (keys: Array<string | boolean>, values: Array<string>) => {
            let mergedObj: any = {};
            if (keys && values) {
                for (let i = 0; i < keys.length; i++) {
                    let value: string | IconProps = values[i]
                    if (value.includes("FontAwesome")) {
                        value = parseIconData(undefined, value);
                    }
                    mergedObj[getValAsString(keys[i])] = value;
                }
            }
            return mergedObj;
        }
        mergedValImg = mergeObject(stringAllowedValues, props.cellEditor.imageNames);
        return mergedValImg;
    }, [stringAllowedValues, props.cellEditor.imageNames])

    /**
     * Returns the current image value based on the props.selectedRow if there is no row selected check for a defaultimage else invalid
     */
    const currentImageValue = useMemo(() => {
        let validImage = "invalid";
        if (props.selectedRow !== undefined && props.selectedRow.data[props.columnName] !== undefined && stringAllowedValues.includes(getValAsString(props.selectedRow.data[props.columnName]))) {
            validImage = getValAsString(props.selectedRow.data[props.columnName])
        }
        else if (props.cellEditor.defaultImageName !== undefined) {
            validImage = props.cellEditor.defaultImageName;
        }
        return validImage;
    }, [props.selectedRow, validImages, props.cellEditor.defaultImageName, stringAllowedValues])

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout when the icon is a FontAwesome icon */
    useLayoutEffect(() => {
        if (onLoadCallback && imgRef.current) {
            if (validImages[currentImageValue] && validImages[currentImageValue].icon && isFAIcon(validImages[currentImageValue].icon)) {
                sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), imgRef.current, onLoadCallback)
            }
        }
    }, [onLoadCallback, id, props.image, props.preferredSize, props.maximumSize, props.minimumSize, validImages, currentImageValue]);

    /**
     * When the image is loaded, measure the image and then report its preferred-, minimum-, maximum and measured-size to the layout
     * @param event - image load event
     */
    const onChoiceLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize: Dimension = { width: 0, height: 0 }
        if (props.preferredSize) {
            const parsedSize = parsePrefSize(props.preferredSize) as Dimension
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        }
        else {
            prefSize.height = event.currentTarget.naturalHeight;
            prefSize.width = event.currentTarget.naturalWidth;
        }

        if (imgRef.current) {
            imgRef.current.style.setProperty('--choiceMinW', `${event.currentTarget.naturalWidth}px`);
            imgRef.current.style.setProperty('--choiceMinH', `${event.currentTarget.naturalHeight}px`);
        }

        if (onLoadCallback) {
            sendOnLoadCallback(id, props.cellEditor.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    /** Adds the layoutstyle to given element */
    useAddLayoutStyle(wrapRef.current, props.layoutStyle, onLoadCallback);

    /**
     * Send a sendValues request with the next value to the server
     */
    const setNextValue = () => {
        const doSendSetValues = () => {
            if (!props.isReadOnly) {
                const setValReq = createSetValuesRequest();
                setValReq.componentId = props.name;
                setValReq.columnNames = [props.columnName];
                setValReq.dataProvider = props.dataRow;
    
                /** Get the index of the current image */
                const index = stringAllowedValues.indexOf(currentImageValue)
    
                /** If the index is not the last value in allowedValues, set to the next value */
                if (stringAllowedValues.length > index + 1) {
                    setValReq.values = [props.cellEditor.allowedValues[index + 1]];
                }
    
                /** If the index is the last value, set to the first value of allowedValues */
                else {
                    setValReq.values = [props.cellEditor.allowedValues[0]];
                }
    
                if (props.rowIndex !== undefined) {
                    if (props.filter && props.selectedRow.index !== undefined && props.rowIndex() !== props.selectedRow.index) {
                        setValReq.filter = props.filter()
                    }
                    setValReq.rowNumber = props.rowIndex()
                }
                showTopBar(props.context.server.sendRequest(setValReq, REQUEST_KEYWORDS.SET_VALUES), props.topbar);
            }
        }

        // Timeout of 1 in cell-editor so selectRecord gets called first
        if (props.isCellEditor) {
            setTimeout(() => {
                doSendSetValues()
            }, 1)
        }
        else {
            doSendSetValues()
        }

    }

    // If the lib user extends the ChoiceCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange({ value: currentImageValue, allowedValues: stringAllowedValues })
        }
    }, [currentImageValue, props.onChange]);

    return (
        <span
            id={!props.isCellEditor ? props.name + "-_wrapper" : ""}
            ref={wrapRef}
            className={concatClassnames(
                "rc-editor-choice",
                props.columnMetaData?.nullable === false ? "required-field" : "",
                props.focusable === false ? "no-focus-rect" : ""
            )}
            aria-label={props.ariaLabel}
            aria-pressed={viableAriaPressed ? ['y', 'yes', 'true'].indexOf(getValAsString(currentImageValue)) !== -1 : undefined}
            style={props.isCellEditor ?
                { justifyContent: alignments.ha, alignItems: alignments.va }
                :
                {
                    ...props.layoutStyle,
                    //...props.cellStyle,
                    justifyContent: alignments.ha,
                    alignItems: alignments.va,
                }
            }
            onKeyDown={(event) => {
                handleEnterKey(event, event.target, props.name, props.stopCellEditing);
                if (event.key === "Tab" && props.isCellEditor && props.stopCellEditing) {
                    props.stopCellEditing(event)
                }
                if (event.key === " ") {
                    setNextValue()
                }
            }}
            onFocus={(event) => {
                if (props.eventFocusGained) {
                    onFocusGained(props.name, props.context.server);
                }
                else {
                    if (props.isCellEditor) {
                        event.preventDefault();
                    }
                }
            }}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
            {...usePopupMenu(props)}
        >
            <Tooltip target={!props.isCellEditor ? "#" + props.name : undefined} />
            {validImages[currentImageValue] && validImages[currentImageValue].icon ?
                <i
                    ref={imgRef}
                    layoutstyle-wrapper={props.name + "-_wrapper"}
                    id={!props.isCellEditor ? props.name : undefined}
                    className={concatClassnames(
                        "rc-editor-choice-img",
                        props.isReadOnly ? "choice-read-only" : "",
                        props.style,
                        validImages[currentImageValue].icon
                    )}
                    onClick={(event) => {
                        if (props.onClick) {
                            props.onClick(event);
                        }
                        setNextValue()
                    }}
                    style={{
                        color: validImages[currentImageValue].color,
                        fontSize: validImages[currentImageValue].size?.height
                    }}
                    data-pr-tooltip={props.toolTipText}
                    data-pr-position="left"
                />
                :
                <img
                    ref={imgRef}
                    id={!props.isCellEditor ? props.name : undefined}
                    className={concatClassnames(
                        "rc-editor-choice-img",
                        props.isReadOnly ? "choice-read-only" : "",
                        props.style
                    )}
                    alt=""
                    onClick={(event) => {
                        if (props.onClick) {
                            props.onClick(event);
                        }

                        setNextValue()
                    }}
                    src={currentImageValue !== "invalid" ?
                        props.context.server.RESOURCE_URL + (currentImageValue === props.cellEditor.defaultImageName ?
                            currentImageValue
                            :
                            validImages[currentImageValue])
                        : ""
                    }
                    onLoad={onChoiceLoaded}
                    onError={onChoiceLoaded}
                    data-pr-tooltip={props.toolTipText}
                    data-pr-position="left"
                />}
        </span>
    )
}
export default UIEditorChoice