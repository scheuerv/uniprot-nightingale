import BasicTrackRenderer from "../renderers/basic-track-renderer";
import TooltipContentBuilder, { createBlast } from "../tooltip-content";
import { fetchWithTimeout } from "../utils";
import TrackParser from "./track-parser";
import { Accession, Fragment, Location, Output, TrackRow } from "../types/accession";
import { TooltipContent } from "../types/tooltip-content";
import { FragmentMapping } from "../types/mapping";

export default class PdbParser implements TrackParser {
    private readonly observedColor = "#2e86c1";
    private readonly unobservedColor = "#bdbfc1";
    private id = 1;

    constructor(
        private readonly pdbIds?: string[],
        private readonly categoryLabel = "Experimental structures",
        public readonly categoryName = "EXPERIMENTAL_STRUCTURES"
    ) { }

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
                            tax_ids: record.tax_id ? [record.tax_id] : []
                        };
                        hash[record.pdb_id + "_" + record.chain_id] = recordAgg;
                        dataDeduplicated.push(recordAgg);
                    } else if (record.tax_id) {
                        hash[record.pdb_id + "_" + record.chain_id].tax_ids.push(record.tax_id);
                    }
                }
            }
            await Promise.allSettled(
                dataDeduplicated.map((record: PDBParserItemAgg) => {
                    const pdb_id: string = record.pdb_id;
                    if (record.structure) {
                        return Promise.resolve({
                            source: record,
                            data: record.coverage
                        });
                    } else {
                        return fetch(this.urlGenerator(pdb_id)).then(
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
            ).then(async (results) => {
                const filteredResults: { source: PDBParserItemAgg; data: ChainData }[] = results
                    .map((promiseSettled) => {
                        if (promiseSettled.status == "fulfilled") {
                            return promiseSettled.value;
                        }
                        return null;
                    })
                    .filter((result) => result != null)
                    .map((result) => result!);
                const pdbMappings: Map<string, Map<string, FragmentMapping[]>> = new Map();
                for (const result of filteredResults) {
                    const pdbId: string = result.source.pdb_id;
                    if (!pdbMappings.has(pdbId)) {
                        pdbMappings.set(pdbId, new Map());
                        await fetchWithTimeout(
                            `https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${pdbId}`,
                            {
                                timeout: 8000
                            }
                        )
                            .then(
                                (mappings) =>
                                    mappings.json().then((data) => {
                                        return data as PDBMappingData;
                                    }),
                                (err) => {
                                    console.log(`API unavailable!`, err);
                                    return Promise.reject();
                                }
                            )
                            .then((mappings) => {
                                for (const mapping of mappings[pdbId]["UniProt"][uniprotId]
                                    .mappings) {
                                    if (!pdbMappings.get(`${pdbId}`)?.has(`${mapping.chain_id}`)) {
                                        pdbMappings.get(`${pdbId}`)?.set(`${mapping.chain_id}`, []);
                                    }
                                    pdbMappings
                                        .get(`${pdbId}`)
                                        ?.get(`${mapping.chain_id}`)
                                        ?.push({
                                            unp_end: mapping.unp_end,
                                            start: { residue_number: mapping.start.residue_number },
                                            end: { residue_number: mapping.end.residue_number },
                                            unp_start:
                                                mapping.unp_start
                                        });
                                }
                            });
                    }
                }
                pdbMappings.forEach((mappings, k) => {
                    mappings.forEach((chainMapping, key) => {
                        mappings.set(key, chainMapping.sort((a, b) => {
                            return a.start.residue_number - b.start.residue_number;
                        }))
                    });
                });
                for (const result of filteredResults) {
                    const pdbId: string = result.source.pdb_id;
                    result.data[pdbId].molecules.forEach((molecule) => {
                        molecule.chains.forEach((chain) => {
                            const chainId: string = chain.chain_id;
                            if (chainId == result.source.chain_id) {
                                const uniprotStart: number = result.source.unp_start;
                                const uniprotEnd: number = result.source.unp_end;
                                const mapping = pdbMappings.get(`${pdbId}`)?.get(`${chainId}`);
                                if (mapping) {
                                    const output: Output = {
                                        pdbId: pdbId,
                                        chain: chainId,
                                        mapping: mapping,
                                        //structure
                                        url:
                                            //     ? structure.uri ?? undefined
                                            //     :
                                            `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId}_updated.cif`,
                                        data:
                                            //structure && !structure?.uri ? structure?.data :
                                            undefined,
                                        //structure ? structure.format :
                                        format: "mmcif"
                                    };
                                    const observedFragments: Fragment[] = [];
                                    chain.observed.forEach((fragment) => {
                                        const intervals = findUniprotIntervalsFromStructureResidues(
                                            fragment.start.residue_number,
                                            fragment.end.residue_number,
                                            mapping
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
                                                        result.source.experimental_method
                                                    ),
                                                    output
                                                )
                                            );
                                        });
                                    });
                                    // const structure: UserStructureData | undefined =
                                    //     result.source.structure;
                                    // if (structure?.uri && structure?.data) {
                                    //     console.warn(
                                    //         "Structure parameter provides information about both uri and data. Uri will be used."
                                    //     );
                                    // } else if (structure && !structure?.uri && !structure?.data) {
                                    //     throw Error(
                                    //         "Structure parameter requires information about uri or data."
                                    //     );
                                    // }
                                    const unobservedFragments: Fragment[] =
                                        this.getUnobservedFragments(
                                            observedFragments,
                                            uniprotStart,
                                            uniprotEnd,
                                            pdbId,
                                            chainId,
                                            uniprotId,
                                            mapping,
                                            result.source.experimental_method
                                        );
                                    const fragments: Fragment[] =
                                        observedFragments.concat(unobservedFragments);
                                    const accessions: Accession[] = [
                                        new Accession([new Location(fragments)])
                                    ];
                                    trackRows.set(
                                        pdbId + " " + chainId.toLowerCase(),
                                        new TrackRow(
                                            accessions,
                                            pdbId + " " + chainId.toLowerCase(),
                                            output
                                        )
                                    );
                                }
                            }
                        });
                    });
                }
            });
            if (trackRows.size > 0) {
                return [
                    new BasicTrackRenderer(trackRows, this.categoryLabel, false, this.categoryName)
                ];
            }
        }
        return null;
    }

    private urlGenerator(pdbId: string): string {
        return `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}`;
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

export type PDBParserItem = {
    readonly end: number;
    readonly chain_id: string;
    readonly pdb_id: string;
    readonly start: number;
    readonly unp_end: number;
    readonly coverage?: number | ChainData;
    readonly unp_start: number;
    readonly experimental_method?: string;
    readonly tax_id?: number;
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

type PDBMappingData = Record<string, Record<string, Record<string, PDBMappingItems>>>;

type PDBMappingItems = {
    mappings: PDBMappingItem[];
};

type PDBMappingItem = FragmentMapping & {
    chain_id: string;
};

type ChainData = Record<
    string,
    {
        readonly molecules: readonly {
            readonly entity_id: number;
            readonly chains: {
                readonly observed: Observed[];
                readonly chain_id: string;
            }[];
        }[];
    }
>;

type Observed = {
    readonly start: {
        readonly residue_number: number;
    };
    readonly end: {
        readonly residue_number: number;
    };
};

function findUniprotIntervalsFromStructureResidues(
    start: number,
    end: number,
    mappings: FragmentMapping[]
): Interval[] {
    const startInterval = findIntervalIdByResNumber(start, mappings);
    if (startInterval.outOfRange) {
        return [];
    }
    const endInterval = findIntervalIdByResNumber(end, mappings);
    if (startInterval.id > endInterval.id) {
        return [];
    }
    if (startInterval.id == endInterval.id && !startInterval.direct && !endInterval.direct) {
        return [];
    }

    const startId = startInterval.id;
    let startUniprot;
    if (startInterval.direct) {
        startUniprot =
            start -
            mappings[startInterval.id].start.residue_number +
            mappings[startInterval.id].unp_start;
    } else {
        startUniprot = mappings[startInterval.id].unp_start;
    }

    let endId;
    let endUniprot;
    if (endInterval.direct) {
        endId = endInterval.id;
        endUniprot =
            end -
            mappings[endInterval.id].start.residue_number +
            mappings[endInterval.id].unp_start;
    } else {
        endId = endInterval.id - 1;
        endUniprot = mappings[endInterval.id - 1].unp_end;
    }
    let lastStart = startUniprot;
    const intervals: Interval[] = [];
    for (let id = startId + 1; id < endId; ++id) {
        intervals.push({
            start: lastStart,
            end: mappings[id - 1].unp_end
        });
        lastStart = mappings[id].unp_start;
    }
    intervals.push({
        start: lastStart,
        end: endUniprot
    });
    return intervals;
}

function findUniprotIntervalsFromUniprotSequence(
    start: number,
    end: number,
    mappings: FragmentMapping[]
): Interval[] {
    const startInterval = findIntervalIdByUniprotNumber(start, mappings);
    if (startInterval.outOfRange) {
        return [];
    }
    const endInterval = findIntervalIdByUniprotNumber(end, mappings);
    if (startInterval.id > endInterval.id) {
        return [];
    }
    if (startInterval.id == endInterval.id && !startInterval.direct && !endInterval.direct) {
        return [];
    }

    const startId = startInterval.id;
    let startUniprot;
    if (startInterval.direct) {
        startUniprot = start;
    } else {
        startUniprot = mappings[startInterval.id].unp_start;
    }

    let endId;
    let endUniprot;
    if (endInterval.direct) {
        endId = endInterval.id;
        endUniprot = end;
    } else {
        endId = endInterval.id - 1;
        endUniprot = mappings[endInterval.id - 1].unp_end;
    }
    let lastStart = startUniprot;
    const intervals: Interval[] = [];
    for (let id = startId + 1; id < endId; ++id) {
        intervals.push({
            start: lastStart,
            end: mappings[id - 1].unp_end
        });
        lastStart = mappings[id].unp_start;
    }
    intervals.push({
        start: lastStart,
        end: endUniprot
    });
    return intervals;
}

function findIntervalIdByResNumber(resNumber: number, mappings: FragmentMapping[]): FoundInterval {
    for (let i = 0; i < mappings.length; ++i) {
        const mapping = mappings[i];
        if (
            (mapping.start.residue_number <= resNumber &&
                resNumber <= mapping.end.residue_number) ||
            mapping.start.residue_number > resNumber
        ) {
            return {
                id: i,
                direct: mapping.start.residue_number <= resNumber,
                outOfRange: false
            };
        }
    }
    return {
        id: mappings.length,
        direct: false,
        outOfRange: true
    };
}

function findIntervalIdByUniprotNumber(
    unpNumber: number,
    mappings: FragmentMapping[]
): FoundInterval {
    for (let i = 0; i < mappings.length; ++i) {
        const mapping = mappings[i];
        if (
            (mapping.unp_start <= unpNumber && unpNumber <= mapping.unp_end) ||
            mapping.unp_start > unpNumber
        ) {
            return {
                id: i,
                direct: mapping.unp_start <= unpNumber,
                outOfRange: false
            };
        }
    }
    return {
        id: mappings.length,
        direct: false,
        outOfRange: true
    };
}
type FoundInterval = {
    readonly id: number;
    readonly direct: boolean;
    readonly outOfRange: boolean;
};

type Interval = {
    readonly start: number;
    readonly end: number;
};
