import { Fragment, Accession, Location } from "../../../types/accession";
/**
 * First it accumulates fragments using addFragment method. Then we can use
 *  alignFragments method to create rows of fragments using trivial approach
 *  that is trying to minimize number of rows (represented by Accession).
 *
 * It is typically used in the classes that implement Parser interface when
 * they are assembling rows of fragments.
 */
export default class FragmentAligner {
    private fragments: Fragment[] = [];

    public alignFragments(): Accession[] {
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
