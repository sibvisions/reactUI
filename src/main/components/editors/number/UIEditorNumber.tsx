/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { InputNumber } from "primereact/inputnumber";

/** Hook imports */
import { useRowSelect, useEventHandler, useLayoutValue, useFetchMissingData, useMouseListener, useDataProviders } from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, 
         getMetaData, 
         getDecimalLength, 
         getGrouping,
         getPrimePrefix, 
         getScaleDigits, 
         sendSetValues, 
         onBlurCallback, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize,
         handleEnterKey} from "../../util";
import { getTextAlignment } from "../../compprops";
import { NumericColumnDescription } from "../../../response"
import { showTopBar, TopBarContext } from "../../topbar/TopBar";
import { getColMetaData } from "../../table/UITable";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";

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
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorNumber: FC<IEditorNumber> = (props) => {
    /** Reference for the NumberCellEditor element */
    const numberRef = useRef<InputNumber>(null);

    /** Reference for the NumberCellEditor input element */
    const numberInput = useRef<HTMLInputElement>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, props.editorStyle);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Current state value of input element */
    const [value, setValue] = useState<number|string>(selectedRow);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** The metaData of the dataRow */
    const metaData = getMetaData(compId, props.dataRow, context.contentStore)

    /** The cell-editor metadata for the NumberCellEditor */
    const cellEditorMetaData:NumericColumnDescription = getColMetaData(props.columnName, metaData) as NumericColumnDescription;

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    useDataProviders(compId);

    useFetchMissingData(compId, props.dataRow);

    /** Hook for MouseListener */ // @ts-ignore
    useMouseListener(props.name, numberRef.current ? numberRef.current.element : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
    * Returns the minimum and maximum scaledigits for the NumberCellEditor
    * @returns the minimum and maximum scaledigits for the NumberCellEditor
    */
    const scaleDigits:ScaleType = useMemo(() => cellEditorMetaData 
        ? getScaleDigits(props.cellEditor.numberFormat, cellEditorMetaData.scale) 
        : {minScale: 0, maxScale: 0}, 
    [cellEditorMetaData, props.cellEditor.numberFormat]);

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
    const decimalLength = useMemo(() => cellEditorMetaData ? getDecimalLength(cellEditorMetaData.precision, cellEditorMetaData.scale) : undefined, [cellEditorMetaData]);

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

    useEffect(() => {
        if (isCellEditor && props.passedKey) {
            if (/^[0-9]$/i.test(props.passedKey)) {
                setValue(null as any)
            }
        }

        return () => {
            if (context.contentStore.activeScreens.indexOf(compId) !== -1 && isCellEditor && numberInput.current) {
                numberInput.current.blur();
                //onBlurCallback(props, value, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, props.columnName, value, context.server), topbar))
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

    useEventHandler(numberInput.current ? numberInput.current : undefined, 'paste', (event:any) => handlePaste(event));

    useEventHandler(numberInput.current ? numberInput.current : undefined, 'keydown', (event:any) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) >= 0) {
            event.stopPropagation();
        }
        else if (['ArrowLeft', 'ArrowRight'].indexOf(event.key) < 0) {
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
            if (isCellEditor && props.stopCellEditing) {
                if ((event as KeyboardEvent).key === "Tab") {
                    (event.target as HTMLElement).blur();
                    props.stopCellEditing(event);
                }
                else if ((event as KeyboardEvent).key === "Escape") {
                    props.stopCellEditing(event);
                }
            }
            if (decimalLength && parseInt((value ? value.toString().split('.')[0] : "") + event.key).toString().length > decimalLength && isSelectedBeforeComma()) {
                event.preventDefault();
                return false;
            }
        }

    });

    return (
        (!isCellEditor) ?
            <span aria-label={props.ariaLabel} style={layoutStyle}>
                <InputNumber
                    ref={numberRef}
                    id={props.name}
                    inputRef={numberInput}
                    className="rc-editor-number"
                    useGrouping={useGrouping}
                    locale={context.appSettings.locale}
                    prefix={prefixLength}
                    minFractionDigits={scaleDigits.minScale}
                    maxFractionDigits={scaleDigits.maxScale}
                    value={typeof value === 'string' ? parseFloat((value as string).replace(/\./g, '').replace(',', '.')) : value}
                    style={{ width: '100%' }}
                    inputStyle={{ ...textAlignment, background: props.cellEditor_background_ }}
                    onChange={event => setValue(event.value) }
                    onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                    onBlur={() => {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, context.server);
                        }
                        onBlurCallback(props, value, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, props.columnName, value, context.server), topbar));
                    }}
                    disabled={!props.cellEditor_editable_}
                    autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
                />
            </span>
            :
            <InputNumber
                ref={numberRef}
                inputRef={numberInput}
                className="rc-editor-number"
                useGrouping={useGrouping}
                locale={context.appSettings.locale}
                prefix={prefixLength}
                minFractionDigits={scaleDigits.minScale}
                maxFractionDigits={scaleDigits.maxScale}
                value={typeof value === 'string' ? parseFloat((value as string).replace(/\./g, '').replace(',', '.')) : value}
                style={layoutStyle}
                inputStyle={{ ...textAlignment, background: props.cellEditor_background_ }}
                onChange={event => setValue(event.value) }
                onBlur={() => onBlurCallback(props, value, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, props.columnName, value, context.server), topbar)) }
                disabled={!props.cellEditor_editable_}
                autoFocus={props.autoFocus ? true : props.id === "" ? true : false}
            />
    )
}
export default UIEditorNumber