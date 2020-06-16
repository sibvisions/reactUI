import React, {Component} from 'react';
import "./Menu.css"
import {Menubar} from 'primereact/menubar';
import { Dialog } from 'primereact/dialog';
import {InputText} from 'primereact/inputtext';
import {ShowDialog, OnHide, RenderFooter, HandleChange} from "./AddItems";

class MenuComponent extends Component {

    constructor(props) {
        super(props)
        this.state = {
            showAddFeature: false,
            showAddCustom: false,
            featureName: '',
            customscreenName: ''
        }
        this.items = [
            {
                icon: "pi pi-ellipsis-v",
                pull: "left",
                items: [ 
                    {
                        label: 'Neues Feature',
                        command: () => {
                            ShowDialog('feature', this);
                        }
                    },
                    {
                        label: 'Neuer Customscreen',
                        command: () => {
                            ShowDialog('customscreen', this)
                        }
                    }
                ]
            }
        ]
    }

    render() {
        return (
            <div className="menu">
                <div className="topBar">
                    <Menubar model={this.items}> Menu
                    </Menubar>
                </div>
                <div className="grid-wrapper">
                    Features
                    <div id="featureContainer" className="grid-container">
                        <div className="grid-item">Feature 1</div>
                        <div className="grid-item">Feature 2</div>
                        <div className="grid-item">Feature 3</div>
                        <div className="grid-item">Feature 4</div>
                        <div className="grid-item">Feature 5</div>
                        <div className="grid-item">Feature 6</div>
                    </div>
                </div>
                <div className="grid-wrapper">
                    Customscreens
                    <div id="customscreenContainer" className="grid-container">
                        <div className="grid-item">Customscreen 1</div>
                        <div className="grid-item">Customscreen 2</div>
                        <div className="grid-item">Customscreen 3</div>
                        <div className="grid-item">Customscreen 4</div>
                    </div>
                </div>
                <Dialog header="neues Feature hinzufügen" visible={this.state.showAddFeature} onHide={() => OnHide(this)} footer={RenderFooter(this)}>
                    <InputText placeholder="Name für neues Feature" type="text" value={this.state.featureName} onChange={(e) => HandleChange(e, this)}></InputText>
                </Dialog>
                <Dialog header="neuen Customscreen hinzufügen" visible={this.state.showAddCustom} onHide={() => OnHide(this)} footer={RenderFooter(this)}>
                    <InputText placeholder="Name" type="text" value={this.state.customscreenName} onChange={(e) => HandleChange(e, this)}></InputText>
                </Dialog>
            </div> 
        )
    }
}
export default MenuComponent;