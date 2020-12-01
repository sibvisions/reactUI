import React, {FC, useContext, useEffect, useLayoutEffect, useRef, useState} from "react";
import './UIEditorDate.scss'
import {Calendar} from 'primereact/calendar';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { parseDateFormatCell, parseDateFormatTable } from "../../util/ParseDateFormats";
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import moment from "moment";
import { parseJVxSize } from "../../util/parseJVxSize";

interface ICellEditorDate extends ICellEditor{
    dateFormat?: string,
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
    const compId = context.contentStore.getComponentId(props.id) as string;
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const lastValue = useRef<any>();

    const [value, setValue] = useState<Date|Date[]>();
    const {onLoadCallback, id} = baseProps;

    const dateFormat = parseDateFormatCell(props.cellEditor.dateFormat);
    const showTime = props.cellEditor.dateFormat?.includes("HH");
    const timeOnly = props.cellEditor.dateFormat === "HH:mm";

    const onSelectCallback = (submitValue:any) => {
        if (Array.isArray(submitValue)) {
            let tempArray:Array<number> = [];
            submitValue.forEach(date => {
                tempArray.push(date.getTime())
            })
            onBlurCallback(baseProps, tempArray, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, tempArray, lastValue.current, context.server))
        }
        else {
            setValue(submitValue)
            onBlurCallback(baseProps, submitValue ? submitValue.getTime() : null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, submitValue ? submitValue.getTime() : null, lastValue.current, context.server))
        }
    }

    useLayoutEffect(() => {
        //@ts-ignore
        if (calender.current.container !== null) {
            const alignments = checkCellEditorAlignments(props)
            //@ts-ignore
            for (let child of calender.current.container.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background-color', props.cellEditor_background_)
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

    useLayoutEffect(() => {
        setValue(selectedRow ? new Date(selectedRow) : undefined);
        lastValue.current = selectedRow;
        
    },[selectedRow])

    const handleDateInput = () => {
        let inputDate:Date = new Date()
        if (showTime) {
            //@ts-ignore
            inputDate = moment(calender.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat), "DD.MM.YYYY HH:mm", "DD-MM-YYYY HH:mm", "DD/MM/YYYY HH:mm", "DD.MMMMM.YY HH:mm", "DD-MMMMM-YYYY HH:mm", "DD/MMMM/YYYYY HH:mm", "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        else {
            //@ts-ignore
            inputDate = moment(calender.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat), "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        setValue(inputDate)
        onBlurCallback(baseProps, inputDate.getTime(), lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, inputDate.getTime(), lastValue.current, context.server));
    }

    useEffect(() => {
        if (calender.current) {
            //@ts-ignore
            calender.current.inputElement.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    handleDateInput()
                }
            }
        }
    })

    return(
        <Calendar
             ref={calender}
             className="jvxEditorDate"
             monthNavigator={true}
             yearNavigator={true}
             yearRange="1900:2030"
             dateFormat={dateFormat}
             showTime={showTime}
             timeOnly={timeOnly}
             showIcon={true}
             style={layoutValue.get(props.id) || baseProps.editorStyle}
             value={value}
             appendTo={document.body}
             onSelect={event => onSelectCallback(event.value)}
             onBlur={handleDateInput}
             disabled={!props.cellEditor_editable_}
        />
    )
}
export default UIEditorDate