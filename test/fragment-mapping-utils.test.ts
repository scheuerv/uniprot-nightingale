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
                        sequenceStart: 20,
                        sequenceEnd: 25,
                        structureStart: 30,
                        structureEnd: 35
                    }
                ])
            ).toEqual([]);
        });

        it("no overlap, mapping before interval", async () => {
            expect(
                findUniprotIntervalsFromStructureResidues(5, 15, [
                    {
                        sequenceStart: 20,
                        sequenceEnd: 23,

                        structureStart: 0,
                        structureEnd: 3
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
                        sequenceStart: 30,
                        sequenceEnd: 40,
                        structureStart: 10,
                        structureEnd: 20
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
                        sequenceStart: 30,
                        sequenceEnd: 40,
                        structureStart: 0,
                        structureEnd: 10
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
                        sequenceStart: 20,
                        sequenceEnd: 40,
                        structureStart: 0,
                        structureEnd: 20
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
                        sequenceStart: 20,
                        sequenceEnd: 30,
                        structureStart: 0,
                        structureEnd: 10
                    },
                    {
                        sequenceStart: 50,
                        sequenceEnd: 60,
                        structureStart: 15,
                        structureEnd: 25
                    },
                    {
                        sequenceStart: 120,
                        sequenceEnd: 140,
                        structureStart: 40,
                        structureEnd: 60
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
                        sequenceStart: 30,
                        sequenceEnd: 35,

                        structureStart: 20,
                        structureEnd: 25
                    }
                ])
            ).toEqual([]);
        });

        it("no overlap, mapping before interval", async () => {
            expect(
                findUniprotIntervalsFromUniprotSequence(5, 15, [
                    {
                        sequenceStart: 0,
                        sequenceEnd: 3,

                        structureStart: 20,
                        structureEnd: 23
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
                        sequenceStart: 10,
                        sequenceEnd: 20,
                        structureStart: 30,
                        structureEnd: 40
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
                        sequenceStart: 0,
                        sequenceEnd: 10,
                        structureStart: 30,
                        structureEnd: 40
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
                        sequenceStart: 0,
                        sequenceEnd: 20,
                        structureStart: 20,
                        structureEnd: 40
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
                        sequenceStart: 0,
                        sequenceEnd: 10,
                        structureStart: 20,
                        structureEnd: 30
                    },
                    {
                        sequenceStart: 15,
                        sequenceEnd: 25,
                        structureStart: 50,
                        structureEnd: 60
                    },
                    {
                        sequenceStart: 40,
                        sequenceEnd: 60,
                        structureStart: 120,
                        structureEnd: 140
                    }
                ])
            ).toEqual(expectedResult);
        });
    });
});
