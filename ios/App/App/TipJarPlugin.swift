import Foundation
import Capacitor
import StoreKit

/* 커피 한 잔 후원 (소모성 인앱 구매). 외부 SDK 없이 StoreKit 2만 써요.
   팁은 아무 기능도 열지 않아요. 결제가 끝나면 거래를 바로 마무리(finish)해요. */
@objc(TipJarPlugin)
public class TipJarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TipJarPlugin"
    public let jsName = "TipJar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
    ]

    private var products: [String: Product] = [:]
    private var updates: Task<Void, Never>?

    public override func load() {
        // 앱 밖에서 끝난 결제(승인 대기 후 승인 등)도 마무리해요
        updates = Task {
            for await result in Transaction.updates {
                if case .verified(let t) = result { await t.finish() }
            }
        }
    }

    deinit { updates?.cancel() }

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let list = try await Product.products(for: ids)
                list.forEach { products[$0.id] = $0 }
                let out = list.sorted { $0.price < $1.price }.map { ["id": $0.id, "price": $0.displayPrice] }
                call.resolve(["products": out])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let product = products[id] else {
            call.reject("상품을 찾을 수 없어요"); return
        }
        Task {
            do {
                switch try await product.purchase() {
                case .success(let result):
                    if case .verified(let t) = result {
                        await t.finish()
                        call.resolve(["status": "success"])
                    } else {
                        call.resolve(["status": "failed"])
                    }
                case .userCancelled: call.resolve(["status": "cancelled"])
                case .pending: call.resolve(["status": "pending"])
                @unknown default: call.resolve(["status": "failed"])
                }
            } catch {
                call.resolve(["status": "failed"])
            }
        }
    }
}

/* 앱 안에 들어 있는 플러그인을 등록하는 화면 */
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(TipJarPlugin())
    }
}
