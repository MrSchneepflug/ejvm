import express, {Request, Response, NextFunction} from "express";
import bodyParser from "body-parser";
import {readFileSync} from "fs";
import {validate, isJsonSchemaValidationError, JsonSchemaValidationError} from "../validate";

const app = express();

// Use the body-parser middleware. Keep in mind that you must include
// the "Content-Type: application/json" header in your requests.
app.use(bodyParser.json());

// Load schema files. You could also embed the schemas in your code. This is just personal preference.
const personSchema = JSON.parse(readFileSync("src/example/schemas/person.json", "utf8"));
const employeeSchema = JSON.parse(readFileSync("src/example/schemas/employee.json", "utf8"));

// A simple request-handler which just returns a success-response.
const requestHandler = (req: Request, res: Response) => res.json({success: true});

// The most basic form of schema validation. Validates the request-body against `personSchema`.
app.post("/persons", validate(personSchema), requestHandler);

// Configure Ajv. Returns all errors within the response in this case.
app.put("/persons/:id", validate(personSchema, {allErrors: true}), requestHandler);

// Add additional schemas as array when you have schemas with references.
app.post("/employees", validate(employeeSchema, [personSchema]), requestHandler);

// Configure Ajv with the last parameter when you have additional schemas.
app.put("/employees/:id", validate(employeeSchema, [personSchema], {allErrors: true}), requestHandler);

// Add an error-handler. Use the `isJsonSchemaValidationError`-function to check for specific errors passed by the middleware.
app.use((err: JsonSchemaValidationError | Error, req: Request, res: Response, next: NextFunction): void => {
    if (isJsonSchemaValidationError(err)) {
        console.log(err.validationErrors);
        res.json({success: false});
    } else {
        next();
    }
});

app.listen(3000, () => {
    console.log("Example application now running at http://localhost:3000\n\n")
});
