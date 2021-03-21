import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import { getDarkerColor } from '../utils';
import { createEmitter } from 'ts-typed-events';
export default class SMRParser implements TrackParser<SMROutput> {
    private emitDataLoaded = createEmitter<SMROutput[]>();
    public readonly dataLoaded = this.emitDataLoaded.event;
    private readonly categoryName = "Predicted structures";
    private readonly color = '#2e86c1';
    async parse(uniprotId: string, data: any): Promise<BasicTrackRenderer | null> {

        const result = data.result;
        const experimentalMethod = result.provider + " (" + result.method + ")";
        const coordinatesFile = result.coordinates;
        const trackRows: TrackRow[] = [];
        const output: SMROutput[] = []
        result.structures.forEach((structure: { template: string; chains: { id: string, segments: any }[]; }) => {
            const sTemplate = structure.template.match(/(.+)\.(.+)+\.(.+)/);

            let pdbId: string;
            if (sTemplate !== null) {
                pdbId = sTemplate[1] + '.' + sTemplate[2];
            }
            structure.chains.forEach(chain => {
                if (sTemplate !== null) {
                    output.push({ pdbId: sTemplate[1], chain: chain.id })
                }
                const fragments = chain.segments.map((segment: { uniprot: { from: string; to: string; }; }) => {
                    return new Fragment(parseInt(segment.uniprot.from), parseInt(segment.uniprot.to), getDarkerColor(this.color), this.color);
                });

                const accesion = new Accession(null, [
                    new Location(fragments)
                ], 'SMR')
                accesion.experimentalMethod = experimentalMethod;
                accesion.coordinatesFile = coordinatesFile;
                trackRows.push(new TrackRow([accesion], pdbId + ' ' + chain.id.toLowerCase()));
                return output;
            });
        })
        this.emitDataLoaded.emit(output);
        if (trackRows.length > 0) {
            return new BasicTrackRenderer(trackRows, this.categoryName);
        }
        else {
            return null;
        }
    }

}
type SMROutput = { pdbId: string, chain: string };
