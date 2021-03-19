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
import TreePath from "../../model/TreePath";

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
    const [treeData, setTreeData] = useState<Map<string, any>>(new Map<string, any>());

    const [nodes, setNodes] = useState<any[]>([]);

    useEffect(() => {
        
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const tempChildMap:Map<any, any> = new Map<any, any>();
        
        const metaData = getMetaData(compId, props.dataBooks[Math.min(props.dataBooks.length-1, 1)], context.contentStore);
        let firstLvlData:any[]|undefined;

        if (metaData!.masterReference) {
            firstLvlData = providedData.get(props.dataBooks[0]);
            if (firstLvlData) {
                firstLvlData.forEach((data, i) => {
                    let masterReference = metaData!.masterReference as MetaDataReference
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = props.dataBooks[Math.min(props.dataBooks.length-1, 1)];
                    fetchReq.filter = {
                        columnNames: masterReference.columnNames,
                        values: [data[masterReference.referencedColumnNames[0]]]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL+REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                    .then((response: any) => response.json())
                    .then((fetchData:FetchResponse[]) => {
                        context.server.processFetch(fetchData[0], data[masterReference.referencedColumnNames[0]].toString());
                        return context.server.buildDatasets(fetchData[0]);
                    })
                    .then((result) => {
                        const testMap:Map<any, any> = new Map<any, any>();
                        result.forEach((resultRecord, resultIndex) => 
                        testMap.set(new TreePath(i, resultIndex).toString(), {name: resultRecord[metaData!.columnView_table_[0]], children: new Map<any, any>()}));
                        tempChildMap.set(new TreePath(i).toString(), {name: data[metaData!.columnView_table_[0]], children: testMap});
                        if (i === (firstLvlData!.length as number) - 1) {
                            tempTreeMap.set(new TreePath().toString(), tempChildMap);
                            setTreeData(tempTreeMap);
                        }

                    });
                });
            }
        }
    // eslint-disable-next-line
    }, []);

    const createTreeNodes = useCallback(() => {
        const treeArray:any[] = []
        if (treeData.size) {
            const rawData = treeData.get(new TreePath().toString());
            if (rawData) {
                for(let [key, value] of rawData.entries()) {
                    const pathArr = JSON.parse(key);
                    const currRow = providedData.get(props.dataBooks[pathArr.length-1])![pathArr[pathArr.length < 2 ? pathArr.length-1 : pathArr.length-2]];
                    const metaData = getMetaData(compId, props.dataBooks[pathArr.length-1], context.contentStore);
                    let treeItem = {
                        key: key,
                        label: currRow[metaData!.columnView_table_[0]],
                        leaf: value.children.size === 0
                    }
                    treeArray.push(treeItem);
                }
            }
        }
        return treeArray;
    },[context.contentStore, compId, props.dataBooks, treeData]);

    const onExpandLoad = (event:any) => {
        if (!event.node.children) {
            let node = {...event.node}
            node.children = [];
            for (let [key, value] of treeData.get(new TreePath().toString()).get(event.node.key).children) {
                node.children.push({
                    key: key,
                    label: value.name,
                    leaf: value.children.size === 0
                });
            }

            let value = [...nodes];
            let foundNode = value.findIndex((node) => node.key === event.node.key);
            if (foundNode !== undefined) {
                value[foundNode] = node;
                setNodes(value);
            }

        }
    }

    useEffect(() => {
        if (treeData.size) {
            setNodes(createTreeNodes());
        }
    },[treeData, createTreeNodes])

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
            <Tree value={nodes} onExpand={onExpandLoad}/>
        </span>
    )
}
export default UITree