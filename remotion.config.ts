import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// The video reuses the website's components: same Tailwind CSS, same "@/" imports.
Config.overrideWebpackConfig((config) => {
  const withTailwind = enableTailwind(config);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        "@": path.join(process.cwd(), "src"),
      },
    },
    module: {
      ...withTailwind.module,
      rules: [
        ...(withTailwind.module?.rules ?? []),
        // The brand fonts in src/app/fonts, referenced from remotion/style.css.
        { test: /\.(otf|woff2)$/, type: "asset/resource" },
      ],
    },
  };
});
