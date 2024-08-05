import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useHistory } from "react-router";

export function useVisibleWithHistoryBlock(
    initial: boolean,
    onHideCallback?: () => void,
    disabled: boolean = false,
): [ boolean, Dispatch<SetStateAction<boolean>> ] {
    const [visible, setVisible] = useState<boolean>(initial);
    
    const history = useHistory();
    useEffect(() => {
        return history.block(() => {
            if(visible && !disabled) {
                setVisible(false);
                onHideCallback?.();
            }
            return !visible;
        })
    }, [history, visible, setVisible, onHideCallback, disabled])

    return [visible, setVisible]
}