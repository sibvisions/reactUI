import React, {CSSProperties, FC, ReactElement, useContext, useLayoutEffect, useMemo, useRef} from "react";
import {layout} from "./Layout";
import Margins from "./models/Margins";
import {jvxContext} from "../../jvxProvider";
import useChildren from "../zhooks/useChildren";
import ChildWithProps from "../util/ChildWithProps";
import useResizeLayout from "../zhooks/useResizeLayout";

type borderLayoutComponents = {
    north?: ReactElement,
    center?: ReactElement,
    west?: ReactElement,
    east?: ReactElement,
    south?: ReactElement
}

const BorderLayout: FC<layout> = (props) => {

    const [children] = useChildren(props.id);
    const newSize = useResizeLayout(props.id);
    const context = useContext(jvxContext);
    const northRef = useRef<HTMLDivElement>(null);
    const westRef = useRef<HTMLDivElement>(null);
    const centerRef = useRef<HTMLDivElement>(null);
    const eastRef = useRef<HTMLDivElement>(null);
    const southRef = useRef<HTMLDivElement>(null);

    const layoutRef = useRef<HTMLDivElement>(null);


    const margins = new Margins(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(0, 4));
    const borderLayoutStyle: CSSProperties = {
        flexFlow: "column",
        padding: 0,
        marginTop: margins.marginTop,
        marginLeft: margins.marginLeft,
        marginRight: margins.marginRight,
        marginBottom: margins.marginBottom,
        height: "calc(100% - " + margins.marginTop + "px - " + margins.marginBottom + "px)",
        width: "calc(100% - " + margins.marginRight + "px - " + margins.marginLeft + "px)"
    }

    useLayoutEffect(() => {
        if(newSize && centerRef.current && northRef.current && southRef.current && eastRef.current && westRef.current){
            const sizeMap = new Map<string, {width: number, height: number}>();
            const centerSize = centerRef.current.getBoundingClientRect();
            const northSize = northRef.current.getBoundingClientRect();
            const southSize = southRef.current.getBoundingClientRect();
            const eastSize = eastRef.current.getBoundingClientRect();
            const westSize = westRef.current.getBoundingClientRect();

            const centerWithProps = (positions.center as ChildWithProps);
            const northWithProps = (positions.north as ChildWithProps);
            const southWithProps = (positions.south as ChildWithProps);
            const eastWithProps = (positions.east as ChildWithProps);
            const westWithProps = (positions.west as ChildWithProps);

            if(centerWithProps)
            sizeMap.set(centerWithProps.props.id, {height: centerSize.height, width: centerSize.width});
            if(northWithProps)
            sizeMap.set(northWithProps.props.id, {height: northSize.height, width: northSize.width});
            if(southWithProps)
            sizeMap.set(southWithProps.props.id, {height: southSize.height, width: southSize.width});
            if(eastWithProps)
            sizeMap.set(eastWithProps.props.id, {height: eastSize.height, width: eastSize.width});
            if(westWithProps)
            sizeMap.set(westWithProps.props.id, {height: westSize.height, width: westSize.width});

            context.eventStream.resizeEvent.next(sizeMap);
        }

    })

    const setConstraints = (): borderLayoutComponents => {
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
        });
        return components;
    }
    const positions = useMemo(setConstraints, [props.children]);

    return(
        <div  className={"p-grid p-nogutter"} style={borderLayoutStyle}>
            <div ref={northRef} className={"p-col-12 north"} style={{padding: 0}}>
                {positions.north}
            </div>
            <div className={"p-grid p-nogutter p-align-center"} style={{height: "100%"}}>
                <div ref={westRef} className={"p-col-fixed west"} style={{width:"auto", padding: 0}}>
                    {positions.west}
                </div>
                <div ref={centerRef} className={"p-col center"} style={{height:"100%", width:"100%", padding: 0}}>
                    {positions.center}
                </div>
                <div ref={eastRef} className={"p-col-fixed east"} style={{width:"auto", padding: 0}}>
                    {positions.east}
                </div>
            </div>
            <div ref={southRef} className={"p-col-12 south"} style={{padding: 0}}>
                {positions.south}
            </div>
        </div>
    )
}
export default BorderLayout