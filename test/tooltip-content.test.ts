/**
 * @jest-environment jest-environment-jsdom
 */
import { OtherSourceData, VariantWithSources } from "../src/types/variants";
import { createFeatureTooltip, createVariantTooltip } from "../src/manager/tooltip-content";
import {
    AminoAcid,
    ConsequenceType,
    PredAlgorithmNameType,
    PredictionValType,
    Source,
    SourceType
} from "protvista-variation-adapter/dist/es/variants";
import { Feature } from "../src/types/feature";
describe("TooltipContent tests", function () {
    describe("createFeatureTooltip", function () {
        it("basic case", async () => {
            const feature: Feature = {
                type: "CHAIN",
                category: "MOLECULE_PROCESSING",
                description: "Aspartate aminotransferase, mitochondrial",
                begin: "30",
                end: "430"
            };
            const variantTooltip = createFeatureTooltip(feature, "P12345", "AANFDSJFBVK");
            expect(variantTooltip.title).toEqual("CHAIN 30-430");
            expect(variantTooltip.content).toEqual(
                '<table><tr> <td>Description</td><td>Aspartate aminotransferase, mitochondrial</td></tr><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P12345[30-430]&key=Chain" target="_blank">BLAST</a></td></tr></table>'
            );
        });
    });
    describe("createVariantTooltip", function () {
        it("xrefs, predictions, LargeScaleStudy", async () => {
            const variant: VariantWithSources = {
                type: "VARIANT",
                alternativeSequence: AminoAcid.Y,
                begin: "5",
                end: "5",
                xrefs: [
                    {
                        name: "TOPMed",
                        id: "rs1446208112",
                        url: " https://www.ncbi.nlm.nih.gov/snp/rs1446208112#frequency_tab",
                        alternativeUrl:
                            "http://gnomad.broadinstitute.org/awesome?query=rs1446208112"
                    },
                    {
                        name: "gnomAD",
                        id: "rs1446208112",
                        url: " http://gnomad.broadinstitute.org/awesome?query=rs1446208112"
                    }
                ],
                consequenceType: ConsequenceType.Missense,
                wildType: AminoAcid.L,
                predictions: [
                    {
                        predictionValType: PredictionValType.Benign,
                        predictorType: "multi coding",
                        score: 0.001,
                        predAlgorithmNameType: PredAlgorithmNameType.PolyPhen,
                        sources: [Source.ENSEMBL]
                    },
                    {
                        predictionValType: PredictionValType.Tolerated,
                        predictorType: "multi coding",
                        score: 0.26,
                        predAlgorithmNameType: PredAlgorithmNameType.Sift,
                        sources: [Source.ENSEMBL]
                    }
                ],
                sourceType: SourceType.LargeScaleStudy,
                variant: AminoAcid.V,
                start: "5"
            };
            const variantTooltip = createVariantTooltip(variant, "P12345");
            expect(variantTooltip.title).toEqual("VARIANT 5");
            expect(variantTooltip.content).toEqual(
                '<table><tr> <td>Source</td><td>Large scale studies</td></tr><tr> <td>Variant</td><td>L > Y</td></tr></table><table><tr> <td>Large Scale Studies</td></tr><tr> <td>Consequence</td><td>missense</td></tr><tr> <td>PolyPhen</td><td>benign, score: 0.001</td></tr><tr> <td>SIFT</td><td>tolerated, score: 0.26</td></tr><tr> <td>Cross-references</td><td>rs1446208112 <span><a href=" https://www.ncbi.nlm.nih.gov/snp/rs1446208112#frequency_tab" target="_blank">TOPMed</a></span><span>|</span><span><a href=" http://gnomad.broadinstitute.org/awesome?query=rs1446208112" target="_blank">gnomAD</a></span></td></tr></table>'
            );
        });

        it("predictions, Mixed, evidences", async () => {
            const variant: VariantWithSources = {
                type: "VARIANT",
                alternativeSequence: AminoAcid.Y,
                begin: "5",
                end: "5",
                consequenceType: ConsequenceType.Missense,
                wildType: AminoAcid.L,
                predictions: [
                    {
                        predictionValType: PredictionValType.Benign,
                        predictorType: "multi coding",
                        score: 0.001,
                        predAlgorithmNameType: PredAlgorithmNameType.PolyPhen,
                        sources: [Source.ENSEMBL]
                    },
                    {
                        predictionValType: PredictionValType.Tolerated,
                        predictorType: "multi coding",
                        score: 0.26,
                        predAlgorithmNameType: PredAlgorithmNameType.Sift,
                        sources: [Source.ENSEMBL]
                    }
                ],
                sourceType: SourceType.Mixed,
                variant: AminoAcid.V,
                start: "5",
                evidences: [
                    {
                        code: "ECO:0000313",
                        source: {
                            name: "pubmed",
                            id: "22895193",
                            url: "https://www.ncbi.nlm.nih.gov/pubmed/22895193",
                            alternativeUrl: "https://europepmc.org/abstract/MED/22895193"
                        }
                    },
                    {
                        code: "ECO:0000303",
                        source: {
                            name: "cosmic_study",
                            id: "452",
                            url: "https://cancer.sanger.ac.uk/cosmic/study/overview?study_id=452"
                        }
                    }
                ]
            };
            const variantTooltip = createVariantTooltip(variant, "P12345");
            expect(variantTooltip.title).toEqual("VARIANT 5");
            expect(variantTooltip.content).toEqual(
                '<table><tr> <td>Source</td><td>UniProt and large scale studies</td></tr><tr> <td>Variant</td><td>L > Y</td></tr></table><table><tr> <td>Uniprot</td></tr><tr> <td>Evidence</td><td>0 Publication (Manual assertion based on opinion)</td></tr><tr> <td></td><td>cosmic_study <span><a href="https://cancer.sanger.ac.uk/cosmic/study/overview?study_id=452" target="_blank">452</a></span></td></tr></table><table><tr> <td>Large Scale Studies</td></tr><tr> <td>Consequence</td><td>missense</td></tr><tr> <td>PolyPhen</td><td>benign, score: 0.001</td></tr><tr> <td>SIFT</td><td>tolerated, score: 0.26</td></tr><tr> <td>Evidence</td><td>Imported (Automatic assertion inferred from database entries)</td></tr><tr> <td></td><td>pubmed <span><a href="https://www.ncbi.nlm.nih.gov/pubmed/22895193" target="_blank">22895193</a></span></td></tr></table>'
            );
        });
        it("uniprot", async () => {
            const variant: VariantWithSources = {
                type: "VARIANT",
                alternativeSequence: AminoAcid.Y,
                begin: "5",
                end: "5",
                consequenceType: ConsequenceType.Missense,
                wildType: AminoAcid.L,
                sourceType: SourceType.UniProt,
                variant: AminoAcid.V,
                start: "5"
            };
            const variantTooltip = createVariantTooltip(
                variant,
                "P12345",
                undefined,
                false,
                "custom"
            );
            expect(variantTooltip.title).toEqual("VARIANT 5");
            expect(variantTooltip.content).toEqual(
                "<table><tr> <td>Source</td><td>UniProt, custom source (custom)</td></tr><tr> <td>Variant</td><td>L > Y</td></tr></table><table><tr> <td>custom</td></tr><tr> <td>Consequence</td><td>missense</td></tr></table>"
            );
        });

        it("custom variant", async () => {
            const variant: VariantWithSources = {
                type: "VARIANT",
                alternativeSequence: AminoAcid.Y,
                begin: "5",
                end: "5",
                consequenceType: ConsequenceType.Missense,
                wildType: AminoAcid.L,
                variant: AminoAcid.V,
                start: "5",
                customSource: "Custom"
            };
            const variantTooltip = createVariantTooltip(
                variant,
                "P12345",
                undefined,
                false,
                "custom"
            );
            expect(variantTooltip.title).toEqual("VARIANT 5");
            expect(variantTooltip.content).toEqual(
                "<table><tr> <td>Source</td><td>Custom data (custom)</td></tr><tr> <td>Variant</td><td>L > Y</td></tr></table><table><tr> <td>custom</td></tr><tr> <td>Consequence</td><td>missense</td></tr></table>"
            );
        });

        it("overwrite predictions, other source data", async () => {
            const otherSourceData: OtherSourceData = {
                predictions: [
                    {
                        predictionValType: PredictionValType.Deleterious,
                        predictorType: "other",
                        score: 1,
                        predAlgorithmNameType: PredAlgorithmNameType.PolyPhen,
                        sources: [Source.ENSEMBL]
                    },
                    {
                        predictionValType: PredictionValType.PossiblyDamaging,
                        predictorType: "other",
                        score: 0.5,
                        predAlgorithmNameType: PredAlgorithmNameType.Sift,
                        sources: [Source.ENSEMBL]
                    }
                ]
            };
            const variant: VariantWithSources = {
                type: "VARIANT",
                alternativeSequence: AminoAcid.Y,
                begin: "5",
                end: "5",
                consequenceType: ConsequenceType.Missense,
                wildType: AminoAcid.L,
                predictions: [
                    {
                        predictionValType: PredictionValType.Benign,
                        predictorType: "multi coding",
                        score: 0.001,
                        predAlgorithmNameType: PredAlgorithmNameType.PolyPhen,
                        sources: [Source.ENSEMBL]
                    },
                    {
                        predictionValType: PredictionValType.Tolerated,
                        predictorType: "multi coding",
                        score: 0.26,
                        predAlgorithmNameType: PredAlgorithmNameType.Sift,
                        sources: [Source.ENSEMBL]
                    }
                ],
                sourceType: SourceType.LargeScaleStudy,
                variant: AminoAcid.V,
                start: "5",
                otherSources: { Other: otherSourceData }
            };
            const variantTooltip = createVariantTooltip(
                variant,
                "P12345",
                { Other: otherSourceData },
                true
            );
            expect(variantTooltip.title).toEqual("VARIANT 5");
            expect(variantTooltip.content).toEqual(
                "<table><tr> <td>Source</td><td>Large scale studies, custom source (Other)</td></tr><tr> <td>Variant</td><td>L > Y</td></tr></table><table><tr> <td>Large Scale Studies</td></tr><tr> <td>Consequence</td><td>missense</td></tr></table><table><tr> <td>Other</td></tr><tr> <td>PolyPhen</td><td>deleterious, score: 1</td></tr><tr> <td>SIFT</td><td>possibly damaging, score: 0.5</td></tr></table>"
            );
        });
    });
});
