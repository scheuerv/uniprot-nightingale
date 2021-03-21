import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import { createEmitter } from 'ts-typed-events';

export default class PdbParser implements TrackParser<PDBOutput> {

    private emitDataLoaded = createEmitter<PDBOutput[]>();
    public readonly dataLoaded = this.emitDataLoaded.event;
    private readonly categoryName = "Experimental structures";
    private readonly observedColor = '#2e86c1';
    private readonly unobservedColor = '#bdbfc1';
    async parse(uniprotId: string, data: any): Promise<BasicTrackRenderer | null> {
        const trackRows: TrackRow[] = [];
        if (data[uniprotId]) {
            const hash: Record<string, typeof data> = [];
            const dataDeduplicated: typeof data = [];
            for (const record of data[uniprotId]) {
                if (!hash[record.pdb_id + "_" + record.chain_id]) {
                    hash[record.pdb_id + "_" + record.chain_id] = record;
                    record.tax_id = [record.tax_id];
                    dataDeduplicated.push(record);
                } else {
                    hash[record.pdb_id + "_" + record.chain_id].tax_id.push(record.tax_id)
                }
            }
            await Promise.all(
                dataDeduplicated.map(
                    (record: { chain_id: string; pdb_id: string }) => {
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
                    const output: PDBOutput[] = []
                    results.forEach(resultJson => {
                        const result = resultJson as any;

                        result.data[result.source.pdb_id].molecules.forEach((molecule: { entity_id: string, chains: [{ observed: { start: { residue_number: string; }; end: { residue_number: string; }; }[]; }]; }) => {
                            molecule.chains.forEach(chain => {
                                output.push({ pdbId: result.source.pdb_id, chain: result.source.chain_id });
                                const uniprotStart = parseInt(result.source.unp_start);
                                const uniprotEnd = parseInt(result.source.unp_end);
                                const pdbStart = parseInt(result.source.start);
                                const observedFragments = chain.observed.map((element: { start: { residue_number: string; }; end: { residue_number: string; }; }) => {
                                    const start: number = Math.max(parseInt(element.start.residue_number) + uniprotStart - pdbStart, uniprotStart);
                                    const end: number = Math.min(parseInt(element.end.residue_number) + uniprotStart - pdbStart, uniprotEnd);
                                    return new Fragment(start, end, this.observedColor, this.observedColor);
                                }).filter(fragment => fragment.end >= uniprotStart && fragment.start <= uniprotEnd);
                                const unobservedFragments = this.getUnobservedFragments(observedFragments, uniprotStart, uniprotEnd);
                                const fragments = observedFragments.concat(unobservedFragments);
                                const accessions = [new Accession(null, [new Location(fragments)], 'PDB')];
                                trackRows.push(new TrackRow(accessions, result.source.pdb_id + ' ' + result.source.chain_id.toLowerCase()));
                            });

                        });
                    });
                    return output;
                }).then(
                    output => this.emitDataLoaded.emit(output)
                )
            return new BasicTrackRenderer(trackRows, this.categoryName);
        }
        else {
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
type PDBOutput = { pdbId: string, chain: string };

