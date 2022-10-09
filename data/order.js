// Mock sell order
//  Sell 0.0996 WETH for at least 5,106.952916 USDC
// ----------
//          The counter order would be:
//              Buy 0.0996 WETH for at most 5,114.613345374 USDC
//              , being 5,106.952916*(1+0.0015) = 5,114.613345374
// ----------

module.exports = {
  creationDate: '2021-09-16T20:32:17.741467Z',
  owner: '0x424a46612794dbb8000194937834250dc723ffa5',
  uid: '0x75131fd65cbb8575f63223dae6dd15798f7bef5a94bd7029cfb975c3de980327424a46612794dbb8000194937834250dc723ffa56143ae07',
  availableBalance: '33980166715787679584',
  executedBuyAmount: '0',
  executedSellAmount: '0',
  executedSellAmountBeforeFees: '0',
  executedFeeAmount: '0',
  invalidated: false,
  status: 'open',
  settlementContract: '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
  fullFeeAmount: '400000000200000',
  sellToken: '0xc778417e063141139fce010982780140aa0cd5ab', // WETH
  buyToken: '0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b', // USDC
  receiver: '0x424a46612794dbb8000194937834250dc723ffa5',
  sellAmount: '99599999999800000', // 0.0996 WETH
  buyAmount: '5106952916', // 5,106.952916 USDC
  validTo: 1631825415,
  appData: '0x487b02c558d729abaf3ecf17881a4181e5bc2446429a0995142297e897b6eb37',
  feeAmount: '400000000200000', // 0.0004000000002 WETH
  kind: 'sell',
  partiallyFillable: false,
  signingScheme: 'eip712',
  signature: '0x81dfeaa89afb9d74f5a8d0253f6cddf56ae1042b1c274d5ed0965f262afefde12bc54d50153bc04c8490b082cfaf43192eb57c0f395099279d0234995d79a4561c',
  sellTokenBalance: 'erc20',
  buyTokenBalance: 'erc20'
}
