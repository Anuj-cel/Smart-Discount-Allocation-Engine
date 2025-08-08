const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    } else {
      const result = fn.apply(null, args);
      cache[key] = result;
      return result;
    }
  };
};

module.exports = memoize;