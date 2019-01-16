# EJVM

Express middleware written in Typescript for validating request-payloads against JSON schemas.

[![Build Status](https://travis-ci.com/MrSchneepflug/ejvm.svg?branch=master)](https://travis-ci.com/MrSchneepflug/ejvm)
[![Coverage Status](https://coveralls.io/repos/github/MrSchneepflug/ejvm/badge.svg?branch=master)](https://coveralls.io/github/MrSchneepflug/ejvm?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/MrSchneepflug/ejvm.svg)](https://greenkeeper.io/)

The motivation for building this library were these constraints:
1. It should be written in **Typescript**
2. It should use the **current JSON schema** standard
3. It should be as **simple as possible**
4. It should have **reasonable defaults**

## Installation

```sh
yarn add ejvm
```

> **Note:**
> The middleware expects the `req.body` property to contain proper JSON.
> Use the [body-parser](https://github.com/expressjs/body-parser) middleware to handle this for you.
> Keep in mind that you **must** include the content-type header `Content-Type: application/json` in
> your requests.

## Usage

### Example application

This library includes a documented example application at `src/example`. To run it, clone the repository,
install the dependencies and start the application:
```sh
$ git clone https://github.com/MrSchneepflug/ejvm
$ cd ejvm
$ yarn install
$ yarn example
```

Example request with `curl`:

```sh
curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"name": "some name"}' \
    http://localhost:3000/persons
```

```sh
{"success":true}
```

### Simple Example

Lets say you want to build a CRUD interface for persons. To add a new person you would POST a JSON payload describing a person to a `/persons` endpoint.

First thing is to describe the desired schema for the person-payload.
See http://json-schema.org/ for an in-depth explanation.  

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://example.com/schemas/person.json",
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number"
    }
  }
}
```

Put this schema definition either in a separate `.json` file or directly in your code.

```js
// load schema from separate file ...
const schema = JSON.parse(fs.readFileSync("/path/to/schema.json", "utf8"));

// ... or define schema directly in your code.
const schema = {
     "$schema": "http://json-schema.org/draft-07/schema#",
     "$id": "http://example.com/schemas/person.json",
     "type": "object",
     [...]
 };
```

You need to import the `validate` and `isJsonSchemaValidationError` functions. Also add the [body-parser](https://github.com/expressjs/body-parser) middleware.

```js
import {validate, isJsonSchemaValidationError} from "ejvm";
import bodyParser from "body-parser";
```

Use the [body-parser](https://github.com/expressjs/body-parser) middleware before any route definition:

```js
use(bodyParser.json());
```

Use the schema to create a new validation-middleware by calling the `validate` function.

```js
app.post("/persons", validate(schema), (req: Request, res: Response): void => {
    // logic to store the person
});
```

Lastly, in order to catch the validation-errors you need to have an error-handler in place:

```js
app.use((err: Error | JsonSchemaValidationError, req: Request, res: Response, next: NextFunction): void => {
    if (isJsonSchemaValidationError(err)) {
        // handle the error here
    } else {
        next();
    }
});
```

To actually add a new person you need to include valid JSON with a `name` and optionally an `age` property. Example request with `curl`:

```sh
curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"name": "some name", "age": 65}' \
    http://localhost:3000/persons
```

## Tests

```sh
$ yarn install
$ yarn test
```
