import {login, userData, applicationMetaData, menu, generic, panel, button, closeScreen, table} from './TowerV2'

export const responseMaper = [{
    name:"applicationMetaData",
    func: applicationMetaData
},
{
    name:"userData",
    func: userData
},
{
    name:"login",
    func: login
},
{
    name:"menu",
    func: menu
},
{
    name:"screen.generic",
    func: generic
},
{
    name:"Panel",
    func: panel
},
{
    name:"Button",
    func: button
},
{
    name:"closeScreen",
    func: closeScreen
},
{
    name:"Table",
    func: table
}]