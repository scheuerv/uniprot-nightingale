/**
 * @jest-environment jest-environment-jsdom
 */
import BasicCategoryRenderer from "../src/renderers/basic-category-renderer";
import SMRParser from "../src/parsers/SMR-parser";
import { Accession, Fragment, Location, Output, TrackRow } from "../src/types/accession";
import { ChainMapping } from "../src/types/mapping";
import { SMRData } from "../src/types/SMR-parser";
describe("SMRParser tests", function () {
    let instance: SMRParser;
    const chainMapping14_96: ChainMapping = {
        structAsymId: "I",
        fragmentMappings: [
            {
                structureStart: 14,
                structureEnd: 96,
                sequenceStart: 14,
                sequenceEnd: 96
            }
        ]
    };

    const chainMapping20_50: ChainMapping = {
        structAsymId: "I",
        fragmentMappings: [
            {
                structureStart: 20,
                structureEnd: 50,
                sequenceEnd: 50,
                sequenceStart: 20
            }
        ]
    };

    const chainMapping80_100: ChainMapping = {
        structAsymId: "I",
        fragmentMappings: [
            {
                structureStart: 80,
                structureEnd: 100,
                sequenceEnd: 100,
                sequenceStart: 80
            }
        ]
    };

    const chainMapping100_120: ChainMapping = {
        structAsymId: "I",
        fragmentMappings: [
            {
                structureStart: 100,
                structureEnd: 120,
                sequenceStart: 100,
                sequenceEnd: 120
            }
        ]
    };

    const chainMapping1_1: ChainMapping = {
        structAsymId: "I",
        fragmentMappings: [
            {
                structureStart: 1,
                structureEnd: 1,
                sequenceStart: 1,
                sequenceEnd: 1
            }
        ]
    };
    it("no structures", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = { result: { structures: [] } };
        await expect(instance.parse("P12345", loadedData)).resolves.toEqual(null);
    });

    it("one segment, one chain, one structure", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 96
                    }
                ]
            }
        };
        const output: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("two segments non overlapping, one chain, one structure", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    },
                                    {
                                        uniprot: {
                                            from: 100,
                                            to: 120
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 120
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping100_120
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output1
                                        ),
                                        new Fragment(
                                            2,
                                            100,
                                            120,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[100-120]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 100-120"
                                            },
                                            output2
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("two segments overlapping, one chain, one structure", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    },
                                    {
                                        uniprot: {
                                            from: 20,
                                            to: 50
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 96
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping20_50
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output1
                                        )
                                    ])
                                ]),
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            2,
                                            20,
                                            50,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[20-50]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 20-50"
                                            },
                                            output2
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("two chains overlapping, one structure", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            },
                            {
                                id: "J",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 80,
                                            to: 100
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-100&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 100
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-100&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "J",
            format: "pdb",
            mapping: {
                J: { ...chainMapping80_100, structAsymId: "J" }
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-100&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output1
                                        )
                                    ])
                                ]),
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            2,
                                            80,
                                            100,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[80-100]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_J 80-100"
                                            },
                                            output2
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("two chains non overlapping, one structure", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            },
                            {
                                id: "J",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 100,
                                            to: 120
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 120
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "J",
            format: "pdb",
            mapping: { J: { ...chainMapping100_120, structAsymId: "J" } },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output1
                                        ),
                                        new Fragment(
                                            2,
                                            100,
                                            120,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[100-120]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_J 100-120"
                                            },
                                            output2
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("two structures, same template", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 96
                    },
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 80,
                                            to: 100
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-100&template=6ssx.1.I&provider=swissmodel",
                        from: 80,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 100
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping80_100
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-100&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output1
                                        )
                                    ])
                                ]),
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            2,
                                            80,
                                            100,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[80-100]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 80-100"
                                            },
                                            output2
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        return expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("two structures, different template", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 96
                    },
                    {
                        chains: [
                            {
                                id: "J",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 80,
                                            to: 100
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-100&template=6ssx.1.J&provider=swissmodel",
                        from: 80,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.J",
                        to: 100
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: {
                I: chainMapping14_96
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "J",
            format: "pdb",
            mapping: {
                J: { ...chainMapping80_100, structAsymId: "J" }
            },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-100&template=6ssx.1.J&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            14,
                                            96,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[14-96]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 14-96"
                                            },
                                            output1
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ],
                    [
                        "6ssx.1 j",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            2,
                                            80,
                                            100,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[80-100]&key=6ssx.1 j" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_J 80-100"
                                            },
                                            output2
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 j",
                            output2
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("smrIds config", async () => {
        instance = new SMRParser(["6ssx.1"]);
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 1,
                                            to: 1
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=1-1&template=6ssx.1.I&provider=swissmodel",
                        from: 1,
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 1
                    },
                    {
                        chains: [
                            {
                                id: "J",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 80,
                                            to: 100
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-100&template=6ssx.1.J&provider=swissmodel",
                        from: 80,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "7hhg.1.J",
                        to: 100
                    }
                ]
            }
        };

        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: { I: chainMapping1_1 },
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=1-1&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
                new Map([
                    [
                        "6ssx.1 i",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            1,
                                            1,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[1-1]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 1"
                                            },
                                            output1
                                        )
                                    ])
                                ])
                            ],
                            "6ssx.1 i",
                            output1
                        )
                    ]
                ]),
                "Predicted structures",
                false,
                "PREDICTED_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("no template", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "",
                        to: 96
                    }
                ]
            }
        };

        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(null);
    });

    it("wrong template format", async () => {
        instance = new SMRParser();
        const loadedData: SMRData = {
            result: {
                structures: [
                    {
                        chains: [
                            {
                                id: "I",
                                segments: [
                                    {
                                        uniprot: {
                                            from: 14,
                                            to: 96
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "fgh",
                        to: 96
                    }
                ]
            }
        };

        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(null);
    });
});
