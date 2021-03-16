/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


/** 3rd Party imports */
import { Tree } from 'primereact/tree';

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { jvxContext } from "../../jvxProvider";
import { LayoutContext } from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import { createFetchRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import useAllDataProviderData from "../zhooks/useAllDataProviderData";
import { getMetaData } from "../util/GetMetaData";
import FetchResponse from "../../response/FetchResponse";
import MetaDataResponse, {MetaDataReference} from "../../response/MetaDataResponse";
import useDataProviderData from "../zhooks/useDataProviderData";

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
    const [treeData, setTreeData] = useState<Map<string, any[]|undefined>>(new Map<string, any[]|undefined>());

    const [builtTreeItems, setBuiltTreeItems] = useState<Array<any>>();

    const getDataProviderData = useCallback((metaData:MetaDataResponse) => {
        if (metaData.masterReference)
            return providedData.get(metaData.masterReference.referencedDataBook)
    },[providedData])

    useEffect(() => {
        const tempMap:Map<string, any[]|undefined> = new Map<string, any[]|undefined>()
        const metaData = getMetaData(compId, props.dataBooks[1], context.contentStore);
        let dataProviderData:any[]|undefined;

        if (metaData?.masterReference) {
            dataProviderData = getDataProviderData(metaData)
            if (dataProviderData) {
                dataProviderData.forEach((data, i) => {
                    let masterReference = (metaData as MetaDataResponse).masterReference as MetaDataReference
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = props.dataBooks[1];
                    fetchReq.filter = {
                        columnNames: masterReference.columnNames,
                        values: [data[masterReference.referencedColumnNames[0]]]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL+REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                    .then((response: any) => response.json())
                    .then((fetchData:FetchResponse[]) => {
                        context.server.processFetch(fetchData[0]);
                        return context.server.buildDatasets(fetchData[0]);
                    })
                    .then((result) => { 
                        tempMap.set(data[(metaData as MetaDataResponse).columnView_table_[0]], result);
                        if (i === (dataProviderData?.length as number) - 1)
                            setTreeData((currentTreeData) => new Map([...currentTreeData, ...tempMap]))
                    })
                });
            }
        }
    // eslint-disable-next-line
    }, [context.server, context.contentStore, props.dataBooks, compId]);

    useEffect(() => {
        if (treeData.size) {
            console.log(treeData)
        }
    },[treeData])

    const indexRef = useRef<number>(0)

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={treeWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>

        </span>
    )
}
export default UITree