/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


/** 3rd Party imports */
import { Tree } from 'primereact/tree';
import * as _ from 'underscore'

/** Hook imports */
import useProperties from "../zhooks/useProperties";
import useAllDataProviderData from "../zhooks/useAllDataProviderData";
import useAllRowSelect from "../zhooks/useAllRowSelect";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { jvxContext } from "../../jvxProvider";
import { LayoutContext } from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import { createFetchRequest, createSelectRowRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import { getMetaData } from "../util/GetMetaData";
import FetchResponse from "../../response/FetchResponse";
import TreePath from "../../model/TreePath";

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
    /** The selected rows of each databook */
    const selectedRows = useAllRowSelect(compId, props.dataBooks)

    const [rebuildTree, setRebuildTree] = useState<boolean>(false);

    const [treeData, setTreeData] = useState<Map<string, any>>(new Map<string, any>());

    const [nodes, setNodes] = useState<any[]>([]);

    const [expandedKeys, setExpandedKeys] = useState<any>({});

    const [selectedKey, setSelectedKey] = useState<any>();

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

    const sendTreeFetch = (dataArray:any[], prevNode:any|undefined, nodesList:any[], single:boolean) => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();

        const parentPath = prevNode ? new TreePath(JSON.parse(prevNode.key)) : new TreePath();

        const fetchDataPage = getDataBook(single ? parentPath.length() : parentPath.length()+1);
        const currDataBook = single ? fetchDataPage : getDataBook(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        
        let selectedResponse:FetchResponse;
        let selectedChildren:any[];
        let selectedNode:any;

        const getNodeToAdd = (key:string, label:string, leaf:boolean) => {
            return {
                key: key,
                label: label,
                leaf: leaf
            }
        }

        const setResponseValues = (data:any, path:TreePath, leaf:boolean, pkValues:any, response:FetchResponse, builtData:any[], addedNodes:any[]) => {
            const addedNode = getNodeToAdd(path.toString(), data[metaData!.columnView_table_[0]], leaf);
            addedNodes.push(addedNode);
            tempTreeMap.set(path.toString(), pkValues);
            if (_.isEqual(selectedRows.get(currDataBook), data)) {
                selectedResponse = response;
                selectedChildren = builtData;
                selectedNode = addedNode;
            }
        }

        return new Promise<any>((resolve) => {
            const promises = dataArray.map((data, i) => {
                if (metaData !== undefined && metaData.masterReference !== undefined) {
                    const pkValues = data[metaData.masterReference.referencedColumnNames[0]];

                    if (!providedData.get(fetchDataPage).has(pkValues.toString())
                        && (isSelfJoined(fetchDataPage) || parentPath.length() + (single ? 0 : 1) < props.dataBooks.length)) {
                        const fetchReq = createFetchRequest();
                        fetchReq.dataProvider = fetchDataPage;
                        fetchReq.filter = {
                            columnNames: metaData.masterReference.columnNames,
                            values: [pkValues]
                        }

                        return context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                            .then((response:any) => response.json())
                            .then((fetchResponse:FetchResponse[]) => {
                                const builtData = context.server.buildDatasets(fetchResponse[0]);
                                const addedNodes:any[] = [];
                                context.server.processFetch(fetchResponse[0], pkValues.toString());
                                
                                if (single) {
                                    prevNode.leaf = builtData.length === 0;
                                    builtData.forEach((bData, i) => {
                                        setResponseValues(
                                            bData, 
                                            parentPath.getChildPath(i), 
                                            fetchDataPage === props.dataBooks[props.dataBooks.length - 1], 
                                            bData[metaData!.masterReference!.referencedColumnNames[0]],
                                            fetchResponse[0], 
                                            builtData,
                                            addedNodes
                                        );
                                    });
                                }
                                else {
                                    setResponseValues(
                                        data,
                                        parentPath.getChildPath(i),
                                        builtData.length === 0,
                                        pkValues,
                                        fetchResponse[0],
                                        builtData,
                                        addedNodes
                                    )
                                }

                                return {nodes: addedNodes, dataPage: fetchDataPage}
                            })
                    }
                    else {
                        return Promise.reject();
                    }
                }
                else {
                    return Promise.reject();
                }
            });

            Promise.allSettled(promises)
            .then((results:any[]) => {
                results.forEach(result => {
                    if (result.status === "fulfilled") {
                        if (!prevNode) {
                            result.value.nodes.forEach((node:any) => {
                                nodesList.push(node);
                            })
                            
                        }
                        else {
                            prevNode.children = prevNode.children ? prevNode.children : [];
                            result.value.nodes.forEach((node:any) => {
                                prevNode.children.push(node);
                            })
                            
                        }
                    }
                });
                resolve({ response: selectedResponse, builtData: selectedChildren, treeMap: tempTreeMap, selectedNode: selectedNode })
            });
        });
    }

    const onExpandLoad = (event:any) => {
        const path = new TreePath(JSON.parse(event.node.key));
        if (props.detectEndNode !== false) {
            if (getDataBook(path.length() + 1)) {
                sendTreeFetch(getDataRowChildren(path, treeData.get(event.node.key)), event.node, nodes, false)
                .then((res:any) => {
                    setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                });
            }
            else {
                const tempTreeMap: Map<string, any> = new Map<string, any>();
                const dataBook = getDataBook(props.dataBooks.length - 1);
                const metaData = getMetaData(compId, dataBook, context.contentStore);
                getDataRowChildren(path, treeData.get(event.node.key)).forEach((data, i) => {
                    if (!treeData.has(path.getChildPath(i).toString())) {
                        event.node.children = event.node.children ? event.node.children : []
                        event.node.children.push({
                            key: path.getChildPath(i).toString(),
                            label: data[metaData!.columnView_table_[0]],
                            leaf: true
                        });
                        tempTreeMap.set(path.getChildPath(i).toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
                    }  
                });
                if (tempTreeMap.size > 0) {
                    setTreeData(oldState => new Map([...oldState, ...tempTreeMap]));
                }
            }
        }
        else {
            sendTreeFetch([getDataRow(path, treeData.get(event.node.key))], event.node, nodes, true)
            .then((res:any) => {
                setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
            });
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
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const tempNodes:any[] = [];
        const initRecursive = (fetchObj:any|any[], selectedNode:any|undefined, single:boolean, dataBookIndex:number) => {
            dataBookIndex++
            if (single) {
                if (dataBookIndex < props.dataBooks.length) {
                    console.log(fetchObj)
                    sendTreeFetch([fetchObj], selectedNode, nodes, true)
                    .then((res:any) => {
                        setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                        if (res.response !== undefined && res.response.selectedRow !== -0x80000000 && res.response.selectedRow !== -1) {
                            return initRecursive(res.builtData[res.response.selectedRow], res.selectedNode, true, dataBookIndex);
                        }    
                    });
                }
            }
            else {
                if (dataBookIndex < props.dataBooks.length) { 
                    sendTreeFetch(fetchObj, selectedNode, tempNodes, false)
                    .then((res:any) => {
                        setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                        if (res.response !== undefined && res.response.selectedRow !== -0x80000000 && res.response.selectedRow !== -1) {
                            return initRecursive(res.builtData, res.selectedNode, false, dataBookIndex);
                        }    
                    });
                }
            }

        }

        if (props.detectEndNode !== false) {
            if (firstLvlData.includes(selectedRows.get(props.dataBooks[0]))) {
                setNodes(tempNodes)
                initRecursive(firstLvlData, undefined, false, 0);
            }
            else {
                setNodes(tempNodes)
                sendTreeFetch(firstLvlData, undefined, tempNodes, false)
                .then((res:any) => {
                    setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                });
            }
        }
        else {
            firstLvlData.forEach((data, i) => {
                const path = new TreePath(i);
                const fetchDataPage = getDataBook(path.length());
                const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
                const addedNode = {
                    key: path.toString(),
                    label: data[metaData!.columnView_table_[0]],
                    leaf: false
                }
                
                if (data === selectedRows.get(props.dataBooks[0])) {
                    initRecursive(firstLvlData.find(data => data === selectedRows.get(props.dataBooks[0])), addedNode, true, 0)
                }
                tempNodes.push(addedNode);
                setNodes(tempNodes)
                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
            });
            setTreeData(tempTreeMap);
        }
    // eslint-disable-next-line
    }, [rebuildTree]);

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