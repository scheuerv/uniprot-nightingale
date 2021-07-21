import BasicCategoryRenderer from "../renderers/basic-category-renderer";
import { getDarkerColor } from "../../../utils/utils";
import TooltipContentBuilder, { createBlast } from "../../tooltip-content";
import Parser from "./parser";
import FragmentAligner from "./fragment-aligner";
import { Fragment, StructureInfo, TrackRow } from "../../../types/accession";
import { ChainMapping } from "../../../types/mapping";
import { SMRData, SMRResult, SMRChain, SMRSegment } from "../../../types/SMR-parser";
import { Interval } from "../../../types/interval";
export default class SMRParser implements Parser<SMRData> {
    private readonly categorylabel = "Predicted structures";
    public readonly categoryName = "PREDICTED_STRUCTURES";
    private readonly color = "#2e86c1";

    constructor(private readonly smrIds?: string[]) {}

    public async parse(uniprotId: string, data: SMRData): Promise<BasicCategoryRenderer[] | null> {
        const result: SMRResult = data.result;
        const trackRows: Map<string, TrackRow> = new Map();
        const fragmentForTemplate: Record<string, Fragment[]> = {};
        const observedIntervalsForTemplate: Record<string, Interval[]> = {};
        let id = 1;
        result.structures.forEach((structure) => {
            const sTemplate: RegExpMatchArray | null =
                structure.template.match(/(.+)\.(.+)+\.(.+)/);
            if (sTemplate !== null) {
                const smrId = sTemplate[1] + "." + sTemplate[2];
                const templateChain = sTemplate[3];
                if (this.smrIds?.includes(smrId) || !this.smrIds) {
                    const key = `${smrId} ${templateChain.toLowerCase()}`;
                    structure.chains.forEach((chain: SMRChain) => {
                        chain.segments.forEach((segment: SMRSegment) => {
                            if (!observedIntervalsForTemplate[key]) {
                                observedIntervalsForTemplate[key] = [];
                            }
                            observedIntervalsForTemplate[key].push({
                                start: segment.uniprot.from,
                                end: segment.uniprot.to
                            });
                        });
                    });
                }
            }
        });
        result.structures.forEach((structure) => {
            const sTemplate: RegExpMatchArray | null =
                structure.template.match(/(.+)\.(.+)+\.(.+)/);
            const experimentalMethod: string = structure.provider + " (" + structure.method + ")";
            const coordinatesFile: string = structure.coordinates;
            if (sTemplate !== null) {
                const smrId = sTemplate[1] + "." + sTemplate[2];
                const templateChain = sTemplate[3];
                if (this.smrIds?.includes(smrId) || !this.smrIds) {
                    const key = `${smrId} ${templateChain.toLowerCase()}`;
                    structure.chains.forEach((chain: SMRChain) => {
                        chain.segments.map((segment: SMRSegment) => {
                            let structureInfo: StructureInfo | undefined = undefined;
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
                            structureInfo = {
                                pdbId: sTemplate[1],
                                chain: chain.id,
                                url: coordinatesFile,
                                format: "pdb",
                                mapping: mapping,
                                idType: "auth",
                                observedIntervals: observedIntervalsForTemplate[key]
                            };
                            const tooltipContent: TooltipContentBuilder = new TooltipContentBuilder(
                                `${smrId.toUpperCase()}_${chain.id} ${segment.uniprot.from}${
                                    segment.uniprot.from === segment.uniprot.to
                                        ? ""
                                        : "-" + segment.uniprot.to
                                }`
                            );

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
                                    structureInfo
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
                new TrackRow(fragmentAligner.getAccessions(), key, fragments[0].structureInfo)
            );
        }
        if (trackRows.size > 0) {
            return [
                new BasicCategoryRenderer(trackRows, this.categorylabel, false, this.categoryName)
            ];
        } else {
            return null;
        }
    }
}
