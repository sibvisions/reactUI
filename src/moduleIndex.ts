/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import '@sibvisions/reactui-designer/main.css'

// Base ReactUI
export { default as ReactUI } from './MiddleMan';

// UI
export { ProfileMenu } from './application-frame/menu/Menu';
export { default as ScreenWrapper } from './main/components/custom-comp/ScreenWrapper';

// Hooks
export { default as useAPI } from './main/hooks/api-hooks/useAPI';
export { default as useGetCustomProperty } from './main/hooks/api-hooks/useGetCustomProperty';

export { default as useMenuItems } from './main/hooks/data-hooks/useMenuItems';
export { default as useDataProviders } from './main/hooks/data-hooks/useDataProviders';
export { default as useDataProviderData } from './main/hooks/data-hooks/useDataProviderData';
export { default as useAllDataProviderData } from './main/hooks/data-hooks/useAllDataProviderData';
export { default as useRowSelect } from './main/hooks/data-hooks/useRowSelect';
export { default as useAllRowSelect } from './main/hooks/data-hooks/useAllRowSelect';

// Requests
export * from './main/factories/RequestFactory';
export { default as REQUEST_KEYWORDS } from './main/request/REQUEST_KEYWORDS';
export type { ICustomDefaultLogin, ICustomResetLogin, ICustomMFAText, ICustomMFAWait, ICustomMFAUrl } from './application-frame/login/Login';

// Extendable Components
export * from './main/extend-components';

//export { appContext } from './main/contexts/AppProvider';
