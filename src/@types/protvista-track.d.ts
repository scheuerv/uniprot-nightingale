

declare module 'protvista-track' {
    export = ProtvistaTrack;
    import ProtvistaZoomable from "protvista-zoomable";
    import DefaultLayout from "protvista-track/src/DefaultLayout";
    import NonOverlappingLayout from "protvista-track/src/NonOverlappingLayout";
    import { Accession } from "src/renderers/basic-track-renderer";
    class ProtvistaTrack extends ProtvistaZoomable {
        _originalData: Accession[] | any;
        _data: Accession[] | any;
        set data(data: Accession[] | any);
        getLayout(): DefaultLayout | NonOverlappingLayout;
        toggleFilter(name: string): void;
        _createTrack(): void
    }
}

declare module 'protvista-track/src/config' {
    const config: Record<string, {
        name: string;
        label: string;
        tooltip: string;
        shape: string;
        color: string;
    }>;
}
declare module 'protvista-track/src/DefaultLayout' {
    export = DefaultLayout;
    class DefaultLayout {
        _padding: number;
        _minHeight: number;
        _layoutHeight: number;
        constructor(options: { layoutHeight: number, padding?: number, minHeight?: number });
        init(features: any): void;
        getFeatureYPos(): number;
        getFeatureHeight(): number;
    }
}
declare module 'protvista-track/src/NonOverlappingLayout' {
    export = NonOverlappingLayout;
    import DefaultLayout from "protvista-track/src/DefaultLayout";
    import { Accession } from "src/renderers/basic-track-renderer";
    class NonOverlappingLayout extends DefaultLayout {
        _padding: number;
        _minHeight: number;
        _layoutHeight: number;
        featuresMap: Map<Accession, number>;
        _rowHeight: number;
        _rows: Accession[];
        getOffset(): number;
    }
}