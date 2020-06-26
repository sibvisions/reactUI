import React from 'react';

import { responseMaper } from "./responeMaper";
import NPanel from '../components/responseObj/NPanel';
import NTable from '../components/responseObj/NTable';

import {Button} from 'primereact/button'

const BaseUrl= "http://localhost:8080/JVx.mobile/services/mobile"
let superParent;
let superContent = [];
/**
 * Mounted Parent Components
 */
let MPC = []
/**
 * Registerd Menu change Functions
 */
let RMF = []
/**
 * Registerd Content Functions
 */
let RCF = []

export function sender(endpoint, body){
    let reqOpt = {
        method: 'POST',
        body: JSON.stringify(body),
        credentials:"include"
    };
    console.log("send")
    fetch(BaseUrl+endpoint,reqOpt)
        .then(res => res.json())
        .then(jRes => {console.log(jRes); jRes.forEach(e => handler(e))})
}

export function handler(request){
      responseMaper.forEach(e => {
        if(e.name === request.name) e.func(request)
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
  sender("/api/login",info)
}

/**
 * calls "/api/logout" with clientId stored in localStorage
 * also deletes all content stored
 */
export function logOut(){
  console.log("logged out")
  cleanSlate();
  sender("/api/logout", {clientId: localStorage.getItem("clientId")});
}

/**
 * Adds clas reference to MPC
 * @param {any} it class reference
 */
export function register(it){
    MPC.push(it)
}

export function setSuperParent(context){
    superParent = context
}


function addSuperParentContent(newContent){
    sendContent(newContent)
}

function addToParentContent(toAdd){
    if(toAdd.props.pid === undefined) addSuperParentContent(toAdd)
    else {
      let parent = MPC.find((e) => e.props.id === toAdd.props.pid);
      parent.addElement(toAdd);
    }
}

/**
 * Takes ComponentId of Button and
 * calls "/api/v2/pressButton"
 */
function buttonClicked(e){
    let body = {
        clientId: localStorage.getItem("clientId"),
        componentId: e
    }
    sender("/api/v2/pressButton", body);
}




//  Helpers  ---------- 

export function lazyLogin(){
    logIn("features", "features")
}

export function startUp(){
    let content = JSON.parse(localStorage.getItem("content"));
    content.forEach(e => {
        handler(e)
    });
}

/**
 * Deletes all content
 */
function cleanSlate(){
    sendMenuChanges([])
    sendContent([])

    localStorage.removeItem("clientId")
    localStorage.removeItem("content")
}

function saveContentToStorage(){
    localStorage.setItem("content", JSON.stringify(superContent))
}

// Events   ------------

    //Menu Evnet
export function registerToMenuChanges(toBeCalled){
    RMF.push(toBeCalled);
}
  
export function unregisterFromMenuChanges(ToBeCalled){
    RMF.splice(RMF.indexOf(ToBeCalled), 1)
}

function sendMenuChanges(changes){
    RMF.forEach(e => {
        e(changes);
    });
}

    // Content Event
export function registerToContentChange(toBeCalled){
    RCF.push(toBeCalled);
}

export function unRegisterFromContentChange(toBeCalled){
    RCF.splice(RCF.indexOf(toBeCalled),1);
}

function sendContent(newContent){
    RCF.forEach(e => {
        e(newContent)
    });
}

    // Misc
/**
 * Returns content from localStorage
 */
export function getAllSavedContent(){
    return localStorage.getItem("content");
}

// response types ---------

//respone type handlers
export function login(){

}

export function userData(input){

}

export function applicationMetaData(metaData){
    localStorage.setItem("clientId", metaData.clientId);
}

export function menu(props){ 
let groupsString= [];
let groups = [];

//Make out distinct groups
props.items.forEach(parent => {
    if(groupsString.indexOf(parent.group) === -1) {
        groupsString.push(parent.group)
        groups.push({label: parent.group, items: [], key: parent.group})
    }
});

//Add SubMenus to parents
groups.forEach(e => {
    props.items.forEach(subMenu => {
        if(e.label===subMenu.group) {
            e.items.push({
                label: subMenu.action.label,
                componentId:subMenu.action.componentId,
                command: () => buttonClicked(subMenu.action.componentId),
                key:subMenu.action.label})
        }
    }); 
});
    sendMenuChanges(groups);
}

export function generic(props){
    let standard = []

// if they are any changed components, change format to standard
// and call setRelationship to build hierachy
    if(props.changedComponents !== undefined && props.changedComponents.length > 1){
        props.changedComponents.forEach(e => {
            standard.push({id: e.id, pid: e.parent, name: e.className, elem: e, children: []})
        });
            buildHierachy(standard);
        }
        function buildHierachy(changedArray){
            let step = []
            changedArray.forEach(parent => {
                //foreach element look through each entry 
                //to see if they are their child
                changedArray.forEach(child => {
                    if(parent.id === child.pid){
                        //Check if it is already pushed
                        if(parent.children.indexOf(child) === -1) parent.children.push(child) 
                        if(step.indexOf(parent) === -1) step.push(parent) 
                    }
                });
            });
            let again = false
            //check each object if they still have pid set, 
            //if yes call method again with newly build array
            step.forEach(parent => {
                if(parent.pid !== undefined) again = true 
            });
            //if hierachy has finished building set build hierachy
            if(again){ buildHierachy(step) } else { superContent.push(step[0]); saveContentToStorage(); step.forEach(e => handler(e))}
        }
}

export function panel(input){
    addToParentContent(<NPanel 
        id={input.id} 
        pid={input.pid} 
        key={input.id}
        componentid={input.elem.name} 
        content={input.children}/>)
}

export function button(input){
    addToParentContent(<Button 
        key={input.id} 
        id={input.id} 
        pid={input.pid} 
        label={input.elem.text} 
        componentid={input.name} 
        onClick={() => buttonClicked(input.elem.name)}/>);
}

export function closeScreen(toClose){
//check if top level element, if yes delete it and calls SendContent()
    let toDelete = superParent.state.content.find((a) => a.props.componentid === toClose.componentId);
    if(toDelete !== undefined){
        let content = [...superParent.state.content];
        content.splice(content.indexOf(toDelete),1);
        sendContent(content);
    }

    superContent.splice(superContent.findIndex(a => a.elem.name === toClose.componentId),1);
    saveContentToStorage();
}

export function table(table){
    addToParentContent(<NTable 
    key={table.id} 
    id={table.id} 
    pid={table.pid}
    columnLabels={table.elem.columnLabels}
    columnNames={table.elem.columnNames}
    dataBook={table.elem.dataBook}
    dataProvider={table.elem.dataProvider}
    componentid={table.name} 
    />)
}





