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

import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getTextAlignment } from "../../comp-props/GetAlignments";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { getDecimalLength, getGrouping, getPrimePrefix, getScaleDigits } from "../../../util/component-util/NumberProperties";
import { NumericColumnDescription } from "../../../response/data/MetaDataResponse";
import useEventHandler from "../../../hooks/event-hooks/useEventHandler";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import { sendSetValues } from "../../../util/server-util/SendSetValues";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { IExtendableNumberEditor } from "../../../extend-components/editors/ExtendNumberEditor";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";

/** Interface for cellEditor property of NumberCellEditor */
export interface ICellEditorNumber extends ICellEditor {
    numberFormat: string,
}

/** Interface for NumberCellEditor */
export interface IEditorNumber extends IRCCellEditor {
    cellEditor: ICellEditorNumber,
    length: number,
    precision: number,
    scale: number
}

/** Type for scales */
export interface ScaleType {
    minScale:number,
    maxScale:number,
}

/**
 * NumberCellEditor is an inputfield which only displays numbers, 
 * when the value is changed the databook on the server is changed
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorNumber: FC<IEditorNumber & IExtendableNumberEditor> = (props) => {
    /** Reference for the NumberCellEditor element */
    const numberRef = useRef<InputNumber>(null);

    /** Reference for the NumberCellEditor input element */
    const numberInput = useRef<HTMLInputElement>(null);

    /** Current state value of input element */
    const [value, setValue] = useState<number|string|null>(props.selectedRow ? props.selectedRow.data[props.columnName] : undefined);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** Hook for MouseListener */ // @ts-ignore
    useMouseListener(props.name, numberRef.current ? numberRef.current.element : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    useRequestFocus(id, props.requestFocus, numberInput.current as HTMLElement|undefined, props.context);

    /** The popup-menu of the ImageViewer */
    const popupMenu = usePopupMenu(props);

    /** The classnames for the number-cell-editor */
    const numberClassNames = useMemo(() => {
        return concatClassnames(
            "rc-editor-number",
            props.columnMetaData?.nullable === false ? "required-field" : "",
            props.isCellEditor ? "open-cell-editor" : undefined,
            props.focusable === false ? "no-focus-rect" : "",
            props.style
        )
    }, [props.columnMetaData?.nullable]);

    /** 
    * Returns the minimum and maximum scaledigits for the NumberCellEditor
    * @returns the minimum and maximum scaledigits for the NumberCellEditor
    */
    const scaleDigits:ScaleType = useMemo(() => props.columnMetaData 
        ? getScaleDigits(props.cellEditor.numberFormat, (props.columnMetaData as NumericColumnDescription).scale) 
        : {minScale: 0, maxScale: 0}, 
    [props.columnMetaData, props.cellEditor.numberFormat]);

    /** Whether the value should be grouped or not */
    const useGrouping = getGrouping(props.cellEditor.numberFormat);

    /** 
     * Returns a string which will be added before the number, if there is a minimum amount of digits and the value is too small,
     * 0s will be added
     * @returns a string which will be added before the number
     */
    const prefixLength = useMemo(() => getPrimePrefix(props.cellEditor.numberFormat, props.selectedRow ? props.selectedRow.data[props.columnName] : undefined),
    [props.cellEditor.numberFormat, props.selectedRow]);

    /**
     * Returns the maximal length before the deciaml separator
     * @returns the maximal length before the deciaml separator
     */
    const decimalLength = useMemo(() => props.columnMetaData ? getDecimalLength((props.columnMetaData as NumericColumnDescription).precision, (props.columnMetaData as NumericColumnDescription).scale) : undefined, [props.columnMetaData]);

    /** Returns true if the caret is before the comma */
    const isSelectedBeforeComma = (value: string) => {
        if (numberInput.current) {
            //@ts-ignore
            return numberInput.current.selectionStart <= (value && value.toString().indexOf('.') !== -1 ? value.toString().indexOf('.') : decimalLength)
        }
        else {
            return false
        }
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && numberRef.current) {
            //@ts-ignore
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), numberRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow and update lastValue reference */
    useLayoutEffect(() => {
        setValue(props.selectedRow ? props.selectedRow.data[props.columnName] : undefined)
        lastValue.current = props.selectedRow ? props.selectedRow.data[props.columnName] : undefined;
    },[props.selectedRow]);

    // If the lib user extends the NumberCellEditor with onChange, call it when selectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.selectedRow ? props.selectedRow.data[props.columnName] : undefined)
        }
    }, [props.selectedRow, props.onChange])

    // When the cell-editor is in a table and the passed-key is not a number set null as value. On unmount of the in-table cell-editor blur.
    useEffect(() => {
        if (props.isCellEditor && props.passedKey) {
            if (!/^[0-9]$/i.test(props.passedKey)) {
                setValue(null as any)
            }
            else {
                setValue(props.passedKey)
            }
        }

        return () => {
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.screenName) !== -1 && props.isCellEditor && numberInput.current) {
                numberInput.current.blur();
            }
        }
    }, [])

    /**
     * When a value is pasted check if the value isn't too big for the max length
     * @param e - the browser event
     */
    const handlePaste = (e:any) => {
        if (e.clipboardData && decimalLength) {
            const pastedValue = parseInt(e.clipboardData.getData('text'));
            if (!isNaN(pastedValue)) {
                if (isSelectedBeforeComma(e.target.value) && e.target.value.split('.')[0].length + pastedValue.toString().length > decimalLength) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            } 
        }
    }

    // Add paste eventHandler
    useEventHandler(numberInput.current ? numberInput.current : undefined, 'paste', (event:any) => handlePaste(event));

    // Add keydown eventHandler
    useEventHandler(numberInput.current ? numberInput.current : undefined, 'keydown', (event:any) => {
        // Don't allow value change on up and down arrow. Save and blur if "enter" or "tab" pressed. closed and not saved when "esc" is pressed
        if (['ArrowUp', 'ArrowDown'].indexOf(event.key) >= 0) {
            event.stopPropagation();
        }
        else if (['ArrowLeft', 'ArrowRight'].indexOf(event.key) < 0) {
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
            if (props.isCellEditor && props.stopCellEditing) {
                if ((event as KeyboardEvent).key === "Tab") {
                    (event.target as HTMLElement).blur();
                    props.stopCellEditing(event);
                }
                else if ((event as KeyboardEvent).key === "Escape") {
                    props.stopCellEditing(event);
                }
            }
            // Checks if the decimal length limit is hit and when it is don't allow more inputs
            if (decimalLength && parseInt(event.target.value + event.key).toString().length > decimalLength && isSelectedBeforeComma(event.target.value)) {
                event.preventDefault();
                return false;
            }
        }

    });

    // TODO: It should be possible to remove this double inputnumber implementation
    return (
        (!props.isCellEditor) ?
            <span aria-label={props.ariaLabel} {...popupMenu} style={props.layoutStyle}>
                <InputNumber
                    ref={numberRef}
                    id={props.name}
                    inputRef={numberInput}
                    className={numberClassNames}
                    useGrouping={useGrouping}
                    locale={props.context.appSettings.locale}
                    prefix={prefixLength}
                    minFractionDigits={scaleDigits.minScale}
                    maxFractionDigits={scaleDigits.maxScale}
                    tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                    value={(typeof value === 'string' && value !== "-") ? parseFloat((value as string).replace(/\./g, '').replace(',', '.')) : value as number | null | undefined}
                    style={{ width: '100%', height: "100%" }}
                    inputStyle={{ 
                        ...textAlignment, 
                        ...props.cellStyle
                    }}
                    onValueChange={event => {
                        if (props.onInput) {
                            props.onInput(event);
                        }
                        setValue(event.value)
                    }}
                    onFocus={props.eventFocusGained ? () => onFocusGained(props.name, props.context.server) : undefined}
                    onBlur={(event) => {
                        if (!props.isReadOnly) {
                            if (props.eventFocusLost) {
                                onFocusLost(props.name, props.context.server);
                            }

                            if (props.onBlur) {
                                props.onBlur(event)
                            }
                            sendSetValues(props.dataRow, props.name, props.columnName, typeof event.target.value === 'string' ? parseFloat((event.target.value as string).replace(/\./g, '').replace(',', '.')) : event.target.value, props.context.server, lastValue.current, props.topbar, props.rowNumber);
                        }
                    }}
                    disabled={props.isReadOnly}
                    autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
                    tooltip={props.toolTipText}
                    tooltipOptions={{position: "left"}}
                    placeholder={props.cellEditor_placeholder_}
                />
            </span>
            :
            <InputNumber
                ref={numberRef}
                inputRef={numberInput}
                className={numberClassNames}
                useGrouping={useGrouping}
                locale={props.context.appSettings.locale}
                prefix={prefixLength}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                minFractionDigits={scaleDigits.minScale}
                maxFractionDigits={scaleDigits.maxScale}
                value={(typeof value === 'string' && value !== "-") ? parseFloat((value as string).replace(/\./g, '').replace(',', '.')) : value as number | null | undefined}
                style={props.layoutStyle}
                inputStyle={{ 
                    ...textAlignment, 
                    //background: !isSysColor(editorBackground) ? editorBackground.background : undefined
                }}
                //inputClassName={isSysColor(editorBackground) ? editorBackground.name : undefined}
                onValueChange={event => setValue(event.value)}
                onBlur={(event) => sendSetValues(props.dataRow, props.name, props.columnName, typeof event.target.value === 'string' ? parseFloat((event.target.value as string).replace(/\./g, '').replace(',', '.')) : event.target.value, props.context.server, lastValue.current, props.topbar, props.rowNumber)}
                disabled={props.isReadOnly}
                autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
                tooltip={props.toolTipText}
                tooltipOptions={{position: "left"}}
                placeholder={props.cellEditor_placeholder_}
            />
    )
}
export default UIEditorNumber
