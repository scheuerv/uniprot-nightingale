import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';
import TrackRenderer from './track-renderer';

export default class ProteomicsParser implements TrackParser {

    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        const trackRows: TrackRow[] = [];
        const unique: Accession[]=[];
        const nonUnique: Accession[]=[];
        const features = data.features;
            features.forEach((feature: { unique: string; begin: number; end: number; }) => {
                if(feature.unique)
                {
                    unique.push(new Accession(uniprotId,null,[new Location([new Fragment(feature.begin,feature.end)])],'UNIQUE'))
                }
                else{
                    nonUnique.push(new Accession(uniprotId,null,[new Location([new Fragment(feature.begin,feature.end)])],'NON_UNIQUE'))
                }
        });
        trackRows.push(new TrackRow(unique));
        trackRows.push(new TrackRow(nonUnique));
        return new BasicTrackRenderer(trackRows);
    }
}