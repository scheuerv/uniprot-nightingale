import $ from "jquery";
import { TrackFragment } from "../types/accession";
import { createEmitter } from "ts-typed-events";
import { FragmentWrapper, MarkEvent } from "./fragment-wrapper";

/**
 * Contains array of FragmentWrappers and remembers which ones are
 * highlighted and which are marked (highlighted fragments are subset
 * of marked fragments). It also supports bulk operation using arrow
 * to mark all fragments on this row and subsequently their correspoding
 * twins on other rows.
 *
 * Arrow is marked when all fragments are marked.
 */
export class RowWrapper {
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private readonly markedFragments = new Set<FragmentWrapper>();
    private readonly higlightedFragments = new Set<FragmentWrapper>();
    constructor(
        private readonly arrowElement: Element,
        private readonly fragmentWrappers: FragmentWrapper[]
    ) {
        $(arrowElement).on("click", this.arrowClick());
        fragmentWrappers.forEach((fragmentWrapper) => {
            fragmentWrapper.onClick.on(() => {
                this.emitOnHighlightChange.emit(this.getMarkedTrackFragments());
            });
            fragmentWrapper.onMarkedChange.on((markEvent: MarkEvent) => {
                if (markEvent.isMarked) {
                    if (markEvent.highlight) {
                        this.higlightedFragments.add(fragmentWrapper);
                    }
                    this.markedFragments.add(fragmentWrapper);
                    //check if all fragments are marked
                    if (this.markedFragments.size == this.fragmentWrappers.length) {
                        this.arrowElement.classList.add("clicked");
                    }
                } else {
                    this.higlightedFragments.delete(fragmentWrapper);
                    this.markedFragments.delete(fragmentWrapper);
                    this.arrowElement.classList.remove("clicked");
                }
            });
        });
    }

    public getMarkedTrackFragments(): TrackFragment[] {
        return [...this.markedFragments].map((fragmentWrapper) => {
            return {
                sequenceStart: fragmentWrapper.fragmentData.start,
                sequenceEnd: fragmentWrapper.fragmentData.end,
                color: fragmentWrapper.fragmentData.color
            };
        });
    }

    public getHighlightedTrackFragments(): TrackFragment[] {
        return [...this.higlightedFragments].map((fragmentWrapper) => {
            return {
                sequenceStart: fragmentWrapper.fragmentData.start,
                sequenceEnd: fragmentWrapper.fragmentData.end,
                color: fragmentWrapper.fragmentData.color
            };
        });
    }

    public clearHighlightedTrackFragments(): void {
        this.higlightedFragments.clear();
    }
    /**
     * Marks or unmarks all fragments based on arrow state.
     */
    private arrowClick(): () => boolean {
        return () => {
            if (this.arrowElement.classList.contains("clicked")) {
                this.fragmentWrappers.forEach((fragment) => {
                    fragment.unmark();
                });
            } else {
                this.fragmentWrappers.forEach((fragment) => {
                    fragment.mark(false);
                });
            }
            this.emitOnHighlightChange.emit(this.getMarkedTrackFragments());
            return false;
        };
    }
}

export class RowWrapperBuilder {
    private readonly fragmentWrappers: FragmentWrapper[] = [];
    constructor(public readonly arrowElement: Element) {}

    public addFragmentWrapper(fragmentWrapper: FragmentWrapper): void {
        this.fragmentWrappers.push(fragmentWrapper);
    }

    public build(): RowWrapper {
        return new RowWrapper(this.arrowElement, this.fragmentWrappers);
    }
}
