import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import { createEmitter } from 'ts-typed-events';

export default class PdbParser implements TrackParser<PDBOutput> {

    private readonly emitOnDataLoaded = createEmitter<PDBOutput[]>();
    public readonly onDataLoaded = this.emitOnDataLoaded.event;
    private readonly emitOnLabelClick = createEmitter<PDBOutput>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    private readonly categoryName = "Experimental structures";
    private readonly observedColor = '#2e86c1';
    private readonly unobservedColor = '#bdbfc1';
    async parse(uniprotId: string, data: PDBParserData): Promise<BasicTrackRenderer<PDBOutput> | null> {
        const trackRows: TrackRow<PDBOutput>[] = [];
        const outputs: PDBOutput[] = []
        if (data[uniprotId]) {
            const hash: Record<string, PDBParserItemAgg> = {};
            const dataDeduplicated: PDBParserItemAgg[] = [];
            for (const record of data[uniprotId]) {
                if (!hash[record.pdb_id + "_" + record.chain_id]) {
                    const recordAgg = {
                        ...record,
                        tax_ids: [record.tax_id]
                    };
                    hash[record.pdb_id + "_" + record.chain_id] = recordAgg;
                    dataDeduplicated.push(recordAgg);
                } else {
                    hash[record.pdb_id + "_" + record.chain_id].tax_ids.push(record.tax_id)
                }
            }
            await Promise.all(
                dataDeduplicated.map(
                    (record) => {
                        const chain_id = record.chain_id;
                        const pdb_id = record.pdb_id;

                        return fetch(this.urlGenerator(pdb_id, chain_id))
                            .then(
                                data => data.json().then(data => {
                                    return { source: record, data: data };
                                }), err => {
                                    console.log(`API unavailable!`, err);
                                    return Promise.reject();
                                }
                            )
                    })
            ).then(
                results => {
                    results.forEach((resultJson: { source: PDBParserItemAgg, data: ChainData }) => {
                        const result = resultJson;

                        result.data[result.source.pdb_id].molecules.forEach((molecule) => {
                            molecule.chains.forEach(chain => {
                                const output: PDBOutput = { pdbId: result.source.pdb_id, chain: result.source.chain_id };
                                outputs.push(output);
                                const uniprotStart = result.source.unp_start;
                                const uniprotEnd = result.source.unp_end;
                                const pdbStart = result.source.start;
                                const observedFragments = chain.observed.map(element => {
                                    const start: number = Math.max(element.start.residue_number + uniprotStart - pdbStart, uniprotStart);
                                    const end: number = Math.min(element.end.residue_number + uniprotStart - pdbStart, uniprotEnd);
                                    return new Fragment(start, end, this.observedColor, this.observedColor);
                                }).filter(fragment => fragment.end >= uniprotStart && fragment.start <= uniprotEnd);
                                const unobservedFragments = this.getUnobservedFragments(observedFragments, uniprotStart, uniprotEnd);
                                const fragments = observedFragments.concat(unobservedFragments);
                                const accessions = [new Accession(null, [new Location(fragments)], 'PDB')];
                                trackRows.push(new TrackRow(accessions, result.source.pdb_id + ' ' + result.source.chain_id.toLowerCase(), output));
                            });

                        });
                    });
                    return outputs;
                });
            this.emitOnDataLoaded.emit(outputs)
            return new BasicTrackRenderer(trackRows, this.categoryName, this.emitOnLabelClick,false);
        }
        else {
            this.emitOnDataLoaded.emit(outputs)
            return null;
        }
    }
    private urlGenerator(pdbId: string, chainId: string): string {
        return `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`;
    }
    private getUnobservedFragments(observedFragments: Fragment[], start: number, end: number): Fragment[] {
        const observedFragmentSorted = observedFragments.sort((a, b) => a.start - b.start);
        const unobservedFragments: Fragment[] = [];
        if (observedFragmentSorted.length == 0) {
            return [];
        }
        if (start < observedFragmentSorted[0].start) {
            unobservedFragments.push(new Fragment(start, observedFragmentSorted[0].start - 1, this.unobservedColor, this.unobservedColor));
        }

        for (let i = 1; i < observedFragmentSorted.length; i++) {
            unobservedFragments.push(new Fragment(observedFragmentSorted[i - 1].end + 1, observedFragmentSorted[i].start - 1, this.unobservedColor, this.unobservedColor))
        }

        if (end - 1 >= observedFragmentSorted[observedFragmentSorted.length - 1].end) {
            unobservedFragments.push(new Fragment(observedFragmentSorted[observedFragmentSorted.length - 1].end + 1, end, this.unobservedColor, this.unobservedColor));
        }
        return unobservedFragments;

    }
}
type PDBOutput = { readonly pdbId: string, readonly chain: string };

type PDBParserData = Record<string, readonly PDBParserItem[]>;

type PDBParserItem = {
    readonly end: number,
    readonly chain_id: string,
    readonly pdb_id: string,
    readonly start: number,
    readonly unp_end: number,
    readonly coverage: number,
    readonly unp_start: number,
    readonly resolution?: number,
    readonly experimental_method?: string,
    readonly tax_id: number
};
type PDBParserItemAgg = {
    readonly end: number,
    readonly chain_id: string,
    readonly pdb_id: string,
    readonly start: number,
    readonly unp_end: number,
    readonly coverage: number,
    readonly unp_start: number,
    readonly resolution?: number,
    readonly experimental_method?: string,
    readonly tax_ids: number[]
};

type ChainData = Record<string, {
    readonly molecules:
    readonly {
        readonly entity_id: number,
        readonly chains: {
            readonly observed: Observed[],
            readonly chain_id: string,
            readonly struct_asym_id: string
        }[]
    }[]
}>;

type Observed = {
    readonly start: {
        readonly author_residue_number: number,
        readonly author_insertion_code?: any,
        readonly struct_asym_id: string,
        readonly residue_number: number
    },
    readonly end: {
        readonly author_residue_number: number,
        readonly author_insertion_code?: any,
        readonly struct_asym_id: string,
        readonly residue_number: number
    }
}