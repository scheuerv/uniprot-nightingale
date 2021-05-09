import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import { getDarkerColor } from '../utils';
import TooltipContent, { createBlast } from '../tooltip-content';
import TrackParser from './track-parser';
import { Output } from '../manager/track-manager';
export default class SMRParser implements TrackParser {
    private readonly categoryName = "Predicted structures";
    private readonly color = '#2e86c1';
    public async parse(uniprotId: string, data: SMRData): Promise<BasicTrackRenderer | null> {
        const result = data.result;
        const trackRows: TrackRow[] = [];
        const outputs: Output[] = []
        result.structures.forEach((structure) => {
            const sTemplate = structure.template.match(/(.+)\.(.+)+\.(.+)/);
            const experimentalMethod = structure.provider + " (" + structure.method + ")";
            const coordinatesFile = structure.coordinates;
            let pdbId: string;
            if (sTemplate !== null) {
                pdbId = sTemplate[1] + '.' + sTemplate[2];
            }
            let id = 1;
            structure.chains.forEach(chain => {
                let output: Output | undefined = undefined;
                if (sTemplate !== null) {
                    output = { pdbId: sTemplate[1], chain: chain.id, url: coordinatesFile, format: "pdb", mapping: { uniprotStart: structure.from, uniprotEnd: structure.to, fragmentMappings: [{ pdbStart: structure.from, pdbEnd: structure.to, from: structure.from, to: structure.to}] } };
                    outputs.push(output)
                }
                const fragments = chain.segments.map(segment => {
                    const tooltipContent = new TooltipContent(`${pdbId.toUpperCase()}_${chain.id} ${segment.uniprot.from}${(segment.uniprot.from === segment.uniprot.to) ? "" : ("-" + segment.uniprot.to)}`);
                    tooltipContent.addRowIfContentDefined('Description', structure.method ? 'Experimental method: ' + structure.method : undefined);
                    tooltipContent.addRowIfContentDefined('BLAST', createBlast(uniprotId, segment.uniprot.from, segment.uniprot.to, `${pdbId}" "${chain.id.toLowerCase()}`));
                    return new Fragment(id++, segment.uniprot.from, segment.uniprot.to, getDarkerColor(this.color), this.color, undefined, tooltipContent);
                });

                const accesion = new Accession(null, [
                    new Location(fragments)
                ], 'SMR', experimentalMethod)
                trackRows.push(new TrackRow([accesion], pdbId + ' ' + chain.id.toLowerCase(), output));
                return outputs;
            });
        })
        if (trackRows.length > 0) {
            return new BasicTrackRenderer(trackRows, this.categoryName, false);
        }
        else {
            return null;
        }
    }

}

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
    readonly result: SMRResult,
};
