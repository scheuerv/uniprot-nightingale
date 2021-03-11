import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';
import TrackRenderer from './track-renderer';

export default class AntigenParser implements TrackParser {
    private categoryName = "Antigenic sequences";
    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        if (data.errorMessage)
            return null;
        const features = data.features;
        const fragments = features.map((feature: { begin: number; end: number; }) =>
            new Fragment(feature.begin, feature.end)
        )
        const trackRow = new TrackRow([
            new Accession( null, [new Location(fragments)], 'ANTIGEN'),
        ],"Antibody binding sequences");
        return new BasicTrackRenderer([trackRow], this.categoryName);
    }
}
