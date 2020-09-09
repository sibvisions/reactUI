import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { Calendar } from 'primereact/calendar';
import "./UIEditorDate.scss"
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';
import useRowSelect from '../../../hooks/useRowSelect';
import { isValidDate } from '../../../helper/IsValidDate';

function UIEditorDate(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id)
    const con = useContext(RefContext);
    const calender = useRef()
    const dateFormat = parseDateFormat(props.cellEditor.dateFormat)
    const showTime = props.cellEditor.dateFormat.indexOf("HH") !== -1 ? true : false
    const timeOnly = props.cellEditor.dateFormat === "HH:mm" ? true : false

    function parseDateFormat(dateFormat) {
        let formatted = dateFormat;
        if (dateFormat.indexOf("MMMM") !== -1) {
            formatted = dateFormat.replace("MMMM", 'MM').replace("y", "yy").replace(", HH:mm", '');
        }
        else if (dateFormat.indexOf("MM") !== -1) {
            formatted = dateFormat.replace("MM", "mm").replace("y", "yy").replace(", HH:mm", '');;
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
    }, [props]);

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
            onChange={change => editColumn(change.value, props.columnName)}
            disabled={!props["cellEditor.editable"]}/>
    );
}
export default UIEditorDate;