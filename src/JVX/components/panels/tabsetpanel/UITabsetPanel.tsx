import React, {CSSProperties, FC, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState} from "react"
import './UITabsetPanel.scss'
import {TabView,TabPanel} from 'primereact/tabview';
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {jvxContext} from "../../../jvxProvider";
import useComponents from "../../zhooks/useComponents";
import {getPanelBgdColor, parseIconData} from "../../compprops/ComponentProperties";
import {Panel} from "../panel/UIPanel";
import {createTabRequest} from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";

export interface ITabsetPanel extends Panel {
    selectedIndex: number;
}

const UITabsetPanel: FC<ITabsetPanel> = (baseProps) => {
    const panelRef = useRef(null)
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    const [props] = useProperties<ITabsetPanel>(baseProps.id, baseProps);
    const [components] = useComponents(baseProps.id)
    const {onLoadCallback, id} = baseProps;
    const closing = useRef(false);

    useLayoutEffect(() => {
        if (onLoadCallback && panelRef.current) {
            //@ts-ignore
            const size:DOMRect = panelRef.current.nav.parentElement.getBoundingClientRect()
            onLoadCallback(id, size.height, size.width);
        }
    },[onLoadCallback, id]);

    useLayoutEffect(() => {
        if (panelRef.current) {
            const sizeMap = new Map<string, CSSProperties>();
            //@ts-ignore
            const width = panelRef.current.nav.nextElementSibling.getBoundingClientRect().width;
            //@ts-ignore
            const height = panelRef.current.nav.nextElementSibling.getBoundingClientRect().height;
            components.forEach((subject:any) => {
                sizeMap.set(subject.props.id, {width, height})
            })
            setComponentSizes(sizeMap)  
        }
    // eslint-disable-next-line
    },[components, panelRef.current]);

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
            components.forEach((subject:any) => {
                const subjectConstraints:string = subject.props.constraints;
                let constraints:string[];
                let icon = null;
                if (subjectConstraints.includes("FontAwesome")) {
                    let splitConstIcon = subjectConstraints.slice(0, subjectConstraints.indexOf(";FontAwesome"));
                    constraints = splitConstIcon.split(';');
                    icon = parseIconData(props.foreground, subjectConstraints.slice(subjectConstraints.indexOf(';FontAwesome')));
                }
                else
                    constraints = subjectConstraints.split(';');
                let header = <span className="p-tabview-title">
                    {constraints[2]} 
                    {constraints[1] === 'true' &&
                        <button 
                            className="tabview-button pi pi-times"
                            onClick={() => handleClose(subject.props.id)}/>}
                </span>
                builtTabs.push(<TabPanel key={subject.props.id} disabled={constraints[0] === "false"} header={header} leftIcon={icon ? icon.icon : undefined}>{subject}</TabPanel>)
            });
        }
        return builtTabs;
    }, [components, props.foreground, buildTabRequest, context.server])

    return (
        <LayoutContext.Provider value={componentSizes}>
            <TabView
                ref={panelRef}
                style={{ ...layoutValue.get(props.id), backgroundColor: getPanelBgdColor(props, context) }}
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