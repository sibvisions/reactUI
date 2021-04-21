/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


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
import { createFetchRequest, createSelectTreeRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import { getMetaData } from "../util/GetMetaData";
import FetchResponse from "../../response/FetchResponse";
import TreePath from "../../model/TreePath";
import { SelectFilter } from "../../request/SelectRowRequest";
import { containsObject } from "../util/ContainsObject";

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

    const [initRender, setInitRender] = useState<boolean>(false)

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
            setInitRender(false);
            setExpandedKeys({});
            setNodes([]);
            setTreeData(new Map());
            setRebuildTree(prevState => !prevState);        
        }

        context.subscriptions.subscribeToTreeChange(props.dataBooks[0], updateRebuildTree);
        return () => context.subscriptions.unsubscribeFromTreeChange(props.dataBooks[0], updateRebuildTree);
    }, [context.subscriptions, props.dataBooks]);

    const isSelfJoined = useCallback((dataBook:string) => {
        const metaData = getMetaData(compId, dataBook, context.contentStore)
        if (metaData?.masterReference)
            return metaData.masterReference.referencedDataBook === metaData?.dataProvider
        else
            return false;
    }, [context.contentStore, compId])

    const getDataBook = useCallback((level:number) => {
        if (level < props.dataBooks.length)
            return props.dataBooks[level]
        else {
            const dataBook = props.dataBooks[props.dataBooks.length-1];
            if (isSelfJoined(dataBook))
                return dataBook
            else
                return ""
        }
    }, [isSelfJoined, props.dataBooks])

    const getDataRow = useCallback((path:TreePath, value:any, pTreeData:Map<string, any>) => {
        const dataPage = providedData.get(getDataBook(path.length()-1));
        if (dataPage) {
            if (path.length() === 1)
                return dataPage.get("current")[path.getLast()];
            else if (value !== undefined) {
                const referencedRow = pTreeData.get(path.getParentPath().toString())
                return dataPage.get(JSON.stringify(referencedRow))[path.getLast()];
            }
        }
        return {}
    }, [providedData, getDataBook])

    const sendTreeFetch = useCallback((dataArray:any[], single:boolean, nodesMap:Map<string, any>) => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const parentPath = single ? new TreePath(JSON.parse(nodesMap?.entries().next().value[0])) 
                                  : new TreePath(JSON.parse(nodesMap?.entries().next().value[0])).getParentPath();
        const fetchDataPage = getDataBook(single ? parentPath.length() : parentPath.length()+1);
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        const addedNodes = new Map<string, any>();
        let selectedRow:number;
        let selectedChildren:any[];

        const addNodesToParent = (node:any, builtData:any[], path:TreePath, pSelectedRow?:number) => {
            node.leaf = builtData.length === 0;
            builtData.forEach((data, i) => {
                const childPath = path.getChildPath(i);
                const newNode = {
                    key: childPath.toString(),
                    label: data[metaData!.columnView_table_[0]],
                    leaf: childPath.length() === props.dataBooks.length || !single
                }
                node.children = node.children ? node.children : [];
                if (!node.children.some((child:any) => child.key === newNode.key)) {
                    node.children.push(newNode);

                }
                tempTreeMap.set(childPath.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));
                addedNodes.set(childPath.toString(), newNode);
                if (pSelectedRow !== undefined && pSelectedRow === i) {
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
                        return new Promise<void> ((resolve) => {
                            const builtData = providedData.get(fetchDataPage).get(JSON.stringify(pkObj));
                            const sr = selectedRows.get(fetchDataPage)?.selectedIndex;
                            addNodesToParent(currNode, builtData, single ? parentPath : currPath, sr);
                            resolve()
                        })
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
    }, [context.contentStore, context.server, compId, getDataBook, isSelfJoined, props.dataBooks.length, providedData, selectedRows])

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
            sendTreeFetch([getDataRow(path, treeData.get(event.node.key), treeData)], true, nodesMap)
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
                const dataRow = getDataRow(path, treeData.get(path.toString()), treeData);
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

    const recursiveCallback = useCallback(async (nodesArray:any[], treeMap:Map<string, any>) => {
        const selectedIndices:number[] = [];
        const expKeys:any = {};
        let filteredNodes = nodesArray;
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

        for (let [, value] of sortedSR.entries()) {
            selectedIndices.push(value.selectedIndex);
            const path = new TreePath(selectedIndices);
            expKeys[path.toString()] = true;
            if (props.detectEndNode !== false) {
                if (filteredNodes.find(node => node.key === path.toString()).children === undefined) {
                    const parentPath = path.getParentPath()
                    const dataRowChildren = parentPath.length() === 0 ? providedData.get(props.dataBooks[0]).get("current") : 
                                                                        providedData.get(getDataBook(parentPath.length())).get(JSON.stringify(treeMap.get(parentPath.toString())));
                    if (dataRowChildren !== undefined) {
                        const tempNodesMap: Map<string, any> = new Map<string, any>();
                        const foundNode = filteredNodes.find(node => node.key === path.toString())
                        tempNodesMap.set(foundNode.key, foundNode);

                        let fetchRes = await sendTreeFetch(dataRowChildren, false, new Map(filteredNodes.map((node:any) => [node.key, node])));
                        filteredNodes = [...fetchRes.nodesMap.values()].filter(val => new TreePath(JSON.parse(val.key)).getParentPath().toString() === path.toString());
                        treeMap = new Map([...treeMap, ...fetchRes.treeMap]);
                    }
                }
                else {
                    filteredNodes = filteredNodes.find(node => node.key === path.toString()).children
                }
            }
            else {
                const tempNodesMap: Map<string, any> = new Map<string, any>();
                const foundNode = filteredNodes.find(node => node.key === path.toString())
                tempNodesMap.set(foundNode.key, foundNode);
                let fetchRes = await sendTreeFetch([getDataRow(path, treeMap.get(path.toString()), treeMap)], true, tempNodesMap);
                filteredNodes = [...fetchRes.nodesMap.values()];
                treeMap = new Map([...treeMap, ...fetchRes.treeMap]);
            }
        }
        setSelectedKey(new TreePath(selectedIndices).toString());
        setExpandedKeys(expKeys);
        if (treeMap.size > 0)
            setTreeData(treeMap);
    },[getDataBook, getDataRow, props.dataBooks, props.detectEndNode, providedData, selectedRows, sendTreeFetch])

    useEffect(() => {
        const firstLvlData = providedData.get(props.dataBooks[0]).get("current") as any[];
        let tempTreeMap:Map<string, any> = treeData;
        const tempNodes:any[] = nodes;
        const tempExpKeys:any = {}

        const nodesMap = new Map<string, any>();
        const metaData = getMetaData(compId, props.dataBooks[0], context.contentStore);
        firstLvlData.forEach((data, i) => {
            const path = new TreePath(i);
            const addedNode = {
                key: path.toString(),
                label: data[metaData!.columnView_table_[0]],
                leaf: props.detectEndNode !== false
            };

            tempNodes.push(addedNode);
            tempTreeMap.set(path.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));

            if (data === selectedRows.get(props.dataBooks[0])?.dataRow) {
                tempExpKeys[path.toString()] = true;
            }

            if (props.detectEndNode !== false) {
                nodesMap.set(path.toString(), addedNode);
            }
            else if (data === selectedRows.get(props.dataBooks[0])?.dataRow) {
                nodesMap.set(path.toString(), addedNode);
                recursiveCallback(tempNodes, tempTreeMap);
            }


        });
        setNodes(tempNodes);
        if (props.detectEndNode !== false) {
            if (containsObject(selectedRows.get(props.dataBooks[0])?.dataRow, firstLvlData)) {
                recursiveCallback(tempNodes, tempTreeMap);
            }
            else {
                sendTreeFetch(firstLvlData, false, nodesMap)
                    .then((res: any) => {
                        setTreeData(prevState => new Map([...prevState, ...tempTreeMap, ...res.treeMap]));
                    });
            }
        }
        else {
            setTreeData(tempTreeMap);
        }
        setInitRender(true)
    // eslint-disable-next-line
    }, [rebuildTree]);

    useEffect(() => {
        if (initRender) {
            recursiveCallback(nodes, treeData)
        }
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