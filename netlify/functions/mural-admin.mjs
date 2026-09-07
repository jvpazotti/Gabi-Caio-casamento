import { service } from "../lib/runtime.mjs";
export default (request, context) => service(context).adminHandler(request);
