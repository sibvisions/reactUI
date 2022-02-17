/** React imports */
import React, { CSSProperties, FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"

/** 3rd Party imports */
import { TabView, TabPanel } from 'primereact/tabview';

/** Hook imports */
import { useComponents, useMouseListener, usePopupMenu, useComponentConstants } from "../../zhooks";

/** Other imports */
import { LayoutContext } from "../../../LayoutContext";
import { parseIconData, IconProps } from "../../compprops";
import { IPanel } from "..";
import { createTabRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, concatClassnames } from "../../util";
import { showTopBar } from "../../topbar/TopBar";

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
    const panelRef = useRef<any>();

    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle, compStyleClassNames] = useComponentConstants<ITabsetPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of componentSizes */
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, compSizes] = useComponents(baseProps.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Reference value if there is currently a tab closing action */
    const closing = useRef(false);

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * Builds the sizeMap for the Panels of TabsetPanel, sets their size to the height of the TabsetPanel
     * minus 31 for the TabsetPanel navigationbar
     */
    useLayoutEffect(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
            const sizeMap = new Map<string, CSSProperties>();
            const external = layoutStyle;
            let width:number|undefined;
            let height:number|undefined;
            if (external?.width && external?.height) {
                width = external.width as number;
                height = external.height as number - 48;
            }
            components.forEach((component: any) => {
                sizeMap.set(component.props.id, { width, height })
            });
            setComponentSizes(sizeMap);
    }, [components, layoutStyle?.width, layoutStyle?.height, id]);

    /**
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     */
    useLayoutEffect(() => {
        if (onLoadCallback) {
            if (compSizes && compSizes.size > 0 && props.selectedIndex !== -1) {
                const selectedPanel = compSizes.get(components[(props.selectedIndex as number)].props.id)?.preferredSize;
                if (selectedPanel) {
                    const prefSize:Dimension = {height: selectedPanel.height + 48, width: selectedPanel.width};
                    sendOnLoadCallback(id, props.className, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
                }
            }
            // If there are tabs or no tabs are selected, send a default size
            else {
                sendOnLoadCallback(id, props.className, { height: 0, width: 0 }, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback)
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
            showTopBar(context.server.sendRequest(buildTabRequest(tabId), REQUEST_ENDPOINTS.SELECT_TAB), topbar);
        closing.current = false;
    }

    /** When a tab is closed send a tabCloseRequest to the server */
    const handleClose = (tabId:number) => {
        showTopBar(context.server.sendRequest(buildTabRequest(tabId), REQUEST_ENDPOINTS.CLOSE_TAB), topbar);
        closing.current = true
    }

    /**
     * Returns the built Tab elements for the TabsetPanel
     * @returns the built Tab elements for the TabsetPanel
     */
    const buildTabs = useMemo(() => {
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
                const isDisabled = constraints[0] === "false";
                /** Content/styling of tabs */
                let header = 
                <span>
                    {(!componentConstraints.includes("FontAwesome") && icon.icon) &&
                    <span className="rc-tabset-tabicon" style={{backgroundImage: icon.icon ? "url('" + context.server.RESOURCE_URL + icon.icon + "')": undefined, height: icon.size?.height, width: icon.size?.width}} />}
                    {
                    /** Tab text */
                    constraints[2]
                    }
                </span>
                builtTabs.push(<TabPanel key={component.props.id} disabled={isDisabled} closable={!isDisabled} headerClassName={"black"} header={header} leftIcon={icon ? componentConstraints.includes("FontAwesome") ? icon.icon : undefined : undefined}>{component}</TabPanel>)
            });
        }
        return builtTabs;
    }, [components, props.foreground, buildTabRequest, context.server]);

    return (
        <LayoutContext.Provider value={componentSizes}>
            <div 
                className={concatClassnames("rc-tabset", compStyleClassNames.bgdClassName, compStyleClassNames.fgdClassName)} 
                style={props.screen_modal_ || props.content_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : { ...layoutStyle }}>
                <TabView
                    ref={panelRef}
                    id={props.name}
                    style={{"--nav-background": compStyle.background}}
                    activeIndex={props.selectedIndex}
                    onTabChange={event => {
                        if (event.index !== props.selectedIndex)
                            handleSelect(event.index)
                    }}
                    onTabClose={event => handleClose(event.index)}
                    {...usePopupMenu(props)}>
                    {buildTabs}
                </TabView>
            </div>
        </LayoutContext.Provider>
    )
}
export default UITabsetPanel