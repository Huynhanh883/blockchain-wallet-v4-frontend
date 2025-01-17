import * as AT from './actionTypes'
import { takeLatest } from 'redux-saga/effects'
import sagas from './sagas'

export default ({ api, networks }) => {
  const kvStoreBchSagas = sagas({ api, networks })

  return function * coreKvStoreBchSaga () {
    yield takeLatest(AT.FETCH_METADATA_BCH, kvStoreBchSagas.fetchMetadataBch)
  }
}
