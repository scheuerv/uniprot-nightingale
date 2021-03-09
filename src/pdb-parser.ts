import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from './basic-track-renderer';

export default class PdbParser implements TrackParser {
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
                                const fragments= chain.observed.map((element: { start: { residue_number: number; }; end: { residue_number: number; }; }) => {
                                    const start: number = element.start.residue_number;
                                    const end: number = element.end.residue_number;
                                    return new Fragment(start, end);
                                });
                                trackRows.push(new TrackRow([new Accession(result.source.pdb_id + ' ' + result.source.chain_id, '#2e86c1', [new Location(fragments, result.source.unp_start, result.source.unp_end)], 'PDB')]));
                            });
                        });
                    });
                });
            return new BasicTrackRenderer(trackRows);
        } else {
            return null;
        }
    }
    urlGenerator(pdbId: string, chainId: string): string {
        return `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`;
    }
}

