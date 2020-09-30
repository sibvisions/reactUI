import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import useComponents from "../zhooks/useComponents";
import {LayoutContext} from "../../LayoutContext";
import FlowLayout from "./FlowLayout";
import {Panel} from "../panels/panel/UIPanel";
import useProperties from "../zhooks/useProperties";

// export type layout = {
//     parent: string | undefined
//     id: string
//     layout: string,
//     layoutData: string,
//     orientation: number
//     onFinish: LoadCallBack
//     screenTitle?: string
// }

const Layout: FC<Panel> = (props) => {
    if(props.layout.includes("FormLayout"))
        return <FormLayout {...props}/>
    else if(props.layout.includes("BorderLayout"))
        return <BorderLayout {...props}/>
    else if(props.layout.includes("FlowLayout"))
        return <FlowLayout {...props}/>
    else
        return <DummyLayout {...props}/>
}
export default Layout




const DummyLayout: FC<Panel> = (baseProps) => {

    const layoutSize = useRef<HTMLDivElement>(null);
    const [children] = useComponents(baseProps.id);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<Panel>(baseProps.id, baseProps);

    useLayoutEffect(() => {
        if(layoutSize.current && props.onLoadCallback){
            const size = layoutSize.current.getBoundingClientRect();

            props.onLoadCallback(props.id, size.height, size.width);
        }
    }, [layoutSize, props]);


    return(
        <span id={props.id} ref={layoutSize} style={layoutValue.get(props.id)}>
            {children}
        </span>
    )
}