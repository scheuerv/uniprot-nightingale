import BasicTrackRenderer from "../renderers/basic-track-renderer";
import TooltipContentBuilder, { createBlast } from "../tooltip-content";
import TrackParser from "./track-parser";
import { Accession, Fragment, Location, Output, TrackRow } from "../types/accession";
import { TooltipContent } from "../types/tooltip-content";
import { ChainMapping, FragmentMapping } from "../types/mapping";
import {
    findUniprotIntervalsFromStructureResidues,
    findUniprotIntervalsFromUniprotSequence
} from "../utils/fragment-mapping-utils";
import { PDBParserData, StructureData } from "../types/pdb-parser";

export default class PdbParser implements TrackParser {
    private readonly observedColor = "#2e86c1";
    private readonly unobservedColor = "#bdbfc1";
    private id = 1;

    constructor(
        private readonly categoryLabel = "Experimental structures",
        public readonly categoryName = "EXPERIMENTAL_STRUCTURES"
    ) {}

    public async parse(
        uniprotId: string,
        data: PDBParserData
    ): Promise<BasicTrackRenderer[] | null> {
        const trackRows: Map<string, TrackRow> = new Map();
        for (const pdbParserItem of data) {
            const sortedMappings: Record<string, ChainMapping> = {};
            Object.entries(pdbParserItem.mappings).forEach(([chainId, chainMapping]) => {
                const sortedChainMappings = chainMapping.fragment_mappings.sort((a, b) => {
                    return a.start.residue_number - b.start.residue_number;
                });
                sortedMappings[chainId] = {
                    structAsymId: chainMapping.struct_asym_id,
                    fragmentMappings: sortedChainMappings.map((chainMapping) => {
                        return {
                            entityId: chainMapping.entity_id,
                            sequenceEnd: chainMapping.unp_end,
                            structureStart: chainMapping.start.residue_number,
                            structureEnd: chainMapping.end.residue_number,
                            sequenceStart: chainMapping.unp_start
                        };
                    })
                };
            });

            const pdbId: string = pdbParserItem.pdb_id;
            pdbParserItem.polymer_coverage[pdbId].molecules.forEach((molecule) => {
                molecule.chains.forEach((chain) => {
                    const chainId: string = chain.chain_id;
                    const chainMapping = sortedMappings[chainId];
                    if (chainMapping) {
                        const uniprotStart: number = pdbParserItem.unp_start;
                        const uniprotEnd: number = pdbParserItem.unp_end;
                        const structure: StructureData = pdbParserItem.structure;
                        if (structure.uri && structure.data) {
                            console.warn(
                                "Structure parameter provides information about both uri and data. Uri will be used."
                            );
                        } else if (!structure.uri && !structure.data) {
                            throw Error(
                                "Structure parameter requires information about uri or data."
                            );
                        }
                        const output: Output = {
                            pdbId: pdbId,
                            chain: chainId,
                            mapping: sortedMappings,
                            url: structure.uri ?? undefined,
                            data: !structure.uri ? structure.data : undefined,
                            format: structure.format
                        };
                        const observedFragments: Fragment[] = [];
                        chain.observed.forEach((observedFragment) => {
                            const intervals = findUniprotIntervalsFromStructureResidues(
                                observedFragment.start.residue_number,
                                observedFragment.end.residue_number,
                                chainMapping.fragmentMappings
                            );
                            intervals.forEach((interval) => {
                                observedFragments.push(
                                    new Fragment(
                                        this.id++,
                                        interval.start,
                                        interval.end,
                                        this.observedColor,
                                        this.observedColor,
                                        undefined,
                                        this.createTooltip(
                                            uniprotId,
                                            pdbId,
                                            chainId,
                                            interval.start,
                                            interval.end,
                                            pdbParserItem.experimental_method
                                        ),
                                        output
                                    )
                                );
                            });
                        });

                        const unobservedFragments: Fragment[] = this.getUnobservedFragments(
                            observedFragments,
                            uniprotStart,
                            uniprotEnd,
                            pdbId,
                            chainId,
                            uniprotId,
                            chainMapping.fragmentMappings,
                            pdbParserItem.experimental_method
                        );
                        const fragments: Fragment[] = observedFragments.concat(unobservedFragments);
                        const accessions: Accession[] = [new Accession([new Location(fragments)])];
                        trackRows.set(
                            pdbId + " " + chainId.toLowerCase(),
                            new TrackRow(accessions, pdbId + " " + chainId.toLowerCase(), output)
                        );
                    } else {
                        console.warn(`Mapping for ${pdbId} ${chainId} not found.`);
                    }
                });
            });
        }
        if (trackRows.size > 0) {
            return [
                new BasicTrackRenderer(trackRows, this.categoryLabel, false, this.categoryName)
            ];
        }

        return null;
    }

    private getUnobservedFragments(
        observedFragments: Fragment[],
        start: number,
        end: number,
        pdbId: string,
        chainId: string,
        uniprotId: string,
        mapping: FragmentMapping[],
        experimentalMethod?: string
    ): Fragment[] {
        const observedFragmentSorted: Fragment[] = observedFragments.sort(
            (a, b) => a.start - b.start
        );
        let unobservedFragments: Fragment[] = [];

        if (observedFragmentSorted.length == 0) {
            unobservedFragments = unobservedFragments.concat(
                this.createUnobservedFragmentsInRange(
                    start,
                    end,
                    mapping,
                    uniprotId,
                    pdbId,
                    chainId,
                    experimentalMethod
                )
            );
            return unobservedFragments;
        }
        if (start < observedFragmentSorted[0].start) {
            const fragmentEnd: number = observedFragmentSorted[0].start - 1;
            unobservedFragments = unobservedFragments.concat(
                this.createUnobservedFragmentsInRange(
                    start,
                    fragmentEnd,
                    mapping,
                    uniprotId,
                    pdbId,
                    chainId,
                    experimentalMethod
                )
            );
        }

        for (let i = 1; i < observedFragmentSorted.length; i++) {
            const fragmentStart: number = observedFragmentSorted[i - 1].end + 1;
            const fragmentEnd: number = observedFragmentSorted[i].start - 1;
            unobservedFragments = unobservedFragments.concat(
                this.createUnobservedFragmentsInRange(
                    fragmentStart,
                    fragmentEnd,
                    mapping,
                    uniprotId,
                    pdbId,
                    chainId,
                    experimentalMethod
                )
            );
        }

        if (end - 1 >= observedFragmentSorted[observedFragmentSorted.length - 1].end) {
            const fragmentStart: number =
                observedFragmentSorted[observedFragmentSorted.length - 1].end + 1;
            unobservedFragments = unobservedFragments.concat(
                this.createUnobservedFragmentsInRange(
                    fragmentStart,
                    end,
                    mapping,
                    uniprotId,
                    pdbId,
                    chainId,
                    experimentalMethod
                )
            );
        }
        return unobservedFragments;
    }

    private createUnobservedFragmentsInRange(
        fragmentStart: number,
        fragmentEnd: number,
        mapping: FragmentMapping[],
        uniprotId: string,
        pdbId: string,
        chainId: string,
        experimentalMethod: string | undefined
    ): Fragment[] {
        const intervals = findUniprotIntervalsFromUniprotSequence(
            fragmentStart,
            fragmentEnd,
            mapping
        );
        return intervals.map((interval) => {
            return new Fragment(
                this.id++,
                interval.start,
                interval.end,
                this.unobservedColor,
                this.unobservedColor,
                undefined,
                this.createTooltip(
                    uniprotId,
                    pdbId,
                    chainId,
                    interval.start,
                    interval.end,
                    experimentalMethod
                )
            );
        });
    }

    private createTooltip(
        uniprotId: string,
        pdbId: string,
        chainId: string,
        start: string | number,
        end: string | number,
        experimentalMethod?: string
    ): TooltipContent {
        const tooltipContent = new TooltipContentBuilder(
            `${pdbId.toUpperCase()}_${chainId} ${start}${start === end ? "" : "-" + end}`
        );
        tooltipContent
            .addDataTable()
            .addRowIfContentDefined(
                "Description",
                experimentalMethod ? "Experimental method: " + experimentalMethod : undefined
            )
            .addRowIfContentDefined(
                "BLAST",
                createBlast(uniprotId, start, end, `${pdbId} ${chainId.toLowerCase()}`)
            );
        return tooltipContent.build();
    }
}
