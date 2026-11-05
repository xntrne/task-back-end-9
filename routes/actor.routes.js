import express from "express";
import { checkAuth } from "../middleware/checkAuth.js";
import { checkOwner } from "../middleware/checkOwner.js";
import { removeUploadedFile, upload } from "../middleware/upload.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { Actor } from "../models/Actor.js";
import { Movie } from "../models/Movie.js";
import { createActorSchema, updateActorSchema } from "../validation-schemas/actor.schema.js";

export const actorRouter = express.Router();

const checkActorOwner = checkOwner(Actor, { label: "actor", ownerField: "createdBy" });

// GET /api/actors - list actors, optionally filtered by name
actorRouter.get("/", async (req, res) => {
  const actors = await Actor.searchByName(String(req.query.search ?? ""));

  res.json({ data: actors });
});

// GET /api/actors/:id - one actor with their filmography
actorRouter.get("/:id", validateObjectId(), async (req, res) => {
  const actor = await Actor.findById(req.params.id).populate({
    path: "movies",
    select: "title year image",
    options: { sort: { year: -1 } },
  });

  if (!actor) {
    return res.status(404).json({ error: "actor not found" });
  }

  res.json({ data: actor });
});

// POST /api/actors - create an actor with up to 5 photos (the creator becomes the owner)
actorRouter.post(
  "/",
  checkAuth,
  upload.array("images", 5),
  validateBody(createActorSchema),
  async (req, res) => {
    const images = (req.files ?? []).map((file) => file.filename);

    const actor = await Actor.create({
      name: req.body.name,
      birthdate: req.body.birthdate ?? null,
      images,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "actor created successfully",
      data: actor,
    });
  },
);

// PATCH /api/actors/:id - only the creator may update details or replace the photo list
actorRouter.patch(
  "/:id",
  checkAuth,
  validateObjectId(),
  checkActorOwner,
  upload.array("images", 5),
  validateBody(updateActorSchema),
  async (req, res) => {
    const actor = req.resource;
    const oldImages = [...actor.images];

    actor.set(req.body);

    if (req.files?.length) {
      actor.images = req.files.map((file) => file.filename);
    }

    await actor.save();

    if (req.files?.length) {
      oldImages.forEach(removeUploadedFile);
    }

    res.json({
      message: "actor updated successfully",
      data: actor,
    });
  },
);

// DELETE /api/actors/:id - only the creator may delete; pulls the actor from every movie
actorRouter.delete("/:id", checkAuth, validateObjectId(), checkActorOwner, async (req, res) => {
  const actor = await Actor.findByIdAndDelete(req.params.id);

  await Movie.updateMany({ actors: actor._id }, { $pull: { actors: actor._id } });

  actor.images.forEach(removeUploadedFile);

  res.json({ message: "actor deleted successfully" });
});
