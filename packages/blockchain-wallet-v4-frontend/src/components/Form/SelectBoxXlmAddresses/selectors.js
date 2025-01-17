import { concat, curry, filter, has, map, reduce, sequence } from 'ramda'
import { createDeepEqualSelector } from 'services/ReselectHelper'
import { Exchange, Remote } from 'blockchain-wallet-v4/src'
import { selectors } from 'data'

export const getData = createDeepEqualSelector(
  [
    selectors.core.common.xlm.getAccountBalances,
    selectors.core.common.xlm.getLockboxXlmBalances,
    selectors.components.send.getPaymentsAccountPit('XLM'),
    (state, { includePitAddress }) => includePitAddress,
    (state, { exclude }) => exclude,
    (state, { excludeLockbox }) => excludeLockbox
  ],
  (
    walletBalances,
    lockboxBalances,
    pitAddress,
    includePitAddress,
    exclude = [],
    excludeLockbox
  ) => {
    const buildDisplay = wallet => {
      if (has('balance', wallet)) {
        let xlmDisplay = Exchange.displayXlmToXlm({
          value: wallet.balance,
          fromUnit: 'STROOP',
          toUnit: 'XLM'
        })
        return wallet.label + ` (${xlmDisplay})`
      }
      return wallet.label
    }
    const excluded = filter(x => !exclude.includes(x.label))
    const toDropdown = map(x => ({ label: buildDisplay(x), value: x }))
    const toGroup = curry((label, options) => [{ label, options }])
    const toPit = x => [{ label: `My PIT XLM Address`, value: x }]

    const hasPitAddress = Remote.Success.is(pitAddress)

    return sequence(Remote.of, [
      walletBalances
        .map(excluded)
        .map(toDropdown)
        .map(toGroup('Wallet')),
      excludeLockbox
        ? Remote.of([])
        : lockboxBalances
            .map(excluded)
            .map(toDropdown)
            .map(toGroup('Lockbox')),
      includePitAddress && hasPitAddress
        ? pitAddress.map(toPit).map(toGroup('The PIT'))
        : Remote.of([])
    ]).map(([b1, b2, b3]) => ({ data: reduce(concat, [], [b1, b2, b3]) }))
  }
)
