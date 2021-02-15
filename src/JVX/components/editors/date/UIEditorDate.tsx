import React, {FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {Calendar} from 'primereact/calendar';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { getMomentValue, parseDateFormatCell, parseDateFormatTable } from "../../util/ParseDateFormats";
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import moment from "moment";
import { parseJVxSize } from "../../util/parseJVxSize";
import { getEditorCompId } from "../../util/GetEditorCompId";

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

export interface IEditorDate extends IEditor{
    cellEditor: ICellEditorDate
}

const UIEditorDate: FC<IEditorDate> = (baseProps) => {

    const calender = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorDate>(baseProps.id, baseProps);
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const lastValue = useRef<any>();
    const {onLoadCallback, id} = baseProps;
    const [dateFormat, setDateFormat] = useState(parseDateFormatCell(props.cellEditor.dateFormat, selectedRow))
    const showTime = props.cellEditor.isTimeEditor;
    const showSeconds = props.cellEditor.isSecondEditor;
    const timeOnly = props.cellEditor.isTimeEditor && !props.cellEditor.isDateEditor;
    const valueLength = useMemo(() => getMomentValue(props.cellEditor.dateFormat, selectedRow).length, [props.cellEditor.dateFormat, selectedRow])

    const overridePrime = useCallback(() => {
        if (props.cellEditor_editable_) {
            if (timeOnly) {
                //@ts-ignore
                setTimeout(() => calender.current.inputElement.value = dateFormat.replaceAll("'", ''),0)
            }
            else if (showTime) {
                //@ts-ignore
                setTimeout(() => calender.current.inputElement.value = getMomentValue(props.cellEditor.dateFormat, selectedRow).substring(0, valueLength), 0);
            }
        }
    },[timeOnly, showTime, selectedRow, valueLength, dateFormat, props.cellEditor.dateFormat, props.cellEditor_editable_])

    const onSelectCallback = (submitValue:any) => {
        if (Array.isArray(submitValue)) {
            let tempArray:Array<number> = [];
            submitValue.forEach(date => {
                tempArray.push(date.getTime())
            })
            onBlurCallback(baseProps, tempArray, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, tempArray, lastValue.current, context.server));
        }
        else
            onBlurCallback(baseProps, submitValue ? submitValue.getTime() : null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, submitValue ? submitValue.getTime() : null, lastValue.current, context.server));
        overridePrime()
    }

    useLayoutEffect(() => {
        //@ts-ignore
        if (calender.current.container !== null) {
            const alignments = checkCellEditorAlignments(props)
            //@ts-ignore
            for (let child of calender.current.container.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background', props.cellEditor_background_)
                    child.style.setProperty('text-align', alignments?.ha)
                }
            }
        }
    });

    useLayoutEffect(() => {
        if (onLoadCallback && calender.current) {
            //@ts-ignore
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), calender.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        lastValue.current = selectedRow;
    },[selectedRow])

    const handleDateInput = () => {
        let inputDate:Date = new Date()
        if (showTime) {
            //@ts-ignore
            inputDate = moment(calender.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat, new Date(selectedRow).getTime()), "DD.MM.YYYY HH:mm", "DD-MM-YYYY HH:mm", "DD/MM/YYYY HH:mm", "DD.MMMMM.YY HH:mm", "DD-MMMMM-YYYY HH:mm", "DD/MMMM/YYYYY HH:mm", "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        else {
            //@ts-ignore
            inputDate = moment(calender.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat, new Date(selectedRow).getTime()), "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        onBlurCallback(baseProps, inputDate.getTime(), lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, inputDate.getTime(), lastValue.current, context.server));
        overridePrime()
    }

    useEffect(() => {
        if (calender.current) {
            //@ts-ignore
            calender.current.inputElement.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    handleDateInput()
                }
            }
            overridePrime()
        }
    });

    useEffect(() => {
        if (props.cellEditor_editable_)
            setTimeout(() => setDateFormat(parseDateFormatCell(props.cellEditor.dateFormat, selectedRow)),75)
        else
            setDateFormat("")
    }, [props.cellEditor_editable_, props.cellEditor.dateFormat, selectedRow])

    return(
        <Calendar
            ref={calender}
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
            value={selectedRow ? new Date(selectedRow) : undefined}
            appendTo={document.body}
            onChange={event => onSelectCallback(event.value)}
            onBlur={handleDateInput}
            disabled={!props.cellEditor_editable_}
        />
    )
}
export default UIEditorDate