import {
    findUniprotIntervalsFromStructureResidues,
    findUniprotIntervalsFromUniprotSequence
} from "../src/utils/fragment-mapping-utils";

describe("Fragment-mapping-utils tests", function () {
    describe("findUniprotIntervalsFromStructureResidues tests", function () {
        it("no overlap, mapping after interval", async () => {
            expect(
                findUniprotIntervalsFromStructureResidues(5, 15, [
                    {
                        unp_start: 20,
                        unp_end: 25,

                        start: { residue_number: 30 },
                        end: { residue_number: 35 }
                    }
                ])
            ).toEqual([]);
        });

        it("no overlap, mapping before interval", async () => {
            expect(
                findUniprotIntervalsFromStructureResidues(5, 15, [
                    {
                        unp_start: 20,
                        unp_end: 23,

                        start: { residue_number: 0 },
                        end: { residue_number: 3 }
                    }
                ])
            ).toEqual([]);
        });

        it("partially overlap at end", async () => {
            const expectedResult = [
                {
                    end: 35,
                    start: 30
                }
            ];
            expect(
                findUniprotIntervalsFromStructureResidues(5, 15, [
                    {
                        unp_start: 30,
                        unp_end: 40,
                        start: { residue_number: 10 },
                        end: { residue_number: 20 }
                    }
                ])
            ).toEqual(expectedResult);
        });

        it("partially overlap at start", async () => {
            const expectedResult = [
                {
                    end: 40,
                    start: 35
                }
            ];
            expect(
                findUniprotIntervalsFromStructureResidues(5, 15, [
                    {
                        unp_start: 30,
                        unp_end: 40,
                        start: { residue_number: 0 },
                        end: { residue_number: 10 }
                    }
                ])
            ).toEqual(expectedResult);
        });

        it("mapping covers whole interval", async () => {
            const expectedResult = [
                {
                    end: 35,
                    start: 25
                }
            ];
            expect(
                findUniprotIntervalsFromStructureResidues(5, 15, [
                    {
                        unp_start: 20,
                        unp_end: 40,
                        start: { residue_number: 0 },
                        end: { residue_number: 20 }
                    }
                ])
            ).toEqual(expectedResult);
        });

        it("three mappings in interval", async () => {
            const expectedResult = [
                {
                    end: 30,
                    start: 25
                },
                {
                    end: 60,
                    start: 50
                },
                {
                    end: 135,
                    start: 120
                }
            ];
            expect(
                findUniprotIntervalsFromStructureResidues(5, 55, [
                    {
                        unp_start: 20,
                        unp_end: 30,
                        start: { residue_number: 0 },
                        end: { residue_number: 10 }
                    },
                    {
                        unp_start: 50,
                        unp_end: 60,
                        start: { residue_number: 15 },
                        end: { residue_number: 25 }
                    },
                    {
                        unp_start: 120,
                        unp_end: 140,
                        start: { residue_number: 40 },
                        end: { residue_number: 60 }
                    }
                ])
            ).toEqual(expectedResult);
        });
    });

    describe("findUniprotIntervalsFromUniprotSequence tests", function () {
        it("no overlap, mapping after interval", async () => {
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 15, [
                    {
                        unp_start: 30,
                        unp_end: 35,

                        start: { residue_number: 20 },
                        end: { residue_number: 25 }
                    }
                ])
            ).toEqual([]);
        });

        it("no overlap, mapping before interval", async () => {
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 15, [
                    {
                        unp_start: 0,
                        unp_end: 3,

                        start: { residue_number: 20 },
                        end: { residue_number: 23 }
                    }
                ])
            ).toEqual([]);
        });

        it("partially overlap at end", async () => {
            const expectedResult = [
                {
                    end: 15,
                    start: 10
                }
            ];
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 15, [
                    {
                        unp_start: 10,
                        unp_end: 20,
                        start: { residue_number: 30 },
                        end: { residue_number: 40 }
                    }
                ])
            ).toEqual(expectedResult);
        });

        it("partially overlap at start", async () => {
            const expectedResult = [
                {
                    end: 10,
                    start: 5
                }
            ];
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 15, [
                    {
                        unp_start: 0,
                        unp_end: 10,
                        start: { residue_number: 30 },
                        end: { residue_number: 40 }
                    }
                ])
            ).toEqual(expectedResult);
        });

        it("mapping covers whole interval", async () => {
            const expectedResult = [
                {
                    end: 15,
                    start: 5
                }
            ];
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 15, [
                    {
                        unp_start: 0,
                        unp_end: 20,
                        start: { residue_number: 20 },
                        end: { residue_number: 40 }
                    }
                ])
            ).toEqual(expectedResult);
        });

        it("three mappings in interval", async () => {
            const expectedResult = [
                {
                    end: 10,
                    start: 5
                },
                {
                    end: 25,
                    start: 15
                },
                {
                    end: 55,
                    start: 40
                }
            ];
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 55, [
                    {
                        unp_start: 0,
                        unp_end: 10,
                        start: { residue_number: 20 },
                        end: { residue_number: 30 }
                    },
                    {
                        unp_start: 15,
                        unp_end: 25,
                        start: { residue_number: 50 },
                        end: { residue_number: 60 }
                    },
                    {
                        unp_start: 40,
                        unp_end: 60,
                        start: { residue_number: 120 },
                        end: { residue_number: 140 }
                    }
                ])
            ).toEqual(expectedResult);
        });
    });
});
