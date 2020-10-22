import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import { AutoComplete } from 'primereact/autocomplete';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { createFetchRequest, createFilterRequest } from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import useDataProviderData from "../../zhooks/useDataProviderData";
import * as _ from 'underscore'
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";

interface ICellEditorLinked extends ICellEditor{
    linkReference: {
        referencedDataBook: string
    }
    clearColumns:Array<string>
    preferredEditorMode?: number
}

export interface IEditorLinked extends IEditor{
    cellEditor?: ICellEditorLinked
}

const UIEditorLinked: FC<IEditorLinked> = (baseProps) => {

    const inputRef = useRef(null)
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const [providedData] = useDataProviderData(baseProps.id, props.cellEditor?.linkReference.referencedDataBook||"");
    const lastValue = useRef<any>();

    const [text, setText] = useState(selectedRow)
    const [firstRow, setFirstRow] = useState(0);
    const [lastRow, setLastRow] = useState(100);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.container.getClientRects();
            onLoadCallback(id, size[0].height, size[0].width);
        }
    },[onLoadCallback, id]);

    const suggestionData = useMemo(() => providedData ? providedData.slice(firstRow, lastRow) : [], [providedData, firstRow, lastRow])

    useEffect(() => {
        let blockFetch:boolean = false;
        const handleScroll = (elem:HTMLElement) => {
            if (elem) {
                elem.onscroll = _.throttle(() => {
                    let currFirstItem = elem.scrollTop / elem.children[0].children[0].getBoundingClientRect().height;
                    let currLastItem = (elem.scrollTop + elem.offsetHeight) / elem.children[0].children[0].getBoundingClientRect().height;
                    if (currFirstItem < firstRow) {
                        setFirstRow(Math.floor(currFirstItem / 50) * 50);
                        setLastRow(Math.floor(currFirstItem / 50) * 50 + 100);
                        elem.scrollTop = elem.children[0].children[0].getBoundingClientRect().height * (currLastItem - 3);
                    }
                    if (currLastItem > lastRow) {
                        setFirstRow(Math.floor(currLastItem / 100) * 100);
                        setLastRow(Math.ceil(currLastItem / 100) * 100);
                        elem.scrollTop = elem.children[0].children[0].getBoundingClientRect().height * (currFirstItem + 3)
                    }
                    if (!blockFetch && providedData.length < (firstRow+400) && !context.contentStore.dataProviderFetched.get(props.cellEditor?.linkReference.referencedDataBook || "")) {
                        blockFetch = true;
                        const fetchReq = createFetchRequest();
                        fetchReq.dataProvider = props.cellEditor?.linkReference.referencedDataBook;
                        fetchReq.fromRow = providedData.length;
                        fetchReq.rowCount = 400;
                        context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
                    }
                }, 100);
            }
        }
        setTimeout(() => {
            handleScroll(document.getElementsByClassName("p-autocomplete-panel")[0] as HTMLElement)
        },100);
    }, [context, props, providedData, firstRow, lastRow])

    useEffect(() => {
        setText(selectedRow)
    },[selectedRow])

    useLayoutEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    let itemsList:HTMLCollection = document.getElementsByClassName("p-autocomplete-item");
                    for (let i = 0; i < itemsList.length; i++) {
                        //@ts-ignore
                        itemsList[i].style.top = (autoPanel.children[0].children[0].getBoundingClientRect().height * firstRow)+'px'
                    }
                }
            }, 0)
        }
    }, [lastRow])
    
    useLayoutEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    //@ts-ignore
                    autoPanel.children[0].style.height = (providedData.length * autoPanel.children[0].children[0].getBoundingClientRect().height)+'px';
                }
            }, 0);
            //@ts-ignore
            if (inputRef.current.inputEl) {
                const alignments = checkCellEditorAlignments(props);
                //@ts-ignore
                inputRef.current.inputEl.style['background-color'] = props.cellEditor_background_;
                //@ts-ignore
                inputRef.current.inputEl.style['text-align'] = alignments.ha;
            }
        }
    });

    const buildSuggestions = (response:any) => {
        let suggestions:any = []
        if (response.length > 0) {
            response.forEach((record:any) => {
                let element:any = {};
                Object.values(record).forEach((data:any, index:any) => {
                    if(data !== null) {
                        if (props.cellEditor?.clearColumns !== undefined) {
                            element[props.cellEditor?.clearColumns[index]] = data;
                        }
                    } 
                });
                suggestions.push(element)
            });
        }
        return suggestions
    }

    const onInputChange = (event:any) => {
        const filterReq = createFilterRequest()
        filterReq.dataProvider = props.cellEditor?.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = event.query;
        context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }

    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    }, [selectedRow])

    return (
        <AutoComplete
            appendTo={document.body}
            ref={inputRef}
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            disabled={!props.cellEditor_editable_}
            dropdown
            field={props.columnName}
            completeMethod={onInputChange}
            suggestions={buildSuggestions(suggestionData)}
            value={text}
            onChange={event => setText(event.target.value)}
            onBlur={() => {
                if (typeof text === "object") {
                    onBlurCallback(baseProps, text ? text[props.columnName] : null, lastValue.current, () => props.cellEditor ? sendSetValues(props.dataRow, props.name, props.cellEditor?.clearColumns, text, lastValue.current, context) : null)
                }
                else if (text === "") {
                    onBlurCallback(baseProps, text ? text[props.columnName] : null, lastValue.current, () => props.cellEditor ? sendSetValues(props.dataRow, props.name, props.cellEditor?.clearColumns, null, lastValue.current, context) : null)
                }
            }}/>
    )
}
export default UIEditorLinked