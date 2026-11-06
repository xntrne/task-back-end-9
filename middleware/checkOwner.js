export function checkOwner(Model, { label, ownerField = "user" }) {
  return async (req, res, next) => {
    const resource = await Model.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: `${label} not found` });
    }

    if (!resource[ownerField]?.equals(req.user._id)) {
      const action = req.method === "DELETE" ? "delete" : "update";

      return res
        .status(403)
        .json({ error: `you are not authorized to ${action} this ${label}` });
    }

    req.resource = resource;
    next();
  };
}
