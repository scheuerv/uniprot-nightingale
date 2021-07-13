/**
 * @jest-environment jest-environment-jsdom
 */
import PdbLoader from "../src/manager/builder/loaders/pdb-loader";
import fetchMock from "jest-fetch-mock";
import mockConsole from "jest-mock-console";
import { ParserChainMapping } from "../src/types/parser-mapping";
import { PDBParserItem } from "../src/types/pdb-parser";

describe("PDBLoader tests", function () {
    let instance: PdbLoader;
    beforeAll(() => {
        fetchMock.enableMocks();
    });
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    afterAll(() => {
        fetchMock.disableMocks();
    });

    it("basic case", async () => {
        fetchMock.mockResponse((req) => {
            if (req.url === "https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/1xk4") {
                return Promise.resolve(
                    JSON.stringify({
                        "1xk4": {
                            molecules: [
                                {
                                    entity_id: 1,
                                    chains: [
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 1,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "J",
                                                        residue_number: 1
                                                    },
                                                    end: {
                                                        author_residue_number: 88,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "J",
                                                        residue_number: 88
                                                    }
                                                }
                                            ],
                                            chain_id: "J",
                                            struct_asym_id: "J"
                                        }
                                    ]
                                },
                                {
                                    entity_id: 2,
                                    chains: [
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "C",
                                                        residue_number: 3
                                                    },
                                                    end: {
                                                        author_residue_number: 92,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "C",
                                                        residue_number: 91
                                                    }
                                                }
                                            ],
                                            chain_id: "C",
                                            struct_asym_id: "C"
                                        },
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "H",
                                                        residue_number: 3
                                                    },
                                                    end: {
                                                        author_residue_number: 92,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "H",
                                                        residue_number: 91
                                                    }
                                                }
                                            ],
                                            chain_id: "H",
                                            struct_asym_id: "H"
                                        },
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "K",
                                                        residue_number: 3
                                                    },
                                                    end: {
                                                        author_residue_number: 95,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "K",
                                                        residue_number: 94
                                                    }
                                                }
                                            ],
                                            chain_id: "K",
                                            struct_asym_id: "K"
                                        }
                                    ]
                                }
                            ]
                        }
                    })
                );
            } else if (req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/P06702") {
                return Promise.resolve(
                    JSON.stringify({
                        P06702: {
                            PDB: {
                                "5i8n": [
                                    {
                                        entity_id: 1,
                                        end: {
                                            author_residue_number: 114,
                                            author_insertion_code: "",
                                            residue_number: 114
                                        },
                                        start: {
                                            author_residue_number: 1,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "A",
                                        unp_end: 114,
                                        unp_start: 1,
                                        struct_asym_id: "A"
                                    }
                                ],
                                "1xk4": [
                                    {
                                        entity_id: 2,
                                        end: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 113
                                        },
                                        start: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "H",
                                        unp_end: 114,
                                        unp_start: 2,
                                        struct_asym_id: "H"
                                    },
                                    {
                                        entity_id: 2,
                                        end: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 113
                                        },
                                        start: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "K",
                                        unp_end: 114,
                                        unp_start: 2,
                                        struct_asym_id: "K"
                                    }
                                ]
                            }
                        }
                    })
                );
            } else if (
                req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/P06702"
            ) {
                return Promise.resolve(
                    JSON.stringify({
                        P06702: [
                            {
                                end: 113,
                                chain_id: "H",
                                experimental_method: "X-ray diffraction",
                                pdb_id: "1xk4",
                                start: 1,
                                unp_end: 114,
                                coverage: 0.991,
                                unp_start: 2,
                                tax_id: 9606
                            },
                            {
                                end: 113,
                                chain_id: "K",
                                experimental_method: "X-ray diffraction",
                                pdb_id: "1xk4",
                                start: 1,
                                unp_end: 114,
                                coverage: 0.991,
                                unp_start: 2,
                                tax_id: 9606
                            }
                        ]
                    })
                );
            }
            return Promise.reject("error");
        });

        instance = new PdbLoader();
        const chainMappingH: ParserChainMapping = {
            struct_asym_id: "H",
            fragment_mappings: [
                {
                    entity_id: 2,
                    end: { residue_number: 113 },
                    start: { residue_number: 1 },
                    unp_end: 114,
                    unp_start: 2
                }
            ]
        };
        const chainMappingK: ParserChainMapping = {
            struct_asym_id: "K",
            fragment_mappings: [
                {
                    entity_id: 2,
                    end: { residue_number: 113 },
                    start: { residue_number: 1 },
                    unp_end: 114,
                    unp_start: 2
                }
            ]
        };
        const expectedResult: PDBParserItem[] = [
            {
                chain_id: "H",
                coverage: 0.991,
                end: 113,
                experimental_method: "X-ray diffraction",
                mappings: {
                    H: chainMappingH,
                    K: chainMappingK
                },
                pdb_id: "1xk4",
                polymer_coverage: {
                    "1xk4": {
                        molecules: [
                            {
                                chains: [],
                                entity_id: 1
                            },
                            {
                                chains: [
                                    {
                                        chain_id: "H",
                                        observed: [
                                            {
                                                end: {
                                                    residue_number: 91
                                                },
                                                start: {
                                                    residue_number: 3
                                                }
                                            }
                                        ]
                                    }
                                ],
                                entity_id: 2
                            }
                        ]
                    }
                },
                start: 1,
                structure: {
                    format: "mmcif",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/1xk4_updated.cif"
                },
                tax_id: 9606,
                tax_ids: [9606],
                unp_end: 114,
                unp_start: 2
            },
            {
                chain_id: "K",
                coverage: 0.991,
                end: 113,
                experimental_method: "X-ray diffraction",
                mappings: {
                    H: chainMappingH,
                    K: chainMappingK
                },
                pdb_id: "1xk4",
                polymer_coverage: {
                    "1xk4": {
                        molecules: [
                            {
                                chains: [],
                                entity_id: 1
                            },
                            {
                                chains: [
                                    {
                                        chain_id: "K",
                                        observed: [
                                            {
                                                end: {
                                                    residue_number: 94
                                                },
                                                start: {
                                                    residue_number: 3
                                                }
                                            }
                                        ]
                                    }
                                ],
                                entity_id: 2
                            }
                        ]
                    }
                },
                start: 1,
                structure: {
                    format: "mmcif",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/1xk4_updated.cif"
                },
                tax_id: 9606,
                tax_ids: [9606],
                unp_end: 114,
                unp_start: 2
            }
        ];
        await expect(instance.load("P06702")).resolves.toEqual(expectedResult);
        expect(fetchMock.mock.calls.length).toEqual(3);
    });

    it("Best structures API unavailable", async () => {
        fetchMock.mockResponse((req) => {
            if (req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/P06702") {
                return Promise.reject("best structures error");
            }
            return Promise.reject("error");
        });
        instance = new PdbLoader();
        const restoreConsole = mockConsole();
        await expect(instance.load("P06702")).rejects.toEqual("best structures error");
        expect(console.error).toHaveBeenCalledWith(
            "Best structures API unavailable!",
            "best structures error"
        );
        restoreConsole();
        expect(fetchMock.mock.calls.length).toEqual(1);
    });

    it("Mapping API unavailable", async () => {
        fetchMock.mockResponse((req) => {
            if (req.url === "https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/1xk4") {
                return Promise.resolve(
                    JSON.stringify({
                        "1xk4": {
                            molecules: [
                                {
                                    entity_id: 2,
                                    chains: [
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "H",
                                                        residue_number: 3
                                                    },
                                                    end: {
                                                        author_residue_number: 92,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "H",
                                                        residue_number: 91
                                                    }
                                                }
                                            ],
                                            chain_id: "H",
                                            struct_asym_id: "H"
                                        },
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "K",
                                                        residue_number: 3
                                                    },
                                                    end: {
                                                        author_residue_number: 95,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "K",
                                                        residue_number: 94
                                                    }
                                                }
                                            ],
                                            chain_id: "K",
                                            struct_asym_id: "K"
                                        }
                                    ]
                                }
                            ]
                        }
                    })
                );
            } else if (
                req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/P06702"
            ) {
                {
                    return Promise.resolve(
                        JSON.stringify({
                            P06702: [
                                {
                                    end: 113,
                                    chain_id: "H",
                                    experimental_method: "X-ray diffraction",
                                    pdb_id: "1xk4",
                                    start: 1,
                                    unp_end: 114,
                                    coverage: 0.991,
                                    unp_start: 2,
                                    tax_id: 9606
                                },
                                {
                                    end: 113,
                                    chain_id: "K",
                                    experimental_method: "X-ray diffraction",
                                    pdb_id: "1xk4",
                                    start: 1,
                                    unp_end: 114,
                                    coverage: 0.991,
                                    unp_start: 2,
                                    tax_id: 9606
                                }
                            ]
                        })
                    );
                }
            } else if (req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/P06702") {
                return Promise.reject("mapping error");
            }
            return Promise.reject("error");
        });
        instance = new PdbLoader();
        const restoreConsole = mockConsole();
        await expect(instance.load("P06702")).rejects.toEqual("mapping error");
        expect(console.error).toHaveBeenCalledWith("Mapping API unavailable!", "mapping error");
        restoreConsole();
        expect(fetchMock.mock.calls.length).toEqual(3);
    });

    it("Config pdbIds", async () => {
        fetchMock.mockResponse((req) => {
            if (req.url === "https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/4ggf") {
                return Promise.resolve(
                    JSON.stringify({
                        "4ggf": {
                            molecules: [
                                {
                                    entity_id: 2,
                                    chains: [
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "B",
                                                        residue_number: 4
                                                    },
                                                    end: {
                                                        author_residue_number: 111,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "B",
                                                        residue_number: 111
                                                    }
                                                }
                                            ],
                                            chain_id: "C",
                                            struct_asym_id: "B"
                                        }
                                    ]
                                }
                            ]
                        }
                    })
                );
            } else if (
                req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/P06702"
            ) {
                return Promise.resolve(
                    JSON.stringify({
                        P06702: [
                            {
                                end: 114,
                                chain_id: "C",
                                experimental_method: "X-ray diffraction",
                                pdb_id: "4ggf",
                                start: 1,
                                unp_end: 114,
                                coverage: 1,
                                unp_start: 1,
                                tax_id: 9606
                            },
                            {
                                end: 113,
                                chain_id: "K",
                                experimental_method: "X-ray diffraction",
                                pdb_id: "1xk4",
                                start: 1,
                                unp_end: 114,
                                coverage: 0.991,
                                unp_start: 2,
                                tax_id: 9606
                            }
                        ]
                    })
                );
            } else if (req.url == "https://www.ebi.ac.uk/pdbe/api/mappings/P06702") {
                return Promise.resolve(
                    JSON.stringify({
                        P06702: {
                            PDB: {
                                "4ggf": [
                                    {
                                        entity_id: 2,
                                        end: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 114
                                        },
                                        start: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "C",
                                        unp_end: 114,
                                        unp_start: 1,
                                        struct_asym_id: "B"
                                    }
                                ],

                                "1xk4": [
                                    {
                                        entity_id: 2,
                                        end: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 113
                                        },
                                        start: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "K",
                                        unp_end: 114,
                                        unp_start: 2,
                                        struct_asym_id: "K"
                                    }
                                ]
                            }
                        }
                    })
                );
            }

            return Promise.reject("error");
        });
        instance = new PdbLoader(["4ggf"]);
        const chainMappingC: ParserChainMapping = {
            struct_asym_id: "B",
            fragment_mappings: [
                {
                    end: { residue_number: 114 },
                    entity_id: 2,
                    start: { residue_number: 1 },
                    unp_end: 114,
                    unp_start: 1
                }
            ]
        };
        const expectedResult: PDBParserItem[] = [
            {
                chain_id: "C",
                coverage: 1,
                end: 114,
                experimental_method: "X-ray diffraction",
                mappings: {
                    C: chainMappingC
                },
                pdb_id: "4ggf",
                polymer_coverage: {
                    "4ggf": {
                        molecules: [
                            {
                                chains: [
                                    {
                                        chain_id: "C",
                                        observed: [
                                            {
                                                end: { residue_number: 111 },
                                                start: { residue_number: 4 }
                                            }
                                        ]
                                    }
                                ],
                                entity_id: 2
                            }
                        ]
                    }
                },
                start: 1,
                structure: {
                    format: "mmcif",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/4ggf_updated.cif"
                },
                tax_id: 9606,
                tax_ids: [9606],
                unp_end: 114,
                unp_start: 1
            }
        ];
        await expect(instance.load("P06702")).resolves.toEqual(expectedResult);
        expect(fetchMock.mock.calls.length).toEqual(3);
    });

    it("Polymer coverage API unavailable", async () => {
        fetchMock.mockResponse((req) => {
            if (req.url === "https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/1xk4") {
                return Promise.reject("Polymer coverage error");
            } else if (
                req.url === "https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/4ggf"
            ) {
                return Promise.resolve(
                    JSON.stringify({
                        "4ggf": {
                            molecules: [
                                {
                                    entity_id: 2,
                                    chains: [
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 4,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "B",
                                                        residue_number: 4
                                                    },
                                                    end: {
                                                        author_residue_number: 111,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "B",
                                                        residue_number: 111
                                                    }
                                                }
                                            ],
                                            chain_id: "C",
                                            struct_asym_id: "B"
                                        }
                                    ]
                                }
                            ]
                        }
                    })
                );
            } else if (
                req.url === "https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/P06702"
            ) {
                return Promise.resolve(
                    JSON.stringify({
                        P06702: [
                            {
                                end: 114,
                                chain_id: "C",
                                experimental_method: "X-ray diffraction",
                                pdb_id: "4ggf",
                                start: 1,
                                unp_end: 114,
                                coverage: 1,
                                unp_start: 1,
                                tax_id: 9606
                            },
                            {
                                end: 113,
                                chain_id: "K",
                                experimental_method: "X-ray diffraction",
                                pdb_id: "1xk4",
                                start: 1,
                                unp_end: 114,
                                coverage: 0.991,
                                unp_start: 2,
                                tax_id: 9606
                            }
                        ]
                    })
                );
            } else if (req.url == "https://www.ebi.ac.uk/pdbe/api/mappings/P06702") {
                return Promise.resolve(
                    JSON.stringify({
                        P06702: {
                            PDB: {
                                "4ggf": [
                                    {
                                        entity_id: 2,
                                        end: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 114
                                        },
                                        start: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "C",
                                        unp_end: 114,
                                        unp_start: 1,
                                        struct_asym_id: "B"
                                    }
                                ],

                                "1xk4": [
                                    {
                                        entity_id: 2,
                                        end: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 113
                                        },
                                        start: {
                                            author_residue_number: null,
                                            author_insertion_code: "",
                                            residue_number: 1
                                        },
                                        chain_id: "K",
                                        unp_end: 114,
                                        unp_start: 2,
                                        struct_asym_id: "K"
                                    }
                                ]
                            }
                        }
                    })
                );
            }

            return Promise.reject("error");
        });
        instance = new PdbLoader();
        const chainMappingC: ParserChainMapping = {
            struct_asym_id: "B",
            fragment_mappings: [
                {
                    end: { residue_number: 114 },
                    entity_id: 2,
                    start: { residue_number: 1 },
                    unp_end: 114,
                    unp_start: 1
                }
            ]
        };
        const expectedResult: PDBParserItem[] = [
            {
                chain_id: "C",
                coverage: 1,
                end: 114,
                experimental_method: "X-ray diffraction",
                mappings: {
                    C: chainMappingC
                },
                pdb_id: "4ggf",
                polymer_coverage: {
                    "4ggf": {
                        molecules: [
                            {
                                chains: [
                                    {
                                        chain_id: "C",
                                        observed: [
                                            {
                                                end: { residue_number: 111 },
                                                start: { residue_number: 4 }
                                            }
                                        ]
                                    }
                                ],
                                entity_id: 2
                            }
                        ]
                    }
                },
                start: 1,
                structure: {
                    format: "mmcif",
                    url: "https://www.ebi.ac.uk/pdbe/static/entry/4ggf_updated.cif"
                },
                tax_id: 9606,
                tax_ids: [9606],
                unp_end: 114,
                unp_start: 1
            }
        ];
        const restoreConsole = mockConsole();
        await expect(instance.load("P06702")).resolves.toEqual(expectedResult);
        expect(console.error).toHaveBeenCalledWith(
            "Polymer coverage API for 1xk4 unavailable!",
            "Polymer coverage error"
        );
        restoreConsole();
        expect(fetchMock.mock.calls.length).toEqual(4);
    });

    it("Same chain, different tax_id", async () => {
        fetchMock.mockResponse((req) => {
            if (req.url == "https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/P37840") {
                return Promise.resolve(
                    JSON.stringify({
                        P37840: [
                            {
                                end: 404,
                                chain_id: "A",
                                pdb_id: "3q26",
                                start: 372,
                                unp_end: 42,
                                unp_start: 10,
                                experimental_method: "X-ray diffraction",
                                tax_id: 562
                            },
                            {
                                end: 404,
                                chain_id: "A",
                                pdb_id: "3q26",
                                start: 372,
                                unp_end: 42,
                                coverage: 0.236,
                                unp_start: 10,
                                resolution: 1.54,
                                experimental_method: "X-ray diffraction",
                                tax_id: 9606
                            }
                        ]
                    })
                );
            } else if (
                req.url === "https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/3q26"
            ) {
                return Promise.resolve(
                    JSON.stringify({
                        "3q26": {
                            molecules: [
                                {
                                    entity_id: 1,
                                    chains: [
                                        {
                                            observed: [
                                                {
                                                    start: {
                                                        author_residue_number: 2,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "A",
                                                        residue_number: 2
                                                    },
                                                    end: {
                                                        author_residue_number: 373,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "A",
                                                        residue_number: 373
                                                    }
                                                },
                                                {
                                                    start: {
                                                        author_residue_number: 382,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "A",
                                                        residue_number: 382
                                                    },
                                                    end: {
                                                        author_residue_number: 404,
                                                        author_insertion_code: null,
                                                        struct_asym_id: "A",
                                                        residue_number: 404
                                                    }
                                                }
                                            ],
                                            chain_id: "A",
                                            struct_asym_id: "A"
                                        }
                                    ]
                                }
                            ]
                        }
                    })
                );
            } else if (req.url == "https://www.ebi.ac.uk/pdbe/api/mappings/P37840") {
                return Promise.resolve(
                    JSON.stringify({
                        P37840: {
                            PDB: {
                                "3q26": [
                                    {
                                        entity_id: 1,
                                        end: {
                                            author_residue_number: 404,
                                            author_insertion_code: "",
                                            residue_number: 404
                                        },
                                        start: {
                                            author_residue_number: 372,
                                            author_insertion_code: "",
                                            residue_number: 372
                                        },
                                        chain_id: "A",
                                        unp_end: 42,
                                        unp_start: 10,
                                        struct_asym_id: "A"
                                    }
                                ]
                            }
                        }
                    })
                );
            }
            return Promise.reject("error");
        });
        instance = new PdbLoader();
        const chainMappingA: ParserChainMapping = {
            struct_asym_id: "A",
            fragment_mappings: [
                {
                    end: { residue_number: 404 },
                    entity_id: 1,
                    start: { residue_number: 372 },
                    unp_end: 42,
                    unp_start: 10
                }
            ]
        };
        const expectedResult: PDBParserItem[] = [
            {
                chain_id: "A",
                end: 404,
                experimental_method: "X-ray diffraction",
                mappings: {
                    A: chainMappingA
                },
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
                tax_id: 562,
                tax_ids: [562, 9606],
                unp_end: 42,
                unp_start: 10
            }
        ];
        await expect(instance.load("P37840")).resolves.toEqual(expectedResult);
        expect(fetchMock.mock.calls.length).toEqual(3);
    });
});
