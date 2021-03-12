/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";


/** 3rd Party imports */

/** Hook imports */
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { jvxContext } from "../../jvxProvider";
import { LayoutContext } from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";
import { createSelectRowRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import useAllDataProviderData from "../zhooks/useAllDataProviderData";
import { getMetaData } from "../util/GetMetaData";

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

    const testData = useMemo(() => {
        let dataProviderEntries = providedData.entries();
        let entry = dataProviderEntries.next()
        while (!entry.done) {
            const metaData = getMetaData(compId, entry.value[0], context.contentStore);
            entry.value[1].forEach(data => {
                if (metaData?.detailReferences) {
                    const selectReq = createSelectRowRequest();
                    selectReq.filter = {
                        columnNames: metaData.detailReferences[0].columnNames,
                        values: [data[metaData.detailReferences[0].columnNames[0]]]
                    }
                    selectReq.dataProvider = entry.value[0]
                    selectReq.componentId = props.name;
                    context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_ROW)
                }
            })
            
            console.log(metaData)
            entry = dataProviderEntries?.next()
        }
        // const tempMap = new Map<string, any[]>();
        // const metaData = context.contentStore.dataProviderMetaData.get(compId)?.get(props.dataBooks[1]);
        // const selectReq = createSelectRowRequest();
        // selectReq.filter = {
        //     columnNames: metaData?.masterReference?.referencedColumnNames || ["ID"],
        //     values: [1]
        // }
        // selectReq.dataProvider = props.dataBooks[0];
        // selectReq.componentId = props.name;
        //context.server.sendRequest(selectReq, REQUEST_ENDPOINTS.SELECT_ROW)
    },[context.server, props.dataBooks])

    const indexRef = useRef<number>(0)

    const buildTreeItems = (data:any[], dataBook:string) => {
        const metaData = context.contentStore.dataProviderMetaData.get(compId)?.get(dataBook)
        const builtTreeItems:Array<any> = new Array<any>();
        if (metaData) {
            data.forEach(dataRow => {
                let treeItem:any = {
                    "key": indexRef.current,
                    "label": dataRow[metaData.columnView_table[0]],
                    "children": () => {
                        if (context.contentStore.dataProviderMetaData.get(compId) && metaData.detailReferences)
                            return buildTreeItems(context.contentStore.dataProviderData.get(compId)?.get(metaData.detailReferences[0].referencedDataBook) as any[], metaData.detailReferences[0].referencedDataBook)
                        else
                            return null
                    } 
                }
                builtTreeItems.push(treeItem)
                indexRef.current++;
            });
        }
        return builtTreeItems
    }

    /** The state of the tree-items */
    const [treeItems, setTreeItems] = useState<any>()
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

        </span>
    )
}
export default UITree