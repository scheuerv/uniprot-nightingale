/**
 * @jest-environment jest-environment-jsdom
 */
import PdbParser, { PDBParserData, PDBParserItem } from "../src/parsers/pdb-parser";
import BasicTrackRenderer from "../src/renderers/basic-track-renderer";
import { Accession, Fragment, Location, Output, TrackRow } from "../src/types/accession";

import mockConsole from "jest-mock-console";

describe("PDBParser tests", function () {
    let instance: PdbParser;
    it("no structures", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserItem[] = [];
        return expect(instance.parse("P12345", loadedData)).resolves.toBe(null);
    });

    it("3q26", async () => {
        instance = new PdbParser();
        const data: PDBParserData = [
            {
                chain_id: "A",
                end: 404,
                experimental_method: "X-ray diffraction",
                mappings: [
                    {
                        end: { residue_number: 404 },
                        entity_id: 1,
                        start: { residue_number: 372 },
                        unp_end: 42,
                        unp_start: 10
                    }
                ],
                pdb_id: "3q26",
                polymer_coverage: {
                    "3q26": {
                        molecules: [
                            {
                                chains: [
                                    {
                                        chain_id: "A",
                                        observed: [
                                            {
                                                end: {
                                                    residue_number: 373
                                                },
                                                start: {
                                                    residue_number: 2
                                                }
                                            },
                                            {
                                                end: {
                                                    residue_number: 404
                                                },
                                                start: {
                                                    residue_number: 382
                                                }
                                            }
                                        ]
                                    }
                                ],
                                entity_id: 1
                            }
                        ]
                    }
                },
                start: 372,
                structure: {
                    format: "mmcif",
                    uri: "https://www.ebi.ac.uk/pdbe/static/entry/3q26_updated.cif"
                },
                tax_ids: [562, 9606],
                unp_end: 42,
                unp_start: 10
            }
        ];
        const output: Output = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: [
                {
                    entity_id: 1,
                    start: {
                        residue_number: 372
                    },
                    unp_end: 42,
                    unp_start: 10,
                    end: {
                        residue_number: 404
                    }
                }
            ],
            pdbId: "3q26",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/3q26_updated.cif"
        };
        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "3q26 a",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            10,
                                            11,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: X-ray diffraction</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[10-11]&key=3q26 a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "3Q26_A 10-11"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            2,
                                            20,
                                            42,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: X-ray diffraction</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[20-42]&key=3q26 a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "3Q26_A 20-42"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            3,
                                            12,
                                            19,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>Description</td><td>Experimental method: X-ray diffraction</td></tr><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[12-19]&key=3q26 a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "3Q26_A 12-19"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "3q26 a",
                            output
                        )
                    ]
                ]),
                "Experimental structures",
                false,
                "EXPERIMENTAL_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", data)).resolves.toEqual(expectedResult);
    });

    it("uri provided", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    uri: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: [
                    {
                        start: {
                            residue_number: 341
                        },
                        unp_end: 316,
                        unp_start: 219,
                        end: {
                            residue_number: 438
                        }
                    },
                    {
                        start: { residue_number: 27 },
                        unp_end: 208,
                        unp_start: 1,
                        end: { residue_number: 234 }
                    }
                ],
                polymer_coverage: {
                    "5uig": {
                        molecules: [
                            {
                                entity_id: 1,
                                chains: [
                                    {
                                        chain_id: "A",
                                        observed: [
                                            {
                                                start: {
                                                    residue_number: 30
                                                },
                                                end: {
                                                    residue_number: 148
                                                }
                                            },
                                            {
                                                start: {
                                                    residue_number: 185
                                                },
                                                end: {
                                                    residue_number: 282
                                                }
                                            },
                                            {
                                                start: {
                                                    residue_number: 290
                                                },
                                                end: {
                                                    residue_number: 433
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        const output: Output = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: [
                {
                    unp_start: 1,
                    unp_end: 208,
                    start: { residue_number: 27 },
                    end: { residue_number: 234 }
                },
                {
                    unp_start: 219,
                    unp_end: 316,
                    start: { residue_number: 341 },
                    end: { residue_number: 438 }
                }
            ],
            pdbId: "5uig",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
        };
        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "5uig a",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            4,
                                            122,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[4-122]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 4-122"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            2,
                                            159,
                                            208,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[159-208]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 159-208"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            3,
                                            219,
                                            311,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[219-311]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 219-311"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            4,
                                            1,
                                            3,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[1-3]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 1-3"
                                            },
                                            undefined
                                        ),
                                        new Fragment(
                                            5,
                                            123,
                                            158,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[123-158]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 123-158"
                                            },
                                            undefined
                                        ),
                                        new Fragment(
                                            6,
                                            312,
                                            316,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[312-316]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 312-316"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "5uig a",
                            output
                        )
                    ]
                ]),
                "Experimental structures",
                false,
                "EXPERIMENTAL_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("data provided", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    data: "structure data"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: [
                    {
                        start: { residue_number: 27 },
                        end: { residue_number: 438 },
                        unp_end: 316,
                        unp_start: 1
                    }
                ],
                polymer_coverage: {
                    "5uig": {
                        molecules: [
                            {
                                entity_id: 1,
                                chains: [
                                    {
                                        chain_id: "A",
                                        observed: [
                                            {
                                                start: {
                                                    residue_number: 30
                                                },
                                                end: {
                                                    residue_number: 148
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        const output: Output = {
            chain: "A",
            format: "mmcif",
            data: "structure data",
            mapping: [
                {
                    start: { residue_number: 27 },
                    end: { residue_number: 438 },
                    unp_end: 316,
                    unp_start: 1
                }
            ],
            pdbId: "5uig",
            url: undefined
        };
        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "5uig a",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            4,
                                            122,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[4-122]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 4-122"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            2,
                                            1,
                                            3,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[1-3]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 1-3"
                                            },
                                            undefined
                                        ),
                                        new Fragment(
                                            3,
                                            123,
                                            316,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[123-316]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 123-316"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "5uig a",
                            output
                        )
                    ]
                ]),
                "Experimental structures",
                false,
                "EXPERIMENTAL_STRUCTURES"
            )
        ];
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
    });

    it("data and uri provided", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    data: "structure data",
                    uri: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: [
                    {
                        start: { residue_number: 27 },
                        end: { residue_number: 438 },
                        unp_end: 316,
                        unp_start: 1
                    }
                ],
                polymer_coverage: {
                    "5uig": {
                        molecules: [
                            {
                                entity_id: 1,
                                chains: [
                                    {
                                        chain_id: "A",
                                        observed: [
                                            {
                                                start: {
                                                    residue_number: 30
                                                },
                                                end: {
                                                    residue_number: 148
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        const output: Output = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: [
                {
                    start: { residue_number: 27 },
                    end: { residue_number: 438 },
                    unp_end: 316,
                    unp_start: 1
                }
            ],
            pdbId: "5uig",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
        };
        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "5uig a",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            4,
                                            122,
                                            "#2e86c1",
                                            "#2e86c1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[4-122]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 4-122"
                                            },
                                            output
                                        ),
                                        new Fragment(
                                            2,
                                            1,
                                            3,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[1-3]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 1-3"
                                            },
                                            undefined
                                        ),
                                        new Fragment(
                                            3,
                                            123,
                                            316,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[123-316]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 123-316"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "5uig a",
                            output
                        )
                    ]
                ]),
                "Experimental structures",
                false,
                "EXPERIMENTAL_STRUCTURES"
            )
        ];
        const restoreConsole = mockConsole();
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
        expect(console.warn).toHaveBeenCalledWith(
            "Structure parameter provides information about both uri and data. Uri will be used."
        );
        restoreConsole();
    });

    it("no data nor uri provided", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: [
                    {
                        start: { residue_number: 27 },
                        end: { residue_number: 438 },
                        unp_end: 316,
                        unp_start: 1
                    }
                ],
                polymer_coverage: {
                    "5uig": {
                        molecules: [
                            {
                                entity_id: 1,
                                chains: [
                                    {
                                        chain_id: "A",
                                        observed: [
                                            {
                                                start: {
                                                    residue_number: 30
                                                },
                                                end: {
                                                    residue_number: 148
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        await expect(instance.parse("P37840", loadedData)).rejects.toThrowError(
            "Structure parameter requires information about uri or data."
        );
    });

    it("no observed", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    data: "Structure data",
                    uri: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: [
                    {
                        start: { residue_number: 27 },
                        end: { residue_number: 438 },
                        unp_end: 316,
                        unp_start: 1
                    }
                ],
                polymer_coverage: {
                    "5uig": {
                        molecules: [
                            {
                                entity_id: 1,
                                chains: [
                                    {
                                        chain_id: "A",
                                        observed: []
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        ];
        const output: Output = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: [
                {
                    start: { residue_number: 27 },
                    end: { residue_number: 438 },
                    unp_end: 316,
                    unp_start: 1
                }
            ],
            pdbId: "5uig",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
        };
        const expectedResult = [
            new BasicTrackRenderer(
                new Map([
                    [
                        "5uig a",
                        new TrackRow(
                            [
                                new Accession([
                                    new Location([
                                        new Fragment(
                                            1,
                                            1,
                                            316,
                                            "#bdbfc1",
                                            "#bdbfc1",
                                            undefined,
                                            {
                                                content:
                                                    '<table><tr> <td>BLAST</td><td><span><a href="http://www.uniprot.org/blast/?about=P37840[1-316]&key=5uig a" target="_blank">BLAST</a></td></tr></table>',
                                                title: "5UIG_A 1-316"
                                            },
                                            undefined
                                        )
                                    ])
                                ])
                            ],
                            "5uig a",
                            output
                        )
                    ]
                ]),
                "Experimental structures",
                false,
                "EXPERIMENTAL_STRUCTURES"
            )
        ];
        const restoreConsole = mockConsole();
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(expectedResult);
        expect(console.warn).toHaveBeenCalledWith(
            "Structure parameter provides information about both uri and data. Uri will be used."
        );
        restoreConsole();
    });
});
