import React, { forwardRef } from 'react';
import NPanel from "../components/responseObj/NPanelV2";
import { Button } from 'primereact/button';
import { Redirect } from 'react-router-dom';

const BaseUrl= "http://localhost:8080/JVx.mobile/services/mobile"
const functionMapper = [{
    name: "applicationMetaData",
    func: applicationMetaData
},
{
    name: "menu",
    func: menuBuilder
},
{
    name: "screen.generic",
    func: generic
},
{
    name:"userData",
    func: userData
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
    func: closeWindow
}]

let user = {};

let Screen;
let Containers = [];
let RegMenuFunc = [];

/**
 * Sends the request to the endpoint and calls handler with response
 * @param {string} endpoint endpoint to send the reqeust to
 * @param {Object} body ReqeustBody will be converted to JSON
 */
export function sendRequest(endpoint, body){
    let reqOpt = {
        method: 'POST',
        body: JSON.stringify(body),
        credentials:"include"
    };
    fetch(BaseUrl+endpoint, reqOpt)
        .then(res => res.json())
        .then(jRes =>  {console.log(jRes); handler(jRes);});
}

/**
 * Iterares through the answerArray and calls the mapped function mapped
 * by the functionMapper
 * @param {Array} answerArray an Array of ResponseObjects
 */
export function handler(answerArray){
    answerArray.forEach(answer => {
        let temp = functionMapper.find(func => func.name === answer.name);
        if(temp !== undefined) temp.func(answer);
        
    });
}

/**
 * calls sender("/api/login") with login info as object
 * @param {string} username 
 * @param {string} password 
 */
export function logIn(username,password){
    let info = {
        clientId: localStorage.getItem("clientId"),
        loginData: {
          userName: {
            componentId: "UserName",
            text: username
          },
          password: {
            componentId: "Password",
            text: password
          },
          action : {
            componentId: "OK",
            label: "Anmelden"
          }
        }
      }
    console.log("logging in")
    sendRequest("/api/login",info)
}

export function lazyLogin(){
    logIn("features", "features")
}

// Registration

export function registerContainer(classReference){
    Containers.push(classReference)
}

export function registerMenuChange(toDo){
    RegMenuFunc.push(toDo);
}

/**
 * Register Reference to Main Content Screen
 * sets Screen
 */ 
export function registerScreen(classReference){
    Screen = classReference
}

export function unRegisterContainer(classRefernece) {
    Containers.splice(Containers.indexOf(classRefernece),1);
}

// Export Helper

/**
 * Returns currently logged in User
 */
export function getCurrentUser() {
    return user
}

export function logOut(){
    if(Screen !== undefined){
        Screen.removeAll();
    }
    pushMenuUpdate([])
    startUp();
}

// Helper

/**
 * Takes ComponentId of Button and
 * calls "/api/v2/pressButton"
 */
function buttonClicked(e){
    let body = {
        clientId: localStorage.getItem("clientId"),
        componentId: e
    }
  
    sendRequest("/api/v2/pressButton", body);
}

function startUp(){
    let info = {
        "layoutMode" : "generic",
        "appMode" : "full",
        "applicationName" : "demo"
      }; sendRequest("/api/startup", info, this);
}

// "Event" pusher

function pushMenuUpdate(rawMenu){
    RegMenuFunc.forEach(e => {
        e(rawMenu);
    });
}

function openNewWindow(newWindow){
    Screen.addWindow(newWindow)
}

function addToParrentContainerById(toAdd){
    Containers.find(a => a.props.id === toAdd.props.pid).addContent(toAdd);
}

// Respone types

function menuBuilder(allMenuItems){
    let groupsString= [];
    let groups = [];
  
    //Make out distinct groups
    allMenuItems.items.forEach(parent => {
        if(groupsString.indexOf(parent.group) === -1) {
            groupsString.push(parent.group)
            groups.push({label: parent.group, items: [], key: parent.group})
        }
    });
  
    //Add SubMenus to parents
    groups.forEach(e => {
        allMenuItems.items.forEach(subMenu => {
            if(e.label===subMenu.group) {
                e.items.push({label: subMenu.action.label,
                    componentId:subMenu.action.componentId,
                    command: () => buttonClicked(subMenu.action.componentId),
                    key:subMenu.action.label})
            }
        });
    });
    pushMenuUpdate(groups);
}

function userData(userInfo){
    user = userInfo
}

function applicationMetaData(metaData){
    localStorage.setItem("clientId", metaData.clientId);
}

function generic(gen){
    let standard = []

    if(gen.changedComponents !== undefined && gen.changedComponents.length > 0){
        gen.changedComponents.forEach(e => {
            standard.push({id: e.id, pid: e.parent, name: e.className, elem: e, children: []})
        });
        containerCreateOrUpdate(gen.name, standard);
    }

    if(!gen.update){
       Screen.routeToScreen(gen.componentId); 
    }



    function containerCreateOrUpdate(windowName, updatedElements) {
        let toUpdate = Containers.find(e => e.props.componentid === windowName)
        if(toUpdate === undefined){
            let newContainer = buildHierachy(updatedElements);
            handler([newContainer]);
            return true;
        } 
        handler(updatedElements)
    
        function buildHierachy(children){
            let uberParent = children.find(a => a.pid === undefined);
            children.forEach(child => {
                if(child.pid === uberParent.id){
                    uberParent.children.push(child);
                }
                children.forEach(GC => {
                    if(GC.pid !== undefined && GC.id === child.pid){
                        GC.children.push(child);
                    }
                })
            })
            return uberParent;
        }
    }
}

function panel(panelData){

    let toAdd = <NPanel 
        id={panelData.id} 
        pid={panelData.pid} 
        children={panelData.children} 
        key={panelData.id}
        componentid={panelData.elem.name} />

    if(panelData.pid === undefined){
        openNewWindow(toAdd);
    }else{
        addToParrentContainerById(toAdd);
    }
}

function button(buttonData){
    let toAdd = <Button 
        key={buttonData.id}
        id={buttonData.id} 
        pid={buttonData.pid} 
        label={buttonData.elem.text}
        onClick={() => buttonClicked(buttonData.elem.name)}
        componentid={buttonData.name} />

    addToParrentContainerById(toAdd);
}

function closeWindow(windowData){
    Screen.removeWindow(windowData.componentId)
}












