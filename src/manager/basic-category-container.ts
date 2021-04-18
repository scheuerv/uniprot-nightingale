import { ElementWithData, FragmentWrapper, RowWrapper, RowWrapperBuilder } from "../renderers/basic-track-renderer";
import d3 = require('d3');
import CategoryContainer from "./category-container";
import { TrackContainer } from "./track-container";
import { TrackFragment } from "./track-manager";
import { createEmitter } from "ts-typed-events";

export default class BasicCategoryContainer implements CategoryContainer {
    private _rowWrappers: RowWrapper[];
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    constructor(private readonly _tracks: TrackContainer[], private readonly _categoryDiv: HTMLDivElement) {

    }

    get content(): HTMLElement {
        return this._categoryDiv;
    }
    getMarkedTrackFragments(): TrackFragment[] {
        return this._rowWrappers[0].getMarkedFragments();
    }
    addData() {
        this._tracks.forEach(track => track.addData());
        const map: Map<number, ElementAndBuilder[]> = new Map();
        const mainRowElement = d3.select(this._categoryDiv).select('.track-row.main');
        const mainRowWrapperBuilder = new RowWrapperBuilder(mainRowElement.select('.fa-arrow-circle-right').node() as Element);
        const rowWrapperBuilders = [mainRowWrapperBuilder];
        mainRowElement.selectAll('.fragment-group').nodes().forEach(fragment => {
            const fragmentWithData = fragment as ElementWithData;
            map.set(fragmentWithData.__data__.id, [{ element: fragmentWithData, builder: mainRowWrapperBuilder }]);
        });
        d3.select(this._categoryDiv).selectAll('.subtracks-container .track-row').nodes().forEach(row => {
            const rowSelection = d3.select(row);
            const rowWrapperBuilder = new RowWrapperBuilder(rowSelection.select('.fa-arrow-circle-right').node() as Element);
            rowWrapperBuilders.push(rowWrapperBuilder);
            rowSelection.selectAll('.fragment-group').nodes().forEach(fragment => {
                const fragmentWithData = fragment as ElementWithData;
                map.get(fragmentWithData.__data__.id)?.push({ element: fragmentWithData, builder: rowWrapperBuilder });
            });
        });
        map.forEach((fragmentRowTuples, id) => {
            const fragmentWrapper = new FragmentWrapper(fragmentRowTuples.map(it => it.element), fragmentRowTuples[0].element.__data__);
            fragmentRowTuples.forEach(fragmentRowTuple => {
                fragmentRowTuple.builder.addFragmentWrapper(fragmentWrapper);
            });
        });
        this._rowWrappers = rowWrapperBuilders.map(builder => {
            return builder.build();
        });
        this._rowWrappers[0].onHighlightChange.on(trackFragments => {
            this.emitOnHighlightChange.emit(trackFragments);
        });
    }
    get rowWrappers() {
        return this._rowWrappers;
    }
    get trackContainers() {
        return this._tracks;
    }
}

type ElementAndBuilder = {
    readonly element: ElementWithData,
    readonly builder: RowWrapperBuilder
}