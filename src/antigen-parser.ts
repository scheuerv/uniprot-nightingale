import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession ,TrackRow} from './basic-track-renderer';
import TrackRenderer from './track-renderer';

export default class AntigenParser implements TrackParser {

    parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        return new Promise(resolve => {
            const features = data.features;
            const fragments = features.map((feature: { begin: number; end: number; }) =>
                new Fragment(feature.begin, feature.end)
            )
            const trackRow  = new TrackRow([
                new Accession(uniprotId, null, [new Location(fragments)] , 'ANTIGEN')
            ]);

            resolve(new BasicTrackRenderer([trackRow]));
        });
    }
}
