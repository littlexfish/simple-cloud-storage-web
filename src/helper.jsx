import {useEffect, useRef, useState} from "react";

export function useForceUpdate() {
  const [tick, setTick] = useState(0);
  const updateCallback = useRef(() => {});

    useEffect(() => {
        updateCallback.current();
        updateCallback.current = () => {};
    }, [tick]);

  return (callback = () => {}) => {
      updateCallback.current = callback;
      setTick(tick => tick + 1);
  }
}

/**
 *
 * @param initialValue
 * @return {[*, *, *]} first value is the current state, second value is the last state, third value is the setter
 */
export function useStateWithRecord(initialValue) {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(initialValue);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [state, stateRef.current, (v) => {
    setState(last => {
        stateRef.current = state;
        if (typeof v === 'function') {
            return v(last);
        }
        else {
            return v;
        }
    });
  }];
}

export function useComponentDidMount(callback) {
    useEffect(() => {
        callback();
    }, []);
}

/**
 * This hook is used to call a function when the component is updated.
 * @param props The props of the component
 * @param callback {function(prevProps: *)} The function to call when the component is updated
 */
export function useComponentDidUpdate(props, callback) {
  const store = useRef(props);
    useEffect(() => {
        if (store.current !== props) {
            callback(store.current);
            store.current = props;
        }
    }, [callback, props]);
}