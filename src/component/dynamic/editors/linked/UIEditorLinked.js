import React, { useContext, useEffect, useRef, useLayoutEffect, useMemo, useState } from 'react';
import { RefContext } from '../../../helper/Context';

// prime
import { AutoComplete } from 'primereact/autocomplete';

// hooks
import useFetchListen from "../../../hooks/useFetchListen";
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { sendSetValues } from '../../../helper/SendSetValues';
import { toPx } from '../../../helper/ToPx';

function UIEditorLinked(props){
    const [fetchedData] = useFetchListen(props.cellEditor.linkReference.referencedDataBook);
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", props.id, props.dataRow);
    const con = useContext(RefContext)
    const [firstRow, setFirstRow] = useState(0);
    const [lastRow, setLastRow] = useState(100);
    // eslint-disable-next-line
    const suggestionData = useMemo(() => con.contentStore.storedData.get(props.cellEditor.linkReference.referencedDataBook) ? con.contentStore.storedData.get(props.cellEditor.linkReference.referencedDataBook).slice(firstRow, lastRow) : [], [fetchedData, con.contentStore, props.cellEditor.linkReference.referencedDataBook, firstRow, lastRow])
    const autoComRef = useRef();

    useEffect(()=> {
        let blockFetch = false;
        const handleScroll = (elem) => {
            if (elem) {
                elem.onscroll = () => {
                    console.log((elem.scrollTop+elem.offsetHeight)/35, elem.scrollTop+elem.offsetHeight, lastRow, elem.children[0].children[0])
                    if ((elem.scrollTop+elem.offsetHeight)/35 > lastRow) {
                        elem.children[0].children[0].scrollTop = firstRow
                        setFirstRow(lastRow)
                        setLastRow(lastRow+100)
                    }

                    if (!blockFetch && (elem.scrollTop + elem.offsetHeight)*100/elem.scrollHeight >= (elem.scrollHeight * 0.9)*100/elem.scrollHeight) {
                        blockFetch = true
                        con.serverComm.fetchDataFromProvider(props.cellEditor.linkReference.referencedDataBook, con.contentStore.storedData.get(props.cellEditor.linkReference.referencedDataBook).length, -2)
                    }
                }
            } 
        }
        setTimeout(() => {
            handleScroll(document.getElementsByClassName("p-autocomplete-panel")[0])
        }, 0);
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    }, [con, props, fetchedData]);

    useLayoutEffect(() => {
        if (autoComRef.current) {
            setTimeout(() => {
                if (document.getElementsByClassName("p-autocomplete-panel")[0]) {
                    document.getElementsByClassName("p-autocomplete-panel")[0].children[0].style.height = toPx(con.contentStore.storedData.get(props.cellEditor.linkReference.referencedDataBook).length * 35)
                }
            }, 0);

            if(autoComRef.current.inputEl){
                const alignments = checkCellEditorAlignments(props);
                autoComRef.current.inputEl.style['background-color'] = props['cellEditor.background'];
                autoComRef.current.inputEl.style['text-align'] = alignments.ha;
            }
        }
    });

    // function buildSuggestions(response= {records: []}){
    //     let suggestions = []
    //     if (response.length > 0) {
    //         response.forEach(record => {
    //             let element = {};
    //             Object.values(record).forEach((data, index) => {
    //                 if(data !== null) element[props.cellEditor.clearColumns[index]] = data;
    //             });
    //             suggestions.push(element)
    //         });
    //     }
    //     return suggestions
    // }

    function buildSuggestions(response= {records: []}){
        let suggestions = []
        if (response.length > 0) {
            response.forEach(record => {
                let element = {};
                Object.values(record).forEach((data, index) => {
                    if(data !== null) element[props.cellEditor.clearColumns[index]] = data;
                });
                suggestions.push(element)
            });
        }
        return suggestions
    }

    function onInputChange(event){
        con.serverComm.fetchFilterdData(
            props.cellEditor.linkReference.referencedDataBook,
            event.query,
            props.name);
    }

    return (
        <AutoComplete
            appendTo={document.body}
            id={props.id}
            style={props.layoutStyle}
            ref={autoComRef}
            dropdown={true}
            completeMethod={onInputChange}
            //suggestions={buildSuggestions(con.contentStore.storedData.get(props.cellEditor.linkReference.referencedDataBook))}
            suggestions={buildSuggestions(suggestionData)}
            field={props.columnName}
            value={selectedColumn}
            onChange={event => editColumn(event.target.value)}
        	onBlur={() => {
                if (typeof selectedColumn === "object") {
                    sendSetValues(con, props.rowId, props.dataRow, props.name, props.cellEditor.clearColumns, selectedColumn)
                }
                else if (selectedColumn === "") {
                    sendSetValues(con, props.rowId, props.dataRow, props.name, props.cellEditor.clearColumns, null)
                }
            }}
            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorLinked