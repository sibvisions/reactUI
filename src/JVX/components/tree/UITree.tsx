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
import TreePath from "../../model/TreePath";
import MetaDataResponse from "../../response/MetaDataResponse";

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

    const [treeData, setTreeData] = useState<Map<string, any>>(new Map<string, any>());

    const [nodes, setNodes] = useState<any[]>([]);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    const getDataBookByIndex = (index:number) => {
        return props.dataBooks[Math.min(props.dataBooks.length-1, index)]
    }

    const getReferencedDataPage = (path:TreePath) => {
        const dataPage = providedData.get(getDataBookByIndex(path.length()-1));
        if (dataPage) {
            if (dataPage instanceof Array)
                return dataPage;
            else {
                return dataPage.get((path.getLastOfParent(path)).toString());
            }
                
        }
    }

    const isSelfJoined = (metaData?:MetaDataResponse) => {
        if (metaData?.masterReference) {
            return metaData.masterReference.referencedDataBook === metaData?.dataProvider
        }
        else
            return false;
        
    }

    const getNodeChildren = (path:TreePath, value:string): any[] => {
        const dataPage = providedData.get(getDataBookByIndex(path.length()));
        return dataPage instanceof Array ? [] : dataPage?.get(value);
    }

    const addTreeNode = (key:string, array:any[], children?:any) => {
        console.log(children)
        const path = new TreePath(JSON.parse(key));
        const metaData = getMetaData(compId, getDataBookByIndex(path.length()-1), context.contentStore);
        const nodeDataRow = getReferencedDataPage(path)[path.getLast()];
        array.push({
            key: key,
            label: nodeDataRow[metaData!.columnView_table_[0]],
            leaf: children ? children.length === 0 : true
        });
    }

    const sendTreeFetch = (dataArray?:any[], node?:any) => {
        const tempStructureMap:Map<string, any> = new Map<string, any>();
        const tempDataMap:Map<string, any> = new Map<string, any>();
        var tP = new Promise<any>((resolve, reject) => {
            dataArray?.forEach((data, i) => {
                const path = node ? new TreePath(JSON.parse(node.key)).getChildPath(i) : new TreePath(i);
                const fetchDataPage = getDataBookByIndex(path.length());
                const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
                if (isSelfJoined(metaData) || path.length() < props.dataBooks.length) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData!.masterReference!.columnNames,
                        values: [data[metaData!.masterReference!.referencedColumnNames[0]]]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                    .then((response: any) => response.json())
                    .then((fetchData: FetchResponse[]) => {
                        context.server.processFetch(fetchData[0], data[metaData!.masterReference!.referencedColumnNames[0]].toString());
                        tempStructureMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]].toString());
                        tempDataMap.set(path.toString(), context.server.buildDatasets(fetchData[0]))
                        if (i === (dataArray!.length - 1)) {
                            node ? setTreeData(oldState => new Map([...oldState, ...tempStructureMap])) : setTreeData(tempStructureMap);
                            resolve({childMap: tempStructureMap, fetchedData: tempDataMap});
                        }
                            
                    });
                }
                else {
                    tempStructureMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]].toString());
                    if (i === (dataArray!.length - 1)) {
                        node ? setTreeData(oldState => new Map([...oldState, ...tempStructureMap])) : setTreeData(tempStructureMap);
                        resolve({childMap: tempStructureMap, fetchedData: new Map()});
                    }
                }
            })
        })
        return tP
    }

    useEffect(() => {
        sendTreeFetch(providedData.get(props.dataBooks[0]) as any[])
        .then(res => {
            const treeArray:any[] = [];
            console.log(res)
            for (let [key, value] of res.childMap.entries()) {
                addTreeNode(key, treeArray, res.fetchedData.get(key));
            }
            setNodes(treeArray);
        })
        // eslint-disable-next-line
    }, []);



    const onExpandLoad = (event:any) => {
        if (!event.node.children) {
            let node = {...event.node}
            sendTreeFetch(getNodeChildren(new TreePath(JSON.parse(node.key)), treeData.get(node.key)), node)
            .then(res => {
                for (let [key, value] of res.childMap.entries()) {
                    let nodeCopy = [...nodes];
                    event.node.children = event.node.children ? event.node.children : [];
                    addTreeNode(key, event.node.children, res.fetchedData.get(key))
                    let nodeIndex = nodeCopy.findIndex((node) => node.key === event.node.key);
                    nodeCopy[nodeIndex] = event.node;
                    setNodes(nodeCopy);
                }
            });
        }
    }

    return (
        <span ref={treeWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Tree value={nodes} onExpand={onExpandLoad}/>
        </span>
    )
}
export default UITree