import React from 'react';
import { Button } from "primereact/button";
import NPanel from "../responseObj/NPanel";


export function createButton(pid, id, label, componentId, onClick){
    return <Button 
        key={id} 
        id={id} 
        pid={pid} 
        componentid={componentId} 
        label={label} 
        onClick={onClick} />
}

export function createPanel(id, pid, componentId, children){
    return  <NPanel 
        key={id}
        id={id}
        pid={pid}
        componentid={componentId}
        children={children}/>
}