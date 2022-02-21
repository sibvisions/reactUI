/** React imports */
import React, { CSSProperties, FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { Calendar } from 'primereact/calendar';
import { format, parse, isValid, formatISO, startOfDay } from 'date-fns'
import tinycolor from "tinycolor2";

/** Hook imports */
import { useEditorConstants, useFetchMissingData, useMouseListener, useMultipleEventHandler, usePopupMenu } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { sendSetValues, 
         onBlurCallback, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize, 
         getDateLocale,
         setDateLocale,
         handleEnterKey,
         concatClassnames} from "../../util";
import { getTextAlignment } from "../../compprops";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";

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
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorDate: FC<IEditorDate> = (props) => {
    /** Reference for the calendar element */
    const calendar = useRef<CustomCalendar>(null);

    /** Reference for calendar input element */
    const calendarInput = useRef<HTMLInputElement>(null);

    const [dateValue, setDateValue] = useState<any>(props.selectedRow);

    /** Mounted state used because useEventHandler ref is null when cell-editor is opened -> not added */
    const [mounted, setMounted] = useState<boolean>(false)

    /** True, if the overlaypanel is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** The month/year which is currently displayed */
    const [viewDate, setViewDate] = useState<any>(props.selectedRow ? new Date(props.selectedRow) : new Date());

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

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

    /** Reference if the date has already been save to avoid multiple setValue calls */
    const alreadySaved = useRef<boolean>(false);

    /** Reference if the DateCellEditor is already focused */
    const focused = useRef<boolean>(false);

    /** Button background */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    setDateLocale(props.context.appSettings.locale);

    useFetchMissingData(props.compId, props.dataRow);

    const isValidDate = (inputDate:any) => {
        return inputDate instanceof Date && !isNaN(inputDate.getTime());
    }

    /** Hook for MouseListener */ //@ts-ignore
    useMouseListener(props.name, calendar.current ? calendar.current.container : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && calendar.current) {
            sendOnLoadCallback(
                id,
                props.cellEditor.className,
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
        setMounted(true)
        setTimeout(() => {
            if (calendarInput.current && props.isCellEditor) {
                calendarInput.current?.focus()
                if (props.passedKey) {
                    //TODO: Value changing isn't very good here but setting the state is not possible because the state needs to be a date...
                    calendarInput.current.value = props.passedKey
                }
            }
        },0);

        return () => {
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.compId) !== -1 && props.isCellEditor) {
                handleDateInput();
            }
        }
    },[])

    useEffect(() => {
        setDateValue(props.selectedRow ? new Date(props.selectedRow) : undefined);
        lastValue.current = props.selectedRow;
        setViewDate(props.selectedRow ? new Date(props.selectedRow) : new Date());
    },[props.selectedRow])

    /**
     * When a date is entered in the inputfield in some possible formats, use date-fns parse to get its date object, then call onBlurCallback
     * to send the date to the server and remove PrimeReact time if necassary
     */
    const handleDateInput = () => {
        let inputDate:Date = new Date();
        //@ts-ignore
        const emptyValue = calendarInput.current.value === ""
        if (showTime) {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '', 
                ...dateTimeFormats,
                ...dateFormats
            ], new Date(), { locale: getDateLocale() });
        }
        else {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '', 
                ...dateFormats
            ], new Date(), { locale: getDateLocale() });
        }
        
        if (isValidDate(inputDate)) {
            setDateValue(inputDate)
        }
        else if (emptyValue) {
            setDateValue(null)
        }
        else {
            setDateValue(isValidDate(lastValue.current) ? new Date(lastValue.current) : null);
        }
        
        onBlurCallback(
            props, 
            isValidDate(inputDate) ? inputDate.getTime() : (emptyValue ? null : lastValue.current), 
            lastValue.current, 
            () => showTopBar(sendSetValues(
                    props.dataRow, 
                    props.name, 
                    props.columnName, 
                    inputDate.getTime(), 
                    props.context.server
                ), props.topbar)
        );
    }

    useMultipleEventHandler(calendar.current && calendarInput.current ? 
        //@ts-ignore
        [calendarInput.current, calendar.current.container.querySelector("button")] : undefined, "keydown", (event:Event) => {
        event.stopPropagation();
        if ((event as KeyboardEvent).key === "Enter") {
            handleDateInput();
            alreadySaved.current = true;
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
            if (calendar.current) {
                setVisible(false);
                if ((event.target as HTMLElement).tagName === "BUTTON") {
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, props.context.server);
                    }
                }
            }
        }
        else if ((event as KeyboardEvent).key === "Tab") {
            handleDateInput();
            alreadySaved.current = true;
            if (props.isCellEditor && props.stopCellEditing) {
                props.stopCellEditing(event);
            }
            else if (calendar.current) {
                setVisible(false);
                if ((event.target as HTMLElement).tagName === "BUTTON") {
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, props.context.server);
                    }
                }
            }
        }
        else if ((event as KeyboardEvent).key === "Escape" && props.isCellEditor && props.stopCellEditing) {
            props.stopCellEditing(event);
        }
    });

    return (
        <span 
            aria-label={props.ariaLabel} 
            {...usePopupMenu(props)} 
            aria-expanded={visible} 
            style={{
                ...props.layoutStyle
            } as CSSProperties}>
            <CustomCalendar
                ref={calendar}
                id={!props.isCellEditor ? props.name : undefined}
                inputRef={calendarInput}
                className={concatClassnames(
                    "rc-editor-text",
                    "rc-editor-date",
                    props.columnMetaData?.nullable === false ? "required-field" : "",
                    props.isCellEditor ? "open-cell-editor" : undefined
                )}
                panelClassName="rc-editor-date-panel"
                style={{
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                }}
                monthNavigator
                yearNavigator
                yearRange="1900:2030"
                dateFormat={dateFormat}
                showTime={showTime}
                showSeconds={showSeconds}
                timeOnly={timeOnly}
                visible={visible}
                hourFormat={props.cellEditor.isAmPmEditor ? "12" : "24"}
                showIcon
                showOnFocus={false}
                inputStyle={{ 
                    ...textAlignment, 
                    ...props.cellStyle,
                    borderRight: "none" 
                }}
                value={isValidDate(dateValue) ? new Date(dateValue) : undefined}
                appendTo={document.body}
                onChange={event => {
                    setDateValue(event.value ? (event.value as Date) : null);
                    if (calendarInput.current) {
                        calendarInput.current.focus();
                    }
                }}
                onFocus={() => {
                    if (!focused.current) {
                        if (props.eventFocusGained) {
                            onFocusGained(props.name, props.context.server);
                        }
                        focused.current = true;
                    }
                }}
                onBlur={event => {
                    //@ts-ignore
                    if (!visible && !calendar.current.container.contains(event.relatedTarget)) {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, props.context.server);
                        }
                        focused.current = false;
                    }
                    !alreadySaved.current ? handleDateInput() : alreadySaved.current = false
                }}
                disabled={!props.cellEditor_editable_}
                onVisibleChange={event => {
                    setVisible(prevState => !prevState);
                    if (!focused.current) {
                        if (props.eventFocusGained) {
                            onFocusGained(props.name, props.context.server);
                        }
                        focused.current = true;
                    }
                    if (event.type === 'outside') {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, props.context.server);
                        }
                        focused.current = false;
                    }
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                viewDate={viewDate}
                onViewDateChange={(e) => setViewDate(e.value)}
                placeholder={props.cellEditor_placeholder_}
            />
        </span>

    )
}
export default UIEditorDate

class CustomCalendar extends Calendar {
    formatDateTime(date: Date) {
        let formattedValue = null;
        if (date) {
            if (this.props.timeOnly) {
                formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat, { locale: getDateLocale() }) : formatISO(date);
            } else {
                formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat, { locale: getDateLocale() }) : formatISO(date);
            }
        }

        return formattedValue;
    }
    parseDateTime(text: string) {
        let date = parseMultiple(text, [this.props.dateFormat || '', ...dateFormats], new Date(), { locale: getDateLocale() }) || new Date();

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