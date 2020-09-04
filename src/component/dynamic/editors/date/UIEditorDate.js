import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { Calendar } from 'primereact/calendar';
import "./UIEditorDate.scss"
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';
import useRowSelect from '../../../hooks/useRowSelect';

function UIEditorDate(props) {
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id)
    const con = useContext(RefContext);
    const calender = useRef()

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
            value={new Date(selectedColumn)}
            monthNavigator={true}
            yearNavigator={true}
            yearRange="1900:2030"
            dateFormat="dd/mm/yy"
            showIcon={true}
            style={{width:"100%", textAlign: 'start',  ...props.layoutStyle}}
            onChange={change => editColumn(change.value, props.columnName)}
            disabled={!props["cellEditor.editable"]}/>
    );
}
export default UIEditorDate;