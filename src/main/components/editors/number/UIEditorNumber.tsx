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
import { InputNumber } from "./PrimeReactInputNumber";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getTextAlignment } from "../../comp-props/GetAlignments";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { formatNumber, getDecimalLength, getDisplayScaleDigits, getGrouping, getPrimePrefix, getWriteScaleDigits } from "../../../util/component-util/NumberProperties";
import { NumericColumnDescription } from "../../../response/data/MetaDataResponse";
import useEventHandler from "../../../hooks/event-hooks/useEventHandler";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import { sendSetValues } from "../../../util/server-util/SendSetValues";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { IExtendableNumberEditor } from "../../../extend-components/editors/ExtendNumberEditor";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
import { classNames } from "primereact/utils";
import bigDecimal from "js-big-decimal"

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
 * Returns the number separator for the given locale
 * @param locale - the locale
 */
export function getNumberSeparators(locale: string) {
    const numberWithDecimalSeparator = 100000.1;
    const parts = Intl.NumberFormat(locale).formatToParts(numberWithDecimalSeparator);
    return { decimal: parts.find(part => part.type === 'decimal')!.value, group: parts.find(part => part.type === 'group')!.value};
}

export function getPrefix(numberFormat:string, data: any, isNumberRenderer:boolean, locale: string, useGrouping: boolean) {
    if (numberFormat.startsWith('0') || numberFormat.startsWith('#')) {
        return getPrimePrefix(numberFormat, data, locale, useGrouping);
    }
    else if (!numberFormat.startsWith('0') && !numberFormat.startsWith('#')) {
        const indexHash = numberFormat.indexOf('#');
        const index0 = numberFormat.indexOf('0');
        const indexPeriod = numberFormat.indexOf('.');
        if (indexPeriod !== 0) {
            if (indexHash < index0) {
                return numberFormat.replaceAll("'", '').substring(0, indexHash) + (getPrimePrefix(numberFormat, data, locale, useGrouping) && !isNumberRenderer ? getPrimePrefix(numberFormat, data, locale, useGrouping) : "");
            }
            else if (index0 < indexHash) {
                return numberFormat.replaceAll("'", '').substring(0, index0) + (getPrimePrefix(numberFormat, data, locale, useGrouping) && !isNumberRenderer ? getPrimePrefix(numberFormat, data, locale, useGrouping) : "");
            }
        }
    }
    return ""
}

export function getSuffix(numberFormat:string, locale: string, scale?:number) {
    const numberSeperators = getNumberSeparators(locale)
    if (!numberFormat.endsWith('0') && !numberFormat.endsWith('#')) {
        if (numberFormat.endsWith(".")) {
            return numberSeperators.decimal;
        }
        else if (numberFormat.includes(".") && scale === 0) {
            return numberSeperators.decimal + numberFormat.split(".")[1];
        }
        const indexHash = numberFormat.lastIndexOf('#');
        const index0 = numberFormat.lastIndexOf('0');
        if (indexHash > index0) {
            return numberFormat.replaceAll("'", '').substring(indexHash + 1)
        }
        else if (index0 > indexHash) {
            return numberFormat.replaceAll("'", '').substring(index0 + 1)
        }
    }
    else if (numberFormat.endsWith('0') && numberFormat.includes(".") && scale === 0) {
        const displayScaleDigits = getDisplayScaleDigits(numberFormat);
        let suffix = numberSeperators.decimal;
        for (let i = 0; i < displayScaleDigits.maxScale; i++) {
            suffix += "0"
        }
        return suffix;
    }
    return ""
}

function replaceGroupAndDecimal(value: string, numberSeperators: { decimal: string, group: string }) {
    return value.replaceAll(numberSeperators.group, '').replaceAll(numberSeperators.decimal, '.')
}

export function getNumberValueAsString (value: any, numberFormat: string) {
    const displayScaleDigits = getDisplayScaleDigits(numberFormat);
    let valueToReturn = typeof value === "number" ? value.toString() : value;
    if (valueToReturn !== null && valueToReturn !== undefined && valueToReturn.includes(".")) {
        const splitValue = value.split(".");
        if (splitValue[1].length < displayScaleDigits.minScale) {
            valueToReturn = new bigDecimal(value).round(displayScaleDigits.minScale).getValue();
        }
        else if (splitValue[1].length > displayScaleDigits.maxScale) {
            valueToReturn = new bigDecimal(value).round(displayScaleDigits.maxScale).getValue();
        }
    }
    return valueToReturn;
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

    const checkSelectedRow = () => {
        return props.selectedRow && (props.selectedRow.data[props.columnName] !== undefined && props.selectedRow.data[props.columnName] !== null);
    }

    /** Current state value of input element */
    const [value, setValue] = useState<string|null|undefined>(checkSelectedRow() ? getNumberValueAsString(props.selectedRow.data[props.columnName], props.cellEditor.numberFormat) : undefined);

    /** True, if the user has changed the value */
    const startedEditing = useRef<boolean>(false);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** Hook for MouseListener */ // @ts-ignore
    useMouseListener(props.name, numberRef.current ? numberRef.current.element : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, numberInput.current as HTMLElement|undefined, props.context);

    // The number seperator for the given locale
    const numberSeperators = getNumberSeparators(props.context.appSettings.locale);

    /**
     * Returns the number without numberseperators
     * @param value - the number which needs to be parsed
     */
    const parseNumber = (value: string) => {
        return parseFloat(replaceGroupAndDecimal(value, numberSeperators));
    }

    /** The popup-menu of the ImageViewer */
    const popupMenu = usePopupMenu(props);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates("inputfield");

    /** The classnames for the number-cell-editor */
    const numberClassNames = useMemo(() => {
        return classNames(
            "rc-editor-number",
            props.columnMetaData?.nullable === false ? "required-field" : "",
            props.isCellEditor ? "open-cell-editor" : undefined,
            props.focusable === false ? "no-focus-rect" : "",
            props.isReadOnly ? "rc-input-readonly" : "",
            props.borderVisible === false ? "invisible-border" : "",
            props.styleClassNames
        )
    }, [props.columnMetaData?.nullable]);



    /** 
    * Returns the minimum and maximum scaledigits for the NumberCellEditor
    * @returns the minimum and maximum scaledigits for the NumberCellEditor
    */
    const writeScaleDigits:ScaleType = useMemo(() => props.columnMetaData && (props.columnMetaData as NumericColumnDescription).scale !== 0
        ? getWriteScaleDigits(props.cellEditor.numberFormat, (props.columnMetaData as NumericColumnDescription).scale) 
        : {minScale: 0, maxScale: 0}, 
    [props.columnMetaData, props.cellEditor.numberFormat]);

    /** Whether the value should be grouped or not */
    const useGrouping = getGrouping(props.cellEditor.numberFormat);

    /** 
     * Returns a string which will be added before the number, if there is a minimum amount of digits and the value is too small,
     * 0s will be added
     * @returns a string which will be added before the number
     */
    const prefix = useMemo(() => getPrefix(props.cellEditor.numberFormat, props.selectedRow && props.selectedRow.data[props.columnName] !== undefined ? getNumberValueAsString(props.selectedRow.data[props.columnName], props.cellEditor.numberFormat) : undefined, false, props.context.appSettings.locale, useGrouping), [props.cellEditor.numberFormat, props.selectedRow, useGrouping]);

    /** Returns a string which will be added behind the number, based on the numberFormat */
    const suffix = useMemo(() => getSuffix(props.cellEditor.numberFormat, props.context.appSettings.locale, props.columnMetaData ? (props.columnMetaData as NumericColumnDescription).scale : undefined), [props.cellEditor.numberFormat]);

    /**
     * Returns the maximal length before the decimal separator
     * @returns the maximal length before the decimal separator
     */
    const decimalLength = useMemo(() => props.columnMetaData ? getDecimalLength((props.columnMetaData as NumericColumnDescription).precision, (props.columnMetaData as NumericColumnDescription).scale) : undefined, [props.columnMetaData]);

    /** Returns true if the caret is before the comma */
    const isSelectedBeforeComma = (value: string) => {
        if (numberInput.current) {
            //@ts-ignore
            return numberInput.current.selectionStart <= (value && value.toString().indexOf(numberSeperators.decimal) !== -1 ? value.toString().indexOf(numberSeperators.decimal) : decimalLength)
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

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        designerUpdate,
        //@ts-ignore
        numberRef.current ? numberRef.current.element : undefined,
        props.layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback
        ),
        onLoadCallback
    );

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow */
    useLayoutEffect(() => {
        setValue(checkSelectedRow() ? getNumberValueAsString(props.selectedRow.data[props.columnName], props.cellEditor.numberFormat) : undefined);
        
    },[props.selectedRow]);

    // If the lib user extends the NumberCellEditor with onChange, call it when selectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.selectedRow && props.selectedRow.data[props.columnName] !== undefined ? getNumberValueAsString(props.selectedRow.data[props.columnName], props.cellEditor.numberFormat) : undefined)
        }
    }, [props.selectedRow, props.onChange])

    // When the cell-editor is in a table and the passed-key is not a number set null as value. On unmount of the in-table cell-editor blur.
    useEffect(() => {
        // if (props.isCellEditor && props.passedKey) {
        //     if (!/^[0-9]$/i.test(props.passedKey)) {
        //         setValue(null as any)
        //     }
        //     else {
        //         setValue(props.passedKey)
        //     }
        // }

        return () => {
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.screenName) !== -1 && numberInput.current && startedEditing.current) {
                numberInput.current.blur();
            }
        }
    }, [])

    useEffect(() => {
        if (props.columnMetaData && (props.columnMetaData as NumericColumnDescription).signed !== false) {
            if (value === "-" && numberInput.current?.value === "") {
                numberInput.current.value = "-"
            }
        }
        else {
            if (value === "-" && numberInput.current?.value === "-") {
                setValue("");
                numberInput.current.value = "";
            }
        }
    }, [value, props.columnMetaData])

    /**
     * When a value is pasted check if the value isn't too big for the max length
     * @param e - the browser event
     */
    const handlePaste = (e:any) => {
        if (e.clipboardData && decimalLength) {
            const pastedText = e.clipboardData.getData('text')
            const pastedValue = parseInt(pastedText);
            if (!isNaN(pastedValue)) {
                if (isSelectedBeforeComma(e.target.value) && e.target.value.split('.')[0].length + pastedValue.toString().length > decimalLength) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
            else if (pastedText.includes("-") && props.columnMetaData && (props.columnMetaData as NumericColumnDescription).signed === false) {
                e.stopPropagation();
                e.preventDefault();
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

            let selectedLength = 0;

            if (window.getSelection()?.toString()) {
                selectedLength = window.getSelection()!.toString().replaceAll(".", "").replaceAll(",", "").length;
            }

            // Checks if the decimal length limit is hit and when it is don't allow more inputs
            let eValue = event.target.value;

            const getDecimalValue = () => {
                if (event.key !== "Backspace" && event.key !== "-") {
                    eValue = eValue.replaceAll(numberSeperators.group, "").replaceAll(prefix, "").replaceAll(suffix, "");
                    if (event.key === "-") {
                        if (eValue.indexOf(numberSeperators.decimal) !== -1) {
                            return BigInt(event.key + eValue.slice(0, eValue.indexOf(numberSeperators.decimal)));
                        }
                        else {
                            return BigInt(event.key + eValue);
                        }
                    }
                    else {
                        if (eValue.indexOf(numberSeperators.decimal) !== -1) {
                            return BigInt(eValue.slice(0, eValue.indexOf(numberSeperators.decimal)) + event.key);
                        }
                        else {
                            return BigInt(eValue + event.key);
                        }
                    }
                }
                return parseInt(eValue + event.key);
            }

            const isExceedingDecimalLength = () => {
                return decimalLength && isSelectedBeforeComma(event.target.value) && (getDecimalValue().toString().length - selectedLength) > decimalLength && !window.getSelection()?.toString()
            }

            const isEnteringMinusWhenSigned = () => {
                return event.key === "-" && props.columnMetaData && (props.columnMetaData as NumericColumnDescription).signed === false
            }

            // const noFractionInputAllowed = () => {
            //     return !isSelectedBeforeComma(event.target.value) && writeScaleDigits.maxScale !== 0 && props.columnMetaData && (props.columnMetaData as NumericColumnDescription).scale === 0;
            // }
            
            if (isExceedingDecimalLength() || isEnteringMinusWhenSigned()) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            else if (numberInput.current && typeof value === "string" && numberInput.current.value.indexOf(value) === numberInput.current.selectionStart && event.key === "-" && props.columnMetaData && (props.columnMetaData as NumericColumnDescription).signed !== false) {
                startedEditing.current = true;
                setValue(parseFloat("-" + value.replace(numberSeperators.decimal, ".")).toString());
            }
        }
        else {
            event.stopPropagation();
        }
    });

    // TODO: It should be possible to remove this double inputnumber implementation
    return (
        (!props.isCellEditor) ?
            <span id={props.name + "-wrapper"} aria-label={props.ariaLabel} {...popupMenu} style={props.layoutStyle}>
                <InputNumber
                    ref={numberRef}
                    layoutstyle-wrapper={props.name + "-wrapper"}
                    id={props.name}
                    inputRef={numberInput}
                    className={numberClassNames}
                    useGrouping={useGrouping}
                    locale={props.context.appSettings.locale}
                    prefix={prefix}
                    suffix={suffix}
                    minFractionDigits={writeScaleDigits.minScale}
                    maxFractionDigits={writeScaleDigits.maxScale}
                    //tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                    //value={(typeof value === 'string' && value !== "-") ? parseNumber(value) : value as number | null | undefined}
                    value={value as unknown as number}
                    style={{ width: '100%', height: "100%" }}
                    inputStyle={{ 
                        ...textAlignment, 
                        ...props.cellStyle
                    }}
                    onChange={(event:any) => {
                        startedEditing.current = true;
                        if (props.onInput) {
                            props.onInput(event);
                        }

                        //@ts-ignore
                        if (event.value === "-") {
                            if (props.columnMetaData && (props.columnMetaData as NumericColumnDescription).signed !== false) {
                                setValue(event.value);
                            }
                        }
                        else if (event.value !== null) {
                            if (numberInput.current) {
                                let stringCopy = numberInput.current.value.slice();
                                stringCopy = stringCopy.replace(prefix, "").replace(suffix, "");
                                setValue(new bigDecimal(replaceGroupAndDecimal(stringCopy, numberSeperators)).getValue())
                            }
                            //setValue(event.value.toString());
                        }
                        else {
                            setValue(null)
                        }
                        

                        if (props.savingImmediate) {
                            sendSetValues(props.dataRow, props.name, props.columnName, props.columnName, event.value, props.context.server, props.topbar, props.rowNumber);
                        }
                    }}
                    onFocus={(event:any) => handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor)}
                    onBlur={(event:any) => {
                        if (!props.isReadOnly) {
                            if (props.onBlur) {
                                props.onBlur(event)
                            }
                            if (startedEditing.current) {
                                sendSetValues(
                                    props.dataRow, 
                                    props.name,
                                    props.columnName, 
                                    props.columnName, 
                                    value !== null && value !== undefined ? value : null, 
                                    props.context.server, 
                                    props.topbar,
                                    props.rowNumber
                                );
                                startedEditing.current = false;
                            }

                            if (props.eventFocusLost) {
                                onFocusLost(props.name, props.context.server);
                            }
                        }
                    }}
                    readOnly={props.isReadOnly}
                    //disabled={props.isReadOnly}
                    autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
                    tooltip={props.toolTipText}
                    tooltipOptions={{position: "left", showDelay: 800}}
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
                prefix={prefix}
                suffix={suffix}
                //tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                minFractionDigits={writeScaleDigits.minScale}
                maxFractionDigits={writeScaleDigits.maxScale}
                //value={(typeof value === 'string' && value !== "-") ? parseNumber(value) : value as number | null | undefined}
                value={value as unknown as number}
                style={props.layoutStyle}
                inputStyle={{ 
                    ...textAlignment, 
                    //background: !isSysColor(editorBackground) ? editorBackground.background : undefined
                }}
                //inputClassName={isSysColor(editorBackground) ? editorBackground.name : undefined}
                onChange={(event:any) => {
                    startedEditing.current = true;
                    //@ts-ignore
                    if (event.value === "-") {
                        if (props.columnMetaData && (props.columnMetaData as NumericColumnDescription).signed !== false) {
                            setValue(event.value);
                        }
                    }
                    else if (event.value !== null) {
                        if (numberInput.current) {
                            let stringCopy = numberInput.current.value.slice();
                            stringCopy = stringCopy.replace(prefix, "").replace(suffix, "");
                            setValue(new bigDecimal(replaceGroupAndDecimal(stringCopy, numberSeperators)).getValue())
                        }
                        //setValue(event.value.toString());
                    }
                    else {
                        setValue(null)
                    }
                    

                    if (props.savingImmediate) {
                        sendSetValues(props.dataRow, props.name, props.columnName, props.columnName, event.value, props.context.server, props.topbar, props.rowNumber);
                    }
                }}
                onBlur={() => {
                    if (startedEditing.current) {
                        sendSetValues(
                            props.dataRow, 
                            props.name, 
                            props.columnName, 
                            props.columnName, 
                            value !== null && value !== undefined ? value : null,
                            props.context.server, 
                            props.topbar, 
                            props.rowNumber
                        );
                        startedEditing.current = false;
                    }
                }}
                readOnly={props.isReadOnly}
                autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
                tooltip={props.toolTipText}
                tooltipOptions={{position: "left", showDelay: 800}}
                placeholder={props.cellEditor_placeholder_}
            />
    )
}
export default UIEditorNumber
