import { useEffect, useState, useContext, useCallback } from "react";
import { MenuItem, MenuItemCommandParams } from "primereact/api";
import { appContext } from "../../../main/AppProvider";
import { createLogoutRequest } from "../../../main/factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../main/request";
import { useTranslation } from "../zhooks";
import { TopBarContext } from "../topbar/TopBar";


const useProfileMenuItems = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of translations */
    const translations = useTranslation()
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    
    const [slideOptions, setSlideOptions] = useState<Array<MenuItem>>();

    /** removes authKey from local storage, resets contentstore and sends logoutRequest to server */
    const sendLogout = useCallback(() => {
        const logoutRequest = createLogoutRequest();
        localStorage.removeItem("authKey")
        context.contentStore.reset();
        topbar.show();
        context.server.sendRequest(logoutRequest, REQUEST_ENDPOINTS.LOGOUT).finally(() => {
            topbar.hide();
        });
    }, [context.server, context.contentStore]);
    
    useEffect(() => {
        const currUser = context.contentStore.currentUser;

        setSlideOptions([
            {
                label: currUser.displayName,
                icon: currUser.profileImage ? 'profile-image' : 'profile-image-null fa fa-user',
                items: [
                    // {
                    //     label: "Settings",
                    //     icon: "pi pi-cog",
                    //     command: () => {
                    //         context.server.routingDecider([{ name: "settings" }])
                    //     }
                    // },
                    {
                        label: translations.get("Logout"),
                        icon: "pi pi-power-off",
                        command(e:MenuItemCommandParams) {
                            sendLogout()
                        }
                    }
                ]
            }
        ])
    }, [context.contentStore.currentUser, translations])

    return slideOptions;
}

export default useProfileMenuItems;