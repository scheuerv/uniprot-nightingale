import ProtvistaTooltip from "protvista-tooltip";
import { html } from "lit-element";
import $ from "jquery";

export default class CloseableTooltip extends ProtvistaTooltip {
    public render() {
        let visible = this.title && this.visible ? true : false;
        // only compute that if tooltip is visible
        const position = visible ? this._getPosition() : {};
        // if no position calculated, shouldn't be visible yet
        visible = position.x && visible ? true : false;
        // position on screen with css translate
        const style = visible && `transform: translate(${position.x}px, ${position.y}px);`;

        return html`
        <section
          class="tooltip arrow-${position.horizontal || "left"} arrow-${
            position.vertical || "up"
        } ${visible ? "visible" : ""}"
          style="${style}"
        >
        <div style="background-color:black">
          <h1 style="display:inline-block;float:left;width:calc(100% - 68px)">${this.title}</h1>
          <h1 @click="${
              this.handleClose
          }" class="close" style="display:inline-block;float:right;cursor:pointer">X</h1>
          <div style="clear:both"/>
          </div>
          <div class="tooltip-body"><slot></slot></div>
        </sectionclass="tooltip>
      `;
    }
    private handleClose(): void {
        $(this).remove();
    }
}
