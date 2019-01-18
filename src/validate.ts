import Ajv, {ErrorObject, Options, ValidateFunction} from "ajv";
import {NextFunction, Request, RequestHandler, Response} from "express";

export function validate(schema: object, options?: Options): RequestHandler;
export function validate(schema: object, additionalSchemas?: object[], options?: Options): RequestHandler;
export function validate(
    schema: object,
    additionalSchemasOrOptions?: object[] | Options,
    options?: Options
): RequestHandler {
    let ajv;

    if (Array.isArray(additionalSchemasOrOptions)) {
        ajv = new Ajv(options);
        ajv.addSchema(additionalSchemasOrOptions);
    } else {
        ajv = new Ajv(additionalSchemasOrOptions);
    }

    const validateFunction: ValidateFunction = ajv.compile(schema);

    return (req: Request, res: Response, next: NextFunction): void =>
        validateFunction(req.body)
            ? next()
            : next(new JsonSchemaValidationError(validateFunction.errors));
}

export class JsonSchemaValidationError extends Error {
    public readonly name: string = "JsonSchemaValidationError";

    constructor(public validationErrors: ErrorObject[] | null | undefined) {
        super();
    }
}

export function isJsonSchemaValidationError(error: Error): error is JsonSchemaValidationError {
    return (error as JsonSchemaValidationError).name === "JsonSchemaValidationError";
}
