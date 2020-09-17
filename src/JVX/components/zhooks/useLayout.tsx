import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {layoutInfo} from "../../EventStream"


const useLayout = (componentId: string) => {
    const [layoutStyle, layoutStyleChange] = useState<layoutInfo>();
    const context = useContext(jvxContext);

    useEffect(() => {
        const sub = context.eventStream.styleEvent.subscribe(style => {
            if(style.id === componentId){
                layoutStyleChange(style);
            }
        });
        return () => {
            sub.unsubscribe();
        }
    }, []);

    return layoutStyle
}
export default useLayout