import React, {Children, CSSProperties, FC, ReactNode, useContext, useMemo} from "react";
import {layout} from "./Layout";
import Margins from "./models/Margins";
import {jvxContext} from "../../jvxProvider";

type borderLayoutComponents = {
    north?: ReactNode,
    center?: ReactNode,
    west?: ReactNode,
    east?: ReactNode,
    south?: ReactNode
}

type childWithProps = {
    props:{
        id: string
        constraints: string
    }
}

const BorderLayout: FC<layout> = (props) => {

    const context = useContext(jvxContext);
    const margins = new Margins(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(0, 4))
    //const gaps = new Gaps(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(4, 6))
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
    const setConstraints = (): borderLayoutComponents => {
        const components: borderLayoutComponents = {};
        Children.map(props.children, child => {
            const childProps = (child as childWithProps);
            context.eventStream.styleEvent.next({height: "100%", width: "100%", id:childProps.props.id});
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
        <div className={"p-grid p-nogutter"} style={borderLayoutStyle}>
            <div className={"p-col-12 north"} style={{textAlign:"center", padding: 0}}>
                {positions.north}
            </div>
            <div className={"p-grid p-nogutter p-align-center"} style={{height: "100%"}}>
                <div className={"p-col-fixed west"} style={{textAlign: "center", width:"auto", padding: 0}}>
                    {positions.west}
                </div>
                <div className={"p-col center"} style={{textAlign:"center", height:"100%", width:"100%", padding: 0}}>
                    {positions.center}
                </div>
                <div className={"p-col-fixed east"} style={{textAlign:"center", width:"auto", padding: 0}}>
                    {positions.east}
                </div>
            </div>
            <div className={"p-col-12 south"} style={{textAlign:"center", padding: 0}}>
                {positions.south}
            </div>
        </div>
    )
}
export default BorderLayout