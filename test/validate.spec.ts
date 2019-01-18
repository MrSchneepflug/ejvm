import {validate, isJsonSchemaValidationError} from "../src/validate";
import chai, {expect} from "chai";
import chaiHttp from "chai-http";
import express, {Request, Response, NextFunction, Express} from "express";
import bodyParser from "body-parser";
import {readFileSync} from "fs";

chai.use(chaiHttp);

describe("integration", () => {
    let app: Express;

    before(() => {
        function loadSchema(path: string): Object {
            return JSON.parse(readFileSync(path, {encoding: "utf8"}));
        }

        const exampleSchema = loadSchema("./test/schemas/example.json");
        const personSchema = loadSchema("./test/schemas/person.json");
        const personPropertiesSchema = loadSchema("./test/schemas/person-properties.json");

        app = express();
        app.use(bodyParser.json());

        app.post("/test/example", validate(exampleSchema), (req: Request, res: Response) => {
            res.send({success: true});
        });

        app.post("/test/allErrors", validate(exampleSchema, {allErrors: true}), (req: Request, res: Response) => {
            res.send({success: true});
        });

        app.post("/test/additionalSchemas", validate(personSchema, [personPropertiesSchema]), (req: Request, res: Response) => {
            res.send({success: true});
        });

        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if (isJsonSchemaValidationError(err)) {
                res.send({
                    success: false,
                    validationErrors: err.validationErrors
                });
            } else {
                next(err);
            }
        });
    });

    it("will allow valid json payload", (done) => {
        chai.request(app)
            .post("/test/example")
            .send({name: "some string", age: 65})
            .end((err, res) => {
                expect(res.body).to.deep.equal({success: true});
                done();
            });
    });

    it("will include error description for invalid property", (done) => {
        chai.request(app)
            .post("/test/example")
            .send({})
            .end((err, res) => {
                expect(res.body.validationErrors).to.deep.include({
                    keyword: "required",
                    dataPath: "",
                    schemaPath: "#/required",
                    params: {
                        missingProperty: "name"
                    },
                    message: "should have required property 'name'"
                });

                done();
            });
    });

    describe("ajv", () => {
        it("will be configurable (e.g. allErrors = true)", (done) => {
            chai.request(app)
                .post("/test/allErrors")
                .send({age: "sixty-five"})
                .end((err, res) => {
                    expect(res.body.validationErrors).to.deep.include({
                        keyword: "required",
                        dataPath: "",
                        schemaPath: "#/required",
                        params: {
                            missingProperty: "name"
                        },
                        message: "should have required property 'name'"
                    });

                    expect(res.body.validationErrors).to.deep.include({
                        dataPath: ".age",
                        keyword: "type",
                        message: "should be number",
                        params: {
                            type: "number"
                        },
                        schemaPath: "#/properties/age/type"
                    });

                    done();
                });
        });

        it("will accept additional referenced schemas", (done) => {
            chai.request(app)
                .post("/test/additionalSchemas")
                .send({name: "some string", age: 65})
                .end((err, res) => {
                    expect(res.body).to.deep.equal({success: true});
                    done();
                });
        })
    });
});
