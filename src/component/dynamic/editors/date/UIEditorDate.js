import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { Calendar } from 'primereact/calendar';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';
import useRowSelect from '../../../hooks/useRowSelect';
import { isValidDate } from '../../../helper/IsValidDate';
import { sendSetValues } from '../../../helper/SendSetValues';

function UIEditorDate(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || 0, props.id, props.dataRow)
    const con = useContext(RefContext);
    const calender = useRef()
    const dateFormat = parseDateFormat(props.cellEditor.dateFormat)
    const showTime = props.cellEditor.dateFormat.indexOf("HH") !== -1 ? true : false
    const timeOnly = props.cellEditor.dateFormat === "HH:mm" ? true : false

    function parseDateFormat(dateFormat) {
        let formatted = dateFormat;
        if (dateFormat.includes("MMMM")) {
            formatted = dateFormat.replace("MMMM", 'MM').replace(", HH:mm", '');
        }
        else if (dateFormat.includes("MM")) {
            formatted = dateFormat.replace("MM", "mm").replace(", HH:mm", '');
        }
        if (dateFormat.includes("yyyy")) {
            formatted = formatted.replace("yyyy", "yy");
        }
        else if (dateFormat.includes("y") && !dateFormat.includes("yy")) {
            formatted = formatted.replace("y", "yy");
        }
        return formatted
    }
    
    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
    }, [con, props]);

    useLayoutEffect(() => {
        if (calender.current.container !== null) {
            let alignments = checkCellEditorAlignments(props)
            for (let child of calender.current.container.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background-color', props["cellEditor.background"])
                    child.style.setProperty('text-align', alignments.ha)
                }
            }
        }
    });

    return (
        <Calendar
            id={props.id}
            appendTo={document.body}
            ref={calender}
            value={isValidDate(new Date(selectedColumn)) ? new Date(selectedColumn) : null}
            monthNavigator={true}
            yearNavigator={true}
            yearRange="1900:2030"
            dateFormat={dateFormat}
            showTime={showTime}
            timeOnly={timeOnly}
            showIcon={true}
            style={{width:"100%", textAlign: 'start',  ...props.layoutStyle}}
            onChange={change => editColumn(change.target.value, props.columnName)}
            onBlur={change => {sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, change.value.getTime())}}
            onSelect={change => {sendSetValues(con, props.rowId, props.dataRow, props.name, props.columnName, change.value.getTime())}}
            disabled={!props["cellEditor.editable"]}/>
    );
}
export default UIEditorDate;