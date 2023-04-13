/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/** React imports */
import React, { FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Tree, TreeExpandedKeysType, TreeSelectionParams } from 'primereact/tree';
import IBaseComponent from "../../util/types/IBaseComponent";
import { createFetchRequest, createSelectTreeRequest } from "../../factories/RequestFactory";
import TreePath from "../../model/TreePath";
import { showTopBar } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";
import TreeNode from "primereact/treenode";
import useAllDataProviderData from "../../hooks/data-hooks/useAllDataProviderData";
import useAllRowSelect from "../../hooks/data-hooks/useAllRowSelect";
import { getMetaData } from "../../util/data-util/GetMetaData";
import { getSelfJoinedRootReference } from "../../util/data-util/GetSelfJoinedRootReference";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { SelectFilter } from "../../request/data/SelectRowRequest";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { IExtendableTree } from "../../extend-components/tree/ExtendTree";
import MetaDataResponse, { MetaDataReference } from "../../response/data/MetaDataResponse";
import { IComponentConstants } from "../BaseComponent";

/** Interface for Tree */
export interface ITree extends IBaseComponent {
    dataBooks: string[],
    detectEndNode: boolean
}

interface CustomTreeNode extends TreeNode {
    pageKeyHelper: string,
    data: any
}

type TreeMap = Map<string, string>;

/**
 * Returns the referenced node based on the given pathdFilter
 * @param path - the path
 * @returns the referenced node based on the given path
 */
function getNode(nodes: CustomTreeNode[], path: TreePath) {
    let tempNode = nodes[path.get(0)];
    for (let i = 1; i < path.length(); i++) {
        tempNode = (tempNode?.children ?? [])[path.get(i)] as CustomTreeNode;
    }
    return tempNode
};

/**
 * This component displays a Tree based on server sent databooks
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITree: FC<ITree & IExtendableTree & IComponentConstants> = (props) => {
    /** Name of the screen */
    const screenName = props.context.contentStore.getScreenName(props.id, props.dataBooks && props.dataBooks.length ? props.dataBooks[0] : undefined) as string;

    /** The data provided by the databooks */
    const providedData = useAllDataProviderData(screenName, props.dataBooks);

    /** The selected rows of each databook */
    const selectedRows = useAllRowSelect(screenName, props.dataBooks);

    const [treeDataChanged, setTreeDataChanged] = useState<{ dataBook: string, data: any[]|undefined, pageKey: string }>({ dataBook: "", data: undefined, pageKey: "" });

    /** 
     * A Map of the current state of every node with their respective referenced column, the nodes
     * The keys are the nodes saved as TreePath and the value is the parents primary key/referenced column
     */
    const treeData = useRef<TreeMap>(new Map());

    const lastExpandedLength = useRef<number>(0);

    /** Current state of the node objects which are handled by PrimeReact to display in the Tree */
    const [nodes, setNodes] = useState<CustomTreeNode[]>([]);

    /** State of the keys of the nodes which are expanded */
    const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

    /** State of the key of a single node that is selected */
    const [selectedKey, setSelectedKey] = useState<any>();

    const [isInitialized, setInitialized] = useState(false);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id, detectEndNode } = props;

    /** Helper Methods */

    /**
     * Returns true if the given databook is self-joined (references itself in masterReference) false if it isn't
     * @param dataBook - the databook to check
     * @returns true if the given databook is self-joined false if it isn't
     */
     const isSelfJoined = useCallback((dataBook:string) => {
        const metaData = getMetaData(screenName, dataBook, props.context.contentStore, undefined);
        if (metaData?.masterReference) {
            return metaData.masterReference.referencedDataBook === dataBook;
        } else {
            return false;
        }
    }, [
        props.context.contentStore, 
        screenName
    ]);

    /**
     * Returns the name of the databook of given level, if the level is too high,
     * an empty string is returned unless the last databook is self-joined,
     * then the self-joined databook is returned.
     * @param level - the level of depth
     * @returns the name of the databook of given level
     */
     const getDataBookName = useCallback((level:number) => {
        if (level < props.dataBooks.length) {
            return props.dataBooks[level]
        } else {
            const dataBook = props.dataBooks[props.dataBooks.length-1];
            return isSelfJoined(dataBook) ? dataBook : "";
        }
    }, [
        isSelfJoined, 
        props.dataBooks
    ]);

    /**
     * Returns the correct datarow based on the given path or an empty object if none was found
     * @param path - the wanted path/datarow
     * @param referencedRow - the referenced parent row of the wanted path/datarow
     * @returns the correct datarow based on the given path or an empty object if none was found
     */
     const getDataRow = useCallback((path:TreePath, referencedRow:any) => {
        const dataBookName = getDataBookName(path.length() - 1);
        const metaData = getMetaData(screenName, dataBookName, props.context.contentStore, undefined)
        const dataPage = providedData.get(dataBookName);
        const reference = getReference(dataBookName, metaData as MetaDataResponse, path);
        if (dataPage) {
            if (path.length() === 1) {
                //if path length is 1 there is only a current in the dataprovider map except for self-joined
                //in that case the root reference (pks of parent with null) is chosen. path.getLast() because it
                //is the index of the saved row.
                return dataPage.get(
                    isSelfJoined(dataBookName) 
                        ? getSelfJoinedRootReference(reference!.columnNames)
                        : "current"
                )[path.getLast()];
            } else {
                //In the dataprovider map, the key to the datapage are the referenced columns and their value of the parent stringified.
                //So the parent row (referencedRow) gets stringified and the last of the path is used to get the correct row.
                return dataPage.get(referencedRow)[path.getLast()];
            }  
        }
        return {}
    }, [
        screenName,
        providedData, 
        getDataBookName
    ]);

    const getReference = (dataBook:string, metaData:MetaDataResponse, parentPath: TreePath) => {
        if (isSelfJoined(dataBook) && metaData!.rootReference && dataBook !== getDataBookName(parentPath.length() - 1)) {
            return metaData!.rootReference ?? metaData!.masterReference;
        }
        else {
            return metaData!.masterReference
        }
    }

    const getFilterObj = (metaData: MetaDataResponse, reference: MetaDataReference, data:any) => {
        const arr = metaData!.masterReference!.columnNames.map((columnName) => {
            // Is there a reference to the parent table?
            if (!reference!.columnNames.includes(columnName)) {
              return null;
            }
    
            // Get the name of the column in the parent table.
            const parentColumn = reference!.referencedColumnNames[reference!.columnNames.indexOf(columnName)];
    
            // Get the value of the column in the parent table.
            if (data[parentColumn] !== undefined) {
              return data[parentColumn];
            } else {
              return null;
            }
        });

        return {
            columnNames: reference.columnNames,
            values: arr
        };
    }

    /**
     * Either sends a fetch to receive the next datarows and adds them to the parent node
     * or just adds the nodes to the parent nodes if the data is already fetched.
     * @param fetchObj - the datarow which childrens are to be fetched
     * @param nodeReference - the reference to the node to add the children
     */
    const getChildrenForDataRow = useCallback((fetchObj:any, nodeReference: CustomTreeNode) => {
        if(!nodeReference) {
            return Promise.reject();
        }
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const parentPath = new TreePath(
            typeof nodeReference.key === "string" 
                ? JSON.parse(nodeReference.key) 
                : typeof nodeReference.key === "undefined" 
                    ? [] 
                    : [nodeReference.key]
        );
        const fetchDataPage = getDataBookName(parentPath.length());
        const metaData = getMetaData(screenName, fetchDataPage, props.context.contentStore, undefined);
        const reference = getReference(fetchDataPage, metaData as MetaDataResponse, parentPath);
        
        const filter = getFilterObj(metaData as MetaDataResponse, reference as MetaDataReference, fetchObj);
        const pkObj:any = {}
        filter.columnNames.forEach((key, i) => pkObj[key] = filter.values[i])

        /**
         * Adds the child nodes to the referenced Node, if they aren't already added
         * also adds the child nodes to the treedata
         * @param builtData - the fetched data
         */
        const addNodesToParent = (builtData:any[]) => {
            nodeReference.leaf = builtData.length === 0;
            builtData.forEach((data, i) => {
                const path = parentPath.getChildPath(i);
                nodeReference.children = (nodeReference.children ? nodeReference.children : []) as CustomTreeNode[];
                const isPotentialParent = getDataBookName(path.length()) !== "";
                const childPkObj:any = {}
                if (getDataBookName(path.length())) {
                    const childDataPage = getDataBookName(path.length());
                    const childMetaData = getMetaData(screenName, childDataPage, props.context.contentStore, undefined);
                    const childReference = getReference(childDataPage, childMetaData as MetaDataResponse, path);
                    const childFilter = getFilterObj(childMetaData as MetaDataResponse, childReference as MetaDataReference, data);
                    childFilter.columnNames.forEach((key, i) => childPkObj[key] = childFilter.values[i]);
                }
                if (!nodeReference.children.some((child:any) => child.key === path.toString())) {
                    (nodeReference.children as CustomTreeNode[]).push({
                        key: path.toString(),
                        label: metaData!.columnView_tree_.length ? data[metaData!.columnView_tree_[0]] : undefined,
                        leaf: !isPotentialParent,
                        pageKeyHelper: isPotentialParent ? getDataBookName(path.length() - 1) + "_" + JSON.stringify(childPkObj) : "",
                        data: data
                    });
                }
                tempTreeMap.set(path.toString(), JSON.stringify(childPkObj));            
            })
        }

        return new Promise<{ treeMap: TreeMap }>(async (resolve, reject) => {
            if (metaData?.masterReference !== undefined) {
                //stringify the pkObj to create the key for the datapages in dataprovider map
                const pkObjStringified = JSON.stringify(pkObj);
                if (fetchDataPage && !providedData.get(fetchDataPage).has(pkObjStringified)) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = filter;
                    await showTopBar(props.context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH)
                        .then(() => {
                            const builtData = providedData.get(fetchDataPage).get(pkObjStringified);
                            addNodesToParent(builtData);
                        }), props.topbar)
                } else {
                    //the data is already fetched so don't send a fetch and get the data by pkObjStringified
                    const builtData = providedData.get(fetchDataPage).get(pkObjStringified);
                    addNodesToParent(builtData);
                }
                resolve({treeMap: tempTreeMap})
            } else {
                reject()
            }
        })
    }, [
        props.context.contentStore, 
        props.context.server, 
        screenName, 
        getDataBookName, 
        props.dataBooks, 
        providedData
    ]);

    /**
     * This event is called when a node is selected, it builds the select tree request and sends it to the server
     * If the lib user extends the Tree with onRowSelect, call it when a row is selected.
     * @param event 
     */
    const handleRowSelection = (event:TreeSelectionParams) => {
        if (event.value && typeof event.value === "string") {
            const selectedFilters:Array<SelectFilter|null> = []
            const selectedDatabooks = props.dataBooks;
            let path = new TreePath(JSON.parse(event.value));
            
            if (props.onRowSelect) {
                props.onRowSelect({ originalEvent: event,  selectedRow: getDataRow(path, treeData.current.get(path.toString()))});
            }

            //filters are build path upwards
            while (path.length()) {
                const dataBook = getDataBookName(path.length() -1)
                const dataRow = getDataRow(path, treeData.current.get(path.getParentPath().toString()));
                const primaryKeys = getMetaData(screenName, dataBook, props.context.contentStore, undefined)?.primaryKeyColumns || ["ID"];
                selectedFilters.push({
                    columnNames: primaryKeys,
                    values: primaryKeys.map((pk: string) => dataRow[pk])
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
            showTopBar(props.context.server.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_TREE), props.topbar);
        }
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = props.forwardedRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(
                id, 
                props.className, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                wrapperRef, 
                onLoadCallback
            )
        }
    }, [
        onLoadCallback, 
        id, 
        props.preferredSize, 
        props.maximumSize, 
        props.minimumSize,
        props.className
    ]);

    /**
     * Subscribes to TreeChange, when triggered, states are reset so the Tree can rebuild itself
     * as it is initializing.
     * @returns unsubscribing from TreeChange
     */
    useEffect(() => {
        const updateRebuildTree = () => {
            setExpandedKeys(prevKeys => ({...prevKeys}));
        }
        if (props.dataBooks && props.dataBooks.length) {
            props.context.subscriptions.subscribeToTreeChange(props.dataBooks[0], updateRebuildTree);
        }

        props.context.subscriptions.subscribeToTreeDataChange(props.dataBooks.join("_"), (dataBook:string, data: any[], pageKeyHelper:string) => setTreeDataChanged({ dataBook: dataBook, data: data, pageKey: pageKeyHelper}))
        
        return () => {
            if (props.dataBooks && props.dataBooks.length) {
                props.context.subscriptions.unsubscribeFromTreeChange(props.dataBooks[0], updateRebuildTree);
            }
            props.context.subscriptions.unsubscribeFromTreeDataChange(props.dataBooks.join("_"));
        }
    }, [
        props.context.subscriptions, 
        props.dataBooks
    ]);

    /**
     * Inits the tree: gets the data of the first level and adds them to nodes
     * calls fetches if necessary and sets the treedata
     */
    useEffect(() => {
        if (props.dataBooks && props.dataBooks.length) {
            const firstLvlDataBook = props.dataBooks[0];
            const metaData = getMetaData(screenName, firstLvlDataBook, props.context.contentStore, undefined);
            let tempTreeMap = treeData.current;

            /**
             * When the first databook is self-joined, the root page must be fetched always.
             * Sets self-joined "null" datapage in dataprovider map
             * @returns the datarows of the root page
             */
            const fetchRoot = async () => {
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = firstLvlDataBook;
                fetchReq.filter = {
                    columnNames: [],
                    values: []
                }
                fetchReq.rootKey = true;
                const fetchResponse = await showTopBar(props.context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), props.topbar);
                if (fetchResponse && fetchResponse.length) {
                    const rootKey = props.context.contentStore.getDataBook(screenName, firstLvlDataBook)?.rootKey;
                    if (rootKey) {
                        return providedData.get(firstLvlDataBook).get(rootKey)
                    }
                }
                return []
            }

            const buildNodes = async (data: any[] = []) => {
                const newNodes = [...nodes];
                await Promise.allSettled(data.map(async (dataRow, i) => {
                    const path = new TreePath(i);
                    const isPotentialParent = getDataBookName(path.length()) !== "";
                    const childDataPage = getDataBookName(1);
                    const childMetaData = getMetaData(screenName, childDataPage, props.context.contentStore, undefined);
                    const reference = getReference(childDataPage, childMetaData as MetaDataResponse, new TreePath())
                    const filter = getFilterObj(childMetaData as MetaDataResponse, reference as MetaDataReference, dataRow);
                    const pkObj:any = {}
                    filter.columnNames.forEach((key, i) => pkObj[key] = filter.values[i]);
                    const addedNode: CustomTreeNode = {
                        key: path.toString(),
                        label: metaData!.columnView_tree_.length ? dataRow[metaData!.columnView_tree_[0]] : undefined,
                        leaf: !isPotentialParent,
                        pageKeyHelper: isPotentialParent ? firstLvlDataBook + "_" + JSON.stringify(pkObj) : "",
                        data: dataRow
                    };

                    newNodes[i] = addedNode;

                    if (detectEndNode !== false) {
                        await getChildrenForDataRow(dataRow, addedNode).then((res: any) => {
                            tempTreeMap = new Map([...tempTreeMap, ...res.treeMap])
                        });
                    }

                    tempTreeMap.set(path.toString(), JSON.stringify(pkObj));
                }));
                treeData.current = new Map([...treeData.current, ...tempTreeMap]);
                setNodes(newNodes);
                setInitialized(true);
            }

            fetchRoot().then((res: any) => buildNodes(res))

            //if the first databook is self-joined fetch the root page else fetch build up the tree as usual
            // if (isSelfJoined(firstLvlDataBook)) {
            //     fetchSelfJoinedRoot().then((res: any) => buildNodes(res))
            // }
            // else {
            //     buildNodes(providedData?.get(firstLvlDataBook)?.get("current"))
            // }
        }
    }, [providedData.size]);

    /**
     * Check if we have all the data for the tree we need if the expanded keys change
     * If the lib user extends the Tree with onTreeChange, call it when the Tree is expanded/shrinks or changes.
     */
     useEffect(() => {
        if (props.onTreeChange) {
            props.onTreeChange(expandedKeys);
        }
        
        async function growTree(){
            const newNodes = [...nodes];
            let tempTreeData = new Map(treeData.current);

            // for (let key of Object.keys(expandedKeys).filter(k => expandedKeys[k])) {
            //     const path = new TreePath(JSON.parse(key));
            //     const node = getNode(newNodes, path);
            //     if (node) {
            //         if (detectEndNode !== false) {
            //             //Only fetch if there is another databook underneath
            //             if (getDataBookName(path.length())) {
            //                 const dataRowChildren:any[] = providedData.get(getDataBookName(path.length())).get(treeData.current.get(key));
            //                 if(dataRowChildren) {
            //                     await Promise.allSettled(dataRowChildren.map((data, i) => 
            //                         getChildrenForDataRow(data, (node.children ?? [])[i] as CustomTreeNode)
            //                             .then((res:any) => tempTreeData = new Map([...tempTreeData, ...res.treeMap]))
            //                     ))
            //                     .then(() => treeData.current = new Map([...treeData.current, ...tempTreeData]));
            //                 }
            //             }
            //         } else {
            //             await getChildrenForDataRow(getDataRow(path, tempTreeData.get(path.getParentPath().toString())), node)
            //                 .then(res => tempTreeData = new Map([...tempTreeData, ...res.treeMap]))
            //             treeData.current = new Map([...treeData.current, ...tempTreeData])
            //         }
            //     }  
            // }
            
            if(lastExpandedLength.current < Object.keys(expandedKeys).length) {
                const key = Object.keys(expandedKeys)[Object.keys(expandedKeys).length - 1];
                const path = new TreePath(JSON.parse(key));
                const node = getNode(newNodes, path);
                if (node) {
                    if (detectEndNode !== false) {
                        //Only fetch if there is another databook underneath
                        if (getDataBookName(path.length())) {
                            const dataRowChildren:any[] = providedData.get(getDataBookName(path.length())).get(treeData.current.get(key));
                            if(dataRowChildren) {
                                await Promise.allSettled(dataRowChildren.map((data, i) => 
                                    getChildrenForDataRow(data, node.children ? node.children[i] as CustomTreeNode : node)
                                        .then((res:any) => tempTreeData = new Map([...tempTreeData, ...res.treeMap]))
                                ))
                                .then(() => treeData.current = new Map([...treeData.current, ...tempTreeData]));
                            }
                        }
                    } 
                    else {
                        await getChildrenForDataRow(getDataRow(path, tempTreeData.get(path.getParentPath().toString())), node)
                            .then(res => tempTreeData = new Map([...tempTreeData, ...res.treeMap]))
                        treeData.current = new Map([...treeData.current, ...tempTreeData])
                    }
                }
            }
            lastExpandedLength.current = Object.keys(expandedKeys).length;
            setNodes(newNodes);
        }
        if(isInitialized) growTree();
    }, [ expandedKeys, isInitialized ]);

    /**
     * If the selectedRows change, generate the tree selectedKey and expandedKey
     */
    useEffect(() => {
        if (props.dataBooks && props.dataBooks.length) {
            const selected = selectedRows.get(props.dataBooks[0]);
            if (selected) {
                let treePath: TreePath;
                if (isSelfJoined(props.dataBooks[0])) {
                    treePath = new TreePath([...(selected.treePath?.toArray() ?? []), selected.index]);
                } else {
                    treePath = new TreePath(props.dataBooks.map(db => selectedRows.get(db)?.index ?? -1).filter(v => v > -1));
                }
                setSelectedKey(treePath.toString());
                setExpandedKeys(prevState => {
                    const newState = ({...prevState, ...treePath.toArray().slice(0, -1).reduce((a, n, i, arr) => ({...a, [`[${arr.slice(0, i + 1).join(',')}]`]: true}) , {})});
                    return JSON.stringify(prevState) === JSON.stringify(newState) ? prevState : newState;
                });
            }
        }
    }, [selectedRows]);

    useEffect(() => {
        if (treeDataChanged.data && !treeDataChanged.pageKey.includes("noMasterRow")) {
            const getNodes = (arr: CustomTreeNode[], identifier: string, type: "pageKey"|"key") => {
                let nodesToReturn:CustomTreeNode[] = [];

                const recurse = (arr: CustomTreeNode[]) => {
                    for (const node of arr) {
                        if ((type === "pageKey" && node.pageKeyHelper === identifier) || (type === "key" && node.key === identifier)) {
                            nodesToReturn.push(node);
                        }

                        if (node.children) {
                            recurse(node.children as CustomTreeNode[]);
                        }
                    }
                }

                recurse(arr);
                return nodesToReturn;
            }

            const nodesCopy = [...nodes];
            const baseNodeData = getDataBookName(0) === treeDataChanged.dataBook && props.context.contentStore.getDataBook(screenName, getDataBookName(0))!.rootKey === treeDataChanged.pageKey;
            const metaData = getMetaData(screenName, treeDataChanged.dataBook, props.context.contentStore) as MetaDataResponse;
            let parentNodes:CustomTreeNode[] = [];
            if (!baseNodeData) {
                if (metaData) {
                    if (metaData.masterReference) {
                        let parentNodeKey = "";
                        parentNodeKey = metaData.masterReference!.referencedDataBook + "_" + treeDataChanged.pageKey;
                        parentNodes = getNodes(nodesCopy, parentNodeKey, "pageKey");
                    }
                    else {
                        console.warn("masterreference for databook: ", treeDataChanged.dataBook + " in tree: " + props.name + "not set!")
                    }

                }
            }

            if (!baseNodeData && !parentNodes.length) {
                return;
            }

            const newNodes:CustomTreeNode[] = [];

            treeDataChanged.data.forEach((dataRow, index) => {
                let isPotentialParent = baseNodeData && getDataBookName(1) !== "";
                const createNode = (parentNode: CustomTreeNode|undefined) => {
                    const parentPath = new TreePath(parentNode ? JSON.parse(parentNode.key as string) : []);
                    const path = parentPath.getChildPath(index);
                    const childPkObj:any = {}
                    if (getDataBookName(path.length())) {
                        const childDataPage = getDataBookName(path.length());
                        const childMetaData = getMetaData(screenName, childDataPage, props.context.contentStore, undefined);
                        const childReference = getReference(childDataPage, childMetaData as MetaDataResponse, path);
                        const childFilter = getFilterObj(childMetaData as MetaDataResponse, childReference as MetaDataReference, dataRow);
                        childFilter.columnNames.forEach((key, i) => childPkObj[key] = childFilter.values[i]);
                    }
                    isPotentialParent = isPotentialParent || (parentNode !== undefined && getDataBookName(path.length()) !== "");
                    let newNode:CustomTreeNode = {
                        key: path.toString(),
                        label: metaData!.columnView_tree_.length ? dataRow[metaData!.columnView_tree_[0]] : undefined,
                        leaf: !isPotentialParent,
                        pageKeyHelper: isPotentialParent ? getDataBookName(parentPath.length()) + "_" + JSON.stringify(childPkObj) : "",
                        data: dataRow
                    }
    
                    const oldNode = getNode(nodes, path);
                    if (oldNode) {
                        newNode = { ...newNode, children: oldNode.children };
    
                        if (oldNode.leaf) {
                            newNode = { ...newNode, leaf: true }
                        }
                    }
                    newNodes.push(newNode);
                }
                if (parentNodes.length) {
                    parentNodes.forEach(parentNode => {
                        createNode(parentNode);
                    })
                }
                else {
                    createNode(undefined);
                }

            });

            if (baseNodeData) {
                setNodes(newNodes);
            }
            else {
                if (parentNodes) {
                    parentNodes.forEach(parentNode => {
                        parentNode.children = newNodes;
                    })
                }
                setNodes(nodesCopy);
            }
        }
    }, [treeDataChanged])

    const focused = useRef<boolean>(false);

    return (
        <span 
            ref={props.forwardedRef}
            id={props.name + "-_wrapper"} 
            style={props.layoutStyle}
            tabIndex={props.tabIndex ? props.tabIndex : 0}
            onFocus={() => {
                if (!focused.current) {
                    if (props.eventFocusGained) {
                        onFocusGained(props.name, props.context.server);
                    }
                    focused.current = true;
                }
            }}
            onBlur={event => {
                if (props.forwardedRef.current && !props.forwardedRef.current.contains(event.relatedTarget as Node)) {
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, props.context.server);
                    }
                    focused.current = false;
                }
            }}
            {...usePopupMenu(props)}
        >  
            <Tree
                id={props.name}
                className={concatClassnames("rc-tree", props.styleClassNames)}
                value={nodes}
                selectionMode="single"
                selectionKeys={selectedKey}
                expandedKeys={expandedKeys}
                onToggle={e => setExpandedKeys(e.value)}
                onSelectionChange={handleRowSelection}
            />
        </span>
    )
}
export default UITree