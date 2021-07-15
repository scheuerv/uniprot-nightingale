import $ from "jquery";
import { Fragment } from "../types/accession";
import { createEmitter } from "ts-typed-events";

export class FragmentWrapper {
    private readonly emitOnClick = createEmitter<boolean>();
    public readonly onClick = this.emitOnClick.event;
    private readonly emitOnMarkedChange = createEmitter<MarkEvent>();
    public readonly onMarkedChange = this.emitOnMarkedChange.event;
    private isMarked = false;
    constructor(
        public readonly fragmentElements: HTMLElementWithData[] = [],
        public readonly fragmentData: Fragment
    ) {
        fragmentElements.forEach((fragmentElement) => {
            $(fragmentElement).on("click", (e) => {
                if (this.isMarked) {
                    this.unmark();
                } else {
                    this.mark(e.shiftKey);
                }
                this.emitOnClick.emit(this.isMarked);
            });
        });
    }
    public mark(highlight: boolean): void {
        if (!this.isMarked) {
            this.fragmentElements.forEach((fragmentElement) => {
                fragmentElement.classList.add("clicked");
            });
            this.isMarked = true;
            this.emitOnMarkedChange.emit({ isMarked: this.isMarked, highlight });
        }
    }
    public unmark(): void {
        if (this.isMarked) {
            this.fragmentElements.forEach((fragmentElement) => {
                fragmentElement.classList.remove("clicked");
            });
            this.isMarked = false;
            this.emitOnMarkedChange.emit({ isMarked: this.isMarked, highlight: false });
        }
    }
}

export type MarkEvent = {
    readonly isMarked: boolean;
    readonly highlight: boolean;
};
export class HTMLElementWithData extends HTMLElement {
    public readonly __data__: Fragment;
}
