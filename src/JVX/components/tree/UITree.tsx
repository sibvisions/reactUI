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
import { createFetchRequest, createSelectRowRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import useAllDataProviderData from "../zhooks/useAllDataProviderData";
import { getMetaData } from "../util/GetMetaData";
import FetchResponse from "../../response/FetchResponse";
import TreePath from "../../model/TreePath";
import useAllRowSelect from "../zhooks/useAllRowSelect";
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
    const selectedRows = useAllRowSelect(compId, props.dataBooks)

    const [rebuildTree, setRebuildTree] = useState<boolean>(false);

    const [treeData, setTreeData] = useState<Map<string, any>>(new Map<string, any>());

    const [nodes, setNodes] = useState<any[]>([]);

    const [expandedKeys, setExpandedKeys] = useState<any>({});

    const testFunc = () => {
        if (treeData.size > 0) {
            //console.log("starting loop")
            for (let i = props.dataBooks.length-1; i >= 0; i--) {
                if (selectedRows.has(props.dataBooks[i])) {
                    //console.log(selectedRows.get(props.dataBooks[i]), treeData)
                }
            }
        }
        return selectedRows
    }


    const [selectedKey, setSelectedKey] = useState<any>(testFunc());

    const expandedNode = useRef<any>(null);

    const newNodes = useRef<Map<string, any>>(new Map());

    const prevRecursivePath = useRef<TreePath>(new TreePath());

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        const updateRebuildTree = () => {
            expandedNode.current = null;
            setExpandedKeys({})
            setNodes([]);
            setTreeData(new Map());
            setRebuildTree(prevState => !prevState);        
        }

        context.subscriptions.subscribeToTreeChange(props.dataBooks[0], updateRebuildTree);
        return () => context.subscriptions.unsubscribeFromTreeChange(props.dataBooks[0], updateRebuildTree);
    }, [context.subscriptions, props.dataBooks]);

    const isSelfJoined = (dataBook:string) => {
        const metaData = getMetaData(compId, dataBook, context.contentStore)
        if (metaData?.masterReference)
            return metaData.masterReference.referencedDataBook === metaData?.dataProvider
        else
            return false;
    }

    const getDataBook = (level:number) => {
        if (level < props.dataBooks.length)
            return props.dataBooks[level]
        else {
            const dataBook = props.dataBooks[props.dataBooks.length-1];
            if (isSelfJoined(dataBook))
                return dataBook
            else
                return ""
        }
    }

    const getDataRow = (path:TreePath, value:any) => {
        const dataPage = providedData.get(getDataBook(path.length()-1));
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
        const dataPage = providedData.get(getDataBook(path.length()));
        return dataPage?.get(value.toString());
    }

    const addTreeNode = (key:string, array:any[], children?:any) => {
        const path = new TreePath(JSON.parse(key));
        const metaData = getMetaData(compId, getDataBook(path.length()-1), context.contentStore);
        const nodeDataRow = getDataRow(path, treeData.get(key));
        array.push({
            key: key,
            label: nodeDataRow[metaData!.columnView_table_[0]],
            leaf: children ? children.length === 0 : true
        });
    }

    const sendRecursiveFetches = (fetchObj:any, prevPath:TreePath, ptreeMap?:Map<string, any>) => {
        const tempTreeMap:Map<string, any> = ptreeMap ? ptreeMap : new Map<string, any>();
        const parentPath = prevPath as TreePath;
        const fetchDataPage = getDataBook(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        console.log(parentPath.length(), fetchDataPage, metaData)
        if (metaData !== undefined && metaData.masterReference !== undefined) {
            const pkValues = fetchObj[metaData.masterReference.referencedColumnNames[0]];
            if (!providedData.get(fetchDataPage).has(pkValues.toString())
                && (isSelfJoined(fetchDataPage) || parentPath.length() < props.dataBooks.length)) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData.masterReference.columnNames,
                        values: [fetchObj[metaData.masterReference.referencedColumnNames[0]]]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                        .then((response:any) => response.json())
                        .then((fetchResponse:FetchResponse[]) => {
                            context.server.processFetch(fetchResponse[0], pkValues.toString());
                            const builtData = context.server.buildDatasets(fetchResponse[0]);
                            builtData.forEach((data, i) => {
                                const path = prevPath.getChildPath(i);
                                if (data = builtData[fetchResponse[0].selectedRow]) {
                                    prevRecursivePath.current = path;
                                }
                                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]])
                            });
                            if (fetchResponse[0].selectedRow !== -0x80000000 && fetchResponse[0].selectedRow !== -1) {
                                sendRecursiveFetches(builtData[fetchResponse[0].selectedRow], prevRecursivePath.current, tempTreeMap)
                            }
                        })
                        .then(() => {
                            if (prevPath === undefined) {
                                setTreeData(prevState => new Map([...prevState, ...tempTreeMap]))
                                newNodes.current = tempTreeMap;
                            }
                        })
                }
        }
    }

    const sendTreeFetchSingle = (fetchObj: any, node: any) => {
        const tempTreeMap: Map<string, any> = new Map<string, any>();

        const fillTempTree = (dataArray:any[]) => {
            dataArray.forEach((data, i) => {
                const path = new TreePath(JSON.parse(node.key)).getChildPath(i);
                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
            });
            setTreeData(prevState => new Map([...prevState, ...tempTreeMap]));
            newNodes.current = tempTreeMap;
            if (newNodes.current.size === 0)
                node.leaf = true;
        }

        const parentPath = new TreePath(JSON.parse(node.key));
        const fetchDataPage = getDataBook(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        if (metaData !== undefined && metaData.masterReference !== undefined) {
            if (!providedData.get(fetchDataPage).has(fetchObj[metaData!.masterReference!.referencedColumnNames[0]].toString())
                && (isSelfJoined(fetchDataPage) || parentPath.length() < props.dataBooks.length)) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData!.masterReference!.columnNames,
                        values: [fetchObj[metaData!.masterReference!.referencedColumnNames[0]]]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                        .then((response: any) => response.json())
                        .then((fetchData: FetchResponse[]) => {
                            context.server.processFetch(fetchData[0], fetchObj[metaData!.masterReference!.referencedColumnNames[0]].toString());
                            const builtData = context.server.buildDatasets(fetchData[0]);
                            fillTempTree(builtData);
                        });
            }
            else {
                const availableData = providedData.get(fetchDataPage).get(fetchObj[metaData!.masterReference!.referencedColumnNames[0]].toString())
                fillTempTree(availableData);
            }
        }
    }

    const sendTreeFetchMulti = (dataArray: any[], node?: any, prevPath?:TreePath, ptreeMap?:Map<string, any>) => {
        const tempTreeMap:Map<string, any> = ptreeMap ? ptreeMap : new Map<string, any>();

        const getPath = (index:number) => {
            if (prevPath) {
                return node ? new TreePath(JSON.parse(node.key)).getChildPath(index) : prevPath.getChildPath(index);
            }
            else {
                return node ? new TreePath(JSON.parse(node.key)).getChildPath(index) : new TreePath(index);
            }
        }

        dataArray.forEach((data, i) => {
            const path = getPath(i);
            const fetchDataPage = getDataBook(path.length());
            const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
            if (metaData !== undefined && metaData.masterReference !== undefined) {
                const pkValues = data[metaData.masterReference.referencedColumnNames[0]];
                if (!providedData.get(fetchDataPage).has(pkValues.toString())
                    && (isSelfJoined(fetchDataPage) || path.length() < props.dataBooks.length)) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData.masterReference.columnNames,
                        values: [pkValues]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                        .then((response:any) => response.json())
                        .then((fetchResponse:FetchResponse[]) => {
                            context.server.processFetch(fetchResponse[0], pkValues.toString());
                            const builtData = context.server.buildDatasets(fetchResponse[0]);
                            tempTreeMap.set(path.toString(), pkValues);
                            if (fetchResponse[0].selectedRow !== -0x80000000 && fetchResponse[0].selectedRow !== -1) {
                                prevRecursivePath.current = path;
                                sendTreeFetchMulti(builtData, undefined, prevRecursivePath.current, tempTreeMap)
                            }
                        })
                        .then(() => {
                            if (i === dataArray.length - 1 && prevPath === undefined) {
                                node ? setTreeData(prevState => new Map([...prevState, ...tempTreeMap])) : setTreeData(tempTreeMap);
                                newNodes.current = tempTreeMap;
                            }
                        });
                }
                else {
                    tempTreeMap.set(path.toString(), pkValues);
                    if (i === dataArray.length - 1 && prevPath === undefined) {
                        node ? setTreeData(prevState => new Map([...prevState, ...tempTreeMap])) : setTreeData(tempTreeMap);
                        newNodes.current = tempTreeMap;
                    }
                }
            }
            else if(!getDataBook(path.length())) {
                const dataBook = getDataBook(props.dataBooks.length - 1);
                const metaData = getMetaData(compId, dataBook, context.contentStore);
                if (!providedData.get(dataBook).has(data[metaData!.masterReference!.referencedColumnNames[0]].toString())) {
                    tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                }
            }
        });
    }

    const onExpandLoad = (event:any) => {
        let node = { ...event.node }
        expandedNode.current = event.node;
        const path = new TreePath(JSON.parse(node.key));
        if (props.detectEndNode !== false) {
            if (getDataBook(path.length() + 1))
                sendTreeFetchMulti(getDataRowChildren(path, treeData.get(node.key)), expandedNode.current);
            else {
                const tempTreeMap: Map<string, any> = new Map<string, any>();
                const dataBook = getDataBook(props.dataBooks.length - 1);
                const metaData = getMetaData(compId, dataBook, context.contentStore);
                getDataRowChildren(path, treeData.get(node.key)).forEach((data, i) => {
                    if (!providedData.get(dataBook).has(data[metaData!.masterReference!.referencedColumnNames[0]].toString()))
                        tempTreeMap.set(path.getChildPath(i).toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                });
                if (tempTreeMap.size > 0) {
                    setTreeData(oldState => new Map([...oldState, ...tempTreeMap]));
                    newNodes.current = tempTreeMap;
                }
            }
        }
        else {
            sendRecursiveFetches(getDataRow(path, treeData.get(node.key)), prevRecursivePath.current);
        }
    }

    const handleRowSelection = (event:any) => {
        if (event.value) {
            setSelectedKey(event.value)
            const path = new TreePath(JSON.parse(event.value));
            let tempPath = new TreePath()
            path.array.forEach((level, i) => {
                tempPath = tempPath.set(i, level);
                const dataBook = getDataBook(i);
                const dataRow = getDataRow(tempPath, treeData.get(tempPath.toString()));
                const primaryKeys = getMetaData(compId, dataBook, context.contentStore)?.primaryKeyColumns || ["ID"];
                const selectReq = createSelectRowRequest();
                selectReq.componentId = props.name;
                selectReq.dataProvider = dataBook;
                selectReq.filter = {
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => dataRow[pk])
                }
                context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_ROW);
            })
        }
    }

    useEffect(() => {
        const firstLvlData = providedData.get(props.dataBooks[0]).get("current") as any[];
        if (props.detectEndNode !== false) {
            sendTreeFetchMulti(firstLvlData);
        }
        else {
            const tempTreeMap:Map<string, any> = new Map<string, any>();
            console.log(selectedRows.get(props.dataBooks[0]))
            firstLvlData.forEach((data, i) => {
                const path = new TreePath(i);
                const fetchDataPage = getDataBook(path.length());
                const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                if (i === firstLvlData.length - 1) {
                    setTreeData(tempTreeMap);
                    newNodes.current = tempTreeMap;
                }
            });
        }
    // eslint-disable-next-line
    }, [rebuildTree]);

    useEffect(() => {
        if (treeData.size > 0) {
            const treeArray:any[] = [];
            let nodeCopy = [...nodes]
            for (let [key, value] of treeData.entries()) {
                if (newNodes.current.has(key)) {
                    const path = new TreePath(JSON.parse(key));
                    let nodeChildren:any[] = [];
                    if (props.detectEndNode !== false)
                        nodeChildren = getDataRowChildren(path, value);
                    else if (isSelfJoined(getDataBook(path.length())) || path.length() < props.dataBooks.length)
                        nodeChildren = [{}]

                    if (!expandedNode.current) {
                        addTreeNode(key, treeArray, nodeChildren)
                    }
                    else {
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
    },[treeData]);

    return (
        <span ref={treeWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Tree 
                value={nodes}
                selectionMode="single"
                selectionKeys={selectedKey}
                expandedKeys={expandedKeys}
                onExpand={onExpandLoad}
                onToggle={e => setExpandedKeys(e.value)}
                onSelectionChange={handleRowSelection}
            />
        </span>
    )
}
export default UITree