import { performance } from "node:perf_hooks";
import { generateEvents, eventPage, summarize } from "../server/data.js";
for (const size of [5000, 100000]) {
  const begin = performance.now(),
    events = generateEvents(size),
    generated = performance.now() - begin;
  const samples: number[] = [];
  for (let i = 0; i < 12; i++) {
    const start = performance.now();
    eventPage(
      events,
      new URLSearchParams("severity=error&sort=duration&size=100"),
    );
    summarize(events, 24);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  console.log(
    JSON.stringify({
      size,
      generationMs: +generated.toFixed(2),
      filterSortAggregateMedianMs: +((samples[5] + samples[6]) / 2).toFixed(2),
      filterSortAggregateP95Ms: +samples[11].toFixed(2),
      maxPageRows: 500,
      node: process.version,
      platform: process.platform,
    }),
  );
}
