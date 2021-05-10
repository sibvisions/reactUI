/** React imports */
import React, { CSSProperties, FC, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react"

/** 3rd Party imports */
import { TabView, TabPanel } from 'primereact/tabview';

/** Hook imports */
import { useProperties, useComponents } from "../../zhooks";

/** Other imports */
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { parseIconData, IconProps } from "../../compprops";
import { IPanel } from "..";
import { createTabRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback } from "../../util";

/** Interface for TabsetPanel */
export interface ITabsetPanel extends IPanel {
    selectedIndex?: number;
}

/**
 * This component displays multiple Panels which are navigated by tabs
 * @param baseProps - the properties sent by the Layout component
 */
const UITabsetPanel: FC<ITabsetPanel> = (baseProps) => {
    /** Reference for TabsetPanel element */
    const panelRef = useRef(null)
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of componentSizes */
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<ITabsetPanel>(baseProps.id, baseProps);
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, compSizes] = useComponents(baseProps.id);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Reference value if there is currently a tab closing action */
    const closing = useRef(false);
    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** 
     * Builds the sizeMap for the Panels of TabsetPanel, sets their size to the height of the TabsetPanel
     * minus 31 for the TabsetPanel navigationbar
     */
    useLayoutEffect(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
            const sizeMap = new Map<string, CSSProperties>();
            const external = layoutValue.get(id) || {};
            let width:number|undefined;
            let height:number|undefined;
            if (external.width && external.height) {
                width = external.width as number;
                height = external.height as number - 48;
            }
            components.forEach((component: any) => {
                sizeMap.set(component.props.id, { width, height })
            });
            setComponentSizes(sizeMap);
    }, [components, layoutValue, id]);

    /**
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     */
    useLayoutEffect(() => {
        if (onLoadCallback && compSizes && compSizes.size > 0 && props.selectedIndex !== -1) {
            const selectedPanel = compSizes.get(components[(props.selectedIndex as number)].props.id)?.preferredSize;
            if (selectedPanel) {
                const prefSize:Dimension = {height: selectedPanel.height + 48, width: selectedPanel.width};
                sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
            }
                
        }
    }, [id, compSizes, onLoadCallback, components, props.selectedIndex, props.maximumSize, props.minimumSize])

    /** Sets up a TabsetPanelRequest which will be sent to the server either selectTab or closeTab*/
    const buildTabRequest = useCallback((tabId:number) => {
        const req = createTabRequest();
        req.componentId = props.name;
        req.index = tabId;
        return req
    },[props.name])

    /** When a Tab is not closing and the user clicks on another Tab which is not disabled, send a selectTabRequest to the server */
    const handleSelect = (tabId:number) => {
        if(!closing.current)
            context.server.sendRequest(buildTabRequest(tabId), REQUEST_ENDPOINTS.SELECT_TAB);
        closing.current = false;
    }

    /**
     * Returns the built Tab elements for the TabsetPanel
     * @returns the built Tab elements for the TabsetPanel
     */
    const buildTabs = useMemo(() => {
        /** When a tab is closed send a tabCloseRequest to the server */
        const handleClose = (tabId:number) => {
            context.server.sendRequest(buildTabRequest(components.findIndex(elem => elem.props.id === tabId)), REQUEST_ENDPOINTS.CLOSE_TAB);
            closing.current = true
        }
        /** Array for the built tabs */
        let builtTabs:Array<JSX.Element> = [];
        if (components) {
            components.forEach((component:any) => {
                const componentConstraints:string = component.props.constraints;
                let constraints:string[];
                let icon:IconProps;
                /** Get the iconData for the Tab */
                if (componentConstraints.includes("FontAwesome")) {
                    let splitConstIcon = componentConstraints.slice(0, componentConstraints.indexOf(";FontAwesome"));
                    /** The tab constraints sent by the server split up */
                    constraints = splitConstIcon.split(';');
                    icon = parseIconData(props.foreground, componentConstraints.slice(componentConstraints.indexOf(';FontAwesome')+1));
                }
                else {
                    /** The tab constraints sent by the server split up */
                    constraints = componentConstraints.split(';');
                    icon = parseIconData(props.foreground, constraints[3])
                }
                /** Content/styling of tabs */
                let header = 
                <span>
                    {(!componentConstraints.includes("FontAwesome") && icon.icon) &&
                    <span className="rc-tabset-tabicon" style={{backgroundImage: icon.icon ? "url('" + context.server.RESOURCE_URL + icon.icon + "')": undefined, height: icon.size?.height, width: icon.size?.width}} />}
                    {
                    /** Tab text */
                    constraints[2]
                    }
                    {
                    /** If the Tab is closable, add a close button */
                    constraints[1] === 'true' &&
                    <button
                        className="tabview-button pi pi-times"
                        onClick={() => handleClose(component.props.id)}/>}
                </span>
                builtTabs.push(<TabPanel key={component.props.id} disabled={constraints[0] === "false"} header={header} leftIcon={icon ? componentConstraints.includes("FontAwesome") ? icon.icon : undefined : undefined}>{component}</TabPanel>)
            });
        }
        return builtTabs;
    }, [components, props.foreground, buildTabRequest, context.server]);

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