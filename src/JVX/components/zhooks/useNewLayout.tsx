import {useContext, useEffect } from "react";
import {jvxContext} from "../../jvxProvider";


const useNewLayout = (componentId: string, callback: Function) => {
    const context = useContext(jvxContext);

    useEffect(() => {
        const sub = context.eventStream.styleEvent.subscribe(style => {
            if(style.id === componentId){
                callback(style);
            }
        });
        return () => {
            sub.unsubscribe();
        }
    });
}
export default useNewLayout