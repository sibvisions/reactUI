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

import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ITree } from "./UITree";
import { IExtendableTree } from "../../extend-components/tree/ExtendTree";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import { getMetaData, getPrimaryKeys } from "../../util/data-util/GetMetaData";
import { REQUEST_KEYWORDS, createFetchRequest, createSelectTreeRequest, useAllDataProviderData, useAllRowSelect } from "../../../moduleIndex";
import TreeNode from "primereact/treenode";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import useAddLayoutStyle from "../../hooks/style-hooks/useAddLayoutStyle";
import { showTopBar } from "../topbar/TopBar";
import TreePath from "../../model/TreePath";
import MetaDataResponse, { ColumnDescription } from "../../response/data/MetaDataResponse";
import { SelectFilter } from "../../request/data/SelectRowRequest";
import { handleFocusGained, onFocusLost } from "../../util/server-util/FocusUtil";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { Tree, TreeExpandedKeysType, TreeSelectionParams } from "primereact/tree";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { ISelectedRow } from "../../contentstore/BaseContentStore";

interface CustomTreeNode extends TreeNode {
    pageKey: string|null,
    treePath: TreePath,
    rowIndex: number,
    rowFilter: SelectFilter,
    dataProvider: string,
    subPageKey: string|null,
}

function toPageKey(filter: SelectFilter) {
    let pageKeyObj:any = {};
    for (let i = 0; i < filter.columnNames.length; i++) {
        pageKeyObj[filter.columnNames[i]] = filter.values[i] !== null ? filter.values[i].toString() : 'null';
    }
    return JSON.stringify(pageKeyObj);
}

/**
 * Returns the referenced node based on the given pathdFilter
 * @param path - the path
 * @returns the referenced node based on the given path
 */
function getNode(nodes: CustomTreeNode[], nodeKey: string) {
    const treePath = new TreePath(JSON.parse(nodeKey));
    let tempNode = nodes[treePath.get(0)];
    for (let i = 1; i < treePath.length(); i++) {
        tempNode = (tempNode?.children ?? [])[treePath.get(i)] as CustomTreeNode;
    }
    return tempNode
};

const UITreeNew: FC<ITree & IExtendableTree> = (baseProps) => {
    /** Reference for the span that is wrapping the tree containing layout information */
    const treeWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [context, [props], layoutStyle, , styleClassNames] = useComponentConstants<ITree & IExtendableTree>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Name of the screen */
    const screenName = useMemo(() => context.contentStore.getScreenName(props.id, props.dataBooks && props.dataBooks.length ? props.dataBooks[0] : undefined) as string, [props.dataBooks]);

    /** The data pages of the databooks. First key is the dataprovider, second key is the page. */ 
    const data = useRef<Map<string, Map<string|null, any>>>(new Map<string, Map<string|null, any>>());

    /** The selected rows of each databook */
    //const selectedRows = useAllRowSelect(screenName, props.dataBooks);

    const selectedRowsRef = useRef<Map<string, ISelectedRow>>(new Map<string, ISelectedRow>());

    /** First key is the dataprovider, second key is the page. The value is a list of nodes which are receiving the page. */ 
    const nodesReceivingPage = useRef<Map<string, Map<string, string[]>>>(new Map<string, Map<string, string[]>>());

    /** Current state of the node objects which are handled by PrimeReact to display in the Tree */
    const [nodes, setNodes] = useState<CustomTreeNode[]>([]);

    const nodesRef = useRef<CustomTreeNode[]>([]);

    /** State of the keys of the nodes which are expanded */
    const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

    /** State of the keys of the nodes which are expanded */
    const expandedKeysRef = useRef<TreeExpandedKeysType>({});

    const lastExpandedLength = useRef<number>(0);

    /** State of the key of a single node that is selected */
    const [selectedKey, setSelectedKey] = useState<any>();

    const initialized = useRef<boolean>(false);

    const focused = useRef<boolean>(false);

    const firstSelected = useRef<boolean>(false);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (treeWrapperRef.current) {
            sendOnLoadCallback(
                id, 
                props.className, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                treeWrapperRef.current, 
                onLoadCallback
            )
        }
    }, [
        onLoadCallback, 
        id, 
        props.preferredSize, 
        props.maximumSize, 
        props.minimumSize,
        props.className,
        nodes
    ]);

    useAddLayoutStyle(treeWrapperRef.current, layoutStyle, onLoadCallback, nodes);

    /**
     * Returns true if the given databook is self-joined (references itself in masterReference) false if it isn't
     * @param dataBook - the databook to check
     * @returns true if the given databook is self-joined false if it isn't
     */
    const isSelfJoined = useCallback((dataBook:string) => {
        const metaData = getMetaData(screenName, dataBook, context.contentStore, undefined);
        if (metaData?.masterReference) {
            return metaData.masterReference.referencedDataBook === dataBook;
        } else {
            return false;
        }
    }, [
        context.contentStore, 
        screenName
    ]);

    /**
     * Returns the name of the databook of given level, if the level is too high,
     * an empty string is returned unless the last databook is self-joined,
     * then the self-joined databook is returned.
     * @param level - the level of depth
     * @returns the name of the databook of given level
     */
    const getDataBookByLevel = useCallback((level:number) => {
        if (level < props.dataBooks.length) {
            return props.dataBooks[level]
        } else {
            const dataBook = props.dataBooks[props.dataBooks.length-1];
            return isSelfJoined(dataBook) ? dataBook : null;
        }
    }, [
        isSelfJoined, 
        props.dataBooks
    ]);

    /**
     * Subscribes to TreeChange, when triggered, states are reset so the Tree can rebuild itself
     * as it is initializing.
     * @returns unsubscribing from TreeChange
     */
    useEffect(() => {
        context.subscriptions.subscribeToTreeDataChange([props.name, ...props.dataBooks].join("_"), (dataProvider:string, data: any[], pageKeyHelper:string) => onPage(dataProvider, data, pageKeyHelper));
        context.subscriptions.subscribeToTreeSelectionChange([props.name, ...props.dataBooks].join("_"), (dataProvider: string, selectedRow: ISelectedRow|undefined) => onSelectedRow(dataProvider, selectedRow));
        
        return () => {
            context.subscriptions.unsubscribeFromTreeDataChange([props.name, ...props.dataBooks].join("_"));
            context.subscriptions.unsubscribeFromTreeSelectionChange([props.name, ...props.dataBooks].join("_"));
        }
    }, [
        context.subscriptions, 
        props.dataBooks
    ]);

    // Tree init
    useEffect(() => {
        if (props.dataBooks.length && getDataBookByLevel(0)) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = getDataBookByLevel(0) as string;
            fetchReq.fromRow = 0;
            fetchReq.rowCount = -1;
            fetchReq.filter = { columnNames: [], values: [] };
            fetchReq.rootKey = true;
            showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), context.server.topbar);
            initialized.current = true;
        }
    }, []);

    const onPage = (dataProvider: string, pData: any[], pageKey: string|null) => {
        if (!data.current.has(dataProvider)) {
            data.current.set(dataProvider, new Map<string|null, any>);
        }

        data.current.get(dataProvider)!.set(pageKey, pData);

        if (initialized.current) {
            addPage(dataProvider, pData, pageKey);
        }
    }

    const addPage = (dataProvider: string, pData: any[], pageKey: string|null) => {
        console.log(dataProvider, pData, pageKey)
        if (!pData) {
            return;
        }
        const baseDataProvider = getDataBookByLevel(0);
        const isLevelZeroData = baseDataProvider === dataProvider && context.contentStore.getDataBook(screenName, dataProvider)?.rootKey === pageKey;

        // Get all the nodes that are receiving this page.
        let parentNodes:CustomTreeNode[] = [];
        if (pageKey !== null) {
            parentNodes = nodesReceivingPage.current.get(dataProvider)?.get(pageKey)?.map((nodeKey) => getNode(nodesRef.current, nodeKey)) || [];
        }
        
        if (!isLevelZeroData && !parentNodes.length) {
            // This page is not for us, so we can ignore it.
            return;
        }

        let treeDepth = isLevelZeroData ? 0 : parentNodes[0].treePath.length();
        let childDataBook = getDataBookByLevel(treeDepth + 1);

        if (childDataBook) {
            const childrenToUnsub: CustomTreeNode[] = [];
            if (parentNodes.length) {
                for (const parentNode of parentNodes) {
                    if (parentNode.children?.length) {
                        for (const child of parentNode.children) {
                            childrenToUnsub.push(child as CustomTreeNode);
                        }
                    }
                }
            }
            else {
                for (const firstLevelNode of nodes) {
                    childrenToUnsub.push(firstLevelNode as CustomTreeNode);
                }
            }
            for (const child of childrenToUnsub) {
                const nodesReceivingPageArray = nodesReceivingPage.current.get(childDataBook)?.get(child.subPageKey ?? "");
                if (nodesReceivingPageArray) {
                    nodesReceivingPageArray.splice(nodesReceivingPageArray.indexOf(child.key as string), 1);
                }
            }
        }

        const newNodesPerParent: Map<string, CustomTreeNode[]> = new Map<string, CustomTreeNode[]>();
        const metaData = getMetaData(screenName, dataProvider, context.contentStore, undefined);
        const primaryKeys = getPrimaryKeys(metaData);

        const createLabel = (metaData: MetaDataResponse|undefined, dataRow: any, columnDescriptions: ColumnDescription[]|undefined) => {
            if (metaData) {
                if (metaData.columnView_tree_.length) {
                    let label = "";
                    for (const column of metaData.columnView_tree_) {
                        if (label.length) {
                            label += " ";
                        }
                        const foundColumn = columnDescriptions!.find((colDes) => colDes.name === column)?.name;
                        if (foundColumn !== undefined) {
                            label += dataRow[foundColumn];
                        }
                    }
                    return label;
                }
                else if (metaData.columnView_table_.length) {
                    const foundColumn = columnDescriptions!.find((colDes) => colDes.name === metaData.columnView_table_[0])?.name;
                    if (foundColumn) {
                        return dataRow[foundColumn];
                    }
                    return "";
                }
                else {
                    return "No column view";
                }
            }
        }

        pData.forEach((dataRow, rowIndex) => {
            const rowFilter: SelectFilter = {
                columnNames: primaryKeys,
                values: primaryKeys.map(pk => dataRow[pk])
            };

            const nodeLabel = createLabel(metaData, dataRow, metaData?.columns);

            let parentIndex = 0;

            // Loop through every parent but at least do it once, as we could have no parents and are base nodes.
            do {
                const parentNode = isLevelZeroData ? null : parentNodes[parentIndex];

                // Create the node key.
                const pathArray = parentNode !== null ? [...parentNode!.treePath.array, rowIndex] : [rowIndex]
                const treePath = new TreePath(pathArray);
                const nodeKey = treePath.toString();



                let childFilter;
                if (childDataBook !== null) {
                    const childMetaData = getMetaData(screenName, childDataBook, context.contentStore, undefined);
                    childFilter = createChildFilter(childMetaData!, metaData!, dataRow);
                    const childPageKey = toPageKey(childFilter);
                    // An new row has values with null, so check that we don't accidentally create the same page as our current parent.
                    // Otherwise it is a recursion for self joined.
                    if (parentNode?.subPageKey !== childPageKey) {
                        if (!nodesReceivingPage.current.has(childDataBook)) {
                            const newMap = new Map<string, string[]>().set(childPageKey, [nodeKey]);
                            nodesReceivingPage.current.set(childDataBook, newMap);
                        }
                        else {
                            if (!nodesReceivingPage.current.get(childDataBook)!.has(childPageKey)) {
                                const existingMap = nodesReceivingPage.current.get(childDataBook)!;
                                existingMap.set(childPageKey, [nodeKey]);
                            }
                            else {
                                nodesReceivingPage.current.get(childDataBook)!.get(childPageKey)!.push(nodeKey);
                            }
                        }
                    }
                }

                const isPotentialParent = childDataBook !== null;

                const getOldNodes = ():CustomTreeNode[] => {
                    if (isLevelZeroData) {
                        return nodesRef.current;
                    }
                    else {
                        if (parentNode !== null && parentNode.children?.length) {
                            return parentNode.children as CustomTreeNode[];
                        }
                        return [];
                    }
                }

                const oldNodes = getOldNodes();
                const oldNode = oldNodes.find((node) => toPageKey(node.rowFilter) === toPageKey(rowFilter));

                const newNode: CustomTreeNode = {
                    key: nodeKey,
                    children: oldNode?.children,
                    //expanded: (oldNode?.expanded || false) && (!oldNode.leaf || false),
                    leaf: !isPotentialParent || (oldNode?.leaf || false),
                    label: nodeLabel,
                    dataProvider: dataProvider,
                    pageKey: pageKey,
                    rowFilter: rowFilter,
                    rowIndex: rowIndex,
                    treePath: treePath,
                    subPageKey: childFilter ? toPageKey(childFilter) : null
                };

                console.log('I AM NODE', nodeKey, newNode.subPageKey)

                const parentKey: string = parentNode ? parentNode.key as string : 'null';

                if(!newNodesPerParent.has(parentKey)) {
                    newNodesPerParent.set(parentKey, [newNode]);
                }
                else {
                    newNodesPerParent.get(parentKey)!.push(newNode);
                }

                if (props.detectEndNode !== false && !newNode.children?.length && isPotentialParent && (isLevelZeroData || Object.keys(expandedKeysRef.current).includes(parentKey))) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = childDataBook as string;
                    fetchReq.fromRow = 0;
                    fetchReq.rowCount = -1;
                    fetchReq.filter = childFilter;
                    showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), context.server.topbar);
                }

                parentIndex++;
            }
            while (parentIndex < parentNodes.length);
        });

        console.log(isLevelZeroData)

        if (isLevelZeroData) {
            setNodes(newNodesPerParent.entries().next().value[1]);
            nodesRef.current = newNodesPerParent.entries().next().value[1];
        }
        else {
            for (let parentNode of parentNodes) {
                const children = newNodesPerParent.has(parentNode.key as string) ? newNodesPerParent.get(parentNode.key as string) as CustomTreeNode[] : [];
                parentNode.children = children;
                parentNode.leaf = !children.length;
            }
            setNodes(nodesRef.current.slice());
        }

        updateSelection();
    }

    const createChildFilter = (childMetaData: MetaDataResponse, parentMetaData: MetaDataResponse, parentRow: any): SelectFilter => {
        let reference = childMetaData.masterReference;
        if (isSelfJoined(childMetaData.dataProvider) && parentMetaData.dataProvider !== childMetaData.dataProvider) {
            reference = childMetaData.rootReference || reference;
        }

        return {
            columnNames: childMetaData.masterReference!.columnNames,
            values: childMetaData.masterReference!.columnNames.map((column) => {
                // Is there a reference to the parent table?
                if (!reference!.columnNames.includes(column)) {
                    return null;
                }

                // Get the name of the column in the parent table.
                const parentColumn = reference!.referencedColumnNames[reference!.columnNames.indexOf(column)];

                if (parentRow[parentColumn] !== undefined) {
                    return parentRow[parentColumn]
                }
                else {
                    return null;
                }
            })
        };
    }

    useEffect(() => {
        const key = Object.keys(expandedKeys)[Object.keys(expandedKeys).length - 1];
        if (key) {
            const node = getNode(nodes, key);
            if (node) {
                if (node.children === undefined || !node.children.length) {
                    fetchNodeChildren(node);
                }
                else if (props.detectEndNode !== false) {
                    for (const child of node.children as CustomTreeNode[]) {
                        if ((child.children === undefined || !child.children.length) && !child.leaf) {
                            fetchNodeChildren(child);
                        }
                    }
                }
            }
        }
    }, [expandedKeys]);

    const fetchNodeChildren = (node: CustomTreeNode) => {
        const dataProvider = getDataBookByLevel(node.treePath.length() - 1);
        const childDataProvider = getDataBookByLevel(node.treePath.length());
        if (dataProvider && childDataProvider) {
            const metaData = getMetaData(screenName, dataProvider, context.contentStore, undefined);
            const childMetaData = getMetaData(screenName, childDataProvider, context.contentStore, undefined);
            if (data.current.get(dataProvider)!.get(node.pageKey)) {
                const dataRow = data.current.get(dataProvider)!.get(node.pageKey)[node.rowIndex];
                if (metaData && childMetaData && dataRow) {
                    const childFilter = createChildFilter(childMetaData, metaData, dataRow);
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = childDataProvider;
                    fetchReq.fromRow = 0;
                    fetchReq.rowCount = -1;
                    fetchReq.filter = childFilter;
                    showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), context.server.topbar);
                }
            }
        }
    }

    /**
     * This event is called when a node is selected, it builds the select tree request and sends it to the server
     * If the lib user extends the Tree with onRowSelect, call it when a row is selected.
     * @param event 
     */
    const handleRowSelection = async (event:TreeSelectionParams) => {
        if (event.value && typeof event.value === "string") {
            const selectedFilters:Array<SelectFilter|null> = []
            const selectedDatabooks = [...props.dataBooks];
            let path = new TreePath(JSON.parse(event.value));
            const selectedNode = getNode(nodesRef.current, event.value);

            selectedRowsRef.current.set(selectedNode.dataProvider, { dataRow: selectedNode.data, index: selectedNode.rowIndex, treePath: selectedNode.treePath });
            
            if (props.onRowSelect) {
                if (selectedNode) {
                    props.onRowSelect({ originalEvent: event,  selectedRow: selectedNode.data});
                }
                else {
                    console.error('Selected node not available!');
                }
                
            }

            //filters are build path upwards
            while (path.length()) {
                const node = getNode(nodesRef.current, path.toString());

                selectedRowsRef.current.set(node.dataProvider, { dataRow: node.data, index: node.rowIndex, treePath: node.treePath });
                selectedFilters.push(node.rowFilter);
                path = path.getParentPath();
            }

            //array needs to be reversed so server can process them
            selectedFilters.reverse();

            //for databooks below, which are not selected/deselected add null to the filters
            while (selectedFilters.length < selectedDatabooks.length) {
                selectedFilters.push(null)
            }

            //If the databook is self-joined fill the array with its name
            while ((selectedDatabooks.length < selectedFilters.length) && isSelfJoined(selectedDatabooks.slice(-1).pop() as string)) {
                selectedDatabooks.push(selectedDatabooks.slice(-1).pop() as string)
            }

            props.dataBooks.forEach((databook, index) => {
                if (selectedFilters[index] === null) {
                    selectedRowsRef.current.delete(databook);
                }
            });

            const selectReq = createSelectTreeRequest();
            selectReq.componentId = props.name;
            selectReq.dataProvider = selectedDatabooks;
            selectReq.filter = selectedFilters;
            await showTopBar(context.server.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_TREE), context.server.topbar);
            updateSelection();
        }
    }

    const onSelectedRow = (dataProvider: string, selectedRow: ISelectedRow|undefined) => {
        if (selectedRow) {
            selectedRowsRef.current.set(dataProvider, selectedRow);
        }
        else {
            selectedRowsRef.current.delete(dataProvider);
        }

        if (initialized.current) {
            updateSelection();
        }
    }

    const updateSelection = () => {
        if (props.dataBooks && props.dataBooks.length) {
            const selected = selectedRowsRef.current.get(props.dataBooks[0]);
            if (selected) {
                const treePath: TreePath = getTreePathFromSelectedRows();
                setSelectedKey(treePath.toString());
                expandedKeysRef.current = ({...expandedKeys, ...treePath.toArray().slice(0, -1).reduce((a, n, i, arr) => ({...a, [`[${arr.slice(0, i + 1).join(',')}]`]: true}) , {})});
                setExpandedKeys(prevState => {
                    const newState = ({...prevState, ...treePath.toArray().slice(0, -1).reduce((a, n, i, arr) => ({...a, [`[${arr.slice(0, i + 1).join(',')}]`]: true}) , {})});
                    return JSON.stringify(prevState) === JSON.stringify(newState) ? prevState : newState;
                });
            }
        }
    }

    // useEffect(() => {
    //     if (!firstSelected.current) {
    //         if (props.dataBooks && props.dataBooks.length) {
    //             const selected = selectedRows.get(props.dataBooks[0]);
    //             if (selected) {
    //                 const treePath: TreePath = getTreePathFromSelectedRows();
    //                 setSelectedKey(treePath.toString());
    //                 setExpandedKeys(prevState => {
    //                     const newState = ({...prevState, ...treePath.toArray().slice(0, -1).reduce((a, n, i, arr) => ({...a, [`[${arr.slice(0, i + 1).join(',')}]`]: true}) , {})});
    //                     return newState;
    //                 });
    //                 firstSelected.current = true;
    //             }
    //         }
    //     }
    // }, [selectedRows]);

    const getTreePathFromSelectedRows = () => {
        const treePathArray:number[] = [];
        props.dataBooks.forEach(databook => {
            const selectedRow = selectedRowsRef.current.get(databook);
            if (selectedRow) {
                if (databook === getDataBookByLevel(Number.MAX_SAFE_INTEGER) && isSelfJoined(databook)) {
                    if (selectedRow.treePath) {
                        treePathArray.push(...selectedRow.treePath.toArray());
                    }
                }
                treePathArray.push(selectedRow.index);
            }
        })
        return new TreePath(treePathArray.filter(v => v > -1));
    }

    return (
        <span
            ref={treeWrapperRef}
            style={layoutStyle}
            tabIndex={props.tabIndex ? props.tabIndex : 0}
            onFocus={(event) => {
                if (!focused.current) {
                    handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, context)
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
                className={concatClassnames("rc-tree", styleClassNames)}
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
export default UITreeNew