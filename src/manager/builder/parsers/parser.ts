import { ErrorResponse } from "../../../types/error-response";
import CategoryRenderer from "../renderers/category-renderer";
export default interface Parser<T> {
    parse(uniprotId: string, data: T): Promise<CategoryRenderer[] | null>;
    readonly categoryName: string;
}

export function isErrorResponse(response: ErrorResponse | any): response is ErrorResponse {
    return (response as ErrorResponse).requestedURL !== undefined;
}
