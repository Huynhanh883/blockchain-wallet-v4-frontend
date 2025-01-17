import * as A from './actions'
import * as C from 'services/AlertService'
import * as Lockbox from 'services/LockboxService'
import * as S from './selectors'
import { actions, model, selectors } from 'data'
import { ADDRESS_TYPES } from 'blockchain-wallet-v4/src/redux/payment/btc/utils'
import { call, delay, put, select } from 'redux-saga/effects'
import {
  change,
  destroy,
  initialize,
  startSubmit,
  stopSubmit
} from 'redux-form'
import { equals, identity, includes, is, nth, path, pathOr, prop } from 'ramda'
import { Exchange, utils } from 'blockchain-wallet-v4/src'
import { FORM } from './model'
import { promptForLockbox, promptForSecondPassword } from 'services/SagaService'

const { TRANSACTION_EVENTS } = model.analytics
export const logLocation = 'components/sendBch/sagas'
export default ({ coreSagas, networks }) => {
  const initialized = function * (action) {
    try {
      const { from } = action.payload
      yield put(A.sendBchPaymentUpdatedLoading())
      yield put(actions.components.send.fetchPaymentsAccountPit('BCH'))
      let payment = coreSagas.payment.bch.create({
        network: networks.bch
      })
      payment = yield payment.init()
      const accountsR = yield select(
        selectors.core.common.bch.getAccountsBalances
      )
      const defaultIndexR = yield select(
        selectors.core.kvStore.bch.getDefaultAccountIndex
      )
      const defaultIndex = defaultIndexR.getOrElse(0)
      const defaultAccountR = accountsR.map(nth(defaultIndex))
      if (from === 'allImportedAddresses') {
        const addressesR = yield select(
          selectors.core.common.bch.getActiveAddresses
        )
        const addresses = addressesR
          .getOrElse([])
          .filter(prop('priv'))
          .map(prop('addr'))
          .map(utils.bch.fromCashAddr)
        payment = yield payment.from(addresses, ADDRESS_TYPES.LEGACY)
      } else {
        payment = yield payment.from(defaultIndex, ADDRESS_TYPES.ACCOUNT)
      }
      payment = yield payment.fee('regular')
      const initialValues = {
        coin: 'BCH',
        from: from || defaultAccountR.getOrElse()
      }
      yield put(initialize(FORM, initialValues))
      yield put(A.sendBchPaymentUpdatedSuccess(payment.value()))
    } catch (e) {
      yield put(A.sendBchPaymentUpdatedFailure(e))
      yield put(
        actions.logs.logErrorMessage(logLocation, 'sendBchInitialized', e)
      )
    }
  }

  const destroyed = function * () {
    yield put(actions.form.destroy(FORM))
  }

  const firstStepSubmitClicked = function * () {
    try {
      let p = yield select(S.getPayment)
      yield put(A.sendBchPaymentUpdatedLoading())
      let payment = coreSagas.payment.bch.create({
        payment: p.getOrElse({}),
        network: networks.bch
      })
      payment = yield payment.build()
      yield put(A.sendBchPaymentUpdatedSuccess(payment.value()))
    } catch (e) {
      yield put(A.sendBchPaymentUpdatedFailure(e))
      yield put(
        actions.logs.logErrorMessage(logLocation, 'firstStepSubmitClicked', e)
      )
    }
  }

  const formChanged = function * (action) {
    try {
      const form = path(['meta', 'form'], action)
      if (!equals(FORM, form)) return
      const field = path(['meta', 'field'], action)
      const payload = prop('payload', action)
      const erc20List = (yield select(
        selectors.core.walletOptions.getErc20CoinList
      )).getOrElse([])
      let p = yield select(S.getPayment)
      let payment = coreSagas.payment.bch.create({
        payment: p.getOrElse({}),
        network: networks.bch
      })

      switch (field) {
        case 'coin':
          const modalName = includes(payload, erc20List) ? 'ETH' : payload
          yield put(actions.modals.closeAllModals())
          yield put(
            actions.modals.showModal(`@MODAL.SEND.${modalName}`, {
              coin: payload
            })
          )
          break
        case 'from':
          const fromType = prop('type', payload)
          if (is(String, payload)) {
            yield payment.from(payload, fromType)
            break
          }
          switch (fromType) {
            case ADDRESS_TYPES.ACCOUNT:
              payment = yield payment.from(payload.index, fromType)
              break
            case ADDRESS_TYPES.LOCKBOX:
              payment = yield payment.from(payload.xpub, fromType)
              break
            default:
              payment = yield payment.from(payload.address, fromType)
          }
          break
        case 'to':
          const value = pathOr({}, ['value', 'value'], payload)
          const toType = prop('type', value)
          switch (toType) {
            case ADDRESS_TYPES.ACCOUNT:
              payment = yield payment.to(value.index, toType)
              break
            case ADDRESS_TYPES.LOCKBOX:
              payment = yield payment.to(value.xpub, toType)
              break
            default:
              const address = prop('address', value) || value
              payment = yield payment.to(address, toType)
          }
          break
        case 'amount':
          const bchAmount = prop('coin', payload)
          const satAmount = Exchange.convertBchToBch({
            value: bchAmount,
            fromUnit: 'BCH',
            toUnit: 'SAT'
          }).value
          payment = yield payment.amount(parseInt(satAmount))
          break
        case 'description':
          payment = yield payment.description(payload)
          break
      }
      try {
        payment = yield payment.build()
      } catch (e) {}
      yield put(A.sendBchPaymentUpdatedSuccess(payment.value()))
    } catch (e) {
      yield put(actions.logs.logErrorMessage(logLocation, 'formChanged', e))
    }
  }

  const maximumAmountClicked = function * () {
    try {
      const appState = yield select(identity)
      const currency = selectors.core.settings
        .getCurrency(appState)
        .getOrFail('Can not retrieve currency.')
      const bchRates = selectors.core.data.bch
        .getRates(appState)
        .getOrFail('Can not retrieve bitcoin cash rates.')
      const p = yield select(S.getPayment)
      const payment = p.getOrElse({})
      const effectiveBalance = prop('effectiveBalance', payment)
      const coin = Exchange.convertBchToBch({
        value: effectiveBalance,
        fromUnit: 'SAT',
        toUnit: 'BCH'
      }).value
      const fiat = Exchange.convertBchToFiat({
        value: effectiveBalance,
        fromUnit: 'SAT',
        toCurrency: currency,
        rates: bchRates
      }).value
      yield put(change(FORM, 'amount', { coin, fiat }))
    } catch (e) {
      yield put(
        actions.logs.logErrorMessage(logLocation, 'maximumAmountClicked', e)
      )
    }
  }

  const secondStepSubmitClicked = function * () {
    yield put(startSubmit(FORM))
    let p = yield select(S.getPayment)
    let payment = coreSagas.payment.bch.create({
      payment: p.getOrElse({}),
      network: networks.bch
    })
    const fromType = path(['fromType'], payment.value())
    try {
      // Sign payment
      if (fromType !== ADDRESS_TYPES.LOCKBOX) {
        let password = yield call(promptForSecondPassword)
        payment = yield payment.sign(password)
      } else {
        const deviceR = yield select(
          selectors.core.kvStore.lockbox.getDeviceFromBchXpubs,
          prop('from', p.getOrElse({}))
        )
        const device = deviceR.getOrFail('missing_device')
        const deviceType = prop('device_type', device)
        const outputs = path(['selection', 'outputs'], payment.value())
          .filter(o => !o.change)
          .map(prop('address'))
        yield call(promptForLockbox, 'BCH', deviceType, outputs)
        let connection = yield select(
          selectors.components.lockbox.getCurrentConnection
        )
        const transport = prop('transport', connection)
        const scrambleKey = Lockbox.utils.getScrambleKey('BCH', deviceType)
        payment = yield payment.sign(null, transport, scrambleKey)
      }
      // Publish payment
      payment = yield payment.publish()
      yield put(actions.core.data.bch.fetchData())
      yield put(A.sendBchPaymentUpdatedSuccess(payment.value()))
      // Set tx note
      if (path(['description', 'length'], payment.value())) {
        yield put(
          actions.core.kvStore.bch.setTxNotesBch(
            payment.value().txId,
            payment.value().description
          )
        )
      }
      // Redirect to tx list, display success
      if (fromType === ADDRESS_TYPES.LOCKBOX) {
        yield put(actions.components.lockbox.setConnectionSuccess())
        yield delay(4000)
        const fromXPubs = path(['from'], payment.value())
        const device = (yield select(
          selectors.core.kvStore.lockbox.getDeviceFromBchXpubs,
          fromXPubs
        )).getOrFail('missing_device')
        const deviceIndex = prop('device_index', device)
        yield put(actions.router.push(`/lockbox/dashboard/${deviceIndex}`))
      } else {
        yield put(actions.router.push('/bch/transactions'))
        yield put(
          actions.alerts.displaySuccess(C.SEND_COIN_SUCCESS, {
            coinName: 'Bitcoin Cash'
          })
        )
      }
      yield put(
        actions.analytics.logEvent([
          ...TRANSACTION_EVENTS.SEND,
          'BCH',
          Exchange.convertCoinToCoin({
            value: payment.value().amount,
            coin: 'BCH',
            baseToStandard: true
          }).value
        ])
      )
      yield put(actions.modals.closeAllModals())
      yield put(destroy(FORM))
    } catch (e) {
      yield put(stopSubmit(FORM))
      // Set errors
      if (fromType === ADDRESS_TYPES.LOCKBOX) {
        yield put(actions.components.lockbox.setConnectionError(e))
      } else {
        yield put(
          actions.logs.logErrorMessage(
            logLocation,
            'secondStepSubmitClicked',
            e
          )
        )
        yield put(
          actions.analytics.logEvent([
            ...TRANSACTION_EVENTS.SEND_FAILURE,
            'BCH',
            e
          ])
        )
        yield put(
          actions.alerts.displayError(C.SEND_COIN_ERROR, {
            coinName: 'Bitcoin Cash'
          })
        )
      }
    }
  }

  return {
    initialized,
    destroyed,
    maximumAmountClicked,
    firstStepSubmitClicked,
    secondStepSubmitClicked,
    formChanged
  }
}
