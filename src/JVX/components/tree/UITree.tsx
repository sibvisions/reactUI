/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


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
    dataBooks: string[],
    detectEndNode: boolean
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

    const expandedNode = useRef<any>(null);

    const newNodes = useRef<Map<string, any>>(new Map());

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    const isSelfJoined = (metaData?:MetaDataResponse) => {
        if (metaData?.masterReference)
            return metaData.masterReference.referencedDataBook === metaData?.dataProvider
        else
            return false;
    }

    const getDataBookByIndex = (index:number) => {
        return props.dataBooks[Math.min(props.dataBooks.length-1, index)]
    }

    const getDataRow = (path:TreePath, value?:any) => {
        const dataPage = providedData.get(getDataBookByIndex(path.length()-1));
        if (dataPage) {
            if (path.length() === 1)
                return dataPage.get("current")[path.getLast()];
            else if (value !== undefined) {
                const referencedRow = treeData.get(path.getParentPath().toString())
                return dataPage.get(referencedRow.toString())[path.getLast()];
            }
        }
        return {}
    }

    const getDataRowChildren = (path:TreePath, value:any): any[] => {
        const dataPage = providedData.get(props.dataBooks[path.length()]);
        return dataPage?.get(value.toString());
    }

    const addTreeNode = (key:string, array:any[], children?:any) => {
        const path = new TreePath(JSON.parse(key));
        const metaData = getMetaData(compId, getDataBookByIndex(path.length()-1), context.contentStore);
        const nodeDataRow = getDataRow(path, treeData.get(key));
        array.push({
            key: key,
            label: nodeDataRow[metaData!.columnView_table_[0]],
            leaf: children ? children.length === 0 : true
        });
    }

    const sendTreeFetchSingle = (fetchObj:any, node:any) => {
        const parentPath = new TreePath(JSON.parse(node.key));
        const tempTreeMap: Map<string, any> = new Map<string, any>();

        const fetchDataPage = getDataBookByIndex(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        if (isSelfJoined(metaData) || parentPath.length() < props.dataBooks.length) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = fetchDataPage;
            fetchReq.filter = {
                columnNames: metaData!.masterReference!.columnNames,
                values: [fetchObj[metaData!.masterReference!.referencedColumnNames[0]]]
            }
            context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                .then((response:any) => response.json())
                .then((fetchData:FetchResponse[]) => {
                    context.server.processFetch(fetchData[0], fetchObj[metaData!.masterReference!.referencedColumnNames[0]].toString());
                    const builtData = context.server.buildDatasets(fetchData[0]);
                    builtData.forEach((data, i) => {
                        const path = new TreePath(JSON.parse(node.key)).getChildPath(i);
                        tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                    })
                    setTreeData(oldState => new Map([...oldState, ...tempTreeMap]))
                    newNodes.current = tempTreeMap;
                })
            
        }
    }

    const sendTreeFetchMulti = (fetchArray?: any[], node?: any) => {
        const tempTreeMap: Map<string, any> = new Map<string, any>();
        fetchArray?.forEach((data, i) => {
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
                    .then((response:any) => response.json())
                    .then((fetchData:FetchResponse[]) => {
                        context.server.processFetch(fetchData[0], data[metaData!.masterReference!.referencedColumnNames[0]].toString());
                        tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                        if (i === fetchArray.length - 1) {
                            node ? setTreeData(oldState => new Map([...oldState, ...tempTreeMap])) : setTreeData(tempTreeMap);
                            newNodes.current = tempTreeMap;
                        }
                    });
            }
            else {
                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                if (i === fetchArray.length - 1) {
                    node ? setTreeData(oldState => new Map([...oldState, ...tempTreeMap])) : setTreeData(tempTreeMap);
                    newNodes.current = tempTreeMap;
                }
            }
        });
    }

    useEffect(() => {
        const firstLvlData = providedData.get(props.dataBooks[0]).get("current") as any[]
        if (props.detectEndNode !== false) {
            sendTreeFetchMulti(firstLvlData);
        }
        else {
            const tempTreeMap:Map<string, any> = new Map<string, any>();
            firstLvlData.forEach((data, i) => {
                const path = new TreePath(i);
                const fetchDataPage = getDataBookByIndex(path.length());
                const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                if (i === firstLvlData.length - 1) {
                    setTreeData(tempTreeMap);
                    newNodes.current = tempTreeMap;
                }
            });
        }
    // eslint-disable-next-line
    }, []);

    const onExpandLoad = (event:any) => {
        if (!event.node.children) {
            let node = {...event.node}
            expandedNode.current = event.node;
            if (props.detectEndNode !== false) {
                sendTreeFetchMulti(getDataRowChildren(new TreePath(JSON.parse(node.key)), treeData.get(node.key)), expandedNode.current);
            }
            else {
                sendTreeFetchSingle(getDataRow(new TreePath(JSON.parse(node.key)), treeData.get(node.key)), expandedNode.current);
            }
        }
    }

    useEffect(() => {
        if (treeData.size > 0) {
            const treeArray:any[] = [];
            let nodeCopy = [...nodes]
            for (let [key, value] of treeData.entries()) {
                if (newNodes.current.has(key)) {
                    const nodeChildren = props.detectEndNode !== false ? getDataRowChildren(new TreePath(JSON.parse(key)), value) : [{}]
                    if (!expandedNode.current) {
                        addTreeNode(key, treeArray, nodeChildren)
                    }
                    else {
                        console.log(expandedNode.current)
                        const nodeIndex = nodeCopy.findIndex((node) => node.key === expandedNode.current.key)
                        expandedNode.current.children = expandedNode.current.children ? expandedNode.current.children : [];
                        addTreeNode(key, expandedNode.current.children, nodeChildren);
                        nodeCopy[nodeIndex] = expandedNode.current
                    }
                }
            }
            newNodes.current = new Map();
            if (!expandedNode.current) {
                setNodes(treeArray);
            }
            else {
                setNodes(nodeCopy);
            }
        }
    },[treeData])

    return (
        <span ref={treeWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Tree value={nodes} onExpand={onExpandLoad}/>
        </span>
    )
}
export default UITree