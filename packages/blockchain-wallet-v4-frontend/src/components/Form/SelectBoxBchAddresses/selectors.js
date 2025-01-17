import { ADDRESS_TYPES } from 'blockchain-wallet-v4/src/redux/payment/btc/utils'
import {
  assoc,
  assocPath,
  compose,
  concat,
  curry,
  descend,
  filter,
  has,
  head,
  isNil,
  lensIndex,
  lensProp,
  lift,
  map,
  not,
  path,
  prepend,
  prop,
  reduce,
  sequence,
  set,
  sort
} from 'ramda'
import { collapse } from 'utils/helpers'
import { Exchange, Remote } from 'blockchain-wallet-v4/src'
import { selectors } from 'data'

const allWallets = {
  label: 'All',
  options: [
    {
      label: 'All Bitcoin Cash Wallets',
      value: 'all'
    }
  ]
}

const allImportedAddresses = {
  label: 'Imported Addresses',
  options: [
    {
      label: 'All Imported Bitcoin Cash Addresses',
      value: 'allImportedAddresses'
    }
  ]
}

export const getData = (state, ownProps) => {
  const {
    coin,
    exclude = [],
    excludeHDWallets,
    excludeImported,
    excludeLockbox,
    excludeWatchOnly,
    includeAll = true,
    includePitAddress
  } = ownProps
  const buildDisplay = wallet => {
    const label = collapse(wallet.label)
    if (has('balance', wallet)) {
      let bchDisplay = Exchange.displayBchToBch({
        value: wallet.balance,
        fromUnit: 'SAT',
        toUnit: 'BCH'
      })
      return label + ` (${bchDisplay})`
    }
    return label
  }

  const isActive = filter(x => !x.archived)
  const excluded = filter(x => !exclude.includes(x.label))
  const toDropdown = map(x => ({ label: buildDisplay(x), value: x }))
  const toGroup = curry((label, options) => [{ label, options }])
  const toPit = x => [{ label: `My PIT BCH Address`, value: x }]

  const pitAddress = selectors.components.send.getPaymentsAccountPit(
    'BCH',
    state
  )
  const hasPitAddress = Remote.Success.is(pitAddress)

  const formatAddress = addressData => {
    const formattedAddress = {}
    return compose(
      a =>
        isNil(prop('label', addressData))
          ? assoc('label', prop('addr', addressData), a)
          : assoc('label', prop('label', addressData), a),
      a => assocPath(['value', 'type'], ADDRESS_TYPES.LEGACY, a),
      a => assoc('balance', path(['info', 'final_balance'], addressData), a),
      a => assocPath(['value', 'coin'], coin, a),
      a => assocPath(['value', 'address'], prop('addr', addressData), a),
      a => assoc('value', prop('info', addressData), a)
    )(formattedAddress)
  }

  const formatImportedAddressesData = addressesData => {
    return map(formatAddress, addressesData)
  }

  const getAddressesData = () => {
    const importedAddresses = selectors.core.common.bch.getActiveAddresses(
      state
    )
    const filterRelevantAddresses = addrs =>
      excludeWatchOnly
        ? filter(addr => not(isNil(prop('priv', addr))), addrs)
        : addrs
    const relevantAddresses = lift(filterRelevantAddresses)(importedAddresses)

    return sequence(Remote.of, [
      selectors.core.common.bch
        .getAccountsBalances(state)
        .map(isActive)
        .map(excluded)
        .map(toDropdown)
        .map(toGroup('Wallet')),
      excludeImported
        ? Remote.of([])
        : lift(formatImportedAddressesData)(relevantAddresses)
            .map(toDropdown)
            .map(toGroup('Imported Addresses'))
            .map(x =>
              set(
                compose(
                  lensIndex(0),
                  lensProp('options')
                ),
                sort(
                  descend(path(['value', 'balance'])),
                  prop('options', head(x))
                ),
                x
              )
            ),
      excludeLockbox
        ? Remote.of([])
        : selectors.core.common.bch
            .getLockboxBchBalances(state)
            .map(excluded)
            .map(toDropdown)
            .map(toGroup('Lockbox')),
      includePitAddress && hasPitAddress
        ? pitAddress.map(toPit).map(toGroup('The PIT'))
        : Remote.of([])
    ]).map(([b1, b2, b3, b4]) => {
      const data = reduce(concat, [], [b1, b2, b3, b4])
      if (includeAll) {
        return { data: prepend(allWallets, data) }
      } else if (excludeHDWallets) {
        return { data: [allImportedAddresses] }
      } else {
        return { data }
      }
    })
  }

  return getAddressesData()
}
