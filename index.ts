import {
    IExchangePublicApi, IExchangeTradeApi, IMarketParamResult,
    IPairInfo, ITickerValue,
} from "btc-trader";

export interface IPairSettings {
    min_quantity: number;
    max_quantity: number;
    min_price: number;
    max_price: number;
    max_amount: number;
    min_amount: number;
}
export interface ITicker {
    buy_price: number;
    sell_price: number;
    last_trade: number;
    high: number;
    low: number;
    avg: number;
    vol: number;
    vol_curr: number;
    updated: number;
}
class ExmoAdapter implements IExchangeTradeApi, IExchangePublicApi {
    protected settings: { [index: string]: IPairSettings };
    public async pairs() {
        return Object.keys(await this.pairSettings());
    }
    public async markets(pairs: string[]): Promise<{
        [index: string]: IMarketParamResult;
    }> {
        const result: any = {};
        for (const pairName of Object.keys(pairs)) {
            result[pairName.toLowerCase()] = this.market(pairName);
        }
        return result;
    }
    public activeOrders(): any {
        throw new Error("Not implemented");
    }
    public trade(): any {
        throw new Error("Not implemented");
    }
    public async market(pair: string): Promise<IMarketParamResult> {
        pair = pair.toUpperCase();
        const msg = await fetch("https://api.exmo.com/v1/order_book/?pair=" + pair);
        if (msg.status !== 200) {
            throw new Error(await msg.text());
        }
        const data = await msg.json();
        return {
            buy: data[pair].bid.map((b: any) => ({
                rate: b[0],
                amount: b[1],
            })),
            sell: data[pair].ask.map((b: any) => ({
                rate: b[0],
                amount: b[1],
            })),
        };
    }
    public async tickers(pairs: string[]) {
        const msg = await fetch("https://api.exmo.com/v1/ticker/");
        if (msg.status !== 200) {
            throw new Error(await msg.text());
        }
        const ticker: { [index: string]: ITicker } = await msg.json();
        const data: { [index: string]: ITickerValue } = {};
        Object.keys(ticker).map((tick) => tick)
            .filter((tick) => pairs.indexOf(tick.toLowerCase().replace("rub", "rur")) > -1).map((tick: string) => {
                data[tick.toLowerCase().replace("rub", "rur")] = {
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
    }
    public async pair(name: string) {
        const data = await this.pairSettings();
        const p: IPairSettings = data[name.toUpperCase()];
        const info: IPairInfo = {
            decimal: 4,
            fee: 0.2,
            maxPrice: p.max_price,
            minPrice: p.min_price,
            minAmount: p.min_amount,
            name: name.toLowerCase(),
        };
        return info;
    }
    protected async pairSettings() {
        if (!this.settings) {
            const msg = await fetch("https://api.exmo.com/v1/pair_settings/");
            if (msg.status !== 200) {
                throw new Error(await msg.text());
            }
            const data = await msg.json();
            this.settings = data;
        }
        return this.settings;
    }
}
export default ExmoAdapter;
