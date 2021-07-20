/**
 * @jest-environment jest-environment-jsdom
 */
import mockConsole from "jest-mock-console";
import VariationRenderer from "../src/manager/builder/renderers/variation-renderer";
import VariationParser from "../src/manager/builder/parsers/variation-parser";
import { AminoAcid, ConsequenceType, SourceType } from "protvista-variation-adapter/src/variants";
import { ErrorResponse } from "../src/types/error-response";
describe("VariationParser tests", function () {
    let instance: VariationParser;

    it("error message", async () => {
        instance = new VariationParser();
        const errorResponse: ErrorResponse = {
            requestedURL: "https://www.ebi.ac.uk/proteins/api/features/P378400",
            errorMessage:
                "Invalid accession parameter.The values's format should be a valid UniProtKB accession."
        };
        await expect(instance.parse("P378400", errorResponse)).resolves.toBe(null);
    });

    it("no features", async () => {
        instance = new VariationParser();
        await expect(
            instance.parse("P37840", {
                sequence: "",
                features: []
            })
        ).resolves.toBe(null);
    });

    it("basic case", async () => {
        instance = new VariationParser();
        const loadedData = {
            accession: "P37840",
            sequence:
                "MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA",
            features: [
                {
                    type: "VARIANT",
                    alternativeSequence: "Y",
                    begin: "2",
                    end: "2",
                    consequenceType: "missense",
                    wildType: "D",
                    sourceType: "large_scale_study"
                },
                {
                    type: "VARIANT",
                    begin: "7",
                    end: "7",
                    wildType: "G",
                    sourceType: "uniprot"
                }
            ]
        };
        const expectedResult: VariationRenderer[] = [
            new VariationRenderer(
                {
                    customSources: [],
                    sequence:
                        "MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA",
                    variants: [
                        {
                            alternativeSequence: AminoAcid.Y,
                            begin: "2",
                            color: "#808080",
                            consequenceType: ConsequenceType.Missense,
                            customSource: undefined,
                            end: "2",
                            otherSources: {},
                            sourceType: SourceType.LargeScaleStudy,
                            start: "2",
                            tooltipContent: {
                                content:
                                    "<table><tr> <td>Source</td><td>Large scale studies</td></tr><tr> <td>Variant</td><td>D > Y</td></tr></table><table><tr> <td>Large Scale Studies</td></tr><tr> <td>Consequence</td><td>missense</td></tr></table>",
                                title: "VARIANT 2"
                            },
                            type: "VARIANT",
                            variant: AminoAcid.Y,
                            wildType: AminoAcid.D
                        },
                        {
                            alternativeSequence: AminoAcid.Empty,
                            begin: "7",
                            color: "#FFCC00",
                            customSource: undefined,
                            end: "7",
                            otherSources: {},
                            sourceType: SourceType.UniProt,
                            start: "7",
                            tooltipContent: {
                                content:
                                    "<table><tr> <td>Source</td><td>UniProt</td></tr><tr> <td>Variant</td><td>G > *</td></tr></table>",
                                title: "VARIANT 7"
                            },
                            type: "VARIANT",
                            variant: AminoAcid.Empty,
                            wildType: AminoAcid.G
                        }
                    ]
                },
                "Variation",
                "VARIATION",
                "P37840",
                undefined
            )
        ];
        const restoreConsole = mockConsole();
        await expect(
            instance.parse("P37840", JSON.parse(JSON.stringify(loadedData)))
        ).resolves.toEqual(expectedResult);
        expect(console.warn).toHaveBeenCalledWith(
            "Variant alternative sequence changed to * as no alternative sequence provided by the API",
            { begin: "7", end: "7", sourceType: "uniprot", type: "VARIANT", wildType: "G" }
        );
        restoreConsole();
    });

    it("custom source", async () => {
        instance = new VariationParser(undefined, "Custom source");
        const loadedData = {
            accession: "P37840",
            sequence:
                "MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA",
            features: [
                {
                    type: "VARIANT",
                    alternativeSequence: "Y",
                    begin: "2",
                    end: "2",
                    consequenceType: "missense",
                    wildType: "D"
                }
            ]
        };
        const expectedResult: VariationRenderer[] = [
            new VariationRenderer(
                {
                    customSources: ["Custom source"],
                    sequence:
                        "MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA",
                    variants: [
                        {
                            alternativeSequence: AminoAcid.Y,
                            begin: "2",
                            color: "#FFCC00",
                            consequenceType: ConsequenceType.Missense,
                            customSource: "Custom source",
                            end: "2",
                            otherSources: {
                                "Custom source": {
                                    consequenceType: ConsequenceType.Missense,
                                    description: undefined,
                                    evidences: undefined,
                                    predictions: undefined,
                                    xrefs: undefined
                                }
                            },
                            start: "2",
                            tooltipContent: {
                                content:
                                    "<table><tr> <td>Source</td><td>Custom data (Custom source)</td></tr><tr> <td>Variant</td><td>D > Y</td></tr></table><table><tr> <td>Custom source</td></tr><tr> <td>Consequence</td><td>missense</td></tr></table>",
                                title: "VARIANT 2"
                            },
                            type: "VARIANT",
                            variant: AminoAcid.Y,
                            wildType: AminoAcid.D
                        }
                    ]
                },
                "Variation",
                "VARIATION",
                "P37840",
                undefined
            )
        ];
        await expect(
            instance.parse("P37840", JSON.parse(JSON.stringify(loadedData)))
        ).resolves.toEqual(expectedResult);
    });
});
