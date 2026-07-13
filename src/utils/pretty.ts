import { latexToUnicode } from "@devhub-io/latex-to-unicode";

export function pretty(input: string) {
  let prettyOutput = input;

  prettyOutput = prettyOutput.replace(" — ", " - ").replace("—", "-");
  prettyOutput = latexToUnicode(prettyOutput);

  return prettyOutput;
}
