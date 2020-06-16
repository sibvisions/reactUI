import React from 'react';
import { Button } from 'primereact/button';

export function ShowDialog(type, context) {
    if(type === 'feature') {
        context.setState({showAddFeature: true})
    }
    else if(type === 'customscreen') {
        context.setState({showAddCustom: true})
    }
}

export function OnHide(context) {
    if(context.state.showAddFeature) {
        context.setState({showAddFeature: false})
    }
    else if(context.state.showAddCustom) {
        context.setState({showAddCustom: false})
    }
}

export function AddNewItem(container, context) {
    let elem = document.getElementById(container);
    let div = document.createElement('div');
    div.setAttribute('class', 'grid-item');
    if(context.state.showAddFeature && context.state.featureName !== '') {
        div.textContent = context.state.featureName;
        elem.append(div)
        context.setState({
            showAddFeature: false,
            featureName: ''});
    }
    else if(context.state.showAddCustom && context.state.customscreenName !== '') {
        div.textContent = context.state.customscreenName;
        elem.append(div)
        context.setState({
            showAddCustom: false,
            customscreenName: ''});
    }
    else {
        alert('Name muss ausgefüllt sein');
    }
}

export function RenderFooter(context) {
    if(context.state.showAddFeature) {
        return (
            <div>
                <Button label="Annehmen" icon="pi pi-check" onClick={() => AddNewItem('featureContainer', context)} />
                <Button label="Abbrechen" icon="pi pi-times" onClick={() => OnHide(context)} className="p-button-secondary"/>
            </div>
        );
    }
    else if(context.state.showAddCustom) {
        return (
            <div>
                <Button label="Annehmen" icon="pi pi-check" onClick={() => AddNewItem('customscreenContainer', context)} />
                <Button label="Abbrechen" icon="pi pi-times" onClick={() => OnHide(context)} className="p-button-secondary"/>
            </div>
        );
    }
}

export function HandleChange(event, context) {
    const target = event.target;
    if(context.state.showAddFeature) {
        context.setState({
            featureName: target.value
        })
    }
    else if(context.state.showAddCustom) {
        console.log("hallo");
        context.setState({
            customscreenName: target.value
        })
    }
}