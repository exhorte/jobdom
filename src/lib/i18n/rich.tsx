import { Fragment, type ReactNode } from "react";

import { t } from "./index";

/**
 * A text with elements in it: `rich("Make a hash with {command} and restart.",
 * { command: <code>hash-password</code> })`. The sentence is translated whole,
 * so the elements land where the language puts them; `{name}` stands for the
 * element of that name.
 */
export function rich(text: string, nodes: Record<string, ReactNode>): ReactNode {
  return t(text)
    .split(/(\{\w+\})/)
    .map((part, index) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1];
      return <Fragment key={index}>{name !== undefined && name in nodes ? nodes[name] : part}</Fragment>;
    });
}
