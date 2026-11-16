// Lets node import the project's TypeScript modules in tests: adds ".ts" to extensionless relative imports.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[cm]?[jt]s$/.test(specifier)) return nextResolve(specifier + ".ts", context);
    throw e;
  }
}
