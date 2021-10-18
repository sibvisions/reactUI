/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


/** 3rd Party imports */
import { Tree } from 'primereact/tree';
import * as _ from 'underscore'

/** Hook imports */
import { useProperties, useAllDataProviderData, useAllRowSelect, useLayoutValue, useMouseListener, usePopupMenu } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { appContext } from "../../AppProvider";
import {getMetaData, getSelfJoinedRootReference, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback} from "../util";
import { createFetchRequest, createSelectTreeRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS, SelectFilter } from "../../request";
import { FetchResponse } from "../../response";
import TreePath from "../../model/TreePath";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";

/** Interface for Tree */
export interface ITree extends BaseComponent {
    dataBooks: string[],
    detectEndNode: boolean
}

/**
 * This component displays a Tree based on server sent databooks
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITree: FC<ITree> = (baseProps) => {
    /** Reference for the span that is wrapping the tree containing layout information */
    const treeWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<ITree>(baseProps.id, baseProps);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** ComponentId of the screen */
    const compId = context.contentStore.getComponentId(props.id) as string;
    /** The data provided by the databooks */
    const providedData = useAllDataProviderData(compId, props.dataBooks);
    /** The selected rows of each databook */
    const selectedRows = useAllRowSelect(compId, props.dataBooks)
    /** State flag which gets switched, if the Tree is supposed to rebuild itself from scratch */
    const [rebuildTree, setRebuildTree] = useState<boolean>(false);
    /** 
     * A Map of the current state of every node with their respective referenced column, the nodes
     * The keys are the nodes saved as TreePath and the value is the parents primary key/referenced column
     */
    const [treeData, setTreeData] = useState<Map<string, any>>(new Map<string, any>());
    /** Current state of the node objects which are handled by PrimeReact to display in the Tree */
    const [nodes, setNodes] = useState<any[]>([]);
    /** State of the keys of the nodes which are expanded */
    const [expandedKeys, setExpandedKeys] = useState<any>({});
    /** State of the key of a single node that is selected */
    const [selectedKey, setSelectedKey] = useState<any>();
    /** Helper state so the second useEffect doesn't trigger on the first render */
    const [initRender, setInitRender] = useState<boolean>(false)
    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Hook for MouseListener */
    useMouseListener(props.name, treeWrapperRef.current ? treeWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /**
     * Subscribes to TreeChange, when triggered, states are reset so the Tree can rebuild itself
     * as it is initializing.
     * @returns unsubscribing from TreeChange
     */
    useEffect(() => {
        const updateRebuildTree = () => {
            setInitRender(false);
            setExpandedKeys({});
            nodes.length = 0
            setTreeData(new Map());
            setRebuildTree(prevState => !prevState);        
        }

        context.subscriptions.subscribeToTreeChange(props.dataBooks[0], updateRebuildTree);
        return () => context.subscriptions.unsubscribeFromTreeChange(props.dataBooks[0], updateRebuildTree);
    }, [context.subscriptions, props.dataBooks]);

    /**
     * Returns true if the given databook is self-joined (references itself in masterReference) false if it isn't
     * @param dataBook - the databook to check
     * @returns true if the given databook is self-joined false if it isn't
     */
    const isSelfJoined = useCallback((dataBook:string) => {
        const metaData = getMetaData(compId, dataBook, context.contentStore);
        if (metaData?.masterReference)
            return metaData.masterReference.referencedDataBook === dataBook;
        else
            return false;
    }, [context.contentStore, compId])

    /**
     * Returns the name of the databook of given level, if the level is too high,
     * an empty string is returned unless the last databook is self-joined,
     * then the self-joined databook is returned.
     * @param level - the level of depth
     * @returns the name of the databook of given level
     */
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

    /**
     * Returns the correct datarow based on the given path or an empty object if none was found
     * @param path - the wanted path/datarow
     * @param referencedRow - the referenced parent row of the wanted path/datarow
     * @returns the correct datarow based on the given path or an empty object if none was found
     */
    const getDataRow = useCallback((path:TreePath, referencedRow:any) => {
        const dataBook = getDataBook(path.length() - 1);
        const metaData = getMetaData(compId, dataBook, context.contentStore)
        const dataPage = providedData.get(dataBook);
        if (dataPage) {
            if (path.length() === 1) {
                //if path length is 1 there is only a current in the dataprovider map except for self-joined
                //in that case the root reference (pks of parent with null) is chosen. path.getLast() because it
                //is the index of the saved row.
                return dataPage.get(isSelfJoined(dataBook) ? getSelfJoinedRootReference(metaData!.masterReference!.referencedColumnNames) : "current")[path.getLast()];
            }
                
            else {
                //In the dataprovider map, the key to the datapage are the referenced columns and their value of the parent stringified.
                //So the parent row (referencedRow) gets stringified and the last of the path is used to get the correct row.
                return dataPage.get(JSON.stringify(referencedRow))[path.getLast()];
            }
                
        }
        return {}
    }, [providedData, getDataBook]);

    /**
     * Either sends a fetch to receive the next datarows and adds them to the parent node
     * or just adds the nodes to the parent nodes if the data is already fetched.
     * @param fetchObj - the datarow which childrens are to be fetched
     * @param nodeReference - the reference to the node to add the children
     */
    const sendTreeFetch = useCallback((fetchObj:any, nodeReference:any) => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const parentPath = new TreePath(JSON.parse(nodeReference.key))
        const fetchDataPage = getDataBook(parentPath.length());
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);

        /**
         * Adds the child nodes to the referenced Node, if they are't already added
         * also adds the child nodes to the treedata
         * @param builtData - the fetched data
         */
        const addNodesToParent = (builtData:any[]) => {
            nodeReference.leaf = builtData.length === 0;
            builtData.forEach((data, i) => {
                const childPath = parentPath.getChildPath(i);
                nodeReference.children = nodeReference.children ? nodeReference.children : [];
                if (!nodeReference.children.some((child:any) => child.key === childPath.toString())) {
                    const newNode = {
                        key: childPath.toString(),
                        label: data[metaData!.columnView_table_[0]],
                        leaf: childPath.length() === props.dataBooks.length
                    };
                    nodeReference.children.push(newNode);
                    
                }
                tempTreeMap.set(childPath.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));            
            })
        }

        return new Promise<any>((resolve, reject) => {
            if (metaData !== undefined && metaData.masterReference !== undefined) {
                //picking out the referenced columns of the datarow
                const pkObj = _.pick(fetchObj, metaData.masterReference.referencedColumnNames);
                if (!providedData.get(fetchDataPage).has(JSON.stringify(pkObj)) && fetchDataPage) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData.masterReference.columnNames,
                        values: Object.values(pkObj)
                    }
                    //TODO: try sendRequest with optional parameter
                    showTopBar(context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 5000)
                    .then((response:any) => response.json())
                    .then((fetchResponse:FetchResponse[]) => {
                        const builtData = context.server.buildDatasets(fetchResponse[0]);
                        //stringify the pkObj to create the key for the datapages in dataprovider map
                        context.server.processFetch(fetchResponse[0], JSON.stringify(pkObj));
                        addNodesToParent(builtData);
                    })
                    .then(() => resolve({treeMap: tempTreeMap})), topbar)
                }
                else {
                    //the data is already fetched so don't send a fetch and get the data by pkObj
                    const builtData = providedData.get(fetchDataPage).get(JSON.stringify(pkObj));
                    addNodesToParent(builtData);
                    resolve({treeMap: tempTreeMap})
                }
            }
            else {
                reject()
            }
        })
    }, [context.contentStore, context.server, compId, getDataBook, props.dataBooks.length, providedData])

    /**
     * This event is called when a node is expanded, it calls the function to send fetches and sets the treedata
     * @param event - the event sent
     */
    const onExpandLoad = (event:any) => {
        const path = new TreePath(JSON.parse(event.node.key));
        let tempTreeMap:Map<string, any> = new Map([...treeData]);
        if (props.detectEndNode !== false) {
            //Only fetch if there is another databook underneath
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
            sendTreeFetch(getDataRow(path, tempTreeMap.get(path.getParentPath().toString())), event.node)
            .then((res:any) => {
                tempTreeMap = new Map([...tempTreeMap, ...res.treeMap]);
            }).then(() => setTreeData(tempTreeMap));
        }
    }

    /**
     * This event is called when a node is selected, it builds the select tree request and sends it to the server
     * @param event 
     */
    const handleRowSelection = (event:any) => {
        if (event.value) {
            const selectedFilters:Array<SelectFilter|null> = []
            const selectedDatabooks = props.dataBooks;
            let path = new TreePath(JSON.parse(event.value));
            //filters are build parth upwards
            while (path.length() !== 0) {
                const dataBook = getDataBook(path.length()-1)
                const dataRow = getDataRow(path, treeData.get(path.getParentPath().toString()));
                const primaryKeys = getMetaData(compId, dataBook, context.contentStore)?.primaryKeyColumns || ["ID"];
                selectedFilters.push({
                    columnNames: primaryKeys,
                    values: primaryKeys.map(pk => dataRow[pk])
                });
                path = path.getParentPath();
            }
            //array needs to be reversed so server can process them
            selectedFilters.reverse();
            //for databooks below, which are not selected/deselected add null to the filters
            while (selectedFilters.length < selectedDatabooks.length) {
                selectedFilters.push(null)
            }
            //If the databook is self-joined fill the array with its name
            while (selectedDatabooks.length < selectedFilters.length && isSelfJoined(selectedDatabooks.slice(-1).pop() as string)) {
                selectedDatabooks.push(selectedDatabooks.slice(-1).pop() as string)
            }
            const selectReq = createSelectTreeRequest();
            selectReq.componentId = props.name;
            selectReq.dataProvider = props.dataBooks
            selectReq.filter = selectedFilters;
            showTopBar(context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_TREE), topbar);
        }
    }

    /**
     * When rows are selected by the server or by the user selectedRows get sorted and looped through, nodes are fetched/added
     * if necessary.
     */
    const recursiveCallback = useCallback(async () => {
        //An array which is used to get the current path and at the end the selected key of the node
        const selectedIndices:number[] = [];
        //Object which stores which keys are currently extended
        const expKeys:any = {};
        let tempTreeMap:Map<string, any> = new Map([...treeData]);
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

        /**
         * Returns the referenced node based on the given path
         * @param path - the path
         * @returns the referenced node based on the given path
         */
        const getReferencedNode = (path: TreePath) => {
            let tempNode: any = nodes[path.get(0)];
            for (let i = 1; i < path.length(); i++) {
                tempNode = tempNode.children[path.get(i)]
            }
            return tempNode
        }

        for (let [key, data] of sortedSR.entries()) {
            if (!isSelfJoined(key)) {
                selectedIndices.push(data.index);
                const path = new TreePath(selectedIndices);
                if (path.getParentPath().length() > 0) {
                    expKeys[path.getParentPath().toString()] = true;
                }
                if (getDataBook(path.length())) {
                    if (props.detectEndNode !== false) {
                        const currData = providedData.get(getDataBook(path.length() - 1)).get("current");
                        const dataRowChildren:any[] = path.length() !== 1 ? currData : [currData[data.index]];
                        for (let [i, value] of dataRowChildren.entries()) {
                            await sendTreeFetch(value, getReferencedNode(path.length() !== 1 ? path.getParentPath().getChildPath(i) : path))
                            .then((response:any) => tempTreeMap = new Map([...tempTreeMap, ...response.treeMap]));
                        }
                    }
                    else {
                        //don't fetch last row on select! only on expand
                        if (key !== [...sortedSR.keys()].slice(-1).pop()) {
                            await sendTreeFetch(getDataRow(path, tempTreeMap.get(path.getParentPath().toString())), getReferencedNode(path))
                            .then((response:any) => tempTreeMap = new Map([...tempTreeMap, ...response.treeMap]));
                        }
                    }
                }
            }
        }
        const lastDatabook = Array.from(sortedSR.keys()).pop() as string;
        //If the last databook is self-joined, some additional fetches need to be performed
        if (isSelfJoined(lastDatabook)) {
            const responseValue = sortedSR.get(lastDatabook);
            const metaData = getMetaData(compId, lastDatabook, context.contentStore);
            const selfJoinedPath = responseValue.treePath.getChildPath(responseValue.index);
            //init the previous row with the root reference
            let prevRow = getSelfJoinedRootReference(metaData!.masterReference!.referencedColumnNames);

            for (let i = 0; i < selfJoinedPath.length(); i++) {
                selectedIndices.push(selfJoinedPath.get(i));
                const path = new TreePath(selectedIndices);
                if (path.getParentPath().length() > 0) {
                    expKeys[path.getParentPath().toString()] = true;
                }
                if (props.detectEndNode !== false) {
                    const dataRowChildren = providedData.get(lastDatabook).get(prevRow);
                    for (let [i, value] of dataRowChildren.entries()) {
                        await sendTreeFetch(value, getReferencedNode(path.getParentPath().getChildPath(i)))
                        .then((response:any) => tempTreeMap = new Map([...tempTreeMap, ...response.treeMap]));
                    }
                    //set previous row for the next iteration to the current selected row
                    prevRow = JSON.stringify(_.pick(dataRowChildren[selfJoinedPath.get(i)], metaData!.masterReference!.referencedColumnNames));
                }
                else {
                    const dataRow = providedData.get(lastDatabook).get(prevRow)[selfJoinedPath.get(i)]
                    if (i < selfJoinedPath.length() - 1) {
                        await sendTreeFetch(dataRow, getReferencedNode(path))
                        .then((response:any) => tempTreeMap = new Map([...tempTreeMap, ...response.treeMap]));
                    }
                    prevRow = JSON.stringify(_.pick(dataRow, metaData!.masterReference!.referencedColumnNames));
                }
            }
        }
        setSelectedKey(new TreePath(selectedIndices).toString());
        setExpandedKeys((prevState:any) => Object.assign(prevState, expKeys));
        setTreeData(prevState => new Map([...prevState, ...tempTreeMap]));
    },[getDataBook, getDataRow, props.dataBooks, props.detectEndNode, providedData, selectedRows, sendTreeFetch])

    /**
     * Inits the tree: gets the data of the first level and adds them to nodes
     * calls fetches if necessary and sets the treedata
     */
    useEffect(() => {
        const firstLvlDataBook = props.dataBooks[0];
        const metaData = getMetaData(compId, firstLvlDataBook, context.contentStore);

        //let firstLvlData:any[] = providedData.get(firstLvlDataBook).get("current");
        let tempTreeMap: Map<string, any> = treeData;

        /**
         * When the first databook is self-joined, the root page must be fetched always.
         * Sets self-joined "null" datapage in dataprovider map
         * @returns the datarows of the root page
         */
        const fetchSelfJoinedRoot = async () => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = firstLvlDataBook;
            fetchReq.filter = {
                columnNames: metaData!.masterReference!.referencedColumnNames,
                values: [null]
            }
            const response:any = await showTopBar(context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 10000), topbar)
            const fetchResponse = await response.json();
            context.server.processFetch(fetchResponse[0], getSelfJoinedRootReference(metaData!.masterReference!.referencedColumnNames));
            const builtData = context.server.buildDatasets(fetchResponse[0])
            return builtData;
        }

        const fetchAndBuildNodes = (data:any[]) => {
            //allSettled so the tree waits for all fetches to be finished and then it sets the treedata
            Promise.allSettled(data.map((data, i) => {
                const path = new TreePath(i);
                const addedNode = {
                    key: path.toString(),
                    label: data[metaData!.columnView_table_[0]],
                    leaf: props.detectEndNode !== false
                };

                nodes.push(addedNode);
                tempTreeMap.set(path.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));

                //if the current row is selected, call the recursive callback to fetch the row
                //and potential selected rows below
                if (data === selectedRows.get(props.dataBooks[0])?.dataRow || 
                    (isSelfJoined(firstLvlDataBook) && _.isEqual(data, getDataRow(new TreePath(selectedRows.get(props.dataBooks[0])?.treePath.get(0)), {})))) {
                    return recursiveCallback();
                }
                //else if detectEndNode true fetch and add the children to the nodes
                else if (props.detectEndNode !== false) {
                    return sendTreeFetch(data, addedNode).then((res: any) => {
                        tempTreeMap = new Map([...tempTreeMap, ...res.treeMap])
                    });
                }
            })).then(() => {
                setTreeData(prevState => new Map([...prevState, ...tempTreeMap]))
            });
            setInitRender(true)
        }

        //if the first databook is self-joined fetch the root page else fetch build up the tree as usual
        if (isSelfJoined(firstLvlDataBook)) {
            fetchSelfJoinedRoot().then((res:any) => fetchAndBuildNodes(res))   
        }
        else {
            fetchAndBuildNodes(providedData.get(firstLvlDataBook).get("current"))
        }
        
        // eslint-disable-next-line
    }, [rebuildTree]);

    /**
     * If the selectedRows change, call recursiveCallback.
     */
    useEffect(() => {
        if (initRender) {
            recursiveCallback();
        }
    }, [selectedRows]);

    const focused = useRef<boolean>(false);

    return (
        <span 
            ref={treeWrapperRef} 
            style={layoutStyle}
            tabIndex={props.tabIndex ? props.tabIndex : 0}
            onFocus={() => {
                if (!focused.current) {
                    if (props.eventFocusGained) {
                        onFocusGained(props.name, context.server);
                    }
                    focused.current = true;
                }
            }}
            onBlur={event => {
                if (treeWrapperRef.current && !treeWrapperRef.current.contains(event.relatedTarget as Node)) {
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, context.server);
                    }
                    focused.current = false;
                }
            }}
            {...usePopupMenu(props)}
        >
            <Tree
                id={props.name}
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