/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";


/** 3rd Party imports */

/** Hook imports */
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { jvxContext } from "../../jvxProvider";
import { LayoutContext } from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import { createFetchRequest, createSelectRowRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import useAllDataProviderData from "../zhooks/useAllDataProviderData";
import { getMetaData } from "../util/GetMetaData";
import DataProviderChangedResponse from "../../response/DataProviderChangedResponse";
import FetchResponse from "../../response/FetchResponse";

export interface ITree extends BaseComponent {
    dataBooks: string[]
}

/**
 * This component displays a datatree based on server sent databooks
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITree: FC<ITree> = (baseProps) => {
    /** Reference for the span that is wrapping the tree containing layout information */
    const treeWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<ITree>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = context.contentStore.getComponentId(props.id) as string;
    /** The data provided by the databooks */
    const providedData = useAllDataProviderData(compId, props.dataBooks);
    /** The state of the tree-items */
    const [treeData, setTreeData] = useState<Map<string, any[]|undefined>>(new Map<string, any[]|undefined>())

    useEffect(() => {
        const tempMap:Map<string, any[]|undefined> = treeData
        const metaData = getMetaData(compId, props.dataBooks[1], context.contentStore);
        let dataProviderData:any[]|undefined
        
        if (metaData?.masterReference)
            dataProviderData = providedData.get(metaData.masterReference.referencedDataBook);
        dataProviderData?.forEach((data, i) => {
            setTimeout(() => {
                if (metaData?.masterReference) {
                    const selectReq = createSelectRowRequest();
                    selectReq.filter = {
                        columnNames: metaData.masterReference.referencedColumnNames,
                        values: [data[metaData.masterReference.referencedColumnNames[0]]]
                    }
                    selectReq.dataProvider = metaData.masterReference.referencedDataBook
                    selectReq.componentId = props.name;

                    context.server.timeoutRequest(fetch(context.server.BASE_URL+REQUEST_ENDPOINTS.SELECT_ROW, context.server.buildReqOpts(selectReq)), 2000)
                        .then((response: any) => response.json())
                        .then((json) => {
                            json.forEach((changedProvider:DataProviderChangedResponse) => {
                                if (changedProvider.reload === -1) {
                                    context.server.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider)
                                    context.contentStore.clearDataFromProvider(compId, changedProvider.dataProvider);
                                    const fetchReq = createFetchRequest();
                                    fetchReq.dataProvider = changedProvider.dataProvider;
                                    context.server.timeoutRequest(fetch(context.server.BASE_URL+REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                                    .then((response: any) => response.json())
                                    .then((fetchData:FetchResponse[]) => {
                                        context.server.processFetch(fetchData[0])
                                        return context.server.buildDatasets(fetchData[0])
                                    })
                                    .then((result) => tempMap.set(data[metaData.columnView_table_[0]], result))
                                }
                            })
                        })
                        .catch(error => console.error(error));
                }
            }, i * 100);
        });
        setTreeData(tempMap);
    }, [context.server, props.dataBooks])

    const indexRef = useRef<number>(0)

    const buildTreeItems = (data:any[], dataBook:string) => {
        const metaData = context.contentStore.dataProviderMetaData.get(compId)?.get(dataBook)
        const builtTreeItems:Array<any> = new Array<any>();
        if (metaData) {
            data.forEach(dataRow => {
                let treeItem:any = {
                    "key": indexRef.current,
                    "label": dataRow[metaData.columnView_table_[0]],
                    "children": () => {
                        if (context.contentStore.dataProviderMetaData.get(compId) && metaData.detailReferences)
                            return buildTreeItems(context.contentStore.dataProviderData.get(compId)?.get(metaData.detailReferences[0].referencedDataBook) as any[], metaData.detailReferences[0].referencedDataBook)
                        else
                            return null
                    } 
                }
                builtTreeItems.push(treeItem)
                indexRef.current++;
            });
        }
        return builtTreeItems
    }


    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    console.log(treeData)

    return (
        <span ref={treeWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>

        </span>
    )
}
export default UITree