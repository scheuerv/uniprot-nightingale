import { Accession, Fragment, Location } from "./basic-track-renderer";

export default class FragmentAligner {
    private fragments: Fragment[] = [];
    constructor(private type: string) {

    }
    public getAccessions() {
        const accessions: Accession[] = [];
        this.fragments = this.fragments.sort((a, b) => a.start - b.start)
        this.fragments.forEach(fragment => {
            let fragmentAdded = false;
            for (const accession of accessions) {
                const fragments = accession.locations[0].fragments;
                if (fragments[fragments.length - 1].end < fragment.start) {
                    fragments.push(fragment)
                    fragmentAdded = true;
                    break;
                }
            }
            if (!fragmentAdded) {
                accessions.push(new Accession(null, [new Location([fragment])], this.type))
            }
        })

        return accessions;
    }
    public addFragment(fragment: Fragment) {
        this.fragments.push(fragment);
    }
    public getType()
    {
        return this.type;
    }
}