const Router = require("koa-router");
const { jwt } = require("../middleware/auth");
const { getUserData } = require("./user");
const { getPersonalTimetable } = require("./timetable");
const { search } = require("./people");
const { loadOrFetch } = require("../redis");
const {
  getWorkspaces,
  getImage,
  getSeatingInfo,
  getAllSeatInfo,
} = require("./workspaces");
const { WORKSPACE_SUMMARY_PATH } = require("../redis/keys");
const { WORKSPACE_SUMMARY_TTL } = require("../redis/ttl");

module.exports = app => {
  const router = new Router();

  router.get("/user", jwt, async ctx => {
    ctx.body = await getUserData(ctx.state.user.apiToken);
  });

  router.get("/timetable", jwt, async ctx => {
    const date = ctx.query.date || null;
    ctx.body = await getPersonalTimetable(ctx.state.user.apiToken, date);
  });

  router.get("/search", jwt, async ctx => {
    ctx.assert(ctx.query.query);
    ctx.body = await search(ctx.query.query);
  });

  router.get("/workspaces/getimage/:id.png", jwt, async ctx => {
    ctx.assert(ctx.params.id, 400);
    ctx.response.headers["Content-Type"] = "image/png";
    ctx.state.jsonify = false;
    const res = await getImage(ctx.params.id);
    ctx.body = res.body;
  });

  router.get("/workspaces/summary", jwt, async ctx => {
    const data = await loadOrFetch(
      ctx,
      WORKSPACE_SUMMARY_PATH,
      async () => getAllSeatInfo(),
      WORKSPACE_SUMMARY_TTL,
    );
    ctx.body = data;
  });

  router.get("/workspaces/:id/seatinfo", jwt, async ctx => {
    ctx.assert(ctx.params.id, 400);
    ctx.body = await getSeatingInfo(ctx.params.id);
  });

  router.get("/workspaces", jwt, async ctx => {
    ctx.body = getWorkspaces();
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
};
