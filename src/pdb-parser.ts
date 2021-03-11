import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';

export default class PdbParser implements TrackParser {
    categoryName = "Experimental structures";
    async parse(uniprotId: string, data: any): Promise<BasicTrackRenderer | null> {
        const trackRows: TrackRow[] = [];
        if (data[uniprotId]) {
            await Promise.all(
                data[uniprotId].map(
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
                    results.forEach(resultJson => {
                        let result = resultJson as any;
                        result.data[result.source.pdb_id].molecules.forEach((molecule: { entity_id: Number, chains: [{ observed: { start: { residue_number: number; }; end: { residue_number: number; }; }[]; }]; }) => {
                            molecule.chains.forEach(chain => {
                                const observedFragments = chain.observed.map((element: { start: { residue_number: number; }; end: { residue_number: number; }; }) => {
                                    const start: number = element.start.residue_number;
                                    const end: number = element.end.residue_number;
                                    return new Fragment(start, end, '#2e86c1', '#2e86c1');
                                });
                                const unobservedFragments = this.getUnobservedFragments(observedFragments, result.source.start, result.source.end);
                                const fragments = observedFragments.concat(unobservedFragments);
                                let accessions = [new Accession(null, [new Location(fragments, result.source.unp_start, result.source.unp_end)], 'PDB')];
                                trackRows.push(new TrackRow(accessions, result.source.pdb_id + ' ' + result.source.chain_id.toLowerCase()));
                            });
                        });
                    });
                });
            return new BasicTrackRenderer(trackRows, this.categoryName);
        } else {
            return null;
        }
    }
    private urlGenerator(pdbId: string, chainId: string): string {
        return `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`;
    }
    private getUnobservedFragments(observedFragments: Fragment[], start: number, end: number): Fragment[] {
        const ofs = observedFragments.sort((a, b) => a.start - b.start);
        let unobservedFragments: Fragment[] = [];
        if (ofs.length == 0) {
            return [];
        }
        if (start < ofs[0].start) {
            unobservedFragments.push(new Fragment(start, ofs[0].start - 1, '#bdbfc1', '#bdbfc1'));
        }

        for (let i = 1; i < ofs.length; i++) {
            unobservedFragments.push(new Fragment(ofs[i - 1].end + 1, ofs[i].start - 1, '#bdbfc1', '#bdbfc1'))
        }

        if (end - 1 >= ofs[ofs.length - 1].end) { //+1 because length
            unobservedFragments.push(new Fragment(ofs[ofs.length - 1].end + 1, end, '#bdbfc1', '#bdbfc1'));
        }
        return unobservedFragments;

    }
}

