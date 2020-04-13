import { useEffect, useState, useContext, useCallback } from "react";

import { DefaultPubSubContext } from "usepubsub";
export default function (event) {
  const [key, setKey] = useState(null);
  const { subscribe, publish } = useContext(DefaultPubSubContext);

  useEffect(() => {
    subscribe(event, (key) => {
      setTimeout(() => {
        setKey(key);
      }, 0); // needed for https://github.com/facebook/react/issues/18178
    });
  }, []); //eslint-disable-line

  const press = useCallback(
    (key) => {
      publish(event, key);
      publish(event, null);
    },
    [event, publish]
  );

  return { key, press };
}
