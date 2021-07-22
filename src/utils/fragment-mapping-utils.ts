import { Interval } from "../types/interval";
import { FragmentMapping } from "../types/mapping";

/**
 * Maps given structure range to sequence intervals.
 * @param  {number} start Structure index of the first residue in range.
 * @param  {number} end Structure index of the last residue in range.
 * @param  {FragmentMapping[]} mappings Sequence-structure mappings.
 * @returns {Interval[]} Observed sequence intervals which are mapped to structure in the given start-end range.
 * */
export function findUniprotIntervalsFromStructureResidues(
    start: number,
    end: number,
    mappings: FragmentMapping[]
): Interval[] {
    const startInterval = findIntervalIdByResNumber(start, mappings);
    if (startInterval.outOfRange) {
        return [];
    }
    const endInterval = findIntervalIdByResNumber(end, mappings);
    //whole given range is outside of mapping
    if (startInterval.id == endInterval.id && !startInterval.direct && !endInterval.direct) {
        return [];
    }

    const startId = startInterval.id;
    let startUniprot;
    if (startInterval.direct) {
        startUniprot =
            start -
            mappings[startInterval.id].structureStart +
            mappings[startInterval.id].sequenceStart;
    } else {
        startUniprot = mappings[startInterval.id].sequenceStart;
    }

    let endId;
    let endUniprot;
    if (endInterval.direct) {
        endId = endInterval.id;
        endUniprot =
            end - mappings[endInterval.id].structureStart + mappings[endInterval.id].sequenceStart;
    } else {
        endId = endInterval.id - 1;
        endUniprot = mappings[endInterval.id - 1].sequenceEnd;
    }
    let lastStart = startUniprot;
    const intervals: Interval[] = [];
    for (let id = startId + 1; id <= endId; ++id) {
        intervals.push({
            start: lastStart,
            end: mappings[id - 1].sequenceEnd
        });
        lastStart = mappings[id].sequenceStart;
    }
    intervals.push({
        start: lastStart,
        end: endUniprot
    });
    return intervals;
}

/**
 * Maps given sequence range to sequence intervals.
 * @param  {number} start  Sequence index of the first residue in range.
 * @param  {number} end Sequence index of the last residue in range.
 * @param  {FragmentMapping[]} mappings Sequence-structure mappings.
 * @returns Observed sequence intervals which are in the given start-end range.
 */
export function findUniprotIntervalsFromUniprotSequence(
    start: number,
    end: number,
    mappings: FragmentMapping[]
): Interval[] {
    const startInterval = findIntervalIdByUniprotNumber(start, mappings);
    if (startInterval.outOfRange) {
        return [];
    }
    const endInterval = findIntervalIdByUniprotNumber(end, mappings);
    //whole given range is outside of mapping
    if (startInterval.id == endInterval.id && !startInterval.direct && !endInterval.direct) {
        return [];
    }

    const startId = startInterval.id;
    let startUniprot;
    if (startInterval.direct) {
        startUniprot = start;
    } else {
        startUniprot = mappings[startInterval.id].sequenceStart;
    }

    let endId;
    let endUniprot;
    if (endInterval.direct) {
        endId = endInterval.id;
        endUniprot = end;
    } else {
        endId = endInterval.id - 1;
        endUniprot = mappings[endInterval.id - 1].sequenceEnd;
    }
    let lastStart = startUniprot;
    const intervals: Interval[] = [];
    for (let id = startId + 1; id <= endId; ++id) {
        intervals.push({
            start: lastStart,
            end: mappings[id - 1].sequenceEnd
        });
        lastStart = mappings[id].sequenceStart;
    }
    intervals.push({
        start: lastStart,
        end: endUniprot
    });
    return intervals;
}
/**
 * Finds mapping containing given residue or closest mapping with start larger than resNumber.
 * @param  {number} resNumber Structure index of residue.
 * @param  {FragmentMapping[]} mappings Sequence-structure mappings.
 */
function findIntervalIdByResNumber(resNumber: number, mappings: FragmentMapping[]): FoundInterval {
    for (let i = 0; i < mappings.length; ++i) {
        const mapping = mappings[i];
        if (
            (mapping.structureStart <= resNumber && resNumber <= mapping.structureEnd) ||
            mapping.structureStart > resNumber
        ) {
            //residue is in i-th mapping or i-th mapping is the closest mapping with start larger than resNumber
            return {
                id: i,
                direct: mapping.structureStart <= resNumber, //true, if residue is in i-th mapping
                outOfRange: false
            };
        }
    }
    //residue is out of mapped range
    return {
        id: mappings.length,
        direct: false,
        outOfRange: true
    };
}

/**
 * Finds mapping containing given residue or closest mapping with start larger than unpNumber.
 * @param  {number} unpNumber Sequence index of residue.
 * @param  {FragmentMapping[]} mappings Sequence-structure mappings.
 */
function findIntervalIdByUniprotNumber(
    unpNumber: number,
    mappings: FragmentMapping[]
): FoundInterval {
    for (let i = 0; i < mappings.length; ++i) {
        const mapping = mappings[i];
        if (
            (mapping.sequenceStart <= unpNumber && unpNumber <= mapping.sequenceEnd) ||
            mapping.sequenceStart > unpNumber
        ) {
            //residue is in i-th mapping or i-th mapping is the closest mapping with start larger than unpNumber
            return {
                id: i,
                direct: mapping.sequenceStart <= unpNumber, //true, if residue is in i-th mapping
                outOfRange: false
            };
        }
    }
    //residue is out of mapped range
    return {
        id: mappings.length,
        direct: false,
        outOfRange: true
    };
}

type FoundInterval = {
    readonly id: number;
    readonly direct: boolean;
    readonly outOfRange: boolean;
};
