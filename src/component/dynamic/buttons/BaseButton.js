import Base from '../Base';
import { Size } from '../../helper/Size';
import { toPx } from '../../helper/ToPx';
import { RefContext } from '../../helper/Context';
import tinycolor from 'tinycolor2';
import { getMargins, getAlignments, getFont, getImageTextGap, parseIconData } from '../ComponentProperties';

class BaseButton extends Base {

    btnMargins;
    btnAlignments;
    btnDirection;
    btnFont;
    iconProps;
    btnIconPos;
    btnImgTextGap;
    btnBgd;
    btnFgd;
    borderPainted = false;
    focusable = false;
    btnProps;

    constructor(props) {
        super(props);
        this.btnMargins = getMargins(props);
        this.btnAlignments = getAlignments(props);
        this.setBtnDirection(props.horizontalTextPosition);
        this.btnFont = getFont(props);
        this.iconProps = parseIconData(props, props.image);
        this.setIconPos(props.horizontalTextPosition, props.verticalTextPosition);
        this.btnImgTextGap = getImageTextGap(props);
        this.btnBgd = this.getBgdColor();
        this.btnFgd = this.getFgdColor();
        this.setBorderPainted(props.borderPainted);
        this.setBtnFocusable(props.focusable);
        this.btnProps = {
            id: this.props.id,
            onClick: () => this.context.serverComm.pressButton(this.props.name),
            style:{
                display: 'flex',
                flexDirection: this.btnDirection,
                justifyContent: this.btnDirection === 'row' ? this.btnAlignments.ha : this.btnAlignments.va,
                alignItems: this.btnDirection === 'row' ? this.btnAlignments.va : this.btnAlignments.ha,
                background: this.btnBgd,
                color: this.btnFgd,
                borderColor: this.btnBgd,
                paddingTop: this.btnMargins.marginTop,
                paddingLeft: this.btnMargins.marginLeft,
                paddingBottom: this.btnMargins.marginBottom,
                paddingRight: this.btnMargins.marginRight,
                fontFamily: this.btnFont.fontFamily,
                fontWeight: this.btnFont.fontWeight,
                fontStyle: this.btnFont.fontStyle,
                fontSize: this.btnFont.fontSize,
            },
            tabIndex:this.focusable ? (this.props.tabIndex ? this.props.tabIndex : '0') : '-1',
            iconPos: this.btnIconPos
        }
    }

    addHoverEffect(obj, color, dark) {
        if ((this.props.borderOnMouseEntered && this.borderPainted) || (!this.props.borderOnMouseEntered && this.borderPainted)) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', tinycolor(color.getOriginalInput()).darken(dark))
                obj.style.setProperty('border-color', tinycolor(color.getOriginalInput()).darken(dark))
            }
            obj.onmouseout = () => {
                obj.style.setProperty('background', color.getOriginalInput())
                obj.style.setProperty('border-color', color.getOriginalInput())  
            }
        }
        else if (this.props.borderOnMouseEntered && !this.borderPainted) {
            obj.onmouseover = () => {
                obj.style.setProperty('background', this.props.background !== undefined ? this.props.background : "#007ad9")
                obj.style.setProperty('border-color', this.props.background !== undefined ? this.props.background : "#007ad9")
            }
            obj.onmouseout = () => {
                obj.style.setProperty('background', this.btnBgd)
                obj.style.setProperty('border-color', this.btnBgd)
            }
        }
    }

    getBgdColor() {
        if (this.props.borderPainted === undefined || this.props.borderPainted === true) {
            if (this.props.background) {
                return tinycolor(this.props.background);
            }
            else {
                let bgd = this.props.className === 'RadioButton' ? tinycolor(document.getElementById(this.props.parent).style.background) : tinycolor("#007ad9");
                return bgd;
            }
        }
        else {
            return tinycolor(document.getElementById(this.props.parent).style.background);
        }
    }

    getFgdColor() {
        if (this.props.foreground) {
            return tinycolor(this.props.foreground);
        }
        else {
            let fgd = this.props.className === 'RadioButton' ? tinycolor('black') : tinycolor('white')
            return fgd;
        }
    }

    styleButton(btn) {
        if (btn.classList.contains("p-button-icon-only")) {
            for (let child of btn.children) {
                if (child.classList.contains("p-button-text")) {
                    child.remove()
                }
            }
        }
        let size = new Size(parseInt(this.button.style.width), parseInt(this.button.style.height), undefined);
        btn.style.setProperty('height', this.props.constraints === 'Center' ? '100%' : toPx(size.height));
        btn.style.setProperty('width', this.props.constraints === 'Center' ? '100%' : toPx(size.width));
    }

    styleChildren(btnChildren, btnType) {
        for (let child of btnChildren) {
            if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
                let gapPos = this.getGapPos(this.props.horizontalTextPosition, this.props.verticalTextPosition);
                child.style.setProperty('margin-' + gapPos, toPx(this.btnImgTextGap));
            }
            if (this.iconProps) {
                if (child.classList.value.includes(this.iconProps.icon)) {
                    child.style.setProperty('width', toPx(this.iconProps.size.width));
                    child.style.setProperty('height', toPx(this.iconProps.size.height));
                    child.style.setProperty('color', this.iconProps.color);
                    if (!child.classList.value.includes('fas')) {
                        child.style.setProperty('background-image', 'url(http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + this.iconProps.icon + ')');
                    }
                }
            }
            child.style.setProperty('padding', 0);
            if (btnType === "PopupMenuButton") {
                this.menuButtonAlignments(child)
            }
        }
    }

    getGapPos(hTextPos, vTextPos) {
        if (hTextPos === 0) {
            return 'left'
        }
        else if (hTextPos === undefined) {
            return 'right'
        }
        else if (hTextPos === 1 && vTextPos === 2) {
            return 'bottom'
        }
        else if (hTextPos === 1 && vTextPos === 0) {
            return 'top'
        }
    }

    setBtnDirection(hTextPos) {
        if (hTextPos === 1) {
            this.btnDirection = 'column'
        }
        else {
            this.btnDirection = 'row'
        }
    }

    setIconPos(hTextPos, vTextPos) {
        if (hTextPos === 0 || (hTextPos === 1 && vTextPos === 0)) {
            this.btnIconPos = "right";
        }
        else {
            this.btnIconPos = "left";
        }
    }

    setBorderPainted(borderPainted) {
        if (borderPainted === undefined || borderPainted === true) {
            this.borderPainted = true;
        }
    }

    setBtnFocusable(focusable) {
        if (focusable === undefined || focusable === true) {
            this.focusable = true;
        }
    }
}
BaseButton.contextType = RefContext
export default BaseButton