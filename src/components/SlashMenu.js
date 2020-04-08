import React from "react";
import classnames from "classnames";
import useAppContext from "../hooks/useAppContext";
import "../styles/slash-menu.scss";

export default function () {
  const { menuMode } = useAppContext();
  return (
    <div className={classnames("slash-menu", { active: menuMode })}>Hello</div>
  );
}
