/**
 * @jest-environment jest-environment-jsdom
 */
import { Accession, Fragment, Location } from "../src/types/accession";
import FragmentAligner from "../src/parsers/fragment-aligner";
describe("FragmentAligner tests", function () {
    let instance: FragmentAligner;

    beforeEach(() => {
        instance = new FragmentAligner();
    });

    it("no fragments", async () => {
        expect(instance.getAccessions()).toEqual([]);
    });

    it("one fragment", async () => {
        const fragment = new Fragment(1, 1, 10, "#000000");
        instance.addFragment(fragment);
        expect(instance.getAccessions()).toEqual([new Accession([new Location([fragment])])]);
    });

    it("two fragments, wrong order, no overlapping", async () => {
        const fragment1 = new Fragment(1, 10, 15, "#000000");
        const fragment2 = new Fragment(2, 2, 9, "#000000");
        instance.addFragment(fragment1);
        instance.addFragment(fragment2);
        expect(instance.getAccessions()).toEqual([
            new Accession([new Location([fragment2, fragment1])])
        ]);
    });

    it("three fragments, all overlapping", async () => {
        const fragment1 = new Fragment(1, 10, 20, "#000000");
        const fragment2 = new Fragment(2, 2, 10, "#000000");
        const fragment3 = new Fragment(3, 8, 12, "#000000");
        instance.addFragment(fragment1);
        instance.addFragment(fragment2);
        instance.addFragment(fragment3);
        expect(instance.getAccessions()).toEqual([
            new Accession([new Location([fragment2])]),
            new Accession([new Location([fragment3])]),
            new Accession([new Location([fragment1])])
        ]);
    });

    it("three fragments, two overlapping", async () => {
        const fragment1 = new Fragment(1, 10, 20, "#000000");
        const fragment2 = new Fragment(2, 2, 9, "#000000");
        const fragment3 = new Fragment(3, 8, 12, "#000000");
        instance.addFragment(fragment1);
        instance.addFragment(fragment2);
        instance.addFragment(fragment3);
        expect(instance.getAccessions()).toEqual([
            new Accession([new Location([fragment2, fragment1])]),
            new Accession([new Location([fragment3])])
        ]);
    });
});
