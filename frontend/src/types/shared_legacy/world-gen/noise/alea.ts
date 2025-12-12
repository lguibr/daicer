/**
 * Alea PRNG (Pseudo-Random Number Generator)
 * Based on Johannes Baagøe's algorithm
 * Provides deterministic random numbers from a seed
 */

export function Alea(...args: (string | number)[]): () => number {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  const mash = (): ((data: string | number) => number) => {
    let n = 0xefc8249d;
    return (data: string | number) => {
      const str = String(data);
      for (let i = 0; i < str.length; i += 1) {
        n += str.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        let h = 0.02519603282416938 * n;
        // eslint-disable-next-line no-bitwise
        n = h >>> 0;
        h -= n;
        h *= n;
        // eslint-disable-next-line no-bitwise
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000;
      }
      // eslint-disable-next-line no-bitwise
      return (n >>> 0) * 2.3283064365386963e-10;
    };
  };

  const masher = mash();
  s0 = masher(' ');
  s1 = masher(' ');
  s2 = masher(' ');

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== undefined) {
      s0 -= masher(args[i] as string | number);
      if (s0 < 0) s0 += 1;
      s1 -= masher(args[i] as string | number);
      if (s1 < 0) s1 += 1;
      s2 -= masher(args[i] as string | number);
      if (s2 < 0) s2 += 1;
    }
  }

  return () => {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10;
    s0 = s1;
    s1 = s2;
    // eslint-disable-next-line no-bitwise
    c = t | 0;
    s2 = t - c;
    return s2;
  };
}
