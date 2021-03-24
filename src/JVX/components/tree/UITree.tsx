/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";


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

export interface ITree extends BaseComponent {
    dataBooks: string[]
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

    const getDataBookByIndex = (index:number) => {
        return props.dataBooks[Math.min(props.dataBooks.length-1, index)]
    }

    useEffect(() => {
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const fetchDataPage = getDataBookByIndex(1)
        const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
        let firstLvlData:any[]|undefined;

        if (metaData!.masterReference) {
            firstLvlData = providedData.get(props.dataBooks[0]) as any[];
            if (firstLvlData) {
                firstLvlData.forEach((data, i) => {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData!.masterReference!.columnNames,
                        values: [data[metaData!.masterReference!.referencedColumnNames[0]]]
                    }
                    context.server.timeoutRequest(fetch(context.server.BASE_URL+REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                    .then((response: any) => response.json())
                    .then((fetchData:FetchResponse[]) => {
                        context.server.processFetch(fetchData[0], data[metaData!.masterReference!.referencedColumnNames[0]].toString());
                        tempTreeMap.set(new TreePath(i).toString(), i.toString());
                        if (i === (firstLvlData!.length-1))
                            setTreeData(tempTreeMap);
                    });
                });
            }
        }
    // eslint-disable-next-line
    }, []);

    const getReferencedDataPage = (path:TreePath) => {
        const dataPage = providedData.get(getDataBookByIndex(path.length()-1));
        if (dataPage) {
            if (dataPage instanceof Array)
                return dataPage;
            else {
                return dataPage.get((path.getLastOfParent(path)).toString());
            }
                
        }
    }

    const getNodeChildren = (path:TreePath, value:string): any[] => {
        const dataPage = providedData.get(getDataBookByIndex(path.length()));
        console.log(dataPage, path, value)
        return dataPage instanceof Array ? [] : dataPage?.get(value);
    }

    const addTreeNode = (key:string, value:string, array:any[]) => {
        const path = new TreePath(JSON.parse(key));
        const metaData = getMetaData(compId, getDataBookByIndex(path.length()-1), context.contentStore);
        const nodeDataRow = getReferencedDataPage(path)[path.getLast()];
        const nodeChildren = getNodeChildren(path, value);
        //console.log(key, value, nodeChildren)
        array.push({
            key: key,
            label: nodeDataRow[metaData!.columnView_table_[0]],
            leaf: nodeChildren.length === 0
        });
    }

    const onExpandLoad = (event:any) => {
        if (!event.node.children) {
            let node = {...event.node}
            node.children = [];
            const childNodeArray = getNodeChildren(new TreePath(JSON.parse(event.node.key)), treeData.get(event.node.key))
            childNodeArray.forEach((childNode, i) => {
                const path = new TreePath(JSON.parse(event.node.key)).getChildPath(i);
                const fetchDataPage = getDataBookByIndex(path.length()-1);
                const metaData = getMetaData(compId, fetchDataPage, context.contentStore);
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = fetchDataPage;
                fetchReq.filter = {
                    columnNames: metaData!.masterReference!.columnNames,
                    values: [childNode[metaData!.masterReference!.referencedColumnNames[0]]]
                };
                context.server.timeoutRequest(fetch(context.server.BASE_URL + REQUEST_ENDPOINTS.FETCH, context.server.buildReqOpts(fetchReq)), 2000)
                    .then((response: any) => response.json())
                    .then((fetchData: FetchResponse[]) => context.server.processFetch(fetchData[0], childNode[metaData!.masterReference!.referencedColumnNames[0]].toString()))
                addTreeNode(path.toString(), i.toString(), node.children)
            });
            let value = [...nodes];
            let foundNode = value.findIndex((node) => node.key === event.node.key);
            console.log(foundNode)
            if (foundNode !== undefined) {
                console.log(node)
                value[foundNode] = node;
                setNodes(value);
            }

        }
    }

    useEffect(() => {
        const createTreeNodes = () => {
            const treeArray:any[] = new Array()
            for (let [key, value] of treeData.entries()) {
                addTreeNode(key, value, treeArray)
            }
            return treeArray
        }

        if (treeData.size) {
            setNodes(createTreeNodes());
        }
    },[treeData])

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)

    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={treeWrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <Tree value={nodes} onExpand={onExpandLoad}/>
        </span>
    )
}
export default UITree