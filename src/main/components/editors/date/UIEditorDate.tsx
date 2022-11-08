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
import React, { CSSProperties, FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Calendar } from 'primereact/calendar';
import { format, parse, isValid, formatISO, startOfDay } from 'date-fns'
import tinycolor from "tinycolor2";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getTextAlignment } from "../../comp-props/GetAlignments";
import { getDateLocale, setDateLocale } from "../../../util/other-util/GetDateLocale";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { sendSetValues } from "../../../util/server-util/SendSetValues";
import useMultipleEventHandler from "../../../hooks/event-hooks/useMultipleEventHandler";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { IExtendableDateEditor } from "../../../extend-components/editors/ExtendDateEditor";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";

/** Interface for cellEditor property of DateCellEditor */
export interface ICellEditorDate extends ICellEditor {
    dateFormat?: string,
    isAmPmEditor: boolean,
    isDateEditor: boolean,
    isHourEditor: boolean,
    isMinuteEditor: boolean,
    isSecondEditor: boolean,
    isTimeEditor: boolean,
}

/** Interface for DateCellEditor */
export interface IEditorDate extends IRCCellEditor {
    cellEditor: ICellEditorDate
}

// Supported date-time formats
const dateTimeFormats = [
    "dd.MM.yyyy HH:mm", 
    "dd-MM-yyyy HH:mm", 
    "dd/MM/yyyy HH:mm", 
    "dd.MMMMM.yy HH:mm", 
    "dd-MMMMM-yyyy HH:mm", 
    "dd/MMMM/yyyyy HH:mm", 
]


// Supported date formats
const dateFormats = [
    "dd.MM.yyyy", 
    "dd-MM-yyyy", 
    "dd/MM/yyyy", 
    "dd.MMMMM.yy", 
    "dd-MMMMM-yyyy", 
    "dd/MMMM/yyyyy"
]

// Parses a date-string through multiple formats
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
const UIEditorDate: FC<IEditorDate & IExtendableDateEditor> = (props) => {
    /** Reference for the calendar element */
    const calendar = useRef<CustomCalendar>(null);

    const wrapperRef = useRef<HTMLSpanElement>(null);

    /** Reference for calendar input element */
    const calendarInput = useRef<HTMLInputElement>(null);

    /** The current datevalue */
    const [dateValue, setDateValue] = useState<any>(props.selectedRow ? props.selectedRow.data[props.columnName] : undefined);

    /** True, if the overlaypanel is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** The month/year which is currently displayed */
    const [viewDate, setViewDate] = useState<any>(props.selectedRow && props.selectedRow.data[props.columnName] ? new Date(props.selectedRow.data[props.columnName]) : new Date());

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

    const designerUpdate = useDesignerUpdates("extra-button");

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [designerUpdate]); 

    //setDateLocale(props.context.appSettings.locale);

    /**
     * Returns true, if the given date is a valid date
     * @param inputDate - the date to be checked
     */
    const isValidDate = (inputDate:any) => {
        return inputDate instanceof Date && !isNaN(inputDate.getTime());
    }

    /** Hook for MouseListener */ //@ts-ignore
    useMouseListener(props.name, calendar.current ? calendar.current.container : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    useRequestFocus(id, props.requestFocus, calendarInput.current as HTMLElement|undefined, props.context);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && wrapperRef.current) {
            sendOnLoadCallback(
                id,
                props.cellEditor.className,
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                wrapperRef.current, 
                onLoadCallback
            )
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useHandleDesignerUpdate(
        designerUpdate,
        wrapperRef.current,
        props.layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.cellEditor.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback
        )
    );

    // When the cell-editor is opened focus the input and forward the pressed key when opening, on unmount save the date-input if the screen is still opened
    useEffect(() => {
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
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.screenName) !== -1 && props.isCellEditor) {
                handleDateInput();
            }
        }
    },[])

    useEffect(() => {
        if (calendar.current) {
            //@ts-ignore
            const btnElem = calendar.current.container.querySelector("button");
            if (props.isReadOnly) {
                if (!btnElem.disabled) {
                    btnElem.disabled = true;
                }
            }
            else if (btnElem.disable) {
                btnElem.disabled = false;
            }
        }
    }, [props.isReadOnly])

    // Sets the date-value and the view-date when the selectedRow changes
    useEffect(() => {
        setDateValue(props.selectedRow && props.selectedRow.data[props.columnName] ? new Date(props.selectedRow.data[props.columnName]) : undefined);
        setViewDate(props.selectedRow && props.selectedRow.data[props.columnName] ? new Date(props.selectedRow.data[props.columnName]) : new Date());
        lastValue.current = props.selectedRow ? props.selectedRow.data[props.columnName] : undefined;
        
    },[props.selectedRow]);

    // If the lib user extends the DateCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.selectedRow ? new Date(props.selectedRow.data[props.columnName]) : undefined)
        }
    }, [props.selectedRow, props.onChange])

    // Checks if the time has changed to hide the overlay if the date has been selected directly
    const timeChanged = (newDate: Date, oldDate: Date) => {
        if (!oldDate || newDate.getHours() !== oldDate.getHours() || newDate.getMinutes() !== oldDate.getMinutes() || newDate.getSeconds() !== oldDate.getSeconds()) {
            return true;
        }
        return false;
    }

    /**
     * When a date is entered in the inputfield in some possible formats, use date-fns parse to get its date object, then call sendSetValues
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
        sendSetValues(
            props.dataRow,
            props.name,
            props.columnName,
            inputDate.getTime(),
            props.context.server, 
            lastValue.current,
            props.topbar,
            props.rowNumber)
    }

    // When "enter" or "tab" are pressed save the entry and close the editor, when escape is pressed don't save and close the editor
    useMultipleEventHandler(calendar.current && calendarInput.current ? 
        //@ts-ignore
        [calendarInput.current, calendar.current.container.querySelector("button")] : undefined, "keydown", (event:Event) => {
        event.stopPropagation();

        if (props.onInput) {
            props.onInput(event as KeyboardEvent)
        }

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
            ref={wrapperRef}
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
                    props.isCellEditor ? "open-cell-editor" : undefined,
                    props.focusable === false ? "no-focus-rect" : "",
                    props.style
                )}
                panelClassName="rc-editor-date-panel"
                inputClassName={props.isReadOnly ? "rc-input-readonly" : ""}
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

                    if (showTime && event.value && !timeChanged(event.value as Date, dateValue)) {
                        (calendar.current as any).hideOverlay();
                    }

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
                    if (!props.isReadOnly) {
                        if (props.onBlur) {
                            props.onBlur(event);
                        }

                        // Check if the relatedTarget isn't in the dropdown and only then send focus lost. DateEditor also wants to send blur when clicking the overlay.
                        //@ts-ignore
                        if (!visible && !calendar.current.container.contains(event.relatedTarget)) {
                            if (props.eventFocusLost) {
                                onFocusLost(props.name, props.context.server);
                            }
                            focused.current = false;
                        }
                        !alreadySaved.current ? handleDateInput() : alreadySaved.current = false
                    }
                }}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                readOnlyInput={props.isReadOnly}
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
            formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat, { locale: getDateLocale() }) : formatISO(date);
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