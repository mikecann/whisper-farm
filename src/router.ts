import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute(["/home", `/`]),
  workers: defineRoute(["/workers"]),
});
