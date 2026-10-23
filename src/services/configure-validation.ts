import { z } from "zod";

// Run before schema imports: avoid Zod's eval probe under the production CSP.
z.config({ jitless: true });
