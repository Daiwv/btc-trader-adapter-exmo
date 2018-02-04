"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class ExmoAdapter {
    pairs() {
        return __awaiter(this, void 0, void 0, function* () {
            return Object.keys(yield this.pairSettings());
        });
    }
    markets(pairs) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {};
            for (const pairName of Object.keys(pairs)) {
                result[pairName.toLowerCase()] = this.market(pairName);
            }
            return result;
        });
    }
    activeOrders() {
        throw new Error("Not implemented");
    }
    trade() {
        throw new Error("Not implemented");
    }
    market(pair) {
        return __awaiter(this, void 0, void 0, function* () {
            pair = pair.toUpperCase();
            const msg = yield fetch("https://api.exmo.com/v1/order_book/?pair=" + pair);
            if (msg.status !== 200) {
                throw new Error(yield msg.text());
            }
            const data = yield msg.json();
            return {
                buy: data[pair].bid.map((b) => ({
                    rate: b[0],
                    amount: b[1],
                })),
                sell: data[pair].ask.map((b) => ({
                    rate: b[0],
                    amount: b[1],
                })),
            };
        });
    }
    tickers(pairs) {
        return __awaiter(this, void 0, void 0, function* () {
            pairs = pairs.map((p) => p.toLowerCase());
            const msg = yield fetch("https://api.exmo.com/v1/ticker/");
            if (msg.status !== 200) {
                throw new Error(yield msg.text());
            }
            const ticker = yield msg.json();
            const data = {};
            Object.keys(ticker).map((tick) => tick)
                .filter((tick) => pairs.indexOf(tick.toLowerCase()) > -1).map((tick) => {
                data[tick.toLowerCase()] = {
                    avg: ticker[tick].avg,
                    high: ticker[tick].high,
                    low: ticker[tick].low,
                    last: ticker[tick].last_trade,
                    updated: ticker[tick].updated,
                    volume: ticker[tick].vol,
                    volumeCurrency: ticker[tick].vol_curr,
                };
            });
            return data;
        });
    }
    pair(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.pairSettings();
            const p = data[name.toUpperCase()];
            const info = {
                decimal: 4,
                fee: 0.2,
                maxPrice: p.max_price,
                minPrice: p.min_price,
                minAmount: p.min_amount,
                name: name.toLowerCase(),
            };
            return info;
        });
    }
    pairSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settings) {
                const msg = yield fetch("https://api.exmo.com/v1/pair_settings/");
                if (msg.status !== 200) {
                    throw new Error(yield msg.text());
                }
                const data = yield msg.json();
                this.settings = data;
            }
            return this.settings;
        });
    }
}
exports.default = ExmoAdapter;
