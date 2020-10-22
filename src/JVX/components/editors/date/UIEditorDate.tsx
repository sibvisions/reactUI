import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {Calendar} from 'primereact/calendar';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import {handleEnterKey} from "../../util/HandleEnterKey";
import { parseDateFormatCell } from "../../util/ParseDateFormats";
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";

interface ICellEditorDate extends ICellEditor{
    dateFormat?: string,
    preferredEditorMode?: number
}

export interface IEditorDate extends IEditor{
    cellEditor?: ICellEditorDate
}

const UIEditorDate: FC<IEditorDate> = (baseProps) => {

    const calender = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorDate>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const lastValue = useRef<any>();

    const [value, setValue] = useState<Date|Date[]>();
    const {onLoadCallback, id} = baseProps;

    const dateFormat = parseDateFormatCell(props.cellEditor?.dateFormat);
    const showTime = props.cellEditor?.dateFormat?.includes("HH");
    const timeOnly = props.cellEditor?.dateFormat === "HH:mm";

    const onSelectCallback = (submitValue:any) => {
        if (Array.isArray(submitValue)) {
            let tempArray:Array<number> = [];
            submitValue.forEach(date => {
                tempArray.push(date.getTime())
            })
            onBlurCallback(baseProps, tempArray, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, tempArray, lastValue.current, context))
        }
        else {
            onBlurCallback(baseProps, submitValue ? submitValue.getTime() : null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, submitValue ? submitValue.getTime() : null, lastValue.current, context))
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
            const size: Array<DOMRect> = calender.current.container.getClientRects();
            onLoadCallback(id, size[0].height, size[0].width);
        }
    },[onLoadCallback, id]);

    useLayoutEffect(() => {
        setValue(selectedRow ? new Date(selectedRow) : undefined);
        lastValue.current = selectedRow;
        
    },[selectedRow])

    return(
        <Calendar
             ref={calender}
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
             onChange={event => setValue(event.target.value)}
             onSelect={onSelectCallback}
             disabled={!props.cellEditor_editable_}
        />
    )
}
export default UIEditorDate