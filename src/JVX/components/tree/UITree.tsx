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
            return metaData.masterReference.referencedDataBook === dataBook
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
    }, [providedData, getDataBook]);

    const sendTreeFetch = useCallback((fetchObj:any, nodeReference:any) => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const parentPath = new TreePath(JSON.parse(nodeReference.key))
        const fetchDataPage = getDataBook(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);

        const addNodesToParent = (node:any, builtData:any[]) => {
            node.leaf = builtData.length === 0;
            
            builtData.forEach((data, i) => {
                const childPath = parentPath.getChildPath(i);
                const newNode = {
                    key: childPath.toString(),
                    label: data[metaData!.columnView_table_[0]],
                    leaf: childPath.length() === props.dataBooks.length
                };
                node.children = node.children ? node.children : [];
                if (!node.children.some((child:any) => child.key === newNode.key)) {
                    node.children.push(newNode);
                }
                tempTreeMap.set(childPath.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));
            })
        }

        return new Promise<any>((resolve, reject) => {
            if (metaData !== undefined && metaData.masterReference !== undefined) {
                const pkObj = _.pick(fetchObj, metaData.masterReference.referencedColumnNames);
                if (!providedData.get(fetchDataPage).has(JSON.stringify(pkObj)) && fetchDataPage) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData.masterReference.columnNames,
                        values: Object.values(pkObj)
                    }
                    //TODO: try sendRequest with optional parameter
                    context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                    .then((response:any) => response.json())
                    .then((fetchResponse:FetchResponse[]) => {
                        const builtData = context.server.buildDatasets(fetchResponse[0]);
                        context.server.processFetch(fetchResponse[0], JSON.stringify(pkObj));
                        addNodesToParent(nodeReference, builtData);
                    })
                    .then(() => resolve({treeMap: tempTreeMap}))
                }
                else {
                    const builtData = providedData.get(fetchDataPage).get(JSON.stringify(pkObj));
                    addNodesToParent(nodeReference, builtData);
                    resolve({treeMap: tempTreeMap})
                }
            }
            else {
                reject()
            }
        })
    }, [context.contentStore, context.server, compId, getDataBook, props.dataBooks.length, providedData])

    const onExpandLoad = (event:any) => {
        const path = new TreePath(JSON.parse(event.node.key));
        let tempTreeMap:Map<string, any> = new Map([...treeData]);
        if (props.detectEndNode !== false) {
            if (getDataBook(path.length() + 1)) {
                const dataRowChildren:any[] = providedData.get(getDataBook(path.length())).get(JSON.stringify(treeData.get(event.node.key)));
                Promise.allSettled(dataRowChildren.map(async (data, i) => {
                    return sendTreeFetch(data, event.node.children[i])
                    .then((res:any) => tempTreeMap = new Map([...tempTreeMap, ...res.treeMap]));
                }))
                .then(() => setTreeData(prevState => new Map([...prevState, ...tempTreeMap])));
            }
        }
        else {
            sendTreeFetch(getDataRow(path, treeData.get(event.node.key), treeData), event.node)
            .then((res:any) => {
                tempTreeMap = new Map([...tempTreeMap, ...res.treeMap]);
            }).then(() => setTreeData(tempTreeMap));
        }
    }

    const handleRowSelection = (event:any) => {
        if (event.value) {
            const selectedFilters:Array<SelectFilter|null> = []
            const selectedDatabooks = props.dataBooks;
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
            while (selectedFilters.length < selectedDatabooks.length) {
                selectedFilters.push(null)
            }
            while (selectedDatabooks.length < selectedFilters.length && isSelfJoined(selectedDatabooks.slice(-1).pop() as string)) {
                selectedDatabooks.push(selectedDatabooks.slice(-1).pop() as string)
            }
            const selectReq = createSelectTreeRequest();
            selectReq.componentId = props.name;
            selectReq.dataProvider = props.dataBooks
            selectReq.filter = selectedFilters;
            context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_TREE);
        }
    }

    const recursiveCallback = useCallback(async (treeMap:Map<string, any>) => {
        const selectedIndices:number[] = [];
        const expKeys:any = {};
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

        const getReferencedNode = (path: TreePath) => {
            let tempNode: any = nodes[path.get(0)];
            for (let i = 1; i < path.length(); i++) {
                tempNode = tempNode.children[path.get(i)]
            }
            return tempNode
        }

        for (let [key, data] of sortedSR.entries()) {
            if (!isSelfJoined(key)) {
                selectedIndices.push(data.selectedIndex);
                const path = new TreePath(selectedIndices);
                if (path.getParentPath().length() > 0) {
                    expKeys[path.getParentPath().toString()] = true;
                }
                if (getDataBook(path.length())) {
                    if (props.detectEndNode !== false) {
                        const currData = providedData.get(getDataBook(path.length() - 1)).get("current");
                        const dataRowChildren:any[] = path.length() !== 1 ? currData : [currData[data.selectedIndex]];
                        for (let [i, value] of dataRowChildren.entries()) {
                            await sendTreeFetch(value, getReferencedNode(path.length() !== 1 ? path.getParentPath().getChildPath(i) : path))
                            .then((response:any) => treeMap = new Map([...treeMap, ...response.treeMap]));
                        }
                    }
                    else {
                        await sendTreeFetch(getDataRow(path, treeMap.get(path.toString()), treeMap), getReferencedNode(path))
                        .then((response:any) => treeMap = new Map([...treeMap, ...response.treeMap]));
                    }
                }
            }
        }
        const lastDatabook = Array.from(sortedSR.keys()).pop() as string
        if (isSelfJoined(lastDatabook)) {
            const responseValue = sortedSR.get(lastDatabook);
            const metaData = getMetaData(compId, lastDatabook, context.contentStore);
            const selfJoinedPath = responseValue.treePath.getChildPath(responseValue.selectedIndex)

            let prevRow = JSON.stringify(metaData?.masterReference?.referencedColumnNames.reduce((obj:any, key:any) => {
                obj[key] = null;
                return obj
            },{}));

            for (let i = 0; i < selfJoinedPath.length(); i++) {
                selectedIndices.push(selfJoinedPath.get(i));
                const path = new TreePath(selectedIndices);
                if (path.getParentPath().length() > 0) {
                    expKeys[path.getParentPath().toString()] = true;
                }
                const dataRowChildren = providedData.get(lastDatabook).get(prevRow);
                for (let [i, value] of dataRowChildren.entries()) {
                    await sendTreeFetch(value, getReferencedNode(path.getParentPath().getChildPath(i)))
                    .then((response:any) => treeMap = new Map([...treeMap, ...response.treeMap]));
                }
                prevRow = JSON.stringify(_.pick(dataRowChildren[selfJoinedPath.get(i)], metaData!.masterReference!.referencedColumnNames));
            }
        }

        setSelectedKey(new TreePath(selectedIndices).toString());
        setExpandedKeys((prevState:any) => Object.assign(prevState, expKeys));
        setTreeData(treeMap);
    },[getDataBook, getDataRow, props.dataBooks, props.detectEndNode, providedData, selectedRows, sendTreeFetch])

    useEffect(() => {
        //TODO: if selfjoined dont use current use pk null
        const firstLvlData = providedData.get(props.dataBooks[0]).get("current") as any[];
        let tempTreeMap: Map<string, any> = treeData;
        const metaData = getMetaData(compId, props.dataBooks[0], context.contentStore);

        Promise.allSettled(firstLvlData.map((data, i) => {
            const path = new TreePath(i);
            const addedNode = {
                key: path.toString(),
                label: data[metaData!.columnView_table_[0]],
                leaf: props.detectEndNode !== false
            };
            nodes.push(addedNode);
            tempTreeMap.set(path.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));
            if (data === selectedRows.get(props.dataBooks[0])?.dataRow) {
                return recursiveCallback(tempTreeMap);
            }
            else if (props.detectEndNode !== false) {
                return sendTreeFetch(data, addedNode).then((res: any) => tempTreeMap = new Map([...tempTreeMap, ...res.treeMap]));
            }
        })).then(() => setTreeData(prevState => new Map([...prevState, ...tempTreeMap])));
        setInitRender(true)
        // eslint-disable-next-line
    }, [rebuildTree]);

    useEffect(() => {
        if (initRender) {
            recursiveCallback(treeData)
        }
    }, [selectedRows]);

    console.log(providedData)

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