import { Fragment, Accession, Location } from "../../../types/accession";

export default class FragmentAligner {
    private fragments: Fragment[] = [];

    public getAccessions(): Accession[] {
        const accessions: Accession[] = [];
        this.fragments = this.fragments.sort((a, b) => a.start - b.start);
        this.fragments.forEach((fragment) => {
            let fragmentAdded = false;
            for (const accession of accessions) {
                const fragments = accession.locations[0].fragments;
                if (fragments[fragments.length - 1].end < fragment.start) {
                    fragments.push(fragment);
                    fragmentAdded = true;
                    break;
                }
            }
            if (!fragmentAdded) {
                accessions.push(new Accession([new Location([fragment])]));
            }
        });
        return accessions;
    }

    public addFragment(fragment: Fragment): void {
        this.fragments.push(fragment);
    }
}
