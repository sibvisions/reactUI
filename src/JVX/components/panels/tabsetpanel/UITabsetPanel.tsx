import React, {CSSProperties, FC, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState} from "react"
import './UITabsetPanel.scss'
import {TabView,TabPanel} from 'primereact/tabview';
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {jvxContext} from "../../../jvxProvider";
import useComponents from "../../zhooks/useComponents";
import {parseIconData} from "../../compprops/ComponentProperties";
import {Panel} from "../panel/UIPanel";
import {createTabRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import IconProps from "../../compprops/IconProps";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";

export interface ITabsetPanel extends Panel {
    selectedIndex?: number;
}

const UITabsetPanel: FC<ITabsetPanel> = (baseProps) => {
    const panelRef = useRef(null)
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    const [props] = useProperties<ITabsetPanel>(baseProps.id, baseProps);
    const [components, preferredCompSizes] = useComponents(baseProps.id)
    const {onLoadCallback, id} = baseProps;
    const closing = useRef(false);
    const prefSize = parseJVxSize(props.preferredSize);

    useLayoutEffect(() => {
            const sizeMap = new Map<string, CSSProperties>();
            const external = layoutValue.get(id) || {};
            let width:number|undefined;
            let height:number|undefined;
            if (external.width && external.height) {
                width = external.width as number;
                height = external.height as number - 31;
            }
            components.forEach((component: any) => {
                sizeMap.set(component.props.id, { width, height })
            });
            setComponentSizes(sizeMap);
    }, [components, layoutValue, id]);

    useLayoutEffect(() => {
        if (onLoadCallback && preferredCompSizes && props.selectedIndex !== -1) {
            const selectedPanel = preferredCompSizes.get(components[(props.selectedIndex as number)].props.id);
            if (selectedPanel) {
                const prefSize:Size = {height: selectedPanel.height, width: selectedPanel.width};
                sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback)
            }
                
        }
    }, [id, preferredCompSizes, onLoadCallback, components, props.selectedIndex, props.maximumSize, props.minimumSize])

    const buildTabRequest = useCallback((tabId:number) => {
        const req = createTabRequest();
        req.componentId = props.name;
        req.index = tabId;
        return req
    },[props.name])

    const handleSelect = (tabId:number) => {
        if(!closing.current)
            context.server.sendRequest(buildTabRequest(tabId), REQUEST_ENDPOINTS.SELECT_TAB);
        closing.current = false;
    }

    const buildTabs = useMemo(() => {
        const handleClose = (tabId:number) => {
            context.server.sendRequest(buildTabRequest(components.findIndex(elem => elem.props.id === tabId)), REQUEST_ENDPOINTS.CLOSE_TAB);
            closing.current = true
        }

        let builtTabs:Array<JSX.Element> = [];
        if (components) {
            components.forEach((component:any) => {
                const componentConstraints:string = component.props.constraints;
                let constraints:string[];
                let icon:IconProps;
                if (componentConstraints.includes("FontAwesome")) {
                    let splitConstIcon = componentConstraints.slice(0, componentConstraints.indexOf(";FontAwesome"));
                    constraints = splitConstIcon.split(';');
                    icon = parseIconData(props.foreground, componentConstraints.slice(componentConstraints.indexOf(';FontAwesome')+1));
                }
                else {
                    constraints = componentConstraints.split(';');
                    icon = parseIconData(props.foreground, constraints[3])
                }
                let header = <span className="p-tabview-title">
                    {(!componentConstraints.includes("FontAwesome") && icon.icon) &&
                    <span className="jvxTabset-tabicon" style={{backgroundImage: icon.icon ? "url('" + context.server.RESOURCE_URL + icon.icon + "')": undefined, height: icon.size?.height, width: icon.size?.width}} />}
                    {constraints[2]}
                    {constraints[1] === 'true' &&
                    <button
                        className="tabview-button pi pi-times"
                        onClick={() => handleClose(component.props.id)}/>}
                </span>
                builtTabs.push(<TabPanel key={component.props.id} disabled={constraints[0] === "false"} header={header} leftIcon={icon ? componentConstraints.includes("FontAwesome") ? icon.icon : undefined : undefined}>{component}</TabPanel>)
            });
        }
        return builtTabs;
    }, [components, props.foreground, buildTabRequest, context.server])

    return (
        <LayoutContext.Provider value={componentSizes}>
            <TabView
                ref={panelRef}
                style={props.screen_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : {...layoutValue.get(baseProps.id), backgroundColor: props.background}}
                activeIndex={props.selectedIndex}
                onTabChange={event => {
                    if (event.index !== props.selectedIndex)
                        handleSelect(event.index)
                }}>
                {buildTabs}
            </TabView>
        </LayoutContext.Provider>
    )
}
export default UITabsetPanel