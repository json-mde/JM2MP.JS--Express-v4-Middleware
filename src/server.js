/**
 * @author Luis Maria CAMARA ROSSI
 * @copyright Universidad Nacional de Educación a Distancia (U.N.E.D.) 2026
 * @license BSD-3-Clause
 * @file
 * The module [server]{@link module:jm2mp/api/express/v4/server}
 * implements a sample **server** to use the _projection language_
 * `JM2MP` into `Express.js v4` _web applications_ and _API services_.
**/

/**
 * @module jm2mp/api/express/v4/server
 * @description
 * This module implements a sample **server** to use the _projection
 * language_ `JM2MP` into `Express.js v4` _web applications_ and _API
 * services_.
**/

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */

import * as process from 'node:process';
import express from 'express';
import morgan from 'morgan';
import * as JM2MP_Express_v4_Middleware from './middleware.js';

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */

/**
 * @description
 * Ejemplo de cómo configurar una aplicación en Express v4
 * con el middleware JM2MP sobre una ruta concreta. *
 * @param {object} [opts] -
 * *param {Parameters<typeof JM2MP_CreateMiddleware>[0]} [opts]
 * @returns {express.Express} The sample Express application.
 */
export async function createApp(opts = {})
{
  //
  const app = express();
  //
  app.use(morgan('dev'));
  //
  app.use(express.json({ strict:false, limit:'25mb' }));
  //
  const middleware = await JM2MP_Express_v4_Middleware.Create(opts);
  //
  app.post(`/project/:${JM2MP_Express_v4_Middleware.DEFAULT_JM2MP_PARAMETER_NAME}`, middleware);
  //
  app.post("/project", middleware); // proyección vía header o query
  //
  app.use(JM2MP_Express_v4_Middleware.ErrorHandler);
  //
  return app;
}

/* ------------------------------------------------------------------ */

// Main entry point.
{
  //
  const SERVER_PORT = process.env.PORT || 3000;
  //
  const app = await createApp();
  //
  app.listen(SERVER_PORT);
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* End of file: ${JM2MP.JS--Express-v4-Middleware}/src/server.js      */
