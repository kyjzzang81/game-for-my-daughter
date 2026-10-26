/* 생성 스크립트가 Node에서 이야기 파일을 불러올 수 있게 하는 Phaser 대역.
   없는 속성·메서드는 무엇을 부르든 아무 일도 하지 않는 대역을 돌려줘요 */
function anything(): any {
  const p: any = new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.iterator ? function* () {} : k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : p),
    apply: () => p,
    construct: () => p,
  });
  return p;
}
class Base {
  constructor() {
    return new Proxy(this, {
      get: (t: any, k) => (k in t ? t[k] : typeof k === 'symbol' ? undefined : anything()),
    });
  }
}
export default {
  GameObjects: { Container: Base, GameObject: Base },
  Scene: Base,
  Math: { Clamp: (v: number, a: number, b: number) => Math.min(b, Math.max(a, v)) },
};
