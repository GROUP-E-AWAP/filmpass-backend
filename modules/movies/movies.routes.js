import { Router } from "express";
import {
  listMoviesController,
  movieDetailsController
} from "./movies.controller.js";

const router = Router();

/**
 * GET /movies
 * Returns a list of all movies.
 */
router.get("/", listMoviesController);

/**
 * GET /movies/:id
 * Returns detailed info about a specific movie,
 * optionally filtered by theaterId (handled in controller).
 */
router.get("/:id", movieDetailsController);

export default router;
