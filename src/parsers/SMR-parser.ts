import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import { getDarkerColor } from '../utils';
import { createEmitter } from 'ts-typed-events';
import TooltipContent, { createBlast } from '../tooltip-content';
export default class SMRParser implements TrackParser<SMROutput> {
    private readonly emitOnDataLoaded = createEmitter<SMROutput[]>();
    public readonly onDataLoaded = this.emitOnDataLoaded.event;
    private readonly emitOnLabelClick = createEmitter<SMROutput>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    private readonly categoryName = "Predicted structures";
    private readonly color = '#2e86c1';
    async parse(uniprotId: string, data: SMRData): Promise<BasicTrackRenderer<SMROutput> | null> {

        const result = data.result;
        const trackRows: TrackRow<SMROutput>[] = [];
        const outputs: SMROutput[] = []
        result.structures.forEach((structure) => {
            const sTemplate = structure.template.match(/(.+)\.(.+)+\.(.+)/);
            const experimentalMethod = structure.provider + " (" + structure.method + ")";
            const coordinatesFile = structure.coordinates;
            let pdbId: string;
            if (sTemplate !== null) {
                pdbId = sTemplate[1] + '.' + sTemplate[2];
            }
            structure.chains.forEach(chain => {
                let output: SMROutput | undefined = undefined;
                if (sTemplate !== null) {
                    output = { pdbId: sTemplate[1], chain: chain.id };
                    outputs.push(output)
                }
                const fragments = chain.segments.map(segment => {
                    const tooltipContent = new TooltipContent(`${pdbId.toUpperCase()}_${chain.id} ${segment.uniprot.from}${(segment.uniprot.from === segment.uniprot.to) ? "" : ("-" + segment.uniprot.to)}`);
                    tooltipContent.addRowIfContentDefined('Description', structure.method ? 'Experimental method: ' + structure.method : undefined);
                    tooltipContent.addRowIfContentDefined('BLAST', createBlast(uniprotId, segment.uniprot.from, segment.uniprot.to, `${pdbId}" "${chain.id.toLowerCase()}`));
                    return new Fragment(segment.uniprot.from, segment.uniprot.to, getDarkerColor(this.color), this.color, undefined, tooltipContent);
                });

                const accesion = new Accession(null, [
                    new Location(fragments)
                ], 'SMR', experimentalMethod, coordinatesFile)
                trackRows.push(new TrackRow([accesion], pdbId + ' ' + chain.id.toLowerCase(), output));
                return outputs;
            });
        })
        this.emitOnDataLoaded.emit(outputs);
        if (trackRows.length > 0) {
            return new BasicTrackRenderer(trackRows, this.categoryName, this.emitOnLabelClick, false);
        }
        else {
            return null;
        }
    }

}
type SMROutput = { readonly pdbId: string, readonly chain: string };

type SMRResult = {
    readonly sequence: string,
    readonly sequence_length: number,
    readonly structures: SMRStructure[],
    readonly uniprot_entries?: {
        readonly ac?: string,
        readonly id?: string,
        readonly isoid?: number
    }[]

}

type SMRStructure = {
    readonly chains: SMRChain[]
    readonly coordinates: string,
    readonly coverage: number,
    readonly from: number,
    readonly identity?: number,
    readonly method: string,
    readonly provider: string,
    readonly similarity?: number,
    readonly template: string,
    readonly to: number
}
type SMRChain = {
    readonly id: string,
    readonly segments: SMRSegment[]
};
type SMRSegment = {
    readonly smtl: {
        readonly aligned_sequence: string,
        readonly description: string,
        readonly from: number,
        readonly to: number
    },
    readonly uniprot: {
        readonly aligned_sequence: string,
        readonly from: number,
        readonly to: number
    }
};

type SMRData = {

    result: SMRResult,

};
