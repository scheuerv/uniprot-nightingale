import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';
export default class SMRParser implements TrackParser {
    private categoryName = "Predicted structures";
    async parse(uniprotId: string, data: any): Promise<BasicTrackRenderer> {

        const result = data.result;
        const experimentalMethod = result.provider + " (" + result.method + ")";
        const coordinatesFile = result.coordinates;
        const trackRow: TrackRow[] = [];
        result.structures.forEach((structure: { template: string; chains: any[]; from: number; to: number; }) => {
            const sTemplate = structure.template.match(/(.+)\.(.+)+\.(.+)/);
            let pdbId: string;
            if (sTemplate !== null) { pdbId = sTemplate[1] + '.' + sTemplate[2]; }
            structure.chains.forEach(chain => {
                const fragments = chain.segments.map((segment: { uniprot: { from: number; to: number; }; }) => {
                    return new Fragment(segment.uniprot.from, segment.uniprot.to);
                });

                let accesion = new Accession(null, [
                    new Location(fragments)
                ], 'SMR')
                accesion.experimentalMethod = experimentalMethod;
                accesion.coordinatesFile = coordinatesFile;
                trackRow.push(new TrackRow([accesion], pdbId + ' ' + chain.id.toLowerCase()));
            });
        });
        return new BasicTrackRenderer(trackRow, this.categoryName);
    }

}
