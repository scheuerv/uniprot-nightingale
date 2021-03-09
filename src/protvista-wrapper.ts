
// @ts-ignore
import ProtvistaTrack from "protvista-track";
export class ProtvistaWrapper extends HTMLElement {

    private connectedCallbackFunc: () => void;
    connectedCallback() {
        this.connectedCallbackFunc();
    }

    setCallback(connectedCallbackFunc: () => void) {
        this.connectedCallbackFunc = connectedCallbackFunc;
    }
}

export function addConnectedCallback(el: HTMLElement, connectedCallback: () => void) {
    let protvistaWrapper = document.createElement("protvista-wrapper") as ProtvistaWrapper;
    protvistaWrapper.setCallback(connectedCallback);
    (el as any).appendChild(protvistaWrapper);

}