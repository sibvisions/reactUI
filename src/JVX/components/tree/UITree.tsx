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
import { createFetchRequest, createSelectRowRequest, createSelectTreeRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import { getMetaData } from "../util/GetMetaData";
import FetchResponse from "../../response/FetchResponse";
import TreePath from "../../model/TreePath";
import { SelectFilter } from "../../request/SelectRowRequest";

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
                return dataPage.get(JSON.stringify(referencedRow))[path.getLast()];
            }
        }
        return {}
    }

    const sendTreeFetch = (dataArray:any[], single:boolean, nodesMap:Map<string, any>) => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const parentPath = single ? new TreePath(JSON.parse(nodesMap?.entries().next().value[0])) 
                                  : new TreePath(JSON.parse(nodesMap?.entries().next().value[0])).getParentPath();
        const fetchDataPage = getDataBook(single ? parentPath.length() : parentPath.length()+1);
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        const addedNodes = new Map<string, any>();
        let selectedRow:number;
        let selectedChildren:any[];

        const addNodesToParent = (node:any, builtData:any[], path:TreePath, pSelectedRow:number) => {
            node.leaf = builtData.length === 0;
            builtData.forEach((data, i) => {
                const childPath = path.getChildPath(i);
                const newNode = {
                    key: childPath.toString(),
                    label: data[metaData!.columnView_table_[0]],
                    leaf: childPath.length() === props.dataBooks.length || !single
                }
                node.children = node.children ? node.children : [];
                node.children.push(newNode);
                tempTreeMap.set(childPath.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));
                addedNodes.set(childPath.toString(), newNode);
                if (pSelectedRow === i) {
                    selectedRow = pSelectedRow;
                    selectedChildren = builtData;
                }
            });
        }

        return new Promise<any>((resolve) => {
            const promises = dataArray.map((data, i) => {
                const currPath = parentPath.getChildPath(i);
                const currNode = nodesMap.size > 0 ? (nodesMap.size === 1 ? nodesMap.entries().next().value[1] : nodesMap.get(currPath.toString())) : undefined;
                if (metaData !== undefined && metaData.masterReference !== undefined) {
                    const pkObj = _.pick(data, metaData.masterReference.referencedColumnNames);
                    if (!providedData.get(fetchDataPage).has(JSON.stringify(pkObj))
                        && (isSelfJoined(fetchDataPage) || parentPath.length() + (single ? 0 : 1) < props.dataBooks.length)) {
                        const fetchReq = createFetchRequest();
                        fetchReq.dataProvider = fetchDataPage;
                        fetchReq.filter = {
                            columnNames: metaData.masterReference.columnNames,
                            values: Object.values(pkObj)
                        }

                        return context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                            .then((response:any) => response.json())
                            .then((fetchResponse:FetchResponse[]) => {
                                const builtData = context.server.buildDatasets(fetchResponse[0]);
                                context.server.processFetch(fetchResponse[0], JSON.stringify(pkObj));
                                addNodesToParent(currNode, builtData, single ? parentPath : currPath, fetchResponse[0].selectedRow);
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
            .then(() => {
                resolve({ selectedRow: selectedRow, builtData: selectedChildren, treeMap: tempTreeMap, nodesMap: addedNodes })
            });
        });
    }

    const onExpandLoad = (event:any) => {
        const path = new TreePath(JSON.parse(event.node.key));
        if (props.detectEndNode !== false) {
            if (getDataBook(path.length() + 1)) {
                const nodesMap = new Map<string, any>(event.node.children.map((child:any) => [child.key, child]));
                const dataRowChildren = providedData.get(getDataBook(path.length())).get(JSON.stringify(treeData.get(event.node.key)))
                sendTreeFetch(dataRowChildren, false, nodesMap)
                .then((res:any) => {
                    setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                });
            }
        }
        else {
            const nodesMap = new Map<string, any>();
            nodesMap.set(event.node.key, event.node);
            sendTreeFetch([getDataRow(path, treeData.get(event.node.key))], true, nodesMap)
            .then((res:any) => {
                setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
            });
        }
    }

    const handleRowSelection = (event:any) => {
        if (event.value) {
            const selectedFilters:Array<SelectFilter|null> = []
            setSelectedKey(event.value)
            let path = new TreePath(JSON.parse(event.value));
            while (path.length() !== 0) {
                const dataBook = getDataBook(path.length()-1)
                const dataRow = getDataRow(path, treeData.get(path.toString()));
                const primaryKeys = getMetaData(compId, dataBook, context.contentStore)?.primaryKeyColumns || ["ID"];
                selectedFilters.push({
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => dataRow[pk])
                });
                path = path.getParentPath();
            }
            selectedFilters.reverse();
            while (selectedFilters.length < props.dataBooks.length) {
                selectedFilters.push(null)
            }
            const selectReq = createSelectTreeRequest();
            selectReq.componentId = props.name;
            selectReq.dataProvider = props.dataBooks
            selectReq.filter = selectedFilters;
            context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_TREE);
        }
    }

    useEffect(() => {
        const firstLvlData = providedData.get(props.dataBooks[0]).get("current") as any[];
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const tempNodes:any[] = [];
        const tempExpKeys:any = {}
        let tempSelectedKey:any;

        const initRecursive = (fetchObj:any|any[], single:boolean, dataBookIndex:number, nodesMap:Map<string, any>) => {
            dataBookIndex++
            if (dataBookIndex < props.dataBooks.length) {
                sendTreeFetch(single ? [fetchObj] : fetchObj, single, nodesMap)
                .then((res:any) => {
                    const newNodesMap = new Map<string, any>()
                    for (let [key, value] of res.nodesMap) {
                        if (new TreePath(JSON.parse(key)).getLastOfParent() === selectedRows.get(props.dataBooks[dataBookIndex-1]).selectedIndex) {
                            if (single) {
                                if (new TreePath(JSON.parse(key)).getLast() === res.selectedRow) {
                                    newNodesMap.set(key, value);
                                }
                            }
                            else {
                                newNodesMap.set(key, value);
                            }
                        }
                    }
                    const nodeEntries = newNodesMap.entries()
                    let entry = nodeEntries.next();
                    while (!entry.done) {
                        let path = new TreePath(JSON.parse(entry.value[0]))
                        if (path.getLast() === res.selectedRow) {
                            tempExpKeys[path.toString()] = true;
                            tempSelectedKey = path.toString();
                        }
                        entry = nodeEntries.next();
                    }
                    setTreeData(prevState => new Map([...prevState, ...tempTreeMap, ...res.treeMap]));
                    if (res.selectedRow !== undefined) {
                        return initRecursive(single ? res.builtData[res.selectedRow] : res.builtData, single, dataBookIndex, newNodesMap);
                    }
                    else {
                        setExpandedKeys(tempExpKeys);
                        setSelectedKey(tempSelectedKey);
                    }
                })
            }
            else {
                setExpandedKeys(tempExpKeys);
                setSelectedKey(tempSelectedKey);
            }
        }

        const nodesMap = new Map<string, any>();
        firstLvlData.forEach((data, i) => {
            const path = new TreePath(i);
            const metaData = getMetaData(compId, props.dataBooks[0], context.contentStore);
            const addedNode = {
                key: path.toString(),
                label: data[metaData!.columnView_table_[0]],
                leaf: props.detectEndNode !== false
            };

            if (data === selectedRows.get(props.dataBooks[0])?.dataRow) {
                tempExpKeys[path.toString()] = true;
                tempSelectedKey = path.toString()
            }

            if (props.detectEndNode !== false) {
                nodesMap.set(path.toString(), addedNode);
            }
            else if (data === selectedRows.get(props.dataBooks[0])?.dataRow) {
                nodesMap.set(path.toString(), addedNode);
                initRecursive(data, true, 0, nodesMap);
            }
            
            tempNodes.push(addedNode);
            tempTreeMap.set(path.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));
        });
        setNodes(tempNodes);
        if (props.detectEndNode !== false) {
            if (firstLvlData.includes(selectedRows.get(props.dataBooks[0])?.dataRow)) {
                initRecursive(firstLvlData, false, 0, nodesMap);
            }
            else {
                sendTreeFetch(firstLvlData, false, nodesMap)
                .then((res:any) => {
                    setTreeData(prevState => new Map([...prevState, ...tempTreeMap, ...res.treeMap]));
                });
            }
        }
        else {
            setTreeData(tempTreeMap);
        }

    // eslint-disable-next-line
    }, [rebuildTree]);

    useEffect(() => {
        const selectedIndices:number[] = []
        const expKeys:any = {}
        let filteredNodes = nodes
        const sortedSR = new Map([...selectedRows.entries()].sort((a ,b) => {
            if (props.dataBooks.findIndex(dataBook => dataBook === a[0]) > props.dataBooks.findIndex(dataBook => dataBook === b[0])) {
                return 1;
            }
            else if (props.dataBooks.findIndex(dataBook => dataBook === a[0]) < props.dataBooks.findIndex(dataBook => dataBook === b[0])) {
                return -1;
            }
            else {
                return 0
            }
        }));
        for(let [key, value] of sortedSR.entries()) {
            selectedIndices.push(value.selectedIndex);
            const path = new TreePath(selectedIndices)
            //console.log(key, value, path.toString());
            //console.log(filteredNodes.find(node => node.key === path.toString()).children)
            if (filteredNodes.find(node => node.key === path.toString()).children === undefined) {
                const parentPath = path.getParentPath()
                //console.log(treeData.get(parentPath.toString()), providedData.get(getDataBook(parentPath.length())).get(JSON.stringify(treeData.get(parentPath.toString()))))
                const dataRowChildren = providedData.get(getDataBook(parentPath.length())).get(JSON.stringify(treeData.get(parentPath.toString())))
                sendTreeFetch(dataRowChildren, false, new Map(filteredNodes.map((node:any) => [node.key, node])))
                .then((res:any) => {
                    console.log([...res.nodesMap.values()])
                    filteredNodes = [...res.nodesMap.values()]
                })
            }
            filteredNodes = filteredNodes.find(node => node.key === path.toString()).children
            expKeys[path.toString()] = true
        }
        setSelectedKey(new TreePath(selectedIndices).toString());
        setExpandedKeys(expKeys)
    }, [selectedRows])


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