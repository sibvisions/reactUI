/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { Calendar } from 'primereact/calendar';
import { format, parse, isValid, formatISO, startOfDay } from 'date-fns'

/** Hook imports */
import { useProperties, useRowSelect } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, 
         sendSetValues, 
         onBlurCallback, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize } from "../../util";
import { getTextAlignment } from "../../compprops";

/** Interface for cellEditor property of DateCellEditor */
export interface ICellEditorDate extends ICellEditor{
    dateFormat?: string,
    isAmPmEditor: boolean,
    isDateEditor: boolean,
    isHourEditor: boolean,
    isMinuteEditor: boolean,
    isSecondEditor: boolean,
    isTimeEditor: boolean,
}

/** Interface for DateCellEditor */
export interface IEditorDate extends IEditor{
    cellEditor: ICellEditorDate
}

const dateTimeFormats = [
    "dd.MM.yyyy HH:mm", 
    "dd-MM-yyyy HH:mm", 
    "dd/MM/yyyy HH:mm", 
    "dd.MMMMM.yy HH:mm", 
    "dd-MMMMM-yyyy HH:mm", 
    "dd/MMMM/yyyyy HH:mm", 
]

const dateFormats = [
    "dd.MM.yyyy", 
    "dd-MM-yyyy", 
    "dd/MM/yyyy", 
    "dd.MMMMM.yy", 
    "dd-MMMMM-yyyy", 
    "dd/MMMM/yyyyy"
]

const parseMultiple = (
    dateString: string,
    formatString: string[],
    referenceDate: Date,
    options?: Parameters<typeof parse>[3]
) => {
    let result;
    for (let i = 0; i < formatString.length; i++) {
        if(!formatString[i]) continue;
        result = parse(dateString, formatString[i], referenceDate, options);
        if (isValid(result)) { break; }
    }
    return result;
}

/**
 * The DateCellEditor displays an input field to enter a date value and a button
 * which opens a datepicker to choose a date and change the value in its databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorDate: FC<IEditorDate> = (baseProps) => {
    /** Reference for the calendar element */
    const calendar = useRef(null);
    /** Reference for calendar input element */
    const calendarInput = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorDate>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Current state of dateFormat for PrimeReact Calendar */
    const dateFormat = props.cellEditor.dateFormat;
    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);
    /** Wether the DateCellEditor is a time-editor */
    const showTime = props.cellEditor.isTimeEditor;
    /** Wether the DateCellEditor should show seconds */
    const showSeconds = props.cellEditor.isSecondEditor;
    /** Wether the DateCellEditor should only show time and no date */
    const timeOnly = props.cellEditor.isTimeEditor && !props.cellEditor.isDateEditor;

    /**
     * When a date is selected in the Datepicker call the onBlurCallBack function to send the value to the server
     * and call overridePrime to remove PrimeReact time if needed
     * @param submitValue 
     */
    const onSelectCallback = (submitValue:any) => {
        onBlurCallback(
            baseProps, 
            submitValue 
                ? submitValue.getTime() 
                : null, 
            lastValue.current, 
            () => sendSetValues(
                props.dataRow, 
                props.name, 
                props.columnName, 
                submitValue 
                    ? submitValue.getTime() 
                    : null, 
                context.server
            )
        );
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && calendar.current) {
            sendOnLoadCallback(
                id, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                //@ts-ignore
                calendar.current.container, 
                onLoadCallback
            )
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        lastValue.current = selectedRow;
    },[selectedRow])

    /**
     * When a date is entered in the inputfield in some possible formats, use date-fns parse to get its date object, then call onBlurCallback
     * to send the date to the server and remove PrimeReact time if necassary
     */
    const handleDateInput = () => {
        let inputDate:Date = new Date()
        if (showTime) {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '', 
                ...dateTimeFormats,
                ...dateFormats
            ], new Date());
        }
        else {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '', 
                ...dateFormats
            ], new Date());
        }
        
        onBlurCallback(
            baseProps, 
            inputDate.getTime(), 
            lastValue.current, 
            () => sendSetValues(
                props.dataRow, 
                props.name, 
                props.columnName, 
                inputDate.getTime(), 
                context.server
            )
        );
    }

    /**
     * When enter is pressed "submit" the date
     */
    useEffect(() => {
        if (calendar.current) {
            //@ts-ignore
            calendarInput.current.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                    handleDateInput()
                }
            }
        }
    });

    return(
        <CustomCalendar
            ref={calendar}
            inputRef={calendarInput}
            className="rc-editor-text rc-editor-date"
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

class CustomCalendar extends Calendar {
    formatDateTime(date: Date) {
        let formattedValue = null;
        if (date) {
            if (this.props.timeOnly) {
                formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat) : formatISO(date);
            } else {
                formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat) : formatISO(date);
            }
        }

        return formattedValue;
    }
    parseDateTime(text: string) {
        let date = parseMultiple(text, [this.props.dateFormat || '', ...dateFormats], new Date()) || new Date();

        if (this.props.timeOnly) {
            date = new Date();
            date.setHours(date.getHours());
            date.setMinutes(date.getMinutes());
            date.setSeconds(date.getSeconds());
        } else if (!this.props.showTime) {
            date = startOfDay(date);
        }

        return date;
    }
}