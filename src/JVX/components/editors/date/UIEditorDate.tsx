/** React imports */
import React, {FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";

/** 3rd Party imports */
import {Calendar} from 'primereact/calendar';
import moment from "moment";

/** Hook imports */
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";

/** Other imports */
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { getMomentValue, parseDateFormatCell, parseDateFormatTable } from "../../util/ParseDateFormats";
import { onBlurCallback } from "../../util/OnBlurCallback";
import { getTextAlignment } from "../../compprops/GetAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";
import { getEditorCompId } from "../../util/GetEditorCompId";

/** Interface for cellEditor property of DateCellEditor */
interface ICellEditorDate extends ICellEditor{
    dateFormat?: string,
    isAmPmEditor: boolean,
    isDateEditor: boolean,
    isHourEditor: boolean,
    isMinuteEditor: boolean,
    isSecondEditor: boolean,
    isTimeEditor: boolean,
    preferredEditorMode?: number
}

/** Interface for DateCellEditor */
export interface IEditorDate extends IEditor{
    cellEditor: ICellEditorDate
}

/**
 * The DateCellEditor displays an input field to enter a date value and a button
 * which opens a datepicker to choose a date and change the value in its databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorDate: FC<IEditorDate> = (baseProps) => {
    /** Reference for the calendar element */
    const calendar = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorDate>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Current state of dateFormat for PrimeReact Calendar */
    const [dateFormat, setDateFormat] = useState(selectedRow ? parseDateFormatCell(props.cellEditor.dateFormat, selectedRow) : "")
    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);
    /** Wether the DateCellEditor is a time-editor */
    const showTime = props.cellEditor.isTimeEditor;
    /** Wether the DateCellEditor should show seconds */
    const showSeconds = props.cellEditor.isSecondEditor;
    /** Wether the DateCellEditor should only show time and no date */
    const timeOnly = props.cellEditor.isTimeEditor && !props.cellEditor.isDateEditor;

    /**
     * If time is displayed, PrimeReact ALWAYS puts the time after the date, but in our case the time could be anywhere
     * so we have to get rid of their time
     */
    const overridePrime = useCallback(() => {
        if (props.cellEditor_editable_ && selectedRow) {
            if (timeOnly) {
                /** Set value to just the dateformat without ' to remove PrimeReact time */
                setTimeout(() => {
                    if (calendar.current) {
                        //@ts-ignore
                        calendar.current.inputElement.value = dateFormat.replaceAll("'", '')
                    }
                },0)
            }
            else if (showTime) {
                setTimeout(() => {
                    if (calendar.current) {
                        //@ts-ignore
                        calendar.current.inputElement.value = selectedRow ? getMomentValue(props.cellEditor.dateFormat, selectedRow) : ""
                    }
                    
                }, 0);
            }
        }
    },[timeOnly, showTime, selectedRow, dateFormat, props.cellEditor.dateFormat, props.cellEditor_editable_])

    /**
     * When a date is selected in the Datepicker call the onBlurCallBack function to send the value to the server
     * and call overridePrime to remove PrimeReact time if needed
     * @param submitValue 
     */
    const onSelectCallback = (submitValue:any) => {
        onBlurCallback(baseProps, submitValue ? submitValue.getTime() : null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, submitValue ? submitValue.getTime() : null, context.server));
        overridePrime()
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && calendar.current) {
            //@ts-ignore
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), calendar.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        lastValue.current = selectedRow;
    },[selectedRow])

    /**
     * When a date is entered in the inputfield in some possible formats, use moment to get its date object, then call onBlurCallback
     * to send the date to the server and remove PrimeReact time if necassary
     */
    const handleDateInput = () => {
        let inputDate:Date = new Date()
        if (showTime) {
            //@ts-ignore
            inputDate = moment(calendar.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat, new Date(selectedRow).getTime()), "DD.MM.YYYY HH:mm", "DD-MM-YYYY HH:mm", "DD/MM/YYYY HH:mm", "DD.MMMMM.YY HH:mm", "DD-MMMMM-YYYY HH:mm", "DD/MMMM/YYYYY HH:mm", "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        else {
            //@ts-ignore
            inputDate = moment(calendar.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat, new Date(selectedRow).getTime()), "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        onBlurCallback(baseProps, inputDate.getTime(), lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, inputDate.getTime(), context.server));
        overridePrime()
    }

    /**
     * When enter is pressed "submit" the date
     */
    useEffect(() => {
        if (calendar.current) {
            //@ts-ignore
            calendar.current.inputElement.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    handleDateInput()
                }
            }
            overridePrime()
        }
    });

    /** 
     * When selectedRow is changed, get the new dateformat and set the state of dateformat
     * dateformat is changed because PrimeReact doesn't support every token, so the values 
     * which are not supported need to be passed between singlequotes in dateformat
     */
    useEffect(() => {
        if (props.cellEditor_editable_)
            setTimeout(() => setDateFormat(selectedRow ? parseDateFormatCell(props.cellEditor.dateFormat, selectedRow) : ""),75)
        else
            setDateFormat("")
    }, [props.cellEditor_editable_, props.cellEditor.dateFormat, selectedRow]);

    return(
        <Calendar
            ref={calendar}
            className="rc-editor-text"
            monthNavigator={true}
            yearNavigator={true}
            yearRange="1900:2030"
            dateFormat={dateFormat}
            showTime={showTime}
            showSeconds={showSeconds}
            timeOnly={timeOnly}
            hourFormat={props.cellEditor.isAmPmEditor ? "12" : "24"}
            showIcon={true}
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            inputStyle={{...textAlignment, background: props.cellEditor_background_, borderRight: "none"}}
            value={selectedRow ? new Date(selectedRow) : undefined}
            appendTo={document.body}
            onChange={event => onSelectCallback(event.value)}
            onBlur={handleDateInput}
            disabled={!props.cellEditor_editable_}
        />
    )
}
export default UIEditorDate