import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';
import TrackRenderer from './track-renderer';

export default class ProteomicsParser implements TrackParser {
    private categoryName = "Proteomics";

    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        if (data.errorMessage) {
            return null;
        }
        const unique: Accession[] = [];
        const nonUnique: Accession[] = [];
        const features = data.features;
        features.forEach((feature: { unique: string; begin: number; end: number; }) => {
            if (feature.unique) {
                unique.push(new Accession(null, [new Location([new Fragment(feature.begin, feature.end)])], 'UNIQUE'))
            }
            else {
                nonUnique.push(new Accession(null, [new Location([new Fragment(feature.begin, feature.end)])], 'NON_UNIQUE'))
            }
        });
        const trackRows = [
            new TrackRow(unique, "Unique peptide"),
            new TrackRow(nonUnique, "Non-unique peptide")
        ];
        return new BasicTrackRenderer(trackRows, this.categoryName);
    }
}