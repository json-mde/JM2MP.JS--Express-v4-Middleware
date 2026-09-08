/**
 * @author Luis Maria CAMARA ROSSI
 * @copyright Universidad Nacional de Educación a Distancia (U.N.E.D.) 2026
 * @license BSD-3-Clause
 * @file
 * The module [middleware]{@link module:jm2mp/api/express/v4/middleware}
 * implements the **middleware** to use the _projection language_ `JM2MP`
 * into `Express.js v4` _web applications_ and _API services_.
**/

/**
 * @module jm2mp/api/express/v4/middleware
 * @description
 * This module implements the **middleware** to use the _projection
 * language_ `JM2MP` into `Express.js v4` _web applications_ and _API
 * services_.
 * 
 * ### HTTP Contract
 * 
 * The HTTP client sends a **request** which body must have a header
 * `Content-Type: application/json` and contains the  _source document_
 * to project.
 * 
 * The name of the _projection document_ to apply must be specified, in
 * the following order, from: 1) the `:projection`
 * ({@link DEFAULT_JM2MP_PARAMETER_NAME}) path parameter,
 * 2) the `X-JM2MP-Projection` ({@link DEFAULT_JM2MP_REQUEST_HEADER})
 * request header, or 3) the `?projection=` field from the _query string_.
 * 
 * The _resultant document_ will be returned into the **response**.
 *
 * ### Loading Projection Modules
 * 
 * All _projection modules_ must be located in a `baseDir`
 * directory from server disk.
 * 
 * The `JM2MP.createFileLoader({ baseDir })` is used from `JM2MP.JS`
 * library to ensure:
 * 
 * - Each _projection module_ is a valid JSON file inside
 *   {@link PROJECTIONS_DIR}.
 * - Every declared dependency within `$depends-on` will be resolved
 *   within {@link PROJECTIONS_DIR} base directory path.
 * - The _source document_ will be treat as read-only, ensuring
 *   referential transparency by the evaluator.
 * 
 * ### Main differences between versions 4 and 5 of Express.js
 * 
 * `Express.js v4` does not catch from promises returned by `async`
 * handlers.
 * 
 * Due to that, this _middleware_ it is wrapped inside the
 * {@link MakeHandlerAsync} function, which returns
 * `Promise.resolve(fn(...)).catch(next)`. Without this wrapper,
 * any asynchronous error (non-existent projection, ill-formed JSON,
 * evaluation error, ...) will hang the _request_ until the _timeout_
 * expires.
**/

/* ------------------------------------------------------------------ */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
//// import * as express from 'express';
import * as JM2MP from '@json-mde/jm2mp';

/* ------------------------------------------------------------------ */

/**
 * @constant {string}
 * @description
 * The parameter name used for projections.
 * 
 * Constant string value of `projection`.
**/
export const DEFAULT_JM2MP_PARAMETER_NAME = 'projection';

/* ------------------------------------------------------------------ */

/**
 * @constant {string}
 * @description
 * The parameter name used for projections.
 * 
 * Constant string value of `projection`.
**/
export const DEFAULT_JM2MP_REQUEST_HEADER = 'X-JM2MP-Projection';

/* ------------------------------------------------------------------ */

/**
 * @constant {string}
 * @description
 * The root directory where all _projection documents_ and _modules_
 * must be contained.
 * 
 * It is calculated once, during initial module loading.
 * 
 * It could be overwritten using _environment variables_, but it is
 * constant during entire process lifecycle.
**/
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ */

/**
 * @constant {string}
 * @description
 * The absolte path to the root directory that will contain all
 * _projection documents_ and _modules_.
**/
export const PROJECTIONS_DIR = path.resolve(
  process.env.PROJECTIONS_DIR ?? path.join(__dirname, "../projections"),
);

/* ------------------------------------------------------------------ */

/**
 * @description
 * Async wrapper for Express.js v4 middleware.
 * 
 * Because `Express.js v4` only processes error propagated using
 * `next(err)`, this function wraps any rejected promise into a
 * `next` call, delegating to the Express' pipeline such errors.
 * @param {Function} fn
 * Async middleware daisychaining.
 * @returns {Promise<express.RequestHandler>}
 * It resolves `Promise<fn>` and catches any raised exception.
**/
function MakeHandlerAsync(fn)
{
  /** @type {Promise<express.RequestHandler>} */
  return function(req, res, next)
  {
    Promise.resolve(fn(req, res, next)).catch(next);
  }
};

/* ------------------------------------------------------------------ */

/**
 * @description
 * It maps JM2MP domain exceptions toward standard HTTP error codes.
 * @param {*} err
 * The JM2MP domain exception to be returned.
 * @returns {integer}
 * The equivalent standard HTTP error code.
**/
function statusForError(err)
{
  // Projection not found or invalid JSON.
  if (err instanceof JM2MP.ResolutionError) { return 404; }
  // Projection ill-formed.
  else if (err instanceof JM2MP.ValidationError) { return 400; }
  // Syntax not supported.
  else if (err instanceof JM2MP.AdapterError) { return 400; }
  // Runtime error.
  else if (err instanceof JM2MP.EvaluationError) { return 422; }
  // Any other kind of operational error.
  else if (err instanceof JM2MP.ProjectionError) { return 500; }
  // Any other kind of error.
  else { return 500; }
};

/* ------------------------------------------------------------------ */

/**
 * @description
 * It creates the actual _middleware_ for `Express.js v4` to
 * use `JM2MP` projections.
 * @param {object} [opts={}]
 * Options.
 * @param {string} [opts.baseDir=PROJECTIONS_DIR]
 * The root directory where all _projection documents_ and _modules_
 * must be found.
 * @param {string} [opts.paramName="projection"]
 * The name of the _route_ **param** used.
 * By default, {@link DEFAULT_JM2MP_PARAMETER_NAME}.
 * @param {AdapterRegistry} [opts.registry] -
 * The [AdapterRegistry]{@link JM2MP.AdapterRegistry} to use.
 * By default, if no registry is specified, a new _default registry_
 * is created (which only accepts syntax from the `native` _query
 * language_).
 * @returns {Promise<express.RequestHandler>}
**/
export async function Create(opts = {})
{
  // It processes every option or uses their default value.
  const baseDir   = opts.baseDir   ?? PROJECTIONS_DIR;
  const paramName = opts.paramName ?? DEFAULT_JM2MP_PARAMETER_NAME;
  const registry  = opts.registry  ?? await JM2MP.createAdapterRegistry();

  // The module-loader is only created once and reused in every request.
  // Projection files are re-read from disk in every request because
  // internal resolver will catch them inside every evaluation.
  const loader = await JM2MP.createFileLoader({
    baseDir,
    encoding: "utf8",
  });

  return MakeHandlerAsync(async (req, res) => {
    // Step 1: it determines which projection to apply.
    const projectionName =
      req.params[paramName] ??
      req.get(DEFAULT_JM2MP_REQUEST_HEADER) ??
      (((typeof req.query.projection) === "string")
       ? req.query[DEFAULT_JM2MP_PARAMETER_NAME]
       : null);

    if (!projectionName || ((typeof projectionName) !== "string"))
    {
      const err = new Error(
        "No projection has been specified! " +
        `(it must be used the param path, the request header '${DEFAULT_JM2MP_REQUEST_HEADER}' ` +
        `or the '${DEFAULT_JM2MP_PARAMETER_NAME}' query string).`,
      );
      err.status = 400;
      throw err;
    }

    // Step 2: the request body must be parsed using `express.json()`,
    // which must be previously configured.
    // Any JSON value will be accepted as source document (null, scalar,
    // array or object).
    // If no `req.body` were actually specified, by default `Express.js
    // v4` will use an empty object `{}` which is a valid JSON value and
    // it will be used as is.
    const document = req.body;
    console.debug(`source document (${(typeof document)}) => ${JSON.stringify(document)}`);

    // Step 3: the JM2MP.JS pipeline is executed:
    // resolve --> validate --> evaluate.
    let result;
    try
    {
      result = await JM2MP.project({
        rootName: projectionName,
        loader,
        document,
        registry,
      });
    }
    catch (cause)
    {
      // It enrich the error with a corresponding HTTP status code.
      cause.status = statusForError(cause);
      throw cause;
    }

    // Step 4: it returns the resultant document as JSON using
    // `res.json()`, which serializes any valid JSON value.
    res.status(200).json(result);
  });
}

/* ------------------------------------------------------------------ */

/**
 * @type {express.ErrorRequestHandler}
 * @description
 * Error handler for `Express.js v4` using the four-parameter variant.
 * 
 * It must be `use` after the {@link Create}'d _middleware_ to transform
 * any JM2MP's domain error into an appropiated JSON response.
**/
// eslint-disable-next-line no-unused-vars
export function ErrorHandler(err, req, res, next)
{
  const status = err.status ?? statusForError(err);
  res.status(status).json({
    error: err.name ?? "Error",
    message: err.message,
    // The `cause` is serialized as a string to avoid filtering internal
    // objects, trying to preserve full logic trace.
    cause: err.cause ? String(err.cause.message ?? err.cause) : undefined,
  });
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* End of file: ${JM2MP.JS--Express-v4-Middleware}/src/middleware.js  */
