/**
 * @jest-environment jest-environment-jsdom
 */
import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import BasicTrackRenderer from "../src/renderers/basic-track-renderer";
import SMRParser from "../src/parsers/SMR-parser";
import { Accession, Fragment, Location, Output, TrackRow } from "../src/types/accession";
use(chaiAsPromised);
describe("SMRParser tests", function () {
    let instance: SMRParser;

    it("no structures", async () => {
        instance = new SMRParser();
        const loadedData = { result: { structures: [] } };
        return expect(instance.parse("P12345", loadedData)).to.eventually.equal(null);
    });

    it("one segment, one chain, one structure", async () => {
        instance = new SMRParser();
        const loadedData = {
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
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("two segments non overlapping, one chain, one structure", async () => {
        instance = new SMRParser();
        const loadedData = {
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
                                            from: 114,
                                            to: 125
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-125&template=6ssx.1.I&provider=swissmodel",
                        from: 14,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 125
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-125&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 114 },
                    end: { residue_number: 125 },
                    unp_end: 125,
                    unp_start: 114
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-125&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
                                            114,
                                            125,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[114-125]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 114-125"
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("two segments overlapping, one chain, one structure", async () => {
        instance = new SMRParser();
        const loadedData = {
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
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 20 },
                    end: { residue_number: 50 },
                    unp_end: 50,
                    unp_start: 20
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("two chains overlapping, one structure", async () => {
        instance = new SMRParser();
        const loadedData = {
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
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-100&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "J",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 80 },
                    end: { residue_number: 100 },
                    unp_end: 100,
                    unp_start: 80
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-100&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("two chains non overlapping, one structure", async () => {
        instance = new SMRParser();
        const loadedData = {
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
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "J",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 100 },
                    end: { residue_number: 120 },
                    unp_end: 120,
                    unp_start: 100
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-120&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("two structures, same template", async () => {
        instance = new SMRParser();
        const loadedData = {
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
                                            to: 150
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-150&template=6ssx.1.I&provider=swissmodel",
                        from: 80,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.I",
                        to: 150
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 80 },
                    end: { residue_number: 150 },
                    unp_end: 150,
                    unp_start: 80
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-150&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
                                            150,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[80-150]&key=6ssx.1 i" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_I 80-150"
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("two structures, different template", async () => {
        instance = new SMRParser();
        const loadedData = {
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
                                            to: 150
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-150&template=6ssx.1.J&provider=swissmodel",
                        from: 80,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "6ssx.1.J",
                        to: 150
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 14 },
                    end: { residue_number: 96 },
                    unp_end: 96,
                    unp_start: 14
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=14-96&template=6ssx.1.I&provider=swissmodel"
        };
        const output2: Output = {
            chain: "J",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 80 },
                    end: { residue_number: 150 },
                    unp_end: 150,
                    unp_start: 80
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-150&template=6ssx.1.J&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
                                            150,
                                            "#256C9B",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: SWISSMODEL (HOMOLOGY MODELLING)</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[80-150]&key=6ssx.1 j" target="_blank">BLAST</a></td></tr></table>',
                                                title: "6SSX.1_J 80-150"
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("smrIds config", async () => {
        instance = new SMRParser(["6ssx.1"]);
        const loadedData = {
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
                                            to: 150
                                        }
                                    }
                                ]
                            }
                        ],
                        coordinates:
                            "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=80-150&template=6ssx.1.J&provider=swissmodel",
                        from: 80,
                        method: "HOMOLOGY MODELLING",
                        provider: "SWISSMODEL",
                        template: "7hhg.1.J",
                        to: 150
                    }
                ]
            }
        };
        const output1: Output = {
            chain: "I",
            format: "pdb",
            mapping: [
                {
                    start: { residue_number: 1 },
                    end: {
                        residue_number: 1
                    },
                    unp_start: 1,
                    unp_end: 1
                }
            ],
            pdbId: "6ssx",
            url: "https://swissmodel.expasy.org/repository/uniprot/P37840.pdb?range=1-1&template=6ssx.1.I&provider=swissmodel"
        };
        const expectedResult = [
            new BasicTrackRenderer(
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
        return expect(instance.parse("P37840", loadedData)).to.eventually.deep.equal(
            expectedResult
        );
    });

    it("no template", async () => {
        instance = new SMRParser();
        const loadedData = {
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

        return expect(instance.parse("P37840", loadedData)).to.eventually.equal(null);
    });

    it("wrong template format", async () => {
        instance = new SMRParser();
        const loadedData = {
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

        return expect(instance.parse("P37840", loadedData)).to.eventually.equal(null);
    });
});