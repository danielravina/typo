import React, { useMemo } from "react";
import classnames from "classnames";
import useAppContext from "../hooks/useAppContext";

export default React.forwardRef(({ modeKey, children }, ref) => {
  const { currentMode } = useAppContext();

  const active = useMemo(() => {
    if (!currentMode) return false;

    return currentMode.key === modeKey;
  }, [currentMode, modeKey]);

  return (
    <div ref={ref} className={classnames("sliding", { active })}>
      {children}
    </div>
  );
});
