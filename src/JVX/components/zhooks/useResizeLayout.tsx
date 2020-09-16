import {useContext, useLayoutEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useResizeLayout = (id: string) => {

    const [newSize, setNewSize] = useState<{width: number, height: number}>();
    const context = useContext(jvxContext)

    useLayoutEffect(() => {
       const resizeSub = context.eventStream.resizeEvent.subscribe(value => {
           if(value.get(id)){
               setNewSize(value.get(id))
           }
       })
       return () => {
           resizeSub.unsubscribe();
       };
    });

    return [newSize];
}

export default useResizeLayout