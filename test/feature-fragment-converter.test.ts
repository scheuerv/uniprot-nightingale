/**
 * @jest-environment jest-environment-jsdom
 */
import { Fragment } from "../src/types/accession";
import { FeatureFragmentConverter } from "../src/manager/builder/parsers/feature-fragment-converter";

describe("FeatureFragmentConverter tests", function () {
    let instance: FeatureFragmentConverter;

    it("basic case, color provided, no custom data", async () => {
        instance = new FeatureFragmentConverter();
        const fillColor = "#CC0022";
        const feature = {
            type: "REPEAT",
            category: "DOMAINS_AND_SITES",
            description: "3; approximate",
            begin: "42",
            end: "56",
            molecule: "",
            color: fillColor
        };
        const sequence =
            "MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA";
        const uniprotId = "P37840";
        const expectedFragment = new Fragment(1, 42, 56, "#A3001B", fillColor, "rectangle", {
            content:
                '<table><tr> <td>Description</td><td>3; approximate</td></tr><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[42-56]&key=Repeat" target="_blank">BLAST</a></td></tr></table>',
            title: "REPEAT 42-56"
        });
        expect(instance.convert(1, sequence, uniprotId, feature)).toEqual(expectedFragment);
    });

    it("basic case, custom data provided, no color", async () => {
        instance = new FeatureFragmentConverter("Custom data source");
        const feature = {
            type: "REPEAT",
            category: "DOMAINS_AND_SITES",
            description: "3; approximate",
            begin: "42",
            end: "56",
            molecule: ""
        };
        const sequence =
            "MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA";
        const uniprotId = "P37840";
        const expectedFragment = new Fragment(1, 42, 56, "#7A00CC", "#9900FF", "rectangle", {
            content:
                '<table><tr> <td>Source</td><td>Custom data source</td></tr><tr> <td>Description</td><td>3; approximate</td></tr><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[42-56]&key=Repeat" target="_blank">BLAST</a></td></tr></table>',
            title: "REPEAT 42-56"
        });
        expect(instance.convert(1, sequence, uniprotId, feature)).toEqual(expectedFragment);
    });
});
