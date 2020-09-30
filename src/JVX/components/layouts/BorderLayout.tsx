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

type borderLayoutComponents = {
    north?: ReactElement,
    center?: ReactElement,
    west?: ReactElement,
    east?: ReactElement,
    south?: ReactElement
}

const BorderLayout: FC<Panel> = (props) => {

    const [children] = useComponents(props.id);
    const northRef = useRef<HTMLDivElement>(null);
    const westRef = useRef<HTMLDivElement>(null);
    const layoutRef = useRef<HTMLDivElement>(null);
    const eastRef = useRef<HTMLDivElement>(null);
    const southRef = useRef<HTMLDivElement>(null);
    const layoutContextValue = useContext(LayoutContext);

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

            if(centerWithProps)
                sizeMap.set(centerWithProps.props.id, {
                    height: layoutSize.height - northSize.height - southSize.height,
                    width: layoutSize.width - eastSize.width - westSize.width
                });
            if(northWithProps)
                sizeMap.set(northWithProps.props.id, {height: northSize.height, width: northSize.width});
            if(southWithProps)
                sizeMap.set(southWithProps.props.id, {height: southSize.height, width: southSize.width});
            if(eastWithProps)
                sizeMap.set(eastWithProps.props.id, {height: eastSize.height, width: eastSize.width});
            if(westWithProps)
                sizeMap.set(westWithProps.props.id, {height: westSize.height, width: westSize.width});

            setComponentSizes(sizeMap);
        }
    }, [layoutContextValue, layoutRef, northRef, southRef, eastRef, westRef, constraintComponents])



    useLayoutEffect(() =>             {
        const components: borderLayoutComponents = {};
        children.forEach(child => {
            const childProps = (child as ChildWithProps);
            switch (childProps.props.constraints){
                case "North":
                    components.north = child;
                    break;
                case "Center":
                    components.center = child;
                    break;
                case "West":
                    components.west = child;
                    break;
                case "East":
                    components.east = child;
                    break;
                case "South":
                    components.south = child;
                    break;
            }
        })
        setConstraintComponents(components);
    }, [children]);

    return(
        <LayoutContext.Provider value={componentSizes}>
            <div ref={layoutRef} className={"border-box"}>
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