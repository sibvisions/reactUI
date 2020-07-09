import React from "react";

const contextValues = {
    menuTop: true,
    theme: 'dark',
    loggedIn: false,
    settingsActive: false,
    username: ''
  }

const AppContext = React.createContext(contextValues)

export const AppProvider = AppContext.Provider
export const AppConsumer = AppContext.Consumer

export default AppContext