import React, {FC, useCallback, useLayoutEffect, useRef} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import LoadCallBack from "../util/LoadCallBack";
import useChildren from "../zhooks/useChildren";

export type layout = {
    parent: string | undefined
    id: string
    layout: string,
    layoutData: string,
    onFinish: LoadCallBack
}

const Layout: FC<layout> = (props) => {

    if(props.layout.includes("FormLayout")) {
        return ( <FormLayout {...props} /> );
    }
    else if(props.layout.includes("BorderLayout")) {
        return ( <BorderLayout {...props} /> );
    }
    else {
        return(
            <DummyLayout {...props}/>
        )
    }
}
export default Layout




const DummyLayout: FC<layout> = (props) => {

    const layoutSize = useRef<HTMLDivElement>(null);
    const [children] = useChildren(props.id);

    useLayoutEffect(() => {
        if(layoutSize.current){
            const size = layoutSize.current.getBoundingClientRect();

            props.onFinish(props.id, size.height, size.width);
        }
    });


    return(
        <div ref={layoutSize}>
            {children}
        </div>
    )
}