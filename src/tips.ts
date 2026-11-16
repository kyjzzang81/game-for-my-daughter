import { Capacitor, registerPlugin } from '@capacitor/core';

/* 커피 한 잔 후원. iOS 앱에서는 ios/App/App/TipJarPlugin.swift(StoreKit 2)가 처리해요.
   웹에서는 결제가 없어서 '앱에서만 할 수 있어요'라고만 보여 줘요.
   App Store Connect에 같은 ID로 '소모성' 인앱 구매 상품을 만들어야 해요 (RELEASE.md 참고) */
export const TIPS = [
  { id: 'com.yujeong.fairyplayground.tip.coffee', emoji: '☕', name: '커피 한 잔', fallback: '₩2,200' },
  { id: 'com.yujeong.fairyplayground.tip.cake', emoji: '🍰', name: '케이크 한 쪽', fallback: '₩4,400' },
  { id: 'com.yujeong.fairyplayground.tip.big', emoji: '🎁', name: '큰 응원', fallback: '₩9,900' },
] as const;

export type TipStatus = 'success' | 'cancelled' | 'pending' | 'failed';

interface TipJarPlugin {
  getProducts(o: { ids: string[] }): Promise<{ products: { id: string; price: string }[] }>;
  purchase(o: { id: string }): Promise<{ status: TipStatus }>;
}
const TipJar = registerPlugin<TipJarPlugin>('TipJar');

export const canTip = () => Capacitor.getPlatform() === 'ios';

/* 스토어에 등록된 가격(기기 통화로)을 받아 와요. 받지 못한 상품은 빠져요 */
export async function loadPrices(): Promise<Record<string, string>> {
  if (!canTip()) return {};
  try {
    const { products } = await TipJar.getProducts({ ids: TIPS.map(t => t.id) });
    return Object.fromEntries(products.map(p => [p.id, p.price]));
  } catch { return {}; }
}

export async function buyTip(id: string): Promise<TipStatus> {
  if (!canTip()) return 'failed';
  try { return (await TipJar.purchase({ id })).status; } catch { return 'failed'; }
}
