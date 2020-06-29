import { ObjFactory } from "../factories/ObjFactory";
import { buttonClicked } from "../../handling/TowerV2";

export function FButton(input) {
    let buttonProps = {
        key: input.id,
        id: input.id,
        pid: input.pid,
        label: input.elem.text,
        componentid: input.name,
        onClick: () => buttonClicked(input.elem.name),
        style: {
            backgroundColor: 'red'
        }
    };
    let button = new ObjFactory('button', buttonProps)
    return button;
}
