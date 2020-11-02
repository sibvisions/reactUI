import React, {
    CSSProperties,
    FC,
    ReactElement,
    useContext,
    useLayoutEffect,
    useRef,
    useState
} from "react";
import useComponents from "../zhooks/useComponents";
import ChildWithProps from "../util/ChildWithProps";
import {LayoutContext} from "../../LayoutContext"
import "./BorderLayout.scss"
import {Panel} from "../panels/panel/UIPanel";
import {jvxContext} from "../../jvxProvider";

type borderLayoutComponents = {
    north?: ReactElement,
    center?: ReactElement,
    west?: ReactElement,
    east?: ReactElement,
    south?: ReactElement
}

const BorderLayout: FC<Panel> = (props) => {

    const [components, preferredComponentSizes] = useComponents(props.id);
    const northRef = useRef<HTMLDivElement>(null);
    const westRef = useRef<HTMLDivElement>(null);
    const layoutRef = useRef<HTMLDivElement>(null);
    const eastRef = useRef<HTMLDivElement>(null);
    const southRef = useRef<HTMLDivElement>(null);
    const layoutContextValue = useContext(LayoutContext);
    const context = useContext(jvxContext);

    const [componentSizes, setComponentSizes] = useState(new Map<string, CSSProperties>());
    const [constraintComponents, setConstraintComponents] = useState<borderLayoutComponents>({});

    useLayoutEffect(() => {
        if(layoutRef.current && northRef.current && southRef.current && eastRef.current && westRef.current){
            const sizeMap = new Map<string, {width: number, height: number}>();
            const layoutSize = layoutRef.current.getBoundingClientRect();
            const northSize = northRef.current.getBoundingClientRect();
            const southSize = southRef.current.getBoundingClientRect();
            const eastSize = eastRef.current.getBoundingClientRect();
            const westSize = westRef.current.getBoundingClientRect();

            const centerWithProps = (constraintComponents.center as ChildWithProps);
            const northWithProps = (constraintComponents.north as ChildWithProps);
            const southWithProps = (constraintComponents.south as ChildWithProps);
            const eastWithProps = (constraintComponents.east as ChildWithProps);
            const westWithProps = (constraintComponents.west as ChildWithProps);

            let southHeight = southSize.height;
            let northHeight = northSize.height
            if(preferredComponentSizes){
                const preferredSouth = preferredComponentSizes.get(southWithProps?.props.id);
                if(preferredSouth)
                    southHeight = preferredSouth.height;

                const preferredNorth = preferredComponentSizes.get(northWithProps?.props.id);
                if(preferredNorth)
                    northHeight = preferredNorth.height;
            }
            if(centerWithProps)
                sizeMap.set(centerWithProps.props.id, {
                    height: layoutSize.height - southHeight - northHeight -3,
                    width: layoutSize.width - eastSize.width - westSize.width
                });
            if(northWithProps)
                sizeMap.set(northWithProps.props.id, {height: 0, width: layoutContextValue.get(props.id)?.width as number || 0});
            if(southWithProps)
                sizeMap.set(southWithProps.props.id, {height: 0, width: layoutContextValue.get(props.id)?.width as number || 0});
            if(eastWithProps)
                sizeMap.set(eastWithProps.props.id, {height: layoutSize.height - southHeight - northHeight, width: 0});
            if(westWithProps)
                sizeMap.set(westWithProps.props.id, {height: layoutSize.height - southHeight- northHeight, width: 0});

            setComponentSizes(sizeMap);
        }
    }, [layoutContextValue, layoutRef, northRef, southRef, eastRef, westRef, constraintComponents ,preferredComponentSizes, props.id])



    useLayoutEffect(() => {
        const layout: borderLayoutComponents = {};
        components.forEach(component => {
            const compProps = context.contentStore.flatContent.get(component.props.id);
            if(compProps && compProps.visible !== false)
            switch (compProps.constraints){
                case "North":
                    layout.north = component;
                    break;
                case "Center":
                    layout.center = component;
                    break;
                case "West":
                    layout.west = component;
                    break;
                case "East":
                    layout.east = component;
                    break;
                case "South":
                    layout.south = component;
                    break;
            }
        })
        setConstraintComponents(layout);
    }, [components, context.contentStore]);

    return(
        <LayoutContext.Provider value={componentSizes}>
            <div id={props.id} ref={layoutRef} className={"border-box"} style={{height: layoutContextValue.get(props.id)?.height}}>
                <div ref={northRef} className={"north"}>
                    {constraintComponents.north}
                </div>
                <div className={"center-border-box"}>
                    <div ref={westRef} className={"west"}>
                        {constraintComponents.west}
                    </div>
                    <div className={"center"}>
                        {constraintComponents.center}
                    </div>
                    <div ref={eastRef} className={"east"}>
                        {constraintComponents.east}
                    </div>
                </div>
                <div ref={southRef} className={"south"}>
                    {constraintComponents.south}
                </div>
            </div>
        </LayoutContext.Provider>
    )
}
export default BorderLayout