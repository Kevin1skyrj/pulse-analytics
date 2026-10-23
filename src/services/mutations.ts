import { z } from "zod";
import {
  ruleInput,
  ruleSchema,
  incidentSchema,
  infoSchema,
  type Rule,
  type Simulation,
} from "../../shared/contracts";
import { request } from "./api";

export const saveRule = (rule: Rule | null, value: z.infer<typeof ruleInput>) =>
  request(rule ? `/rules/${rule.id}` : "/rules", ruleSchema, {
    method: rule ? "PUT" : "POST",
    body: JSON.stringify(value),
  });
export const toggleRule = (rule: Rule) =>
  request(`/rules/${rule.id}`, ruleSchema, {
    method: "PUT",
    body: JSON.stringify({ ...rule, enabled: !rule.enabled }),
  });
export const transitionIncident = ({
  id,
  state,
}: {
  id: string;
  state: "acknowledged" | "resolved";
}) =>
  request(`/incidents/${id}`, incidentSchema, {
    method: "PATCH",
    body: JSON.stringify({ state }),
  });
export const updateSimulation = (value: Simulation) =>
  request("/simulation", infoSchema, {
    method: "PATCH",
    body: JSON.stringify(value),
  });
export const loadDataset = (size: number) =>
  request("/dataset", z.object({ size: z.number() }), {
    method: "POST",
    body: JSON.stringify({ size }),
  });
