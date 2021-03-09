import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';
export default class SMRParser implements TrackParser {
    parse(uniprotId: string, data: any): Promise<BasicTrackRenderer> {
        return new Promise(resolve => {
            const result = data.result;
            const trackRow: TrackRow[] = [];
            result.structures.forEach((structure: { template: string; chains: any[]; from: number; to: number; }) => {
                const sTemplate = structure.template.match(/(.+)\.(.+)+\.(.+)/);
                let pdbId: string;
                if (sTemplate !== null) { pdbId = sTemplate[1] + '.' + sTemplate[2]; }
                //const chain = sTemplate[3];
                structure.chains.forEach(chain => {
                    const fragments = chain.segments.map((segment: { uniprot: { from: number; to: number; }; }) => {
                        return new Fragment(segment.uniprot.from, segment.uniprot.to);
                    });
                    trackRow.push(new TrackRow([new Accession(pdbId + ' ' + chain.id, null, [
                        new Location(fragments, structure.from, structure.to)
                    ], 'SMR')]));
                });

            });
            resolve(new BasicTrackRenderer(trackRow));
        });
    }

}
