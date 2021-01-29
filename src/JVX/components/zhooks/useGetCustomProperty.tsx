import { useContext } from "react";
import {jvxContext} from "../../jvxProvider";

const useGetCustomProperty = (key:string) => {
    const context = useContext(jvxContext);

    return context.contentStore.customProperties.get(key);
}
export default useGetCustomProperty