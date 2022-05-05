import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { useEventHandler, useMouseListener, usePopupMenu } from "../../../hooks"
import { ICellEditor } from "..";
import { getDecimalLength, 
         getGrouping,
         getPrimePrefix, 
         getScaleDigits, 
         sendSetValues, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize,
         handleEnterKey,
         concatClassnames,
         checkComponentName,
         getTabIndex} from "../../../util";
import { getTextAlignment } from "../../comp-props";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { NumericColumnDescription } from "../../../response";
import { IRCCellEditor } from "../CellEditorWrapper";

/** Interface for cellEditor property of NumberCellEditor */
export interface ICellEditorNumber extends ICellEditor{
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
const UIEditorNumber: FC<IEditorNumber> = (props) => {
    /** Reference for the NumberCellEditor element */
    const numberRef = useRef<InputNumber>(null);

    /** Reference for the NumberCellEditor input element */
    const numberInput = useRef<HTMLInputElement>(null);

    /** Current state value of input element */
    const [value, setValue] = useState<number|string|null>(props.selectedRow);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** Hook for MouseListener */ // @ts-ignore
    useMouseListener(props.name, numberRef.current ? numberRef.current.element : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

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

    /** Wether the value should be grouped or not */
    const useGrouping = getGrouping(props.cellEditor.numberFormat);

    /** 
     * Returns a string which will be added before the number, if there is a minimum amount of digits and the value is too small,
     * 0s will be added
     * @returns a string which will be added before the number
     */
    const prefixLength = useMemo(() => getPrimePrefix(props.cellEditor.numberFormat, props.selectedRow),
    [props.cellEditor.numberFormat, props.selectedRow]);

    /**
     * Returns the maximal length before the deciaml separator
     * @returns the maximal length before the deciaml separator
     */
    const decimalLength = useMemo(() => props.columnMetaData ? getDecimalLength((props.columnMetaData as NumericColumnDescription).precision, (props.columnMetaData as NumericColumnDescription).scale) : undefined, [props.columnMetaData]);

    const isSelectedBeforeComma = () => {
        if (numberRef.current) {
            //@ts-ignore
            return numberInput.current.selectionStart <= (value && value.toString().indexOf('.') !== -1 ? value.toString().indexOf('.') : decimalLength)
        }
        else {
            //@ts-ignore
            return false
        }
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && numberRef.current) {
            // @ts-ignore
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), numberRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow and update lastValue reference */
    useLayoutEffect(() => {
        setValue(props.selectedRow)
        lastValue.current = props.selectedRow;
    },[props.selectedRow]);

    // When the cell-editor is in a table and the passed-key is not a number set null as value. On unmount of the in-table cell-editor blur.
    useEffect(() => {
        if (props.isCellEditor && props.passedKey) {
            if (/^[0-9]$/i.test(props.passedKey)) {
                setValue(null as any)
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
    const handlePaste = (e:ClipboardEvent) => {
        if (e.clipboardData && decimalLength) {
            const pastedValue = parseInt(e.clipboardData.getData('text'));
            if (!isNaN(pastedValue)) {
                if (isSelectedBeforeComma() && (value ? value.toString().split('.')[0] : "").length + pastedValue.toString().length > decimalLength) {
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
            if (decimalLength && parseInt((value ? value.toString().split('.')[0] : "") + event.key).toString().length > decimalLength && isSelectedBeforeComma()) {
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
                    id={checkComponentName(props.name)}
                    inputRef={numberInput}
                    className={numberClassNames}
                    useGrouping={useGrouping}
                    locale={props.context.appSettings.locale}
                    prefix={prefixLength}
                    minFractionDigits={scaleDigits.minScale}
                    maxFractionDigits={scaleDigits.maxScale}
                    tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                    value={typeof value === 'string' ? parseFloat((value as string).replace(/\./g, '').replace(',', '.')) : value}
                    style={{ width: '100%', height: "100%" }}
                    inputStyle={{ 
                        ...textAlignment, 
                        ...props.cellStyle
                    }}
                    onChange={event => setValue(event.value) }
                    onFocus={props.eventFocusGained ? () => onFocusGained(props.name, props.context.server) : undefined}
                    onBlur={() => {
                        if (!props.isReadOnly) {
                            if (props.eventFocusLost) {
                                onFocusLost(props.name, props.context.server);
                            }
                            sendSetValues(props.dataRow, props.name, props.columnName, value, props.context.server, lastValue.current, props.topbar, props.rowNumber);
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
                value={typeof value === 'string' ? parseFloat((value as string).replace(/\./g, '').replace(',', '.')) : value}
                style={props.layoutStyle}
                inputStyle={{ 
                    ...textAlignment, 
                    //background: !isSysColor(editorBackground) ? editorBackground.background : undefined
                }}
                //inputClassName={isSysColor(editorBackground) ? editorBackground.name : undefined}
                onChange={event => setValue(event.value) }
                onBlur={() => sendSetValues(props.dataRow, props.name, props.columnName, value, props.context.server, lastValue.current, props.topbar, props.rowNumber)}
                disabled={props.isReadOnly}
                autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
                tooltip={props.toolTipText}
                tooltipOptions={{position: "left"}}
                placeholder={props.cellEditor_placeholder_}
            />
    )
}
export default UIEditorNumber