import BasicCategoryRenderer from "../renderers/basic-category-renderer";
import TooltipContentBuilder, { createBlast } from "../../tooltip-content";
import Parser from "./parser";
import { Accession, Fragment, Location, StructureInfo, TrackRow } from "../../../types/accession";
import { TooltipContent } from "../../../types/tooltip-content";
import { ChainMapping, FragmentMapping } from "../../../types/mapping";
import {
    findUniprotIntervalsFromStructureResidues,
    findUniprotIntervalsFromUniprotSequence
} from "../../../utils/fragment-mapping-utils";
import { PDBParserData, StructureData } from "../../../types/pdb-parser";

export default class PdbParser implements Parser<PDBParserData> {
    private readonly observedColor = "#2e86c1";
    private readonly unobservedColor = "#bdbfc1";
    private id = 1;

    constructor(
        private readonly custom: boolean = false,
        private readonly categoryLabel = "Experimental structures",
        public readonly categoryName = "EXPERIMENTAL_STRUCTURES"
    ) {}

    /**
     * Takes raw data from api or user and creates objects of type BasicCategoryRenderer,
     * which are used to create html element representing raw data.
     *
     * Each row created by this parser is representing one structure. Each fragment
     * is containing information, which can be used to render the structure and
     * determine mapping between (uniprot) sequence and (pdb) structure.
     *
     * Each row can contain two types of fragments. Observed and unobserved. This is
     * determined using structure coverage (PolymerCoverage) and mapping (mentioned
     * above).
     *
     * Each fragment contains tooltip created in this class.
     *
     */
    public async parse(
        uniprotId: string,
        data: PDBParserData
    ): Promise<BasicCategoryRenderer[] | null> {
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
                        const sequenceStart: number = pdbParserItem.unp_start;
                        const sequenceEnd: number = pdbParserItem.unp_end;
                        const structure: StructureData = pdbParserItem.structure;
                        if (structure.url && structure.data) {
                            console.warn(
                                "Structure parameter provides information about both url and data. Url will be used."
                            );
                        } else if (!structure.url && !structure.data) {
                            throw Error(
                                "Structure parameter requires information about url or data."
                            );
                        }

                        const observedIntervals = chain.observed.flatMap((observedFragment) => {
                            return findUniprotIntervalsFromStructureResidues(
                                observedFragment.start.residue_number,
                                observedFragment.end.residue_number,
                                chainMapping.fragmentMappings
                            );
                        });
                        const structureInfo: StructureInfo = {
                            pdbId: pdbId,
                            chain: chainId,
                            mapping: sortedMappings,
                            url: structure.url ?? undefined,
                            data: !structure.url ? structure.data : undefined,
                            format: structure.format,
                            idType: "label",
                            observedIntervals: observedIntervals,
                            source: this.custom ? "USER" : "PDB"
                        };
                        const observedFragments = observedIntervals.map((interval) => {
                            return new Fragment(
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
                                structureInfo
                            );
                        });

                        const unobservedFragments: Fragment[] = this.getUnobservedFragments(
                            observedFragments,
                            sequenceStart,
                            sequenceEnd,
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
                            new TrackRow(
                                accessions,
                                pdbId + " " + chainId.toLowerCase(),
                                structureInfo
                            )
                        );
                    } else {
                        console.warn(`Mapping for ${pdbId} ${chainId} not found.`);
                    }
                });
            });
        }
        if (trackRows.size > 0) {
            return [
                new BasicCategoryRenderer(trackRows, this.categoryLabel, false, this.categoryName)
            ];
        }

        return null;
    }

    private getUnobservedFragments(
        observedFragments: Fragment[],
        sequenceStart: number,
        sequenceEnd: number,
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
                    sequenceStart,
                    sequenceEnd,
                    mapping,
                    uniprotId,
                    pdbId,
                    chainId,
                    experimentalMethod
                )
            );
            return unobservedFragments;
        }
        if (sequenceStart < observedFragmentSorted[0].start) {
            const fragmentEnd: number = observedFragmentSorted[0].start - 1;
            unobservedFragments = unobservedFragments.concat(
                this.createUnobservedFragmentsInRange(
                    sequenceStart,
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

        if (sequenceEnd - 1 >= observedFragmentSorted[observedFragmentSorted.length - 1].end) {
            const fragmentStart: number =
                observedFragmentSorted[observedFragmentSorted.length - 1].end + 1;
            unobservedFragments = unobservedFragments.concat(
                this.createUnobservedFragmentsInRange(
                    fragmentStart,
                    sequenceEnd,
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
