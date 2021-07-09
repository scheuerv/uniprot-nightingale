/**
 * @jest-environment jest-environment-jsdom
 */
import BasicTrackRenderer from "../src/renderers/basic-track-renderer";
import FeatureParser from "../src/parsers/feature-parser";
import { Accession, Fragment, Location, TrackRow } from "../src/types/accession";
import { ProteinFeatureInfo } from "../src/types/feature-parser";
describe("FeatureParser tests", function () {
    const featuresData: ProteinFeatureInfo = {
        sequence:
            "MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTKTCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVGEFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFRGVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEEEADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPCRAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARDPVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQAKNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITALQAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYERMNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTETKTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTNIKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITLVMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN",
        features: [
            {
                type: "UNIQUE_MAXQ",
                category: "PROTEOMICS",
                description: "MaxQuant",
                begin: "18",
                end: "29",
                color: "#00B88A"
            },
            {
                type: "NON_UNIQUE_MAXQ",
                category: "PROTEOMICS",
                description: "MaxQuant",
                begin: "523",
                end: "530",
                color: "#FFCC33"
            },
            {
                type: "NON_UNIQUE_MAXQ",
                category: "PROTEOMICS",
                description: "MaxQuant",
                begin: "526",
                end: "535",
                color: "#FFCC33"
            },
            {
                type: "CATALYTIC_SITE",
                category: "DOMAINS_AND_SITES",
                description: "Inherited through a sequence alignment",
                begin: "147",
                end: "147"
            },
            {
                type: "CATALYTIC_SITE",
                category: "DOMAINS_AND_SITES",
                description: "Inherited through a sequence alignment",
                begin: "151",
                end: "151"
            },
            {
                type: "PROTEOMICS",
                begin: "13",
                end: "23",
                unique: false
            },
            {
                type: "PROTEOMICS",
                begin: "25",
                end: "36",
                unique: true
            },
            {
                type: "ANTIGEN",
                begin: "46",
                end: "139"
            }
        ]
    };
    let instance: FeatureParser;

    it("error message", async () => {
        instance = new FeatureParser();

        const errorResponse = {
            requestedURL: "https://www.ebi.ac.uk/proteins/api/features/P378400",
            errorMessage:
                "Invalid accession parameter.The values's format should be a valid UniProtKB accession."
        };
        await expect(instance.parse("P12345", errorResponse)).resolves.toEqual(null);
    });

    it("no features", async () => {
        instance = new FeatureParser();

        await expect(
            instance.parse("P12345", {
                sequence: "",
                features: []
            })
        ).resolves.toEqual(null);
    });

    it("Custom data source", async () => {
        instance = new FeatureParser([], "Custom data source");
        const oneFeatureData = {
            sequence:
                "MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTKTCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVGEFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFRGVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEEEADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPCRAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARDPVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQAKNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITALQAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYERMNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTETKTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTNIKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITLVMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN",
            features: [
                {
                    type: "CATALYTIC_SITE",
                    category: "DOMAINS_AND_SITES",
                    description: "Inherited through a sequence alignment",
                    begin: "147",
                    end: "147"
                }
            ]
        };
        const promise = instance.parse("P37840", oneFeatureData);

        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "CATALYTIC_SITE",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            147,
                                            147,
                                            "#000000",
                                            undefined,
                                            undefined,
                                            {
                                                content:
                                                    "<table><tr> <td>Source</td><td>Custom data source</td></tr><tr> <td>Description</td><td>Inherited through a sequence alignment</td></tr></table>",
                                                title: "CATALYTIC_SITE 147"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Catalytic site"
                        )
                    ]
                ]),
                "Domains & sites",
                true,
                "DOMAINS_AND_SITES"
            )
        ];
        await expect(promise).resolves.toEqual(expectedResult);
    });
    it("exclude PROTEOMICS", async () => {
        instance = new FeatureParser(["PROTEOMICS"]);

        const promise = instance.parse("P37840", featuresData);

        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "CATALYTIC_SITE",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            147,
                                            147,
                                            "#000000",
                                            undefined,
                                            undefined,
                                            {
                                                content:
                                                    "<table><tr> <td>Description</td><td>Inherited through a sequence alignment</td></tr></table>",
                                                title: "CATALYTIC_SITE 147"
                                            },
                                            undefined
                                        ),
                                        new Fragment(
                                            2,
                                            151,
                                            151,
                                            "#000000",
                                            undefined,
                                            undefined,
                                            {
                                                content:
                                                    "<table><tr> <td>Description</td><td>Inherited through a sequence alignment</td></tr></table>",
                                                title: "CATALYTIC_SITE 151"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Catalytic site"
                        )
                    ]
                ]),
                "Domains & sites",
                true,
                "DOMAINS_AND_SITES"
            ),
            new BasicTrackRenderer(
                new Map([
                    [
                        "ANTIGEN",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            3,
                                            46,
                                            139,
                                            "#7A527A",
                                            "#996699",
                                            "rectangle",
                                            {
                                                content:
                                                    '<table><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[46-139]&key=Antibody binding sequences" target="_blank">BLAST</a></td></tr></table>',
                                                title: "ANTIGEN 46-139"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Antibody binding sequences"
                        )
                    ]
                ]),
                "Antigenic sequences",
                true,
                "ANTIGEN"
            )
        ];
        await expect(promise).resolves.toEqual(expectedResult);
    });

    it("basic case", async () => {
        instance = new FeatureParser();

        const promise = instance.parse("P37840", featuresData);

        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "UNIQUE_MAXQ",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            18,
                                            29,
                                            "#00936E",
                                            "#00B88A",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>MaxQuant</td></tr><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[18-29]&key=Unique maxq" target="_blank">BLAST</a></td></tr></table>',
                                                title: "UNIQUE_MAXQ 18-29"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Unique maxq"
                        )
                    ],
                    [
                        "NON_UNIQUE_MAXQ",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            2,
                                            523,
                                            530,
                                            "#CCA329",
                                            "#FFCC33",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>MaxQuant</td></tr><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[523-530]&key=Non unique maxq" target="_blank">BLAST</a></td></tr></table>',
                                                title: "NON_UNIQUE_MAXQ 523-530"
                                            },
                                            undefined
                                        )
                                    ])
                                ]),
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            3,
                                            526,
                                            535,
                                            "#CCA329",
                                            "#FFCC33",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>MaxQuant</td></tr><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[526-535]&key=Non unique maxq" target="_blank">BLAST</a></td></tr></table>',
                                                title: "NON_UNIQUE_MAXQ 526-535"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Non unique maxq"
                        )
                    ],
                    [
                        "NON_UNIQUE",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            6,
                                            13,
                                            23,
                                            "#6B6BCA",
                                            "#8585fc",
                                            "rectangle",
                                            {
                                                content:
                                                    '<table><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[13-23]&key=Non-unique peptide" target="_blank">BLAST</a></td></tr></table>',
                                                title: "NON_UNIQUE 13-23"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Non-unique peptide"
                        )
                    ],
                    [
                        "UNIQUE",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            7,
                                            25,
                                            36,
                                            "#CA2629",
                                            "#fc3133",
                                            "rectangle",
                                            {
                                                content:
                                                    '<table><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[25-36]&key=Unique peptide" target="_blank">BLAST</a></td></tr></table>',
                                                title: "UNIQUE 25-36"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Unique peptide"
                        )
                    ]
                ]),
                "Proteomics",
                true,
                "PROTEOMICS"
            ),
            new BasicTrackRenderer(
                new Map([
                    [
                        "CATALYTIC_SITE",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            4,
                                            147,
                                            147,
                                            "#000000",
                                            undefined,
                                            undefined,
                                            {
                                                content:
                                                    "<table><tr> <td>Description</td><td>Inherited through a sequence alignment</td></tr></table>",
                                                title: "CATALYTIC_SITE 147"
                                            },
                                            undefined
                                        ),
                                        new Fragment(
                                            5,
                                            151,
                                            151,
                                            "#000000",
                                            undefined,
                                            undefined,
                                            {
                                                content:
                                                    "<table><tr> <td>Description</td><td>Inherited through a sequence alignment</td></tr></table>",
                                                title: "CATALYTIC_SITE 151"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Catalytic site"
                        )
                    ]
                ]),
                "Domains & sites",
                true,
                "DOMAINS_AND_SITES"
            ),
            new BasicTrackRenderer(
                new Map([
                    [
                        "ANTIGEN",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            8,
                                            46,
                                            139,
                                            "#7A527A",
                                            "#996699",
                                            "rectangle",
                                            {
                                                content:
                                                    '<table><tr> <td>Tools</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[46-139]&key=Antibody binding sequences" target="_blank">BLAST</a></td></tr></table>',
                                                title: "ANTIGEN 46-139"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "Antibody binding sequences"
                        )
                    ]
                ]),
                "Antigenic sequences",
                true,
                "ANTIGEN"
            )
        ];
        await expect(promise).resolves.toEqual(expectedResult);
    });
});
