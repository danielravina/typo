import React, { useState } from "react";

const InputContext = React.createContext();

function InputProvider({ children }) {
  const [query, setQuery] = useState("");

  return (
    <InputContext.Provider value={{ query, setQuery }}>
      {children}
    </InputContext.Provider>
  );
}

export default InputContext;
export { InputProvider };
