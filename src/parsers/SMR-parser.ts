import BasicTrackRenderer from "../renderers/basic-track-renderer";
import { getDarkerColor } from "../utils/utils";
import TooltipContentBuilder, { createBlast } from "../tooltip-content";
import TrackParser from "./track-parser";
import FragmentAligner from "./fragment-aligner";
import { Fragment, Output, TrackRow } from "../types/accession";
import { ChainMapping } from "../types/mapping";
export default class SMRParser implements TrackParser {
    private readonly categorylabel = "Predicted structures";
    public readonly categoryName = "PREDICTED_STRUCTURES";
    private readonly color = "#2e86c1";

    constructor(private readonly smrIds?: string[]) {}

    public async parse(uniprotId: string, data: SMRData): Promise<BasicTrackRenderer[] | null> {
        const result: SMRResult = data.result;
        const trackRows: Map<string, TrackRow> = new Map();
        const fragmentForTemplate: Record<string, Fragment[]> = {};
        let id = 1;
        result.structures.forEach((structure) => {
            const sTemplate: RegExpMatchArray | null =
                structure.template.match(/(.+)\.(.+)+\.(.+)/);
            const experimentalMethod: string = structure.provider + " (" + structure.method + ")";
            const coordinatesFile: string = structure.coordinates;
            let smrId = "";
            let templateChain = "";
            if (sTemplate !== null) {
                smrId = sTemplate[1] + "." + sTemplate[2];
                templateChain = sTemplate[3];
                if (this.smrIds?.includes(smrId) || !this.smrIds) {
                    structure.chains.forEach((chain: SMRChain) => {
                        chain.segments.map((segment: SMRSegment) => {
                            let output: Output | undefined = undefined;
                            const mapping: Record<string, ChainMapping> = {};
                            mapping[chain.id] = {
                                structAsymId: chain.id,
                                fragmentMappings: [
                                    {
                                        sequenceStart: segment.uniprot.from,
                                        sequenceEnd: segment.uniprot.to,
                                        structureStart: segment.uniprot.from,
                                        structureEnd: segment.uniprot.to
                                    }
                                ]
                            };
                            output = {
                                pdbId: sTemplate[1],
                                chain: chain.id,
                                url: coordinatesFile,
                                format: "pdb",
                                mapping: mapping
                            };
                            const tooltipContent: TooltipContentBuilder = new TooltipContentBuilder(
                                `${smrId.toUpperCase()}_${chain.id} ${segment.uniprot.from}${
                                    segment.uniprot.from === segment.uniprot.to
                                        ? ""
                                        : "-" + segment.uniprot.to
                                }`
                            );
                            const key = `${smrId} ${templateChain.toLowerCase()}`;
                            tooltipContent
                                .addDataTable()
                                .addRowIfContentDefined(
                                    "Description",
                                    structure.method
                                        ? "Experimental method: " + experimentalMethod
                                        : undefined
                                )
                                .addRowIfContentDefined(
                                    "BLAST",
                                    createBlast(
                                        uniprotId,
                                        segment.uniprot.from,
                                        segment.uniprot.to,
                                        key
                                    )
                                );
                            if (!fragmentForTemplate[key]) {
                                fragmentForTemplate[key] = [];
                            }
                            fragmentForTemplate[key].push(
                                new Fragment(
                                    id++,
                                    segment.uniprot.from,
                                    segment.uniprot.to,
                                    getDarkerColor(this.color),
                                    this.color,
                                    undefined,
                                    tooltipContent.build(),
                                    output
                                )
                            );
                        });
                    });
                }
            }
        });
        for (const key in fragmentForTemplate) {
            const fragments: Fragment[] = fragmentForTemplate[key];
            const fragmentAligner = new FragmentAligner();
            fragments.forEach((feature: Fragment) => {
                fragmentAligner.addFragment(feature);
            });
            trackRows.set(
                key,
                new TrackRow(fragmentAligner.getAccessions(), key, fragments[0].output)
            );
        }
        if (trackRows.size > 0) {
            return [
                new BasicTrackRenderer(trackRows, this.categorylabel, false, this.categoryName)
            ];
        } else {
            return null;
        }
    }
}

type SMRResult = {
    readonly structures: SMRStructure[];
};

type SMRStructure = {
    readonly chains: SMRChain[];
    readonly coordinates: string;
    readonly from: number;
    readonly method?: string;
    readonly provider: string;
    readonly template: string;
    readonly to: number;
};
type SMRChain = {
    readonly id: string;
    readonly segments: SMRSegment[];
};
type SMRSegment = {
    readonly uniprot: {
        readonly from: number;
        readonly to: number;
    };
};

export type SMRData = {
    readonly result: SMRResult;
};
