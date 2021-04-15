import { ElementWithData, FragmentWrapper, RowWrapper, RowWrapperBuilder } from "../renderers/basic-track-renderer";
import d3 = require('d3');
import CategoryContainer from "./category-container";
import { TrackContainer } from "./track-container";

export default class BasicCategoryContainer implements CategoryContainer {
    private rowWrappers: RowWrapper[];
    constructor(private tracks: TrackContainer[], private categoryDiv: HTMLDivElement) {

    }
    getContent(): HTMLElement {
        return this.categoryDiv;
    }
    addData() {
        this.tracks.forEach(track => track.addData());
        const map: Map<number, ElementAndBuilder[]> = new Map();
        const mainRowElement = d3.select(this.categoryDiv).select('.track-row.main');
        const mainRowWrapperBuilder = new RowWrapperBuilder(mainRowElement.select('.fa-arrow-circle-right').node() as Element);
        const rowWrapperBuilders = [mainRowWrapperBuilder];
        mainRowElement.selectAll('.fragment-group').nodes().forEach(fragment => {
            const fragmentWithData = fragment as ElementWithData;
            map.set(fragmentWithData.__data__.id, [{ element: fragmentWithData, builder: mainRowWrapperBuilder }]);
        });
        d3.select(this.categoryDiv).selectAll('.subtracks-container .track-row').nodes().forEach(row => {
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
        this.rowWrappers = rowWrapperBuilders.map(builder => {
            return builder.build();
        });
    }
    getRowWrappers() {
        return this.rowWrappers;
    }
    getTrackContainers() {
        return this.tracks;
    }
}

type ElementAndBuilder = {
    readonly element: ElementWithData,
    readonly builder: RowWrapperBuilder
}