import { ErrorResponse } from "../../../types/error-response";
import CategoryRenderer from "../renderers/category-renderer";

/**
 * This interface defines structure for basic data processors,
 * which are preparing data to be easily used later or passed
 * to protvista elements.
 */
export default interface Parser<T> {
    parse(uniprotId: string, data: T): Promise<CategoryRenderer[] | null>;
    readonly categoryName: string;
}

/**
 * Check if response is potentionally error.
 */
export function isErrorResponse(response: ErrorResponse | any): response is ErrorResponse {
    return (response as ErrorResponse).requestedURL !== undefined;
}
