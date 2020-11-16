import React, {
    CSSProperties,
    FC,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react"
import './UITabsetPanel.scss'
import {TabView,TabPanel} from 'primereact/tabview';
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {jvxContext} from "../../../jvxProvider";
import useComponents from "../../zhooks/useComponents";
import {parseIconData} from "../../compprops/ComponentProperties";
import {Panel} from "../panel/UIPanel";
import {createTabRequest} from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import IconProps from "../../compprops/IconProps";

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
        const sizeMap = new Map<string, CSSProperties>();
        const external = layoutValue.get(id) || {width: 10, height: 10};
        const width = external.width as number;
        const height = external.height as number - 20;
        components.forEach((subject:any) => {
            sizeMap.set(subject.props.id, {width, height})
        });

        if(onLoadCallback)
            onLoadCallback(id, 0, 0)

        setComponentSizes(sizeMap);

    },[components, layoutValue, id, onLoadCallback]);

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
                let icon:IconProps;
                if (subjectConstraints.includes("FontAwesome")) {
                    let splitConstIcon = subjectConstraints.slice(0, subjectConstraints.indexOf(";FontAwesome"));
                    constraints = splitConstIcon.split(';');
                    icon = parseIconData(props.foreground, subjectConstraints.slice(subjectConstraints.indexOf(';FontAwesome')));
                }
                else
                    constraints = subjectConstraints.split(';');
                    icon = parseIconData(props.foreground, constraints[3])
                let header = <span className="p-tabview-title">
                    {!subjectConstraints.includes("FontAwesome") &&
                    <span className="jvxTabset-tabicon" style={{backgroundImage: "url('" + context.server.RESOURCE_URL + icon.icon + "')", height: icon.size?.height, width: icon.size?.width}} />}
                    {constraints[2]}
                    {constraints[1] === 'true' &&
                    <button
                        className="tabview-button pi pi-times"
                        onClick={() => handleClose(subject.props.id)}/>}
                </span>
                builtTabs.push(<TabPanel key={subject.props.id} disabled={constraints[0] === "false"} header={header} leftIcon={icon ? subjectConstraints.includes("FontAwesome") ? icon.icon : undefined : undefined}>{subject}</TabPanel>)
            });
        }
        return builtTabs;
    }, [components, props.foreground, buildTabRequest, context.server])

    return (
        <LayoutContext.Provider value={componentSizes}>
            <TabView
                ref={panelRef}
                style={{ ...layoutValue.get(props.id) , backgroundColor: props.background }}
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