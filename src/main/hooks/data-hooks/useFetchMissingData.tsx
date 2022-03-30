import { useContext, useLayoutEffect } from "react";
import { appContext } from "../../AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";

/**
 * Fetches the missing dataprovider if it isn't in the contentstore
 * @param screenName - the name of the screen
 * @param dataProvider - the dataprovider to fetch
 */
const useFetchMissingData = (screenName:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    useLayoutEffect(() => {
        if (dataProvider && !context.contentStore.getDataBook(screenName, dataProvider)?.data) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            if (!context.contentStore.getDataBook(screenName, dataProvider)?.metaData) {
                fetchReq.includeMetaData = true;
            }

            if (!context.server.missingDataFetches.includes(dataProvider)) {
                context.server.missingDataFetches.push(dataProvider);
                showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH), topbar)
            }
        }
    }, []);
}
export default useFetchMissingData