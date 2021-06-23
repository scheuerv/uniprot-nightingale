import { fetchWithTimeout } from "../utils/utils";
import { PolymerCoverage, PDBParserItem, Molecule, ChainData } from "../parsers/pdb-parser";
import { FragmentMapping } from "../types/mapping";

export default class PdbLoader {
    constructor(private readonly pdbIds?: string[]) {}
    public async load(uniprotId: string): Promise<PDBParserItem[]> {
        return fetchWithTimeout(
            `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniprotId}`,
            {
                timeout: 8000
            }
        )
            .then(
                (data) => {
                    return data.json();
                },
                (err) => {
                    console.error(`Best structures API unavailable!`, err);
                    return Promise.reject(err);
                }
            )
            .then((data: PDBLoaderData) => {
                return this.prepareParserData(data, uniprotId);
            });
    }
    private async loadMapping(uniprotId: string) {
        return fetchWithTimeout(`https://www.ebi.ac.uk/pdbe/api/mappings/${uniprotId}`, {
            timeout: 8000
        })
            .then(
                (mappings) =>
                    mappings.json().then((data) => {
                        return data as PDBMappingData;
                    }),
                (err) => {
                    console.error(`Mapping API unavailable!`, err);
                    return Promise.reject(err);
                }
            )
            .then((mappings) => {
                const pdbMappings: Map<string, Map<string, FragmentMapping[]>> = new Map();
                for (const pdbId in mappings[uniprotId]["PDB"]) {
                    if (!this.pdbIds || this.pdbIds.includes(pdbId)) {
                        pdbMappings.set(pdbId, new Map());
                        const pdbIdMapping = mappings[uniprotId]["PDB"][pdbId];
                        for (const pdbChainMapping of pdbIdMapping) {
                            if (!pdbMappings.get(pdbId)?.has(pdbChainMapping.chain_id)) {
                                pdbMappings.get(pdbId)?.set(pdbChainMapping.chain_id, []);
                            }
                            pdbMappings
                                .get(pdbId)
                                ?.get(pdbChainMapping.chain_id)
                                ?.push({
                                    entity_id: pdbChainMapping.entity_id,
                                    unp_end: pdbChainMapping.unp_end,
                                    start: { residue_number: pdbChainMapping.start.residue_number },
                                    end: { residue_number: pdbChainMapping.end.residue_number },
                                    unp_start: pdbChainMapping.unp_start
                                });
                        }
                    }
                }
                return pdbMappings;
            });
    }
    private async prepareParserData(
        data: PDBLoaderData,
        uniprotId: string
    ): Promise<PDBParserItem[]> {
        const hash: Record<string, Record<string, PDBLoaderItemAgg>> = {};
        const dataDeduplicated: Record<string, PDBLoaderItemAgg[]> = {};
        for (const record of data[uniprotId]) {
            if (!this.pdbIds || this.pdbIds.includes(record.pdb_id)) {
                if (!hash[record.pdb_id]) {
                    hash[record.pdb_id] = {};
                    dataDeduplicated[record.pdb_id] = [];
                }
                if (!hash[record.pdb_id][record.chain_id]) {
                    const recordAgg: PDBLoaderItemAgg = {
                        ...record,
                        tax_ids: record.tax_id ? [record.tax_id] : []
                    };
                    hash[record.pdb_id][record.chain_id] = recordAgg;
                    dataDeduplicated[record.pdb_id].push(recordAgg);
                } else if (record.tax_id) {
                    hash[record.pdb_id][record.chain_id].tax_ids.push(record.tax_id);
                }
            }
        }
        const results: Promise<{
            source: PDBLoaderItemAgg[];
            data: PolymerCoverage;
        }>[] = [];
        for (const pdbId in dataDeduplicated) {
            results.push(
                fetch(`https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}`).then(
                    (data) =>
                        data.json().then((data: PolymerCoverage) => {
                            return { source: dataDeduplicated[pdbId], data: data };
                        }),
                    (err) => {
                        console.error(`Polymer coverage API for ${pdbId} unavailable!`, err);
                        return Promise.reject(err);
                    }
                )
            );
        }

        const pdbParserItems: PDBParserItem[] = [];
        await Promise.allSettled(results).then(async (results) => {
            const filteredResults: { source: PDBLoaderItemAgg[]; data: PolymerCoverage }[] = results
                .map((promiseSettled) => {
                    if (promiseSettled.status == "fulfilled") {
                        return promiseSettled.value;
                    }
                    return null;
                })
                .filter((result) => result != null)
                .map((result) => result!);
            const pdbMappings: Map<string, Map<string, FragmentMapping[]>> = await this.loadMapping(
                uniprotId
            );
            for (const result of filteredResults) {
                const entityChain: Set<string> = new Set();
                for (const pdbId in result.data) {
                    pdbMappings.get(pdbId)?.forEach((mappings, chainId) => {
                        mappings.forEach((mapping) => {
                            entityChain.add(`${mapping.entity_id}_${chainId}`);
                        });
                    });
                }

                for (const pdbLoaderItemAgg of result.source) {
                    pdbParserItems.push({
                        ...pdbLoaderItemAgg,
                        polymer_coverage: this.transformPolymerCoverageData(
                            result.data,
                            pdbLoaderItemAgg.pdb_id,
                            entityChain,
                            pdbLoaderItemAgg.chain_id
                        ),
                        structure: {
                            format: "mmcif",
                            uri: `https://www.ebi.ac.uk/pdbe/static/entry/${pdbLoaderItemAgg.pdb_id}_updated.cif`
                        },
                        mappings:
                            pdbMappings
                                .get(pdbLoaderItemAgg.pdb_id)
                                ?.get(pdbLoaderItemAgg.chain_id) ?? []
                    });
                }
            }
        });
        return pdbParserItems;
    }
    private transformPolymerCoverageData(
        data: PolymerCoverage,
        pdbId: string,
        entityChain: Set<string>,
        chainId: string
    ): PolymerCoverage {
        const molecules: Molecule[] = [];
        data[pdbId].molecules.forEach((molecule) => {
            const chains: ChainData[] = [];
            molecule.chains.forEach((chain) => {
                if (
                    chainId == chain.chain_id &&
                    entityChain.has(`${molecule.entity_id}_${chain.chain_id}`)
                ) {
                    chains.push({
                        chain_id: chain.chain_id,
                        observed: chain.observed.map((observed) => {
                            return {
                                end: { residue_number: observed.end.residue_number },
                                start: { residue_number: observed.start.residue_number }
                            };
                        })
                    });
                }
            });
            molecules.push({ entity_id: molecule.entity_id, chains: chains });
        });
        const result: PolymerCoverage = {};
        result[pdbId] = {
            molecules: molecules
        };
        return result;
    }
}

type PDBMappingData = Record<string, Record<string, Record<string, PDBMappingItem[]>>>;

type PDBMappingItem = {
    entity_id: number;
    end: {
        residue_number: number;
    };
    start: {
        residue_number: number;
    };
    chain_id: string;
    unp_end: number;
    unp_start: number;
};

type PDBLoaderItemAgg = PDBLoaderItem & {
    readonly tax_ids: number[];
};

type PDBLoaderData = Record<string, readonly PDBLoaderItem[]>;

type PDBLoaderItem = {
    readonly end: number;
    readonly chain_id: string;
    readonly pdb_id: string;
    readonly start: number;
    readonly unp_end: number;
    readonly coverage?: number;
    readonly unp_start: number;
    readonly experimental_method?: string;
    readonly tax_id?: number;
};
