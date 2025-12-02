import { Router } from "express";
import {
  listMoviesByTheaterController,
  listTheatersController
} from "./theaters.controller.js";

const router = Router();

/**
 * GET /theaters
 * Returns all theaters.
 */
router.get("/", listTheatersController);

/**
 * GET /theaters/:id/movies
 * Returns all movies available in a specific theater.
 */
router.get("/:id/movies", listMoviesByTheaterController);

export default router;
