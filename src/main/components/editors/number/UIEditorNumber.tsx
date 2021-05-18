/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { InputNumber } from "primereact/inputnumber";

/** Hook imports */
import { useProperties, useRowSelect, useEventHandler } from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, 
         getMetaData, 
         getDecimalLength, 
         getGrouping,
         getPrimePrefix, 
         getScaleDigits, 
         sendSetValues, 
         handleEnterKey, 
         onBlurCallback, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize} from "../../util";
import { getTextAlignment } from "../../compprops";
import { NumericColumnDescription } from "../../../response"

/** Interface for cellEditor property of NumberCellEditor */
export interface ICellEditorNumber extends ICellEditor{
    numberFormat: string,
}

/** Interface for NumberCellEditor */
export interface IEditorNumber extends IEditor {
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
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorNumber: FC<IEditorNumber> = (baseProps) => {
    /** Reference for the NumberCellEditor element */
    const numberRef = useRef<InputNumber>(null);
    /** Reference for the NumberCellEditor input element */
    const numberInput = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorNumber>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Current state value of input element */
    const [value, setValue] = useState<number>(selectedRow);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** The metadata for the NumberCellEditor */
    const cellEditorMetaData:NumericColumnDescription = getMetaData(compId, props.dataRow, context.contentStore)?.columns.find(column => column.name === props.columnName) as NumericColumnDescription;

    /** 
    * Returns the minimum and maximum scaledigits for the NumberCellEditor
    * @returns the minimum and maximum scaledigits for the NumberCellEditor
    */
    const scaleDigits:ScaleType = useMemo(() => getScaleDigits(props.cellEditor.numberFormat, cellEditorMetaData.scale),
    [cellEditorMetaData.scale, props.cellEditor.numberFormat]);

    /** Wether the value should be grouped or not */
    const useGrouping = getGrouping(props.cellEditor.numberFormat);

    /** 
     * Returns a string which will be added before the number, if there is a minimum amount of digits and the value is too small,
     * 0s will be added
     * @returns a string which will be added before the number
     */
    const prefixLength = useMemo(() => getPrimePrefix(props.cellEditor.numberFormat, selectedRow),
    [props.cellEditor.numberFormat, selectedRow]);

    /**
     * Returns the maximal length before the deciaml seperator
     * @returns the maximal length before the deciaml seperator
     */
    const decimalLength = useMemo(() => getDecimalLength(cellEditorMetaData.precision, cellEditorMetaData.scale), [cellEditorMetaData.precision, cellEditorMetaData.scale]);

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
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), numberRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useLayoutEffect(() => {
        setValue(selectedRow)
        lastValue.current = selectedRow;
    },[selectedRow]);

    /**
     * When enter is pressed "submit" the value. When the value before the comma reaches the max length, disable keyboard inputs
     * @param e - the browser event
     */
    const handleKeyDown = (e: any) => {
        handleEnterKey(e, () => sendSetValues(props.dataRow, props.name, props.columnName, selectedRow, context.server));
        if (['ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) {
            //@ts-ignore
            if (decimalLength && parseInt((value ? value.toString().split('.')[0] : "") + e.key).toString().length > decimalLength && isSelectedBeforeComma()) {
                e.preventDefault();
                return false;
            }
        }
    }

    /**
     * When a value is pasted check if the value isn't too big for the max length
     * @param e - the browser event
     */
    const handlePaste = (e:ClipboardEvent) => {
        if (e.clipboardData && decimalLength) {
            const pastedValue = parseInt(e.clipboardData.getData('text'));
            if (!isNaN(pastedValue)) {
                //@ts-ignore
                if (isSelectedBeforeComma() && (value ? value.toString().split('.')[0] : "").length + pastedValue.toString().length > decimalLength) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            } 
        }
    }

    //@ts-ignore
    useEventHandler(numberRef.current ? numberInput.current : undefined, 'paste', handlePaste)

    return (
        <InputNumber
            ref={numberRef}
            inputRef={numberInput}
            className="rc-editor-number"
            useGrouping={useGrouping}
            locale={context.contentStore.locale}
            prefix={prefixLength}
            minFractionDigits={scaleDigits.minScale}
            maxFractionDigits={scaleDigits.maxScale}
            value={value}
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            inputStyle={{...textAlignment, background: props.cellEditor_background_}}
            onChange={event => setValue(event.value)}
            onBlur={() => onBlurCallback(baseProps, value, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, value, context.server))}
            disabled={!props.cellEditor_editable_}
            onKeyDown={handleKeyDown}
        />
    )
}
export default UIEditorNumber