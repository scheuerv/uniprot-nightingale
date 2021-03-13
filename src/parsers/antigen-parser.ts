import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
//@ts-ignore
import { config } from "protvista-track/src/config";
import { getDarkerColor } from '../utils';

export default class AntigenParser implements TrackParser {
    private readonly categoryName = "Antigenic sequences";
    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        if (data.errorMessage)
            return null;
        const features = data.features;
        const fragments = features.map((feature: { begin: string; end: string; type: string }) => {
            const fillColor = config[feature.type]?.color;
            const borderColor = getDarkerColor(fillColor)
            return new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor)
        });
        if (features.length > 0) {
            const type = features[0].type;
            const trackRow = new TrackRow([
                new Accession(null, [new Location(fragments)], type),
            ], config[type]?.label);
            return new BasicTrackRenderer([trackRow], this.categoryName);
        } else {
            return null;
        }
    }
}
