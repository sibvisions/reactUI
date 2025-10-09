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
import React, { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Calendar } from 'primereact/calendar';
import { format, parse, isValid, formatISO, startOfDay } from 'date-fns'
import tinycolor from "tinycolor2";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getTextAlignment } from "../../comp-props/GetAlignments";
import { getDateLocale, getGlobalLocale } from "../../../util/other-util/GetDateLocale";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { sendSetValues } from "../../../util/server-util/SendSetValues";
import useMultipleEventHandler from "../../../hooks/event-hooks/useMultipleEventHandler";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import { IExtendableDateEditor } from "../../../extend-components/editors/ExtendDateEditor";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import { formatInTimeZone, toDate } from 'date-fns-tz'
import { IComponentConstants } from "../../BaseComponent";

/** Interface for cellEditor property of DateCellEditor */
export interface ICellEditorDate extends ICellEditor {
    dateFormat?: string,
    isAmPmEditor: boolean,
    isDateEditor: boolean,
    isHourEditor: boolean,
    isMinuteEditor: boolean,
    isSecondEditor: boolean,
    isTimeEditor: boolean,
    timeZone?: string,
    locale?: string
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

// Parses a date-string through multiple formats and returns the result if it is valid
const parseMultiple = (
    dateString: string,
    formatString: string[],
    referenceDate: Date,
    options?: Parameters<typeof parse>[3]
) => {
    let result;
    for (let i = 0; i < formatString.length; i++) {
        if (!formatString[i]) continue;
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
const UIEditorDate: FC<IEditorDate & IExtendableDateEditor & IComponentConstants> = (props) => {
    /** Reference for the calendar element */
    const calendar = useRef<Calendar>(null);

    /** Reference for calendar input element */
    const calendarInput = useRef<HTMLInputElement>(null);

    /** The current locale of the editor, if there is no locale set use the globallocale */
    const locale = useMemo(() => {
        if (props.cellEditor.locale) {
            return getDateLocale(props.cellEditor.locale);
        }
        else {
            return getGlobalLocale();
        }
    }, [props.cellEditor.locale]);

    /**
     * Returns true, if the given date is a valid date
     * @param inputDate - the date to be checked
     */
    const isValidDate = (inputDate: any) => {
        return inputDate instanceof Date && !isNaN(inputDate.getTime());
    }

    /** Use the set timezone for the editor or the timezone in the appsettings */
    const timeZone = useMemo(() => props.cellEditor.timeZone ? props.cellEditor.timeZone : props.context.appSettings.timeZone, [props.cellEditor.timeZone]);

    /** True, if for some reason the editor would throw an error, disables the editor */
    const [hasError, setHasError] = useState<boolean>(false);

    /** Converts the selectedValue to the correct Timezone */
    const convertToTimeZone = useCallback((viewDate: boolean) => {
        if (props.selectedRow && props.selectedRow.data[props.columnName] && isValidDate(new Date(props.selectedRow.data[props.columnName]))) {
            if (hasError) {
                setHasError(false)
            }
            // formatInTimeZone returns a string so we need to call toDate again to parse it into a date
            return toDate(formatInTimeZone(new Date(props.selectedRow.data[props.columnName]), timeZone, 'yyyy-MM-dd HH:mm:ss', { locale: locale }));
        }
        else if (viewDate) {
            // if (hasError) {
            //     setHasError(false)
            // }
            return new Date();
        }
        else if (props.selectedRow && props.selectedRow.data[props.columnName] && !isValidDate(new Date(props.selectedRow.data[props.columnName])) && !hasError) {
            setHasError(true)
        }
        return undefined

    }, [props.selectedRow, props.columnName, locale, timeZone, hasError])

    /** The current date value */
    const [dateValue, setDateValue] = useState<any>(convertToTimeZone(false));

    /** True, if the overlaypanel is visible */
    const [visible, setVisible] = useState<boolean>(false);

    const onDateClicked = useRef<boolean>(false);

    /** The month/year which is currently displayed in the panel */
    const [viewDate, setViewDate] = useState<any>(convertToTimeZone(true));

    /** Is being set true when the viewDate is changed, used because the overlay is closing when pressing the month arrow buttons */
    const viewDateChanged = useRef<boolean>(false);

    /** True, if the user has changed the value via keyboard */
    const startedEditing = useRef<boolean>(false);

    /** True, if the user has changed the value */
    const isChanging = useRef<boolean>(false);

    /** Extracting onLoadCallback and id from props */
    const { onLoadCallback, id } = props;

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

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [props.designerUpdate]);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, calendarInput.current as HTMLElement | undefined, props.context);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && props.forwardedRef.current) {
            sendOnLoadCallback(
                id,
                props.cellEditor.className,
                parsePrefSize(props.preferredSize),
                parseMaxSize(props.maximumSize),
                parseMinSize(props.minimumSize),
                props.forwardedRef.current,
                onLoadCallback
            )
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.cellEditor.dateFormat]);

    // When the cell-editor is opened focus the input and forward the pressed key when opening, on unmount save the date-input if the screen is still opened
    useEffect(() => {
        setTimeout(() => {
            if (calendarInput.current && props.isCellEditor) {
                calendarInput.current?.focus()
                if (props.passedKey) {
                    calendarInput.current.value = props.passedKey
                }
            }
        }, 0);

        return () => {
            if (props.context.contentStore.activeScreens.map(screen => screen.name).indexOf(props.screenName) !== -1 && props.isCellEditor && startedEditing.current) {
                handleDateInput();
            }
        }
    }, [])

    // If the editor is readonly, disable the button to open the datepicker
    useEffect(() => {
        if (calendar.current) {
            const btnElem = calendar.current.getElement()?.querySelector("button");
            if (btnElem) {
                if (props.isReadOnly || hasError) {
                    if (!btnElem.disabled) {
                        btnElem.disabled = true;
                    }
                }
                else if (btnElem.disabled && !hasError) {
                    btnElem.disabled = false;
                }
            }
        }
    }, [props.isReadOnly])

    // Sets the date-value and the view-date when the selectedRow changes
    useEffect(() => {
        setDateValue(convertToTimeZone(false));
        setViewDate(convertToTimeZone(true));
    }, [props.selectedRow]);

    // If the lib user extends the DateCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.selectedRow && props.selectedRow.data[props.columnName] && isValidDate(new Date(props.selectedRow.data[props.columnName])) ? new Date(props.selectedRow.data[props.columnName]) : undefined)
        }
    }, [props.selectedRow, props.onChange]);

    // Set viewDateChange to false when the viewDate state is done updating
    useEffect(() => {
        setTimeout(() => {
            if (viewDateChanged.current) {
                viewDateChanged.current = false;
            }
        }, 0)
    }, [viewDate])

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
        let inputDate: Date = new Date();
        //@ts-ignore
        const emptyValue = calendarInput.current.value === "";

        if (showTime) {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '',
                ...dateTimeFormats,
                ...dateFormats
            ], new Date(), { locale: locale });
        }
        else {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '',
                ...dateFormats
            ], new Date(), { locale: locale });
        }

        let dateToSend: Date | null = inputDate;

        // If the entered date is valid, then format it, set it as date to send to the server and state to display.
        // Not valid check if empty -> null, else restore the old date
        if (isValidDate(inputDate)) {
            setDateValue(inputDate);
            dateToSend = toDate(formatInTimeZone(inputDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd HH:mm:ss', { locale: locale }), { timeZone: timeZone });
        }
        else if (emptyValue) {
            dateToSend = null;
            setDateValue(null);
        }
        else {
            dateToSend = props.selectedRow && props.selectedRow.data[props.columnName] ? new Date(props.selectedRow.data[props.columnName]) : null;
            setDateValue(convertToTimeZone(false));
        }

        sendSetValues(
            props.dataRow,
            props.name,
            props.columnName,
            props.columnName,
            isValidDate(dateToSend) ? (dateToSend as Date).getTime() : null,
            props.context.server,
            props.topbar,
            props.rowNumber);
        isChanging.current = false;
        startedEditing.current = false;
    }

    // When "enter" or "tab" are pressed save the entry and close the editor, when escape is pressed don't save and close the editor
    useMultipleEventHandler(calendar.current && calendarInput.current && calendar.current.getElement()?.querySelector("button") ?
        [calendarInput.current, calendar.current.getElement()?.querySelector("button")!] : undefined, "keydown", (event: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape'].indexOf(event.key) === -1 && !startedEditing.current) {
                startedEditing.current = true;
            }
            event.stopPropagation();

            if (props.onInput) {
                props.onInput(event as KeyboardEvent)
            }

            if (event.key === "Enter") {
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
            else if (event.key === "Tab") {
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
            else if (event.key === "Escape" && props.isCellEditor && props.stopCellEditing) {
                props.stopCellEditing(event);
            }
        });

    return (
        <span
            ref={props.forwardedRef}
            id={!props.isCellEditor ? props.name : undefined}
            aria-label={props.ariaLabel}
            {...usePopupMenu(props)}
            aria-expanded={visible}
            style={{
                ...props.layoutStyle
            } as CSSProperties}>
            <Calendar
                ref={calendar}
                inputRef={calendarInput}
                className={concatClassnames(
                    "rc-editor-text",
                    "rc-editor-date",
                    props.columnMetaData?.nullable === false ? "required-field" : "",
                    props.isCellEditor ? "open-cell-editor" : undefined,
                    props.focusable === false ? "no-focus-rect" : "",
                    props.borderVisible === false ? "invisible-border" : "",
                    props.isReadOnly ? "rc-input-readonly" : "",
                    props.styleClassNames,
                    visible ? 'rc-editor-date-panel-visible' : ""
                )}
                panelClassName="rc-editor-date-panel"
                inputClassName={concatClassnames("p-date-input")}
                style={{
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                } as CSSProperties}
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
                    //@ts-ignore
                    setDateValue(event.value ? event.value : null);

                    if (event.originalEvent?.type === "click") {
                        onDateClicked.current = true;
                        setTimeout(() => handleDateInput(), 0);
                    }
                }}
                onFocus={(event) => {
                    if (!focused.current) {
                        handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor)
                        focused.current = true;
                    }
                }}
                onBlur={event => {
                    if (props.onBlur) {
                        props.onBlur(event);
                    }

                    if (startedEditing.current) {
                        !alreadySaved.current ? handleDateInput() : alreadySaved.current = false
                    }

                    // Check if the relatedTarget isn't in the dropdown and only then send focus lost. DateEditor also wants to send blur when clicking the overlay.
                    if (!visible && !calendar.current?.getElement()?.contains(event.relatedTarget)) {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, props.context.server);
                        }
                        focused.current = false;
                    }
                }}
                onHide={() => {
                    if (isChanging.current) {
                        handleDateInput();
                        isChanging.current = false;
                    }
                    setViewDate(convertToTimeZone(true));
                }}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                readOnlyInput={props.isReadOnly || hasError}
                //disabled={props.isReadOnly || hasError}
                onVisibleChange={event => {
                    if (showTime) {
                        if (onDateClicked.current) {
                            onDateClicked.current = false;
                        }
                        else {
                            // If the viewDate has changed do NOT change visibility
                            if (!viewDateChanged.current) {
                                setVisible(prevState => !prevState);
                            }

                            if (!focused.current) {
                                handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor)
                                focused.current = true;
                            }
                            if (event.type === 'outside') {
                                if (props.eventFocusLost) {
                                    onFocusLost(props.name, props.context.server);
                                }
                                focused.current = false;
                            }
                        }
                    }
                    else {
                        if (onDateClicked.current) {
                            if (event.type === "dateselect" || (event.visible && event.type === undefined && event.callback !== undefined)) {
                                onDateClicked.current = false;
                            }
                        }
                        else {
                            // If the viewDate has changed do NOT change visibility
                            if (!viewDateChanged.current) {
                                setVisible(prevState => !prevState);
                            }

                            if (!focused.current) {
                                handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor)
                                focused.current = true;
                            }
                            if (event.type === 'outside') {
                                if (props.eventFocusLost) {
                                    onFocusLost(props.name, props.context.server);
                                }
                                focused.current = false;
                            }
                        }
                    }
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left", showDelay: 800 }}
                viewDate={viewDate}
                onViewDateChange={(e) => {
                    viewDateChanged.current = true;
                    setViewDate(e.value)
                }}
                placeholder={props.cellEditor_placeholder_}
                formatDateTime={(date: Date) => {
                    // if the user is currently editing and has not "submitted" do NOT format the date
                    if (startedEditing.current && calendarInput.current?.value) {
                        return calendarInput.current?.value
                    }
                    let formattedValue = "";
                    if (date) {
                        formattedValue = dateFormat ? format(date, dateFormat, { locale: locale ? locale : getGlobalLocale() }) : formatISO(date);
                    }
                    return formattedValue;
                }}
                parseDateTime={(text: string) => {
                    let date = parseMultiple(text, [dateFormat || '', ...dateFormats], new Date(), { locale: locale ? locale : getGlobalLocale() }) || new Date();

                    if (timeOnly) {
                        date = new Date();
                        date.setHours(date.getHours());
                        date.setMinutes(date.getMinutes());
                        date.setSeconds(date.getSeconds());
                    } else if (!showTime) {
                        date = startOfDay(date);
                    }
                    return date;
                }} />
        </span>

    )
}
export default UIEditorDate