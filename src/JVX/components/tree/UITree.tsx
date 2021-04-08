/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


/** 3rd Party imports */
import { Tree } from 'primereact/tree';
import * as _ from 'underscore'

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

    const sendTreeFetchSingle = (fetchObj: any, prevNode: any) => {
        const tempTreeMap: Map<string, any> = new Map<string, any>();
        const parentPath = new TreePath(JSON.parse(prevNode.key));
        const fetchDataPage = getDataBook(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        let selectedNode: any
        return new Promise<any>(resolve => {
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
                        .then((response: any) => response.json())
                        .then((fetchResponse: FetchResponse[]) => {
                            context.server.processFetch(fetchResponse[0], pkValues.toString());
                            const builtData = context.server.buildDatasets(fetchResponse[0]);
                            if (!builtData.length) {
                                prevNode.leaf = true
                            }
                            builtData.forEach((data, i) => {
                                const path = parentPath.getChildPath(i);
                                prevNode.children = prevNode.children ? prevNode.children : []
                                const addedNode = {
                                    key: path.toString(),
                                    label: data[metaData!.columnView_table_[0]],
                                    leaf: fetchDataPage !== props.dataBooks[props.dataBooks.length - 1] ? false : true
                                }
                                prevNode.children.push(addedNode);
                                if (_.isEqual(selectedRows.get(fetchDataPage), data)) {
                                    selectedNode = addedNode
                                }
                                tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]])
                            });
                            resolve({ response: fetchResponse[0], builtData: builtData, treeMap: tempTreeMap, selectedNode: selectedNode })
                        });
                }
                else {
                    resolve({treeMap: tempTreeMap})
                }
            }
            else {
                resolve({treeMap: tempTreeMap})
            }
        });
    }

    const sendTreeFetchMulti = (dataArray: any[], prevNode?:any) => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();

        const getPath = (index:number) => {
            if (prevNode) {
                return new TreePath(JSON.parse(prevNode.key)).getChildPath(index)
            }
            else {
                return new TreePath(index);
            }
        }
        return new Promise<any>(resolve => {
            dataArray.forEach((data, i) => {
                console.log(data)
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
                                console.log(builtData)
                                tempTreeMap.set(path.toString(), pkValues);
                            })
                    }
                    else {
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
        })

    }

    const onExpandLoad = (event:any) => {
        let node = { ...event.node }
        expandedNode.current = event.node;
        const path = new TreePath(JSON.parse(node.key));
        if (props.detectEndNode !== false) {
            if (getDataBook(path.length() + 1)) {
                sendTreeFetchMulti(getDataRowChildren(path, treeData.get(node.key)), expandedNode.current);
            }
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
            sendTreeFetchSingle(getDataRow(path, treeData.get(node.key)), event.node)
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
        let alreadyFetched:boolean = false
        const initRecursive = (fetchObj:any|any[], selectedNode:any, single:boolean) => {
            if (single) {
                sendTreeFetchSingle(fetchObj, selectedNode)
                .then((res:any) => {
                    setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                    if (res.response !== undefined && res.response.selectedRow !== -0x80000000 && res.response.selectedRow !== -1) {
                        return initRecursive(res.builtData[res.response.selectedRow], res.selectedNode, true);
                    }    
                });
            }
            else {
                sendTreeFetchMulti(fetchObj, selectedNode)
                .then((res:any) => {
                    setTreeData(prevState => new Map([...prevState, ...res.treeMap]));
                    if (res.response !== undefined && res.response.selectedRow !== -0x80000000 && res.response.selectedRow !== -1) {
                        return initRecursive(res.builtData[res.response.selectedRow], res.selectedNode, false);
                    }    
                });
            }

        }

        firstLvlData.forEach((data, i) => {
            const path = new TreePath(i);
            const fetchDataPage = getDataBook(path.length());
            const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
            const prevNodeMap:Map<string,any> = new Map<string, any>();
            const addedNode = {
                key: path.toString(),
                label: data[metaData!.columnView_table_[0]],
                leaf: false
            }
            
            if (data === selectedRows.get(props.dataBooks[0])) {
                initRecursive(firstLvlData.find(data => data === selectedRows.get(props.dataBooks[0])), addedNode, props.detectEndNode === false ? true : false)
                alreadyFetched = true;
            }
            tempNodes.push(addedNode);
            setNodes(tempNodes)
            tempTreeMap.set(path.toString(), data[metaData!.masterReference!.referencedColumnNames[0]]);
        });
        setTreeData(tempTreeMap);

        if (props.detectEndNode !== false && !alreadyFetched) {
            sendTreeFetchMulti(firstLvlData);
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