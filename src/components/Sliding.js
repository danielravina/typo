import React, { useMemo } from "react";
import classnames from "classnames";
import useAppContext from "../hooks/useAppContext";

export default function ({ children }) {
  return (
    <div className="animated slideInDown slideOutUpd sliding">{children}</div>
  );
}
