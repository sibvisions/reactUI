import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useHistory } from "react-router";

export function useVisibleWithHistoryBlock(
    initial: boolean,
    onHideCallback?: () => void,
    disabled: boolean = false,
): [ boolean, Dispatch<SetStateAction<boolean>> ] {
    const [visible, setVisible] = useState<boolean>(initial);
    const history = useHistory();

    // Old code causes Warning: A history supports only one prompt at a time Error Component Stack
/*    useEffect(() => {
        return history.block(() => {
            if(visible && !disabled) {
                setVisible(false);
                onHideCallback?.();
            }
            return !visible;
        })
*/

    useEffect(() => {
        let unblock: () => void;
        if (visible)
        {
            unblock = history.block(() => {
                if(visible && !disabled) {
                    setVisible(false);
                    onHideCallback?.();
                }
                return !visible;
            })
        }

        return () => {
            // This cleanup function runs when 'visible' changes or component unmounts
            if (unblock) {
                unblock();
            }
        }
    }, [history, visible, setVisible, onHideCallback, disabled])

    return [visible, setVisible]
}