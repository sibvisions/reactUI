import React, {Component} from 'react';
import "./Menu.css"
import {SlideMenu} from 'primereact/slidemenu';
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
                label: "Home",
                icon: "pi pi-home"
            },
            {
                label: "Elemen",
                icon: "pi pi-list",
                items: [ 
                    {
                        label: 'Features',
                        command: () => {
                            ShowDialog('feature', this);
                        }
                    },
                    {
                        label: 'Customscreens',
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
                    TEST
                </div>
                <div className="slidemenu-container">
                    <SlideMenu model={this.items}>
                    </SlideMenu>
                </div>
            </div> 
        )
    }
}
export default MenuComponent;