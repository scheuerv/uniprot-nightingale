import * as d3 from "d3";
import { Fragment } from "../types/accession";
import { createEmitter } from "ts-typed-events";

export class FragmentWrapper {
    private readonly emitOnClick = createEmitter<boolean>();
    public readonly onClick = this.emitOnClick.event;
    private readonly emitOnMarkedChange = createEmitter<boolean>();
    public readonly onMarkedChange = this.emitOnMarkedChange.event;
    private isMarked = false;
    constructor(
        public readonly fragmentElements: ElementWithData[] = [],
        public readonly fragmentData: Fragment
    ) {
        fragmentElements.forEach((fragmentElement) => {
            d3.select(fragmentElement).on("click", () => {
                if (this.isMarked) {
                    this.unmark();
                } else {
                    this.mark();
                }
                this.emitOnClick(this.isMarked);
            });
        });
    }
    public mark(): void {
        if (!this.isMarked) {
            this.fragmentElements.forEach((fragmentElement) => {
                fragmentElement.classList.add("clicked");
            });
            this.isMarked = true;
            this.emitOnMarkedChange(this.isMarked);
        }
    }
    public unmark(): void {
        if (this.isMarked) {
            this.fragmentElements.forEach((fragmentElement) => {
                fragmentElement.classList.remove("clicked");
            });
            this.isMarked = false;
            this.emitOnMarkedChange(this.isMarked);
        }
    }
}

export class ElementWithData extends Element {
    public readonly __data__: Fragment;
}
