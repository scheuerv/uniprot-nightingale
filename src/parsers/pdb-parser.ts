import BasicTrackRenderer, {
    Fragment,
    Location,
    Accession,
    TrackRow
} from "../renderers/basic-track-renderer";
import TooltipContent, { createBlast } from "../tooltip-content";
import { fetchWithTimeout } from "../utils";
import TrackParser, { FragmentMapping } from "./track-parser";
import { Output } from "../manager/track-manager";

export default class PdbParser implements TrackParser {
    private readonly observedColor = "#2e86c1";
    private readonly unobservedColor = "#bdbfc1";
    private id = 1;

    constructor(
        private readonly pdbIds?: string[],
        private readonly categoryLabel = "Experimental structures",
        public readonly categoryName = "EXPERIMENTAL_STRUCTURES"
    ) {}

    public async parse(
        uniprotId: string,
        data: PDBParserData
    ): Promise<BasicTrackRenderer[] | null> {
        const trackRows: Map<string, TrackRow> = new Map();
        if (data[uniprotId]) {
            const hash: Record<string, PDBParserItemAgg> = {};
            const dataDeduplicated: PDBParserItemAgg[] = [];
            for (const record of data[uniprotId]) {
                if (this.pdbIds?.includes(record.pdb_id) || !this.pdbIds) {
                    if (!hash[record.pdb_id + "_" + record.chain_id]) {
                        const recordAgg: PDBParserItemAgg = {
                            ...record,
                            tax_ids: [record.tax_id]
                        };
                        hash[record.pdb_id + "_" + record.chain_id] = recordAgg;
                        dataDeduplicated.push(recordAgg);
                    } else {
                        hash[record.pdb_id + "_" + record.chain_id].tax_ids.push(record.tax_id);
                    }
                }
            }
            await Promise.allSettled(
                dataDeduplicated.map((record: PDBParserItemAgg) => {
                    const chain_id: string = record.chain_id;
                    const pdb_id: string = record.pdb_id;
                    if (record.structure) {
                        return Promise.resolve({
                            source: record,
                            data: record.coverage
                        });
                    } else {
                        return fetchWithTimeout(this.urlGenerator(pdb_id, chain_id), {
                            timeout: 8000
                        }).then(
                            (data) =>
                                data.json().then((data) => {
                                    return { source: record, data: data };
                                }),
                            (err) => {
                                console.log(`API unavailable!`, err);
                                return Promise.reject();
                            }
                        );
                    }
                })
            ).then((results) => {
                results
                    .map((promiseSettled) => {
                        if (promiseSettled.status == "fulfilled") {
                            return promiseSettled.value;
                        }
                        return null;
                    })
                    .filter((result) => result != null)
                    .map((result) => result!)
                    .forEach((result: { source: PDBParserItemAgg; data: ChainData }) => {
                        const pdbId: string = result.source.pdb_id;
                        result.data[pdbId].molecules.forEach((molecule) => {
                            molecule.chains.forEach((chain) => {
                                const chainId: string = result.source.chain_id;
                                const uniprotStart: number = result.source.unp_start;
                                const uniprotEnd: number = result.source.unp_end;
                                const pdbStart: number = result.source.start;
                                const mappings: FragmentMapping[] = [];
                                let firstStart: number | undefined;
                                chain.observed.forEach((fragment: Observed) => {
                                    const useMapping: boolean =
                                        fragment.start.author_residue_number ==
                                        fragment.start.residue_number;
                                    const start: number = Math.max(
                                        fragment.start.residue_number + uniprotStart - pdbStart,
                                        uniprotStart
                                    );
                                    const end: number = Math.min(
                                        fragment.end.residue_number + uniprotStart - pdbStart,
                                        uniprotEnd
                                    );
                                    if (!firstStart) {
                                        firstStart = start;
                                    }
                                    if (start <= end) {
                                        let pdbStartMapped: number = start;
                                        if (!useMapping) {
                                            pdbStartMapped = fragment.start.author_residue_number;
                                        } else if (uniprotStart != pdbStart) {
                                            pdbStartMapped = pdbStart + (start - firstStart);
                                        }
                                        const pdbEndMapped: number = pdbStartMapped + (end - start);
                                        mappings.push({
                                            pdbStart: pdbStartMapped,
                                            pdbEnd: pdbEndMapped,
                                            from: start,
                                            to: end
                                        });
                                    }
                                });

                                const structure: UserStructureData | undefined =
                                    result.source.structure;
                                if (structure?.uri && structure?.data) {
                                    console.warn(
                                        "Structure parameter provides information about both uri and data. Uri will be used."
                                    );
                                } else if (structure && !structure?.uri && !structure?.data) {
                                    throw Error(
                                        "Structure parameter requires information about uri or data."
                                    );
                                }
                                const output: Output = {
                                    pdbId: pdbId,
                                    chain: chainId,
                                    mapping: {
                                        uniprotStart: uniprotStart,
                                        uniprotEnd: uniprotEnd,
                                        fragmentMappings: mappings
                                    },
                                    url: structure
                                        ? structure.uri ?? undefined
                                        : `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId}_updated.cif`,
                                    data:
                                        structure && !structure?.uri ? structure?.data : undefined,
                                    format: structure ? structure.format : "mmcif"
                                };

                                const observedFragments = chain.observed
                                    .map((fragment) => {
                                        const start: number = Math.max(
                                            fragment.start.residue_number + uniprotStart - pdbStart,
                                            uniprotStart
                                        );
                                        const end: number = Math.min(
                                            fragment.end.residue_number + uniprotStart - pdbStart,
                                            uniprotEnd
                                        );
                                        return new Fragment(
                                            this.id++,
                                            start,
                                            end,
                                            this.observedColor,
                                            this.observedColor,
                                            undefined,
                                            this.createTooltip(
                                                uniprotId,
                                                pdbId,
                                                chainId,
                                                start,
                                                end,
                                                result.source.experimental_method
                                            ),
                                            output
                                        );
                                    })
                                    .filter(
                                        (fragment) =>
                                            fragment.end >= uniprotStart &&
                                            fragment.start <= uniprotEnd
                                    );
                                const unobservedFragments: Fragment[] = this.getUnobservedFragments(
                                    observedFragments,
                                    uniprotStart,
                                    uniprotEnd,
                                    pdbId,
                                    chainId,
                                    uniprotId,
                                    result.source.experimental_method
                                );
                                const fragments: Fragment[] =
                                    observedFragments.concat(unobservedFragments);
                                const accessions: Accession[] = [
                                    new Accession(null, [new Location(fragments)], "PDB")
                                ];
                                trackRows.set(
                                    pdbId + " " + chainId.toLowerCase(),
                                    new TrackRow(
                                        accessions,
                                        pdbId + " " + chainId.toLowerCase(),
                                        output
                                    )
                                );
                            });
                        });
                    });
            });
            if (trackRows.size > 0) {
                return [
                    new BasicTrackRenderer(trackRows, this.categoryLabel, false, this.categoryName)
                ];
            }
        }
        return null;
    }

    private urlGenerator(pdbId: string, chainId: string): string {
        return `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`;
    }

    private getUnobservedFragments(
        observedFragments: Fragment[],
        start: number,
        end: number,
        pdbId: string,
        chainId: string,
        uniprotId: string,
        experimentalMethod?: string
    ): Fragment[] {
        const observedFragmentSorted: Fragment[] = observedFragments.sort(
            (a, b) => a.start - b.start
        );
        const unobservedFragments: Fragment[] = [];

        if (observedFragmentSorted.length == 0) {
            return [];
        }
        if (start < observedFragmentSorted[0].start) {
            const fragmentEnd: number = observedFragmentSorted[0].start - 1;
            unobservedFragments.push(
                new Fragment(
                    this.id++,
                    start,
                    fragmentEnd,
                    this.unobservedColor,
                    this.unobservedColor,
                    undefined,
                    this.createTooltip(
                        uniprotId,
                        pdbId,
                        chainId,
                        start,
                        fragmentEnd,
                        experimentalMethod
                    )
                )
            );
        }

        for (let i = 1; i < observedFragmentSorted.length; i++) {
            const fragmnetStart: number = observedFragmentSorted[i - 1].end + 1;
            const fragmentEnd: number = observedFragmentSorted[i].start - 1;
            unobservedFragments.push(
                new Fragment(
                    this.id,
                    fragmnetStart,
                    fragmentEnd,
                    this.unobservedColor,
                    this.unobservedColor,
                    undefined,
                    this.createTooltip(
                        uniprotId,
                        pdbId,
                        chainId,
                        fragmnetStart,
                        fragmentEnd,
                        experimentalMethod
                    )
                )
            );
        }

        if (end - 1 >= observedFragmentSorted[observedFragmentSorted.length - 1].end) {
            const fragmentStart: number =
                observedFragmentSorted[observedFragmentSorted.length - 1].end + 1;
            unobservedFragments.push(
                new Fragment(
                    this.id,
                    fragmentStart,
                    end,
                    this.unobservedColor,
                    this.unobservedColor,
                    undefined,
                    this.createTooltip(
                        uniprotId,
                        pdbId,
                        chainId,
                        fragmentStart,
                        end,
                        experimentalMethod
                    )
                )
            );
        }
        return unobservedFragments;
    }

    private createTooltip(
        uniprotId: string,
        pdbId: string,
        chainId: string,
        start: string | number,
        end: string | number,
        experimentalMethod?: string
    ): TooltipContent {
        const tooltipContent = new TooltipContent(
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
                createBlast(uniprotId, start, end, `${pdbId}" "${chainId.toLowerCase()}`)
            );
        return tooltipContent;
    }
}

export type PDBParserItem = {
    readonly end: number;
    readonly chain_id: string;
    readonly pdb_id: string;
    readonly start: number;
    readonly unp_end: number;
    readonly coverage: number | ChainData;
    readonly unp_start: number;
    readonly resolution?: number;
    readonly experimental_method?: string;
    readonly tax_id: number;
    readonly structure?: UserStructureData;
};
type UserStructureData = {
    format: "mmcif" | "pdb";
    data?: string;
    uri?: string;
};

type PDBParserData = Record<string, readonly PDBParserItem[]>;

type PDBParserItemAgg = PDBParserItem & {
    readonly tax_ids: number[];
};

type ChainData = Record<
    string,
    {
        readonly molecules: readonly {
            readonly entity_id: number;
            readonly chains: {
                readonly observed: Observed[];
                readonly chain_id: string;
                readonly struct_asym_id: string;
            }[];
        }[];
    }
>;

type Observed = {
    readonly start: {
        readonly author_residue_number: number;
        readonly author_insertion_code?: string;
        readonly struct_asym_id: string;
        readonly residue_number: number;
    };
    readonly end: {
        readonly author_residue_number: number;
        readonly author_insertion_code?: string;
        readonly struct_asym_id: string;
        readonly residue_number: number;
    };
};
