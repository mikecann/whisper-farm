import * as React from "react";
import { HTMLProps } from "react";

export interface LinkProps extends HTMLProps<HTMLAnchorElement> {}

export const Link: React.FC<LinkProps> = ({ ...rest }) => {
  return <a {...rest} />;
};
