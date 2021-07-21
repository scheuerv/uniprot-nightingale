/**
 * @jest-environment jest-environment-jsdom
 */
import PdbParser from "../src/manager/builder/parsers/pdb-parser";
import BasicCategoryRenderer from "../src/manager/builder/renderers/basic-category-renderer";
import { Accession, Fragment, Location, StructureInfo, TrackRow } from "../src/types/accession";

import mockConsole from "jest-mock-console";
import { ChainMapping } from "../src/types/mapping";
import { ParserChainMapping } from "../src/types/parser-mapping";
import { PDBParserData, PDBParserItem } from "../src/types/pdb-parser";

describe("PDBParser tests", function () {
    let instance: PdbParser;
    it("no structures", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserItem[] = [];
        await expect(instance.parse("P12345", loadedData)).resolves.toBe(null);
    });

    it("3q26", async () => {
        instance = new PdbParser();
        const parserChainMapping: ParserChainMapping = {
            struct_asym_id: "A",
            fragment_mappings: [
                {
                    entity_id: 1,
                    end: { residue_number: 404 },
                    start: { residue_number: 372 },
                    unp_end: 42,
                    unp_start: 10
                }
            ]
        };
        const parserMapping: Record<string, ParserChainMapping> = {
            A: parserChainMapping
        };

        const chainMapping: ChainMapping = {
            structAsymId: "A",
            fragmentMappings: [
                {
                    entityId: 1,
                    structureEnd: 404,
                    structureStart: 372,
                    sequenceEnd: 42,
                    sequenceStart: 10
                }
            ]
        };
        const mapping: Record<string, ChainMapping> = {
            A: chainMapping
        };
        const data: PDBParserData = [
            {
                chain_id: "A",
                end: 404,
                experimental_method: "X-ray diffraction",
                mappings: parserMapping,
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
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/3q26_updated.cif"
                },
                tax_ids: [562, 9606],
                unp_end: 42,
                unp_start: 10
            }
        ];
        const structureInfo: StructureInfo = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: mapping,
            pdbId: "3q26",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/3q26_updated.cif",
            idType: "label",
            observedIntervals: [
                {
                    end: 11,
                    start: 10
                },
                {
                    end: 42,
                    start: 20
                }
            ]
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
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
                                            structureInfo
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
                                            structureInfo
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
                            structureInfo
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

    it("mapping not found", async () => {
        instance = new PdbParser();
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: {},
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

        const restoreConsole = mockConsole();
        await expect(instance.parse("P37840", loadedData)).resolves.toEqual(null);
        expect(console.warn).toHaveBeenCalledWith("Mapping for 5uig A not found.");
        restoreConsole();
    });

    it("data provided", async () => {
        instance = new PdbParser();
        const ParserChainMapping: ParserChainMapping = {
            struct_asym_id: "A",
            fragment_mappings: [
                {
                    start: { residue_number: 27 },
                    end: { residue_number: 438 },
                    unp_end: 316,
                    unp_start: 1
                }
            ]
        };

        const chainMapping: ChainMapping = {
            structAsymId: "A",
            fragmentMappings: [
                {
                    entityId: undefined,
                    structureEnd: 438,
                    structureStart: 27,
                    sequenceEnd: 316,
                    sequenceStart: 1
                }
            ]
        };
        const mapping: Record<string, ChainMapping> = {
            A: chainMapping
        };
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
                mappings: {
                    A: ParserChainMapping
                },
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
        const structureInfo: StructureInfo = {
            chain: "A",
            format: "mmcif",
            data: "structure data",
            mapping: mapping,
            pdbId: "5uig",
            url: undefined,
            idType: "label",
            observedIntervals: [
                {
                    end: 122,
                    start: 4
                }
            ]
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
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
                                            structureInfo
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
                            structureInfo
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

    it("data and url provided", async () => {
        instance = new PdbParser();
        const parserChainMapping: ParserChainMapping = {
            struct_asym_id: "A",
            fragment_mappings: [
                {
                    start: { residue_number: 27 },
                    end: { residue_number: 438 },
                    unp_end: 316,
                    unp_start: 1
                }
            ]
        };
        const chainMapping: ChainMapping = {
            structAsymId: "A",
            fragmentMappings: [
                {
                    structureEnd: 438,
                    structureStart: 27,
                    sequenceEnd: 316,
                    sequenceStart: 1
                }
            ]
        };
        const mapping: Record<string, ChainMapping> = {
            A: chainMapping
        };
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    data: "structure data",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: {
                    A: parserChainMapping
                },
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
        const structureInfo: StructureInfo = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: mapping,
            pdbId: "5uig",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif",
            idType: "label",
            observedIntervals: [
                {
                    end: 122,
                    start: 4
                }
            ]
        };
        const expectedResult: BasicCategoryRenderer[] = [
            new BasicCategoryRenderer(
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
                                            structureInfo
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
                            structureInfo
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
            "Structure parameter provides information about both url and data. Url will be used."
        );
        restoreConsole();
    });

    it("no data nor url provided", async () => {
        instance = new PdbParser();
        const parserChainMapping: ParserChainMapping = {
            struct_asym_id: "A",
            fragment_mappings: [
                {
                    start: {
                        residue_number: 27
                    },
                    end: {
                        residue_number: 438
                    },
                    unp_end: 316,
                    unp_start: 1
                }
            ]
        };

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
                mappings: {
                    A: parserChainMapping
                },
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
            "Structure parameter requires information about url or data."
        );
    });

    it("no observed", async () => {
        instance = new PdbParser();
        const parserChainMapping: ParserChainMapping = {
            struct_asym_id: "A",
            fragment_mappings: [
                {
                    start: { residue_number: 27 },
                    end: {
                        residue_number: 438
                    },
                    unp_end: 316,
                    unp_start: 1
                }
            ]
        };
        const chainMapping: ChainMapping = {
            structAsymId: "A",
            fragmentMappings: [
                {
                    structureEnd: 438,
                    structureStart: 27,
                    sequenceEnd: 316,
                    sequenceStart: 1
                }
            ]
        };
        const mapping: Record<string, ChainMapping> = {
            A: chainMapping
        };
        const loadedData: PDBParserData = [
            {
                pdb_id: "5uig",
                chain_id: "A",
                structure: {
                    format: "mmcif",
                    data: "Structure data",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif"
                },
                start: 27,
                end: 438,
                unp_start: 1,
                unp_end: 316,
                mappings: {
                    A: parserChainMapping
                },
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
        const structureInfo: StructureInfo = {
            chain: "A",
            format: "mmcif",
            data: undefined,
            mapping: mapping,
            pdbId: "5uig",
            url: "https://www.ebi.ac.uk/pdbe/static/entry/5uig_updated.cif",
            idType: "label",
            observedIntervals: []
        };
        const expectedResult = [
            new BasicCategoryRenderer(
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
                            structureInfo
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
            "Structure parameter provides information about both url and data. Url will be used."
        );
        restoreConsole();
    });
});
