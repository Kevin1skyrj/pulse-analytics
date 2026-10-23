import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { capabilitiesSchema } from "../../shared/contracts";

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      z.object({ message: z.string() }).safeParse(body).data?.message ||
        `Request failed (${response.status})`,
    );
  return schema.parse(body);
}
export function useApi<T>(path: string, schema: z.ZodType<T>, poll = false) {
  return useQuery({
    queryKey: [path],
    queryFn: ({ signal }) => request(path, schema, { signal }),
    refetchInterval: poll ? 10000 : false,
    staleTime: 5000,
    retry: 1,
  });
}
export function useCapabilities() {
  return useApi("/capabilities", capabilitiesSchema);
}
