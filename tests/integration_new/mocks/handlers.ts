import { HttpResponse, http, passthrough } from 'msw'

const LIFI_QUOTES = {
  // 'mints wsteth-eth-25x using lifi: happy path' quote at block ~24219436
  [`fromChain=1&toChain=1&fromToken=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&toToken=0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0&toAddress=0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA&fromAmount=29077811172079415809&fromAddress=0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1&slippage=0.0002&integrator=${process.env['VITE_LIFI_INTEGRATOR']}&order=CHEAPEST&allowBridges=none&denyExchanges=sushiswap&skipSimulation=true`]:
    {
      type: 'lifi',
      id: '601e6173-b2f8-4888-80e0-daa81f730f49:0',
      tool: 'okx',
      toolDetails: {
        key: 'okx',
        name: 'OKX Dex Aggregator',
        logoURI:
          'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/okx.svg',
      },
      action: {
        fromToken: {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          chainId: 1,
          symbol: 'WETH',
          decimals: 18,
          name: 'WETH',
          coinKey: 'WETH',
          logoURI:
            'https://static.debank.com/image/eth_token/logo_url/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/61844453e63cf81301f845d7864236f6.png',
          priceUSD: '3104.44',
        },
        fromAmount: '29077811172079415809',
        toToken: {
          address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
          chainId: 1,
          symbol: 'wstETH',
          decimals: 18,
          name: 'wstETH',
          logoURI:
            'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
          priceUSD: '3802.03',
        },
        fromChainId: 1,
        toChainId: 1,
        slippage: 0.0002,
        fromAddress: '0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1',
        toAddress: '0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA',
      },
      estimate: {
        tool: 'okx',
        approvalAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        toAmountMin: '23746573644780292735',
        toAmount: '23751323909562205176',
        fromAmount: '29077811172079415809',
        feeCosts: [],
        gasCosts: [
          {
            type: 'SEND',
            price: '200390399',
            estimate: '666000',
            limit: '865800',
            amount: '133460005734000',
            amountUSD: '0.4144',
            token: {
              address: '0x0000000000000000000000000000000000000000',
              chainId: 1,
              symbol: 'ETH',
              decimals: 18,
              name: 'ETH',
              coinKey: 'ETH',
              logoURI:
                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
              priceUSD: '3104.7',
            },
          },
        ],
        executionDuration: 0,
        fromAmountUSD: '90270.3201',
        toAmountUSD: '90303.2460',
      },
      includedSteps: [
        {
          id: '18ec828e-9232-4501-8c6f-b6dc3c3af84a',
          type: 'swap',
          action: {
            fromChainId: 1,
            fromAmount: '29077811172079415809',
            fromToken: {
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
              chainId: 1,
              symbol: 'WETH',
              decimals: 18,
              name: 'WETH',
              coinKey: 'WETH',
              logoURI:
                'https://static.debank.com/image/eth_token/logo_url/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/61844453e63cf81301f845d7864236f6.png',
              priceUSD: '3104.44',
            },
            toChainId: 1,
            toToken: {
              address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
              chainId: 1,
              symbol: 'wstETH',
              decimals: 18,
              name: 'wstETH',
              logoURI:
                'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
              priceUSD: '3802.03',
            },
            slippage: 0.0002,
            fromAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
            toAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
          },
          estimate: {
            tool: 'okx',
            fromAmount: '29077811172079415809',
            toAmount: '23751323909562205176',
            toAmountMin: '23746573644780292735',
            approvalAddress: '0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f',
            executionDuration: 0,
            feeCosts: [],
            gasCosts: [
              {
                type: 'SEND',
                price: '200390399',
                estimate: '423000',
                limit: '549900',
                amount: '84765138777000',
                amountUSD: '0.2632',
                token: {
                  address: '0x0000000000000000000000000000000000000000',
                  chainId: 1,
                  symbol: 'ETH',
                  decimals: 18,
                  name: 'ETH',
                  coinKey: 'ETH',
                  logoURI:
                    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                  priceUSD: '3104.7',
                },
              },
            ],
          },
          tool: 'okx',
          toolDetails: {
            key: 'okx',
            name: 'OKX Dex Aggregator',
            logoURI:
              'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/okx.svg',
          },
        },
      ],
      transactionRequest: {
        value: '0x0',
        to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        data: '0x4666fc800c7a182bddeddc9bbe259345e49504c83b4e06c2adec7c3ee53aed5d477fa22000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000b0764de7eef0ac69855c431334b7bc51a96e6dba000000000000000000000000000000000000000000000001498cc6ea49c84a7f000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000087365616d6c657373000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a307830303030303030303030303030303030303030303030303030303030303030303030303030303030000000000000000000000000000000000000000000000000000000000000000000005e1f62dac767b0491e3ce72469c217365d5b48cc00000000000000000000000040aa958dd87fc8305b97f2ba922cddca374bcd7f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000000000000000000000000001938923333dadb20100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000005240c307f760000000000000000000000000000000000000000000000000000000000019e120000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000000000000000000000000001938923333dadb201000000000000000000000000000000000000000000000001498cc6ea49c84a7e0000000000000000000000000000000000000000000000000000000069651cf800000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000006747bcaf9bd5a5f0758cbe08903490e45ddfacb500000000000000000000000023007b443c46bb0fe46567be852d25f3a776917700000000000000000000000000000000000000000000000000000000000000020000000000000000000000006747bcaf9bd5a5f0758cbe08903490e45ddfacb500000000000000000000000023007b443c46bb0fe46567be852d25f3a7769177000000000000000000000000000000000000000000000000000000000000000280000000000000000001176f109830a1aaad605bbf02a9dfa7b0b92ec2fb7daa800000000000000000010fa180c37913149887310ff7f9c978856beae28f04e100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0777777771111800000000000000000000000000000000001499da7417eb283f8777777771111000000000064fa00a9ed787f3793db668bff3e6e6e7db0f92a1b00000000000000000000000000000000000000000000000000000000',
        chainId: 1,
        gasPrice: '0xbf1b6ff',
        gasLimit: '0xd3608',
        from: '0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1',
      },
      transactionId: '0x0c7a182bddeddc9bbe259345e49504c83b4e06c2adec7c3ee53aed5d477fa220',
    },
  // 'mints wsteth-eth-25x using lifi: slippage exceeded' quote at block ~24219436
  [`fromChain=1&toChain=1&fromToken=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&toToken=0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0&toAddress=0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA&fromAmount=29368589283800209967&fromAddress=0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1&slippage=0.0001&integrator=${process.env['VITE_LIFI_INTEGRATOR']}&order=CHEAPEST&allowBridges=none&denyExchanges=sushiswap&skipSimulation=true`]: 
    {
      type: 'lifi',
      id: '601e6173-b2f8-4888-80e0-daa81f730f49:0',
      tool: 'okx',
      toolDetails: {
        key: 'okx',
        name: 'OKX Dex Aggregator',
        logoURI:
          'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/okx.svg',
      },
      action: {
        fromToken: {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          chainId: 1,
          symbol: 'WETH',
          decimals: 18,
          name: 'WETH',
          coinKey: 'WETH',
          logoURI:
            'https://static.debank.com/image/eth_token/logo_url/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/61844453e63cf81301f845d7864236f6.png',
          priceUSD: '3104.44',
        },
        fromAmount: '29077811172079415809',
        toToken: {
          address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
          chainId: 1,
          symbol: 'wstETH',
          decimals: 18,
          name: 'wstETH',
          logoURI:
            'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
          priceUSD: '3802.03',
        },
        fromChainId: 1,
        toChainId: 1,
        slippage: 0.0002,
        fromAddress: '0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1',
        toAddress: '0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA',
      },
      estimate: {
        tool: 'okx',
        approvalAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        toAmountMin: '23746573644780292735',
        toAmount: '23751323909562205176',
        fromAmount: '29077811172079415809',
        feeCosts: [],
        gasCosts: [
          {
            type: 'SEND',
            price: '200390399',
            estimate: '666000',
            limit: '865800',
            amount: '133460005734000',
            amountUSD: '0.4144',
            token: {
              address: '0x0000000000000000000000000000000000000000',
              chainId: 1,
              symbol: 'ETH',
              decimals: 18,
              name: 'ETH',
              coinKey: 'ETH',
              logoURI:
                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
              priceUSD: '3104.7',
            },
          },
        ],
        executionDuration: 0,
        fromAmountUSD: '90270.3201',
        toAmountUSD: '90303.2460',
      },
      includedSteps: [
        {
          id: '18ec828e-9232-4501-8c6f-b6dc3c3af84a',
          type: 'swap',
          action: {
            fromChainId: 1,
            fromAmount: '29077811172079415809',
            fromToken: {
              address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
              chainId: 1,
              symbol: 'WETH',
              decimals: 18,
              name: 'WETH',
              coinKey: 'WETH',
              logoURI:
                'https://static.debank.com/image/eth_token/logo_url/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/61844453e63cf81301f845d7864236f6.png',
              priceUSD: '3104.44',
            },
            toChainId: 1,
            toToken: {
              address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
              chainId: 1,
              symbol: 'wstETH',
              decimals: 18,
              name: 'wstETH',
              logoURI:
                'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
              priceUSD: '3802.03',
            },
            slippage: 0.0002,
            fromAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
            toAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
          },
          estimate: {
            tool: 'okx',
            fromAmount: '29077811172079415809',
            toAmount: '23751323909562205176',
            toAmountMin: '23746573644780292735',
            approvalAddress: '0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f',
            executionDuration: 0,
            feeCosts: [],
            gasCosts: [
              {
                type: 'SEND',
                price: '200390399',
                estimate: '423000',
                limit: '549900',
                amount: '84765138777000',
                amountUSD: '0.2632',
                token: {
                  address: '0x0000000000000000000000000000000000000000',
                  chainId: 1,
                  symbol: 'ETH',
                  decimals: 18,
                  name: 'ETH',
                  coinKey: 'ETH',
                  logoURI:
                    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                  priceUSD: '3104.7',
                },
              },
            ],
          },
          tool: 'okx',
          toolDetails: {
            key: 'okx',
            name: 'OKX Dex Aggregator',
            logoURI:
              'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/okx.svg',
          },
        },
      ],
      transactionRequest: {
        value: '0x0',
        to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        data: '0x4666fc800c7a182bddeddc9bbe259345e49504c83b4e06c2adec7c3ee53aed5d477fa22000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000b0764de7eef0ac69855c431334b7bc51a96e6dba000000000000000000000000000000000000000000000001498cc6ea49c84a7f000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000087365616d6c657373000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a307830303030303030303030303030303030303030303030303030303030303030303030303030303030000000000000000000000000000000000000000000000000000000000000000000005e1f62dac767b0491e3ce72469c217365d5b48cc00000000000000000000000040aa958dd87fc8305b97f2ba922cddca374bcd7f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000000000000000000000000001938923333dadb20100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000005240c307f760000000000000000000000000000000000000000000000000000000000019e120000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000000000000000000000000001938923333dadb201000000000000000000000000000000000000000000000001498cc6ea49c84a7e0000000000000000000000000000000000000000000000000000000069651cf800000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000020000000000000000000000006747bcaf9bd5a5f0758cbe08903490e45ddfacb500000000000000000000000023007b443c46bb0fe46567be852d25f3a776917700000000000000000000000000000000000000000000000000000000000000020000000000000000000000006747bcaf9bd5a5f0758cbe08903490e45ddfacb500000000000000000000000023007b443c46bb0fe46567be852d25f3a7769177000000000000000000000000000000000000000000000000000000000000000280000000000000000001176f109830a1aaad605bbf02a9dfa7b0b92ec2fb7daa800000000000000000010fa180c37913149887310ff7f9c978856beae28f04e100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0777777771111800000000000000000000000000000000001499da7417eb283f8777777771111000000000064fa00a9ed787f3793db668bff3e6e6e7db0f92a1b00000000000000000000000000000000000000000000000000000000',
        chainId: 1,
        gasPrice: '0xbf1b6ff',
        gasLimit: '0xd3608',
        from: '0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1',
      },
      transactionId: '0x0c7a182bddeddc9bbe259345e49504c83b4e06c2adec7c3ee53aed5d477fa220',
    }
}

export const handlers = [
  // wsteth-eth-25x quote at block 24219436
  http.get(`https://partner-seashell.li.quest/v1/quote`, ({ request }) => {
    const url = new URL(request.url)
    const queryString = url.search.slice(1) // Slice to remove the ? from the query string

    const quote = LIFI_QUOTES[queryString]

    console.log('quote', quote)

    if (quote) {
      return HttpResponse.json(quote)
    }

    return HttpResponse.json({
      error: 'LiFi quote mock not found',
    })
  }),
  // Intercept all HTTP methods to localhost on any port. We passthrough to the actual request (i.e. the anvil fork).
  http.all(/^http:\/\/localhost(:\d+)?\//, () => {
    return passthrough()
  }),
]
