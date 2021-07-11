import { fetchWithTimeout } from "../utils/utils";
import Loader from "./loader";
import { ParserMapping } from "../types/parser-mapping";
import { PDBMappingData, PDBLoaderData, PDBLoaderItemAgg } from "../types/pdb-loader";
import { PolymerCoverage, Molecule, ChainData, PDBParserData } from "../types/pdb-parser";

export default class PdbLoader implements Loader<PDBParserData> {
    constructor(private readonly pdbIds?: string[]) {}
    public async load(uniprotId: string): Promise<PDBParserData> {
        return fetchWithTimeout(
            `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniprotId}`,
            {
                timeout: 8000
            }
        ).then(
            async (data) => {
                return this.prepareParserData(await data.json(), uniprotId);
            },
            (err) => {
                console.error(`Best structures API unavailable!`, err);
                return Promise.reject(err);
            }
        );
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
                const pdbMappings: Map<string, ParserMapping> = new Map();
                for (const pdbId in mappings[uniprotId]["PDB"]) {
                    if (!this.pdbIds || this.pdbIds.includes(pdbId)) {
                        pdbMappings.set(pdbId, {});
                        const pdbMapping = pdbMappings.get(pdbId)!;
                        const pdbIdMapping = mappings[uniprotId]["PDB"][pdbId];
                        for (const pdbChainMapping of pdbIdMapping) {
                            if (!pdbMapping[pdbChainMapping.chain_id]) {
                                pdbMapping[pdbChainMapping.chain_id] = {
                                    struct_asym_id: pdbChainMapping.struct_asym_id,
                                    fragment_mappings: []
                                };
                            }
                            pdbMapping[pdbChainMapping.chain_id].fragment_mappings.push({
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
    ): Promise<PDBParserData> {
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

        const pdbParserItems: PDBParserData = [];
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
            const pdbMappings: Map<string, ParserMapping> = await this.loadMapping(uniprotId);
            for (const result of filteredResults) {
                const entityChain: Set<string> = new Set();

                for (const pdbId in result.data) {
                    const pdbMapping = pdbMappings.get(pdbId);
                    if (pdbMapping) {
                        Object.entries(pdbMapping).forEach(([chainId, chainMapping]) => {
                            chainMapping.fragment_mappings.forEach((mapping) => {
                                entityChain.add(`${mapping.entity_id}_${chainId}`);
                            });
                        });
                    }
                }

                for (const pdbLoaderItemAgg of result.source) {
                    pdbParserItems.push({
                        pdb_id: pdbLoaderItemAgg.pdb_id,
                        chain_id: pdbLoaderItemAgg.chain_id,
                        unp_start: pdbLoaderItemAgg.unp_start,
                        unp_end: pdbLoaderItemAgg.unp_end,
                        end: pdbLoaderItemAgg.end,
                        start: pdbLoaderItemAgg.start,
                        coverage: pdbLoaderItemAgg.coverage,
                        experimental_method: pdbLoaderItemAgg.experimental_method,
                        tax_id: pdbLoaderItemAgg.tax_id,
                        tax_ids: pdbLoaderItemAgg.tax_ids,
                        polymer_coverage: this.transformPolymerCoverageData(
                            result.data,
                            pdbLoaderItemAgg.pdb_id,
                            entityChain,
                            pdbLoaderItemAgg.chain_id
                        ),
                        structure: {
                            format: "mmcif",
                            url: `https://www.ebi.ac.uk/pdbe/static/entry/${pdbLoaderItemAgg.pdb_id}_updated.cif`
                        },
                        mappings: pdbMappings.get(pdbLoaderItemAgg.pdb_id) ?? {}
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
